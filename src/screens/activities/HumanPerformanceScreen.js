/**
 * HumanPerformanceScreen.js
 * Activity 5: Human Performance Lab – Stretch Speed & Gracefulness
 * Phone held in hand during 3 movements. Accelerometer measures smoothness.
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
import useTimer from '../../hooks/useTimer';
import { scoreFromMagnitude } from '../../utils/calculations';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete, uploadVideo } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';
import { syncTeamToFirestore } from '../../utils/syncTeam';

const EQUIPMENT = [
  'Mobile phone with STEMM Lab app',
  'Open space to move freely',
];

const INSTRUCTIONS = [
  'Hold the phone firmly in one hand throughout the activity.',
  'Tap Start next to a movement, then perform that movement as smoothly as you can.',
  'Tap Stop when the movement is complete — the app records your average vibration.',
  'Repeat for all 3 movements.',
  'Go to Results and Save. Lower average vibration means smoother, more controlled movement.',
];

const WRITE_UP = {
  questions: [
    'Which movement do you predict will have the lowest vibration?',
    'What does lower vibration tell us about a movement?',
    'How could you improve the smoothness of your worst movement?',
  ],
  columns: ['Predict Phone Vibration Sensor (absolute)', 'Outcome (time + movement)', 'Were you right?'],
  rows: ['Attempt 1', 'Attempt 2', 'Attempt 3'],
};

const SCIENCE = [
  'When you move smoothly, your body produces less sudden acceleration — and therefore less vibration.',
  'Athletes and surgeons train to minimise unwanted vibration in their movements. This is called "motor control".',
  'Accelerometers measure changes in velocity over time. The phone sensor detects every wobble, shake, and jerk in your hand.',
];

const MOVEMENTS = ['Movement 1 — Slow stretch', 'Movement 2 — Fast reach', 'Movement 3 — Rotation'];

export default function HumanPerformanceScreen() {
  const { magnitude } = useAccelerometer(100);
  const timer = useTimer();
  const [tab, setTab] = useState('instructions');
  const [recording, setRecording] = useState(false);
  const [currentMove, setCurrentMove] = useState(0);
  const [attempts, setAttempts] = useState([null, null, null]);
  const sumRef = useRef(0);
  const countRef = useRef(0);
  const [saving, setSaving] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [videoUri, setVideoUri] = useState(null);

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

  const hasResults = attempts.some(Boolean);

  async function handleSave({ rating, comment }) {
    const valid = attempts.filter(Boolean);
    if (!valid.length) { Alert.alert('No data', 'Record at least one movement.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const bestMag = Math.min(...valid.map((a) => parseFloat(a.avgMag)));
      const score = scoreFromMagnitude(bestMag, 0.9, 3);
      const videoUrl = videoUri ? await uploadVideo(teamId, 'humanperf', videoUri) : null;

      const data = { movements: MOVEMENTS, attempts, rating, comment, videoUrl };
      saveResultLocal(teamId, 'humanperf', data, score, loc?.latitude, loc?.longitude);
      setShowSheet(false);
      setSaving(false);
      submitResult(teamId, 'humanperf', { ...data, score }).catch(console.warn);
      markActivityComplete(teamId, 'humanperformance').catch(console.warn);
      syncTeamToFirestore().catch(console.warn);
      sendNotification('Activity Complete!', 'Performance recorded.').catch(console.warn);
      Alert.alert('Saved!', 'Result saved — great work!');
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
                <Text style={styles.liveTitle}>{MOVEMENTS[currentMove]}</Text>
                <Text style={styles.liveTimer}>{timer.display}</Text>
                <Text style={styles.liveMag}>Vibration: {(magnitude - 1).toFixed(3)} m/s²</Text>
                <PrimaryButton title="Stop" onPress={stopMove} color={Colors.error} style={{ marginTop: Spacing.md }} />
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
                      title={attempts[i] ? 'Redo' : 'Go'}
                      onPress={() => startMove(i)}
                      color={attempts[i] ? Colors.accent : Colors.primary}
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
              {attempts.map((a, i) => a && (
                <MetricCard key={i} label={MOVEMENTS[i]} value={a.avgMag} unit="m/s²" color={Colors.health} />
              ))}
              <PrimaryButton title="Save Result" onPress={() => setShowSheet(true)} style={{ marginTop: Spacing.md }} />
            </>
          ) : (
            <Text style={styles.noResults}>Record at least one movement in the Record tab first.</Text>
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
  liveTitle: { ...Typography.h4, color: Colors.primary, marginBottom: Spacing.sm, textAlign: 'center' },
  liveTimer: { fontSize: 48, fontWeight: '900', color: Colors.health },
  liveMag: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  moveRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  moveInfo: { flex: 1 },
  moveLabel: { ...Typography.body },
  smallBtn: { paddingHorizontal: Spacing.sm, minWidth: 72 },
  noResults: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
