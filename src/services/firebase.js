/**
 * firebase.js — no Firebase SDK, no fetch(), uses expo-file-system.
 *
 * React Native's JS XHR polyfill throws "Cannot assign to read-only property NONE"
 * when any fetch() call triggers setReadyState. expo-file-system's downloadAsync
 * and uploadAsync use native NSURLSession (iOS) / HttpURLConnection (Android),
 * completely bypassing the broken JS XHR layer.
 *
 * Firestore rules: allow read, write: if true  (no auth token needed).
 */

import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

const { firebaseProjectId, firebaseStorageBucket } = Constants.expoConfig?.extra ?? {};
const PROJECT = firebaseProjectId;
const BUCKET  = firebaseStorageBucket;
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const FS_ROOT = `projects/${PROJECT}/databases/(default)/documents`;

// Kept for backward-compat with imports that reference these names.
export const auth    = null;
export const storage = null;
export const db      = null;

// ── Native HTTP helpers (bypass JS XHR polyfill) ──────────────────────────

const TMP = FileSystem.cacheDirectory;

async function httpGet(url) {
  const dest = TMP + `fsg${Date.now()}.json`;
  try {
    const res = await FileSystem.downloadAsync(url, dest);
    const text = await FileSystem.readAsStringAsync(dest);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${text.substring(0, 120)}`);
    return JSON.parse(text);
  } finally {
    FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => {});
  }
}

async function httpWrite(url, method, bodyObj) {
  const src = TMP + `fsw${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(src, JSON.stringify(bodyObj));
  try {
    const res = await FileSystem.uploadAsync(url, src, {
      httpMethod: method,
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`HTTP ${res.status}: ${res.body?.substring(0, 120)}`);
    }
    return res.body ? JSON.parse(res.body) : {};
  } finally {
    FileSystem.deleteAsync(src, { idempotent: true }).catch(() => {});
  }
}

function withTimeout(promise, ms = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms)
    ),
  ]);
}

// ── Firestore field conversion ────────────────────────────────────────────

export function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string')       fields[k] = { stringValue: v };
    else if (typeof v === 'number')  fields[k] = { doubleValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (Array.isArray(v)) {
      fields[k] = {
        arrayValue: {
          values: v.filter(x => x != null).map(i => ({ stringValue: String(i) })),
        },
      };
    }
  }
  return fields;
}

export function fromFields(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields || {})) {
    if ('stringValue'  in v) obj[k] = v.stringValue;
    else if ('doubleValue'  in v) obj[k] = v.doubleValue;
    else if ('integerValue' in v) obj[k] = parseInt(v.integerValue, 10);
    else if ('booleanValue' in v) obj[k] = v.booleanValue;
    else if ('arrayValue'   in v) {
      obj[k] = (v.arrayValue.values || [])
        .map(i => i.stringValue ?? i.doubleValue ?? i.integerValue ?? null)
        .filter(x => x != null);
    } else if ('mapValue' in v) {
      obj[k] = fromFields(v.mapValue.fields);
    }
  }
  return obj;
}

// ── Firestore REST ops ────────────────────────────────────────────────────

async function fsPatch(path, data) {
  return httpWrite(`${FS_BASE}/${path}`, 'PATCH', { fields: toFields(data) });
}

async function fsPost(path, data) {
  return httpWrite(`${FS_BASE}/${path}`, 'POST', { fields: toFields(data) });
}

async function fsListDocs(collection) {
  console.log('[Firestore] listing', collection);
  const data = await httpGet(`${FS_BASE}/${collection}?pageSize=100`);
  console.log('[Firestore] ok, docs:', data.documents?.length ?? 0);
  return data;
}

async function fsArrayUnion(collection, docId, fieldPath, value) {
  // Read current doc, merge the new value, then PATCH back.
  // Avoids the :commit RPC endpoint (colon gets URL-encoded by expo-file-system).
  let current = {};
  try {
    const doc = await httpGet(`${FS_BASE}/${collection}/${docId}`);
    current = fromFields(doc.fields || {});
  } catch (_) {}
  const existing = Array.isArray(current[fieldPath]) ? current[fieldPath] : [];
  const merged = [...new Set([...existing, value])];
  current[fieldPath] = merged;
  return fsPatch(`${collection}/${docId}`, current);
}

// ── Auth (no-op — rules are open) ─────────────────────────────────────────

export async function signInAnon() { return null; }
export function onAuthChange(callback) { return () => {}; }

// ── Team ─────────────────────────────────────────────────────────────────

export async function saveTeam(teamId, profile) {
  await withTimeout(fsPatch(`teams/${teamId}`, {
    ...profile,
    updatedAt: new Date().toISOString(),
  }));
}

export async function getTeam(teamId) {
  try {
    const doc = await httpGet(`${FS_BASE}/teams/${teamId}`);
    return fromFields(doc.fields);
  } catch { return null; }
}

// ── Activity Results ──────────────────────────────────────────────────────

export async function submitResult(teamId, activityId, result) {
  const safe = { teamId, activityId, createdAt: new Date().toISOString() };
  for (const [k, v] of Object.entries(result)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') safe[k] = v;
    else if (Array.isArray(v) && v.every(i => typeof i !== 'object')) safe[k] = v;
  }
  await withTimeout(fsPost('results', safe));
}

// ── Leaderboard ───────────────────────────────────────────────────────────

export async function getOverallLeaderboard(topN = 20) {
  console.log('[Leaderboard] fetching...');
  const data = await withTimeout(fsListDocs('teams'));
  const docs = data.documents || [];
  const teams = docs.map(d => ({
    id: d.name.split('/').pop(),
    ...fromFields(d.fields),
  }));
  teams.sort((a, b) =>
    (b.completedActivities?.length ?? 0) - (a.completedActivities?.length ?? 0)
  );
  return teams.slice(0, topN);
}

export async function markActivityComplete(teamId, activityId) {
  await withTimeout(fsArrayUnion('teams', teamId, 'completedActivities', activityId));
}

// ── Video Upload (Storage REST API, native upload) ────────────────────────

// Video upload requires Firebase Storage (Blaze plan).
// Storing video locally on-device only for now.
export async function uploadVideo(teamId, activityId, localUri) {
  return null;
}
