import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontWeight, Typography } from '@/constants/typography';
import { Book, CuratedBook, BookAvailability } from '@/types';

interface CuratedBookCardProps {
  curatedBook: CuratedBook;
  libraryBook?: Book;
  isDownloading: boolean;
  downloadProgress?: number;
  onPress: () => void;
  onAddPress: () => void;
  onOpenPress: () => void;
}

export const CuratedBookCard: React.FC<CuratedBookCardProps> = ({
  curatedBook,
  libraryBook,
  isDownloading,
  downloadProgress = 0,
  onPress,
  onAddPress,
  onOpenPress,
}) => {
  const isInLibrary = !!libraryBook;

  const availability: BookAvailability = curatedBook.availability || {
    tier: 'free_full',
    label: curatedBook.badge || 'Free Full Text',
    badgeColor: '#22C55E',
    badgeBg: 'rgba(34, 197, 94, 0.16)',
    canAddToLibrary: true,
    canReadInApp: true,
    description: 'Verified public-domain edition. Free to read & add to your library.',
  };

  const badgeText = curatedBook.badge || availability.label;

  return (
    <View style={styles.card}>
      {/* Clickable cover and info */}
      <Pressable
        style={({ pressed }) => [styles.clickableArea, pressed && styles.areaPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${curatedBook.title} by ${curatedBook.author}`}
      >
        {/* Cover container */}
        <View style={styles.coverWrapper}>
          <Image
            source={{ uri: curatedBook.coverUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          {/* Format Badge */}
          <View style={styles.formatBadge}>
            <Text style={styles.formatText}>{curatedBook.format}</Text>
          </View>

          {/* Optional Editorial / Availability Badge */}
          {badgeText && (
            <View
              style={[
                styles.editorialBadge,
                {
                  backgroundColor: availability.badgeBg || 'rgba(11, 14, 20, 0.88)',
                  borderColor: availability.badgeColor || Colors.gold.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.editorialText,
                  { color: availability.badgeColor || Colors.gold.primary },
                ]}
                numberOfLines={1}
              >
                {badgeText}
              </Text>
            </View>
          )}
        </View>

        {/* Book Info */}
        <View style={styles.infoWrapper}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {curatedBook.category} • {curatedBook.publishedYear}
          </Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {curatedBook.title}
          </Text>
          <Text style={styles.authorText} numberOfLines={1}>
            {curatedBook.author}
          </Text>
        </View>
      </Pressable>

      {/* Action Button (Sibling Pressable) */}
      <View style={styles.actionContainer}>
        {isDownloading ? (
          <View style={styles.downloadingBtn}>
            <ActivityIndicator size="small" color={Colors.gold.primary} />
            <Text style={styles.downloadingText}>
              {downloadProgress > 0 ? `${downloadProgress}%` : 'Adding...'}
            </Text>
          </View>
        ) : isInLibrary ? (
          <Pressable
            style={({ pressed }) => [
              styles.openBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={onOpenPress}
            accessibilityRole="button"
            accessibilityLabel="Open Book"
          >
            <Ionicons name="book-outline" size={13} color={Colors.gold.primary} />
            <Text style={styles.openBtnText}>Read</Text>
          </Pressable>
        ) : availability.tier === 'free_full' || availability.canAddToLibrary ? (
          <Pressable
            style={({ pressed }) => [
              styles.addBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={onAddPress}
            accessibilityRole="button"
            accessibilityLabel="Add to Library"
          >
            <Ionicons name="add" size={14} color="#000000" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        ) : availability.tier === 'preview' ? (
          <Pressable
            style={({ pressed }) => [
              styles.previewBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="Preview Book"
          >
            <Ionicons name="eye-outline" size={13} color="#F59E0B" />
            <Text style={styles.previewBtnText}>Preview</Text>
          </Pressable>
        ) : availability.tier === 'borrow' ? (
          <Pressable
            style={({ pressed }) => [
              styles.borrowBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="Borrow Book"
          >
            <Ionicons name="library-outline" size={13} color="#38BDF8" />
            <Text style={styles.borrowBtnText}>Borrow</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.detailsBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="View Details"
          >
            <Ionicons name="information-circle-outline" size={13} color={Colors.gold.primary} />
            <Text style={styles.detailsBtnText}>Details</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.midnight.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  clickableArea: {
    width: '100%',
  },
  areaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
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
  formatBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  editorialBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(11, 14, 20, 0.88)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.gold.border,
  },
  editorialText: {
    fontSize: 9,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
    textAlign: 'center',
  },
  infoWrapper: {
    paddingTop: Spacing.xs,
    paddingHorizontal: 2,
    flex: 1,
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 9,
    fontWeight: FontWeight.medium,
    color: Colors.gold.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  titleText: {
    ...Typography.bodyPrimary,
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    lineHeight: 16,
    minHeight: 32,
  },
  authorText: {
    ...Typography.bodySecondary,
    fontSize: 10,
    color: Colors.text.secondary,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  actionContainer: {
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.gold.primary,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  btnPressed: {
    opacity: 0.8,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#000000',
  },
  openBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  previewBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.semiBold,
    color: '#F59E0B',
  },
  borrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  borrowBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.semiBold,
    color: '#38BDF8',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  detailsBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
  },
  downloadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  downloadingText: {
    fontSize: 10,
    color: Colors.gold.primary,
    fontWeight: FontWeight.medium,
  },
});
