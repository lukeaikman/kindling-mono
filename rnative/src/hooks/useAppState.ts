/**
 * Main application state hook - manages all application data and actions
 * Migrated from web prototype with AsyncStorage instead of localStorage
 * 
 * This hook provides centralized state management with AsyncStorage persistence for:
 * - Will data (executors, will details)
 * - Person data (people, relationships, roles)
 * - Business data
 * - Bequeathal data (assets)
 * - Trust data
 * - Relationship data (relationship edges/graph)
 * - Estate remainder state
 * - Beneficiary groups
 * 
 * All data is automatically synced to AsyncStorage and restored on app load.
 * 
 * @module hooks/useAppState
 * 
 * @returns {Object} Object containing:
 * @returns {WillActions} returns.willActions - Actions for managing will data
 * @returns {PersonActions} returns.personActions - Actions for managing people
 * @returns {BeneficiaryActions} returns.beneficiaryActions - Actions for managing beneficiaries
 * @returns {BusinessActions} returns.businessActions - Actions for managing business data
 * @returns {BequeathalActions} returns.bequeathalActions - Actions for managing bequeathals
 * @returns {TrustActions} returns.trustActions - Actions for managing trusts
 * @returns {RelationshipActions} returns.relationshipActions - Actions for managing relationships
 * @returns {BeneficiaryGroupActions} returns.beneficiaryGroupActions - Actions for managing groups
 * @returns {Object} returns.estateRemainderActions - Actions for managing estate remainder state
 * @returns {Function} returns.purgeAllData - Development function to clear all application data
 * 
 * @example
 * ```tsx
 * const { personActions, willActions } = useAppState();
 * const people = personActions.getPeople();
 * const executors = willActions.getExecutors();
 * ```
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  WillData, BequeathalData, Bequest,
  WillActions, PersonActions, BeneficiaryActions, BusinessActions, BequeathalActions, TrustActions, BequestActions,
  Person, PersonRole, PersonRelationshipType, AssetType, Asset, AssetSummary, Trust, TrustType, Business,
  GuardianLevel, GuardianHierarchy, AlignmentStatus, AlignmentInfo,
  RelationshipEdge, RelationshipType, PartnershipPhase, RelationshipActions,
  BeneficiaryGroup, BeneficiaryGroupActions, EstateRemainderState
} from '../types';
import {
  getInitialWillData, getInitialPersonData,
  getInitialBusinessData, getInitialBequeathalData, getInitialTrustData,
  STORAGE_KEYS
} from '../constants';
import { generateUUID, getPersonFullName, getPersonRelationshipDisplay } from '../utils/helpers';
import { storage } from '../services/storage';

/**
 * Load initial state from AsyncStorage
 * This is async, so we'll use a pattern with state initialization and useEffect
 */
const useAsyncStorageState = <T>(
  storageKey: string,
  initialValue: T,
  dateFields: string[] = []
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from storage on mount and when key changes
  useEffect(() => {
    let isMounted = true;
    setIsInitialized(false);

    const loadFromStorage = async () => {
      const loaded = await storage.load(storageKey, initialValue, dateFields);
      if (!isMounted) return;
      setState(loaded);
      setIsInitialized(true);
    };
    loadFromStorage();
    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  // Save to storage whenever state changes (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      storage.save(storageKey, state);
    }
  }, [state, isInitialized, storageKey]);

  return [state, setState];
};

/**
 * Synchronously update state and resolve the new value.
 * This is useful when you need to sequence writes in a predictable order.
 */
const updateStateAsync = <T>(
  setState: React.Dispatch<React.SetStateAction<T>>,
  updater: (prev: T) => T
): Promise<T> => {
  return new Promise((resolve) => {
    setState((prev) => {
      const next = updater(prev);
      resolve(next);
      return next;
    });
  });
};

/**
 * Get initial estate remainder state
 */
const getInitialEstateRemainderState = (userId: string = ''): EstateRemainderState => {
  return {
    userId,
    selectedPeopleIds: [],
    selectedGroupIds: [],
    splits: {},
    lockedCards: {},
    lastUpdated: new Date()
  };
};

/**
 * Main useAppState hook
 */
export const useAppState = () => {
  const initialOwnerId = useMemo(() => generateUUID(), []);
  const [ownerId, setOwnerId] = useAsyncStorageState<string>(
    STORAGE_KEYS.ACTIVE_OWNER_ID,
    initialOwnerId,
    []
  );
  const getScopedKey = useMemo(
    () => (key: string) => `kindling:${ownerId}:${key}`,
    [ownerId]
  );

  // Initialize states with AsyncStorage persistence
  const [willData, setWillData] = useAsyncStorageState<WillData>(
    getScopedKey(STORAGE_KEYS.WILL_DATA),
    getInitialWillData(),
    ['createdAt', 'updatedAt']
  );

  const [personData, setPersonData] = useAsyncStorageState<Person[]>(
    getScopedKey(STORAGE_KEYS.PERSON_DATA),
    getInitialPersonData(),
    []
  );

  const [businessData, setBusinessData] = useAsyncStorageState<Business[]>(
    getScopedKey(STORAGE_KEYS.BUSINESS_DATA),
    getInitialBusinessData(),
    []
  );

  const [bequeathalData, setBequeathalData] = useAsyncStorageState<BequeathalData>(
    getScopedKey(STORAGE_KEYS.BEQUEATHAL_DATA),
    getInitialBequeathalData(),
    ['lastUpdated']
  );

  const [trustData, setTrustData] = useAsyncStorageState<Trust[]>(
    getScopedKey(STORAGE_KEYS.TRUST_DATA),
    getInitialTrustData(),
    []
  );

  const [beneficiaryGroupData, setBeneficiaryGroupData] = useAsyncStorageState<BeneficiaryGroup[]>(
    getScopedKey(STORAGE_KEYS.BENEFICIARY_GROUP_DATA),
    [],
    []
  );

  const [estateRemainderState, setEstateRemainderState] = useAsyncStorageState<EstateRemainderState>(
    getScopedKey(STORAGE_KEYS.ESTATE_REMAINDER_DATA),
    getInitialEstateRemainderState(''), // Empty userId at init, populated on first use
    ['lastUpdated']
  );

  const [relationshipData, setRelationshipData] = useAsyncStorageState<RelationshipEdge[]>(
    getScopedKey(STORAGE_KEYS.RELATIONSHIP_DATA),
    [],
    []
  );

  const [bequestData, setBequestData] = useAsyncStorageState<Bequest[]>(
    getScopedKey(STORAGE_KEYS.BEQUEST_DATA),
    [],
    []
  );

  // =============================================================================
  // Migration: Multi-User + Bequest Separation
  // =============================================================================
  
  const migrationCompletedRef = useRef(false);
  
  useEffect(() => {
    const currentUserId = willData.userId;
    if (!currentUserId) return;
    if (migrationCompletedRef.current) return;
    
    console.log('🔄 Migrating to multi-user + bequest architecture...');
    
    // 1. Add userId to Trusts
    const trustsMigrated = trustData.every((t: any) => t.userId);
    if (!trustsMigrated) {
      const updatedTrusts = trustData.map((trust: any) => ({
        ...trust,
        userId: trust.userId || currentUserId,
      }));
      setTrustData(updatedTrusts);
    }
    
    // 2. Migrate PropertyAssets with inline trust fields
    if (bequeathalData.property) {
      const needsTrustMigration = bequeathalData.property.some((asset: any) => 
        asset.trustName && asset.trustType && asset.trustRole && !asset.trustId
      );
      
      if (needsTrustMigration) {
        const updatedProperties = bequeathalData.property.map((asset: any) => {
          if (!asset.trustName || asset.trustId) {
            return asset;
          }
          
          const trustTypeMap: Record<string, TrustType> = {
            'life_interest': 'life_interest_trust',
            'bare': 'bare_trust',
            'discretionary': 'discretionary_trust',
          };
          
          const newTrust: Trust = {
            id: `trust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: currentUserId,
            name: asset.trustName,
            type: trustTypeMap[asset.trustType] || 'bare_trust',
            creationMonth: '',
            creationYear: '',
            isUserSettlor: asset.trustRole.includes('settlor'),
            isUserBeneficiary: asset.trustRole.includes('beneficiary'),
            isUserTrustee: false,
            assetIds: [asset.id],
            createdInContext: 'property',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          setTrustData(prev => [...prev, newTrust]);
          
          const { trustName, trustType, trustRole, ...cleanAsset } = asset;
          return {
            ...cleanAsset,
            userId: asset.userId || currentUserId,
            trustId: newTrust.id,
          };
        });
        
        setBequeathalData({
          ...bequeathalData,
          property: updatedProperties,
        });
      }
    }
    
    // 3. Add userId to Businesses
    const businessesMigrated = businessData.every((b: any) => b.userId);
    if (!businessesMigrated) {
      const updatedBusinesses = businessData.map((business: any) => ({
        ...business,
        userId: business.userId || currentUserId,
      }));
      setBusinessData(updatedBusinesses);
    }
    
    // 4. Extract beneficiaryAssignments from Assets to Bequests
    const hasLegacyBeneficiaries = Object.values(bequeathalData).some(
      (categoryAssets: any) => Array.isArray(categoryAssets) && categoryAssets.some(
        (asset: any) => asset.beneficiaryAssignments || asset.beneficiaryId
      )
    );
    
    if (hasLegacyBeneficiaries && bequestData.length === 0) {
      const newBequests: Bequest[] = [];
      const currentWillId = willData.id || 'will-v1';
      
      Object.entries(bequeathalData).forEach(([category, categoryAssets]) => {
        if (!Array.isArray(categoryAssets)) return;
        
        (categoryAssets as any[]).forEach((asset: any) => {
          if (asset.beneficiaryAssignments?.beneficiaries.length > 0) {
            newBequests.push({
              id: `bequest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              willId: currentWillId,
              assetId: asset.id,
              assetType: asset.type,
              beneficiaries: asset.beneficiaryAssignments.beneficiaries,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          } else if (asset.beneficiaryId) {
            newBequests.push({
              id: `bequest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              willId: currentWillId,
              assetId: asset.id,
              assetType: asset.type,
              beneficiaries: [{
                id: asset.beneficiaryId,
                type: 'person',
                percentage: 100,
              }],
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        });
      });
      
      if (newBequests.length > 0) {
        setBequestData(newBequests);
        console.log(`✅ Created ${newBequests.length} bequests from legacy beneficiary assignments`);
      }
    }
    
    // 5. Add userId to all assets
    const updatedBequeathalData = { ...bequeathalData };
    let assetsUpdated = false;
    
    Object.entries(bequeathalData).forEach(([category, categoryAssets]) => {
      if (!Array.isArray(categoryAssets)) return;
      
      const updated = (categoryAssets as any[]).map((asset: any) => {
        if (!asset.userId) {
          assetsUpdated = true;
          return { ...asset, userId: currentUserId };
        }
        return asset;
      });
      updatedBequeathalData[category as keyof BequeathalData] = updated as any;
    });
    
    if (assetsUpdated) {
      setBequeathalData(updatedBequeathalData);
    }
    
    // 6. Add userId to EstateRemainderState
    if (!(estateRemainderState as any).userId) {
      setEstateRemainderState({
        ...estateRemainderState,
        userId: currentUserId,
      } as any);
    }
    
    migrationCompletedRef.current = true;
    console.log('✅ Multi-user + bequest migration complete');
  }, [willData, trustData, businessData, bequeathalData, bequestData, estateRemainderState]);

  // =============================================================================
  // Will Actions
  // =============================================================================

  const willActions: WillActions = {
    // Get the will-maker Person (user with 'will-maker' role)
    getUser: () => {
      if (!willData.userId) return undefined;
      return personActions.getPersonById(willData.userId);
    },

    // Deprecated: kept for backward compatibility
    updateUserData: (updates) => {
      const user = willActions.getUser();
      if (user) {
        // Map UserData updates to Person updates
        const personUpdates: Partial<Person> = {};
        if (updates.fullName) {
          const [firstName, ...lastNameParts] = updates.fullName.split(' ');
          personUpdates.firstName = firstName;
          personUpdates.lastName = lastNameParts.join(' ');
        }
        if (updates.dateOfBirth) personUpdates.dateOfBirth = updates.dateOfBirth;
        if (updates.email) personUpdates.email = updates.email;
        if (updates.phone) personUpdates.phone = updates.phone;
        if (updates.address) personUpdates.address = updates.address;
        
        personActions.updatePerson(user.id, personUpdates);
      }
    },

    // Deprecated: Convert Person to UserData format for backward compatibility
    getUserData: () => {
      const user = willActions.getUser();
      if (!user) {
        // Return empty UserData if no user found
        return {
          id: willData.userId || '',
          fullName: '',
          dateOfBirth: '',
          email: '',
          phone: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      
      return {
        id: user.id,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        dateOfBirth: user.dateOfBirth || '',
        email: user.email,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    },

    updateWillStatus: (status) => {
      setWillData(prev => ({ ...prev, status, updatedAt: new Date() }));
    },

    updateWillData: (updates) => {
      setWillData(prev => ({ ...prev, ...updates, updatedAt: new Date() }));
    },

    getWillData: () => willData,
    
    // Guardian management methods (same logic as executors)
    addGuardian: (childId: string, guardianId: string, level: number) => {
      setWillData(prev => {
        const currentGuardians = prev.guardianship?.[childId] || [];
        const updatedGuardians = [...currentGuardians, { guardian: guardianId, level }];
        
        return {
          ...prev,
          guardianship: {
            ...prev.guardianship,
            [childId]: updatedGuardians
          },
          updatedAt: new Date()
        };
      });
    },

    removeGuardian: (childId: string, guardianId: string) => {
      setWillData(prev => {
        const currentGuardians = prev.guardianship?.[childId] || [];
        const guardianToRemove = currentGuardians.find(g => g.guardian === guardianId);
        
        if (!guardianToRemove) return prev;

        const level = guardianToRemove.level;
        
        // Check if there are other guardians at the same level
        const sameLevelGuardians = currentGuardians.filter(g => g.level === level);
        
        if (sameLevelGuardians.length > 1) {
          // Just remove this guardian, others at same level remain
          const newGuardians = currentGuardians.filter(g => g.guardian !== guardianId);
          return {
            ...prev,
            guardianship: {
              ...prev.guardianship,
              [childId]: newGuardians
            },
            updatedAt: new Date()
          };
        } else {
          // Level becomes empty, need to promote guardians at higher levels only
          const guardiansToKeep = currentGuardians
            .filter(g => g.guardian !== guardianId) // Remove the guardian
            .filter(g => g.level <= level); // Keep guardians at same level or lower
          
          const guardiansToPromote = currentGuardians
            .filter(g => g.guardian !== guardianId) // Remove the guardian
            .filter(g => g.level > level) // Get guardians at higher levels
            .map(g => ({ ...g, level: g.level - 1 })); // Decrease their level by 1
          
          const newGuardians = [...guardiansToKeep, ...guardiansToPromote];
          
          return {
            ...prev,
            guardianship: {
              ...prev.guardianship,
              [childId]: newGuardians
            },
            updatedAt: new Date()
          };
        }
      });
    },

    getGuardians: (childId: string) => {
      const guardianship = willData.guardianship?.[childId];
      
      // Handle old format (object with primary, secondary, etc.)
      if (guardianship && typeof guardianship === 'object' && !Array.isArray(guardianship)) {
        const oldFormat = guardianship as any;
        const newFormat: Array<{guardian: string, level: number}> = [];
        
        if (oldFormat.primary) {
          newFormat.push({ guardian: oldFormat.primary, level: 1 });
        }
        if (oldFormat.secondary) {
          newFormat.push({ guardian: oldFormat.secondary, level: 2 });
        }
        if (oldFormat.tertiary && Array.isArray(oldFormat.tertiary)) {
          oldFormat.tertiary.forEach((guardian: string) => {
            if (guardian) newFormat.push({ guardian, level: 3 });
          });
        }
        if (oldFormat.quaternary && Array.isArray(oldFormat.quaternary)) {
          oldFormat.quaternary.forEach((guardian: string) => {
            if (guardian) newFormat.push({ guardian, level: 4 });
          });
        }
        
        return newFormat;
      }
      
      // Handle new format (array) or return empty array
      return Array.isArray(guardianship) ? guardianship : [];
    },

    setAlignment: (childId: string, alignedUser: string, status: AlignmentStatus) => {
      setWillData(prev => ({
        ...prev,
        alignment: {
          ...prev.alignment,
          [childId]: {
            alignedUser,
            status
          }
        },
        updatedAt: new Date()
      }));
    },

    getAlignment: (childId: string) => {
      return willData.alignment?.[childId];
    },
    
    // Will versioning methods
    createNewVersion: (copyBequests: boolean = true) => {
      const currentWill = willData;
      const newVersion = (currentWill.version || 1) + 1;
      
      const newWill: WillData = {
        id: `will-v${newVersion}-${Date.now()}`,
        userId: currentWill.userId,
        version: newVersion,
        willType: currentWill.willType,
        status: 'draft',
        executors: [...currentWill.executors],
        guardianship: {...currentWill.guardianship},
        alignment: {...currentWill.alignment},
        bequestIds: [],
        supersedes: currentWill.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setWillData(newWill);
      
      // Optionally copy bequests from previous version
      if (copyBequests) {
        const oldBequests = bequestActions.getBequestsByWill(currentWill.id || 'will-v1');
        const newBequestIds: string[] = [];
        
        oldBequests.forEach(oldBequest => {
          const newBequestId = bequestActions.addBequest({
            willId: newWill.id,
            assetId: oldBequest.assetId,
            assetType: oldBequest.assetType,
            beneficiaries: [...oldBequest.beneficiaries],
            specificInstructions: oldBequest.specificInstructions,
          });
          newBequestIds.push(newBequestId);
        });
        
        // Update will with bequest IDs
        setWillData(prev => ({
          ...prev,
          bequestIds: newBequestIds,
        }));
      }
      
      return newWill.id;
    },
    
    getWillVersions: () => {
      // For now, return current will (future: store array of versions)
      return [willData];
    },
  };

  // =============================================================================
  // Person Actions
  // =============================================================================

  const personActions: PersonActions = {
    addPerson: async (personData) => {
      // Generate UUID - crypto.randomUUID() not available in React Native
      const generateId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const newPerson: Person = {
        ...personData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const nextPeople = await updateStateAsync(setPersonData, prev => [...prev, newPerson]);
      await storage.save(getScopedKey(STORAGE_KEYS.PERSON_DATA), nextPeople);

      console.log('✅ Person added:', newPerson.id, newPerson.firstName, newPerson.lastName);
      
      return newPerson.id;
    },

    removePerson: (id) => {
      setPersonData(prev => prev.filter(person => person.id !== id));
      
      // Cleanup: remove from estate remainder if they were selected
      setEstateRemainderState(prevState => {
        if (prevState.selectedPeopleIds.includes(id)) {
          const newSelectedPeopleIds = prevState.selectedPeopleIds.filter(personId => personId !== id);
          const splitId = `person-${id}`;
          
          // Remove from splits and lockedCards
          const newSplits = { ...prevState.splits };
          const newLockedCards = { ...prevState.lockedCards };
          delete newSplits[splitId];
          delete newLockedCards[splitId];
          
          return {
            ...prevState,
            selectedPeopleIds: newSelectedPeopleIds,
            splits: newSplits,
            lockedCards: newLockedCards,
            lastUpdated: new Date()
          };
        }
        return prevState;
      });
    },

    updatePerson: (id, updates) => {
      setPersonData(prev => prev.map(person => 
        person.id === id ? { ...person, ...updates, updatedAt: new Date() } : person
      ));
    },

    getPeople: () => personData,

    getPersonById: (id) => {
      return personData.find(person => person.id === id);
    },

    getPersonByName: (firstName, lastName?) => {
      return personData.find(person => 
        person.firstName.toLowerCase() === firstName.toLowerCase() && 
        (!lastName || person.lastName.toLowerCase() === lastName.toLowerCase())
      );
    },

    getPeopleByRole: (role) => {
      return personData.filter(person => person.roles.includes(role));
    },

    getBeneficiaries: () => {
      return personData.filter(person => person.roles.includes('beneficiary'));
    },

    getExecutors: () => {
      return personData.filter(person => person.roles.includes('executor'));
    },

    getFamilyMembers: () => {
      return personData.filter(person => person.roles.includes('family-member'));
    },

    getChildren: () => {
      const childRelationships: PersonRelationshipType[] = ['biological-child', 'adopted-child', 'stepchild'];
      return personData.filter(person => 
        person.roles.includes('family-member') && 
        childRelationships.includes(person.relationship)
      );
    },

    getPeopleInCare: () => {
      return personData.filter(person => person.inCare === true);
    },

    getChildrenUnder18: () => {
      return personActions.getChildren().filter(person => person.isUnder18 === true);
    },

    addRoleToPerson: (personId, role) => {
      const person = personActions.getPersonById(personId);
      if (person && !person.roles.includes(role)) {
        personActions.updatePerson(personId, {
          roles: [...person.roles, role]
        });
      }
    },

    removeRoleFromPerson: (personId, role) => {
      const person = personActions.getPersonById(personId);
      if (person && person.roles.includes(role)) {
        personActions.updatePerson(personId, {
          roles: person.roles.filter(r => r !== role)
        });
      }
    },

    hasRole: (personId, role) => {
      const person = personActions.getPersonById(personId);
      return person ? person.roles.includes(role) : false;
    },

    updateExecutorStatus: (personId, status) => {
      personActions.updatePerson(personId, {
        executorStatus: status,
        respondedAt: status !== 'pending' ? new Date() : undefined
      });
    },

    sendExecutorInvitations: () => {
      const executors = personActions.getExecutors();
      executors.forEach(executor => {
        if (!executor.invitedAt) {
          personActions.updatePerson(executor.id, {
            invitedAt: new Date(),
            executorStatus: 'pending'
          });
        }
      });
    },

    getPersonData: () => personData,

    // Legacy compatibility methods
    addBeneficiary: async (beneficiaryData) => {
      // Parse name into first and last name
      const nameParts = beneficiaryData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Map relationship string to PersonRelationshipType
      const relationshipMap: Record<string, PersonRelationshipType> = {
        'Spouse': 'spouse',
        'Partner': 'partner',
        'Daughter': 'biological-child',
        'Son': 'biological-child',
        'Child': 'biological-child',
        'Parent': 'parent',
        'Friend': 'friend',
      };
      
      const relationship = relationshipMap[beneficiaryData.relationship] || 'other';
      const customRelationship = relationship === 'other' ? beneficiaryData.relationship : undefined;
      
      return personActions.addPerson({
        firstName,
        lastName,
        email: '',
        phone: '',
        relationship,
        customRelationship,
        roles: ['beneficiary']
      });
    },

    clearOnboardingFamilyMembers: () => {
      setPersonData(prev => {
        // Get IDs of people we're about to delete
        const deletedPersonIds = prev
          .filter(person => person.createdInOnboarding)
          .map(person => person.id);
        
        console.log('🧹 Clearing onboarding family members:', deletedPersonIds);
        
        // Also remove relationship edges for these people
        if (deletedPersonIds.length > 0) {
          setRelationshipData(prevRel => {
            return prevRel.filter(edge => 
              !deletedPersonIds.includes(edge.aId) && !deletedPersonIds.includes(edge.bId)
            );
          });
        }
        
        return prev.filter(person => !person.createdInOnboarding);
      });
      console.log('🧹 Cleared all onboarding-created family members and their relationships');
    },

    addExecutor: async (executorData: any) => {
      return personActions.addPerson(executorData);
    },

    // Guardian management methods (current reality tracking)
    assignGuardian: (childId, guardianId) => {
      setPersonData(prev => {
        const childIndex = prev.findIndex(p => p.id === childId);
        if (childIndex === -1) {
          console.warn('⚠️ Cannot assign guardian: child not found', { childId, guardianId });
          return prev;
        }

        const child = prev[childIndex];
        const currentGuardians = child.guardianIds || [];
        
        if (currentGuardians.includes(guardianId)) {
          console.log('ℹ️ Guardian already assigned:', { childId, guardianId });
          return prev;
        }

        const updatedPeople = [...prev];
        updatedPeople[childIndex] = {
          ...child,
          guardianIds: [...currentGuardians, guardianId],
          updatedAt: new Date()
        };

        return updatedPeople;
      });
      console.log('✅ Assigned guardian:', { childId, guardianId });
    },

    removeGuardian: (childId, guardianId) => {
      const child = personActions.getPersonById(childId);
      if (!child) {
        console.warn('⚠️ Cannot remove guardian: child not found', { childId, guardianId });
        return;
      }

      const currentGuardians = child.guardianIds || [];
      personActions.updatePerson(childId, {
        guardianIds: currentGuardians.filter(id => id !== guardianId)
      });
      console.log('✅ Removed guardian:', { childId, guardianId });
    },

    getGuardians: (childId) => {
      const child = personActions.getPersonById(childId);
      if (!child || !child.guardianIds) return [];

      return child.guardianIds
        .map(guardianId => personActions.getPersonById(guardianId))
        .filter(Boolean) as Person[];
    }
  };

  // =============================================================================
  // Beneficiary Actions (Legacy)
  // =============================================================================

  const beneficiaryActions: BeneficiaryActions = {
    addBeneficiary: async (beneficiaryData) => {
      return personActions.addBeneficiary(beneficiaryData);
    },

    removeBeneficiary: (id) => {
      personActions.removeRoleFromPerson(id, 'beneficiary');
    },

    updateBeneficiary: (id, updates) => {
      const person = personActions.getPersonById(id);
      if (person && updates.name) {
        // Parse name update
        const nameParts = updates.name.trim().split(' ');
        const firstName = nameParts[0] || person.firstName;
        const lastName = nameParts.slice(1).join(' ') || person.lastName;
        
        personActions.updatePerson(id, {
          firstName,
          lastName,
          customRelationship: updates.relationship && updates.relationship !== getPersonRelationshipDisplay(person) ? 
            updates.relationship : 
            person.customRelationship
        });
      }
    },

    getBeneficiaries: () => {
      // Convert Person objects to legacy Beneficiary format
      return personActions.getBeneficiaries().map(person => ({
        id: person.id,
        name: getPersonFullName(person),
        relationship: getPersonRelationshipDisplay(person),
        createdAt: person.createdAt,
        updatedAt: person.updatedAt
      }));
    },

    getBeneficiaryById: (id) => {
      const person = personActions.getPersonById(id);
      if (person && person.roles.includes('beneficiary')) {
        return {
          id: person.id,
          name: getPersonFullName(person),
          relationship: getPersonRelationshipDisplay(person),
          createdAt: person.createdAt,
          updatedAt: person.updatedAt
        };
      }
      return undefined;
    },

    getBeneficiaryData: () => ({
      beneficiaries: beneficiaryActions.getBeneficiaries(),
      lastUpdated: new Date()
    })
  };

  // =============================================================================
  // Business Actions
  // =============================================================================

  const businessActions: BusinessActions = {
    addBusiness: (businessData) => {
      const currentUserId = willData.userId || '';
      
      const generateId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const newBusiness: Business = {
        ...businessData,
        userId: businessData.userId || currentUserId, // Auto-populate if not provided
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setBusinessData(prev => [...prev, newBusiness]);

      return newBusiness.id;
    },

    removeBusiness: (id) => {
      setBusinessData(prev => prev.filter(business => business.id !== id));
    },

    updateBusiness: (id, updates) => {
      setBusinessData(prev => prev.map(business => 
        business.id === id ? { ...business, ...updates, updatedAt: new Date() } : business
      ));
    },

    getBusinesses: () => businessData,

    getBusinessById: (id) => {
      return businessData.find(business => business.id === id);
    },

    getBusinessByName: (name) => {
      return businessData.find(business => business.name === name);
    },

    getBusinessData: () => businessData,

    syncBusinessFromAssets: () => {
      // Get all unique business names from existing assets
      const privateCompanyShares = bequeathalActions.getAssetsByType('private-company-shares') as any[];
      const businessAssets = bequeathalActions.getAssetsByType('assets-held-through-business') as any[];
      
      const existingBusinesses = businessData;
      const newBusinessesToAdd: any[] = [];

      // Add businesses from private company shares
      privateCompanyShares.forEach(share => {
        if (share.companyName && !existingBusinesses.find(b => b.name === share.companyName)) {
          newBusinessesToAdd.push({
            name: share.companyName,
            businessType: '',
            estimatedValue: 0,
          });
        }
      });

      // Add businesses from business assets
      businessAssets.forEach(asset => {
        if (asset.businessName && !existingBusinesses.find(b => b.name === asset.businessName)) {
          newBusinessesToAdd.push({
            name: asset.businessName,
            businessType: asset.businessType || '',
            estimatedValue: 0,
          });
        }
      });

      // Add new businesses to registry
      newBusinessesToAdd.forEach(businessData => {
        businessActions.addBusiness(businessData);
      });

      if (newBusinessesToAdd.length > 0) {
        console.log(`🏢 Synced ${newBusinessesToAdd.length} businesses from existing assets`);
      }
    }
  };

  // =============================================================================
  // Beneficiary Group Actions
  // =============================================================================

  const beneficiaryGroupActions: BeneficiaryGroupActions = {
    addGroup: (groupData) => {
      const newGroup: BeneficiaryGroup = {
        ...groupData,
        id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setBeneficiaryGroupData(prev => [...prev, newGroup]);
      return newGroup.id;
    },

    updateGroup: (id, updates) => {
      setBeneficiaryGroupData(prev => prev.map(group =>
        group.id === id ? { ...group, ...updates, updatedAt: new Date() } : group
      ));
    },

    getGroups: () => beneficiaryGroupData,

    getGroupById: (id) => beneficiaryGroupData.find(g => g.id === id),

    getActiveGroups: () => beneficiaryGroupData.filter(g => g.isActive),

    getGroupByName: (name, willId) => 
      beneficiaryGroupData.find(g => g.name === name && g.willId === willId),

    setGroupActive: (id, isActive) => {
      setBeneficiaryGroupData(prev => prev.map(group =>
        group.id === id ? { ...group, isActive, updatedAt: new Date() } : group
      ));
    }
  };

  // =============================================================================
  // Bequeathal Actions
  // =============================================================================

  // Helper function to get array key for asset type
  const getArrayKey = (assetType: AssetType): keyof BequeathalData => {
    return assetType as keyof BequeathalData;
  };

  // Get all assets across all categories
  const getAllAssets = (): Asset[] => {
    return [
      ...(bequeathalData.property || []),
      ...(bequeathalData['important-items'] || []),
      ...(bequeathalData.investment || []),
      ...(bequeathalData.pensions || []),
      ...(bequeathalData['life-insurance'] || []),
      ...(bequeathalData['bank-accounts'] || []),
      ...(bequeathalData['private-company-shares'] || []),
      ...(bequeathalData['assets-held-through-business'] || []),
      ...(bequeathalData['debts-credit'] || []),
      ...(bequeathalData['agricultural-assets'] || []),
      ...(bequeathalData['crypto-currency'] || []),
      ...(bequeathalData.other || [])
    ];
  };

  // Helper function to recalculate totals
  const recalculateTotals = () => {
    const allAssets = getAllAssets();
    const totalEstimatedValue = allAssets.reduce((sum, asset) => sum + (asset.estimatedValue || 0), 0);
    const totalNetValue = allAssets.reduce((sum, asset) => sum + (asset.netValue || 0), 0);
    
    setBequeathalData(prev => ({
      ...prev,
      totalEstimatedValue,
      totalNetValue,
      lastUpdated: new Date()
    }));
  };

  const bequeathalActions: BequeathalActions = {
    addAsset: (assetType, assetData) => {
      const currentUserId = willData.userId || '';
      
      const generateId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const newAsset = {
        ...assetData,
        userId: (assetData as any).userId || currentUserId, // Auto-populate if not provided
        id: generateId(),
        type: assetType,
        title: assetData.title || 'Untitled Asset',
        description: assetData.description || '',
        estimatedValue: assetData.estimatedValue || 0,
        netValue: assetData.netValue || assetData.estimatedValue || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Asset;

      const arrayKey = getArrayKey(assetType);
      setBequeathalData(prev => ({
        ...prev,
        [arrayKey]: [...(prev[arrayKey] as Asset[] || []), newAsset],
        lastUpdated: new Date()
      }));

      // Recalculate totals
      setTimeout(recalculateTotals, 0);
      
      return newAsset.id;
    },

    updateAsset: (id, updates) => {
      const allAssets = getAllAssets();
      const asset = allAssets.find(a => a.id === id);
      
      if (!asset) return;

      const arrayKey = getArrayKey(asset.type);
      setBequeathalData(prev => ({
        ...prev,
        [arrayKey]: (prev[arrayKey] as Asset[] || []).map(a => 
          a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
        ),
        lastUpdated: new Date()
      }));

      // Recalculate totals
      setTimeout(recalculateTotals, 0);
    },

    removeAsset: (id) => {
      const allAssets = getAllAssets();
      const asset = allAssets.find(a => a.id === id);
      
      if (!asset) return;

      const arrayKey = getArrayKey(asset.type);
      setBequeathalData(prev => ({
        ...prev,
        [arrayKey]: (prev[arrayKey] as Asset[] || []).filter(a => a.id !== id),
        lastUpdated: new Date()
      }));

      // Recalculate totals
      setTimeout(recalculateTotals, 0);
    },

    deleteAsset: (id) => {
      bequeathalActions.removeAsset(id);
    },

    getAssets: () => getAllAssets(),

    getAssetsByType: (type) => {
      const arrayKey = getArrayKey(type);
      return (bequeathalData[arrayKey] as Asset[]) || [];
    },

    getAssetById: (id) => {
      return getAllAssets().find(asset => asset.id === id);
    },

    getAllAssets,

    getSelectedCategories: () => {
      return Array.from(bequeathalData.selectedCategories);
    },

    setSelectedCategories: (categories) => {
      setBequeathalData(prev => ({
        ...prev,
        selectedCategories: new Set(categories),
        lastUpdated: new Date()
      }));
    },

    toggleCategory: (category) => {
      setBequeathalData(prev => {
        const newSet = new Set(prev.selectedCategories);
        if (newSet.has(category)) {
          newSet.delete(category);
        } else {
          newSet.add(category);
        }
        return {
          ...prev,
          selectedCategories: newSet,
          lastUpdated: new Date()
        };
      });
    },
  };

  // =============================================================================
  // Trust Actions
  // =============================================================================

  const trustActions: TrustActions = {
    addTrust: (trustData) => {
      const currentUserId = willData.userId || '';
      
      const newTrust: Trust = {
        ...trustData,
        userId: trustData.userId || currentUserId, // Auto-populate if not provided
        id: `trust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setTrustData(prev => [...prev, newTrust]);

      return newTrust.id;
    },

    updateTrust: (id, updates) => {
      setTrustData(prev => prev.map(trust =>
        trust.id === id ? { ...trust, ...updates, updatedAt: new Date() } : trust
      ));
    },

    deleteTrust: (id) => {
      setTrustData(prev => prev.filter(trust => trust.id !== id));
    },

    getTrusts: () => trustData,

    getTrustById: (id) => {
      return trustData.find(trust => trust.id === id);
    },

    getTrustByName: (name) => {
      return trustData.find(trust => trust.name.toLowerCase() === name.toLowerCase());
    },

    getTrustData: () => trustData
  };

  // =============================================================================
  // Bequest Actions
  // =============================================================================

  const bequestActions: BequestActions = {
    addBequest: (bequestData) => {
      const newBequest: Bequest = {
        ...bequestData,
        id: `bequest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setBequestData(prev => [...prev, newBequest]);

      return newBequest.id;
    },

    updateBequest: (id, updates) => {
      setBequestData(prev => prev.map(bequest =>
        bequest.id === id ? { ...bequest, ...updates, updatedAt: new Date() } : bequest
      ));
    },

    removeBequest: (id) => {
      setBequestData(prev => prev.filter(bequest => bequest.id !== id));
    },

    getBequests: () => bequestData,

    getBequestById: (id) => {
      return bequestData.find(bequest => bequest.id === id);
    },

    getBequestsByWill: (willId) => {
      return bequestData.filter(bequest => bequest.willId === willId);
    },

    getBequestsByAsset: (assetId) => {
      return bequestData.filter(bequest => bequest.assetId === assetId);
    },
  };

  // =============================================================================
  // Relationship Actions
  // =============================================================================

  // Define symmetric types for uniqueness key generation
  const symmetricTypes = new Set<RelationshipType>([
    RelationshipType.SPOUSE,
    RelationshipType.PARTNER,
    RelationshipType.SIBLING_OF,
    RelationshipType.COUSIN_OF,
    RelationshipType.FRIEND
  ]);

  // Generate uniqueness key for relationship (handles symmetric vs directed)
  const uniquenessKey = (aId: string, bId: string, type: RelationshipType): string => {
    return symmetricTypes.has(type)
      ? [aId, bId].sort().join('|') + '|' + type
      : `${aId}|${bId}|${type}`;
  };

  // Build uniqueness index from edges (edgeIndex: uniquenessKey -> edgeId)
  const edgeIndex: Record<string, string> = {};
  relationshipData.forEach(edge => {
    const key = uniquenessKey(edge.aId, edge.bId, edge.type);
    edgeIndex[key] = edge.id;
  });

  const relationshipActions: RelationshipActions = {
    addRelationship: async (aId, bId, type, opts) => {
      const key = uniquenessKey(aId, bId, type);
      const existing = edgeIndex[key];
      
      // Idempotency: return existing edge if already exists
      if (existing) {
        console.log('🔗 [REL] Relationship already exists:', { edgeId: existing, aId, bId, type });
        return existing;
      }

      const generateId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const now = new Date();
      const edge: RelationshipEdge = {
        id: generateId(),
        aId,
        bId,
        type,
        phase: opts?.phase,
        qualifiers: opts?.qualifiers,
        startedAt: opts?.startedAt,
        endedAt: opts?.endedAt,
        metadata: opts?.metadata,
        createdAt: now,
        updatedAt: now
      };

      // Update state
      const nextEdges = await updateStateAsync(setRelationshipData, prev => [...prev, edge]);
      await storage.save(getScopedKey(STORAGE_KEYS.RELATIONSHIP_DATA), nextEdges);

      // Update index
      edgeIndex[key] = edge.id;

      console.log('✅ [REL] Added relationship:', { edgeId: edge.id, aId, bId, type, qualifiers: opts?.qualifiers });
      return edge.id;
    },

    updateRelationship: (edgeId, updates) => {
      setRelationshipData(prev => prev.map(edge =>
        edge.id === edgeId ? { ...edge, ...updates, updatedAt: new Date() } : edge
      ));
      console.log('🔄 [REL] Updated relationship:', { edgeId, updates });
    },

    removeRelationship: (edgeId) => {
      setRelationshipData(prev => {
        // Remove from index
        const edge = prev.find(e => e.id === edgeId);
        if (edge) {
          const key = uniquenessKey(edge.aId, edge.bId, edge.type);
          delete edgeIndex[key];
        }

        return prev.filter(e => e.id !== edgeId);
      });
      console.log('🗑️ [REL] Removed relationship:', { edgeId });
    },

    getRelationships: (personId, filters) => {
      return relationshipData.filter(edge => {
        const isParticipant = edge.aId === personId || edge.bId === personId;
        if (!isParticipant) return false;

        if (filters?.type && edge.type !== filters.type) return false;
        if (filters?.phase && edge.phase !== filters.phase) return false;
        if (filters?.qualifierKeysAll && !filters.qualifierKeysAll.every(k => edge.qualifiers?.[k])) return false;

        return true;
      });
    },

    getRelatedPeople: (personId, filters) => {
      const people = personActions.getPeople();
      return relationshipData
        .filter(edge => {
          const isParticipant = edge.aId === personId || edge.bId === personId;
          if (!isParticipant) return false;

          if (filters?.type && edge.type !== filters.type) return false;
          if (filters?.phase && edge.phase !== filters.phase) return false;
          if (filters?.qualifierKeysAll && !filters.qualifierKeysAll.every(k => edge.qualifiers?.[k])) return false;

          return true;
        })
        .map(edge => {
          const counterpartId = edge.aId === personId ? edge.bId : edge.aId;
          const counterpart = people.find(p => p.id === counterpartId);
          if (!counterpart) return undefined;

          return {
            ...counterpart,
            type: edge.type,
            phase: edge.phase,
            qualifiers: edge.qualifiers,
            direction: (edge.aId === personId ? 'out' : 'in') as 'out' | 'in',
            edgeId: edge.id
          };
        })
        .filter(Boolean) as Array<Person & {
          type: RelationshipType;
          phase?: PartnershipPhase;
          qualifiers?: Record<string, boolean>;
          direction: 'out' | 'in';
          edgeId: string;
        }>;
    },

    hasRelationship: (aId, bId, type) => {
      const key = uniquenessKey(aId, bId, type);
      return Boolean(edgeIndex[key]);
    },

    // Convenience accessors
    getSpouse: (personId, phase = 'active') => {
      const spouses = relationshipActions.getRelatedPeople(personId, {
        type: RelationshipType.SPOUSE,
        phase
      });
      return spouses[0];
    },

    getChildren: (personId, qualifiersFilter) => {
      return relationshipActions.getRelatedPeople(personId, {
        type: RelationshipType.PARENT_OF,
        qualifierKeysAll: qualifiersFilter
      });
    },

    getParents: (personId, qualifiersFilter) => {
      // For parents, we need to reverse the direction - find edges where personId is bId
      const people = personActions.getPeople();
      return relationshipData
        .filter(edge => {
          if (edge.bId !== personId) return false;
          if (edge.type !== RelationshipType.PARENT_OF) return false;
          if (qualifiersFilter && !qualifiersFilter.every(k => edge.qualifiers?.[k])) return false;
          return true;
        })
        .map(edge => {
          const parent = people.find(p => p.id === edge.aId);
          if (!parent) return undefined;
          return {
            ...parent,
            type: edge.type,
            phase: edge.phase,
            qualifiers: edge.qualifiers,
            direction: 'in' as 'in',
            edgeId: edge.id
          };
        })
        .filter(Boolean) as Person[];
    },

    getSiblings: (personId, qualifiersFilter) => {
      return relationshipActions.getRelatedPeople(personId, {
        type: RelationshipType.SIBLING_OF,
        qualifierKeysAll: qualifiersFilter
      });
    }
  };

  // =============================================================================
  // Estate Remainder Actions
  // =============================================================================

  const estateRemainderActions = {
    updateSelectedBeneficiaries: (selectedPeopleIds: string[], selectedGroupIds: string[]) => {
      setEstateRemainderState(prev => {
        // Calculate new splits based on selection changes
        const newSplits = { ...prev.splits };
        const newLockedCards = { ...prev.lockedCards };
        
        // Ensure arrays exist (backward compatibility)
        const prevPeopleIds = prev.selectedPeopleIds || [];
        const prevGroupIds = prev.selectedGroupIds || [];
        
        // Get all current recipients
        const allCurrentIds = [
          ...prevPeopleIds.map(id => `person-${id}`),
          ...prevGroupIds.map(groupId => `group-${groupId}`)
        ];
        
        // Get all new recipients
        const allNewIds = [
          ...selectedPeopleIds.map(id => `person-${id}`),
          ...selectedGroupIds.map(groupId => `group-${groupId}`)
        ];
        
        // If this is the first time (no previous splits), initialize with equal splits
        if (Object.keys(prev.splits).length === 0 && allNewIds.length > 0) {
          const equalSplit = 100 / allNewIds.length;
          allNewIds.forEach((id, index) => {
            // Use precise division for all but last, then assign remainder to last to ensure exact 100%
            if (index === allNewIds.length - 1) {
              const totalSoFar = Object.values(newSplits).reduce((sum, val) => sum + val, 0);
              newSplits[id] = 100 - totalSoFar;
            } else {
              newSplits[id] = equalSplit;
            }
            newLockedCards[id] = false;
          });
        } else {
          // Handle changes to existing selection
          
          // Get currently locked values
          const lockedTotal = Object.keys(prev.lockedCards)
            .filter(id => prev.lockedCards[id])
            .reduce((sum, id) => sum + (prev.splits[id] || 0), 0);
          
          // Find removed recipients and redistribute their shares (if unlocked)
          const removedIds = allCurrentIds.filter(id => !allNewIds.includes(id));
          let redistributeAmount = 0;
          
          removedIds.forEach(id => {
            if (!prev.lockedCards[id]) {
              redistributeAmount += prev.splits[id] || 0;
            }
            delete newSplits[id];
            delete newLockedCards[id];
          });
          
          // Find added recipients (start with 0)
          const addedIds = allNewIds.filter(id => !allCurrentIds.includes(id));
          addedIds.forEach(id => {
            newSplits[id] = 0;
            newLockedCards[id] = false;
          });
          
          // Redistribute from removed unlocked cards to existing unlocked cards
          if (redistributeAmount > 0) {
            const existingUnlockedIds = allNewIds.filter(id => 
              allCurrentIds.includes(id) && !prev.lockedCards[id]
            );
            
            if (existingUnlockedIds.length > 0) {
              const totalExistingUnlocked = existingUnlockedIds.reduce((sum, id) => 
                sum + (prev.splits[id] || 0), 0
              );
              
              if (totalExistingUnlocked > 0) {
                // Proportional redistribution
                existingUnlockedIds.forEach(id => {
                  const currentShare = prev.splits[id] || 0;
                  const proportion = currentShare / totalExistingUnlocked;
                  newSplits[id] = currentShare + (redistributeAmount * proportion);
                });
              } else {
                // Equal redistribution if no existing shares
                const equalShare = redistributeAmount / existingUnlockedIds.length;
                existingUnlockedIds.forEach(id => {
                  newSplits[id] = (prev.splits[id] || 0) + equalShare;
                });
              }
            }
          }
        }
        
        return {
          ...prev,
          selectedPeopleIds,
          selectedGroupIds,
          splits: newSplits,
          lockedCards: newLockedCards,
          lastUpdated: new Date()
        };
      });
    },
    
    updateSplit: (id: string, percentage: number) => {
      setEstateRemainderState(prev => {
        // Get unlocked cards excluding this person
        const otherIds = Object.keys(prev.splits).filter(splitId => splitId !== id && !prev.lockedCards[splitId]);
        const otherTotalPercentage = otherIds.reduce((sum, splitId) => sum + (prev.splits[splitId] || 0), 0);
        
        // Calculate total locked percentage
        const lockedTotalPercentage = Object.keys(prev.splits)
          .filter(splitId => splitId !== id && prev.lockedCards[splitId])
          .reduce((sum, splitId) => sum + (prev.splits[splitId] || 0), 0);
        
        // Calculate maximum allowed percentage for this slider
        const maxAllowedPercentage = 100 - lockedTotalPercentage;
        
        // Clamp the requested percentage to available space
        const clampedPercentage = Math.max(0, Math.min(maxAllowedPercentage, percentage));
        
        // Calculate remaining percentage to distribute among unlocked others
        const availablePercentage = 100 - lockedTotalPercentage - clampedPercentage;
        
        const newSplits = { ...prev.splits };
        newSplits[id] = clampedPercentage;
        
        if (otherIds.length > 0) {
          if (otherTotalPercentage > 0 && availablePercentage >= 0) {
            // Proportionally redistribute
            const redistributionRatio = availablePercentage / otherTotalPercentage;
            
            otherIds.forEach(splitId => {
              newSplits[splitId] = Math.max(0, (prev.splits[splitId] || 0) * redistributionRatio);
            });
          } else if (availablePercentage > 0 && otherTotalPercentage === 0) {
            // If other sliders are at 0, distribute remaining equally
            const equalShare = availablePercentage / otherIds.length;
            otherIds.forEach(splitId => {
              newSplits[splitId] = equalShare;
            });
          }
        }
        
        // Final validation: ensure total equals 100%
        const total = Object.values(newSplits).reduce((sum, val) => sum + val, 0);
        if (Math.abs(total - 100) > 0.01 && Object.keys(newSplits).length > 0) {
          // Adjust the current slider to make exact 100%
          const adjustment = 100 - total;
          newSplits[id] = Math.max(0, newSplits[id] + adjustment);
        }
        
        return {
          ...prev,
          splits: newSplits,
          lastUpdated: new Date()
        };
      });
    },
    
    toggleLock: (id: string) => {
      setEstateRemainderState(prev => ({
        ...prev,
        lockedCards: {
          ...prev.lockedCards,
          [id]: !prev.lockedCards[id]
        },
        lastUpdated: new Date()
      }));
    },
    
    removeRecipient: (splitId: string) => {
      setEstateRemainderState(prev => {
        // Parse splitId to determine type (person-{id} or group-{id})
        const firstHyphen = splitId.indexOf('-');
        const type = splitId.substring(0, firstHyphen);
        const id = splitId.substring(firstHyphen + 1);
        
        // If it's a group, set it inactive
        if (type === 'group') {
          beneficiaryGroupActions.setGroupActive(id, false);
        }
        
        // Remove from appropriate array
        const newSelectedPeopleIds = type === 'person' 
          ? prev.selectedPeopleIds.filter(personId => personId !== id)
          : prev.selectedPeopleIds;
        
        const newSelectedGroupIds = type === 'group'
          ? prev.selectedGroupIds.filter(groupId => groupId !== id)
          : prev.selectedGroupIds;
        
        // Remove from splits and lockedCards
        const newSplits = { ...prev.splits };
        const newLockedCards = { ...prev.lockedCards };
        delete newSplits[splitId];
        delete newLockedCards[splitId];
        
        // Redistribute
        const unlockedIds = Object.keys(newSplits).filter(sid => !newLockedCards[sid]);
        if (unlockedIds.length > 0) {
          const totalUnlocked = unlockedIds.reduce((sum, sid) => sum + (newSplits[sid] || 0), 0);
          const lockedTotal = Object.keys(newSplits)
            .filter(sid => newLockedCards[sid])
            .reduce((sum, sid) => sum + (newSplits[sid] || 0), 0);
          const availablePercentage = 100 - lockedTotal;
          
          if (totalUnlocked > 0) {
            // Proportionally redistribute
            unlockedIds.forEach(sid => {
              const currentShare = newSplits[sid] || 0;
              const proportion = currentShare / totalUnlocked;
              newSplits[sid] = availablePercentage * proportion;
            });
          } else {
            // Equal distribution if all at 0
            const equalShare = availablePercentage / unlockedIds.length;
            unlockedIds.forEach(sid => {
              newSplits[sid] = equalShare;
            });
          }
        }
        
        return {
          ...prev,
          selectedPeopleIds: newSelectedPeopleIds,
          selectedGroupIds: newSelectedGroupIds,
          splits: newSplits,
          lockedCards: newLockedCards,
          lastUpdated: new Date()
        };
      });
    },
    
    getEstateRemainderState: () => estateRemainderState,
    
    clearEstateRemainderState: async () => {
      const initialState: EstateRemainderState = {
        userId: willData.userId || '',
        selectedPeopleIds: [],
        selectedGroupIds: [],
        splits: {},
        lockedCards: {},
        lastUpdated: new Date()
      };
      setEstateRemainderState(initialState);
      await storage.remove(getScopedKey(STORAGE_KEYS.ESTATE_REMAINDER_DATA));
    }
  };

  // =============================================================================
  // Purge All Data (Development Function)
  // =============================================================================

  const purgeAllData = async () => {
    console.log('🗑️ PURGING ALL DATA - Development Action');
    
    try {
      // Clear all AsyncStorage
      await storage.clearAll();
      
      // Reset all state to initial values
      setWillData(getInitialWillData());
      setPersonData(getInitialPersonData());
      setBusinessData(getInitialBusinessData());
      setBequeathalData(getInitialBequeathalData());
      setTrustData(getInitialTrustData());
      setBequestData([]); // Clear bequests
      setBeneficiaryGroupData([]);
      setEstateRemainderState(getInitialEstateRemainderState('')); // Empty userId for purge
      setRelationshipData([]);
      
      console.log('✅ All data purged successfully');
    } catch (error) {
      console.error('❌ Failed to purge all data:', error);
    }
  };

  // =============================================================================
  // Return all actions
  // =============================================================================

  return {
    ownerId,
    setOwnerId,
    willActions,
    personActions,
    beneficiaryActions,
    businessActions,
    beneficiaryGroupActions,
    bequeathalActions,
    trustActions,
    bequestActions,
    relationshipActions,
    estateRemainderActions,
    purgeAllData
  };
};

