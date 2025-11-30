/**
 * KindlingLogo Component
 * 
 * Brand logo component for the Kindling app
 * 
 * @module components/ui/KindlingLogo
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KindlingColors } from '../../styles/theme';

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
  
  return (
    <View style={styles.container}>
      {/* Logo placeholder - replace with actual logo/SVG */}
      <View
        style={[
          styles.logoCircle,
          { width: logoSize, height: logoSize, borderColor: textColor },
        ]}
      >
        <Text style={[styles.logoText, { color: textColor, fontSize: logoSize * 0.4 }]}>
          K
        </Text>
      </View>
      
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
  logoCircle: {
    borderWidth: 2,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: '700',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '600',
  },
});


