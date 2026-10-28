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
import { UserPreferences, ThemeMode, ReadingMode } from '@/types';

interface ReaderControlsModalProps {
  visible: boolean;
  preferences: UserPreferences;
  onClose: () => void;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
}

export const ReaderControlsModal: React.FC<ReaderControlsModalProps> = ({
  visible,
  preferences,
  onClose,
  onUpdatePreferences,
}) => {
  const currentTheme = preferences.themeMode;

  const themes: { id: ThemeMode; label: string; swatch: string; text: string }[] = [
    { id: 'midnight', label: 'Midnight', swatch: '#0B0E14', text: '#F8FAFC' },
    { id: 'sepia', label: 'Sepia', swatch: '#EFE7D3', text: '#2D2319' },
    { id: 'ivory', label: 'Ivory', swatch: '#FAF6EE', text: '#1C1917' },
  ];

  const fontFamilies: { id: 'default' | 'serif' | 'sans' | 'mono'; label: string }[] = [
    { id: 'serif', label: 'Serif' },
    { id: 'sans', label: 'Sans' },
    { id: 'mono', label: 'Mono' },
    { id: 'default', label: 'System' },
  ];

  const lineSpacings: { id: 'normal' | 'relaxed' | 'loose'; label: string; icon: string }[] = [
    { id: 'normal', label: 'Compact', icon: 'reorder-two-outline' },
    { id: 'relaxed', label: 'Normal', icon: 'reorder-three-outline' },
    { id: 'loose', label: 'Spacious', icon: 'reorder-four-outline' },
  ];

  const handleDecreaseFont = () => {
    if (preferences.fontSize > 12) {
      onUpdatePreferences({ fontSize: preferences.fontSize - 2 });
    }
  };

  const handleIncreaseFont = () => {
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
            <Text style={styles.sheetTitle}>Reading Appearance</Text>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>

          {/* Section 1: Themes */}
          <Text style={styles.sectionLabel}>THEME</Text>
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

          {/* Section 2: Font Size */}
          <Text style={styles.sectionLabel}>FONT SIZE</Text>
          <View style={styles.fontSizeRow}>
            <Pressable
              onPress={handleDecreaseFont}
              disabled={preferences.fontSize <= 12}
              style={[
                styles.fontStepperBtn,
                preferences.fontSize <= 12 && styles.btnDisabled,
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
              disabled={preferences.fontSize >= 30}
              style={[
                styles.fontStepperBtn,
                preferences.fontSize >= 30 && styles.btnDisabled,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.fontStepperPlus}>A+</Text>
            </Pressable>
          </View>

          {/* Section 3: Font Family */}
          <Text style={styles.sectionLabel}>TYPOGRAPHY</Text>
          <View style={styles.fontFamilyRow}>
            {fontFamilies.map((f) => {
              const isActive = preferences.fontFamily === f.id;
              return (
                <Pressable
                  key={f.id}
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
          <Text style={styles.sectionLabel}>LINE SPACING</Text>
          <View style={styles.spacingRow}>
            {lineSpacings.map((s) => {
              const isActive = preferences.lineSpacing === s.id;
              return (
                <Pressable
                  key={s.id}
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
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Section 5: Reading Mode (Paged vs Scroll) */}
          <Text style={styles.sectionLabel}>READING NAVIGATION</Text>
          <View style={styles.modeRow}>
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
              <Text
                style={[
                  styles.modePillText,
                  preferences.readingMode === 'paged' && styles.modePillTextActive,
                ]}
              >
                Paged (Swipe)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onUpdatePreferences({ readingMode: 'scroll' })}
              style={[
                styles.modePill,
                preferences.readingMode === 'scroll' && styles.modePillActive,
              ]}
            >
              <Ionicons
                name="swap-vertical-outline"
                size={16}
                color={
                  preferences.readingMode === 'scroll'
                    ? Colors.gold.primary
                    : Colors.text.secondary
                }
              />
              <Text
                style={[
                  styles.modePillText,
                  preferences.readingMode === 'scroll' && styles.modePillTextActive,
                ]}
              >
                Continuous Scroll
              </Text>
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
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    ...Typography.title3,
    fontSize: FontSize.md,
    color: Colors.text.primary,
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
  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.midnight.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: 4,
  },
  fontStepperBtn: {
    width: 50,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
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
  fontFamilyRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  familyPill: {
    flex: 1,
    paddingVertical: 10,
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
    paddingVertical: 10,
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
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
  },
  modePillActive: {
    borderColor: Colors.gold.primary,
    backgroundColor: Colors.gold.glow,
  },
  modePillText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  modePillTextActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
});
