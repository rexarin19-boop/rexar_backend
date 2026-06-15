import { getDb } from '../config/db.js';
import * as usersDb from './users.js';

const COL = 'tournament_joins';

export async function insertJoin(tournamentId, userId) {
  const now = new Date();
  try {
    await getDb().collection(COL).insertOne({
      tournament_id: tournamentId,
      user_id: userId,
      joined_at: now,
      status: 'confirmed',
    });
    return { created: true };
  } catch (err) {
    if (err?.code === 11000) {
      return { created: false, alreadyJoined: true };
    }
    throw err;
  }
}

export async function hasJoined(tournamentId, userId) {
  if (!userId) return false;
  const doc = await getDb().collection(COL).findOne({
    tournament_id: tournamentId,
    user_id: userId,
  });
  return Boolean(doc);
}

export async function countJoins(tournamentId) {
  return getDb().collection(COL).countDocuments({ tournament_id: tournamentId });
}

export async function countJoinsByTournamentIds(ids) {
  if (!ids.length) return {};
  const docs = await getDb()
    .collection(COL)
    .aggregate([
      { $match: { tournament_id: { $in: ids } } },
      { $group: { _id: '$tournament_id', count: { $sum: 1 } } },
    ])
    .toArray();

  return Object.fromEntries(docs.map((d) => [d._id, d.count]));
}

export async function listParticipants(tournamentId) {
  const docs = await getDb()
    .collection(COL)
    .find({ tournament_id: tournamentId })
    .sort({ joined_at: -1 })
    .toArray();

  const participants = [];
  for (const doc of docs) {
    const user = await usersDb.findUserById(doc.user_id);
    participants.push({
      userId: doc.user_id,
      displayName: user?.displayName ?? user?.phone ?? 'Player',
      joinedAt: doc.joined_at,
    });
  }
  return participants;
}
