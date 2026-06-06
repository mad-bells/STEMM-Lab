/**
 * BreathingPaceScreen.js
 * Activity 7: Breathing Pace Trainer
 * Phone placed on chest. Accelerometer detects chest rise/fall.
 * Students record breathing at rest and after exercise.
 *
 * Device features used: Accelerometer, GPS
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';
import MetricCard from '../../components/MetricCard';
import PrimaryButton from '../../components/PrimaryButton';
import InstructionsCard from '../../components/InstructionsCard';
import ScienceCard from '../../components/ScienceCard';
import ActivityTabs from '../../components/ActivityTabs';
import ResultSubmitSheet from '../../components/ResultSubmitSheet';
import VideoPickerButton from '../../components/VideoPickerButton';
import useAccelerometer from '../../hooks/useAccelerometer';
import { breathsPerMinute } from '../../utils/calculations';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete, uploadVideo } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';
import { syncTeamToFirestore } from '../../utils/syncTeam';

const EQUIPMENT = [
  'Mobile phone with STEMM Lab app',
  'Open floor space to lie down',
  'Space to do a short jog or star jumps',
];

const INSTRUCTIONS = [
  'Lie down and place the phone flat on your chest (screen facing up).',
  'Breathe normally and tap Start next to "At Rest" — the app counts breaths for 30 seconds.',
  'After resting, do a short jog and tap Start next to "After Exercise 1".',
  'Do star jumps, then record "After Exercise 2" in the same way.',
  'Go to Results and Save. How does exercise change your breathing rate?',
];

const WRITE_UP = {
  questions: [
    'Predict your resting breathing rate (breaths per minute).',
    'How much do you expect exercise to increase your breathing rate?',
    'Why does your breathing rate increase after exercise?',
  ],
  columns: ['Predict breaths per minute', 'Outcome (time + movement)', 'Were you right?'],
  rows: ['Breathing at Rest', 'After Exercise 1', 'After Exercise 2'],
};

const SCIENCE = [
  'Your breathing rate (respiratory rate) is how many breaths you take per minute. A normal resting rate is 12–20 breaths/min.',
  'When you exercise, your muscles need more oxygen and produce more carbon dioxide. Your brain detects this and signals your lungs to breathe faster.',
  'Elite athletes often have lower resting breathing rates because their lungs and heart are more efficient at delivering oxygen.',
];

const STAGES = ['At Rest', 'After Exercise 1 (jog)', 'After Exercise 2 (star jumps)'];
const MEASURE_SECONDS = 30;

export default function BreathingPaceScreen() {
  const { z } = useAccelerometer(50);
  const [tab, setTab] = useState('instructions');
  const [recording, setRecording] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [results, setResults] = useState([null, null, null]);
  const [countdown, setCountdown] = useState(MEASURE_SECONDS);
  const [saving, setSaving] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const breathCountRef = useRef(0);
  const prevZRef = useRef(0);
  const timerRef = useRef(null);
  const currentStageRef = useRef(0);
  const resultsRef = useRef([null, null, null]);

  if (recording) {
    const delta = z - prevZRef.current;
    if (delta > 0.05 && prevZRef.current < 0) breathCountRef.current += 1;
    prevZRef.current = z;
  }

  function startRecording(index) {
    setCurrentStage(index);
    currentStageRef.current = index;
    setRecording(true);
    breathCountRef.current = 0;
    prevZRef.current = 0;
    let seconds = MEASURE_SECONDS;
    setCountdown(seconds);

    timerRef.current = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
      if (seconds <= 0) stopRecording(currentStageRef.current);
    }, 1000);
  }

  function stopRecording(index = currentStageRef.current) {
    clearInterval(timerRef.current);
    setRecording(false);
    const bpm = breathsPerMinute(breathCountRef.current, MEASURE_SECONDS);
    const updated = [...resultsRef.current];
    updated[index] = { bpm: Math.round(bpm), breathCount: breathCountRef.current };
    resultsRef.current = updated;
    setResults([...updated]);
  }

  const hasResults = results.some(Boolean);

  async function handleSave({ rating, comment }) {
    const valid = results.filter(Boolean);
    if (!valid.length) { Alert.alert('No data', 'Record at least one stage.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const maxBpm = Math.max(...valid.map((r) => r.bpm));
      const score = Math.min(100, Math.round(maxBpm * 2));
      const videoUrl = videoUri ? await uploadVideo(teamId, 'breathing', videoUri) : null;

      const data = { stages: STAGES, results, rating, comment, videoUrl };
      saveResultLocal(teamId, 'breathing', data, score, loc?.latitude, loc?.longitude);
      setShowSheet(false);
      setSaving(false);
      submitResult(teamId, 'breathing', { ...data, score }).catch(console.warn);
      markActivityComplete(teamId, 'breathing').catch(console.warn);
      syncTeamToFirestore().catch(console.warn);
      sendNotification('Activity Complete!', 'Breathing data saved.').catch(console.warn);
      Alert.alert('Saved!', `Max BPM: ${maxBpm}`);
    } catch (err) {
      setSaving(false);
      Alert.alert('Error', err.message);
    }
  }

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
            {recording ? (
              <View style={[styles.liveCard, Shadow.md]}>
                <Text style={styles.liveTitle}>{STAGES[currentStage]}</Text>
                <Text style={styles.countdown}>{countdown}</Text>
                <Text style={styles.countdownLabel}>seconds remaining</Text>
                <Text style={styles.breathCount}>Breaths detected: {breathCountRef.current}</Text>
                <PrimaryButton title="Stop Early" onPress={() => stopRecording(currentStage)} color={Colors.error} style={{ marginTop: Spacing.md }} />
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
                      title={results[i] ? 'Redo' : 'Start'}
                      onPress={() => startRecording(i)}
                      color={results[i] ? Colors.accent : Colors.primary}
                      style={styles.smallBtn}
                    />
                  </View>
                ))}
              </View>
            )}
            <VideoPickerButton uri={videoUri} onPick={setVideoUri} />
            {hasResults && !recording && (
              <PrimaryButton title="View Results" onPress={() => setTab('results')} style={{ marginTop: Spacing.sm }} />
            )}
          </>
        }
        results={
          hasResults ? (
            <>
              {results.map((r, i) => r && (
                <MetricCard key={i} label={STAGES[i]} value={String(r.bpm)} unit="breaths/min" color={Colors.info} />
              ))}
              <PrimaryButton title="Save Result" onPress={() => setShowSheet(true)} style={{ marginTop: Spacing.md }} />
            </>
          ) : (
            <Text style={styles.noResults}>Record at least one stage in the Record tab first.</Text>
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
  liveCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md,
  },
  liveTitle: { ...Typography.h4, color: Colors.primary, marginBottom: Spacing.sm },
  countdown: { fontSize: 80, fontWeight: '900', color: Colors.info },
  countdownLabel: { ...Typography.body, color: Colors.textSecondary },
  breathCount: { ...Typography.h4, marginTop: Spacing.sm, color: Colors.success },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  stageRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  stageInfo: { flex: 1 },
  stageLabel: { ...Typography.body },
  smallBtn: { paddingHorizontal: Spacing.sm, minWidth: 72 },
  noResults: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
