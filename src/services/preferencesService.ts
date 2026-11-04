import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '@/types';

const PREFERENCES_STORAGE_KEY = '@readora_user_preferences_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  themeMode: 'midnight',
  fontSize: 18,
  fontFamily: 'serif',
  lineSpacing: 'normal',
  readingMode: 'paged',
};

/**
 * Load saved user preferences, or return default
 */
export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
    };
  } catch (err) {
    console.warn('[preferencesService] Failed to load preferences, using defaults:', err);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save updated user preferences
 */
export async function savePreferences(
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  try {
    const current = await loadPreferences();
    const updated: UserPreferences = {
      ...current,
      ...updates,
    };
    await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('[preferencesService] Failed to save preferences:', err);
    throw err;
  }
}

const ONBOARDING_COMPLETED_KEY = '@readora_onboarding_completed_v1';

/**
 * Check if the user has already completed onboarding
 */
export async function getHasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as completed
 */
export async function setHasCompletedOnboarding(completed = true): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, completed ? 'true' : 'false');
  } catch (err) {
    console.warn('[preferencesService] Failed to set onboarding status:', err);
  }
}
