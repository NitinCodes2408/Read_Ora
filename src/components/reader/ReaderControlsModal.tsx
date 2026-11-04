import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { UserPreferences, ThemeMode, BookFormat } from '@/types';

interface ReaderControlsModalProps {
  visible: boolean;
  preferences: UserPreferences;
  onClose: () => void;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  format?: BookFormat;
}

export const ReaderControlsModal: React.FC<ReaderControlsModalProps> = ({
  visible,
  preferences,
  onClose,
  onUpdatePreferences,
  format,
}) => {
  const currentTheme = preferences.themeMode;
  const isPdf = format === 'PDF';

  const themes: { id: ThemeMode; label: string; swatch: string; text: string }[] = [
    { id: 'midnight', label: 'Midnight', swatch: '#0B0E14', text: '#F8FAFC' },
    { id: 'sepia', label: 'Sepia', swatch: '#EFE7D3', text: '#2D2319' },
    { id: 'ivory', label: 'Ivory', swatch: '#FAF6EE', text: '#1C1917' },
  ];

  const fontSizePresets = [
    { label: 'Small', size: 15 },
    { label: 'Medium', size: 18 },
    { label: 'Large', size: 22 },
  ];

  const fontFamilies: { id: 'serif' | 'sans' | 'mono' | 'default'; label: string }[] = [
    { id: 'serif', label: 'Serif' },
    { id: 'sans', label: 'Sans-Serif' },
    { id: 'mono', label: 'Mono' },
    { id: 'default', label: 'System' },
  ];

  const lineSpacings: { id: 'compact' | 'normal' | 'relaxed'; label: string; ratio: string }[] = [
    { id: 'compact', label: 'Compact', ratio: '1.4x' },
    { id: 'normal', label: 'Normal', ratio: '1.7x' },
    { id: 'relaxed', label: 'Relaxed', ratio: '2.1x' },
  ];

  const handleDecreaseFont = () => {
    if (isPdf) return;
    if (preferences.fontSize > 12) {
      onUpdatePreferences({ fontSize: preferences.fontSize - 2 });
    }
  };

  const handleIncreaseFont = () => {
    if (isPdf) return;
    if (preferences.fontSize < 30) {
      onUpdatePreferences({ fontSize: preferences.fontSize + 2 });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.sheetTitle}>Reading Appearance & Engine</Text>
              {format ? (
                <Text style={styles.sheetFormatBadge}>
                  Format: {format} {isPdf ? '(Fixed Layout)' : '(Reflowable Text)'}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>

          {/* Section 1: Themes */}
          <Text style={styles.sectionLabel}>COLOR THEME</Text>
          <View style={styles.themeRow}>
            {themes.map((t) => {
              const isActive = currentTheme === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => onUpdatePreferences({ themeMode: t.id })}
                  style={[
                    styles.themeOption,
                    { backgroundColor: t.swatch },
                    isActive && styles.themeOptionActive,
                  ]}
                >
                  <Text style={[styles.themeOptionText, { color: t.text }]}>
                    {t.label}
                  </Text>
                  {isActive && (
                    <View style={styles.themeActiveDot}>
                      <Ionicons name="checkmark" size={14} color={Colors.gold.primary} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* PDF Format Limitation Notice */}
          {isPdf ? (
            <View style={styles.formatNoticeCard}>
              <Ionicons name="information-circle" size={18} color={Colors.gold.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.formatNoticeTitle}>Fixed-Layout PDF Document</Text>
                <Text style={styles.formatNoticeText}>
                  Typography reflow (font size, font family, line spacing) is not supported for PDF files. PDF pages operate in Page-by-Page navigation mode with pinch/zoom.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Section 2: Font Size Presets & Stepper */}
          <Text style={[styles.sectionLabel, isPdf && styles.labelDisabled]}>
            FONT SIZE {isPdf ? '(Unavailable for PDF)' : ''}
          </Text>
          <View style={[styles.fontSizeContainer, isPdf && styles.disabledSection]}>
            {/* Quick Presets */}
            <View style={styles.presetGroup}>
              {fontSizePresets.map((p) => {
                const isSelected = preferences.fontSize === p.size;
                return (
                  <Pressable
                    key={p.label}
                    disabled={isPdf}
                    onPress={() => onUpdatePreferences({ fontSize: p.size })}
                    style={[
                      styles.presetBtn,
                      isSelected && styles.presetBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetBtnText,
                        isSelected && styles.presetBtnTextActive,
                      ]}
                    >
                      {p.label} ({p.size})
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Stepper Fine-tuning */}
            <View style={styles.fontSizeStepperRow}>
              <Pressable
                onPress={handleDecreaseFont}
                disabled={isPdf || preferences.fontSize <= 12}
                style={[
                  styles.fontStepperBtn,
                  (isPdf || preferences.fontSize <= 12) && styles.btnDisabled,
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.fontStepperMinus}>A-</Text>
              </Pressable>

              <View style={styles.fontSizeDisplay}>
                <Text style={styles.fontSizeValue}>{preferences.fontSize} pt</Text>
              </View>

              <Pressable
                onPress={handleIncreaseFont}
                disabled={isPdf || preferences.fontSize >= 30}
                style={[
                  styles.fontStepperBtn,
                  (isPdf || preferences.fontSize >= 30) && styles.btnDisabled,
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.fontStepperPlus}>A+</Text>
              </Pressable>
            </View>
          </View>

          {/* Section 3: Font Family */}
          <Text style={[styles.sectionLabel, isPdf && styles.labelDisabled]}>
            FONT FAMILY {isPdf ? '(Unavailable for PDF)' : ''}
          </Text>
          <View style={[styles.fontFamilyRow, isPdf && styles.disabledSection]}>
            {fontFamilies.map((f) => {
              const isActive = preferences.fontFamily === f.id;
              return (
                <Pressable
                  key={f.id}
                  disabled={isPdf}
                  onPress={() => onUpdatePreferences({ fontFamily: f.id })}
                  style={[
                    styles.familyPill,
                    isActive && styles.familyPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.familyPillText,
                      isActive && styles.familyPillTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Section 4: Line Spacing */}
          <Text style={[styles.sectionLabel, isPdf && styles.labelDisabled]}>
            LINE SPACING {isPdf ? '(Unavailable for PDF)' : ''}
          </Text>
          <View style={[styles.spacingRow, isPdf && styles.disabledSection]}>
            {lineSpacings.map((s) => {
              const isActive =
                preferences.lineSpacing === s.id ||
                (s.id === 'relaxed' && preferences.lineSpacing === 'loose');
              return (
                <Pressable
                  key={s.id}
                  disabled={isPdf}
                  onPress={() => onUpdatePreferences({ lineSpacing: s.id })}
                  style={[
                    styles.spacingPill,
                    isActive && styles.spacingPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.spacingPillText,
                      isActive && styles.spacingPillTextActive,
                    ]}
                  >
                    {s.label} ({s.ratio})
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Section 5: Reading Mode (Paged vs Scroll) */}
          <Text style={styles.sectionLabel}>READING NAVIGATION MODE</Text>
          <View style={styles.modeRow}>
            {/* Page-by-Page: Supported on All Formats */}
            <Pressable
              onPress={() => onUpdatePreferences({ readingMode: 'paged' })}
              style={[
                styles.modePill,
                preferences.readingMode === 'paged' && styles.modePillActive,
              ]}
            >
              <Ionicons
                name="book-outline"
                size={16}
                color={
                  preferences.readingMode === 'paged'
                    ? Colors.gold.primary
                    : Colors.text.secondary
                }
              />
              <View style={styles.modePillCol}>
                <Text
                  style={[
                    styles.modePillText,
                    preferences.readingMode === 'paged' && styles.modePillTextActive,
                  ]}
                >
                  Page-by-Page
                </Text>
                <Text style={styles.modeFormatTag}>All Formats</Text>
              </View>
            </Pressable>

            {/* Continuous Scroll: Supported on EPUB & TXT */}
            <Pressable
              onPress={() => {
                if (isPdf) return;
                onUpdatePreferences({ readingMode: 'scroll' });
              }}
              disabled={isPdf}
              style={[
                styles.modePill,
                preferences.readingMode === 'scroll' && !isPdf && styles.modePillActive,
                isPdf && styles.modePillDisabled,
              ]}
            >
              <Ionicons
                name="swap-vertical-outline"
                size={16}
                color={
                  isPdf
                    ? Colors.text.disabled
                    : preferences.readingMode === 'scroll'
                    ? Colors.gold.primary
                    : Colors.text.secondary
                }
              />
              <View style={styles.modePillCol}>
                <Text
                  style={[
                    styles.modePillText,
                    isPdf && styles.modePillTextDisabled,
                    preferences.readingMode === 'scroll' && !isPdf && styles.modePillTextActive,
                  ]}
                >
                  Continuous Scroll
                </Text>
                <Text style={styles.modeFormatTag}>
                  {isPdf ? 'Not supported in PDF' : 'EPUB & TXT'}
                </Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.midnight.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sheetTitle: {
    ...Typography.title3,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  sheetFormatBadge: {
    fontSize: FontSize.xxs,
    color: Colors.gold.primary,
    fontWeight: FontWeight.semiBold,
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
  sectionLabel: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.text.tertiary,
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  labelDisabled: {
    color: Colors.text.disabled,
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  themeOption: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  themeOptionActive: {
    borderColor: Colors.gold.primary,
  },
  themeOptionText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
  },
  themeActiveDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: 'rgba(229, 186, 88, 0.08)',
    borderWidth: 1,
    borderColor: Colors.gold.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  formatNoticeTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    marginBottom: 2,
  },
  formatNoticeText: {
    fontSize: FontSize.xxs,
    color: Colors.text.secondary,
    lineHeight: 15,
  },
  fontSizeContainer: {
    gap: Spacing.xs,
  },
  presetGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnActive: {
    borderColor: Colors.gold.primary,
    backgroundColor: Colors.gold.glow,
  },
  presetBtnText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  presetBtnTextActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  fontSizeStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.midnight.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: 2,
  },
  fontStepperBtn: {
    width: 50,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  fontStepperMinus: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  fontStepperPlus: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  fontSizeDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  fontSizeValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
  btnDisabled: {
    opacity: 0.3,
  },
  disabledSection: {
    opacity: 0.35,
  },
  fontFamilyRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  familyPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    alignItems: 'center',
  },
  familyPillActive: {
    borderColor: Colors.gold.primary,
    backgroundColor: Colors.gold.glow,
  },
  familyPillText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  familyPillTextActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  spacingRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  spacingPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    alignItems: 'center',
  },
  spacingPillActive: {
    borderColor: Colors.gold.primary,
    backgroundColor: Colors.gold.glow,
  },
  spacingPillText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  spacingPillTextActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
  },
  modePillCol: {
    alignItems: 'flex-start',
  },
  modePillActive: {
    borderColor: Colors.gold.primary,
    backgroundColor: Colors.gold.glow,
  },
  modePillDisabled: {
    opacity: 0.4,
  },
  modePillText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  modePillTextActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  modePillTextDisabled: {
    color: Colors.text.disabled,
  },
  modeFormatTag: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
    marginTop: 1,
  },
});
