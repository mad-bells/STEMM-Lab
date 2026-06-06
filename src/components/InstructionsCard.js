/**
 * InstructionsCard.js
 * Always-visible card: equipment list, numbered instructions, write-up questions + proper table.
 * Lives inside the Instructions tab.
 *
 * writeUp prop shape:
 *   {
 *     questions: string[],          // pre-activity questions to answer on paper
 *     columns:   string[],          // table column headers
 *     rows:      string[],          // table row labels (left-most column)
 *   }
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';

const COL_WIDTH = 90;   // data column width
const ROW_LABEL_W = 110; // first column (row label) width

export default function InstructionsCard({ title = 'How to do this activity', steps, equipment, writeUp }) {
  return (
    <View style={[styles.card, Shadow.sm]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.divider} />

      {/* ── Equipment ── */}
      {equipment && equipment.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-outline" size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Equipment needed</Text>
          </View>
          {equipment.map((item, i) => (
            <View key={i} style={styles.equipRow}>
              <Ionicons name="checkmark-circle-outline" size={15} color={Colors.primary} style={{ marginTop: 2 }} />
              <Text style={styles.equipText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {equipment && equipment.length > 0 && <View style={styles.divider} />}

      {/* ── Steps ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Instructions</Text>
        </View>
        {steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* ── Write-up ── */}
      {writeUp && (
        <>
          <View style={styles.divider} />
          <View style={styles.writeUpBox}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={16} color={Colors.warning} />
              <Text style={[styles.sectionTitle, { color: Colors.warning }]}>
                Write-up (complete on paper)
              </Text>
            </View>

            {/* Pre-activity questions */}
            {writeUp.questions && writeUp.questions.map((q, i) => (
              <View key={i} style={styles.questionRow}>
                <Text style={styles.questionBullet}>Q{i + 1}.</Text>
                <Text style={styles.questionText}>{q}</Text>
              </View>
            ))}

            {/* Table */}
            {writeUp.columns && writeUp.rows && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
                <View>
                  {/* Header row */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableCell, styles.tableHeaderCell, { width: ROW_LABEL_W }]}>
                      <Text style={styles.tableHeaderText}>Action</Text>
                    </View>
                    {writeUp.columns.map((col, ci) => (
                      <View key={ci} style={[styles.tableCell, styles.tableHeaderCell, { width: COL_WIDTH }]}>
                        <Text style={styles.tableHeaderText}>{col}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Data rows */}
                  {writeUp.rows.map((row, ri) => (
                    <View key={ri} style={[styles.tableRow, ri % 2 === 1 && styles.tableRowAlt]}>
                      <View style={[styles.tableCell, styles.tableRowLabelCell, { width: ROW_LABEL_W }]}>
                        <Text style={styles.tableRowLabelText}>{row}</Text>
                      </View>
                      {writeUp.columns.map((_, ci) => (
                        <View key={ci} style={[styles.tableCell, { width: COL_WIDTH }]}>
                          <Text style={styles.tableCellEmpty} />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: Spacing.md,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  section: {
    marginBottom: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  equipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  equipText: {
    ...Typography.body,
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 20,
  },

  /* Write-up section */
  writeUpBox: {
    backgroundColor: Colors.warning + '10',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  questionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  questionBullet: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.warning,
    width: 22,
  },
  questionText: {
    ...Typography.bodySmall,
    flex: 1,
    lineHeight: 18,
  },

  /* Table */
  tableScroll: {
    marginTop: Spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowAlt: {
    backgroundColor: Colors.warning + '08',
  },
  tableCell: {
    borderWidth: 1,
    borderColor: Colors.warning + '60',
    padding: 6,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeaderCell: {
    backgroundColor: Colors.warning + '25',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  tableRowLabelCell: {
    backgroundColor: Colors.warning + '15',
    alignItems: 'flex-start',
  },
  tableRowLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text,
  },
  tableCellEmpty: {
    height: 14,
  },
});
