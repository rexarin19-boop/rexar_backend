import { z } from 'zod';

export const updateRoomBodySchema = z.object({
  roomId: z.string().trim().min(1, 'Room ID is required'),
  roomPassword: z.string().trim().min(1, 'Room password is required'),
  map: z.string().trim().min(1).optional(),
  matchNumber: z.number().int().min(1).optional(),
  roomInstructions: z.string().trim().max(2000).optional().nullable(),
  publish: z.boolean().default(false),
});
