import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getHasCompletedOnboarding } from '@/services/preferencesService';
import { Colors } from '@/constants/colors';
import { IntroVideoScreen } from '@/components/common/IntroVideoScreen';

// Session-level flag: persists while JS process is alive (prevents replaying on back nav or tab switch)
let hasPlayedIntroThisSession = false;

export default function Index() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(!hasPlayedIntroThisSession);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const hasOnboardedRef = useRef<boolean | null>(null);

  // Preload onboarding state concurrently in background while video is playing
  useEffect(() => {
    let isMounted = true;
    getHasCompletedOnboarding()
      .then((completed) => {
        if (isMounted) {
          setHasOnboarded(completed);
          hasOnboardedRef.current = completed;
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasOnboarded(false);
          hasOnboardedRef.current = false;
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFinishIntro = useCallback(async () => {
    hasPlayedIntroThisSession = true;
    setShowIntro(false);

    let onboarded = hasOnboardedRef.current;
    if (onboarded === null) {
      try {
        onboarded = await getHasCompletedOnboarding();
      } catch {
        onboarded = false;
      }
    }
    router.replace(onboarded ? '/(tabs)/home' : '/onboarding');
  }, [router]);

  // If intro has already played in this session, immediately redirect once onboarding state is resolved
  useEffect(() => {
    if (!showIntro && hasOnboarded !== null) {
      router.replace(hasOnboarded ? '/(tabs)/home' : '/onboarding');
    }
  }, [showIntro, hasOnboarded, router]);

  if (showIntro) {
    return <IntroVideoScreen onFinish={handleFinishIntro} />;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.midnight.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ActivityIndicator size="large" color={Colors.gold.primary} />
    </View>
  );
}
