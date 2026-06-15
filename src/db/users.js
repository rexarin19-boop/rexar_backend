import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { isEmail, normalizePhone } from '../utils/phone.js';

const COL = 'users';

function toUser(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    firebaseUid: doc.firebase_uid,
    phone: doc.phone,
    email: doc.email ?? null,
    displayName: doc.display_name ?? null,
    avatarUrl: doc.avatar_url ?? null,
    role: doc.role ?? 'PLAYER',
    isActive: doc.is_active !== false,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

export async function findUserByFirebase({ firebaseUid, phone, email }) {
  const or = [{ firebase_uid: firebaseUid }];
  if (phone) or.push({ phone });
  if (email) or.push({ email: email.toLowerCase() });

  const doc = await getDb().collection(COL).findOne({ $or: or });
  return toUser(doc);
}

export async function findUserByEmail(email) {
  const doc = await getDb().collection(COL).findOne({ email: email.toLowerCase() });
  return toUser(doc);
}

export async function findUserByPhone(phone) {
  const doc = await getDb().collection(COL).findOne({ phone });
  return toUser(doc);
}

/** Login lookup — includes password hash for verification (never send to client). */
export async function findUserByIdentifier(identifier) {
  const value = String(identifier ?? '').trim().toLowerCase();
  const query = isEmail(value) ? { email: value } : { phone: normalizePhone(value) };
  const doc = await getDb().collection(COL).findOne(query);
  if (!doc) return null;
  return { ...toUser(doc), passwordHash: doc.password_hash ?? null };
}

export async function findUserById(id) {
  const doc = await getDb().collection(COL).findOne({ _id: new ObjectId(id) });
  return toUser(doc);
}

export async function findExistingUser({ firebaseUid, phone, email }) {
  const doc = await getDb().collection(COL).findOne({
    $or: [{ firebase_uid: firebaseUid }, { phone }, { email }],
  });
  if (!doc) return null;
  return { ...toUser(doc), passwordHash: doc.password_hash ?? null };
}

export async function createUser({ firebaseUid, phone, email, displayName, avatarUrl, role, passwordHash }) {
  const now = new Date();
  const doc = {
    firebase_uid: firebaseUid,
    phone,
    email,
    display_name: displayName,
    avatar_url: avatarUrl ?? null,
    role: role ?? 'PLAYER',
    password_hash: passwordHash,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const result = await getDb().collection(COL).insertOne(doc);
  return toUser({ _id: result.insertedId, ...doc });
}

export async function updateUser(id, fields) {
  const set = { updated_at: new Date() };

  if (fields.firebaseUid) set.firebase_uid = fields.firebaseUid;
  if (fields.phone) set.phone = fields.phone;
  if (fields.email) set.email = fields.email;
  if (fields.displayName) set.display_name = fields.displayName;
  if (fields.avatarUrl !== undefined) set.avatar_url = fields.avatarUrl;
  if (fields.role) set.role = fields.role;
  if (fields.passwordHash) set.password_hash = fields.passwordHash;

  await getDb().collection(COL).updateOne({ _id: new ObjectId(id) }, { $set: set });
  return findUserById(id);
}
