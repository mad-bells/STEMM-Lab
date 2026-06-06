/**
 * syncTeam.js
 * Re-syncs the team profile to Firestore on every activity save.
 * This ensures the leaderboard always shows the team name even if
 * the initial saveTeam call on startup timed out.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveTeam } from '../services/firebase';

export async function syncTeamToFirestore() {
  const [teamId, profileJson] = await Promise.all([
    AsyncStorage.getItem('teamId'),
    AsyncStorage.getItem('teamProfile'),
  ]);
  if (!teamId || !profileJson) return;
  const profile = JSON.parse(profileJson);
  await saveTeam(teamId, profile);
}
