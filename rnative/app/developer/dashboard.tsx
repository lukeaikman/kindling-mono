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
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
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
        
        {/* Navigation Card */}
        <Card title="Quick Navigation" style={styles.card}>
          <View style={styles.buttonGroup}>
            <Button
              variant="outline"
              onPress={() => router.push('/onboarding/welcome')}
            >
              Onboarding Welcome
            </Button>
            
            <Button
              variant="outline"
              onPress={() => router.push('/onboarding/location')}
            >
              Onboarding Location
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
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>People</Text>
              <Text style={styles.statValue}>{personActions.getPeople().length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Assets</Text>
              <Text style={styles.statValue}>{bequeathalActions.getAllAssets().length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Will Maker</Text>
              <Text style={styles.statValue}>
                {willActions.getUser() ? '✓' : '✗'}
              </Text>
            </View>
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
    padding: Spacing.lg,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
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
});

