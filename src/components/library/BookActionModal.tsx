import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '@/types';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { formatFileSize, formatDate } from '@/utils/fileUtils';
import { Button } from '../common/Button';

interface BookActionModalProps {
  visible: boolean;
  book: Book | null;
  onClose: () => void;
  onRemove: (bookId: string, deleteFile: boolean) => void;
}

export const BookActionModal: React.FC<BookActionModalProps> = ({
  visible,
  book,
  onClose,
  onRemove,
}) => {
  if (!book) return null;

  const handleReadPress = () => {
    Alert.alert(
      'Reading Engine in Phase 2B',
      `"${book.title}" (${book.format}) is safely stored in local app storage:\n\n${book.relativePath}\n\nThe high-performance native reading engine with reflowable typography, bookmarking, and page turn animations will be integrated in Phase 2B.`,
      [{ text: 'Got it', onPress: onClose }]
    );
  };

  const handleConfirmRemove = () => {
    Alert.alert(
      'Remove Book',
      `How would you like to remove "${book.title}"?`,
      [
        {
          text: 'Delete File & Remove',
          style: 'destructive',
          onPress: () => {
            onRemove(book.id, true);
            onClose();
          },
        },
        {
          text: 'Remove from Library Only',
          onPress: () => {
            onRemove(book.id, false);
            onClose();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Top Bar with Format & Close */}
          <View style={styles.headerRow}>
            <View style={styles.formatTag}>
              <Text style={styles.formatTagText}>{book.format}</Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close options"
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>

          {/* Title & Metadata */}
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.filename} numberOfLines={1}>
            {book.originalFilename}
          </Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>File Size</Text>
              <Text style={styles.infoValue}>{formatFileSize(book.fileSizeBytes)}</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Imported</Text>
              <Text style={styles.infoValue}>{formatDate(book.addedAt)}</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Storage Status</Text>
              <Text style={[styles.infoValue, { color: Colors.status.success }]}>
                Offline Ready
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Button
              title="Open Book"
              onPress={handleReadPress}
              variant="primary"
              size="lg"
              icon={<Ionicons name="book-outline" size={18} color={Colors.midnight.darkest} />}
              style={styles.readButton}
            />

            <Button
              title="Remove Book"
              onPress={handleConfirmRemove}
              variant="secondary"
              size="md"
              icon={<Ionicons name="trash-outline" size={16} color={Colors.status.error} />}
              textStyle={{ color: Colors.status.error }}
              style={styles.removeButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.midnight.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  formatTag: {
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  formatTagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.midnight.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  filename: {
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    marginBottom: Spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.text.primary,
  },
  actionsContainer: {
    gap: Spacing.sm,
  },
  readButton: {
    width: '100%',
  },
  removeButton: {
    width: '100%',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
});
