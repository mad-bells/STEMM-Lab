/**
 * VideoPickerButton.js
 * Reusable button to pick a video from the camera roll.
 * Place in the Record tab so students can attach footage mid-experiment.
 *
 * Props:
 *   uri     - current video URI (string | null)
 *   onPick  - called with the selected URI, or null when removed
 *   style   - optional container style override
 */

import React, { useState } from 'react';
import {
  TouchableOpacity, Text, View,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../theme';

export default function VideoPickerButton({ uri, onPick, style }) {
  const [picking, setPicking] = useState(false);

  async function launchPicker(useCamera) {
    setPicking(true);
    try {
      const ImagePicker = await import('expo-image-picker');

      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission needed', 'Allow camera access to record a video.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['videos'],
          videoMaxDuration: 120,
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) onPick(result.assets[0].uri);
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission needed', 'Allow photo library access to attach a video.');
          return;
        }
        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: false,
            quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0]) onPick(result.assets[0].uri);
        } catch (err) {
          // PHPhotosErrorDomain 3164 = iCloud video not downloaded / limited access
          console.warn('[VideoPickerButton] library error:', err?.message);
          Alert.alert(
            'Cannot access video',
            'This can happen if the video is stored in iCloud (not downloaded to device) or photo access is set to "Limited".\n\nTry:\n• Download the video to your device first\n• Go to Settings → STEMM Lab → Photos → Allow access to all photos\n• Or use "Record video" to capture new footage.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err) {
      console.error('[VideoPickerButton] error:', err);
      Alert.alert('Error', err?.message ?? 'Could not open video picker.');
    } finally {
      setPicking(false);
    }
  }

  function showOptions() {
    Alert.alert(
      'Attach video',
      'Choose a source',
      [
        { text: 'Record video', onPress: () => launchPicker(true) },
        { text: 'Choose from library', onPress: () => launchPicker(false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.btn, uri && styles.btnDone]}
        onPress={uri ? undefined : showOptions}
        disabled={picking}
        activeOpacity={0.75}
      >
        {picking ? (
          <ActivityIndicator color={Colors.primary} size="small" style={{ marginRight: 8 }} />
        ) : (
          <Ionicons
            name={uri ? 'checkmark-circle' : 'videocam-outline'}
            size={28}
            color={uri ? Colors.success : Colors.primary}
            style={{ marginRight: 12 }}
          />
        )}
        <Text style={[styles.btnText, uri && styles.btnTextDone]}>
          {picking ? 'Opening…' : uri ? 'Video attached' : 'Attach experiment video'}
        </Text>
      </TouchableOpacity>

      {uri && (
        <TouchableOpacity onPress={() => onPick(null)} style={styles.remove}>
          <Text style={styles.removeText}>Remove video</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 64,
  },
  btnDone: {
    borderColor: Colors.success,
    borderStyle: 'solid',
    backgroundColor: Colors.success + '14',
  },
  btnText: {
    ...Typography.body,
    color: Colors.primary,
    flex: 1,
    fontWeight: '600',
    fontSize: 16,
  },
  btnTextDone: {
    color: Colors.success,
    fontWeight: '600',
  },
  remove: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  removeText: {
    ...Typography.bodySmall,
    color: Colors.error,
  },
});
