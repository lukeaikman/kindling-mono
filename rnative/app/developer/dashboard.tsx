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
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useAppState } from '../../src/hooks/useAppState';
import { seedAllData } from '../../src/utils/seedData';
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
  const { personActions, bequeathalActions, willActions, purgeAllData } = useAppState();
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Load storage data for display
  useEffect(() => {
    loadStorageData();
  }, [refreshKey]);
  
  const loadStorageData = async () => {
    const data: Record<string, any> = {};
    
    // Load all data stores
    const keys = Object.values(STORAGE_KEYS);
    for (const key of keys) {
      try {
        const value = await storage.load(key, null);
        data[key] = value;
      } catch (error) {
        data[key] = null;
      }
    }
    
    setStorageData(data);
  };
  
  const handleSeedAllData = () => {
    seedAllData(personActions, bequeathalActions);
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
          </View>
          <View style={styles.explorerInfo}>
            <Text style={styles.explorerInfoText}>
              Browse interfaces → instances → properties with role filtering and copy functionality
            </Text>
          </View>
        </Card>
        
        {/* Navigation Card - Organized by Category */}
        <Card title="Quick Navigation" style={styles.card}>
          <View style={styles.buttonGroup}>
            <Text style={styles.categoryTitle}>Onboarding</Text>
            <Button
              variant="outline"
              onPress={() => router.push('/onboarding/welcome')}
            >
              Welcome
            </Button>
            <Button
              variant="outline"
              onPress={() => router.push('/onboarding/location')}
            >
              Location
            </Button>
            <Button
              variant="outline"
              onPress={() => router.push('/onboarding/family')}
            >
              Family
            </Button>
            <Button
              variant="outline"
              onPress={() => router.push('/onboarding/extended-family')}
            >
              Extended Family
            </Button>
            
            <Text style={styles.categoryTitle}>Executors</Text>
            <Button
              variant="outline"
              onPress={() => router.push('/executors/intro')}
            >
              Executors Intro
            </Button>
            <Button
              variant="outline"
              onPress={() => router.push('/executors/selection')}
            >
              Executor Selection
            </Button>
            
            <Text style={styles.categoryTitle}>Dashboard</Text>
            <Button
              variant="outline"
              onPress={() => router.push('/order-of-things')}
            >
              Order of Things
            </Button>
          </View>
        </Card>
        
        {/* Data Viewer Card */}
        <Card title="AsyncStorage Data" style={styles.card}>
          <ScrollView horizontal={false} style={styles.dataViewer}>
            {Object.entries(storageData).map(([key, value]) => (
              <View key={key} style={styles.dataItem}>
                <Text style={styles.dataKey}>{key.replace('kindling-', '')}:</Text>
                <Text style={styles.dataValue} numberOfLines={5}>
                  {value ? JSON.stringify(value, null, 2) : 'null'}
                </Text>
              </View>
            ))}
          </ScrollView>
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
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  dataViewer: {
    maxHeight: 300,
    marginTop: Spacing.md,
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

