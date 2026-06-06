/**
 * SoundHunterScreen.js
 * Activity 2: Sound Pollution Hunter
 * Live dB meter using the microphone. Students record noise from 3 actions.
 *
 * Device features used: Microphone (expo-av), GPS location tagging
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';
import MetricCard from '../../components/MetricCard';
import PrimaryButton from '../../components/PrimaryButton';
import useAudioLevel from '../../hooks/useAudioLevel';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';

const ACTIONS = ['Action 1 (drop book)', 'Action 2', 'Action 3'];

function getRisk(db) {
  if (db < 60) return { label: 'Safe', color: Colors.success };
  if (db < 85) return { label: 'Generally safe', color: Colors.success };
  if (db < 90) return { label: 'Caution', color: Colors.warning };
  if (db < 100) return { label: 'Risk of damage', color: Colors.error };
  return { label: 'Danger!', color: Colors.error };
}

export default function SoundHunterScreen() {
  const [measuring, setMeasuring] = useState(false);
  const [currentAction, setCurrentAction] = useState(0);
  const [recorded, setRecorded] = useState([null, null, null]);
  const [saving, setSaving] = useState(false);
  const { dB, hasPermission } = useAudioLevel(measuring);

  function startMeasure(index) {
    setCurrentAction(index);
    setMeasuring(true);
  }

  function recordReading(index) {
    const updated = [...recorded];
    updated[index] = dB;
    setRecorded(updated);
    setMeasuring(false);
  }

  async function handleSave() {
    const valid = recorded.filter(Boolean);
    if (valid.length === 0) { Alert.alert('No readings', 'Record at least one action.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const avgDb = valid.reduce((a, b) => a + b, 0) / valid.length;
      const score = Math.max(0, Math.round(100 - avgDb));

      const data = { actions: ACTIONS, readings: recorded };

      saveResultLocal(teamId, 'sound', data, score, loc?.latitude, loc?.longitude);
      await submitResult(teamId, 'sound', { ...data, score });
      await markActivityComplete(teamId, 'sound');
      await sendNotification('Activity Complete! 🔊', `Sound readings saved. Score: ${score} pts`);

      Alert.alert('Saved!', `Average: ${avgDb.toFixed(0)} dB · Score: ${score} pts`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  const risk = getRisk(dB);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Measure noise from different classroom actions. Which is loudest?
      </Text>

      {/* Live meter */}
      {measuring && (
        <View style={[styles.meterCard, Shadow.md]}>
          <Text style={styles.meterLabel}>Live Sound Level</Text>
          <Text style={styles.meterValue}>{dB}</Text>
          <Text style={styles.meterUnit}>dB</Text>
          <Text style={[styles.riskBadge, { backgroundColor: risk.color }]}>{risk.label}</Text>

          {/* Visual bar */}
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(dB, 130) / 130 * 100}%`, backgroundColor: risk.color }]} />
          </View>

          <PrimaryButton
            title={`Record for ${ACTIONS[currentAction]}`}
            onPress={() => recordReading(currentAction)}
            color={Colors.success}
            style={{ marginTop: Spacing.md }}
          />
          <TouchableOpacity onPress={() => setMeasuring(false)} style={{ marginTop: Spacing.sm, alignItems: 'center' }}>
            <Text style={{ color: Colors.textSecondary }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action rows */}
      {!measuring && (
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Record Actions</Text>
          {ACTIONS.map((action, i) => (
            <View key={i} style={styles.actionRow}>
              <View style={styles.actionInfo}>
                <Text style={styles.actionLabel}>{action}</Text>
                {recorded[i] != null && (
                  <Text style={[styles.actionValue, { color: getRisk(recorded[i]).color }]}>
                    {recorded[i]} dB — {getRisk(recorded[i]).label}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.measureBtn, { backgroundColor: recorded[i] != null ? Colors.success + '20' : Colors.primary }]}
                onPress={() => startMeasure(i)}
              >
                <Text style={{ color: recorded[i] != null ? Colors.success : Colors.white, fontWeight: '700' }}>
                  {recorded[i] != null ? '↺ Redo' : '🎙 Measure'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Results summary */}
      {recorded.some(Boolean) && !measuring && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>📊 Readings</Text>
          {recorded.map((r, i) => r != null && (
            <MetricCard key={i} label={ACTIONS[i]} value={String(r)} unit="dB" color={getRisk(r).color} />
          ))}
          <PrimaryButton title="💾 Save Result" onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }} />
        </View>
      )}

      {hasPermission === false && (
        <Text style={styles.warning}>⚠️ Microphone permission denied. Enable it in device settings.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, paddingBottom: 48 },
  intro: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.md },
  meterCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  meterLabel: { ...Typography.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  meterValue: { fontSize: 80, fontWeight: '900', color: Colors.text, lineHeight: 90 },
  meterUnit: { ...Typography.h3, color: Colors.textSecondary, marginBottom: Spacing.sm },
  riskBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: Radius.full, color: Colors.white, fontWeight: '700', overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  barBg: {
    height: 12, backgroundColor: Colors.border, borderRadius: Radius.full,
    width: '100%', overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: Radius.full },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  actionInfo: { flex: 1 },
  actionLabel: { ...Typography.body },
  actionValue: { ...Typography.bodySmall, marginTop: 2 },
  measureBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full,
  },
  resultsSection: { marginTop: Spacing.sm },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  warning: { ...Typography.body, color: Colors.error, textAlign: 'center', marginTop: Spacing.md },
});
