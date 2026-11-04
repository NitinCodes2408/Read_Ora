import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { Book, CuratedBook, BookAvailability } from '@/types';

interface CuratedBookModalProps {
  visible: boolean;
  curatedBook: CuratedBook | null;
  libraryBook?: Book;
  isDownloading: boolean;
  downloadProgress?: number;
  onClose: () => void;
  onAddPress: () => void;
  onOpenPress: () => void;
}

export const CuratedBookModal: React.FC<CuratedBookModalProps> = ({
  visible,
  curatedBook,
  libraryBook,
  isDownloading,
  downloadProgress = 0,
  onClose,
  onAddPress,
  onOpenPress,
}) => {
  const handleOpenExternal = useCallback(async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.warn('[CuratedBookModal] Cannot open external URL:', err);
    }
  }, []);

  if (!curatedBook) return null;

  const isInLibrary = !!libraryBook;

  const availability: BookAvailability = curatedBook.availability || {
    tier: 'free_full',
    label: 'Free Full Text',
    badgeColor: '#22C55E',
    badgeBg: 'rgba(34, 197, 94, 0.16)',
    canAddToLibrary: true,
    canReadInApp: true,
    description: 'Verified public-domain edition. Free to read & add to your library.',
  };

  const getTierIcon = (tier: string): keyof typeof Ionicons.glyphMap => {
    switch (tier) {
      case 'free_full':
        return 'shield-checkmark';
      case 'preview':
        return 'eye';
      case 'borrow':
        return 'library';
      case 'commercial':
        return 'cart';
      default:
        return 'document-text';
    }
  };

  const getNoticeIcon = (tier: string): keyof typeof Ionicons.glyphMap => {
    switch (tier) {
      case 'free_full':
        return 'shield-checkmark-outline';
      case 'preview':
        return 'information-circle-outline';
      case 'borrow':
        return 'library-outline';
      case 'commercial':
        return 'storefront-outline';
      default:
        return 'receipt-outline';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdropContainer}>
        {/* Dismissal Backdrop */}
        <Pressable
          style={styles.backdropDismiss}
          onPress={onClose}
          accessibilityLabel="Close Modal"
        />

        {/* Modal Sheet */}
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerChips}>
              <View style={styles.categoryChip}>
                <Ionicons name="sparkles" size={12} color={Colors.gold.primary} />
                <Text style={styles.categoryChipText}>{curatedBook.category}</Text>
              </View>

              {/* 5-Tier Availability Badge */}
              <View
                style={[
                  styles.availabilityBadge,
                  {
                    backgroundColor: availability.badgeBg,
                    borderColor: availability.badgeColor,
                  },
                ]}
              >
                <Ionicons
                  name={getTierIcon(availability.tier)}
                  size={11}
                  color={availability.badgeColor}
                />
                <Text
                  style={[
                    styles.availabilityBadgeText,
                    { color: availability.badgeColor },
                  ]}
                >
                  {availability.label}
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && styles.btnPressed]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Top Section with Cover and Metadata */}
            <View style={styles.topSection}>
              <View style={styles.coverWrapper}>
                <Image
                  source={{ uri: curatedBook.coverUrl }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.metaWrapper}>
                {curatedBook.badge && curatedBook.badge !== availability.label && (
                  <View style={styles.badgeWrapper}>
                    <Text style={styles.badgeText}>{curatedBook.badge}</Text>
                  </View>
                )}
                <Text style={styles.titleText}>{curatedBook.title}</Text>
                <Text style={styles.authorText}>by {curatedBook.author}</Text>

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Year</Text>
                    <Text style={styles.detailValue}>{curatedBook.publishedYear}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Pages</Text>
                    <Text style={styles.detailValue}>~{curatedBook.estimatedPages}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Language</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {curatedBook.language || 'English'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Format</Text>
                    <Text style={styles.detailValue}>{curatedBook.format}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Synopsis Section */}
            <View style={styles.synopsisSection}>
              <Text style={styles.sectionHeading}>About this Work</Text>
              <Text style={styles.synopsisText}>{curatedBook.description}</Text>

              {(!!curatedBook.publisher || !!curatedBook.isbn) && (
                <View style={styles.pubBox}>
                  {!!curatedBook.publisher && (
                    <Text style={styles.pubInfoText}>
                      <Text style={styles.pubInfoLabel}>Publisher: </Text>
                      {curatedBook.publisher}
                    </Text>
                  )}
                  {!!curatedBook.isbn && (
                    <Text style={styles.pubInfoText}>
                      <Text style={styles.pubInfoLabel}>ISBN: </Text>
                      {curatedBook.isbn}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Unabridged Full Text Guarantee Card */}
            {(availability.tier === 'free_full' || availability.canReadInApp) && (
              <View style={styles.unabridgedCard}>
                <View style={styles.unabridgedIconWrap}>
                  <Ionicons name="book" size={16} color={Colors.gold.primary} />
                </View>
                <View style={styles.unabridgedInfo}>
                  <Text style={styles.unabridgedTitle}>Complete Unabridged Edition</Text>
                  <Text style={styles.unabridgedDesc}>
                    Full narrative text with all chapters, original letters, and sections included for complete offline reading.
                  </Text>
                </View>
              </View>
            )}

            {/* Phase 2: Dynamic Smart Availability Notice */}
            <View
              style={[
                styles.legalNotice,
                {
                  backgroundColor: availability.badgeBg,
                  borderColor: availability.badgeColor,
                },
              ]}
            >
              <Ionicons
                name={getNoticeIcon(availability.tier)}
                size={18}
                color={availability.badgeColor}
              />
              <Text style={styles.legalNoticeText}>
                {availability.description}
              </Text>
            </View>
          </ScrollView>

          {/* Context-Aware Action Footer */}
          <View style={styles.footer}>
            {isDownloading ? (
              <View style={styles.downloadingContainer}>
                <View style={styles.downloadProgressHeader}>
                  <View style={styles.downloadProgressStatus}>
                    <ActivityIndicator size="small" color={Colors.gold.primary} />
                    <Text style={styles.downloadingBtnText}>
                      {downloadProgress >= 90
                        ? 'Saving to Offline Library...'
                        : downloadProgress >= 50
                        ? 'Fetching Digital Edition...'
                        : 'Connecting to Archive...'}
                    </Text>
                  </View>
                  <Text style={styles.downloadPercentText}>{downloadProgress}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.max(downloadProgress, 10)}%` },
                    ]}
                  />
                </View>
              </View>
            ) : isInLibrary ? (
              <View style={styles.inLibraryFooter}>
                <View style={styles.inLibraryStatus}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />
                  <Text style={styles.inLibraryText}>Already saved in Library • Complete Book</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                  onPress={onOpenPress}
                  accessibilityRole="button"
                  accessibilityLabel="Read Entire Book"
                >
                  <Ionicons name="book" size={17} color="#000000" />
                  <Text style={styles.primaryBtnText}>Read Entire Book</Text>
                </Pressable>
              </View>
            ) : availability.tier === 'free_full' || availability.canAddToLibrary ? (
              <View style={styles.actionsColumn}>
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                  onPress={onOpenPress}
                  accessibilityRole="button"
                  accessibilityLabel="Read Entire Book Now"
                >
                  <Ionicons name="book" size={17} color="#000000" />
                  <Text style={styles.primaryBtnText}>Read Entire Book Now</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                  onPress={onAddPress}
                  accessibilityRole="button"
                  accessibilityLabel="Save to My Library"
                >
                  <Ionicons name="download-outline" size={16} color={Colors.gold.primary} />
                  <Text style={styles.secondaryBtnText}>Save to My Library (Offline EPUB)</Text>
                </Pressable>
              </View>
            ) : availability.tier === 'preview' ? (
              <Pressable
                style={({ pressed }) => [styles.amberBtn, pressed && styles.btnPressed]}
                onPress={() => handleOpenExternal(availability.previewUrl || availability.infoUrl)}
                accessibilityRole="button"
                accessibilityLabel="Read Preview"
              >
                <Ionicons name="eye-outline" size={18} color="#000000" />
                <Text style={styles.amberBtnText}>Read Free Preview Online</Text>
              </Pressable>
            ) : availability.tier === 'borrow' ? (
              <Pressable
                style={({ pressed }) => [styles.skyBtn, pressed && styles.btnPressed]}
                onPress={() => handleOpenExternal(availability.borrowUrl || availability.infoUrl)}
                accessibilityRole="button"
                accessibilityLabel="Borrow on Open Library"
              >
                <Ionicons name="library-outline" size={18} color="#000000" />
                <Text style={styles.skyBtnText}>Borrow on Open Library</Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                onPress={() => handleOpenExternal(availability.infoUrl)}
                accessibilityRole="button"
                accessibilityLabel="View Online Store"
              >
                <Ionicons name="open-outline" size={18} color="#000000" />
                <Text style={styles.primaryBtnText}>
                  {availability.tier === 'commercial'
                    ? 'Find on Google Books / Store'
                    : 'View Bibliographic Record'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdropContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: Colors.midnight.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    maxHeight: '85%',
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  headerChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    flexWrap: 'wrap',
    marginRight: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
    textTransform: 'uppercase',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  availabilityBadgeText: {
    fontSize: 11,
    fontWeight: FontWeight.semiBold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.midnight.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.8,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  topSection: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  coverWrapper: {
    width: 105,
    aspectRatio: 2 / 3,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  metaWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(229, 186, 88, 0.15)',
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
  },
  titleText: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    lineHeight: 22,
    marginBottom: 2,
  },
  authorText: {
    ...Typography.bodySecondary,
    fontSize: FontSize.xs + 1,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    backgroundColor: Colors.midnight.surfaceElevated,
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  detailItem: {
    alignItems: 'center',
    minWidth: 48,
  },
  detailLabel: {
    fontSize: 9,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: FontWeight.bold,
  },
  detailValue: {
    fontSize: 11,
    fontWeight: FontWeight.semiBold,
    color: Colors.text.primary,
    marginTop: 1,
  },
  synopsisSection: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  synopsisText: {
    ...Typography.bodySecondary,
    fontSize: FontSize.xs + 1,
    lineHeight: 20,
    color: Colors.text.secondary,
  },
  pubBox: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderColor: Colors.midnight.border,
    gap: 3,
  },
  pubInfoText: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  pubInfoLabel: {
    fontWeight: FontWeight.bold,
    color: Colors.text.tertiary,
  },
  unabridgedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(229, 186, 88, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229, 186, 88, 0.28)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  unabridgedIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 186, 88, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  unabridgedInfo: {
    flex: 1,
  },
  unabridgedTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    marginBottom: 2,
  },
  unabridgedDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.text.secondary,
  },
  legalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  legalNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Colors.midnight.border,
  },
  actionsColumn: {
    gap: Spacing.xs,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(229, 186, 88, 0.08)',
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  secondaryBtnText: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  primaryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#000000',
  },
  amberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  amberBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#000000',
  },
  skyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  skyBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#000000',
  },
  inLibraryFooter: {
    gap: Spacing.xs,
  },
  inLibraryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 2,
  },
  inLibraryText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
    color: Colors.status.success,
  },
  downloadingContainer: {
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 8,
  },
  downloadProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  downloadProgressStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  downloadPercentText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    marginLeft: Spacing.sm,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.gold.primary,
    borderRadius: 3,
  },
  downloadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  downloadingBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
  },
});
