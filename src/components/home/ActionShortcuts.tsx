import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { FontSize, FontWeight } from '@/constants/typography';

interface ActionShortcutsProps {
  onImportPress: () => void;
  bookCount?: number;
}

export const ActionShortcuts: React.FC<ActionShortcutsProps> = ({
  onImportPress,
  bookCount = 0,
}) => {
  const router = useRouter();

  const countLabel = bookCount === 1 ? '1 Book' : `${bookCount} Books`;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.push('/(tabs)/library')}
        accessibilityRole="button"
        accessibilityLabel="Go to My Library"
        style={({ pressed }) => [
          styles.shortcutCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.iconBox}>
          <Ionicons name="library-outline" size={20} color={Colors.gold.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.shortcutTitle}>My Library</Text>
          <Text style={styles.shortcutSub}>{countLabel}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
      </Pressable>

      <Pressable
        onPress={() => router.push('/(tabs)/discover')}
        accessibilityRole="button"
        accessibilityLabel="Discover Books"
        style={({ pressed }) => [
          styles.shortcutCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.iconBox}>
          <Ionicons name="compass-outline" size={20} color={Colors.gold.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.shortcutTitle}>Discover</Text>
          <Text style={styles.shortcutSub}>Free Classics</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  shortcutCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.midnight.surface,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gold.glow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  textWrap: {
    flex: 1,
  },
  shortcutTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.text.primary,
  },
  shortcutSub: {
    fontSize: FontSize.xxs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});
