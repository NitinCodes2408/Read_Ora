import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight } from '@/constants/typography';
import { HIGHLIGHT_COLORS } from '@/types';

interface AnnotationFloatingMenuProps {
  visible: boolean;
  selectedText: string;
  onApplyHighlight: (color: string) => void;
  onApplyUnderline: (color: string) => void;
  onDismiss: () => void;
}

export const AnnotationFloatingMenu: React.FC<AnnotationFloatingMenuProps> = ({
  visible,
  selectedText,
  onApplyHighlight,
  onApplyUnderline,
  onDismiss,
}) => {
  if (!visible || !selectedText.trim()) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.snippetText} numberOfLines={1}>
            {`"${selectedText.trim()}"`}
          </Text>
          <Pressable onPress={onDismiss} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={16} color={Colors.text.secondary} />
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          {/* Highlight Color Swatches */}
          <View style={styles.colorsRow}>
            {HIGHLIGHT_COLORS.map((c) => (
              <Pressable
                key={c.name}
                style={[styles.colorDot, { backgroundColor: c.hex }]}
                onPress={() => onApplyHighlight(c.hex)}
                accessibilityLabel={`Highlight in ${c.name}`}
              />
            ))}
          </View>

          <View style={styles.separator} />

          {/* Underline Action */}
          <Pressable
            style={styles.actionBtn}
            onPress={() => onApplyUnderline('#F5D061')}
            accessibilityLabel="Underline selected text"
          >
            <Ionicons name="remove-outline" size={18} color={Colors.gold.primary} />
            <Text style={styles.actionBtnText}>Underline</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 84,
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#121620',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(229, 186, 88, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  snippetText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginRight: Spacing.xs,
  },
  closeBtn: {
    padding: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  colorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: Spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(229, 186, 88, 0.12)',
  },
  actionBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
  },
});
