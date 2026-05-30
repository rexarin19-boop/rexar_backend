import { z } from 'zod';

export const verifyBodySchema = z.object({
  idToken: z.string().min(10, 'idToken is required'),
});

export const registerBodySchema = z.object({
  idToken: z.string().min(10, 'idToken is required'),
  displayName: z.string().min(2, 'displayName must be at least 2 characters').max(50),
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
  avatarUrl: z.string().url().optional().nullable(),
  role: z.enum(['PLAYER', 'ORGANIZER']).optional(),
});
