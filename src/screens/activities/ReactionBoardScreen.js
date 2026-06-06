/**
 * ReactionBoardScreen.js
 * Activity 6: Reaction Board Challenge
 * Phase 1: Tap hidden button as fast as possible.
 * Phase 2: Repeat with non-dominant hand.
 *
 * Device features used: Touch timing, GPS
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';
import MetricCard from '../../components/MetricCard';
import PrimaryButton from '../../components/PrimaryButton';
import InstructionsCard from '../../components/InstructionsCard';
import ScienceCard from '../../components/ScienceCard';
import ActivityTabs from '../../components/ActivityTabs';
import ResultSubmitSheet from '../../components/ResultSubmitSheet';
import VideoPickerButton from '../../components/VideoPickerButton';
import { average, stdDev, scoreFromTime } from '../../utils/calculations';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete, uploadVideo } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';
import { syncTeamToFirestore } from '../../utils/syncTeam';

const EQUIPMENT = [
  'Mobile phone with STEMM Lab app',
];

const INSTRUCTIONS = [
  'You will test your reaction time with both hands across 3 attempts each.',
  'Tap Start, then wait — the TAP button will appear after a random delay.',
  'Tap the button as fast as you can the moment it appears.',
  'Complete all 3 attempts with your dominant hand, then swap to the other hand.',
  'Go to Results and Save. Compare your dominant vs non-dominant hand times!',
];

const WRITE_UP = {
  questions: [
    'Predict: will your dominant or non-dominant hand be faster?',
    'What is the difference in average reaction time between your hands?',
    'How could you train to improve your reaction time?',
  ],
  columns: ['Reaction Time Prediction', 'Outcome (time + movement)', 'Were you right?'],
  rows: ['Attempt 1', 'Attempt 2', 'Attempt 3'],
};

const SCIENCE = [
  'Your reaction time is how long it takes your brain to detect a signal, process it, and send a command to your muscles.',
  'Typical human reaction time to a visual stimulus is 150–300 milliseconds. Trained athletes can be faster.',
  'Your dominant hand is usually slightly faster because the neural pathways for that side are more practised.',
];

const PHASES = ['Dominant Hand', 'Non-Dominant Hand'];
const ATTEMPTS = 3;

export default function ReactionBoardScreen() {
  const [tab, setTab] = useState('instructions');
  const [phase, setPhase] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState([[], []]);
  const [saving, setSaving] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const showTimeRef = useRef(null);
  const delayRef = useRef(null);

  function startWait() {
    setWaiting(true);
    setButtonVisible(false);
    const delay = 1000 + Math.random() * 3000;
    delayRef.current = setTimeout(() => {
      showTimeRef.current = Date.now();
      setButtonVisible(true);
      setWaiting(false);
    }, delay);
  }

  function handleTap() {
    if (!buttonVisible) return;
    const reactionS = (Date.now() - showTimeRef.current) / 1000;
    const updated = results.map((arr) => [...arr]);
    updated[phase] = [...updated[phase], reactionS];
    setResults(updated);
    setButtonVisible(false);

    const nextAttempt = attempt + 1;
    if (nextAttempt < ATTEMPTS) {
      setAttempt(nextAttempt);
    } else {
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

  const allDone = results[PHASES.length - 1].length === ATTEMPTS;
  const hasResults = results.some((arr) => arr.length > 0);

  async function handleSave({ rating, comment }) {
    const flat = results.flat();
    if (!flat.length) { Alert.alert('No data', 'Complete at least one attempt.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const avgTime = average(flat);
      const score = scoreFromTime(avgTime, 0.1, 1.5);
      const videoUrl = videoUri ? await uploadVideo(teamId, 'reaction', videoUri) : null;

      const data = {
        phases: PHASES, times: results,
        averages: results.map((arr) => arr.length ? average(arr) : null),
        stdDevs: results.map((arr) => arr.length > 1 ? stdDev(arr) : null),
        rating, comment, videoUrl,
      };

      saveResultLocal(teamId, 'reaction', data, score, loc?.latitude, loc?.longitude);
      setShowSheet(false);
      setSaving(false);
      submitResult(teamId, 'reaction', { ...data, score }).catch(console.warn);
      markActivityComplete(teamId, 'reactionboard').catch(console.warn);
      syncTeamToFirestore().catch(console.warn);
      sendNotification('Activity Complete!', 'Reaction time saved.').catch(console.warn);
      Alert.alert('Saved!', `Avg: ${(avgTime * 1000).toFixed(0)}ms`);
    } catch (err) {
      setSaving(false);
      Alert.alert('Error', err.message);
    }
  }

  const currentPhaseResults = results[phase];

  return (
    <>
      <ActivityTabs
        tab={tab} onTabChange={setTab} hasResults={hasResults}
        instructions={
          <>
            <InstructionsCard steps={INSTRUCTIONS} equipment={EQUIPMENT} writeUp={WRITE_UP} />
            <ScienceCard paragraphs={SCIENCE} />
          </>
        }
        record={
          <>
            <View style={styles.phaseRow}>
              {PHASES.map((p, i) => (
                <View key={i} style={[styles.phaseChip, phase === i && styles.phaseChipActive]}>
                  <Text style={[styles.phaseChipText, phase === i && styles.phaseChipTextActive]}>{p}</Text>
                </View>
              ))}
            </View>

            {!allDone && (
              <View style={[styles.reactionCard, Shadow.md]}>
                <Text style={styles.phaseLabel}>{PHASES[phase]} — Attempt {attempt + 1}/{ATTEMPTS}</Text>

                {!waiting && !buttonVisible && (
                  <PrimaryButton title="Start" onPress={startWait} style={{ marginTop: Spacing.md }} />
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

            <VideoPickerButton uri={videoUri} onPick={setVideoUri} />
            {allDone && (
              <PrimaryButton title="View Results" onPress={() => setTab('results')} style={{ marginTop: Spacing.sm }} />
            )}
          </>
        }
        results={
          hasResults ? (
            <>
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
              <PrimaryButton title="Save Result" onPress={() => setShowSheet(true)} style={{ marginTop: Spacing.md }} />
            </>
          ) : (
            <Text style={styles.noResults}>Complete at least one attempt in the Record tab first.</Text>
          )
        }
      />
      <ResultSubmitSheet
        visible={showSheet} onClose={() => setShowSheet(false)}
        onSubmit={handleSave} loading={saving}
      />
    </>
  );
}

const styles = StyleSheet.create({
  phaseRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  phaseChip: {
    flex: 1, padding: Spacing.sm, borderRadius: Radius.md,
    backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  phaseChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  phaseChipText: { ...Typography.label, color: Colors.textSecondary },
  phaseChipTextActive: { color: '#fff', fontWeight: '700' },
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
  tapButtonText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  attemptsList: { marginTop: Spacing.md, width: '100%' },
  attemptText: { ...Typography.body, textAlign: 'center', marginBottom: 4 },
  noResults: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
