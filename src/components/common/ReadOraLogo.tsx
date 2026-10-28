import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, Text } from 'react-native';

interface ReadOraLogoProps {
  variant?: 'dark' | 'transparent';
  width?: number;
  showTagline?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Aspect ratio of the official ReadOra logo is 278 / 78 ≈ 3.56
const LOGO_ASPECT_RATIO = 278 / 78;

export const ReadOraLogo: React.FC<ReadOraLogoProps> = ({
  variant = 'transparent',
  width = 200,
  showTagline = true,
  style,
}) => {
  const height = width / LOGO_ASPECT_RATIO;

  const logoSource =
    variant === 'transparent'
      ? require('../../../assets/brand/readora-logo-transparent.png')
      : require('../../../assets/brand/readora-logo.png');

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="ReadOra logo — Your Books. Your World."
    >
      <Image
        source={logoSource}
        style={{ width, height }}
        resizeMode="contain"
      />
      {!showTagline && (
        <Text style={styles.srOnly}>ReadOra</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  srOnly: {
    display: 'none',
  },
});
