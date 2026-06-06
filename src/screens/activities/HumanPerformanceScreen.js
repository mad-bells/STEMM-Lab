/**
 * HumanPerformanceScreen.js
 * Activity 5: Human Performance Lab – Stretch Speed & Gracefulness
 * Phone held in hand during 3 movements. Accelerometer measures smoothness.
 *
 * Device features used: Accelerometer, GPS
 */

import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';
import MetricCard from '../../components/MetricCard';
import PrimaryButton from '../../components/PrimaryButton';
import useAccelerometer from '../../hooks/useAccelerometer';
import useTimer from '../../hooks/useTimer';
import { scoreFromMagnitude } from '../../utils/calculations';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';

const MOVEMENTS = ['Movement 1 — Slow stretch', 'Movement 2 — Fast reach', 'Movement 3 — Rotation'];

export default function HumanPerformanceScreen() {
  const { magnitude } = useAccelerometer(100);
  const timer = useTimer();
  const [recording, setRecording] = useState(false);
  const [currentMove, setCurrentMove] = useState(0);
  const [attempts, setAttempts] = useState([null, null, null]);
  const sumRef = useRef(0);
  const countRef = useRef(0);
  const [saving, setSaving] = useState(false);

  // Accumulate average magnitude while recording
  if (recording) {
    sumRef.current += magnitude;
    countRef.current += 1;
  }

  function startMove(index) {
    setCurrentMove(index);
    sumRef.current = 0;
    countRef.current = 0;
    timer.reset();
    timer.start();
    setRecording(true);
  }

  function stopMove() {
    timer.stop();
    setRecording(false);
    const avgMag = countRef.current > 0 ? sumRef.current / countRef.current : 0;
    const updated = [...attempts];
    updated[currentMove] = { avgMag: avgMag.toFixed(3), time: timer.seconds.toFixed(2) };
    setAttempts(updated);
  }

  async function handleSave() {
    const valid = attempts.filter(Boolean);
    if (!valid.length) { Alert.alert('No data', 'Record at least one movement.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const bestMag = Math.min(...valid.map((a) => parseFloat(a.avgMag)));
      const score = scoreFromMagnitude(bestMag, 0.9, 3);

      const data = { movements: MOVEMENTS, attempts };

      saveResultLocal(teamId, 'humanperf', data, score, loc?.latitude, loc?.longitude);
      await submitResult(teamId, 'humanperf', { ...data, score });
      await markActivityComplete(teamId, 'humanperformance');
      await sendNotification('Activity Complete! 🏃', `Performance recorded. Score: ${score} pts`);

      Alert.alert('Saved!', `Score: ${score} pts`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Hold the phone firmly. Perform each movement and press Stop. Lower vibration = smoother movement.
      </Text>

      {recording ? (
        <View style={[styles.liveCard, Shadow.md]}>
          <Text style={styles.liveTitle}>{MOVEMENTS[currentMove]}</Text>
          <Text style={styles.liveTimer}>{timer.display}</Text>
          <Text style={styles.liveMag}>Vibration: {(magnitude - 1).toFixed(3)} m/s²</Text>
          <PrimaryButton title="⏹ Stop" onPress={stopMove} color={Colors.error} style={{ marginTop: Spacing.md }} />
        </View>
      ) : (
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Movements</Text>
          {MOVEMENTS.map((move, i) => (
            <View key={i} style={styles.moveRow}>
              <View style={styles.moveInfo}>
                <Text style={styles.moveLabel}>{move}</Text>
                {attempts[i] && (
                  <Text style={{ color: Colors.success, ...Typography.bodySmall }}>
                    Avg: {attempts[i].avgMag} m/s² in {attempts[i].time}s
                  </Text>
                )}
              </View>
              <PrimaryButton
                title={attempts[i] ? '↺ Redo' : '▶ Go'}
                onPress={() => startMove(i)}
                color={attempts[i] ? Colors.accent : Colors.primary}
                style={styles.smallBtn}
              />
            </View>
          ))}
        </View>
      )}

      {attempts.some(Boolean) && !recording && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>📊 Results</Text>
          {attempts.map((a, i) => a && (
            <MetricCard key={i} label={MOVEMENTS[i]} value={a.avgMag} unit="m/s²" color={Colors.health} />
          ))}
          <PrimaryButton title="💾 Save Result" onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, paddingBottom: 48 },
  intro: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.md },
  liveCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md,
  },
  liveTitle: { ...Typography.h4, color: Colors.primary, marginBottom: Spacing.sm, textAlign: 'center' },
  liveTimer: { fontSize: 48, fontWeight: '900', color: Colors.health },
  liveMag: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  moveRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  moveInfo: { flex: 1 },
  moveLabel: { ...Typography.body },
  smallBtn: { paddingHorizontal: Spacing.sm, minWidth: 72 },
  resultsSection: { marginTop: Spacing.sm },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.sm },
});
