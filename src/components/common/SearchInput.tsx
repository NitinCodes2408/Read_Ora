import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { VoiceSearchModal } from './VoiceSearchModal';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
  editable?: boolean;
  enableVoice?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search books, authors...',
  onClear,
  style,
  editable = true,
  enableVoice = true,
}) => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  return (
    <>
      <View style={[styles.container, style]}>
        <Ionicons
          name="search-outline"
          size={18}
          color={Colors.text.tertiary}
          style={styles.searchIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          style={styles.input}
          editable={editable}
          returnKeyType="search"
          accessibilityRole="search"
          accessibilityLabel={placeholder}
        />
        {value.length > 0 && (
          <Pressable
            onPress={() => {
              onChangeText('');
              onClear?.();
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={Colors.text.secondary}
            />
          </Pressable>
        )}
        {enableVoice && (
          <Pressable
            onPress={() => setIsVoiceModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Voice search"
            style={({ pressed }) => [
              styles.micButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons
              name="mic"
              size={17}
              color={Colors.gold.primary}
            />
          </Pressable>
        )}
      </View>

      {enableVoice && (
        <VoiceSearchModal
          visible={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onApplyQuery={(query) => {
            onChangeText(query);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141720',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: FontSize.md,
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xxs,
    marginRight: 4,
  },
  micButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(229, 186, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 186, 88, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
