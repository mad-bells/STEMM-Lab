/**
 * firebase.js
 * Initialises Firebase and exports Auth + Firestore helpers.
 * Credentials come from .env — never hard-code them here.
 *
 * Three Firebase technologies used:
 *  1. Firebase Authentication — anonymous sign-in per team session.
 *  2. Cloud Firestore — stores team profiles, activity results, leaderboard.
 *  3. Firebase Test Lab — automated UI testing on real devices (via CI/CD).
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
// ── Initialise (guard against double-init in hot-reload) ─────────────────
const firebaseConfig = {
  apiKey: "AIzaSyB8a0L0QXNvqkYmnSyAoozqxDO11tD6PfQ",
  authDomain: "stemm-lab-5c5fa.firebaseapp.com",
  projectId: "stemm-lab-5c5fa",
  storageBucket: "stemm-lab-5c5fa.firebasestorage.app",
  messagingSenderId: "615086509761",
  appId: "1:615086509761:web:a1ddb0f90a376559b88e40",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

// ── Authentication ────────────────────────────────────────────────────────

/** Sign in anonymously so we can write to Firestore without user accounts. */
export async function signInAnon() {
  try {
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (err) {
    console.error('Firebase sign-in error:', err);
    throw err;
  }
}

/** Subscribe to auth state changes. Returns unsubscribe function. */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Team ─────────────────────────────────────────────────────────────────

/**
 * Save or update a team profile.
 * @param {string} teamId  - Unique discriminator assigned by the app
 * @param {object} profile - { teamName, members, grade }
 */
export async function saveTeam(teamId, profile) {
  await setDoc(doc(db, 'teams', teamId), {
    ...profile,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getTeam(teamId) {
  const snap = await getDoc(doc(db, 'teams', teamId));
  return snap.exists() ? snap.data() : null;
}

// ── Activity Results ──────────────────────────────────────────────────────

/**
 * Submit a result for an activity.
 * @param {string} teamId
 * @param {string} activityId  - e.g. 'parachute', 'sound', etc.
 * @param {object} result      - Activity-specific measurement data
 */
export async function submitResult(teamId, activityId, result) {
  await addDoc(collection(db, 'results'), {
    teamId,
    activityId,
    ...result,
    createdAt: serverTimestamp(),
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────────

/**
 * Fetch the top N teams for a given activity sorted by score descending.
 */
export async function getLeaderboard(activityId, topN = 10) {
  const q = query(
    collection(db, 'results'),
    orderBy('score', 'desc'),
    limit(topN)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Fetch all teams sorted by number of completed activities. */
export async function getOverallLeaderboard(topN = 20) {
  const snap = await getDocs(collection(db, 'teams'));
  const teams = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  teams.sort((a, b) =>
    (b.completedActivities?.length ?? 0) - (a.completedActivities?.length ?? 0)
  );
  return teams.slice(0, topN);
}

/** Mark an activity as completed for a team. Uses arrayUnion so duplicates are ignored. */
export async function markActivityComplete(teamId, activityId) {
  const ref = doc(db, 'teams', teamId);
  await setDoc(ref, { completedActivities: arrayUnion(activityId) }, { merge: true });
}
