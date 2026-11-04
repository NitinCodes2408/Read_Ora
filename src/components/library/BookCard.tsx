import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '@/types';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { formatFileSize, formatDate } from '@/utils/fileUtils';
import { Card } from '../common/Card';

interface BookCardProps {
  book: Book;
  onPress: () => void;
  onOptionsPress?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onPress,
  onOptionsPress,
}) => {
  const getFormatIcon = () => {
    switch (book.format) {
      case 'PDF':
        return 'document-text';
      case 'EPUB':
        return 'book';
      case 'TXT':
        return 'document';
      default:
        return 'document-outline';
    }
  };

  return (
    <Card variant="default" style={styles.card}>
      <View style={styles.cardContent}>
        {/* Main Clickable Area: Book Cover and Metadata */}
        <Link
          href={{
            pathname: '/reader/[id]',
            params: { id: book.id },
          }}
          asChild
        >
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Open ${book.title}`}
            style={({ pressed }) => [
              styles.mainTouchable,
              pressed && styles.mainPressed,
            ]}
          >
          {/* Book Cover / Icon Box */}
          <View style={styles.coverBox}>
            {book.coverUri ? (
              <Image
                source={{ uri: book.coverUri }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons
                  name={getFormatIcon()}
                  size={24}
                  color={Colors.gold.primary}
                />
              </View>
            )}

            <View style={styles.formatPill}>
              <Text style={styles.formatPillText}>{book.format}</Text>
            </View>
          </View>

          {/* Book Details */}
          <View style={styles.detailsColumn}>
            <Text style={styles.title} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={styles.author} numberOfLines={1}>
              {book.author}
            </Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{formatFileSize(book.fileSizeBytes)}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{formatDate(book.addedAt)}</Text>
            </View>
          </View>
        </Pressable>
      </Link>

        {/* Options / Action Button (Sibling, NOT nested) */}
        <Pressable
          onPress={onOptionsPress || onPress}
          accessibilityRole="button"
          accessibilityLabel={`Options for ${book.title}`}
          style={({ pressed }) => [
            styles.optionsButton,
            pressed && styles.optionsPressed,
          ]}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={Colors.text.secondary}
          />
        </Pressable>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainPressed: {
    opacity: 0.8,
  },
  coverBox: {
    width: 54,
    height: 76,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatPill: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(11, 14, 20, 0.88)',
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  formatPillText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
  detailsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  author: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
  },
  metaDot: {
    marginHorizontal: 5,
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  optionsPressed: {
    opacity: 0.6,
  },
});
