/**
 * Developer Dashboard Screen
 * 
 * Development tool for:
 * - Viewing AsyncStorage data
 * - Seeding test data
 * - Navigating to any screen
 * - Purging all data
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Select } from '../../src/components/ui/Select';
import { SplashScreen } from '../../src/components/splash';
import { useAppState } from '../../src/hooks/useAppState';
import { useAuth } from '../../src/hooks/useAuth';
import { seedAllData } from '../../src/utils/seedData';
import { copyToClipboard } from '../../src/utils/clipboardHelpers';
import { storage } from '../../src/services/storage';
import { STORAGE_KEYS } from '../../src/constants';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

/**
 * Developer Dashboard Screen
 * 
 * Provides tools for development and debugging
 */
export default function DeveloperDashboard() {
  const { personActions, bequeathalActions, willActions, purgeAllData, ownerId } = useAppState();
  const { logout } = useAuth();
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSplash, setShowSplash] = useState(false);
  const [showStorageKeys, setShowStorageKeys] = useState(false);
  
  // Navigation dropdown states
  const [onboardingScreen, setOnboardingScreen] = useState('/onboarding/welcome');
  const [executorsScreen, setExecutorsScreen] = useState('/executors/intro');
  const [guardianshipScreen, setGuardianshipScreen] = useState('/guardianship/intro');
  const [bequeathalScreen, setBequeathalScreen] = useState('/bequeathal/intro');
  const [dashboardScreen, setDashboardScreen] = useState('/order-of-things');
  
  // Load storage data for display
  useEffect(() => {
    loadStorageData();
  }, [refreshKey]);
  
  const loadStorageData = async () => {
    const data: Record<string, any> = {};

    const allKeys = await storage.getAllKeys();
    const scopedKeys = allKeys.filter((key) => key.startsWith('kindling:') && key.includes(':kindling-'));

    for (const key of scopedKeys) {
      try {
        const value = await storage.load(key, null);
        data[key] = value;
      } catch (error) {
        data[key] = null;
      }
    }

    setStorageData(data);
  };
  
  const handleSeedAllData = async () => {
    await seedAllData(personActions, bequeathalActions);
    setRefreshKey(prev => prev + 1);
    console.log('✅ All data seeded');
  };
  
  const handlePurgeAllData = async () => {
    await purgeAllData();
    setRefreshKey(prev => prev + 1);
    console.log('✅ All data purged');
  };
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const handleCopy = async (data: any) => {
    const success = await copyToClipboard(data);
    if (success) {
      console.log('📋 Copied to clipboard');
    }
  };
  
  // Show splash screen when triggered
  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => setShowSplash(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Developer Dashboard</Text>
        <Button
          variant="outline"
          onPress={() => router.back()}
        >
          Back
        </Button>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Actions Card */}
        <Card title="Developer Actions" style={styles.card}>
          <View style={styles.buttonGroup}>
            <Button
              variant="primary"
              onPress={handleSeedAllData}
            >
              Seed All Data
            </Button>
            
            <Button
              variant="destructive"
              onPress={handlePurgeAllData}
            >
              Purge All Data
            </Button>
            
            <Button
              variant="secondary"
              onPress={handleRefresh}
            >
              Refresh Data View
            </Button>

            <Button
              variant="outline"
              onPress={handleLogout}
            >
              Logout
            </Button>
          </View>
        </Card>
        
        {/* Testing Sandboxes */}
        <Card title="Testing Sandboxes" style={styles.card}>
          <View style={styles.buttonGroup}>
            <Button
              variant="primary"
              onPress={() => setShowSplash(true)}
              icon="play"
            >
              Run Intro Animation
            </Button>
            
            <Button
              variant="secondary"
              onPress={() => router.push('/developer/sandbox')}
            >
              Component Sandbox
            </Button>
            
            <Button
              variant="secondary"
              onPress={() => router.push('/developer/trust-sandbox')}
            >
              Trust Details Sandbox
            </Button>
          </View>
        </Card>
        
        {/* Data Explorer Card */}
        <Card title="Data Explorer" style={styles.card}>
          <View style={styles.buttonGroup}>
            <Button
              variant="primary"
              onPress={() => router.push('/developer/data-explorer')}
            >
              Explore Data (3-Level Drill-Down)
            </Button>
            <Button
              variant="outline"
              onPress={() => setShowStorageKeys(prev => !prev)}
            >
              {showStorageKeys ? 'Hide Storage Keys' : 'View Storage Keys'}
            </Button>
          </View>
          <View style={styles.explorerInfo}>
            <Text style={styles.explorerInfoText}>
              Browse interfaces → instances → properties with role filtering and copy functionality
            </Text>
          </View>

          {showStorageKeys && (
            <View style={styles.storageKeysSection}>
              <View style={styles.storageHeaderRow}>
                <View>
                  <Text style={styles.storageSectionTitle}>Active User</Text>
                  <Text style={styles.ownerIdText}>{ownerId}</Text>
                </View>
                <IconButton
                  icon="content-copy"
                  size={18}
                  iconColor={KindlingColors.green}
                  onPress={() => {
                    const activeKeys = Object.entries(storageData)
                      .filter(([key]) => key.startsWith(`kindling:${ownerId}:`))
                      .reduce<Record<string, any>>((acc, [key, value]) => {
                        acc[key] = value;
                        return acc;
                      }, {});
                    handleCopy(activeKeys);
                  }}
                />
              </View>
              <ScrollView horizontal={false} style={styles.dataViewer}>
                {Object.entries(storageData)
                  .filter(([key]) => key.startsWith(`kindling:${ownerId}:`))
                  .map(([key, value]) => (
                    <View key={key} style={styles.dataItem}>
                      <Text style={styles.dataKey}>{key}</Text>
                      <Text style={styles.dataValue} numberOfLines={5}>
                        {value ? JSON.stringify(value, null, 2) : 'null'}
                      </Text>
                    </View>
                  ))}
              </ScrollView>

              <View style={styles.storageHeaderRow}>
                <Text style={styles.storageSectionTitle}>Other Users</Text>
                <IconButton
                  icon="content-copy"
                  size={18}
                  iconColor={KindlingColors.green}
                  onPress={() => {
                    const otherKeys = Object.entries(storageData)
                      .filter(([key]) => !key.startsWith(`kindling:${ownerId}:`))
                      .reduce<Record<string, any>>((acc, [key, value]) => {
                        acc[key] = value;
                        return acc;
                      }, {});
                    handleCopy(otherKeys);
                  }}
                />
              </View>
              <ScrollView horizontal={false} style={styles.dataViewer}>
                {Object.entries(storageData)
                  .filter(([key]) => !key.startsWith(`kindling:${ownerId}:`))
                  .map(([key, value]) => (
                    <View key={key} style={styles.dataItem}>
                      <Text style={styles.dataKey}>{key}</Text>
                      <Text style={styles.dataValue} numberOfLines={5}>
                        {value ? JSON.stringify(value, null, 2) : 'null'}
                      </Text>
                    </View>
                  ))}
              </ScrollView>
            </View>
          )}
        </Card>
        
        {/* Navigation Card - Dropdown + Arrow Pattern */}
        <Card title="Quick Navigation" style={styles.card}>
          <View style={styles.navSections}>
            {/* Onboarding Section */}
            <View style={styles.navSection}>
              <Text style={styles.categoryTitle}>Onboarding</Text>
              <View style={styles.navRow}>
                <View style={styles.navDropdown}>
                  <Select
                    value={onboardingScreen}
                    options={[
                      { label: 'Welcome', value: '/onboarding/welcome' },
                      { label: 'Location', value: '/onboarding/location' },
                      { label: 'Family', value: '/onboarding/family' },
                      { label: 'Extended Family', value: '/onboarding/extended-family' },
                      { label: 'Wrap-up', value: '/onboarding/wrap-up' },
                    ]}
                    onChange={setOnboardingScreen}
                  />
                </View>
                <TouchableOpacity
                  style={styles.navArrow}
                  onPress={() => router.push(onboardingScreen)}
                >
                  <IconButton icon="arrow-right" size={20} iconColor={KindlingColors.navy} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Executors Section */}
            <View style={styles.navSection}>
              <Text style={styles.categoryTitle}>Executors</Text>
              <View style={styles.navRow}>
                <View style={styles.navDropdown}>
                  <Select
                    value={executorsScreen}
                    options={[
                      { label: 'Intro', value: '/executors/intro' },
                      { label: 'Selection', value: '/executors/selection' },
                      { label: 'Invitation', value: '/executors/invitation' },
                      { label: 'Professional', value: '/executors/professional' },
                    ]}
                    onChange={setExecutorsScreen}
                  />
                </View>
                <TouchableOpacity
                  style={styles.navArrow}
                  onPress={() => router.push(executorsScreen)}
                >
                  <IconButton icon="arrow-right" size={20} iconColor={KindlingColors.navy} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Guardianship Section */}
            <View style={styles.navSection}>
              <Text style={styles.categoryTitle}>Guardianship</Text>
              <View style={styles.navRow}>
                <View style={styles.navDropdown}>
                  <Select
                    value={guardianshipScreen}
                    options={[
                      { label: 'Intro', value: '/guardianship/intro' },
                      { label: 'Guardian Wishes', value: '/guardianship/wishes' },
                    ]}
                    onChange={setGuardianshipScreen}
                  />
                </View>
                <TouchableOpacity
                  style={styles.navArrow}
                  onPress={() => router.push(guardianshipScreen)}
                >
                  <IconButton icon="arrow-right" size={20} iconColor={KindlingColors.navy} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Assets & Bequests Section */}
            <View style={styles.navSection}>
              <Text style={styles.categoryTitle}>Assets & Bequests</Text>
              <View style={styles.navRow}>
                <View style={styles.navDropdown}>
                  <Select
                    value={bequeathalScreen}
                    options={[
                      { label: 'Intro', value: '/bequeathal/intro' },
                      { label: 'Categories', value: '/bequeathal/categories' },
                      { label: '── Bank Accounts ──', value: '', disabled: true },
                      { label: 'Bank: Intro', value: '/bequeathal/bank-accounts/intro' },
                      { label: 'Bank: Entry', value: '/bequeathal/bank-accounts/entry' },
                      { label: '── Important Items ──', value: '', disabled: true },
                      { label: 'Items: Intro', value: '/bequeathal/important-items/intro' },
                      { label: 'Items: Entry', value: '/bequeathal/important-items/entry' },
                      { label: '── Crypto ──', value: '', disabled: true },
                      { label: 'Crypto: Intro', value: '/bequeathal/crypto-currency/intro' },
                      { label: 'Crypto: Entry', value: '/bequeathal/crypto-currency/entry' },
                      { label: '── Investments ──', value: '', disabled: true },
                      { label: 'Invest: Intro', value: '/bequeathal/investment/intro' },
                      { label: 'Invest: Entry', value: '/bequeathal/investment/entry' },
                      { label: '── Pensions ──', value: '', disabled: true },
                      { label: 'Pensions: Intro', value: '/bequeathal/pensions/intro' },
                      { label: 'Pensions: Entry', value: '/bequeathal/pensions/entry' },
                      { label: '── Life Insurance ──', value: '', disabled: true },
                      { label: 'Life: Intro', value: '/bequeathal/life-insurance/intro' },
                      { label: 'Life: Entry', value: '/bequeathal/life-insurance/entry' },
                      { label: '── Company Shares ──', value: '', disabled: true },
                      { label: 'Shares: Intro', value: '/bequeathal/private-company-shares/intro' },
                      { label: 'Shares: Entry', value: '/bequeathal/private-company-shares/entry' },
                      { label: '── Business Assets ──', value: '', disabled: true },
                      { label: 'Biz: Intro', value: '/bequeathal/assets-held-through-business/intro' },
                      { label: 'Biz: Entry', value: '/bequeathal/assets-held-through-business/entry' },
                      { label: '── Agricultural ──', value: '', disabled: true },
                      { label: 'Agri: Intro', value: '/bequeathal/agricultural-assets/intro' },
                      { label: 'Agri: Entry', value: '/bequeathal/agricultural-assets/entry' },
                      { label: '── Property ──', value: '', disabled: true },
                      { label: 'Property: Intro', value: '/bequeathal/property/intro' },
                      { label: 'Property: Address', value: '/bequeathal/property/address' },
                      { label: 'Property: Entry', value: '/bequeathal/property/entry' },
                      { label: 'Property: Trust', value: '/bequeathal/property/trust-details' },
                      { label: 'Property: Summary', value: '/bequeathal/property/summary' },
                    ]}
                    onChange={setBequeathalScreen}
                  />
                </View>
                <TouchableOpacity
                  style={styles.navArrow}
                  onPress={() => router.push(bequeathalScreen)}
                >
                  <IconButton icon="arrow-right" size={20} iconColor={KindlingColors.navy} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Dashboard Section */}
            <View style={styles.navSection}>
              <Text style={styles.categoryTitle}>Dashboard</Text>
              <View style={styles.navRow}>
                <View style={styles.navDropdown}>
                  <Select
                    value={dashboardScreen}
                    options={[
                      { label: 'Order of Things', value: '/order-of-things' },
                    ]}
                    onChange={setDashboardScreen}
                  />
                </View>
                <TouchableOpacity
                  style={styles.navArrow}
                  onPress={() => router.push(dashboardScreen)}
                >
                  <IconButton icon="arrow-right" size={20} iconColor={KindlingColors.navy} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Developer Tools Section */}
            <View style={styles.navSection}>
              <Text style={styles.categoryTitle}>Developer Tools</Text>
              <Button
                variant="outline"
                onPress={() => router.push('/developer/sandbox')}
                icon="test-tube"
              >
                Component Sandbox
              </Button>
            </View>
          </View>
        </Card>
        
        {/* Stats Card */}
        <Card title="Statistics" style={styles.card}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>People</Text>
              <Text style={styles.statValue}>{personActions.getPeople().length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Assets</Text>
              <Text style={styles.statValue}>{bequeathalActions.getAllAssets().length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Executors</Text>
              <Text style={styles.statValue}>{willActions.getWillData().executors?.length || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Businesses</Text>
              <Text style={styles.statValue}>{personActions.getPeople().filter(p => p.roles.includes('will-maker')).length > 0 ? '✓' : '✗'}</Text>
            </View>
          </View>
          <View style={styles.totalValueContainer}>
            <Text style={styles.totalValueLabel}>Total Estate Value:</Text>
            <Text style={styles.totalValueAmount}>
              £{bequeathalActions.getAllAssets().reduce((sum, asset) => sum + (asset.netValue || asset.estimatedValue || 0), 0).toLocaleString()}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
  },
  content: {
    flex: 1,
  },
  card: {
    margin: Spacing.md,
  },
  buttonGroup: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  explorerInfo: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.border}4d`,
  },
  explorerInfoText: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}99`,
    textAlign: 'center',
  },
  categoryTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  navSections: {
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  navSection: {
    gap: Spacing.xs,
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  navDropdown: {
    flex: 4,
  },
  navArrow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${KindlingColors.navy}10`,
    borderRadius: 8,
    height: 48,
  },
  dataViewer: {
    maxHeight: 300,
    marginTop: Spacing.md,
  },
  ownerIdText: {
    marginTop: Spacing.md,
    color: KindlingColors.mutedForeground,
    fontSize: Typography.fontSize.xs,
  },
  storageKeysSection: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.border}4d`,
    paddingTop: Spacing.md,
  },
  storageSectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginTop: Spacing.sm,
  },
  storageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  dataItem: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: KindlingColors.muted,
    borderRadius: 4,
  },
  dataKey: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: 4,
  },
  dataValue: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.mutedForeground,
    fontFamily: 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: Spacing.md,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
    marginBottom: 4,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.green,
  },
  totalValueContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.border}4d`,
    alignItems: 'center',
  },
  totalValueLabel: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
    marginBottom: Spacing.xs,
  },
  totalValueAmount: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
  },
});

