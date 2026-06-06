/**
 * ActivityTabs.js
 * 3-tab layout used by every activity screen.
 * Tabs sit at the BOTTOM of the screen, large and clear.
 * Tabs: Instructions | Record | Results
 *
 * Usage:
 *   const [tab, setTab] = useState('record');
 *   <ActivityTabs tab={tab} onTabChange={setTab} hasResults={!!results}
 *     instructions={<>...</>}
 *     record={<>...</>}
 *     results={<>...</>}
 *   />
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../theme';

const TABS = [
  { key: 'instructions', label: 'Instructions', icon: 'book-outline' },
  { key: 'record',       label: 'Record',       icon: 'radio-button-on-outline' },
  { key: 'results',      label: 'Results',      icon: 'bar-chart-outline' },
];

export default function ActivityTabs({ tab, onTabChange, hasResults, instructions, record, results }) {
  return (
    <View style={styles.wrapper}>
      {/* Scrollable tab content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {tab === 'instructions' && instructions}
        {tab === 'record'       && record}
        {tab === 'results'      && results}
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          const disabled = t.key === 'results' && !hasResults;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => !disabled && onTabChange(t.key)}
              activeOpacity={disabled ? 1 : 0.7}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={t.icon}
                  size={24}
                  color={active ? Colors.primary : disabled ? Colors.border : Colors.textSecondary}
                />
                {t.key === 'results' && hasResults && !active && (
                  <View style={styles.dot} />
                )}
              </View>
              <Text style={[
                styles.tabLabel,
                active && styles.tabLabelActive,
                disabled && styles.tabLabelDisabled,
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: Spacing.md,
    paddingBottom: 24,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingBottom: 8, // safe area buffer
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 3,
    borderTopColor: 'transparent',
  },
  tabBtnActive: {
    borderTopColor: Colors.primary,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 3,
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tabLabelDisabled: {
    color: Colors.border,
  },
});
