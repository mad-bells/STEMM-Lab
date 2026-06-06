/**
 * BreathingPaceScreen.js
 * Activity 7: Breathing Pace Trainer
 * Phone placed on chest. Accelerometer detects chest rise/fall.
 * Students record breathing at rest and after exercise.
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
import { breathsPerMinute } from '../../utils/calculations';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';

const STAGES = ['At Rest', 'After Exercise 1 (jog)', 'After Exercise 2 (star jumps)'];
const MEASURE_SECONDS = 30;

export default function BreathingPaceScreen() {
  const { z } = useAccelerometer(50); // z-axis detects chest rise/fall
  const [recording, setRecording] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [results, setResults] = useState([null, null, null]);
  const [countdown, setCountdown] = useState(MEASURE_SECONDS);
  const [saving, setSaving] = useState(false);
  const breathCountRef = useRef(0);
  const prevZRef = useRef(0);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  // Count breaths: detect upward z-axis peaks (threshold crossing)
  if (recording) {
    const delta = z - prevZRef.current;
    // Rising edge crossing threshold of 0.05g
    if (delta > 0.05 && prevZRef.current < 0) {
      breathCountRef.current += 1;
    }
    prevZRef.current = z;
  }

  function startRecording(index) {
    setCurrentStage(index);
    setRecording(true);
    breathCountRef.current = 0;
    prevZRef.current = 0;
    let seconds = MEASURE_SECONDS;
    setCountdown(seconds);

    timerRef.current = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
      if (seconds <= 0) {
        stopRecording(index);
      }
    }, 1000);
  }

  function stopRecording(index = currentStage) {
    clearInterval(timerRef.current);
    setRecording(false);
    const bpm = breathsPerMinute(breathCountRef.current, MEASURE_SECONDS);
    const updated = [...results];
    updated[index] = { bpm: Math.round(bpm), breathCount: breathCountRef.current };
    setResults(updated);
  }

  async function handleSave() {
    const valid = results.filter(Boolean);
    if (!valid.length) { Alert.alert('No data', 'Record at least one stage.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const maxBpm = Math.max(...valid.map((r) => r.bpm));
      const score = Math.min(100, Math.round(maxBpm * 2));

      const data = { stages: STAGES, results };

      saveResultLocal(teamId, 'breathing', data, score, loc?.latitude, loc?.longitude);
      await submitResult(teamId, 'breathing', { ...data, score });
      await markActivityComplete(teamId, 'breathing');
      await sendNotification('Activity Complete! 💨', `Breathing data saved. Score: ${score} pts`);

      Alert.alert('Saved!', `Max BPM: ${maxBpm} · Score: ${score} pts`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Lie down and place the phone flat on your chest. The app counts your breaths for 30 seconds.
      </Text>

      {recording ? (
        <View style={[styles.liveCard, Shadow.md]}>
          <Text style={styles.liveTitle}>{STAGES[currentStage]}</Text>
          <Text style={styles.countdown}>{countdown}</Text>
          <Text style={styles.countdownLabel}>seconds remaining</Text>
          <Text style={styles.breathCount}>Breaths detected: {breathCountRef.current}</Text>
          <PrimaryButton title="⏹ Stop Early" onPress={() => stopRecording(currentStage)} color={Colors.error} style={{ marginTop: Spacing.md }} />
        </View>
      ) : (
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Record Stages</Text>
          {STAGES.map((stage, i) => (
            <View key={i} style={styles.stageRow}>
              <View style={styles.stageInfo}>
                <Text style={styles.stageLabel}>{stage}</Text>
                {results[i] && (
                  <Text style={{ color: Colors.info, ...Typography.bodySmall }}>
                    {results[i].bpm} breaths/min ({results[i].breathCount} counted)
                  </Text>
                )}
              </View>
              <PrimaryButton
                title={results[i] ? '↺ Redo' : '▶ Start'}
                onPress={() => startRecording(i)}
                color={results[i] ? Colors.accent : Colors.primary}
                style={styles.smallBtn}
              />
            </View>
          ))}
        </View>
      )}

      {results.some(Boolean) && !recording && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>📊 Results</Text>
          {results.map((r, i) => r && (
            <MetricCard key={i} label={STAGES[i]} value={String(r.bpm)} unit="breaths/min" color={Colors.info} />
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
  liveTitle: { ...Typography.h4, color: Colors.primary, marginBottom: Spacing.sm },
  countdown: { fontSize: 80, fontWeight: '900', color: Colors.info },
  countdownLabel: { ...Typography.body, color: Colors.textSecondary },
  breathCount: { ...Typography.h4, marginTop: Spacing.sm, color: Colors.success },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  stageRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  stageInfo: { flex: 1 },
  stageLabel: { ...Typography.body },
  smallBtn: { paddingHorizontal: Spacing.sm, minWidth: 72 },
  resultsSection: { marginTop: Spacing.sm },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.sm },
});
