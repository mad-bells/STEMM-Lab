/**
 * ScienceCard.js
 * Collapsible "Science Behind It" explanation card.
 * Shows plain-language theory for each activity.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';

/**
 * Props:
 *   paragraphs  {string[]}  – one or more plain-language explanation paragraphs
 */
export default function ScienceCard({ paragraphs }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.card, Shadow.sm]}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Ionicons name="flask" size={18} color={styles.accent.color} />
          <Text style={styles.headerText}>The science behind it</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {paragraphs.map((p, i) => (
            <Text key={i} style={[styles.paragraph, i > 0 && { marginTop: Spacing.sm }]}>
              {p}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const SCIENCE_COLOR = '#2E7D32'; // dark green

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: SCIENCE_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accent: {
    color: SCIENCE_COLOR,
  },
  headerText: {
    ...Typography.h4,
    color: SCIENCE_COLOR,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    padding: Spacing.md,
  },
  paragraph: {
    ...Typography.body,
    lineHeight: 21,
    color: Colors.text,
  },
});
