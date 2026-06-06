import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';

export default function MetricCard({ label, value, unit, color = Colors.primary }) {
  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.row}>
          <Text style={[styles.value, { color }]}>{value ?? '—'}</Text>
          {unit ? <Text style={styles.unit}> {unit}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    flexDirection: 'row', overflow: 'hidden', marginVertical: Spacing.xs,
  },
  accent: { width: 6 },
  content: { flex: 1, padding: Spacing.sm },
  label: { ...Typography.caption, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'baseline' },
  value: { fontSize: 24, fontWeight: '800' },
  unit: { ...Typography.body, color: Colors.textSecondary },
});