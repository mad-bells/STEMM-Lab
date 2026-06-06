/**
 * ParachuteScreen.js
 * Activity 1: Parachute Drop Challenge (Engineering + Physics)
 * Students design, build, and test a parachute for a small toy.
 *
 * Device features used: Timer, GPS location tagging
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
import useTimer from '../../hooks/useTimer';
import {
  finalVelocity, acceleration, netForce, weight,
  dragForce, gForceNoBounce, scoreFromTime,
} from '../../utils/calculations';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete, uploadVideo } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';
import { syncTeamToFirestore } from '../../utils/syncTeam';

const EQUIPMENT = [
  'Mobile phone with STEMM Lab app',
  'Small toy (e.g. army toy soldier)',
  'Table or elevated surface',
  'Paper or plastic',
  'String',
  'Scissors',
  'Tape',
];

const INSTRUCTIONS = [
  'Drop the toy without a parachute and record the fall (baseline test).',
  'Build a parachute using the provided materials.',
  'Drop the toy from the same height and record the fall.',
  'Review the speed and landing results in the app.',
  'Redesign and test up to three prototypes within 20 minutes.',
  'Upload your video, save results, and add your team reflection.',
];

const WRITE_UP = {
  questions: [
    'Predict which parachute design will be the best.',
    'Sketch each of your designs.',
    'Were you correct in your timing predictions?',
    'What design was the easiest to make?',
  ],
  columns: ['How long will it take to hit the ground?', 'Time (first hit the ground)', 'Were you right?', 'Time (hit to stop moving) – slow motion'],
  rows: ['Action 1 (e.g. No parachute — baseline)', 'Action 2 (e.g. plastic, 4 corners tied to toy)', 'Action 3'],
};

const SCIENCE = [
  'Gravity pulls objects downward, causing them to speed up as they fall.',
  'A parachute increases air resistance (also called drag). Drag acts upward, opposing the motion and slowing the fall.',
  'A slower fall reduces the force when the toy hits the ground, making the landing safer. Engineers improve parachute designs through repeated testing and redesign.',
];

export default function ParachuteScreen() {
  const timer = useTimer();
  const [tab, setTab] = useState('instructions');
  const [height, setHeight] = useState('');
  const [mass, setMass] = useState('');
  const [results, setResults] = useState(null);
  const [showSheet, setShowSheet] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  function compute() {
    const h = parseFloat(height);
    const m = parseFloat(mass);
    const t = timer.seconds;
    if (!h || !m || !t) return null;
    const vf = finalVelocity(h, t);
    const a = acceleration(vf, t);
    return { vf, a, nf: netForce(m, a), w: weight(m), df: dragForce(m, a), gf: gForceNoBounce(vf, 0.05), t };
  }

  function handleRecord() {
    if (timer.running) {
      timer.stop();
      const r = compute();
      setResults(r);
      if (r) setTab('results');
    } else {
      if (!parseFloat(height) || !parseFloat(mass)) {
        Alert.alert('Missing inputs', 'Enter a drop height and mass before starting.');
        return;
      }
      setResults(null);
      timer.reset();
      timer.start();
    }
  }

  async function handleSave({ rating, comment }) {
    if (!results) return;
    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const score = 100 - scoreFromTime(results.t, 0.3, 3.0);
      const videoUrl = videoUri ? await uploadVideo(teamId, 'parachute', videoUri) : null;

      const data = {
        height: parseFloat(height), mass: parseFloat(mass),
        dropTime: results.t, finalVelocity: results.vf,
        acceleration: results.a, dragForce: results.df, gForce: results.gf,
        rating, comment, videoUrl,
      };

      saveResultLocal(teamId, 'parachute', data, score, loc?.latitude, loc?.longitude);
      setShowSheet(false);
      setSaving(false);
      submitResult(teamId, 'parachute', { ...data, score }).catch(console.warn);
      markActivityComplete(teamId, 'parachute').catch(console.warn);
      syncTeamToFirestore().catch(console.warn);
      sendNotification('Activity Complete!', 'Parachute Drop result saved.').catch(console.warn);
      Alert.alert('Saved!', 'Result saved — great work!');
    } catch (err) {
      setSaving(false);
      Alert.alert('Save failed', err.message);
    }
  }

  return (
    <>
      <ActivityTabs
        tab={tab}
        onTabChange={setTab}
        hasResults={!!results}
        instructions={
          <>
            <InstructionsCard steps={INSTRUCTIONS} equipment={EQUIPMENT} writeUp={WRITE_UP} />
            <ScienceCard paragraphs={SCIENCE} />
          </>
        }
        record={
          <>
            <View style={[styles.card, Shadow.sm]}>
              <Text style={styles.cardTitle}>Setup</Text>
              <Text style={styles.fieldLabel}>Drop Height (m)</Text>
              <TextInput style={styles.input} placeholder="e.g. 1.0" keyboardType="decimal-pad"
                value={height} onChangeText={setHeight} />
              <Text style={styles.fieldLabel}>Mass of Toy (kg)</Text>
              <TextInput style={styles.input} placeholder="e.g. 0.20" keyboardType="decimal-pad"
                value={mass} onChangeText={setMass} />
            </View>

            <View style={[styles.card, Shadow.sm]}>
              <Text style={styles.cardTitle}>Drop Timer</Text>
              <Text style={styles.timerDisplay}>{timer.display}</Text>
              <PrimaryButton
                title={timer.running ? 'Stop Timer' : 'Start Drop'}
                onPress={handleRecord}
                color={timer.running ? Colors.error : Colors.primary}
              />
              {!timer.running && timer.seconds > 0 && (
                <Text style={styles.tapHint}>Tap Start to reset and drop again</Text>
              )}
            </View>
            <VideoPickerButton uri={videoUri} onPick={setVideoUri} />
          </>
        }
        results={
          results ? (
            <>
              <MetricCard label="Drop Time" value={results.t.toFixed(3)} unit="s" color={Colors.engineering} />
              <MetricCard label="Final Velocity" value={results.vf.toFixed(2)} unit="m/s" color={Colors.engineering} />
              <MetricCard label="Acceleration" value={results.a.toFixed(2)} unit="m/s²" color={Colors.primary} />
              <MetricCard label="Weight" value={results.w.toFixed(2)} unit="N" color={Colors.textSecondary} />
              <MetricCard label="Net Force" value={results.nf.toFixed(2)} unit="N" color={Colors.primary} />
              <MetricCard label="Drag Force" value={results.df.toFixed(2)} unit="N" color={Colors.success} />
              <MetricCard label="G-Force (impact)" value={results.gf.toFixed(1)} unit="g" color={Colors.secondary} />
              <PrimaryButton title="Save Result" onPress={() => setShowSheet(true)}
                style={{ marginTop: Spacing.md }} />
            </>
          ) : (
            <Text style={styles.noResults}>Complete a drop in the Record tab first.</Text>
          )
        }
      />

      <ResultSubmitSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onSubmit={handleSave}
        loading={saving}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  fieldLabel: { ...Typography.label, marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 15,
    marginBottom: Spacing.sm, backgroundColor: Colors.surfaceAlt,
  },
  timerDisplay: {
    fontSize: 52, fontWeight: '900', color: Colors.primary,
    textAlign: 'center', marginVertical: Spacing.md,
  },
  tapHint: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.xs },
  noResults: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
