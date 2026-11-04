import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  onRename?: (bookId: string, newTitle: string) => Promise<boolean> | void;
}

export const BookActionModal: React.FC<BookActionModalProps> = ({
  visible,
  book,
  onClose,
  onRemove,
  onRename,
}) => {
  const router = useRouter();
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedTitle, setEditedTitle] = useState(book?.title || '');
  const [isSavingRename, setIsSavingRename] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [lastBookId, setLastBookId] = useState<string | undefined>(book?.id);

  if (book && book.id !== lastBookId) {
    setLastBookId(book.id);
    setEditedTitle(book.title);
    setIsEditingName(false);
    setIsConfirmingRemove(false);
    setRenameError(null);
  }

  if (!book) return null;

  const handleReadPress = () => {
    onClose();
    router.push({
      pathname: '/reader/[id]',
      params: { id: book.id },
    });
  };

  const handleClose = () => {
    setIsConfirmingRemove(false);
    setIsEditingName(false);
    setRenameError(null);
    onClose();
  };

  const handleStartRename = () => {
    setEditedTitle(book.title);
    setRenameError(null);
    setIsConfirmingRemove(false);
    setIsEditingName(true);
  };

  const handleCancelRename = () => {
    setEditedTitle(book.title);
    setRenameError(null);
    setIsEditingName(false);
  };

  const handleSaveRename = async () => {
    const cleanTitle = editedTitle.trim();
    if (!cleanTitle) {
      setRenameError('Book title cannot be empty.');
      return;
    }

    if (cleanTitle === book.title) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsSavingRename(true);
      setRenameError(null);
      if (onRename) {
        await onRename(book.id, cleanTitle);
      }
      setIsEditingName(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update book title';
      setRenameError(msg);
    } finally {
      setIsSavingRename(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <View style={styles.backdropContainer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessibilityLabel="Dismiss modal" />
          <View style={styles.sheet}>
            {/* Case 1: Editing Book Name */}
            {isEditingName ? (
              <View style={styles.editSection}>
                {/* Edit Header */}
                <View style={styles.headerRow}>
                  <Pressable
                    onPress={handleCancelRename}
                    accessibilityRole="button"
                    accessibilityLabel="Back to book options"
                    style={styles.backButton}
                  >
                    <Ionicons name="arrow-back" size={18} color={Colors.text.primary} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </Pressable>

                  <Text style={styles.modalHeadingText}>Edit Book Name</Text>

                  <Pressable
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={20} color={Colors.text.secondary} />
                  </Pressable>
                </View>

                {/* Edit Form */}
                <View style={styles.editFormBox}>
                  <Text style={styles.inputLabel}>BOOK TITLE</Text>
                  <View style={[styles.inputWrapper, !!renameError && styles.inputWrapperError]}>
                    <TextInput
                      style={styles.textInput}
                      value={editedTitle}
                      onChangeText={(t) => {
                        setEditedTitle(t);
                        if (renameError) setRenameError(null);
                      }}
                      placeholder="Enter book title"
                      placeholderTextColor={Colors.text.tertiary}
                      autoFocus
                      selectTextOnFocus
                      returnKeyType="done"
                      onSubmitEditing={handleSaveRename}
                      editable={!isSavingRename}
                    />
                    {editedTitle.length > 0 && (
                      <Pressable
                        onPress={() => setEditedTitle('')}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Clear text"
                        style={styles.clearInputBtn}
                      >
                        <Ionicons name="close-circle" size={18} color={Colors.text.tertiary} />
                      </Pressable>
                    )}
                  </View>

                  {renameError ? (
                    <Text style={styles.errorText}>{renameError}</Text>
                  ) : (
                    <Text style={styles.helpText}>
                      This title will be displayed in your library, bookshelves, and reading views.
                    </Text>
                  )}
                </View>

                {/* Save and Cancel Buttons */}
                <View style={styles.editActionsRow}>
                  <Button
                    title={isSavingRename ? 'Saving...' : 'Save Title'}
                    onPress={handleSaveRename}
                    variant="primary"
                    size="md"
                    disabled={isSavingRename}
                    icon={
                      isSavingRename ? (
                        <ActivityIndicator size="small" color={Colors.midnight.darkest} />
                      ) : (
                        <Ionicons name="checkmark" size={18} color={Colors.midnight.darkest} />
                      )
                    }
                    style={styles.saveBtn}
                  />

                  <Button
                    title="Cancel"
                    onPress={handleCancelRename}
                    variant="secondary"
                    size="md"
                    disabled={isSavingRename}
                    style={styles.cancelBtn}
                  />
                </View>
              </View>
            ) : isConfirmingRemove ? (
              /* Case 2: Confirming Delete / Removal */
              <View style={styles.confirmBox}>
                <View style={styles.headerRow}>
                  <View style={styles.formatTag}>
                    <Text style={styles.formatTagText}>{book.format}</Text>
                  </View>
                  <Pressable
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={20} color={Colors.text.secondary} />
                  </Pressable>
                </View>

                <View style={styles.deleteHeaderRow}>
                  <View style={styles.deleteIconBadge}>
                    <Ionicons name="trash-outline" size={22} color={Colors.status.error} />
                  </View>
                  <View style={styles.deleteTitleBox}>
                    <Text style={styles.confirmTitle}>Delete Book from ReadOra?</Text>
                    <Text style={styles.confirmTargetTitle} numberOfLines={1}>
                      {`"${book.title}"`}
                    </Text>
                  </View>
                </View>

                <Text style={styles.confirmSub}>
                  Choose whether to permanently delete the stored file from your device, or remove the book record from your library only.
                </Text>

                <View style={styles.confirmActions}>
                  <Button
                    title="Delete File & Remove"
                    onPress={() => {
                      onRemove(book.id, true);
                      handleClose();
                    }}
                    variant="primary"
                    size="md"
                    icon={<Ionicons name="trash" size={17} color="#FFFFFF" />}
                    style={styles.confirmDeleteButton}
                    textStyle={{ color: '#FFFFFF', fontWeight: FontWeight.bold }}
                  />

                  <Button
                    title="Remove from Library Only"
                    onPress={() => {
                      onRemove(book.id, false);
                      handleClose();
                    }}
                    variant="secondary"
                    size="md"
                    icon={<Ionicons name="close-circle-outline" size={17} color="#CAD2E0" />}
                    style={styles.confirmSoftButton}
                  />

                  <Button
                    title="Cancel"
                    onPress={() => setIsConfirmingRemove(false)}
                    variant="secondary"
                    size="sm"
                    style={styles.confirmCancelButton}
                  />
                </View>
              </View>
            ) : (
              /* Case 3: Main Book Options Overview */
              <>
                {/* Top Bar with Format Tag & Close */}
                <View style={styles.headerRow}>
                  <View style={styles.formatTag}>
                    <Text style={styles.formatTagText}>{book.format}</Text>
                  </View>
                  <Pressable
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close options"
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={20} color={Colors.text.secondary} />
                  </Pressable>
                </View>

                {/* Hero Row: Cover + Title + Quick Edit */}
                <View style={styles.modalHeroRow}>
                  {book.coverUri ? (
                    <View style={styles.modalCoverBox}>
                      <Image
                        source={{ uri: book.coverUri }}
                        style={styles.modalCoverImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : null}
                  <View style={styles.modalTitleBox}>
                    <View style={styles.titleWithEditRow}>
                      <Text style={styles.title} numberOfLines={2}>
                        {book.title}
                      </Text>
                      <Pressable
                        onPress={handleStartRename}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Edit book name"
                        style={styles.quickEditBtn}
                      >
                        <Ionicons name="pencil" size={14} color={Colors.gold.primary} />
                      </Pressable>
                    </View>
                    <Text style={styles.author} numberOfLines={1}>
                      {book.author}
                    </Text>
                    <Text style={styles.filename} numberOfLines={1}>
                      {book.originalFilename}
                    </Text>
                  </View>
                </View>

                {/* Info Grid */}
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

                {/* Action Buttons: Open, Edit Name, Delete */}
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
                    title="Edit Book Name"
                    onPress={handleStartRename}
                    variant="secondary"
                    size="md"
                    icon={<Ionicons name="create-outline" size={17} color={Colors.gold.primary} />}
                    textStyle={{ color: '#E0E6F0' }}
                    style={styles.editButton}
                  />

                  <Button
                    title="Delete Book"
                    onPress={() => setIsConfirmingRemove(true)}
                    variant="secondary"
                    size="md"
                    icon={<Ionicons name="trash-outline" size={17} color={Colors.status.error} />}
                    textStyle={{ color: Colors.status.error }}
                    style={styles.removeButton}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  backdropContainer: {
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
  modalHeadingText: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.midnight.surfaceElevated,
  },
  backButtonText: {
    fontSize: FontSize.xs,
    color: Colors.text.primary,
    fontWeight: FontWeight.medium,
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
  modalHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalCoverBox: {
    width: 60,
    height: 84,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  modalCoverImage: {
    width: '100%',
    height: '100%',
  },
  modalTitleBox: {
    flex: 1,
    justifyContent: 'center',
  },
  titleWithEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    ...Typography.title3,
    color: Colors.text.primary,
    flex: 1,
  },
  quickEditBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  author: {
    fontSize: FontSize.sm,
    color: Colors.gold.primary,
    fontWeight: FontWeight.medium,
    marginBottom: 4,
  },
  filename: {
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
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
  editButton: {
    width: '100%',
    backgroundColor: '#161A24',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  removeButton: {
    width: '100%',
    backgroundColor: '#1C1518',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },

  /* Edit View Styles */
  editSection: {
    paddingTop: Spacing.xs,
  },
  editFormBox: {
    marginVertical: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12151E',
    borderWidth: 1,
    borderColor: Colors.gold.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputWrapperError: {
    borderColor: Colors.status.error,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: FontSize.md,
    paddingVertical: 0,
  },
  clearInputBtn: {
    padding: 4,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.status.error,
    marginTop: 6,
  },
  helpText: {
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    marginTop: 6,
    lineHeight: 16,
  },
  editActionsRow: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  saveBtn: {
    width: '100%',
  },
  cancelBtn: {
    width: '100%',
    borderColor: 'transparent',
  },

  /* Delete Confirmation Styles */
  confirmBox: {
    paddingTop: Spacing.xs,
  },
  deleteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  deleteIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTitleBox: {
    flex: 1,
  },
  confirmTitle: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.status.error,
  },
  confirmTargetTitle: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  confirmSub: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginVertical: Spacing.md,
    lineHeight: 18,
  },
  confirmActions: {
    gap: Spacing.sm,
  },
  confirmDeleteButton: {
    width: '100%',
    backgroundColor: '#DC2626',
  },
  confirmSoftButton: {
    width: '100%',
  },
  confirmCancelButton: {
    width: '100%',
    borderColor: 'transparent',
  },
});
