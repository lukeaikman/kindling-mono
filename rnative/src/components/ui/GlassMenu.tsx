/**
 * GlassMenu Component
 *
 * A beautiful glassmorphic bottom sheet menu with blur effect
 * Apple-inspired design with smooth animations
 *
 * @module components/ui/GlassMenu
 */

import React, { useCallback, useMemo, forwardRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography, BorderRadius } from '../../styles/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Menu item configuration
 */
export interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
}

/**
 * GlassMenu component props
 */
export interface GlassMenuProps {
  /**
   * Menu items to display
   */
  items: MenuItem[];

  /**
   * Callback when menu is dismissed
   */
  onDismiss?: () => void;
}

/**
 * Animated menu item component
 */
const MenuItemRow: React.FC<{
  item: MenuItem;
  index: number;
  onPress: () => void;
}> = ({ item, index, onPress }) => {
  const isDestructive = item.destructive;
  const iconColor = isDestructive ? KindlingColors.destructive : KindlingColors.green;
  const textColor = isDestructive ? KindlingColors.destructive : KindlingColors.navy;

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.6}
      testID={`menu-item-${item.id}`}
    >
      <View style={styles.menuItemIcon}>
        <MaterialCommunityIcons
          name={item.icon as any}
          size={26}
          color={iconColor}
        />
      </View>
      <View style={styles.menuItemText}>
        <Text style={[styles.menuItemTitle, { color: textColor }]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={`${KindlingColors.navy}30`}
      />
    </TouchableOpacity>
  );
};

/**
 * Decorative blobs that blur into beautiful colors
 */
const DecorativeBlobs: React.FC = () => (
  <View style={styles.blobContainer} pointerEvents="none">
    {/* Large green blob - top right */}
    <View style={[styles.blob, styles.blobGreen1]} />
    {/* Medium beige blob - left */}
    <View style={[styles.blob, styles.blobBeige1]} />
    {/* Small green accent - bottom */}
    <View style={[styles.blob, styles.blobGreen2]} />
    {/* Soft navy accent - top left */}
    <View style={[styles.blob, styles.blobNavy1]} />
  </View>
);

/**
 * Glass background component with blur effect
 */
const GlassBackground: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[styles.backgroundContainer, style]}>
    <DecorativeBlobs />
    <BlurView
      intensity={85}
      tint="light"
      style={StyleSheet.absoluteFill}
    />
    {/* Top edge highlight for glass effect */}
    <View style={styles.glassEdge} />
  </View>
);

/**
 * GlassMenu component
 *
 * @example
 * ```tsx
 * const menuRef = useRef<BottomSheet>(null);
 *
 * <GlassMenu
 *   ref={menuRef}
 *   items={[
 *     { id: 'settings', title: 'Settings', icon: 'cog', onPress: () => {} },
 *   ]}
 * />
 * ```
 */
export const GlassMenu = forwardRef<BottomSheet, GlassMenuProps>(
  ({ items, onDismiss }, ref) => {
    // Dynamic snap points based on content
    const snapPoints = useMemo(() => {
      const itemHeight = 72;
      const handleHeight = 24;
      const bottomPadding = 48;
      const contentHeight = handleHeight + items.length * itemHeight + bottomPadding;
      return [Math.min(contentHeight, 400)];
    }, [items.length]);

    // Custom backdrop - lighter so content shows through blur
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.25}
        />
      ),
      []
    );

    // Handle item press with dismissal
    const handleItemPress = useCallback(
      (item: MenuItem) => {
        // Close menu first, then execute action
        if (ref && 'current' in ref && ref.current) {
          ref.current.close();
        }
        // Small delay to allow animation
        setTimeout(() => {
          item.onPress();
        }, 200);
      },
      [ref]
    );

    // Handle sheet changes
    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1 && onDismiss) {
          onDismiss();
        }
      },
      [onDismiss]
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundComponent={GlassBackground}
        handleIndicatorStyle={styles.handleIndicator}
      handleStyle={styles.handleContainer}
        onChange={handleSheetChanges}
        style={styles.bottomSheet}
      >
        <BottomSheetView style={styles.contentContainer}>
          {/* Menu items */}
          <View style={styles.menuList}>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                <MenuItemRow
                  item={item}
                  index={index}
                  onPress={() => handleItemPress(item)}
                />
                {index < items.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            ))}
          </View>

          {/* Kindling branding footer */}
          <View style={styles.footer}>
            <View style={styles.footerBrand}>
              <View style={styles.brandDot} />
              <Text style={styles.footerText}>Kindling</Text>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

GlassMenu.displayName = 'GlassMenu';

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: KindlingColors.cream,
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobGreen1: {
    width: 200,
    height: 200,
    backgroundColor: KindlingColors.green,
    opacity: 0.6,
    top: -40,
    right: -60,
  },
  blobBeige1: {
    width: 160,
    height: 160,
    backgroundColor: KindlingColors.beige,
    opacity: 0.7,
    top: 80,
    left: -50,
  },
  blobGreen2: {
    width: 120,
    height: 120,
    backgroundColor: KindlingColors.lightGreen,
    opacity: 0.5,
    bottom: 20,
    right: 40,
  },
  blobNavy1: {
    width: 100,
    height: 100,
    backgroundColor: KindlingColors.navy,
    opacity: 0.15,
    top: 20,
    left: 60,
  },
  glassEdge: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: `${KindlingColors.background}90`,
  },
  handleContainer: {
    paddingTop: Spacing.md,
  },
  handleIndicator: {
    backgroundColor: `${KindlingColors.green}cc`,
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  menuList: {
    backgroundColor: `${KindlingColors.background}95`, // Slight white tint for readability
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${KindlingColors.background}80`,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md,
    minHeight: 68,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${KindlingColors.background}cc`,
    borderWidth: 1.5,
    borderColor: `${KindlingColors.background}`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    // Elevated glass look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    letterSpacing: 0.2,
  },
  menuItemSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${KindlingColors.navy}15`,
    marginLeft: 76,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KindlingColors.green,
    marginRight: Spacing.xs,
    // Glow effect
    shadowColor: KindlingColors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.mutedForeground,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
