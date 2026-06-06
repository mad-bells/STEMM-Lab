/**
 * ParachuteScreen.js
 * Activity 1: Parachute Drop Challenge
 * Students drop a toy, time the fall, then the app calculates physics values.
 *
 * Device features used: Timer, GPS location tagging
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';
import MetricCard from '../../components/MetricCard';
import PrimaryButton from '../../components/PrimaryButton';
import useTimer from '../../hooks/useTimer';
import {
  finalVelocity, acceleration, netForce, weight,
  dragForce, gForceNoBounce, scoreFromTime,
} from '../../utils/calculations';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';

export default function ParachuteScreen() {
  const timer = useTimer();
  const [height, setHeight] = useState('');
  const [mass, setMass] = useState('');
  const [results, setResults] = useState(null);
  const [saving, setSaving] = useState(false);

  // Computed physics — only when we have a recorded time and inputs
  function compute() {
    const h = parseFloat(height);
    const m = parseFloat(mass);
    const t = timer.seconds;
    if (!h || !m || !t) return null;

    const vf = finalVelocity(h, t);
    const a = acceleration(vf, t);
    const nf = netForce(m, a);
    const w = weight(m);
    const df = dragForce(m, a);
    const gf = gForceNoBounce(vf, 0.05);

    return { vf, a, nf, w, df, gf, t };
  }

  function handleRecord() {
    if (timer.running) {
      timer.stop();
      const r = compute();
      setResults(r);
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

  async function handleSave() {
    if (!results) { Alert.alert('No data', 'Run the drop first.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      // Longer drop = better parachute, so invert: 3s drop → 100pts, 0.3s → 0pts
      const score = 100 - scoreFromTime(results.t, 0.3, 3.0);

      const data = {
        height: parseFloat(height),
        mass: parseFloat(mass),
        dropTime: results.t,
        finalVelocity: results.vf,
        acceleration: results.a,
        dragForce: results.df,
        gForce: results.gf,
      };

      // Save locally
      saveResultLocal(teamId, 'parachute', data, score, loc?.latitude, loc?.longitude);

      // Sync to Firestore
      await submitResult(teamId, 'parachute', { ...data, score });
      await markActivityComplete(teamId, 'parachute');

      // Reward notification
      await sendNotification('Activity Complete! 🪂', `You scored ${score} points on the Parachute Drop.`);

      Alert.alert('Saved!', `Score: ${score} pts — keep going!`);
    } catch (err) {
      Alert.alert('Save failed', err.message);
    } finally {
      setSaving(false);
    }
  }

  const computed = results;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Drop a toy from a set height and time the fall. The app calculates the forces for you.
      </Text>

      {/* Inputs */}
      <View style={[styles.card, Shadow.sm]}>
        <Text style={styles.cardTitle}>Setup</Text>

        <Text style={styles.fieldLabel}>Drop Height (m)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 1.0"
          keyboardType="decimal-pad"
          value={height}
          onChangeText={setHeight}
        />

        <Text style={styles.fieldLabel}>Mass of Toy (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 0.20"
          keyboardType="decimal-pad"
          value={mass}
          onChangeText={setMass}
        />
      </View>

      {/* Timer */}
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

      {/* Results */}
      {computed && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Results</Text>
          <MetricCard label="Drop Time" value={computed.t.toFixed(3)} unit="s" color={Colors.engineering} />
          <MetricCard label="Final Velocity" value={computed.vf.toFixed(2)} unit="m/s" color={Colors.engineering} />
          <MetricCard label="Acceleration" value={computed.a.toFixed(2)} unit="m/s²" color={Colors.primary} />
          <MetricCard label="Weight" value={computed.w.toFixed(2)} unit="N" color={Colors.textSecondary} />
          <MetricCard label="Net Force" value={computed.nf.toFixed(2)} unit="N" color={Colors.primary} />
          <MetricCard label="Drag Force" value={computed.df.toFixed(2)} unit="N" color={Colors.success} />
          <MetricCard label="G-Force (impact)" value={computed.gf.toFixed(1)} unit="g" color={Colors.secondary} />

          <PrimaryButton
            title="Save Result"
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: Spacing.md }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, paddingBottom: 48 },
  intro: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  fieldLabel: { ...Typography.label, marginBottom: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  timerDisplay: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.primary,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  tapHint: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.xs },
  resultsSection: { marginTop: Spacing.sm },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.sm },
});
