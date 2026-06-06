/**
 * ReactionBoardScreen.js
 * Activity 6: Reaction Board Challenge
 * Phase 1: Tap hidden button as fast as possible.
 * Phase 2: Repeat with non-dominant hand.
 *
 * Device features used: Touch timing, GPS
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';
import MetricCard from '../../components/MetricCard';
import PrimaryButton from '../../components/PrimaryButton';
import { average, stdDev, scoreFromTime } from '../../utils/calculations';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';

const PHASES = ['Dominant Hand', 'Non-Dominant Hand'];
const ATTEMPTS = 3;

export default function ReactionBoardScreen() {
  const [phase, setPhase] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState([[], []]); // [phase0 times, phase1 times]
  const [saving, setSaving] = useState(false);
  const showTimeRef = useRef(null);
  const delayRef = useRef(null);

  function startWait() {
    setWaiting(true);
    setButtonVisible(false);
    // Random delay 1–4 seconds
    const delay = 1000 + Math.random() * 3000;
    delayRef.current = setTimeout(() => {
      showTimeRef.current = Date.now();
      setButtonVisible(true);
      setWaiting(false);
    }, delay);
  }

  function handleTap() {
    if (!buttonVisible) return;
    const reactionMs = Date.now() - showTimeRef.current;
    const reactionS = reactionMs / 1000;

    const updated = results.map((arr) => [...arr]);
    updated[phase] = [...updated[phase], reactionS];
    setResults(updated);
    setButtonVisible(false);

    const nextAttempt = attempt + 1;
    if (nextAttempt < ATTEMPTS) {
      setAttempt(nextAttempt);
    } else {
      // Phase complete
      setAttempt(0);
      if (phase < PHASES.length - 1) {
        Alert.alert(
          `Phase ${phase + 1} complete!`,
          `Average: ${(average(updated[phase]) * 1000).toFixed(0)}ms\nSwap to ${PHASES[phase + 1]} and continue.`,
          [{ text: 'Next Phase', onPress: () => setPhase(phase + 1) }]
        );
      }
    }
  }

  async function handleSave() {
    const flat = results.flat();
    if (!flat.length) { Alert.alert('No data', 'Complete at least one attempt.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const avgTime = average(flat);
      const score = scoreFromTime(avgTime, 0.1, 1.5);

      const data = {
        phases: PHASES,
        times: results,
        averages: results.map((arr) => arr.length ? average(arr) : null),
        stdDevs: results.map((arr) => arr.length > 1 ? stdDev(arr) : null),
      };

      saveResultLocal(teamId, 'reaction', data, score, loc?.latitude, loc?.longitude);
      await submitResult(teamId, 'reaction', { ...data, score });
      await markActivityComplete(teamId, 'reactionboard');
      await sendNotification('Activity Complete! ⚡', `Reaction time saved. Score: ${score} pts`);

      Alert.alert('Saved!', `Avg: ${(avgTime * 1000).toFixed(0)}ms · Score: ${score} pts`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  const allDone = results[PHASES.length - 1].length === ATTEMPTS;
  const currentPhaseResults = results[phase];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Tap the button the instant it appears. Test both hands across {ATTEMPTS} attempts each.
      </Text>

      {/* Phase indicator */}
      <View style={styles.phaseRow}>
        {PHASES.map((p, i) => (
          <View key={i} style={[styles.phaseChip, phase === i && styles.phaseChipActive]}>
            <Text style={[styles.phaseChipText, phase === i && styles.phaseChipTextActive]}>
              {p}
            </Text>
          </View>
        ))}
      </View>

      {/* Reaction area */}
      {!allDone && (
        <View style={[styles.reactionCard, Shadow.md]}>
          <Text style={styles.phaseLabel}>{PHASES[phase]} — Attempt {attempt + 1}/{ATTEMPTS}</Text>

          {!waiting && !buttonVisible && (
            <PrimaryButton title="▶ Start" onPress={startWait} style={{ marginTop: Spacing.md }} />
          )}

          {waiting && (
            <View style={styles.waitBox}>
              <Text style={styles.waitText}>Get ready…</Text>
              <Text style={styles.waitSub}>Tap when the button appears!</Text>
            </View>
          )}

          {buttonVisible && (
            <TouchableOpacity style={styles.tapButton} onPress={handleTap} activeOpacity={0.7}>
              <Text style={styles.tapButtonText}>TAP!</Text>
            </TouchableOpacity>
          )}

          {currentPhaseResults.length > 0 && (
            <View style={styles.attemptsList}>
              {currentPhaseResults.map((t, i) => (
                <Text key={i} style={styles.attemptText}>
                  Attempt {i + 1}: {(t * 1000).toFixed(0)}ms
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Summary */}
      {results.some((arr) => arr.length > 0) && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>📊 Results</Text>
          {PHASES.map((p, i) =>
            results[i].length > 0 ? (
              <View key={i}>
                <MetricCard
                  label={p + ' — Avg'}
                  value={(average(results[i]) * 1000).toFixed(0)}
                  unit="ms"
                  color={Colors.secondary}
                />
                {results[i].length > 1 && (
                  <MetricCard
                    label={p + ' — Std Dev'}
                    value={(stdDev(results[i]) * 1000).toFixed(0)}
                    unit="ms"
                    color={Colors.textSecondary}
                  />
                )}
              </View>
            ) : null
          )}
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
  phaseRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  phaseChip: {
    flex: 1, padding: Spacing.sm, borderRadius: Radius.md,
    backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  phaseChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  phaseChipText: { ...Typography.label, color: Colors.textSecondary },
  phaseChipTextActive: { color: Colors.white, fontWeight: '700' },
  reactionCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md, minHeight: 220,
  },
  phaseLabel: { ...Typography.h4 },
  waitBox: { alignItems: 'center', marginTop: Spacing.xl },
  waitText: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  waitSub: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  tapButton: {
    marginTop: Spacing.lg, width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.error, justifyContent: 'center', alignItems: 'center',
  },
  tapButtonText: { color: Colors.white, fontSize: 28, fontWeight: '900' },
  attemptsList: { marginTop: Spacing.md, width: '100%' },
  attemptText: { ...Typography.body, textAlign: 'center', marginBottom: 4 },
  resultsSection: { marginTop: Spacing.sm },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.sm },
});
