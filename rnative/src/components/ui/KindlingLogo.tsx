/**
 * KindlingLogo Component
 * 
 * Brand logo component for the Kindling app
 * 
 * @module components/ui/KindlingLogo
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { KindlingColors } from '../../styles/theme';

// Import logo images
const iconBlue = require('../../../assets/icon-blue.png');
const iconWhite = require('../../../assets/icon-white.png');

/**
 * KindlingLogo component props
 */
export interface KindlingLogoProps {
  /**
   * Logo size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Color variant
   * - 'dark': Blue icon for light backgrounds
   * - 'light': White icon for dark backgrounds
   */
  variant?: 'dark' | 'light';
  
  /**
   * Whether to show text alongside logo
   */
  showText?: boolean;
}

/**
 * KindlingLogo component
 * 
 * @example
 * ```tsx
 * <KindlingLogo size="md" variant="dark" showText />
 * ```
 */
export const KindlingLogo: React.FC<KindlingLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showText = true,
}) => {
  const logoSize = size === 'sm' ? 32 : size === 'lg' ? 64 : 48;
  const textColor = variant === 'dark' ? KindlingColors.navy : KindlingColors.cream;
  const logoSource = variant === 'dark' ? iconBlue : iconWhite;
  
  return (
    <View style={styles.container}>
      <Image
        source={logoSource}
        style={{ width: logoSize, height: logoSize }}
        resizeMode="contain"
      />
      
      {showText && (
        <Text style={[styles.brandText, { color: textColor }]}>
          Kindling
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '600',
  },
});


