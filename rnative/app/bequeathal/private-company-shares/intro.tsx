/**
 * Private Company Shares Intro Screen - Placeholder
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton } from '../../../src/components/ui';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';

export default function PrivateCompanySharesIntroScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton icon="office-building" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>Company Shares</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          <Text style={styles.placeholderText}>Private Company Shares Intro</Text>
          <Text style={styles.placeholderSubtext}>Phase 11 placeholder</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button onPress={() => router.push('/bequeathal/private-company-shares/entry')} variant="primary">Continue</Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KindlingColors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: KindlingColors.background, borderBottomWidth: 1, borderBottomColor: `${KindlingColors.border}1a` },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${KindlingColors.navy}1a`, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerRight: { width: 48 },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: KindlingColors.navy },
  scrollView: { flex: 1 },
  contentContainer: { paddingVertical: Spacing.lg },
  content: { paddingHorizontal: Spacing.lg, maxWidth: 600, width: '100%', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', minHeight: 400 },
  placeholderText: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: KindlingColors.navy, textAlign: 'center', marginBottom: Spacing.md },
  placeholderSubtext: { fontSize: Typography.fontSize.md, color: KindlingColors.brown, textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: KindlingColors.background, borderTopWidth: 1, borderTopColor: `${KindlingColors.border}1a` },
});

