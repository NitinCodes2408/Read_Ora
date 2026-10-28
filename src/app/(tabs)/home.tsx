import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { ReadOraLogo } from '@/components/common/ReadOraLogo';
import { SearchInput } from '@/components/common/SearchInput';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { GreetingCard } from '@/components/home/GreetingCard';
import { QuickStatsCard } from '@/components/home/QuickStatsCard';
import { ActionShortcuts } from '@/components/home/ActionShortcuts';
import { useLibrary } from '@/hooks/useLibrary';
import { formatFileSize, formatDate } from '@/utils/fileUtils';

export default function HomeScreen() {
  const router = useRouter();
  const { books, importBook } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const recentBook = books.length > 0 ? books[0] : null;

  const handleImportBook = async () => {
    try {
      setIsImporting(true);
      const result = await importBook();

      if (result.success) {
        if (result.isDuplicate) {
          Alert.alert(
            'Already in Library',
            `"${result.book.title}" is already stored in your library.`,
            [{ text: 'View in Library', onPress: () => router.push('/(tabs)/library') }, { text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Book Imported',
            `"${result.book.title}" (${result.book.format}) was added to your library.`,
            [{ text: 'Go to Library', onPress: () => router.push('/(tabs)/library') }, { text: 'Done' }]
          );
        }
      } else if (!result.canceled && result.error) {
        Alert.alert('Import Failed', result.error, [{ text: 'OK' }]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error during import';
      Alert.alert('Import Error', msg, [{ text: 'OK' }]);
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenRecentBook = () => {
    if (!recentBook) return;
    Alert.alert(
      'Reading Engine in Phase 2B',
      `"${recentBook.title}" (${recentBook.format}) is safely stored on device:\n\n${recentBook.relativePath}\n\nThe native PDF & EPUB reading engine will be integrated in Phase 2B.`,
      [{ text: 'Understood' }]
    );
  };

  const handleNotificationPress = () => {
    Alert.alert(
      'Reading Reminders',
      'Daily reading habit notifications and reminders will be configurable in your reading preferences.',
      [{ text: 'Close' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header with ReadOra Logo & Actions */}
        <View style={styles.topBar}>
          <ReadOraLogo variant="transparent" width={160} />
          <Pressable
            onPress={handleNotificationPress}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={Colors.text.primary}
            />
          </Pressable>
        </View>

        {/* Global Search Bar */}
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search books, authors..."
          style={styles.searchBar}
        />

        {/* Personalized Greeting */}
        <GreetingCard />

        {/* Continue Reading Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Continue Reading</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/library')}
            accessibilityRole="button"
            accessibilityLabel="View all books in library"
          >
            <Text style={styles.sectionAction}>View Library</Text>
          </Pressable>
        </View>

        {recentBook ? (
          /* Recent Real Book Card */
          <Card variant="goldAccent" style={styles.recentBookCard}>
            <View style={styles.recentContent}>
              <View style={styles.recentCoverBox}>
                <Ionicons
                  name={recentBook.format === 'EPUB' ? 'book' : 'document-text'}
                  size={28}
                  color={Colors.gold.primary}
                />
                <View style={styles.recentFormatTag}>
                  <Text style={styles.recentFormatText}>{recentBook.format}</Text>
                </View>
              </View>

              <View style={styles.recentDetails}>
                <Text style={styles.recentTitle} numberOfLines={2}>
                  {recentBook.title}
                </Text>
                <Text style={styles.recentAuthor}>{recentBook.author}</Text>
                <Text style={styles.recentMeta}>
                  {formatFileSize(recentBook.fileSizeBytes)} • Added {formatDate(recentBook.addedAt)}
                </Text>
              </View>
            </View>

            <View style={styles.recentActionsRow}>
              <Button
                title="Continue Reading"
                onPress={handleOpenRecentBook}
                variant="primary"
                size="md"
                style={styles.continueButton}
              />
              <Button
                title="Manage"
                onPress={() => router.push('/(tabs)/library')}
                variant="secondary"
                size="md"
                style={styles.manageButton}
              />
            </View>
          </Card>
        ) : (
          /* Honest Empty State when 0 books exist */
          <Card variant="default" style={styles.continueReadingCard}>
            <EmptyState
              icon={
                <Ionicons
                  name="book-outline"
                  size={30}
                  color={Colors.gold.primary}
                />
              }
              title="No Book in Progress"
              description="Your recent reads will appear here with your saved position, bookmarks, and progress."
              actionTitle={isImporting ? 'Importing...' : '+ Import Book'}
              onActionPress={handleImportBook}
            />
          </Card>
        )}

        {/* Quick Action Shortcuts (Library, Discover) with real book count */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
        </View>
        <ActionShortcuts
          onImportPress={handleImportBook}
          bookCount={books.length}
        />

        {/* Compact Reading Progress & Habit Tracker */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reading Habit</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/insights')}
            accessibilityRole="button"
            accessibilityLabel="View all reading insights"
          >
            <Text style={styles.sectionAction}>Detailed Stats</Text>
          </Pressable>
        </View>
        <QuickStatsCard />

        {/* Primary Call to Action Banner */}
        <Card variant="goldAccent" style={styles.importBanner}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="folder-open" size={24} color={Colors.gold.primary} />
            </View>
            <View style={styles.bannerTextBox}>
              <Text style={styles.bannerTitle}>
                {books.length > 0 ? 'Add More to Your Library' : 'Build Your Digital Library'}
              </Text>
              <Text style={styles.bannerSub}>
                Import PDF documents, EPUB e-books, or TXT study notes directly into offline storage.
              </Text>
            </View>
          </View>
          <Button
            title={isImporting ? 'Importing...' : '+ Import Book (PDF, EPUB, TXT)'}
            onPress={handleImportBook}
            variant="primary"
            size="md"
            style={styles.bannerButton}
          />
        </Card>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.midnight.surface,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
  searchBar: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
  },
  sectionAction: {
    fontSize: FontSize.sm,
    color: Colors.gold.primary,
    fontWeight: FontWeight.medium,
  },
  continueReadingCard: {
    padding: Spacing.none,
    marginBottom: Spacing.lg,
  },
  recentBookCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  recentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recentCoverBox: {
    width: 56,
    height: 76,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    position: 'relative',
  },
  recentFormatTag: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  recentFormatText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
  recentDetails: {
    flex: 1,
  },
  recentTitle: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  recentAuthor: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  recentMeta: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  recentActionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  continueButton: {
    flex: 1,
  },
  manageButton: {
    width: 90,
  },
  importBanner: {
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextBox: {
    flex: 1,
  },
  bannerTitle: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  bannerSub: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
  bannerButton: {
    width: '100%',
  },
});
