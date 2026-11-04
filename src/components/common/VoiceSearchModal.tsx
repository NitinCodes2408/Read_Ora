import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight } from '@/constants/typography';
import {
  VoiceLanguage,
  startVoiceRecognition,
  stopVoiceRecognition,
  isVoiceRecognitionSupported,
} from '@/services/voiceAssistantService';

interface VoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyQuery: (query: string) => void;
}

const LANGUAGES: { id: VoiceLanguage; label: string; native: string }[] = [
  { id: 'en-IN', label: 'English', native: 'English' },
  { id: 'hi-IN', label: 'Hindi', native: 'हिंदी' },
  { id: 'mr-IN', label: 'Marathi', native: 'मराठी' },
];

const SUGGESTIONS = [
  { text: 'Munshi Premchand', lang: 'Hindi' },
  { text: 'Shivaji Sawant', lang: 'Marathi' },
  { text: 'The Art of War', lang: 'English' },
  { text: 'गोदान', lang: 'Hindi' },
  { text: 'मृत्युंजय', lang: 'Marathi' },
];

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  visible,
  onClose,
  onApplyQuery,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>('en-IN');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pulse animation for mic orb
  const [pulseAnim] = useState(() => new Animated.Value(1));

  const handleClose = useCallback(() => {
    stopVoiceRecognition();
    setIsListening(false);
    setTranscript('');
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isListening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => {
        loop.stop();
      };
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  const handleStartListening = useCallback((lang: VoiceLanguage) => {
    setTranscript('');
    setErrorMessage(null);

    const started = startVoiceRecognition(lang, {
      onStart: () => {
        setIsListening(true);
      },
      onResult: (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          setIsListening(false);
          // Small delay so user sees what was recognized before closing
          setTimeout(() => {
            onApplyQuery(text);
            handleClose();
          }, 400);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setErrorMessage(err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!started && !isVoiceRecognitionSupported()) {
      setErrorMessage('Speech recognition is not supported in this browser. You can tap any suggestion below.');
    }
  }, [onApplyQuery, handleClose]);

  // Start listening after modal is presented
  useEffect(() => {
    if (!visible) {
      stopVoiceRecognition();
      return;
    }

    const timer = setTimeout(() => {
      handleStartListening(selectedLanguage);
    }, 100);

    return () => {
      clearTimeout(timer);
      stopVoiceRecognition();
    };
  }, [visible, selectedLanguage, handleStartListening]);

  const handleLanguageChange = (lang: VoiceLanguage) => {
    setSelectedLanguage(lang);
    stopVoiceRecognition();
    handleStartListening(lang);
  };

  const handleConfirmTranscript = () => {
    if (transcript.trim()) {
      stopVoiceRecognition();
      onApplyQuery(transcript.trim());
      handleClose();
    }
  };

  const handleSuggestionPress = (text: string) => {
    stopVoiceRecognition();
    onApplyQuery(text);
    handleClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdropContainer}>
        {/* Dismissal background */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityLabel="Dismiss voice search"
        />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="mic" size={18} color={Colors.gold.primary} />
              <Text style={styles.headerTitle}>Voice Assistant Search</Text>
            </View>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>

          {/* Language selector chips */}
          <View style={styles.langRow}>
            {LANGUAGES.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => handleLanguageChange(l.id)}
                style={[
                  styles.langChip,
                  selectedLanguage === l.id && styles.langChipActive,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.langChipText,
                    selectedLanguage === l.id && styles.langChipTextActive,
                  ]}
                >
                  {l.native} ({l.label})
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Animated Mic Orb */}
          <View style={styles.micOrbContainer}>
            <Animated.View
              style={[
                styles.micPulseRing,
                isListening && styles.micPulseRingActive,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Pressable
              onPress={() => handleStartListening(selectedLanguage)}
              style={({ pressed }) => [
                styles.micOrb,
                isListening && styles.micOrbActive,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Tap to speak"
            >
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={34}
                color={isListening ? '#000000' : Colors.gold.primary}
              />
            </Pressable>
          </View>

          {/* Status Message */}
          <Text style={styles.statusText}>
            {isListening
              ? `Listening in ${LANGUAGES.find((l) => l.id === selectedLanguage)?.label}...`
              : 'Tap microphone to speak'}
          </Text>

          {/* Transcript Display Box */}
          <View style={styles.transcriptBox}>
            {transcript ? (
              <Text style={styles.transcriptText}>&quot;{transcript}&quot;</Text>
            ) : (
              <Text style={styles.placeholderText}>
                Speak a book title, author, or topic...
              </Text>
            )}
          </View>

          {/* Error Message if any */}
          {!!errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.status.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Quick Voice Suggestions */}
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsHeading}>Quick Voice Suggestions:</Text>
            <View style={styles.suggestionsWrap}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s.text}
                  onPress={() => handleSuggestionPress(s.text)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Ionicons name="sparkles-outline" size={12} color={Colors.gold.primary} />
                  <Text style={styles.suggestionText}>{s.text}</Text>
                  <Text style={styles.suggestionLang}>({s.lang})</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Action Footer */}
          <View style={styles.footer}>
            {transcript.trim() ? (
              <Pressable
                onPress={handleConfirmTranscript}
                style={({ pressed }) => [styles.searchBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Search this query"
              >
                <Ionicons name="search" size={16} color="#000000" />
                <Text style={styles.searchBtnText}>Search &quot;{transcript}&quot;</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.midnight.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
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
  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  langChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
  },
  langChipActive: {
    backgroundColor: Colors.gold.glow,
    borderColor: Colors.gold.border,
  },
  langChipText: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
  langChipTextActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  micOrbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginVertical: Spacing.xs,
  },
  micPulseRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'transparent',
  },
  micPulseRingActive: {
    backgroundColor: 'rgba(229, 186, 88, 0.18)',
    borderWidth: 1.5,
    borderColor: Colors.gold.border,
  },
  micOrb: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micOrbActive: {
    backgroundColor: Colors.gold.primary,
    borderColor: '#FFFFFF',
    shadowColor: Colors.gold.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: FontWeight.medium,
    color: Colors.gold.primary,
    marginBottom: Spacing.sm,
  },
  transcriptBox: {
    backgroundColor: Colors.midnight.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: Spacing.md,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  transcriptText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: FontSize.xs + 1,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    color: Colors.status.error,
  },
  suggestionsSection: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  suggestionsHeading: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  suggestionLang: {
    fontSize: 9,
    color: Colors.gold.primary,
  },
  footer: {
    marginTop: Spacing.xs,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  searchBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#000000',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    color: Colors.text.tertiary,
  },
});
