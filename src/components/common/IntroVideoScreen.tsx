import React, { useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface IntroVideoScreenProps {
  onFinish: () => void;
}

const introVideoSource = require('../../../assets/videos/ReadOra-Intro-8sec-Clean.mp4');

export const IntroVideoScreen: React.FC<IntroVideoScreenProps> = ({ onFinish }) => {
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
    // 1. Listen for video finish event when playback completes naturally
    const subEnd = player.addListener('playToEnd', () => {
      safeFinish();
    });

    // 2. Listen for playback status changes or errors
    const subStatus = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error' || error) {
        console.warn('[IntroVideo] Playback error encountered, opening app:', error);
        safeFinish();
      }
    });

    // 3. Safety watchdog timer (8.5 seconds for 8s video) to guarantee opening the app
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
});
