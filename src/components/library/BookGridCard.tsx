import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '@/types';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight } from '@/constants/typography';

interface BookGridCardProps {
  book: Book;
  itemWidth: number;
  coverHeight: number;
  onPress: () => void;
  onOptionsPress?: () => void;
}

export const BookGridCard: React.FC<BookGridCardProps> = ({
  book,
  itemWidth,
  coverHeight,
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
        return 'book-outline';
    }
  };

  return (
    <View style={[styles.cardContainer, { width: itemWidth }]}>
      {/* Book Cover Container */}
      <View style={[styles.coverContainer, { width: itemWidth, height: coverHeight }]}>
        <Pressable
          onPress={onPress}
          onLongPress={onOptionsPress}
          delayLongPress={300}
          accessibilityRole="button"
          accessibilityLabel={`Open ${book.title}`}
          accessibilityHint="Long press for options"
          style={({ pressed }) => [
            styles.coverPressable,
            pressed && styles.cardPressed,
          ]}
        >
          {book.coverUri ? (
            <Image
              source={{ uri: book.coverUri }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallbackCover}>
              <View style={styles.fallbackPattern}>
                <Ionicons
                  name={getFormatIcon()}
                  size={26}
                  color={Colors.gold.primary}
                />
                <Text style={styles.fallbackTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <View style={styles.fallbackBadge}>
                  <Text style={styles.fallbackBadgeText}>{book.format}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Reading progress bar if started */}
          {book.progressPercent > 0 && (
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(5, book.progressPercent))}%` },
                ]}
              />
            </View>
          )}
        </Pressable>

        {/* Options Button (3 dots) - SIBLING to cover pressable, NOT nested */}
        {onOptionsPress && (
          <Pressable
            onPress={onOptionsPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Options for ${book.title}`}
            style={({ pressed }) => [
              styles.optionsBtn,
              pressed && styles.optionsBtnPressed,
            ]}
          >
            <Ionicons name="ellipsis-vertical" size={13} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      {/* Title & Author Pressable Area */}
      <Pressable
        onPress={onPress}
        onLongPress={onOptionsPress}
        delayLongPress={300}
        accessibilityRole="button"
        accessibilityLabel={`${book.title} by ${book.author}`}
        style={({ pressed }) => [
          styles.textContainer,
          pressed && styles.textPressed,
        ]}
      >
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1} ellipsizeMode="tail">
          {book.author || 'Unknown Author'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 18,
  },
  coverPressable: {
    width: '100%',
    height: '100%',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  textContainer: {
    width: '100%',
  },
  textPressed: {
    opacity: 0.75,
  },
  coverContainer: {
    borderRadius: BorderRadius.md,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  fallbackCover: {
    flex: 1,
    backgroundColor: '#171B26',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  fallbackPattern: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  fallbackTitle: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semiBold,
    color: '#E0E6F0',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 13,
  },
  fallbackBadge: {
    marginTop: 8,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  fallbackBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
  progressBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.gold.primary,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 7,
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  author: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8E95A5',
    marginTop: 2,
    lineHeight: 14,
  },
  optionsBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(11, 14, 20, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  optionsBtnPressed: {
    backgroundColor: Colors.gold.primary,
    borderColor: Colors.gold.primary,
    transform: [{ scale: 0.92 }],
  },
});
