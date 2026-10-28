import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius, Shadows } from '@/constants/spacing';
import { FontSize, FontWeight } from '@/constants/typography';
import { ReadOraLogo } from '@/components/common/ReadOraLogo';

interface OnboardingSlide {
  id: string;
  heroImage: any;
  tagline: string;
  title: string;
  subtitle: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    heroImage: require('../../assets/brand/hero-reading-nook.jpg'),
    tagline: 'YOUR BOOKS. YOUR WORLD.',
    title: 'Read Without Limits',
    subtitle: 'Discover, organize and enjoy your books in one beautiful place.',
  },
  {
    id: '2',
    heroImage: require('../../assets/brand/hero-splash.png'),
    tagline: 'CRAFTED FOR IMMERSION',
    title: 'Pure Reading Comfort',
    subtitle: 'Refined dark midnight and warm ivory themes designed for effortless reading sessions.',
  },
  {
    id: '3',
    heroImage: require('../../assets/brand/hero-onboarding.png'),
    tagline: '100% PRIVATE & OFFLINE',
    title: 'Your Digital Sanctum',
    subtitle: 'Keep your personal library securely organized on your device with complete privacy.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activeSlide, setActiveSlide] = useState(0);

  const isShortScreen = height < 720;
  const currentSlide = ONBOARDING_SLIDES[activeSlide];
  const isLastSlide = activeSlide === ONBOARDING_SLIDES.length - 1;

  // Responsive hero dimensions
  const heroImageWidth = Math.min(width - Spacing.xl * 2, 420);
  const heroImageHeight = isShortScreen
    ? Math.min(height * 0.32, 220)
    : Math.min(height * 0.38, 290);

  const handleNext = () => {
    if (activeSlide < ONBOARDING_SLIDES.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screenContainer}>
        {/* Top Header: Brand Logo & Skip Action */}
        <View style={styles.header}>
          <ReadOraLogo variant="transparent" width={135} />
          <Pressable
            onPress={handleSkip}
            style={styles.skipButton}
            hitSlop={{ top: 14, bottom: 14, left: 18, right: 18 }}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding and go to home screen"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Scrollable Center Content to prevent any clipping on small screens */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            isShortScreen && styles.scrollContentShort,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Hero Image Container with Cinematic Ambient Glow */}
          <View style={styles.heroOuterWrapper}>
            <View
              style={[
                styles.heroGlowHalo,
                { width: heroImageWidth * 0.85, height: heroImageHeight * 0.85 },
              ]}
            />
            <View
              style={[
                styles.heroCardFrame,
                { width: heroImageWidth, height: heroImageHeight },
              ]}
            >
              <Image
                source={currentSlide.heroImage}
                style={styles.heroImage}
                resizeMode="cover"
              />
              {/* Soft bottom vignette overlay */}
              <View style={styles.heroVignette}>
                <View style={[styles.vignetteBand, { opacity: 0.15 }]} />
                <View style={[styles.vignetteBand, { opacity: 0.4 }]} />
                <View style={[styles.vignetteBand, { opacity: 0.75 }]} />
              </View>
            </View>
          </View>

          {/* Main Content: Tagline, Headline, Subtitle */}
          <View style={styles.textContainer}>
            <View style={styles.taglineBadge}>
              <Ionicons name="sparkles" size={11} color={Colors.gold.primary} />
              <Text style={styles.taglineText}>{currentSlide.tagline}</Text>
            </View>

            <Text
              style={[
                styles.headline,
                isShortScreen && styles.headlineShort,
              ]}
              numberOfLines={2}
            >
              {currentSlide.title}
            </Text>

            <Text
              style={[
                styles.subtitle,
                isShortScreen && styles.subtitleShort,
              ]}
            >
              {currentSlide.subtitle}
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Onboarding Controls: Pagination Dots + Circular Gold Button */}
        <View
          style={[
            styles.bottomControlsRow,
            {
              paddingBottom: Math.max(
                insets.bottom,
                Platform.OS === 'android' ? Spacing.lg : Spacing.md
              ),
            },
          ]}
        >
          {/* Pagination Indicators */}
          <View
            style={styles.paginationRow}
            accessible
            accessibilityRole="tablist"
            accessibilityLabel={`Slide ${activeSlide + 1} of ${ONBOARDING_SLIDES.length}`}
          >
            {ONBOARDING_SLIDES.map((_, idx) => (
              <Pressable
                key={idx}
                onPress={() => setActiveSlide(idx)}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                accessibilityRole="tab"
                accessibilityLabel={`Go to slide ${idx + 1}`}
                accessibilityState={{ selected: idx === activeSlide }}
                style={[
                  styles.dot,
                  idx === activeSlide ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>

          {/* Circular Gold Next Button */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButtonCircle,
              pressed && styles.nextButtonCirclePressed,
            ]}
            android_ripple={{
              color: Colors.gold.deep,
              borderless: true,
              radius: 30,
            }}
            accessibilityRole="button"
            accessibilityLabel={
              isLastSlide ? 'Get Started with ReadOra' : 'Next slide'
            }
          >
            <Ionicons
              name={isLastSlide ? 'checkmark' : 'arrow-forward'}
              size={24}
              color={Colors.midnight.darkest}
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.midnight.background,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    minHeight: 48,
  },
  skipButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    color: Colors.text.secondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  scrollContentShort: {
    justifyContent: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  heroOuterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: Spacing.md,
  },
  heroGlowHalo: {
    position: 'absolute',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold.glow,
    transform: [{ scale: 1.05 }],
  },
  heroCardFrame: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 186, 88, 0.22)',
    backgroundColor: Colors.midnight.surface,
    ...Shadows.elevated,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
  },
  vignetteBand: {
    flex: 1,
    backgroundColor: Colors.midnight.background,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(229, 186, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 186, 88, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  taglineText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    letterSpacing: 0.8,
  },
  headline: {
    fontSize: 30,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.4,
    marginBottom: Spacing.xs,
  },
  headlineShort: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 320,
    letterSpacing: 0.1,
  },
  subtitleShort: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  bottomControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 26,
    backgroundColor: Colors.gold.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: Colors.midnight.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
  },
  nextButtonCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.gold.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.goldGlow,
  },
  nextButtonCirclePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.94 }],
  },
});
