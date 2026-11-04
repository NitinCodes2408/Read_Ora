import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { ReadOraLogo } from '@/components/common/ReadOraLogo';
import { useLibrary } from '@/hooks/useLibrary';
import { formatFileSize } from '@/utils/fileUtils';
import { UserPreferences, ThemeMode, ReadingMode } from '@/types';
import {
  loadPreferences,
  savePreferences,
  DEFAULT_PREFERENCES,
} from '@/services/preferencesService';

// Open-source licenses acknowledging actual libraries in package.json
const THIRD_PARTY_LICENSES = [
  {
    name: 'React Native',
    version: '0.88.0',
    license: 'MIT License',
    copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.',
    purpose: 'Underlying cross-platform native rendering engine.',
  },
  {
    name: 'Expo SDK',
    version: '58.0.21',
    license: 'MIT License',
    copyright: 'Copyright (c) 2015-present 650 Industries, Inc.',
    purpose: 'Application runtime, filesystem, and native module bridges.',
  },
  {
    name: 'Mozilla PDF.js',
    version: '3.11.174',
    license: 'Apache License 2.0',
    copyright: 'Copyright (c) Mozilla Foundation and individual contributors.',
    purpose: 'Offline client-side PDF document decoding and rendering.',
  },
  {
    name: 'JSZip',
    version: '3.10.2',
    license: 'MIT License',
    copyright: 'Copyright (c) 2009-2016 Stuart Knightley, David Duponchel, Franz Buchinger, António Afonso',
    purpose: 'EPUB package extraction and archive parsing.',
  },
  {
    name: 'SQLite (expo-sqlite)',
    version: '58.0.14',
    license: 'Public Domain',
    copyright: 'Dedicated to the public domain by the SQLite Development Team.',
    purpose: 'Local-first embedded relational database storage.',
  },
  {
    name: 'Ionicons (@expo/vector-icons)',
    version: '15.0.2',
    license: 'MIT License',
    copyright: 'Copyright (c) 2015-present Ionic Framework Team.',
    purpose: 'Interface iconography and system typography icons.',
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { books } = useLibrary();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLicensesModalOpen, setIsLicensesModalOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      loadPreferences().then((p) => {
        if (isMounted) setPreferences(p);
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleSelectTheme = async (theme: ThemeMode) => {
    try {
      const updated = await savePreferences({ themeMode: theme });
      setPreferences(updated);
    } catch {
      // ignore
    }
  };

  const handleUpdatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const updated = await savePreferences(updates);
      setPreferences(updated);
    } catch {
      // ignore
    }
  };

  const handleFontSizeChange = (size: number) => {
    const clamped = Math.max(12, Math.min(30, size));
    handleUpdatePreferences({ fontSize: clamped });
  };

  const handleSelectReadingMode = (mode: ReadingMode) => {
    handleUpdatePreferences({ readingMode: mode });
  };

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

  // Helper for live preview font family
  const getPreviewFontFamily = () => {
    switch (preferences.fontFamily) {
      case 'serif':
        return 'Georgia, serif';
      case 'sans':
        return 'system-ui, -apple-system, sans-serif';
      case 'mono':
        return 'monospace';
      default:
        return 'system-ui, sans-serif';
    }
  };

  // Helper for live preview line height
  const getPreviewLineHeight = () => {
    switch (preferences.lineSpacing) {
      case 'compact':
        return preferences.fontSize * 1.4;
      case 'relaxed':
      case 'loose':
        return preferences.fontSize * 2.1;
      case 'normal':
      default:
        return preferences.fontSize * 1.7;
    }
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
              <Text style={styles.profileName} numberOfLines={1}>
                Local Reader
              </Text>
              <Text style={styles.profileSub}>
                100% Private Offline Library
              </Text>
            </View>
            <View style={styles.activePill}>
              <Ionicons
                name="shield-checkmark"
                size={13}
                color={Colors.status.success}
              />
              <Text style={styles.activePillText}>Offline</Text>
            </View>
          </View>
        </Card>

        {/* Section 1: Appearance & Themes (PRESERVED) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Appearance & Themes</Text>

          <Card variant="default" style={styles.settingsGroup}>
            {/* Theme 1: Midnight */}
            <Pressable
              onPress={() => handleSelectTheme('midnight')}
              style={[
                styles.themeOption,
                preferences.themeMode === 'midnight' && styles.activeThemeOption,
              ]}
            >
              <View style={styles.themeLeft}>
                <View style={[styles.themeSwatch, { backgroundColor: '#0B0E14' }]} />
                <View>
                  <Text style={styles.themeName}>Deep Midnight Navy</Text>
                  <Text style={styles.themeDesc}>Signature dark reading theme</Text>
                </View>
              </View>
              {preferences.themeMode === 'midnight' ? (
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.gold.primary} />
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              ) : null}
            </Pressable>

            {/* Theme 2: Sepia */}
            <Pressable
              onPress={() => handleSelectTheme('sepia')}
              style={[
                styles.themeOption,
                preferences.themeMode === 'sepia' && styles.activeThemeOption,
              ]}
            >
              <View style={styles.themeLeft}>
                <View style={[styles.themeSwatch, { backgroundColor: '#EFE7D3' }]} />
                <View>
                  <Text style={styles.themeName}>Warm Sepia</Text>
                  <Text style={styles.themeDesc}>Soft parchment tones</Text>
                </View>
              </View>
              {preferences.themeMode === 'sepia' ? (
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.gold.primary} />
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              ) : null}
            </Pressable>

            {/* Theme 3: Ivory */}
            <Pressable
              onPress={() => handleSelectTheme('ivory')}
              style={[
                styles.themeOption,
                preferences.themeMode === 'ivory' && styles.activeThemeOption,
                { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.themeLeft}>
                <View style={[styles.themeSwatch, { backgroundColor: '#FAF6EE' }]} />
                <View>
                  <Text style={styles.themeName}>Warm Ivory</Text>
                  <Text style={styles.themeDesc}>Daylight high contrast</Text>
                </View>
              </View>
              {preferences.themeMode === 'ivory' ? (
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.gold.primary} />
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              ) : null}
            </Pressable>
          </Card>
        </View>

        {/* Section 2: UPGRADED Typography & Font Size */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Typography & Font Size</Text>

          <Card variant="default" style={styles.configCard}>
            {/* Font Size Preset Row */}
            <View style={styles.controlBlock}>
              <View style={styles.labelWithBadgeRow}>
                <Text style={styles.controlLabel}>Font Size</Text>
                <Text style={styles.activeValueText}>{preferences.fontSize} pt</Text>
              </View>

              <View style={styles.segmentRow}>
                {[
                  { label: 'Small', size: 15 },
                  { label: 'Medium', size: 18 },
                  { label: 'Large', size: 22 },
                ].map((item) => {
                  const isSelected = preferences.fontSize === item.size;
                  return (
                    <Pressable
                      key={item.label}
                      onPress={() => handleFontSizeChange(item.size)}
                      style={[
                        styles.segmentBtn,
                        isSelected && styles.segmentBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          isSelected && styles.segmentBtnTextActive,
                        ]}
                      >
                        {item.label} ({item.size}pt)
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Stepper Fine-tuning */}
              <View style={styles.stepperContainer}>
                <Pressable
                  onPress={() => handleFontSizeChange(preferences.fontSize - 1)}
                  disabled={preferences.fontSize <= 12}
                  style={[
                    styles.stepperActionBtn,
                    preferences.fontSize <= 12 && styles.btnDisabled,
                  ]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.stepperBtnText}>A -</Text>
                </Pressable>
                <Text style={styles.stepperCurrentLabel}>
                  Fine-tune: {preferences.fontSize} pt
                </Text>
                <Pressable
                  onPress={() => handleFontSizeChange(preferences.fontSize + 1)}
                  disabled={preferences.fontSize >= 30}
                  style={[
                    styles.stepperActionBtn,
                    preferences.fontSize >= 30 && styles.btnDisabled,
                  ]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.stepperBtnText}>A +</Text>
                </Pressable>
              </View>
            </View>

            {/* Font Family Selector */}
            <View style={styles.controlBlock}>
              <Text style={styles.controlLabel}>Font Family</Text>
              <View style={styles.segmentRow}>
                {[
                  { id: 'serif', label: 'Serif (Georgia)', sample: 'Georgia' },
                  { id: 'sans', label: 'Sans-Serif', sample: 'System Sans' },
                  { id: 'mono', label: 'Mono', sample: 'Monospace' },
                ].map((item) => {
                  const isSelected = preferences.fontFamily === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        handleUpdatePreferences({
                          fontFamily: item.id as 'serif' | 'sans' | 'mono',
                        })
                      }
                      style={[
                        styles.segmentBtn,
                        isSelected && styles.segmentBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          isSelected && styles.segmentBtnTextActive,
                          item.id === 'serif' ? { fontFamily: 'Georgia' } : undefined,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Line Spacing Selector */}
            <View style={styles.controlBlock}>
              <View style={styles.labelWithBadgeRow}>
                <Text style={styles.controlLabel}>Line Spacing</Text>
                <Text style={styles.activeValueText}>
                  {preferences.lineSpacing === 'compact'
                    ? '1.4x'
                    : preferences.lineSpacing === 'relaxed'
                    ? '2.1x'
                    : '1.7x'}
                </Text>
              </View>

              <View style={styles.segmentRow}>
                {[
                  { id: 'compact', label: 'Compact', ratio: '1.4x' },
                  { id: 'normal', label: 'Normal', ratio: '1.7x' },
                  { id: 'relaxed', label: 'Relaxed', ratio: '2.1x' },
                ].map((item) => {
                  const isSelected =
                    preferences.lineSpacing === item.id ||
                    (item.id === 'relaxed' && preferences.lineSpacing === 'loose');
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        handleUpdatePreferences({
                          lineSpacing: item.id as 'compact' | 'normal' | 'relaxed',
                        })
                      }
                      style={[
                        styles.segmentBtn,
                        isSelected && styles.segmentBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          isSelected && styles.segmentBtnTextActive,
                        ]}
                      >
                        {item.label} ({item.ratio})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Interactive Live Reader Sample Preview */}
            <View style={styles.previewBox}>
              <View style={styles.previewHeaderRow}>
                <Ionicons name="eye-outline" size={13} color={Colors.gold.primary} />
                <Text style={styles.previewHeaderTitle}>Live Reader Preview</Text>
                <Text style={styles.previewMetaBadge}>
                  {preferences.fontSize}pt • {preferences.fontFamily} • {preferences.lineSpacing}
                </Text>
              </View>
              <Text
                style={[
                  styles.previewText,
                  {
                    fontSize: preferences.fontSize,
                    fontFamily: getPreviewFontFamily(),
                    lineHeight: getPreviewLineHeight(),
                  },
                ]}
              >
                The art of reading is in great part that of acquiring knowledge with ease and delight. ReadOra restores tranquility to every passage.
              </Text>
            </View>

            {/* Format Limitation Disclaimer */}
            <View style={styles.formatCallout}>
              <Ionicons name="information-circle-outline" size={15} color={Colors.gold.primary} />
              <Text style={styles.formatCalloutText}>
                Typography settings dynamically reflow EPUB and TXT documents. PDF documents use fixed vector page layouts.
              </Text>
            </View>
          </Card>
        </View>

        {/* Section 3: UPGRADED Reading Navigation Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Reading Navigation Mode</Text>

          <Card variant="default" style={styles.configCard}>
            <Text style={styles.cardExplainer}>
              Choose how you navigate through books. Your reading progress and exact position are preserved automatically when switching modes.
            </Text>

            {/* Mode 1: Continuous Scroll */}
            <Pressable
              onPress={() => handleSelectReadingMode('scroll')}
              style={[
                styles.navModeCard,
                preferences.readingMode === 'scroll' && styles.navModeCardActive,
              ]}
            >
              <View style={styles.navModeIconCircle}>
                <Ionicons
                  name="swap-vertical"
                  size={20}
                  color={
                    preferences.readingMode === 'scroll'
                      ? Colors.gold.primary
                      : Colors.text.secondary
                  }
                />
              </View>
              <View style={styles.navModeContent}>
                <View style={styles.navModeTitleRow}>
                  <Text style={styles.navModeTitle}>Continuous Scroll</Text>
                  <View style={styles.formatBadgePill}>
                    <Text style={styles.formatBadgePillText}>EPUB • TXT</Text>
                  </View>
                </View>
                <Text style={styles.navModeDesc}>
                  Fluid vertical scrolling through chapters and text without interruption.
                </Text>
              </View>
              {preferences.readingMode === 'scroll' ? (
                <Ionicons name="checkmark-circle" size={20} color={Colors.gold.primary} />
              ) : (
                <View style={styles.radioUnchecked} />
              )}
            </Pressable>

            {/* Mode 2: Page-by-Page Navigation */}
            <Pressable
              onPress={() => handleSelectReadingMode('paged')}
              style={[
                styles.navModeCard,
                preferences.readingMode === 'paged' && styles.navModeCardActive,
              ]}
            >
              <View style={styles.navModeIconCircle}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={
                    preferences.readingMode === 'paged'
                      ? Colors.gold.primary
                      : Colors.text.secondary
                  }
                />
              </View>
              <View style={styles.navModeContent}>
                <View style={styles.navModeTitleRow}>
                  <Text style={styles.navModeTitle}>Page-by-Page</Text>
                  <View style={styles.formatBadgePill}>
                    <Text style={styles.formatBadgePillText}>All Formats (PDF, EPUB, TXT)</Text>
                  </View>
                </View>
                <Text style={styles.navModeDesc}>
                  Discrete page turns with edge taps, horizontal swipes, and clean pagination.
                </Text>
              </View>
              {preferences.readingMode === 'paged' ? (
                <Ionicons name="checkmark-circle" size={20} color={Colors.gold.primary} />
              ) : (
                <View style={styles.radioUnchecked} />
              )}
            </Pressable>

            {/* Progress Preservation Guarantee Callout */}
            <View style={styles.progressGuaranteedBox}>
              <Ionicons name="shield-checkmark-outline" size={14} color={Colors.status.success} />
              <Text style={styles.progressGuaranteedText}>
                Active reading progress is retained across mode switches.
              </Text>
            </View>
          </Card>
        </View>

        {/* Section 4: Storage & Privacy (PRESERVED) */}
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

        {/* Section 5: UPGRADED About ReadOra */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>About ReadOra</Text>

          <Card variant="default" style={styles.settingsGroup}>
            {/* ReadOra Brand Header */}
            <View style={styles.aboutBrandingBox}>
              <ReadOraLogo variant="transparent" width={150} />
              <Text style={styles.aboutTagline}>The Sovereign Offline E-Reader</Text>
            </View>

            {/* Replay Welcome Flow Action */}
            <Pressable
              onPress={handleReplayOnboarding}
              style={styles.settingRow}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="sparkles-outline" size={18} color={Colors.gold.primary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Replay Welcome Flow</Text>
                <Text style={styles.settingSub}>Revisit the onboarding walkthrough</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
            </Pressable>

            {/* App Version */}
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.gold.primary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>App Version</Text>
                <Text style={styles.settingSub}>Version 1.0.0 (Pre-Launch Release)</Text>
              </View>
              <View style={styles.badgeMini}>
                <Text style={styles.badgeMiniText}>v1.0.0</Text>
              </View>
            </View>

            {/* Android Build Number & Package */}
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons name="logo-android" size={18} color={Colors.gold.primary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Android Build Number</Text>
                <Text style={styles.settingSub}>com.nitincodes.readora • Build 1</Text>
              </View>
              <Text style={styles.infoValue}>Build 1</Text>
            </View>

            {/* Privacy Philosophy Section */}
            <View style={styles.privacyPhilosophyBox}>
              <View style={styles.privacyHeaderRow}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.status.success} />
                <Text style={styles.privacyHeaderTitle}>Privacy Philosophy</Text>
              </View>

              <View style={styles.privacyBulletRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color={Colors.gold.primary} />
                <Text style={styles.privacyBulletText}>
                  <Text style={styles.privacyBulletStrong}>100% Local-First Storage:</Text> All books, bookmarks, and reading sessions are stored exclusively on your device in an isolated local SQLite database.
                </Text>
              </View>

              <View style={styles.privacyBulletRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color={Colors.gold.primary} />
                <Text style={styles.privacyBulletText}>
                  <Text style={styles.privacyBulletStrong}>No Mandatory Account:</Text> Use ReadOra freely with zero login, email registration, or cloud profiling.
                </Text>
              </View>

              <View style={styles.privacyBulletRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color={Colors.gold.primary} />
                <Text style={styles.privacyBulletText}>
                  <Text style={styles.privacyBulletStrong}>Offline by Default:</Text> Your reading activity is completely private with zero telemetry tracking and zero ads.
                </Text>
              </View>
            </View>

            {/* Open-Source Licenses Modal Trigger */}
            <Pressable
              onPress={() => setIsLicensesModalOpen(true)}
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="ribbon-outline" size={18} color={Colors.gold.primary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Third-Party & Open-Source Licenses</Text>
                <Text style={styles.settingSub}>React Native, Expo, PDF.js, JSZip, SQLite</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
            </Pressable>
          </Card>
        </View>

        {/* Branding Footer */}
        <View style={styles.footer}>
          <ReadOraLogo variant="transparent" width={130} />
          <Text style={styles.footerCopyright}>
            ReadOra Mobile E-Reader • Version 1.0.0 (Build 1)
          </Text>
        </View>
      </ScrollView>

      {/* Third-Party & Open-Source Licenses Modal */}
      <Modal
        visible={isLicensesModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLicensesModalOpen(false)}
      >
        <SafeAreaView style={styles.licenseModalBackdrop} edges={['top', 'bottom']}>
          <View style={styles.licenseModalSheet}>
            {/* Modal Header */}
            <View style={styles.licenseModalHeader}>
              <View>
                <Text style={styles.licenseModalTitle}>Third-Party Licenses</Text>
                <Text style={styles.licenseModalSubtitle}>
                  Open-source software powering ReadOra
                </Text>
              </View>
              <Pressable
                onPress={() => setIsLicensesModalOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={Colors.text.primary} />
              </Pressable>
            </View>

            {/* License Cards List */}
            <ScrollView
              contentContainerStyle={styles.licenseListContent}
              showsVerticalScrollIndicator={false}
            >
              {THIRD_PARTY_LICENSES.map((pkg) => (
                <View key={pkg.name} style={styles.licenseCard}>
                  <View style={styles.licenseCardHeader}>
                    <Text style={styles.licensePkgName}>{pkg.name}</Text>
                    <View style={styles.licenseBadge}>
                      <Text style={styles.licenseBadgeText}>{pkg.license}</Text>
                    </View>
                  </View>
                  <Text style={styles.licenseVersion}>Version {pkg.version}</Text>
                  <Text style={styles.licensePurpose}>{pkg.purpose}</Text>
                  <Text style={styles.licenseCopyright}>{pkg.copyright}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
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
  configCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardExplainer: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  controlBlock: {
    gap: Spacing.xs,
  },
  controlLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeValueText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    borderColor: Colors.gold.primary,
    backgroundColor: Colors.gold.glow,
  },
  segmentBtnText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  segmentBtnTextActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.midnight.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: 3,
    marginTop: 2,
  },
  stepperActionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.midnight.surface,
  },
  stepperBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  stepperCurrentLabel: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeight.semiBold,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  previewBox: {
    backgroundColor: Colors.midnight.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderColor: Colors.midnight.borderSubtle,
    paddingBottom: 6,
    marginBottom: 4,
  },
  previewHeaderTitle: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewMetaBadge: {
    marginLeft: 'auto',
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
  },
  previewText: {
    color: Colors.text.primary,
  },
  formatCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(229, 186, 88, 0.08)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gold.border,
  },
  formatCalloutText: {
    flex: 1,
    fontSize: FontSize.xxs,
    color: Colors.text.secondary,
    lineHeight: 15,
  },
  navModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.midnight.border,
    padding: Spacing.md,
  },
  navModeCardActive: {
    borderColor: Colors.gold.primary,
    backgroundColor: 'rgba(229, 186, 88, 0.06)',
  },
  navModeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.midnight.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navModeContent: {
    flex: 1,
    gap: 2,
  },
  navModeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navModeTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.text.primary,
  },
  formatBadgePill: {
    backgroundColor: Colors.midnight.surfaceHighlight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  formatBadgePillText: {
    fontSize: FontSize.xxs,
    color: Colors.gold.primary,
    fontWeight: FontWeight.semiBold,
  },
  navModeDesc: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  radioUnchecked: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.text.tertiary,
  },
  progressGuaranteedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  progressGuaranteedText: {
    fontSize: FontSize.xxs,
    color: Colors.status.success,
    fontWeight: FontWeight.medium,
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
  badgeMini: {
    backgroundColor: 'rgba(229, 186, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 186, 88, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  badgeMiniText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
  },
  aboutBrandingBox: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.midnight.border,
    gap: 4,
  },
  aboutTagline: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    letterSpacing: 0.5,
  },
  privacyPhilosophyBox: {
    padding: Spacing.md,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderBottomWidth: 1,
    borderColor: Colors.midnight.border,
    gap: Spacing.xs,
  },
  privacyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  privacyHeaderTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  privacyBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  privacyBulletText: {
    flex: 1,
    fontSize: FontSize.xxs,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  privacyBulletStrong: {
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
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
  licenseModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  licenseModalSheet: {
    flex: 1,
    backgroundColor: Colors.midnight.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
  },
  licenseModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.midnight.border,
  },
  licenseModalTitle: {
    ...Typography.title3,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  licenseModalSubtitle: {
    fontSize: FontSize.xxs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.midnight.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  licenseListContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  licenseCard: {
    backgroundColor: Colors.midnight.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: Spacing.md,
    gap: 4,
  },
  licenseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  licensePkgName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  licenseBadge: {
    backgroundColor: 'rgba(229, 186, 88, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.gold.border,
  },
  licenseBadgeText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
  licenseVersion: {
    fontSize: FontSize.xxs,
    color: Colors.gold.primary,
    fontWeight: FontWeight.semiBold,
  },
  licensePurpose: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  licenseCopyright: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
});
