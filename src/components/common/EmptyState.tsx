import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { FontSize, Typography } from '@/constants/typography';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
  secondaryActionTitle?: string;
  onSecondaryActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onActionPress,
  secondaryActionTitle,
  onSecondaryActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <View style={styles.iconInner}>
          {icon}
        </View>
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionTitle && onActionPress && (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          size="md"
          style={styles.actionButton}
        />
      )}

      {secondaryActionTitle && onSecondaryActionPress && (
        <Button
          title={secondaryActionTitle}
          onPress={onSecondaryActionPress}
          variant="ghost"
          size="sm"
          style={styles.secondaryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  iconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.headline,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    fontSize: FontSize.sm,
    lineHeight: 20,
    maxWidth: 290,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    minWidth: 170,
  },
  secondaryButton: {
    marginTop: Spacing.xs,
  },
});
