import React, { useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, Text, StatusBar, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';

interface IntroVideoScreenProps {
  onFinish: () => void;
}

const introVideoSource = require('../../../assets/videos/ReadOra-Intro-8sec-Clean.mp4');

export const IntroVideoScreen: React.FC<IntroVideoScreenProps> = ({ onFinish }) => {
  const insets = useSafeAreaInsets();
  const hasFinishedRef = useRef(false);

  const safeFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onFinish();
  }, [onFinish]);

  const player = useVideoPlayer(introVideoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    // 1. Listen for video finish event
    const subEnd = player.addListener('playToEnd', () => {
      safeFinish();
    });

    // 2. Listen for playback errors
    const subStatus = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error' || error) {
        console.warn('[IntroVideo] Playback error encountered, continuing to app:', error);
        safeFinish();
      }
    });

    // 3. Safety watchdog timer (8.5 seconds max for 8s video) to prevent any hang
    const watchdogTimer = setTimeout(() => {
      safeFinish();
    }, 8500);

    return () => {
      subEnd.remove();
      subStatus.remove();
      clearTimeout(watchdogTimer);
    };
  }, [player, safeFinish]);

  return (
    <View style={styles.container}>
      <StatusBar hidden={Platform.OS === 'android'} barStyle="light-content" />
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />
      <View
        style={[
          styles.skipOverlay,
          {
            top: Math.max(insets.top + Spacing.sm, 24),
            right: Math.max(insets.right + Spacing.md, 20),
          },
        ]}
      >
        <Pressable
          onPress={safeFinish}
          style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Skip intro video"
        >
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255, 255, 255, 0.75)" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipOverlay: {
    position: 'absolute',
    zIndex: 10,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(11, 14, 20, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(229, 186, 88, 0.35)',
    borderRadius: BorderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },
});
