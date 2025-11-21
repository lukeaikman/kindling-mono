/**
 * API Service Layer for Kindling app
 * Provides type-safe methods for communicating with the backend API
 * 
 * Currently configured for JSON Server mock API.
 * Can be easily switched to Rails backend by changing API_BASE_URL.
 * 
 * @module services/api
 */

import {
  WillData,
  Person,
  Asset,
  AssetType,
  Business,
  Trust,
  RelationshipEdge,
  BeneficiaryGroup,
  EstateRemainderState,
} from '../types';

/**
 * API configuration
 * Change this when switching from JSON Server to Rails backend
 */
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api'  // JSON Server for development
  : 'https://api.kindling.app/v1'; // Production Rails API (future)

/**
 * API client configuration
 */
const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    // Add authorization headers here when authentication is implemented
    // 'Authorization': `Bearer ${token}`
  },
  timeout: 10000, // 10 second timeout
};

/**
 * Generic fetch wrapper with error handling and retry logic
 * 
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {RequestInit} options - Fetch options
 * @param {number} retries - Number of retries on failure
 * @returns {Promise<T>} Response data
 */
async function fetchWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 2
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...options.headers,
    },
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle empty responses (e.g., DELETE requests)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`[API] Attempt ${attempt + 1} failed for ${endpoint}:`, error);
      
      // If this was the last retry, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw new Error(`Failed after ${retries + 1} attempts`);
}

// =============================================================================
// Will API
// =============================================================================

/**
 * Get will data
 */
export const getWill = async (): Promise<WillData> => {
  return fetchWithRetry<WillData>('/will');
};

/**
 * Update will data
 */
export const updateWill = async (updates: Partial<WillData>): Promise<WillData> => {
  return fetchWithRetry<WillData>('/will', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

// =============================================================================
// People API
// =============================================================================

/**
 * Get all people
 */
export const getPeople = async (): Promise<Person[]> => {
  return fetchWithRetry<Person[]>('/people');
};

/**
 * Get person by ID
 */
export const getPersonById = async (id: string): Promise<Person> => {
  return fetchWithRetry<Person>(`/people/${id}`);
};

/**
 * Create new person
 */
export const createPerson = async (person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<Person> => {
  return fetchWithRetry<Person>('/people', {
    method: 'POST',
    body: JSON.stringify(person),
  });
};

/**
 * Update person
 */
export const updatePerson = async (id: string, updates: Partial<Person>): Promise<Person> => {
  return fetchWithRetry<Person>(`/people/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

/**
 * Delete person
 */
export const deletePerson = async (id: string): Promise<void> => {
  return fetchWithRetry<void>(`/people/${id}`, {
    method: 'DELETE',
  });
};

// =============================================================================
// Assets API
// =============================================================================

/**
 * Get all assets of a specific type
 */
export const getAssetsByType = async (type: AssetType): Promise<Asset[]> => {
  return fetchWithRetry<Asset[]>(`/assets/${type}`);
};

/**
 * Create new asset
 */
export const createAsset = async (type: AssetType, asset: Omit<Asset, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Asset> => {
  return fetchWithRetry<Asset>(`/assets/${type}`, {
    method: 'POST',
    body: JSON.stringify(asset),
  });
};

/**
 * Update asset
 */
export const updateAsset = async (type: AssetType, id: string, updates: Partial<Asset>): Promise<Asset> => {
  return fetchWithRetry<Asset>(`/assets/${type}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

/**
 * Delete asset
 */
export const deleteAsset = async (type: AssetType, id: string): Promise<void> => {
  return fetchWithRetry<void>(`/assets/${type}/${id}`, {
    method: 'DELETE',
  });
};

// =============================================================================
// Businesses API
// =============================================================================

/**
 * Get all businesses
 */
export const getBusinesses = async (): Promise<Business[]> => {
  return fetchWithRetry<Business[]>('/businesses');
};

/**
 * Create business
 */
export const createBusiness = async (business: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<Business> => {
  return fetchWithRetry<Business>('/businesses', {
    method: 'POST',
    body: JSON.stringify(business),
  });
};

// =============================================================================
// Trusts API
// =============================================================================

/**
 * Get all trusts
 */
export const getTrusts = async (): Promise<Trust[]> => {
  return fetchWithRetry<Trust[]>('/trusts');
};

/**
 * Create trust
 */
export const createTrust = async (trust: Omit<Trust, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trust> => {
  return fetchWithRetry<Trust>('/trusts', {
    method: 'POST',
    body: JSON.stringify(trust),
  });
};

// =============================================================================
// Relationships API
// =============================================================================

/**
 * Get all relationships
 */
export const getRelationships = async (): Promise<RelationshipEdge[]> => {
  return fetchWithRetry<RelationshipEdge[]>('/relationships');
};

/**
 * Create relationship
 */
export const createRelationship = async (
  relationship: Omit<RelationshipEdge, 'id' | 'createdAt' | 'updatedAt'>
): Promise<RelationshipEdge> => {
  return fetchWithRetry<RelationshipEdge>('/relationships', {
    method: 'POST',
    body: JSON.stringify(relationship),
  });
};

// =============================================================================
// Beneficiary Groups API
// =============================================================================

/**
 * Get all beneficiary groups
 */
export const getBeneficiaryGroups = async (): Promise<BeneficiaryGroup[]> => {
  return fetchWithRetry<BeneficiaryGroup[]>('/beneficiary-groups');
};

/**
 * Create beneficiary group
 */
export const createBeneficiaryGroup = async (
  group: Omit<BeneficiaryGroup, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BeneficiaryGroup> => {
  return fetchWithRetry<BeneficiaryGroup>('/beneficiary-groups', {
    method: 'POST',
    body: JSON.stringify(group),
  });
};

// =============================================================================
// Estate Remainder API
// =============================================================================

/**
 * Get estate remainder state
 */
export const getEstateRemainder = async (): Promise<EstateRemainderState> => {
  return fetchWithRetry<EstateRemainderState>('/estate-remainder');
};

/**
 * Update estate remainder state
 */
export const updateEstateRemainder = async (updates: Partial<EstateRemainderState>): Promise<EstateRemainderState> => {
  return fetchWithRetry<EstateRemainderState>('/estate-remainder', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

// =============================================================================
// Export API client
// =============================================================================

/**
 * API client object with all methods
 * Use this for cleaner imports: api.getPeople(), api.createAsset(), etc.
 */
export const api = {
  // Will
  getWill,
  updateWill,
  
  // People
  getPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
  
  // Assets
  getAssetsByType,
  createAsset,
  updateAsset,
  deleteAsset,
  
  // Businesses
  getBusinesses,
  createBusiness,
  
  // Trusts
  getTrusts,
  createTrust,
  
  // Relationships
  getRelationships,
  createRelationship,
  
  // Beneficiary Groups
  getBeneficiaryGroups,
  createBeneficiaryGroup,
  
  // Estate Remainder
  getEstateRemainder,
  updateEstateRemainder,
};

