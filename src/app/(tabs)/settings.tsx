import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { ReadOraLogo } from '@/components/common/ReadOraLogo';
import { useLibrary } from '@/hooks/useLibrary';
import { formatFileSize } from '@/utils/fileUtils';

export default function SettingsScreen() {
  const router = useRouter();
  const { books } = useLibrary();

  const totalStorageBytes = books.reduce((acc, b) => acc + (b.fileSizeBytes || 0), 0);

  const handleClearCache = () => {
    Alert.alert(
      'Storage Cache',
      'Local cache is currently 0 KB. No temporary reading files to clear.',
      [{ text: 'OK' }]
    );
  };

  const handleReplayOnboarding = () => {
    router.replace('/onboarding');
  };

  const handlePhase2Notice = (featureName: string) => {
    Alert.alert(
      featureName,
      'This feature is scheduled for Phase 2 along with the native PDF/EPUB rendering engine.',
      [{ text: 'Understood' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header title="Settings" subtitle="Preferences & app details" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Reader Profile Card */}
        <Card variant="goldAccent" style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={24} color={Colors.gold.primary} />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>Local Reader</Text>
              <Text style={styles.profileSub}>Private Offline Account</Text>
            </View>
            <View style={styles.activePill}>
              <Ionicons name="shield-checkmark" size={13} color={Colors.status.success} />
              <Text style={styles.activePillText}>Offline</Text>
            </View>
          </View>
        </Card>

        {/* Section 1: Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Appearance & Themes</Text>

          <Card variant="default" style={styles.settingsGroup}>
            {/* Theme 1: Midnight (Active) */}
            <View style={[styles.themeOption, styles.activeThemeOption]}>
              <View style={styles.themeLeft}>
                <View style={[styles.themeSwatch, { backgroundColor: '#0B0E14' }]} />
                <View>
                  <Text style={styles.themeName}>Deep Midnight Navy</Text>
                  <Text style={styles.themeDesc}>Signature dark reading theme</Text>
                </View>
              </View>
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.gold.primary} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>

            {/* Theme 2: Sepia */}
            <Pressable
              onPress={() => handlePhase2Notice('Warm Sepia Theme')}
              style={styles.themeOption}
            >
              <View style={styles.themeLeft}>
                <View style={[styles.themeSwatch, { backgroundColor: '#EFE7D3' }]} />
                <View>
                  <Text style={styles.themeName}>Warm Sepia</Text>
                  <Text style={styles.themeDesc}>Soft parchment tones</Text>
                </View>
              </View>
              <View style={styles.phase2Badge}>
                <Text style={styles.phase2BadgeText}>Phase 2</Text>
              </View>
            </Pressable>

            {/* Theme 3: Ivory */}
            <Pressable
              onPress={() => handlePhase2Notice('Warm Ivory Theme')}
              style={[styles.themeOption, { borderBottomWidth: 0 }]}
            >
              <View style={styles.themeLeft}>
                <View style={[styles.themeSwatch, { backgroundColor: '#FAF6EE' }]} />
                <View>
                  <Text style={styles.themeName}>Warm Ivory</Text>
                  <Text style={styles.themeDesc}>Daylight high contrast</Text>
                </View>
              </View>
              <View style={styles.phase2Badge}>
                <Text style={styles.phase2BadgeText}>Phase 2</Text>
              </View>
            </Pressable>
          </Card>
        </View>

        {/* Section 2: Reading Engine Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Reading Preferences</Text>

          <Card variant="default" style={styles.settingsGroup}>
            <Pressable
              onPress={() => handlePhase2Notice('Font & Typography Engine')}
              style={styles.settingRow}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="text-outline" size={18} color={Colors.gold.primary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Typography & Font Size</Text>
                <Text style={styles.settingSub}>16pt • Standard Serif/Sans</Text>
              </View>
              <View style={styles.phase2Badge}>
                <Text style={styles.phase2BadgeText}>Phase 2</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handlePhase2Notice('Page Turn Animation')}
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="swap-horizontal-outline" size={18} color={Colors.gold.primary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Page Turn Style</Text>
                <Text style={styles.settingSub}>Curl / Slide / Continuous</Text>
              </View>
              <View style={styles.phase2Badge}>
                <Text style={styles.phase2BadgeText}>Phase 2</Text>
              </View>
            </Pressable>
          </Card>
        </View>

        {/* Section 3: Storage & Sandbox */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Storage & Privacy</Text>

          <Card variant="default" style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons name="server-outline" size={18} color={Colors.gold.primary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Local Sandbox Storage</Text>
                <Text style={styles.settingSub}>
                  {formatFileSize(totalStorageBytes)} used
                </Text>
              </View>
              <Text style={styles.infoValue}>
                {books.length} {books.length === 1 ? 'Book' : 'Books'}
              </Text>
            </View>

            <Pressable
              onPress={handleClearCache}
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="trash-outline" size={18} color={Colors.status.error} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Clear Temporary Cache</Text>
                <Text style={styles.settingSub}>Clean cached page previews</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
            </Pressable>
          </Card>
        </View>

        {/* Section 4: About ReadOra & App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>About ReadOra</Text>

          <Card variant="default" style={styles.settingsGroup}>
            {/* Replay Onboarding Action */}
            <Pressable
              onPress={handleReplayOnboarding}
              style={styles.settingRow}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="sparkles-outline" size={18} color={Colors.gold.primary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Replay Welcome Flow</Text>
                <Text style={styles.settingSub}>View the onboarding guide again</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
            </Pressable>

            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.gold.primary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Version</Text>
                <Text style={styles.settingSub}>v1.0.0 (Phase 1 Foundation)</Text>
              </View>
              <Text style={styles.infoValue}>Release</Text>
            </View>

            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingIcon}>
                <Ionicons name="shield-outline" size={18} color={Colors.gold.primary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Privacy Philosophy</Text>
                <Text style={styles.settingSub}>100% Offline • No tracking • No ads</Text>
              </View>
              <Ionicons name="checkmark-circle" size={16} color={Colors.status.success} />
            </View>
          </Card>
        </View>

        {/* Branding Footer */}
        <View style={styles.footer}>
          <ReadOraLogo variant="transparent" width={140} />
          <Text style={styles.footerCopyright}>
            ReadOra Mobile E-Reader Companion • Phase 1
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.midnight.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  profileCard: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  profileSub: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.status.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  activePillText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.status.success,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    ...Typography.captionBold,
    color: Colors.gold.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: FontSize.xxs,
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },
  settingsGroup: {
    padding: Spacing.none,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.midnight.border,
  },
  activeThemeOption: {
    backgroundColor: Colors.midnight.surfaceElevated,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  themeSwatch: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
  },
  themeName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.text.primary,
  },
  themeDesc: {
    ...Typography.caption,
    fontSize: FontSize.xxs,
    color: Colors.text.secondary,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
  phase2Badge: {
    backgroundColor: Colors.midnight.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  phase2BadgeText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semiBold,
    color: Colors.text.tertiary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.midnight.border,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.midnight.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  settingSub: {
    ...Typography.caption,
    fontSize: FontSize.xxs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  infoValue: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  footerCopyright: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
  },
});
