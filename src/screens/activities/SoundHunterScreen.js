/**
 * SoundHunterScreen.js
 * Activity 2: Sound Pollution Hunter
 * Live dB meter. Students trigger a 3-second peak capture per action.
 *
 * Device features used: Microphone (expo-av), GPS location tagging
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';
import MetricCard from '../../components/MetricCard';
import PrimaryButton from '../../components/PrimaryButton';
import InstructionsCard from '../../components/InstructionsCard';
import ScienceCard from '../../components/ScienceCard';
import ActivityTabs from '../../components/ActivityTabs';
import ResultSubmitSheet from '../../components/ResultSubmitSheet';
import VideoPickerButton from '../../components/VideoPickerButton';
import useAudioLevel from '../../hooks/useAudioLevel';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete, uploadVideo } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';
import { syncTeamToFirestore } from '../../utils/syncTeam';

const EQUIPMENT = [
  'Mobile phone with STEMM Lab app',
  'A quiet classroom or outdoor space',
  'Items to create sounds (e.g. book, hands, voice)',
];

const INSTRUCTIONS = [
  'You will record 3 different classroom actions (e.g. dropping a book, clapping, shouting).',
  'Tap Measure next to an action, then perform the action straight away.',
  'The app listens for 3 seconds and captures the loudest reading automatically.',
  'Repeat for all 3 actions, then go to the Results tab.',
  'Compare the dB levels — which action was loudest? Is any level dangerous?',
];

const WRITE_UP = {
  questions: [
    'Predict which action will be the loudest.',
    'At what dB level does sound become dangerous?',
    'Were your predictions correct?',
  ],
  columns: ['Prediction (louder or softer than)', 'Outcome (dB)', 'Were you right?'],
  rows: ['Action 1 (e.g. dropping a book on the table)', 'Action 2', 'Action 3'],
};

const SCIENCE = [
  'Sound is a vibration that travels through the air as a wave. We measure its loudness in decibels (dB).',
  'Normal conversation is around 60 dB. Sounds above 85 dB can cause hearing damage over time. Sounds above 120 dB can cause immediate pain.',
  'Scientists and engineers study sound pollution to design quieter environments — in schools, workplaces, and cities.',
];

const ACTIONS = ['Action 1', 'Action 2', 'Action 3'];
const CAPTURE_SECONDS = 3;

function getRisk(db) {
  if (db < 60) return { label: 'Safe', color: Colors.success };
  if (db < 85) return { label: 'Generally safe', color: Colors.success };
  if (db < 90) return { label: 'Caution', color: Colors.warning };
  if (db < 100) return { label: 'Risk of damage', color: Colors.error };
  return { label: 'Danger!', color: Colors.error };
}

export default function SoundHunterScreen() {
  const [tab, setTab] = useState('instructions');
  const [measuring, setMeasuring] = useState(false);
  const [currentAction, setCurrentAction] = useState(0);
  const [countdown, setCountdown] = useState(CAPTURE_SECONDS);
  const [recorded, setRecorded] = useState([null, null, null]);
  const [showSheet, setShowSheet] = useState(false);
  const [videoUris, setVideoUris] = useState([null, null, null]);
  const [saving, setSaving] = useState(false);
  const { dB, hasPermission } = useAudioLevel(measuring);

  const peakRef = useRef(0);
  const timerRef = useRef(null);
  const currentActionRef = useRef(0);
  const recordedRef = useRef([null, null, null]);

  useEffect(() => {
    if (measuring && dB > peakRef.current) peakRef.current = dB;
  }, [dB, measuring]);

  function setVideoUri(index, uri) {
    setVideoUris((prev) => {
      const next = [...prev];
      next[index] = uri;
      return next;
    });
  }

  async function startMeasure(index) {
    setCurrentAction(index);
    currentActionRef.current = index;
    peakRef.current = 0;
    setCountdown(CAPTURE_SECONDS);
    setMeasuring(true);
    await activateKeepAwakeAsync(); // prevent screen from sleeping during capture

    let seconds = CAPTURE_SECONDS;
    timerRef.current = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
      if (seconds <= 0) {
        clearInterval(timerRef.current);
        const updated = [...recordedRef.current];
        updated[currentActionRef.current] = peakRef.current;
        recordedRef.current = updated;
        setRecorded([...updated]);
        setMeasuring(false);
        deactivateKeepAwake();
      }
    }, 1000);
  }

  function cancelMeasure() {
    clearInterval(timerRef.current);
    setMeasuring(false);
    deactivateKeepAwake();
  }

  useEffect(() => () => {
    clearInterval(timerRef.current);
    deactivateKeepAwake();
  }, []);

  const hasResults = recorded.some((r) => r != null);

  async function handleSave({ rating, comment }) {
    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const valid = recorded.filter((r) => r != null);
      const avgDb = valid.reduce((a, b) => a + b, 0) / valid.length;

      const videoUrls = await Promise.all(
        videoUris.map((uri, i) =>
          uri ? uploadVideo(teamId, `sound_action${i + 1}`, uri) : Promise.resolve(null)
        )
      );

      const data = { actions: ACTIONS, readings: recorded, rating, comment, videoUrls };
      saveResultLocal(teamId, 'sound', data, 0, loc?.latitude, loc?.longitude);
      setShowSheet(false);
      setSaving(false);
      submitResult(teamId, 'sound', data).catch(console.warn);
      markActivityComplete(teamId, 'sound').catch(console.warn);
      syncTeamToFirestore().catch(console.warn);
      sendNotification('Activity Complete!', 'Sound readings saved.').catch(console.warn);
      Alert.alert('Saved!', `Average peak: ${avgDb.toFixed(0)} dB`);
    } catch (err) {
      setSaving(false);
      Alert.alert('Error', err.message);
    }
  }

  const risk = getRisk(dB);

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
            {measuring ? (
              <View style={[styles.meterCard, Shadow.md]}>
                <Text style={styles.meterLabel}>{ACTIONS[currentAction]}</Text>
                <Text style={styles.countdown}>{countdown}</Text>
                <Text style={styles.countdownLabel}>seconds remaining</Text>
                <Text style={styles.meterValue}>{dB} <Text style={styles.meterUnit}>dB</Text></Text>
                <Text style={styles.peakValue}>Peak: {peakRef.current} dB</Text>
                <Text style={[styles.riskBadge, { backgroundColor: risk.color }]}>{risk.label}</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${Math.min(dB, 130) / 130 * 100}%`, backgroundColor: risk.color }]} />
                </View>
                <TouchableOpacity onPress={cancelMeasure} style={{ marginTop: Spacing.md, alignItems: 'center' }}>
                  <Text style={{ color: Colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Tap Measure, then make your sound</Text>
                {ACTIONS.map((action, i) => {
                  const done = recorded[i] != null;
                  const r = done ? getRisk(recorded[i]) : null;
                  return (
                    <View key={i} style={[styles.actionCard, Shadow.sm, done && { borderColor: r.color, borderWidth: 2 }]}>
                      <View style={styles.actionCardTop}>
                        <View style={[styles.actionBadge, done && { backgroundColor: r.color }]}>
                          <Text style={styles.actionBadgeText}>{i + 1}</Text>
                        </View>
                        <View style={styles.actionCardInfo}>
                          <Text style={styles.actionCardTitle}>{action}</Text>
                          {done ? (
                            <View style={styles.dbRow}>
                              <Text style={[styles.dbValue, { color: r.color }]}>{recorded[i]} dB</Text>
                              <View style={[styles.riskPill, { backgroundColor: r.color + '22' }]}>
                                <Text style={[styles.riskPillText, { color: r.color }]}>{r.label}</Text>
                              </View>
                            </View>
                          ) : (
                            <Text style={styles.actionCardHint}>Not yet recorded</Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.measureBtn, done && styles.measureBtnRedo]}
                        onPress={() => startMeasure(i)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.measureBtnText, done && styles.measureBtnTextRedo]}>
                          {done ? 'Re-measure' : '🎙 Measure'}
                        </Text>
                      </TouchableOpacity>
                      <VideoPickerButton
                        uri={videoUris[i]}
                        onPick={(uri) => setVideoUri(i, uri)}
                        style={styles.videoPicker}
                      />
                    </View>
                  );
                })}
              </>
            )}
            {hasResults && !measuring && (
              <PrimaryButton title="View Results" onPress={() => setTab('results')} style={{ marginTop: Spacing.sm }} />
            )}
            {hasPermission === false && (
              <Text style={styles.warning}>Microphone permission denied. Enable it in device settings.</Text>
            )}
          </>
        }
        results={
          hasResults ? (
            <>
              {recorded.map((r, i) => r != null && (
                <MetricCard key={i} label={ACTIONS[i]} value={String(r)} unit="dB" color={getRisk(r).color} />
              ))}
              <PrimaryButton title="Save Result" onPress={() => setShowSheet(true)} style={{ marginTop: Spacing.md }} />
            </>
          ) : (
            <Text style={styles.noResults}>Record at least one action in the Record tab first.</Text>
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
  meterCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md,
  },
  meterLabel: { ...Typography.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  countdown: { fontSize: 72, fontWeight: '900', color: Colors.primary, lineHeight: 80 },
  countdownLabel: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.sm },
  meterValue: { fontSize: 32, fontWeight: '700', color: Colors.text },
  meterUnit: { fontSize: 20, color: Colors.textSecondary },
  peakValue: { ...Typography.body, color: Colors.info, marginBottom: Spacing.sm },
  riskBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full,
    color: '#fff', fontWeight: '700', overflow: 'hidden', marginBottom: Spacing.sm,
  },
  barBg: { height: 12, backgroundColor: Colors.border, borderRadius: Radius.full, width: '100%', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.full },
  sectionLabel: {
    ...Typography.label, color: Colors.textSecondary,
    textAlign: 'center', marginBottom: Spacing.sm,
  },
  actionCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  actionCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  actionBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm,
  },
  actionBadgeText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  actionCardInfo: { flex: 1 },
  actionCardTitle: { ...Typography.h4, marginBottom: 2 },
  actionCardHint: { ...Typography.bodySmall, color: Colors.textSecondary },
  dbRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  dbValue: { fontSize: 22, fontWeight: '800' },
  riskPill: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: Radius.full },
  riskPillText: { ...Typography.bodySmall, fontWeight: '700' },
  measureBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 12, alignItems: 'center',
  },
  measureBtnRedo: { backgroundColor: Colors.surfaceAlt, borderWidth: 1.5, borderColor: Colors.border },
  measureBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  measureBtnTextRedo: { color: Colors.textSecondary },
  videoPicker: { marginTop: Spacing.sm, marginBottom: 0 },
  warning: { ...Typography.body, color: Colors.error, textAlign: 'center', marginTop: Spacing.md },
  noResults: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
