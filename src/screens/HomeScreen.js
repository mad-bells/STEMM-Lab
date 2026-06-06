/**
 * HomeScreen.js
 * Activity grid + team header.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActivityCard from '../components/ActivityCard';
import { getTeamLocal } from '../services/database';

const ACTIVITIES = [
  { number: 1, key: 'Parachute', title: 'Parachute Drop', subtitle: 'Forces & Motion', icon: 'arrow-down-circle', color: '#FFCDD2', iconColor: '#B71C1C' },
  { number: 2, key: 'SoundHunter', title: 'Sound Hunter', subtitle: 'Environmental Science', icon: 'volume-high', color: '#D1C4E9', iconColor: '#4527A0' },
  { number: 3, key: 'HandFan', title: 'Hand Fan Challenge', subtitle: 'Air Movement', icon: 'leaf', color: '#B3E5FC', iconColor: '#01579B' },
  { number: 4, key: 'Earthquake', title: 'Earthquake Structure', subtitle: 'Engineering & Earth Science', icon: 'pulse', color: '#FFF9C4', iconColor: '#F57F17' },
  { number: 5, key: 'HumanPerformance', title: 'Human Performance', subtitle: 'Biomechanics', icon: 'body', color: '#C8E6C9', iconColor: '#1B5E20' },
  { number: 6, key: 'ReactionBoard', title: 'Reaction Board', subtitle: 'Neuroscience & Maths', icon: 'flash', color: '#F8BBD0', iconColor: '#880E4F' },
  { number: 7, key: 'BreathingPace', title: 'Breathing Pace', subtitle: 'Medical Science', icon: 'heart', color: '#B2EBF2', iconColor: '#006064' },
];

export default function HomeScreen({ navigation }) {
  const [team, setTeam] = useState(null);

  useEffect(() => {
    const t = getTeamLocal();
    setTeam(t);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>STEMM Lab</Text>
            {team && (
              <View style={styles.teamRow}>
                <Ionicons name="people" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.teamName}> {team.teamName} · {team.grade}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="flask" size={28} color="rgba(255,255,255,0.9)" />
          </View>
        </View>

        {/* Section label */}
        <Text style={styles.sectionTitle}>Choose an Activity</Text>
        <Text style={styles.sectionSub}>Tap a challenge to begin. Results save automatically.</Text>

        {/* Grid */}
        <View style={styles.grid}>
          {ACTIVITIES.map((a) => (
            <ActivityCard
              key={a.key}
              number={a.number}
              title={a.title}
              subtitle={a.subtitle}
              icon={a.icon}
              color={a.color}
              iconColor={a.iconColor}
              onPress={() => navigation.navigate(a.key)}
            />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#6B66A8' },
  scroll: { flex: 1, backgroundColor: '#F1F3FA' },
  container: { paddingBottom: 32 },

  header: {
    backgroundColor: '#6B66A8',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  teamName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 16,
    marginBottom: 12,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 11,
  },
});
