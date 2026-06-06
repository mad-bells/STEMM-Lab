/**
 * EarthquakeScreen.js
 * Activity 4: Earthquake-Resistant Structure
 * Accelerometer reads vibration intensity while phone is on the structure.
 *
 * Device features used: Accelerometer (expo-sensors), GPS
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
import { scoreFromMagnitude } from '../../utils/calculations';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete, uploadVideo } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';
import { syncTeamToFirestore } from '../../utils/syncTeam';

const EQUIPMENT = [
  'Mobile phone with STEMM Lab app',
  'Building materials: straws, tape, card/cardboard, scissors',
  'A flat surface to build on',
];

const INSTRUCTIONS = [
  'Build 3 different earthquake-resistant structures using straws, tape, and card.',
  'Place the phone flat on top of your first structure.',
  'Tap Start next to Design 1, then gently shake the table to simulate an earthquake.',
  'Tap Stop — the app records the peak vibration for that design.',
  'Test all 3 designs, then go to the Results tab. Lower vibration = more stable structure!',
];

const WRITE_UP = {
  questions: [
    'Predict which structure will be most stable.',
    'What shape do you think will perform best, and why?',
    'What would you change about your best design?',
  ],
  columns: ['Phone moves (prediction)', 'Outcome (in degrees)', 'Were you right?'],
  rows: ['Design 1 (e.g. 4 folds + 4 pillars)', 'Design 2 (e.g. 10 folds + 4 pillars)', 'Design 3 (e.g. 3 folds + 6 pillars)'],
};

const SCIENCE = [
  'Earthquakes cause the ground to vibrate rapidly. Structures that absorb or redirect these vibrations are less likely to collapse.',
  'Triangular shapes are particularly strong because they distribute force evenly across all sides.',
  'Engineers use accelerometers (the same sensor in your phone) to measure vibrations in real buildings during earthquake tests.',
];

const DESIGNS = ['Design 1', 'Design 2', 'Design 3'];

export default function EarthquakeScreen() {
  const { magnitude, available } = useAccelerometer(100);
  const [tab, setTab] = useState('instructions');
  const [recording, setRecording] = useState(false);
  const [currentDesign, setCurrentDesign] = useState(0);
  const [maxMags, setMaxMags] = useState([null, null, null]);
  const maxRef = useRef(0);
  const [saving, setSaving] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [videoUri, setVideoUri] = useState(null);

  if (recording && magnitude - 1 > maxRef.current) {
    maxRef.current = magnitude - 1;
  }

  function startRecording(index) {
    setCurrentDesign(index);
    maxRef.current = 0;
    setRecording(true);
  }

  function stopRecording() {
    const updated = [...maxMags];
    updated[currentDesign] = Math.max(0, maxRef.current).toFixed(3);
    setMaxMags(updated);
    setRecording(false);
  }

  const hasResults = maxMags.some((v) => v !== null);

  async function handleSave({ rating, comment }) {
    const valid = maxMags.filter((v) => v !== null);
    if (!valid.length) { Alert.alert('No data', 'Record at least one design first.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const bestMag = Math.min(...valid.map(Number));
      const score = scoreFromMagnitude(bestMag, 0, 3);
      const videoUrl = videoUri ? await uploadVideo(teamId, 'earthquake', videoUri) : null;

      const data = { designs: DESIGNS, maxMagnitudes: maxMags, rating, comment, videoUrl };
      saveResultLocal(teamId, 'earthquake', data, score, loc?.latitude, loc?.longitude);
      setShowSheet(false);
      setSaving(false);
      submitResult(teamId, 'earthquake', { ...data, score }).catch(console.warn);
      markActivityComplete(teamId, 'earthquake').catch(console.warn);
      syncTeamToFirestore().catch(console.warn);
      sendNotification('Activity Complete!', 'Earthquake structure saved.').catch(console.warn);
      Alert.alert('Saved!', `Best vibration: ${bestMag.toFixed(3)} m/s²`);
    } catch (err) {
      setSaving(false);
      Alert.alert('Error', err.message);
    }
  }

  if (!available) {
    return (
      <View style={styles.center}>
        <Text style={styles.unavailable}>Accelerometer not available on this device.</Text>
      </View>
    );
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
                <Text style={styles.liveTitle}>Recording Design {currentDesign + 1}…</Text>
                <Text style={styles.liveValue}>{(Math.max(0, magnitude - 1)).toFixed(3)}</Text>
                <Text style={styles.liveUnit}>m/s² vibration</Text>
                <Text style={styles.peakText}>Peak: {maxRef.current.toFixed(3)} m/s²</Text>
                <PrimaryButton title="Stop Recording" onPress={stopRecording} color={Colors.error} style={{ marginTop: Spacing.md }} />
              </View>
            ) : (
              <View style={[styles.card, Shadow.sm]}>
                <Text style={styles.cardTitle}>Test Your Designs</Text>
                {DESIGNS.map((d, i) => (
                  <View key={i} style={styles.designRow}>
                    <View style={styles.designInfo}>
                      <Text style={styles.designLabel}>{d}</Text>
                      {maxMags[i] != null && (
                        <Text style={{ color: Colors.success, ...Typography.bodySmall }}>
                          Peak: {maxMags[i]} m/s²
                        </Text>
                      )}
                    </View>
                    <PrimaryButton
                      title={maxMags[i] != null ? 'Redo' : 'Start'}
                      onPress={() => startRecording(i)}
                      color={maxMags[i] != null ? Colors.accent : Colors.primary}
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
              {maxMags.map((m, i) => m != null && (
                <MetricCard key={i} label={DESIGNS[i]} value={m} unit="m/s²" color={Colors.warning} />
              ))}
              <PrimaryButton title="Save Result" onPress={() => setShowSheet(true)} style={{ marginTop: Spacing.md }} />
            </>
          ) : (
            <Text style={styles.noResults}>Test at least one design in the Record tab first.</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  unavailable: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  liveCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md,
  },
  liveTitle: { ...Typography.h4, color: Colors.primary, marginBottom: Spacing.sm },
  liveValue: { fontSize: 64, fontWeight: '900', color: Colors.warning },
  liveUnit: { ...Typography.body, color: Colors.textSecondary, marginBottom: 4 },
  peakText: { ...Typography.label, color: Colors.error },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  designRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  designInfo: { flex: 1 },
  designLabel: { ...Typography.body },
  smallBtn: { paddingHorizontal: Spacing.md, paddingVertical: 8, minWidth: 80 },
  noResults: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
