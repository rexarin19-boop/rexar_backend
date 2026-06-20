# Deploy Rexar backend to Cloud Run from your PC (no GitHub browser login needed).
# One-time: install Google Cloud SDK + run: gcloud auth login
#
# Usage (PowerShell, from Rexar_BackEnd folder):
#   .\scripts\deploy-cloud-run.ps1
#
param(
  [string]$Project = 'rexar-ea718',
  [string]$Region = 'asia-south1',
  [string]$Service = 'rexar-api'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Leaf
Set-Location (Join-Path $PSScriptRoot '..')

function Find-Gcloud {
  $paths = @(
    "${env:ProgramFiles}\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
    "${env:ProgramFiles(x86)}\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
    "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
  )
  foreach ($p in $paths) {
    if (Test-Path $p) { return $p }
  }
  $cmd = Get-Command gcloud.cmd -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $cmd = Get-Command gcloud -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

function Invoke-Gcloud([string[]]$GcloudArgs, [switch]$QuietNotFound) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $output = & $gcloud @GcloudArgs 2>&1
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  if ($code -ne 0) {
    $text = ($output | Out-String)
    if ($QuietNotFound -and $text -match 'NOT_FOUND') {
      return $code
    }
    Write-Host $text -ForegroundColor Red
  }
  return $code
}

function Grant-CloudRunSecretAccess {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $projectNumber = (& $gcloud projects describe $Project --format='value(projectNumber)' 2>$null | Select-Object -Last 1)
  $ErrorActionPreference = $prev
  if (-not $projectNumber) { throw 'Could not read GCP project number' }

  $serviceAccount = "${projectNumber}-compute@developer.gserviceaccount.com"
  Write-Host "Granting Secret Accessor to Cloud Run: $serviceAccount"

  $bindCode = Invoke-Gcloud @(
    'projects', 'add-iam-policy-binding', $Project,
    "--member=serviceAccount:$serviceAccount",
    '--role=roles/secretmanager.secretAccessor',
    '--quiet'
  )
  if ($bindCode -ne 0) { throw 'Failed to grant Secret Manager access to Cloud Run service account' }
}

function Read-DotEnv([string]$Path) {
  $map = @{}
  if (-not (Test-Path $Path)) { return $map }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { return }
    $k = $line.Substring(0, $idx).Trim()
    $v = $line.Substring($idx + 1).Trim()
    $map[$k] = $v
  }
  return $map
}

function Find-FirebaseJson {
  $candidates = @(
    (Join-Path $PWD 'secrets\firebase-service-account.json'),
    (Join-Path $PWD 'secrets\firebase-service-account.json.json')
  )
  foreach ($p in $candidates) {
    if (Test-Path $p) { return $p }
  }
  return $null
}

function Ensure-Secret([string]$Gcloud, [string]$Name, [string]$Value) {
  if (-not $Value) { throw "Missing value for secret $Name" }
  $describeCode = Invoke-Gcloud @('secrets', 'describe', $Name, '--project', $Project) -QuietNotFound
  if ($describeCode -ne 0) {
    Write-Host "Creating secret: $Name"
    $createCode = Invoke-Gcloud @('secrets', 'create', $Name, '--project', $Project, '--replication-policy=automatic')
    if ($createCode -ne 0) { throw "Failed to create secret $Name" }
  }

  Write-Host "Updating secret: $Name"
  $tmp = [System.IO.Path]::GetTempFileName()
  try {
    [System.IO.File]::WriteAllText($tmp, $Value)
    $addCode = Invoke-Gcloud @('secrets', 'versions', 'add', $Name, '--project', $Project, "--data-file=$tmp")
    if ($addCode -ne 0) { throw "Failed to update secret $Name" }
  } finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

$gcloud = Find-Gcloud
if (-not $gcloud) {
  Write-Host @"

Google Cloud SDK (gcloud) not found.

Install once (PowerShell as Admin):
  winget install Google.CloudSDK

Then restart terminal and run:
  gcloud auth login
  gcloud config set project $Project

Re-run: .\scripts\deploy-cloud-run.ps1
"@
  exit 1
}

Write-Host "Using gcloud: $gcloud"
Write-Host "Project: $Project | Region: $Region | Service: $Service"

& $gcloud config set project $Project | Out-Null

Write-Host 'Enabling APIs (first time only)...'
& $gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com --project $Project | Out-Null

$envMap = Read-DotEnv (Join-Path $PWD '.env')
$dbUrl = $envMap['DATABASE_URL']
if (-not $dbUrl) {
  throw 'DATABASE_URL missing in .env — copy .env.example and fill MongoDB URL.'
}

$firebasePath = Find-FirebaseJson
if (-not $firebasePath) {
  throw 'Firebase JSON not found in secrets/ — download from Firebase Console.'
}
$firebase = Get-Content $firebasePath -Raw | ConvertFrom-Json
$projectId = $firebase.project_id
$clientEmail = $firebase.client_email
$privateKey = $firebase.private_key

Write-Host 'Updating secrets in Secret Manager...'
Ensure-Secret $gcloud 'DATABASE_URL' $dbUrl
Ensure-Secret $gcloud 'FIREBASE_PROJECT_ID' $projectId
Ensure-Secret $gcloud 'FIREBASE_CLIENT_EMAIL' $clientEmail
Ensure-Secret $gcloud 'FIREBASE_PRIVATE_KEY' $privateKey

$secretsArg = @(
  'DATABASE_URL=DATABASE_URL:latest',
  'FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest',
  'FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest',
  'FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest'
) -join ','

Grant-CloudRunSecretAccess

Write-Host 'Deploying to Cloud Run (builds from this folder, no GitHub connect)...'
& $gcloud run deploy $Service `
  --source . `
  --project $Project `
  --region $Region `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --quiet `
  --set-env-vars "NODE_ENV=production,AUTH_MODE=firebase,API_PREFIX=/api/v1,CORS_ORIGIN=*" `
  --set-secrets $secretsArg

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$url = & $gcloud run services describe $Service --project $Project --region $Region --format='value(status.url)'
Write-Host ""
Write-Host "Deployed: $url"
Write-Host "Health:   $url/health"
Write-Host ""
Write-Host "Mobile .env:"
Write-Host "REXAR_PROD_API_URL=$url"
