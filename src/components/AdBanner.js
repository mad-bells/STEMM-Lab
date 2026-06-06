/**
 * AdBanner.js
 * Google AdMob banner wrapper.
 *
 * Uses react-native-google-mobile-ads which requires a native build (EAS).
 * In Expo Go (appOwnership === 'expo'), renders a labelled placeholder so
 * the layout is preserved without crashing.
 *
 * Ad unit IDs are read from app.json extra via expo-constants — never
 * hard-coded in source files.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { Colors } from '../theme';

const isExpoGo = Constants.appOwnership === 'expo';

const BANNER_ID = Platform.select({
  ios:     Constants.expoConfig?.extra?.admobBannerIosId,
  android: Constants.expoConfig?.extra?.admobBannerAndroidId,
});

export default function AdBanner({ style }) {
  // In Expo Go, native AdMob module is unavailable — show a placeholder
  if (isExpoGo) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>[ AdMob Banner — visible in EAS build ]</Text>
      </View>
    );
  }

  // In a real native build, render the actual AdMob banner
  try {
    const { BannerAd, BannerAdSize, TestIds } = require('react-native-google-mobile-ads');
    const adUnitId = BANNER_ID ?? TestIds.BANNER;

    return (
      <View style={[styles.container, style]}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={(err) => console.warn('[AdBanner] failed to load:', err.message)}
        />
      </View>
    );
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  placeholder: {
    height: 52,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 6,
  },
  placeholderText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
