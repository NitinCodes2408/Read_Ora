import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Badge } from '../common/Badge';

export type FilterType = 'ALL' | 'PDF' | 'EPUB' | 'TXT';

interface FilterBarProps {
  selectedFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  onSortPress?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedFilter,
  onSelectFilter,
  onSortPress,
}) => {
  const filters: { key: FilterType; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PDF', label: 'PDF' },
    { key: 'EPUB', label: 'EPUB' },
    { key: 'TXT', label: 'TXT' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((item) => (
          <Badge
            key={item.key}
            label={item.label}
            selected={selectedFilter === item.key}
            onPress={() => onSelectFilter(item.key)}
            style={styles.badge}
          />
        ))}
      </ScrollView>

      {onSortPress && (
        <Pressable
          onPress={onSortPress}
          accessibilityRole="button"
          accessibilityLabel="Sort books"
          style={({ pressed }) => [
            styles.sortButton,
            pressed && styles.sortButtonPressed,
          ]}
        >
          <Ionicons name="filter-outline" size={16} color={Colors.text.secondary} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  badge: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  sortButtonPressed: {
    opacity: 0.7,
  },
});
