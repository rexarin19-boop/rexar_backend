import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),
    API_PREFIX: z.string().default('/api/v1'),
    CORS_ORIGIN: z.string().default('*'),

    /** firebase = use Firebase idToken on every API call (no JWT setup). jwt = issue own tokens. */
    AUTH_MODE: z.enum(['firebase', 'jwt']).default('firebase'),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),

    JWT_ACCESS_SECRET: z.string().optional(),
    JWT_REFRESH_SECRET: z.string().optional(),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  })
  .superRefine((data, ctx) => {
    const hasFirebaseFile = Boolean(data.FIREBASE_SERVICE_ACCOUNT_PATH?.trim());
    const hasFirebaseVars =
      Boolean(data.FIREBASE_PROJECT_ID?.trim()) &&
      Boolean(data.FIREBASE_CLIENT_EMAIL?.trim()) &&
      Boolean(data.FIREBASE_PRIVATE_KEY?.trim());

    if (!hasFirebaseFile && !hasFirebaseVars) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY',
        path: ['FIREBASE_SERVICE_ACCOUNT_PATH'],
      });
    }

    if (data.AUTH_MODE === 'jwt') {
      if (!data.JWT_ACCESS_SECRET || data.JWT_ACCESS_SECRET.length < 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_ACCESS_SECRET required (min 16 chars) when AUTH_MODE=jwt',
          path: ['JWT_ACCESS_SECRET'],
        });
      }
      if (!data.JWT_REFRESH_SECRET || data.JWT_REFRESH_SECRET.length < 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_REFRESH_SECRET required (min 16 chars) when AUTH_MODE=jwt',
          path: ['JWT_REFRESH_SECRET'],
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const useJwtAuth = env.AUTH_MODE === 'jwt';
export const useFirebaseAuth = env.AUTH_MODE === 'firebase';
