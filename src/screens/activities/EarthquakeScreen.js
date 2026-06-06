/**
 * EarthquakeScreen.js
 * Activity 4: Earthquake-Resistant Structure
 * Accelerometer reads vibration intensity while phone is on the structure.
 *
 * Device features used: Accelerometer (expo-sensors), GPS
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';
import MetricCard from '../../components/MetricCard';
import PrimaryButton from '../../components/PrimaryButton';
import useAccelerometer from '../../hooks/useAccelerometer';
import { scoreFromMagnitude } from '../../utils/calculations';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';

const DESIGNS = ['Design 1', 'Design 2', 'Design 3'];

export default function EarthquakeScreen() {
  const { x, y, z, magnitude, available } = useAccelerometer(100);
  const [recording, setRecording] = useState(false);
  const [currentDesign, setCurrentDesign] = useState(0);
  const [maxMags, setMaxMags] = useState([null, null, null]);
  const maxRef = useRef(0);
  const [saving, setSaving] = useState(false);

  // While recording, track peak magnitude for current design
  if (recording && magnitude - 1 > maxRef.current) {
    maxRef.current = magnitude - 1; // subtract 1g of gravity
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

  async function handleSave() {
    const valid = maxMags.filter((v) => v !== null);
    if (!valid.length) { Alert.alert('No data', 'Record at least one design first.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const bestMag = Math.min(...valid.map(Number));
      const score = scoreFromMagnitude(bestMag, 0, 3);

      const data = { designs: DESIGNS, maxMagnitudes: maxMags };

      saveResultLocal(teamId, 'earthquake', data, score, loc?.latitude, loc?.longitude);
      await submitResult(teamId, 'earthquake', { ...data, score });
      await markActivityComplete(teamId, 'earthquake');
      await sendNotification('Activity Complete! 🏗️', `Earthquake structure saved. Score: ${score} pts`);

      Alert.alert('Saved!', `Best vibration: ${bestMag.toFixed(3)} m/s² · Score: ${score} pts`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Place the phone on your structure. Press Start to measure how much it vibrates.
        Less movement = better design!
      </Text>

      {/* Live sensor */}
      {recording ? (
        <View style={[styles.liveCard, Shadow.md]}>
          <Text style={styles.liveTitle}>📡 Recording Design {currentDesign + 1}…</Text>
          <Text style={styles.liveValue}>{(Math.max(0, magnitude - 1)).toFixed(3)}</Text>
          <Text style={styles.liveUnit}>m/s² vibration</Text>
          <Text style={styles.peakText}>Peak: {maxRef.current.toFixed(3)} m/s²</Text>
          <PrimaryButton title="⏹ Stop Recording" onPress={stopRecording} color={Colors.error} style={{ marginTop: Spacing.md }} />
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
                title={maxMags[i] != null ? '↺ Redo' : '▶ Start'}
                onPress={() => startRecording(i)}
                color={maxMags[i] != null ? Colors.accent : Colors.primary}
                style={styles.smallBtn}
              />
            </View>
          ))}
        </View>
      )}

      {/* Results */}
      {maxMags.some((v) => v !== null) && !recording && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>📊 Results</Text>
          {maxMags.map((m, i) => m != null && (
            <MetricCard key={i} label={DESIGNS[i]} value={m} unit="m/s²" color={Colors.warning} />
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  intro: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.md },
  liveCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md,
  },
  liveTitle: { ...Typography.h4, color: Colors.primary, marginBottom: Spacing.sm },
  liveValue: { fontSize: 64, fontWeight: '900', color: Colors.warning },
  liveUnit: { ...Typography.body, color: Colors.textSecondary, marginBottom: 4 },
  peakText: { ...Typography.label, color: Colors.error },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  designRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  designInfo: { flex: 1 },
  designLabel: { ...Typography.body },
  smallBtn: { paddingHorizontal: Spacing.md, paddingVertical: 8, minWidth: 80 },
  resultsSection: { marginTop: Spacing.sm },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  unavailable: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
