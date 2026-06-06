/**
 * LeaderboardScreen.js
 * Shows team activity completion status from Firestore.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../theme';
import { getOverallLeaderboard } from '../services/firebase';

const ACTIVITIES = [
  { id: 'parachute',        label: '1' },
  { id: 'sound',            label: '2' },
  { id: 'handfan',          label: '3' },
  { id: 'earthquake',       label: '4' },
  { id: 'humanperformance', label: '5' },
  { id: 'reactionboard',    label: '6' },
  { id: 'breathing',        label: '7' },
];

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getOverallLeaderboard(20);
      setEntries(data);
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  function onRefresh() { setRefreshing(true); load(); }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screen}>

        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>Activity completion across all teams</Text>
          {/* Activity number key */}
          <View style={styles.keyRow}>
            {ACTIVITIES.map((a) => (
              <View key={a.id} style={styles.keyBadge}>
                <Text style={styles.keyText}>{a.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No teams yet. Complete an activity to appear here!</Text>
          }
          renderItem={({ item, index }) => {
            const completed = item.completedActivities ?? [];
            const count = completed.length;
            return (
              <View style={[styles.row, Shadow.sm]}>
                <View style={styles.rankWrap}>
                  <Text style={styles.rank}>#{index + 1}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.teamName}>{item.teamName ?? 'Unknown Team'}</Text>
                  <Text style={styles.meta}>{item.grade ?? ''}{item.members?.length ? ` · ${item.members.join(', ')}` : ''}</Text>
                </View>
                <View style={styles.ticksCol}>
                  <View style={styles.tickRow}>
                    {ACTIVITIES.map((a) => (
                      <View
                        key={a.id}
                        style={[styles.tick, completed.includes(a.id) ? styles.tickDone : styles.tickEmpty]}
                      >
                        {completed.includes(a.id)
                          ? <Ionicons name="checkmark" size={11} color="#fff" />
                          : <Text style={styles.tickNum}>{a.label}</Text>
                        }
                      </View>
                    ))}
                  </View>
                  <Text style={styles.countText}>{count}/7 completed</Text>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  screen: { flex: 1, backgroundColor: '#F1F3FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F3FA' },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '900', color: '#fff' },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3, marginBottom: 12 },
  keyRow: { flexDirection: 'row', gap: 5 },
  keyBadge: {
    width: 24, height: 24, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  keyText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  list: { padding: Spacing.md, paddingBottom: 48 },
  row: {
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankWrap: { width: 32 },
  rank: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  info: { flex: 1 },
  teamName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  meta: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  ticksCol: { alignItems: 'flex-end' },
  tickRow: { flexDirection: 'row', gap: 4 },
  tick: {
    width: 20, height: 20, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  tickDone: { backgroundColor: '#22C55E' },
  tickEmpty: { backgroundColor: '#E5E7EB' },
  tickNum: { fontSize: 9, fontWeight: '700', color: '#9CA3AF' },
  countText: { fontSize: 10, color: '#6B7280', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 48, color: '#6B7280', fontSize: 14 },
});
