import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';

const COL = 'tournaments';

function toTournament(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    createdById: doc.created_by_id,
    tournamentName: doc.tournament_name,
    game: doc.game,
    format: doc.format,
    date: doc.date,
    time: doc.time,
    isPublic: doc.is_public !== false,
    entryFee: doc.entry_fee ?? null,
    prizePool: doc.prize_pool,
    maxParticipants: doc.max_participants,
    rules: doc.rules ?? null,
    registrationDeadline: doc.registration_deadline,
    allowTeamRegistration: doc.allow_team_registration === true,
    autoApprovePlayers: doc.auto_approve_players !== false,
    matches: doc.matches,
    roomSize: doc.room_size,
    map: doc.map,
    spectatorMode: doc.spectator_mode !== false,
    prizeFirst: doc.prize_first,
    prizeSecond: doc.prize_second,
    prizeThird: doc.prize_third,
    bannerUri: doc.banner_uri ?? null,
    roomId: doc.room_id ?? null,
    roomPassword: doc.room_password ?? null,
    matchNumber: doc.match_number ?? null,
    roomInstructions: doc.room_instructions ?? null,
    roomPublishedAt: doc.room_published_at ?? null,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

export async function insertTournament(userId, payload) {
  const now = new Date();
  const doc = {
    created_by_id: userId,
    tournament_name: payload.tournamentName,
    game: payload.game,
    format: payload.format,
    date: payload.date,
    time: payload.time,
    is_public: payload.isPublic ?? true,
    entry_fee: payload.entryFee ?? null,
    prize_pool: payload.prizePool,
    max_participants: payload.maxParticipants,
    rules: payload.rules ?? null,
    registration_deadline: payload.registrationDeadline,
    allow_team_registration: payload.allowTeamRegistration ?? false,
    auto_approve_players: payload.autoApprovePlayers ?? true,
    matches: payload.matches,
    room_size: payload.roomSize,
    map: payload.map,
    spectator_mode: payload.spectatorMode ?? true,
    prize_first: payload.prizeFirst,
    prize_second: payload.prizeSecond,
    prize_third: payload.prizeThird,
    banner_uri: payload.bannerUri ?? null,
    created_at: now,
    updated_at: now,
  };

  const result = await getDb().collection(COL).insertOne(doc);
  return toTournament({ _id: result.insertedId, ...doc });
}

export async function findTournamentById(id) {
  const doc = await getDb().collection(COL).findOne({ _id: new ObjectId(id) });
  return toTournament(doc);
}

export async function listTournaments() {
  const docs = await getDb()
    .collection(COL)
    .find({ is_public: { $ne: false } })
    .sort({ created_at: -1 })
    .toArray();

  return docs.map(toTournament);
}

export async function listTournamentsByCreator(userId) {
  const docs = await getDb()
    .collection(COL)
    .find({ created_by_id: userId })
    .sort({ created_at: -1 })
    .toArray();

  return docs.map(toTournament);
}

export async function updateTournamentRoom(id, userId, payload) {
  const update = {
    room_id: payload.roomId,
    room_password: payload.roomPassword,
    updated_at: new Date(),
  };

  if (payload.map) update.map = payload.map;
  if (payload.matchNumber != null) update.match_number = payload.matchNumber;
  if (payload.roomInstructions != null) update.room_instructions = payload.roomInstructions;
  if (payload.publish) update.room_published_at = new Date();

  const result = await getDb().collection(COL).findOneAndUpdate(
    { _id: new ObjectId(id), created_by_id: userId },
    { $set: update },
    { returnDocument: 'after' },
  );

  return toTournament(result);
}
