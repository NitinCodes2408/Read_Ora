import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, Typography } from '@/constants/typography';
import { Header } from '@/components/common/Header';
import { SearchInput } from '@/components/common/SearchInput';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';

const CATEGORIES = [
  'All',
  'Classics',
  'Philosophy',
  'Science',
  'Fiction',
  'History',
  'Poetry',
];

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header
        title="Discover"
        subtitle="Legally curated public domain literature"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search titles, authors, genres..."
          style={styles.searchBar}
        />

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              label={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>

        {/* Honest Empty State for Catalog */}
        <Card variant="default" style={styles.emptyCard}>
          <EmptyState
            icon={
              <Ionicons
                name="compass-outline"
                size={34}
                color={Colors.gold.primary}
              />
            }
            title="Public Domain Catalog Coming Soon"
            description="ReadOra is integrating verified legal book repositories — including Standard Ebooks and Project Gutenberg — so you can download and read timeless classics for free."
          />
        </Card>

        {/* Legal & Open Source Literature Commitment */}
        <View style={styles.commitmentCard}>
          <View style={styles.commitmentHeader}>
            <View style={styles.checkIcon}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.gold.primary} />
            </View>
            <Text style={styles.commitmentTitle}>100% Legal & Public Domain</Text>
          </View>
          <Text style={styles.commitmentText}>
            Every book available through ReadOra&apos;s discover catalog will be strictly public domain or openly licensed. We respect authors and copyright laws worldwide.
          </Text>

          <View style={styles.sourcesList}>
            <View style={styles.sourceItem}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.status.success} />
              <Text style={styles.sourceText}>Standard Ebooks (Carefully formatted EPUB editions)</Text>
            </View>
            <View style={styles.sourceItem}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.status.success} />
              <Text style={styles.sourceText}>Project Gutenberg (Over 70,000 free books)</Text>
            </View>
            <View style={styles.sourceItem}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.status.success} />
              <Text style={styles.sourceText}>Open Access Academic & Science Papers</Text>
            </View>
          </View>
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
  searchBar: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  emptyCard: {
    marginVertical: Spacing.md,
    padding: Spacing.none,
  },
  commitmentCard: {
    backgroundColor: Colors.midnight.surface,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  commitmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitmentTitle: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  commitmentText: {
    ...Typography.bodySecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  sourcesList: {
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderColor: Colors.midnight.border,
    paddingTop: Spacing.sm,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
});
