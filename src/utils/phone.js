/** Normalize Indian phone input to E.164 (+91XXXXXXXXXX). */
export function normalizePhone(input) {
  const raw = String(input ?? '').trim();
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (raw.startsWith('+')) return `+${digits}`;

  return `+${digits}`;
}

export function isEmail(value) {
  return String(value ?? '').includes('@');
}
