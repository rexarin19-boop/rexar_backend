import { z } from 'zod';

export const verifyBodySchema = z.object({
  idToken: z.string().min(10, 'idToken is required'),
});

export const signInBodySchema = z.object({
  identifier: z.string().min(3, 'Phone or email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerBodySchema = z.object({
  idToken: z.string().min(10, 'idToken is required'),
  displayName: z.string().min(2, 'displayName must be at least 2 characters').max(50),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  avatarUrl: z.string().url().optional().nullable(),
  role: z.enum(['PLAYER', 'ORGANIZER']).optional(),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(10, 'refreshToken is required'),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().optional(),
});

export const createMeBodySchema = z.object({
  idToken: z.string().min(10).optional(),
  displayName: z.string().min(2, 'displayName must be at least 2 characters').max(50),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  avatarUrl: z.string().url().optional().nullable(),
  role: z.enum(['PLAYER', 'ORGANIZER']).optional(),
});
