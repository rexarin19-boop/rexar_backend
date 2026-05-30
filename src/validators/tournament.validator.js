import { z } from 'zod';

const datePattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
const timePattern = /^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i;

export const createTournamentBodySchema = z.object({
  tournamentName: z.string().trim().min(3, 'Tournament name must be at least 3 characters'),
  game: z.string().trim().min(1, 'Game is required'),
  format: z.string().trim().min(1, 'Format is required'),
  date: z.string().regex(datePattern, 'Date must be in mm/dd/yyyy format'),
  time: z.string().trim().regex(timePattern, 'Time must be like 02:30 PM'),
  isPublic: z.boolean().default(true),
  entryFee: z.number().min(0).optional().nullable(),
  prizePool: z.number().min(0, 'Prize pool must be 0 or higher'),
  maxParticipants: z.number().int().min(2, 'Max participants must be at least 2'),
  rules: z.string().trim().max(2000).optional().nullable(),
  registrationDeadline: z
    .string()
    .regex(datePattern, 'Registration deadline must be in mm/dd/yyyy format'),
  allowTeamRegistration: z.boolean().default(false),
  autoApprovePlayers: z.boolean().default(true),
  matches: z.number().int().min(1, 'Matches must be at least 1'),
  roomSize: z.number().int().min(2, 'Room size must be at least 2'),
  map: z.string().trim().min(1, 'Map is required'),
  spectatorMode: z.boolean().default(true),
  prizeFirst: z.number().min(0),
  prizeSecond: z.number().min(0),
  prizeThird: z.number().min(0),
  bannerUri: z.string().url().optional().nullable(),
});
