/**
 * Data Explorer Screen
 * 
 * Three-level drill-down data viewer for debugging
 * Level 1: Interfaces (Person, Asset, etc.)
 * Level 2: Instances (all Person records, all Assets, etc.)
 * Level 3: Properties (individual fields of selected instance)
 * 
 * Reference: web-prototype/src/components/LocalStorageViewer.tsx
 * 
 * @module app/developer/data-explorer
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, Snackbar } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { Select } from '../../src/components/ui/Select';
import { useAppState } from '../../src/hooks/useAppState';
import { copyToClipboard } from '../../src/utils/clipboardHelpers';
import {
  ExecutorListRenderer,
  GuardianshipHierarchyRenderer,
  RelationshipEdgeRenderer,
  AlignmentStatusRenderer,
} from '../../src/components/developer';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import { storage } from '../../src/services/storage';
import { STORAGE_KEYS } from '../../src/constants';

interface InterfaceDefinition {
  name: string;
  icon: string; // Material icon name
  getData: () => any[];
  getDisplayName: (item: any) => string;
  getKey: (item: any) => string;
}

/**
 * DataExplorerScreen component
 * 
 * Sophisticated data viewer with drill-down navigation
 */
export default function DataExplorerScreen() {
  const { personActions, willActions, bequeathalActions, businessActions, relationshipActions, beneficiaryGroupActions, estateRemainderActions, trustActions, bequestActions, activeWillMakerId } = useAppState();
  
  // Navigation state
  const [selectedInterface, setSelectedInterface] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [selectedPropertyFromTrust, setSelectedPropertyFromTrust] = useState<any>(null); // For viewing property from trust
  const [personRoleFilter, setPersonRoleFilter] = useState<string>('all');
  const [showCopiedSnackbar, setShowCopiedSnackbar] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get relationship edges from storage
  const [relationshipEdges, setRelationshipEdges] = useState<any[]>([]);
  
  const loadRelationships = useCallback(async () => {
    const edges = await storage.load(`kindling:${activeWillMakerId}:${STORAGE_KEYS.RELATIONSHIP_DATA}`, []);
    if (Array.isArray(edges)) {
      setRelationshipEdges(edges);
    } else if (edges && typeof edges === 'object' && 'edges' in edges) {
      setRelationshipEdges((edges as any).edges || []);
    } else {
      setRelationshipEdges([]);
    }
  }, [activeWillMakerId]);

  React.useEffect(() => {
    loadRelationships();
  }, [activeWillMakerId, refreshKey, loadRelationships]);

  useFocusEffect(
    useCallback(() => {
      loadRelationships();
    }, [loadRelationships])
  );
  
  // Get will data
  const willData = willActions.getWillData();
  const allPeople = personActions.getPeople();
  const allAssets = bequeathalActions.getAllAssets();
  const allBusinesses = businessActions.getBusinessData();
  const beneficiaryGroups = beneficiaryGroupActions.getGroups();
  const estateRemainderState = estateRemainderActions.getEstateRemainderState();
  const allTrusts = trustActions.getTrusts();
  const allBequests = bequestActions.getBequests();
  
  // Define interfaces
  const interfaces: InterfaceDefinition[] = useMemo(() => [
    {
      name: 'Person',
      icon: 'account-group',
      getData: () => {
        if (personRoleFilter === 'all') return allPeople;
        return allPeople.filter(person => person.roles.includes(personRoleFilter as any));
      },
      getDisplayName: (person) =>
        `${person.firstName} ${person.lastName} (${person.roles.join(', ')})${person.email ? ` · ${person.email}` : ''}`,
      getKey: (person) => person.id,
    },
    {
      name: 'RelationshipEdge',
      icon: 'link-variant',
      getData: () => relationshipEdges,
      getDisplayName: (edge) => {
        const personA = personActions.getPersonById(edge.aId);
        const personB = personActions.getPersonById(edge.bId);
        const nameA = personA ? `${personA.firstName} ${personA.lastName}` : edge.aId.slice(0, 8);
        const nameB = personB ? `${personB.firstName} ${personB.lastName}` : edge.bId.slice(0, 8);
        return `${nameA} ↔ ${nameB} (${edge.type})`;
      },
      getKey: (edge) => edge.id,
    },
    {
      name: 'WillData',
      icon: 'file-document',
      getData: () => [willData],
      getDisplayName: () => `Will (${willData.willType})`,
      getKey: () => 'will',
    },
    {
      name: 'All Assets',
      icon: 'folder-multiple',
      getData: () => allAssets,
      getDisplayName: (asset) => `${asset.title || asset.address?.address1 || 'Untitled'} (${asset.type})`,
      getKey: (asset) => asset.id,
    },
    {
      name: 'Property',
      icon: 'home',
      getData: () => bequeathalActions.getAssetsByType('property'),
      getDisplayName: (asset) => `${asset.address?.address1 || 'Unknown Address'} (${asset.propertyType || 'Unknown'})`,
      getKey: (asset) => asset.id,
    },
    {
      name: 'Bank Accounts',
      icon: 'bank',
      getData: () => bequeathalActions.getAssetsByType('bank-accounts'),
      getDisplayName: (asset) => `${asset.title || 'Untitled'} (${asset.accountType || 'Account'})`,
      getKey: (asset) => asset.id,
    },
    {
      name: 'Investments',
      icon: 'chart-line',
      getData: () => bequeathalActions.getAssetsByType('investment'),
      getDisplayName: (asset) => `${asset.title || 'Untitled'} (${asset.investmentType || 'Investment'})`,
      getKey: (asset) => asset.id,
    },
    {
      name: 'Pensions',
      icon: 'account-clock',
      getData: () => bequeathalActions.getAssetsByType('pensions'),
      getDisplayName: (asset) => `${asset.title || 'Untitled'} (${asset.pensionType || 'Pension'})`,
      getKey: (asset) => asset.id,
    },
    {
      name: 'Life Insurance',
      icon: 'shield-account',
      getData: () => bequeathalActions.getAssetsByType('life-insurance'),
      getDisplayName: (asset) => `${asset.title || 'Untitled'} (${asset.policyType || 'Policy'})`,
      getKey: (asset) => asset.id,
    },
    {
      name: 'Important Items',
      icon: 'diamond-stone',
      getData: () => bequeathalActions.getAssetsByType('important-items'),
      getDisplayName: (asset) => `${asset.title || 'Untitled'}`,
      getKey: (asset) => asset.id,
    },
    {
      name: 'Cryptocurrency',
      icon: 'bitcoin',
      getData: () => bequeathalActions.getAssetsByType('crypto-currency'),
      getDisplayName: (asset) => `${asset.title || 'Untitled'} (${asset.cryptoType || 'Crypto'})`,
      getKey: (asset) => asset.id,
    },
    {
      name: 'Private Company Shares',
      icon: 'office-building',
      getData: () => bequeathalActions.getAssetsByType('private-company-shares'),
      getDisplayName: (asset) => `${asset.title || 'Untitled'} (${asset.companyName || 'Company'})`,
      getKey: (asset) => asset.id,
    },
    {
      name: 'Assets Through Business',
      icon: 'briefcase-account',
      getData: () => bequeathalActions.getAssetsByType('assets-held-through-business'),
      getDisplayName: (asset) => `${asset.title || 'Untitled'}`,
      getKey: (asset) => asset.id,
    },
    {
      name: 'Agricultural Assets',
      icon: 'tractor',
      getData: () => bequeathalActions.getAssetsByType('agricultural-assets'),
      getDisplayName: (asset) => `${asset.title || asset.assetDescription || 'Untitled'} (${asset.assetType || 'Agricultural'})`,
      getKey: (asset) => asset.id,
    },
    {
      name: 'Business',
      icon: 'briefcase',
      getData: () => allBusinesses,
      getDisplayName: (business) => business.name || 'Untitled Business',
      getKey: (business) => business.id,
    },
    {
      name: 'BeneficiaryGroup',
      icon: 'account-multiple',
      getData: () => beneficiaryGroups,
      getDisplayName: (group) => `${group.name} (${group.isActive ? 'Active' : 'Inactive'})`,
      getKey: (group) => group.id,
    },
    {
      name: 'EstateRemainder',
      icon: 'database',
      getData: () => estateRemainderState ? [estateRemainderState] : [],
      getDisplayName: () => 'Estate Remainder Allocation',
      getKey: () => 'estate-remainder',
    },
    {
      name: 'Trust',
      icon: 'shield-account',
      getData: () => allTrusts,
      getDisplayName: (trust) => `${trust.name || 'Untitled Trust'} (${trust.type})`,
      getKey: (trust) => trust.id,
    },
    {
      name: 'Bequest',
      icon: 'gift',
      getData: () => allBequests,
      getDisplayName: (bequest) => {
        const asset = bequeathalActions.getAssetById(bequest.assetId);
        const assetName = asset?.title || asset?.address?.address1 || 'Unknown Asset';
        return `${assetName} → ${bequest.beneficiaries.length} beneficiary${bequest.beneficiaries.length !== 1 ? 'ies' : ''}`;
      },
      getKey: (bequest) => bequest.id,
    },
  ], [allPeople, allAssets, allBusinesses, beneficiaryGroups, relationshipEdges, willData, estateRemainderState, personRoleFilter, allTrusts, allBequests]);
  
  const handleBack = useCallback(() => {
    if (selectedPropertyFromTrust) {
      // If viewing a property from a trust, go back to trust details
      setSelectedPropertyFromTrust(null);
    } else if (selectedInstance) {
      setSelectedInstance(null);
    } else if (selectedInterface) {
      setSelectedInterface(null);
    } else {
      router.back();
    }
  }, [selectedInstance, selectedInterface, selectedPropertyFromTrust]);
  
  const handleCopy = useCallback(async (data: any) => {
    const success = await copyToClipboard(data);
    if (success) {
      setShowCopiedSnackbar(true);
    }
  }, []);
  
  // Get current interface and data
  const currentInterface = interfaces.find(i => i.name === selectedInterface);
  const currentData = currentInterface?.getData() || [];
  
  // Render Level 1: Interface List
  const renderInterfaceList = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.interfaceListContainer}>
      <Text style={styles.helpText}>Tap on an interface to view its data instances</Text>
      <View style={styles.interfaceList}>
        {interfaces.map((interfaceDef) => {
          const data = interfaceDef.getData();
          
          return (
            <TouchableOpacity
              key={interfaceDef.name}
              style={styles.interfaceCard}
              onPress={() => {
                setSelectedInterface(interfaceDef.name);
                setSelectedInstance(null);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.interfaceCardContent}>
                <IconButton
                  icon={interfaceDef.icon}
                  size={20}
                  iconColor={KindlingColors.navy}
                />
                <View style={styles.interfaceInfo}>
                  <Text style={styles.interfaceName}>{interfaceDef.name}</Text>
                  <Text style={styles.interfaceCount}>
                    {data.length} {data.length === 1 ? 'instance' : 'instances'}
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={16}
                  iconColor={`${KindlingColors.navy}66`}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
  

  // Render Level 2: Instances List
  const renderInstancesList = () => (
    <>
      {/* Role filter for Person interface */}
      {selectedInterface === 'Person' && (
        <View style={styles.filterSection}>
          <Select
            label="Filter by role"
            value={personRoleFilter}
            onChange={setPersonRoleFilter}
            options={[
              { label: 'All Roles', value: 'all' },
              { label: 'Executor', value: 'executor' },
              { label: 'Beneficiary', value: 'beneficiary' },
              { label: 'Guardian', value: 'guardian' },
              { label: 'Co-Guardian', value: 'co-guardian' },
              { label: 'Family Member', value: 'family-member' },
              { label: 'Dependent', value: 'dependent' },
              { label: 'Will Maker', value: 'will-maker' },
            ]}
          />
        </View>
      )}
      
      {currentData.length === 0 ? (
        <View style={styles.emptyState}>
          {currentInterface && (
            <IconButton
              icon={currentInterface.icon}
              size={48}
              iconColor={`${KindlingColors.navy}33`}
            />
          )}
          <Text style={styles.emptyStateTitle}>No Data Found</Text>
          <Text style={styles.emptyStateText}>
            No instances of {selectedInterface} have been created yet
          </Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={currentData}
          keyExtractor={(item) => currentInterface?.getKey(item) || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.instanceCard}
              onPress={() => setSelectedInstance(item)}
              activeOpacity={0.7}
            >
              <View style={styles.instanceCardContent}>
                <View style={styles.instanceInfo}>
                  <Text style={styles.instanceName}>
                    {currentInterface?.getDisplayName(item)}
                  </Text>
                  <Text style={styles.instanceId}>
                    ID: {currentInterface?.getKey(item)}
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={16}
                  iconColor={`${KindlingColors.navy}66`}
                />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </>
  );
  
  // Render Level 3: Properties View
  const renderPropertiesView = () => {
    // If viewing a property from a trust, show property details
    if (selectedPropertyFromTrust) {
      const properties = Object.entries(selectedPropertyFromTrust);
      
      return (
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={styles.propertiesContent}
        >
          {properties.map(([key, value]) => (
            <View key={key} style={styles.propertyRow}>
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyKey}>{key}</Text>
                <View style={styles.propertyValueContainer}>
                  {renderPropertyValue(key, value)}
                </View>
              </View>
              <IconButton
                icon="content-copy"
                size={16}
                iconColor={KindlingColors.green}
                onPress={() => handleCopy(value)}
              />
            </View>
          ))}
        </ScrollView>
      );
    }
    
    // Special handling for Trust entities - show properties list + JSON
    if (selectedInterface === 'Trust' && selectedInstance && !selectedPropertyFromTrust) {
      const trustProperties = allAssets.filter(asset => 
        (asset as any).trustId === selectedInstance.id
      );
      
      const properties = Object.entries(selectedInstance);
      
      return (
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={styles.propertiesContent}
        >
          {/* Properties owned by this trust */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Properties Owned by This Trust</Text>
            {trustProperties.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>
                  This trust does not own any properties
                </Text>
              </View>
            ) : (
              trustProperties.map((property) => {
                const propertyName = (property as any).address?.address1 || (property as any).title || 'Untitled Property';
                return (
                  <TouchableOpacity
                    key={property.id}
                    style={styles.instanceCard}
                    onPress={() => setSelectedPropertyFromTrust(property)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.instanceCardContent}>
                      <View style={styles.instanceInfo}>
                        <Text style={styles.instanceName}>
                          {propertyName}
                        </Text>
                        <Text style={styles.instanceId}>
                          ID: {property.id}
                        </Text>
                      </View>
                      <IconButton
                        icon="chevron-right"
                        size={16}
                        iconColor={`${KindlingColors.navy}66`}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
          
          {/* Trust Details JSON */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Trust Details</Text>
            {properties.map(([key, value]) => (
              <View key={key} style={styles.propertyRow}>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyKey}>{key}</Text>
                  <View style={styles.propertyValueContainer}>
                    {renderPropertyValue(key, value)}
                  </View>
                </View>
                <IconButton
                  icon="content-copy"
                  size={16}
                  iconColor={KindlingColors.green}
                  onPress={() => handleCopy(value)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }
    
    // Standard properties view for other entities
    if (!selectedInstance) return null;
    
    const properties = Object.entries(selectedInstance);
    
    return (
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.propertiesContent}
      >
        {properties.map(([key, value]) => (
          <View key={key} style={styles.propertyRow}>
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyKey}>{key}</Text>
              <View style={styles.propertyValueContainer}>
                {renderPropertyValue(key, value)}
              </View>
            </View>
            <IconButton
              icon="content-copy"
              size={16}
              iconColor={KindlingColors.green}
              onPress={() => handleCopy(value)}
            />
          </View>
        ))}
      </ScrollView>
    );
  };
  
  // Render different value types
  const renderPropertyValue = (key: string, value: any) => {
    // Special renderers for complex types
    if (key === 'executors' && Array.isArray(value)) {
      return <ExecutorListRenderer executors={value} personActions={personActions} />;
    }
    
    if (key === 'guardianship' && typeof value === 'object') {
      return <GuardianshipHierarchyRenderer guardianship={value} personActions={personActions} />;
    }
    
    if (key === 'alignment' && typeof value === 'object') {
      return <AlignmentStatusRenderer alignment={value} personActions={personActions} />;
    }
    
    if (selectedInterface === 'RelationshipEdge' && (key === 'aId' || key === 'bId')) {
      const person = personActions.getPersonById(value);
      const name = person ? `${person.firstName} ${person.lastName}` : value;
      return <Text style={styles.propertyValue}>{name}</Text>;
    }

    if (key === 'businessId' && typeof value === 'string') {
      const business = businessActions.getBusinessById(value);
      const businessName = business?.name || 'Unknown Business';
      return (
        <TouchableOpacity
          onPress={() => {
            if (business) {
              setSelectedInterface('Business');
              setSelectedInstance(business);
              setSelectedPropertyFromTrust(null);
            }
          }}
          disabled={!business}
        >
          <Text style={styles.propertyValueLink}>
            {value} ({businessName})
          </Text>
        </TouchableOpacity>
      );
    }

    if (key === 'trustId' && typeof value === 'string') {
      const trust = allTrusts.find(t => t.id === value);
      const trustName = trust?.name || 'Unknown Trust';
      return (
        <TouchableOpacity
          onPress={() => {
            if (trust) {
              setSelectedInterface('Trust');
              setSelectedInstance(trust);
              setSelectedPropertyFromTrust(null);
            }
          }}
          disabled={!trust}
        >
          <Text style={styles.propertyValueLink}>
            {value} ({trustName})
          </Text>
        </TouchableOpacity>
      );
    }
    
    // Array/Object JSON formatting
    if (typeof value === 'object') {
      return (
        <Text style={styles.propertyValueJson}>
          {JSON.stringify(value, null, 2)}
        </Text>
      );
    }
    
    // Simple values
    return <Text style={styles.propertyValue}>{String(value)}</Text>;
  };
  
  // Get header title based on current level
  const getHeaderTitle = () => {
    if (selectedPropertyFromTrust) {
      const propertyName = (selectedPropertyFromTrust as any).address?.address1 || (selectedPropertyFromTrust as any).title || 'Property';
      return propertyName;
    }
    if (selectedInstance) {
      return currentInterface?.getDisplayName(selectedInstance) || 'Properties';
    }
    if (selectedInterface) {
      return selectedInterface;
    }
    return 'Data Explorer';
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <View style={styles.headerCenter}>
          <IconButton
            icon="database"
            size={20}
            iconColor={KindlingColors.navy}
          />
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Copy All button when viewing instances or properties */}
          {(selectedInterface || selectedInstance || selectedPropertyFromTrust) && (
            <IconButton
              icon="content-copy"
              size={20}
              iconColor={KindlingColors.green}
              onPress={() => {
                if (selectedPropertyFromTrust) {
                  handleCopy(selectedPropertyFromTrust);
                } else if (selectedInstance) {
                  handleCopy(selectedInstance);
                } else {
                  handleCopy(currentData);
                }
              }}
            />
          )}
        </View>
      </View>

      {/* Owner ID */}
      <View style={styles.ownerIdRow}>
        <Text style={styles.ownerIdText}>Owner ID: {activeWillMakerId}</Text>
        <IconButton
          icon="refresh"
          size={16}
          iconColor={`${KindlingColors.navy}99`}
          onPress={() => setRefreshKey(prev => prev + 1)}
        />
      </View>
      
      {/* Subtitle showing count */}
      {selectedInterface && !selectedInstance && !selectedPropertyFromTrust && (
        <View style={styles.subtitle}>
          <Text style={styles.subtitleText}>
            {currentData.length} {currentData.length === 1 ? 'instance' : 'instances'} found
          </Text>
        </View>
      )}
      
      {/* Content based on current level */}
      {!selectedInterface && renderInterfaceList()}
      {selectedInterface && !selectedInstance && !selectedPropertyFromTrust && renderInstancesList()}
      {(selectedInstance || selectedPropertyFromTrust) && renderPropertiesView()}
      
      {/* Snackbar for copy confirmation */}
      <Snackbar
        visible={showCopiedSnackbar}
        onDismiss={() => setShowCopiedSnackbar(false)}
        duration={2000}
        style={styles.snackbar}
      >
        Copied to clipboard!
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: KindlingColors.cream,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  ownerIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: KindlingColors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: KindlingColors.cream,
  },
  ownerIdText: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}99`,
  },
  subtitle: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: `${KindlingColors.cream}80`,
    borderBottomWidth: 0.5,
    borderBottomColor: KindlingColors.cream,
  },
  subtitleText: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
  },
  content: {
    flex: 1,
  },
  interfaceListContainer: {
    paddingBottom: Spacing.lg,
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  interfaceList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  interfaceCard: {
    backgroundColor: KindlingColors.background,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  interfaceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  interfaceInfo: {
    flex: 1,
  },
  interfaceName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  interfaceCount: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
    marginTop: 2,
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: `${KindlingColors.navy}99`,
    marginTop: Spacing.md,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}66`,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  instanceCard: {
    backgroundColor: KindlingColors.background,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  instanceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  instanceInfo: {
    flex: 1,
  },
  instanceName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  instanceId: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}99`,
    marginTop: 2,
  },
  propertiesContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  propertyRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}4d`,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyKey: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: `${KindlingColors.navy}99`,
    marginBottom: Spacing.xs,
  },
  propertyValueContainer: {
    marginTop: Spacing.xs,
  },
  propertyValue: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
  },
  propertyValueLink: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.green,
    textDecorationLine: 'underline',
  },
  propertyValueJson: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.navy,
    fontFamily: 'monospace',
    backgroundColor: `${KindlingColors.muted}80`,
    padding: Spacing.sm,
    borderRadius: 4,
  },
  snackbar: {
    backgroundColor: KindlingColors.green,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: KindlingColors.border,
  },
  emptySection: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: `${KindlingColors.cream}80`,
    borderRadius: 8,
  },
  emptySectionText: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

