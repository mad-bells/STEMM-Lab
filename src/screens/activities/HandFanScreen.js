/**
 * HandFanScreen.js
 * Activity 3: Hand Fan Challenge
 * Students record bend angles for 3 fan designs at 3 distances.
 * No special sensor needed — manual data entry + GPS tagging.
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';
import MetricCard from '../../components/MetricCard';
import PrimaryButton from '../../components/PrimaryButton';
import { saveResultLocal } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { submitResult, markActivityComplete } from '../../services/firebase';
import { sendNotification } from '../../services/notifications';

const DESIGNS = ['Design 1 (1cm folds)', 'Design 2 (no folds)', 'Design 3'];
const DISTANCES = ['15cm', '30cm', '45cm'];

export default function HandFanScreen() {
  // angles[design][distance] = string
  const [angles, setAngles] = useState(DESIGNS.map(() => DISTANCES.map(() => '')));
  const [saving, setSaving] = useState(false);

  function setAngle(dIdx, distIdx, val) {
    const updated = angles.map((row) => [...row]);
    updated[dIdx][distIdx] = val;
    setAngles(updated);
  }

  async function handleSave() {
    const flat = angles.flat().filter((v) => v !== '');
    if (!flat.length) { Alert.alert('No data', 'Enter at least one bend angle.'); return; }

    setSaving(true);
    try {
      const teamId = await AsyncStorage.getItem('teamId');
      const loc = await getCurrentLocation();
      const maxAngle = Math.max(...flat.map(Number));
      const score = Math.min(100, Math.round(maxAngle));

      const data = { designs: DESIGNS, distances: DISTANCES, angles };

      saveResultLocal(teamId, 'handfan', data, score, loc?.latitude, loc?.longitude);
      await submitResult(teamId, 'handfan', { ...data, score });
      await markActivityComplete(teamId, 'handfan');
      await sendNotification('Activity Complete! 🌀', `Hand Fan result saved. Score: ${score} pts`);

      Alert.alert('Saved!', `Max bend: ${maxAngle}° · Score: ${score} pts`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Fan paper from different distances with each design. Record the bend angle in degrees.
      </Text>

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

      <PrimaryButton title="💾 Save Result" onPress={handleSave} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, paddingBottom: 48 },
  intro: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.sm, color: Colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  distLabel: { width: 48, ...Typography.label },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 8, fontSize: 15,
    backgroundColor: Colors.surfaceAlt, marginHorizontal: Spacing.sm,
    textAlign: 'center',
  },
  unit: { ...Typography.caption, width: 44 },
});
