import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform, BackHandler } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants/colors';

import { LibraryProvider } from '@/context/LibraryContext';

// Prevent splash screen from auto-hiding until ready
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen once root is ready
    SplashScreen.hideAsync().catch(() => {
      /* ignore */
    });

    if (Platform.OS === 'android') {
      const backAction = () => {
        // Standard Android back navigation
        return false;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );
      return () => backHandler.remove();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <LibraryProvider>
        <View style={styles.rootContainer}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.midnight.background },
              animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="reader/[id]"
              options={{ presentation: 'fullScreenModal', headerShown: false }}
            />
          </Stack>
        </View>
      </LibraryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.midnight.background,
  },
});
