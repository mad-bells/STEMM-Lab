/**
 * ResultSubmitSheet.js
 * Modal shown before saving any activity result.
 * Captures: star rating (1–5), team reflection comment.
 * Video upload is handled in the Record tab via VideoPickerButton.
 */

import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform,
  ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../theme';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.72;

export default function ResultSubmitSheet({ visible, onClose, onSubmit, loading }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  function handleSubmit() {
    if (rating === 0) return;
    onSubmit({ rating, comment: comment.trim() });
  }

  function handleClose() {
    if (!loading) {
      setRating(0);
      setComment('');
      onClose();
    }
  }

  const sheetContent = (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        <Text style={styles.title}>Save Result</Text>
        <Text style={styles.subtitle}>Rate the activity and add a team reflection.</Text>

        {/* Star Rating */}
        <Text style={styles.label}>How was this activity?</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={34}
                color={star <= rating ? '#F59E0B' : Colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 && (
          <Text style={styles.ratingLabel}>
            {['', 'Too hard', 'Hard', 'Just right', 'Easy', 'Too easy'][rating]}
          </Text>
        )}

        {/* Comment */}
        <Text style={styles.label}>Team reflection</Text>
        <TextInput
          style={styles.textInput}
          placeholder="What did you find? What would you change?"
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          editable={!loading}
          textAlignVertical="top"
          scrollEnabled={false}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (loading || rating === 0) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || rating === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Save Result</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      {/* Full-screen dim overlay — tap to dismiss */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Sheet pinned to bottom */}
      <View style={styles.kav}>
        {sheetContent}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Full-screen semi-transparent background, absolutely positioned
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  // KAV sits at the bottom, absolutely positioned
  kav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 50 : 32,
  },
  title: {
    ...Typography.h2,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    ...Typography.bodySmall,
    color: '#F59E0B',
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    ...Typography.body,
    marginBottom: Spacing.md,
    minHeight: 100,
    backgroundColor: Colors.background,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
