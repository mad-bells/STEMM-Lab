/**
 * HandFanScreen.js
 * Activity 3: Hand Fan Challenge
 * Students record bend angles for 3 fan designs at 3 distances.
 * No special sensor needed — manual data entry + GPS tagging.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';
import MetricCard from '../../components/MetricCard';
import PrimaryButton from '../../components/PrimaryButton';
import InstructionsCard from '../../components/InstructionsCard';
import ScienceCard from '../../components/ScienceCard';
import ActivityTabs from '../../components/ActivityTabs';
import ResultSubmitSheet from '../../components/ResultSubmitSheet';
import VideoPickerButton from '../../components/VideoPickerButton';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete, uploadVideo } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';
import { syncTeamToFirestore } from '../../utils/syncTeam';

const EQUIPMENT = [
  'Mobile phone with STEMM Lab app',
  'Paper sheets (A4 or similar)',
  'Scissors and ruler',
  'A lightweight tissue or small piece of paper to test fan effect',
];

const INSTRUCTIONS = [
  'Build 3 different hand fan designs using paper (e.g. different fold sizes or shapes).',
  'Place a tissue or lightweight object at 15 cm, 30 cm, and 45 cm from the fan.',
  'Wave each fan design and measure how much the tissue bends (in degrees) at each distance.',
  'Enter the bend angles for each design and distance into the app.',
  'Go to Results, then Save Result. Which design moves the most air?',
];

const WRITE_UP = {
  questions: [
    'Predict which fan design will move the most air.',
    'How does fold size affect the amount of air moved?',
    'Which design was easiest to make?',
  ],
  columns: ['Bend (in degrees) — prediction', 'Outcome (in degrees)', 'Observation Notes: Were you right?'],
  rows: ['Design 1 (e.g. 1 cm back and forward folds)', 'Design 2 (e.g. no folds)', 'Design 3'],
};

const SCIENCE = [
  'Fans work by pushing air. When you wave a fan, it creates a pressure difference that moves air towards you.',
  'The shape and size of the fan affects how much air it can move. Larger surface area and faster movement both increase airflow.',
  'Engineers study airflow (called fluid dynamics) to design efficient fans, air conditioning systems, and wind turbines.',
];

const DESIGNS = ['Design 1 (1 cm folds)', 'Design 2 (no folds)', 'Design 3'];
const DISTANCES = ['15 cm', '30 cm', '45 cm'];

export default function HandFanScreen() {
  const [tab, setTab] = useState('instructions');
  const [angles, setAngles] = useState(DESIGNS.map(() => DISTANCES.map(() => '')));
  const [saving, setSaving] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [videoUri, setVideoUri] = useState(null);

  function setAngle(dIdx, distIdx, val) {
    const updated = angles.map((row) => [...row]);
    updated[dIdx][distIdx] = val;
    setAngles(updated);
  }

  const hasResults = angles.flat().some((v) => v !== '');

  async function handleSave({ rating, comment }) {
    const flat = angles.flat().filter((v) => v !== '');
    if (!flat.length) { Alert.alert('No data', 'Enter at least one bend angle.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const maxAngle = Math.max(...flat.map(Number));
      const score = Math.min(100, Math.round(maxAngle));
      const videoUrl = videoUri ? await uploadVideo(teamId, 'handfan', videoUri) : null;

      const data = { designs: DESIGNS, distances: DISTANCES, angles, rating, comment, videoUrl };
      saveResultLocal(teamId, 'handfan', data, score, loc?.latitude, loc?.longitude);
      setShowSheet(false);
      setSaving(false);
      submitResult(teamId, 'handfan', { ...data, score }).catch(console.warn);
      markActivityComplete(teamId, 'handfan').catch(console.warn);
      syncTeamToFirestore().catch(console.warn);
      sendNotification('Activity Complete!', 'Hand Fan result saved.').catch(console.warn);
      Alert.alert('Saved!', `Max bend: ${maxAngle}°`);
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
            {DESIGNS.map((design, dIdx) => (
              <View key={dIdx} style={[styles.card, Shadow.sm]}>
                <Text style={styles.cardTitle}>{design}</Text>
                {DISTANCES.map((dist, distIdx) => (
                  <View key={distIdx} style={styles.row}>
                    <Text style={styles.distLabel}>{dist}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="°"
                      keyboardType="decimal-pad"
                      value={angles[dIdx][distIdx]}
                      onChangeText={(v) => setAngle(dIdx, distIdx, v)}
                    />
                    <Text style={styles.unit}>degrees</Text>
                  </View>
                ))}
              </View>
            ))}
            <VideoPickerButton uri={videoUri} onPick={setVideoUri} />
            {hasResults && (
              <PrimaryButton title="View Results" onPress={() => setTab('results')} style={{ marginTop: Spacing.sm }} />
            )}
          </>
        }
        results={
          hasResults ? (
            <>
              {DESIGNS.map((design, dIdx) => {
                const vals = angles[dIdx].filter((v) => v !== '').map(Number);
                if (!vals.length) return null;
                return (
                  <MetricCard
                    key={dIdx}
                    label={design + ' — max'}
                    value={String(Math.max(...vals))}
                    unit="°"
                    color={Colors.primary}
                  />
                );
              })}
              <PrimaryButton title="Save Result" onPress={() => setShowSheet(true)} style={{ marginTop: Spacing.md }} />
            </>
          ) : (
            <Text style={styles.noResults}>Enter some angles in the Record tab first.</Text>
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
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.sm, color: Colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  distLabel: { width: 52, ...Typography.label },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 8, fontSize: 15,
    backgroundColor: Colors.surfaceAlt, marginHorizontal: Spacing.sm, textAlign: 'center',
  },
  unit: { ...Typography.caption, width: 48 },
  noResults: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
