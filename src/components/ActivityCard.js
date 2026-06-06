import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Shadow } from '../theme';

export default function ActivityCard({ title, subtitle, icon, color = '#C5C0FF', iconColor = '#3730A3', number, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: color }, Shadow.sm]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {number != null && (
        <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.12)' }]}>
          <Text style={[styles.badgeText, { color: iconColor }]}>{number}</Text>
        </View>
      )}
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
        <Ionicons name={icon} size={26} color={iconColor} />
      </View>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
      <View style={styles.footer}>
        <Text style={[styles.startText, { color: iconColor }]}>Start</Text>
        <Ionicons name="arrow-forward" size={13} color={iconColor} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  card: {
    borderRadius: Radius.lg,
    padding: 14,
    flex: 1,
    minWidth: 140,
    maxWidth: '48%',
    margin: 5,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 18,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 15,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  startText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
