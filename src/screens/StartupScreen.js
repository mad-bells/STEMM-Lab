/**
 * StartupScreen.js
 * Team setup screen shown on first launch.
 * Collects: Team Name, Member names, Grade/Year Level.
 * Generates a unique Team Discriminator and saves to SQLite + Firestore.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { saveTeamLocal, getTeamLocal } from '../services/database';
import { signInAnon, saveTeam } from '../services/firebase';
import { requestNotificationPermission } from '../services/notifications';

const GRADES = ['Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'];

function generateDiscriminator() {
  // 6-char alphanumeric code unique to this team session
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function StartupScreen({ navigation }) {
  const [teamName, setTeamName] = useState('');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  const [grade, setGrade] = useState(GRADES[0]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // If team already exists, go straight to Main
  useEffect(() => {
    const existing = getTeamLocal();
    if (existing) {
      navigation.replace('Main');
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) return null;

  async function handleStart() {
    if (!teamName.trim()) {
      Alert.alert('Missing info', 'Please enter a team name.');
      return;
    }
    if (!member1.trim()) {
      Alert.alert('Missing info', 'Please enter at least one team member.');
      return;
    }

    setLoading(true);
    try {
      const discriminator = generateDiscriminator();
      const members = [member1.trim(), member2.trim()].filter(Boolean);

      // 1. Save locally first (offline-first)
      saveTeamLocal(discriminator, teamName.trim(), members, grade);
      await AsyncStorage.setItem('teamId', discriminator);

      // 2. Sign in to Firebase anonymously
      await signInAnon();

      // 3. Sync to Firestore
      await saveTeam(discriminator, {
        teamName: teamName.trim(),
        members,
        grade,
        discriminator,
      });

      // 4. Request notification permission
      await requestNotificationPermission();

      navigation.replace('Main');
    } catch (err) {
      console.error(err);
      // Still navigate — local data was saved
      navigation.replace('Main');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🔬</Text>
          <Text style={styles.appName}>STEMM Lab</Text>
          <Text style={styles.tagline}>Real-world science challenges</Text>
        </View>

        {/* Form card */}
        <View style={[styles.card, Shadow.md]}>
          <Text style={styles.sectionTitle}>Set up your team</Text>

          <Text style={styles.fieldLabel}>Team Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. The Rocket Scientists"
            value={teamName}
            onChangeText={setTeamName}
            maxLength={40}
          />

          <Text style={styles.fieldLabel}>Member 1 *</Text>
          <TextInput
            style={styles.input}
            placeholder="First name"
            value={member1}
            onChangeText={setMember1}
            maxLength={30}
          />

          <Text style={styles.fieldLabel}>Member 2</Text>
          <TextInput
            style={styles.input}
            placeholder="First name (optional)"
            value={member2}
            onChangeText={setMember2}
            maxLength={30}
          />

          <Text style={styles.fieldLabel}>Grade / Year Level</Text>
          <View style={styles.gradeRow}>
            {GRADES.map((g) => (
              <GradeChip
                key={g}
                label={g}
                selected={grade === g}
                onPress={() => setGrade(g)}
              />
            ))}
          </View>
        </View>

        <PrimaryButton
          title="Let's Go! 🚀"
          onPress={handleStart}
          loading={loading}
          style={styles.startBtn}
        />

        <Text style={styles.disclaimer}>
          No account needed. Your team data is stored locally and synced anonymously.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GradeChip({ label, selected, onPress }) {
  return (
    <Text
      style={[styles.gradeChip, selected && styles.gradeChipSelected]}
      onPress={onPress}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: 48 },
  header: { alignItems: 'center', paddingVertical: Spacing.xl },
  logo: { fontSize: 48 },
  appName: { fontSize: 28, fontWeight: '900', color: Colors.primary, marginTop: Spacing.sm },
  tagline: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md },
  fieldLabel: { ...Typography.label, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
  },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  gradeChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.textSecondary,
    overflow: 'hidden',
  },
  gradeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    color: Colors.white,
    fontWeight: '600',
  },
  startBtn: { marginBottom: Spacing.md },
  disclaimer: { ...Typography.caption, textAlign: 'center', color: Colors.textLight },
});
