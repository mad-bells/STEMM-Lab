import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '../theme';

export default function PrimaryButton({ title, onPress, loading, disabled, color = Colors.primary, style }) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: isDisabled ? Colors.border : color }, Shadow.sm, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color={Colors.white} />
        : <Text style={styles.label}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: Radius.md, paddingVertical: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});