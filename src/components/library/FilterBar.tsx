import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

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
        {filters.map((item) => {
          const isSelected = selectedFilter === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelectFilter(item.key)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${item.label}`}
              style={({ pressed }) => [
                styles.pill,
                isSelected ? styles.pillSelected : styles.pillUnselected,
                pressed && styles.pillPressed,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextSelected : styles.pillTextUnselected,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
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
          <Ionicons name="filter-outline" size={17} color={Colors.text.secondary} />
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
    alignItems: 'center',
    gap: 8,
    paddingRight: Spacing.xs,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: Colors.gold.primary,
  },
  pillUnselected: {
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  pillPressed: {
    opacity: 0.8,
  },
  pillText: {
    fontSize: 13,
  },
  pillTextSelected: {
    color: '#0D1017',
    fontWeight: '700',
  },
  pillTextUnselected: {
    color: '#8E95A5',
    fontWeight: '500',
  },
  sortButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sortButtonPressed: {
    opacity: 0.7,
  },
});
