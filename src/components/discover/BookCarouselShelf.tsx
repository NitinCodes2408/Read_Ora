import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontWeight, Typography } from '@/constants/typography';
import { Book, CuratedBook, BookAvailability } from '@/types';
import { isCuratedBookInLibrary } from '@/services/curatedCatalogService';

interface BookCarouselShelfProps {
  title: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  badgeLabel?: string;
  books: CuratedBook[];
  libraryBooks: Book[];
  downloadingBookId: string | null;
  downloadProgress?: number;
  onBookPress: (book: CuratedBook) => void;
  onAddPress: (book: CuratedBook) => void;
  onOpenPress: (book: CuratedBook) => void;
}

export const BookCarouselShelf: React.FC<BookCarouselShelfProps> = ({
  title,
  subtitle,
  iconName = 'bookmark',
  badgeLabel,
  books,
  libraryBooks,
  downloadingBookId,
  downloadProgress = 0,
  onBookPress,
  onAddPress,
  onOpenPress,
}) => {
  if (!books || books.length === 0) return null;

  return (
    <View style={styles.shelfContainer}>
      {/* Shelf Header */}
      <View style={styles.shelfHeader}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name={iconName} size={14} color={Colors.gold.primary} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={styles.shelfTitle} numberOfLines={2}>
              {title}
            </Text>
            {!!subtitle && (
              <Text style={styles.shelfSubtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {!!badgeLabel && (
          <View style={styles.shelfBadge}>
            <Text style={styles.shelfBadgeText} numberOfLines={1}>
              {badgeLabel}
            </Text>
          </View>
        )}
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {books.map((book) => {
          const inLibrary = !!isCuratedBookInLibrary(book, libraryBooks);
          const isDownloading = downloadingBookId === book.id;

          const availability: BookAvailability = book.availability || {
            tier: 'free_full',
            label: book.badge || 'Free',
            badgeColor: '#22C55E',
            badgeBg: 'rgba(34, 197, 94, 0.16)',
            canAddToLibrary: true,
            canReadInApp: true,
            description: 'Verified public-domain edition.',
          };

          const isNonEnglish = book.language && book.language !== 'English';

          return (
            <View key={book.id} style={styles.shelfCard}>
              <Pressable
                style={({ pressed }) => [styles.clickableArea, pressed && styles.areaPressed]}
                onPress={() => onBookPress(book)}
                accessibilityRole="button"
                accessibilityLabel={`${book.title} by ${book.author}`}
              >
                {/* Cover with aspect ratio */}
                <View style={styles.coverWrapper}>
                  <Image
                    source={{ uri: book.coverUrl }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                  {/* Language pill if Marathi / Hindi / other */}
                  {isNonEnglish && (
                    <View style={styles.languageBadge}>
                      <Text style={styles.languageText}>{book.language}</Text>
                    </View>
                  )}

                  {/* Availability badge */}
                  <View
                    style={[
                      styles.availabilityBadge,
                      {
                        backgroundColor: availability.badgeBg,
                        borderColor: availability.badgeColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.availabilityText,
                        { color: availability.badgeColor },
                      ]}
                      numberOfLines={1}
                    >
                      {availability.label}
                    </Text>
                  </View>
                </View>

                {/* Text metadata */}
                <View style={styles.metaWrapper}>
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {book.category} • {book.publishedYear}
                  </Text>
                  <Text style={styles.titleText} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={styles.authorText} numberOfLines={1}>
                    {book.author}
                  </Text>
                </View>
              </Pressable>

              {/* Action Button */}
              <View style={styles.actionContainer}>
                {isDownloading ? (
                  <View style={styles.downloadingBtn}>
                    <ActivityIndicator size="small" color={Colors.gold.primary} />
                    {downloadProgress > 0 && (
                      <Text style={styles.downloadingText}>{downloadProgress}%</Text>
                    )}
                  </View>
                ) : inLibrary ? (
                  <Pressable
                    style={({ pressed }) => [styles.openBtn, pressed && styles.btnPressed]}
                    onPress={() => onOpenPress(book)}
                    accessibilityRole="button"
                    accessibilityLabel="Open Book"
                  >
                    <Ionicons name="book-outline" size={12} color={Colors.gold.primary} />
                    <Text style={styles.openBtnText}>Read</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.addBtn, pressed && styles.btnPressed]}
                    onPress={() => onAddPress(book)}
                    accessibilityRole="button"
                    accessibilityLabel="Add Book"
                  >
                    <Ionicons name="add" size={13} color="#000000" />
                    <Text style={styles.addBtnText}>Add</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  shelfContainer: {
    marginBottom: Spacing.xl,
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    flex: 1,
    flexShrink: 1,
  },
  titleTextContainer: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 4,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  shelfTitle: {
    ...Typography.subheading,
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: 0.2,
    lineHeight: 20,
    flexShrink: 1,
  },
  shelfSubtitle: {
    ...Typography.bodySecondary,
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 2,
    lineHeight: 15,
    flexShrink: 1,
  },
  shelfBadge: {
    backgroundColor: 'rgba(229, 186, 88, 0.12)',
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: 1,
    flexShrink: 0,
  },
  shelfBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
  },
  scrollContent: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    gap: Spacing.sm,
  },
  shelfCard: {
    width: 135,
    backgroundColor: Colors.midnight.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: Spacing.xs,
    overflow: 'hidden',
  },
  clickableArea: {
    width: '100%',
  },
  areaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  coverWrapper: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.midnight.surfaceElevated,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  languageBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(229, 186, 88, 0.95)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  languageText: {
    fontSize: 8,
    fontWeight: FontWeight.bold,
    color: '#000000',
    letterSpacing: 0.3,
  },
  availabilityBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  availabilityText: {
    fontSize: 8,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  metaWrapper: {
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  categoryText: {
    fontSize: 8,
    fontWeight: FontWeight.medium,
    color: Colors.gold.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  titleText: {
    ...Typography.bodyPrimary,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    lineHeight: 15,
    minHeight: 30,
  },
  authorText: {
    ...Typography.bodySecondary,
    fontSize: 9,
    color: Colors.text.secondary,
    marginTop: 2,
    marginBottom: 4,
  },
  actionContainer: {
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: Colors.gold.primary,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  addBtnText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#000000',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  openBtnText: {
    fontSize: 10,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
  },
  downloadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  downloadingText: {
    fontSize: 9,
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  btnPressed: {
    opacity: 0.8,
  },
});
