/**
 * TeamScreen.js
 * View and edit team profile (name, members, grade).
 * Changes are saved to SQLite and re-synced to Firestore.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { getTeamLocal, saveTeamLocal } from '../services/database';
import { saveTeam } from '../services/firebase';

const GRADES = ['Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'];
const MAX_MEMBERS = 4;

export default function TeamScreen() {
  const [team, setTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState(['', '', '', '']);
  const [grade, setGrade] = useState(GRADES[0]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const t = getTeamLocal();
      if (t) {
        setTeam(t);
        setTeamName(t.teamName);
        // Pad members array to MAX_MEMBERS slots
        const padded = [...(t.members || []), '', '', '', ''].slice(0, MAX_MEMBERS);
        setMembers(padded);
        setGrade(t.grade || GRADES[0]);
      }
      setSaved(false);
    }, [])
  );

  async function handleSave() {
    if (!teamName.trim()) {
      Alert.alert('Missing info', 'Team name cannot be empty.');
      return;
    }
    const cleanMembers = members.map(m => m.trim()).filter(Boolean);
    if (cleanMembers.length === 0) {
      Alert.alert('Missing info', 'Add at least one team member.');
      return;
    }

    setSaving(true);
    try {
      saveTeamLocal(team.id, teamName.trim(), cleanMembers, grade);
      await saveTeam(team.id, {
        teamName: teamName.trim(),
        members: cleanMembers,
        grade,
        discriminator: team.id,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      // Local save succeeded; Firestore will re-sync on next launch
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function updateMember(index, value) {
    setMembers(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  if (!team) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const filledCount = members.filter(m => m.trim()).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Team</Text>
          <Text style={styles.subtitle}>Edit your team details below</Text>
          <View style={styles.idBadge}>
            <Ionicons name="key-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.idText}> Team ID: {team.id}</Text>
          </View>
        </View>

        {/* Team Name */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.label}>Team Name</Text>
          <TextInput
            style={styles.input}
            value={teamName}
            onChangeText={setTeamName}
            placeholder="e.g. The Rocket Scientists"
            maxLength={40}
          />
        </View>

        {/* Members */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.label}>Team Members ({filledCount}/{MAX_MEMBERS})</Text>
          {members.map((m, i) => (
            <View key={i} style={styles.memberRow}>
              <View style={styles.memberNum}>
                <Text style={styles.memberNumText}>{i + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.memberInput]}
                value={m}
                onChangeText={v => updateMember(i, v)}
                placeholder={i === 0 ? 'First name (required)' : 'First name (optional)'}
                maxLength={30}
              />
            </View>
          ))}
        </View>

        {/* Grade */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.label}>Grade / Year Level</Text>
          <View style={styles.gradeRow}>
            {GRADES.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.gradeChip, grade === g && styles.gradeChipSelected]}
                onPress={() => setGrade(g)}
              >
                <Text style={[styles.gradeText, grade === g && styles.gradeTextSelected]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save */}
        <PrimaryButton
          title={saved ? '✓ Saved!' : 'Save Changes'}
          onPress={handleSave}
          loading={saving}
          style={[styles.saveBtn, saved && styles.saveBtnDone]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flex: 1, backgroundColor: '#F1F3FA' },
  container: { paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F3FA' },

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '900', color: '#fff' },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 3 },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  idText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'monospace' },

  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  label: { ...Typography.label, marginBottom: Spacing.sm },

  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: '#F9FAFB',
  },

  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  memberNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberNumText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  memberInput: { flex: 1 },

  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  gradeChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  gradeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  gradeText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  gradeTextSelected: { color: '#fff', fontWeight: '700' },

  saveBtn: { marginHorizontal: Spacing.md, marginTop: Spacing.lg },
  saveBtnDone: { backgroundColor: '#22C55E' },
});
