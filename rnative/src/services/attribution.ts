import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

const ATTRIBUTION_KEY = 'kindling_attribution';
const ONBOARDING_STATE_KEY = 'kindling_onboarding_state';

export interface AttributionData {
  source?: string;
  campaign?: string;
  location_id?: string;
  show_video: number;
  show_risk_questionnaire: number;
  first_show: 'video' | 'risk_questionnaire';
  captured_at: string;
  is_organic: boolean;
  raw_url?: string;
}

export interface OnboardingState {
  video_completed: boolean;
  video_version?: number;
  questionnaire_completed: boolean;
  questionnaire_version?: number;
}

// Defaults for organic installs
const ORGANIC_DEFAULTS: Pick<AttributionData, 'show_video' | 'show_risk_questionnaire' | 'first_show' | 'is_organic'> = {
  show_video: 1,
  show_risk_questionnaire: 0,
  first_show: 'video',
  is_organic: true,
};

/**
 * Parse integer parameter from URL.
 * If value exists but is invalid (non-numeric, negative, etc.), defaults to 1.
 * If value is missing entirely, uses the provided defaultValue.
 */
function parseIntParam(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  // Invalid values (NaN, negative) default to 1
  if (isNaN(parsed) || parsed < 0) return 1;
  return parsed;
}

/**
 * Parse first_show parameter from URL.
 */
function parseFirstShow(value: string | undefined): 'video' | 'risk_questionnaire' {
  if (value === 'risk_questionnaire') return 'risk_questionnaire';
  return 'video';
}

/**
 * Initialize attribution on first app open.
 * 
 * Phase 2a: Uses expo-linking for direct deep links only.
 * Phase 2b: Will be replaced with AppsFlyer SDK for deferred deep links.
 */
export const initializeAttribution = async (): Promise<AttributionData> => {
  // Check for existing attribution (already captured)
  const existing = await getStoredAttribution();
  if (existing) return existing;
  
  // Try to get initial URL (direct deep link)
  const initialUrl = await Linking.getInitialURL();
  
  let attribution: AttributionData;
  
  if (initialUrl) {
    // Parse deep link params
    const parsed = Linking.parse(initialUrl);
    const params = (parsed.queryParams || {}) as Record<string, string>;
    
    attribution = {
      source: params.source,
      campaign: params.campaign,
      location_id: params.location_id,
      show_video: parseIntParam(params.show_video, ORGANIC_DEFAULTS.show_video),
      show_risk_questionnaire: parseIntParam(params.show_risk_questionnaire, ORGANIC_DEFAULTS.show_risk_questionnaire),
      first_show: parseFirstShow(params.first_show),
      captured_at: new Date().toISOString(),
      is_organic: false,
      raw_url: initialUrl,
    };
  } else {
    // Organic install - use defaults
    attribution = {
      ...ORGANIC_DEFAULTS,
      captured_at: new Date().toISOString(),
    };
  }
  
  // Store attribution
  await SecureStore.setItemAsync(ATTRIBUTION_KEY, JSON.stringify(attribution));
  
  // Initialize onboarding state
  const onboardingState: OnboardingState = {
    video_completed: false,
    video_version: attribution.show_video > 0 ? attribution.show_video : undefined,
    questionnaire_completed: false,
    questionnaire_version: attribution.show_risk_questionnaire > 0 ? attribution.show_risk_questionnaire : undefined,
  };
  await SecureStore.setItemAsync(ONBOARDING_STATE_KEY, JSON.stringify(onboardingState));
  
  return attribution;
};

/**
 * Get stored attribution data.
 */
export const getStoredAttribution = async (): Promise<AttributionData | null> => {
  try {
    const stored = await SecureStore.getItemAsync(ATTRIBUTION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Get onboarding state (video/questionnaire progress)
 */
export const getOnboardingState = async (): Promise<OnboardingState | null> => {
  try {
    const stored = await SecureStore.getItemAsync(ONBOARDING_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Update onboarding state
 */
export const updateOnboardingState = async (updates: Partial<OnboardingState>): Promise<void> => {
  const current = await getOnboardingState();
  const updated = { ...current, ...updates };
  await SecureStore.setItemAsync(ONBOARDING_STATE_KEY, JSON.stringify(updated));
};

/**
 * Determine next destination based on attribution and onboarding state.
 */
export const getNextOnboardingDestination = async (): Promise<
  '/video-intro' | '/risk-questionnaire' | '/intro'
> => {
  const attribution = await getStoredAttribution();
  const state = await getOnboardingState();
  
  if (!attribution || !state) {
    return '/intro';
  }
  
  const needsVideo = attribution.show_video > 0 && !state.video_completed;
  const needsQuestionnaire = attribution.show_risk_questionnaire > 0 && !state.questionnaire_completed;
  
  if (needsVideo && needsQuestionnaire) {
    return attribution.first_show === 'video' ? '/video-intro' : '/risk-questionnaire';
  }
  
  if (needsVideo) return '/video-intro';
  if (needsQuestionnaire) return '/risk-questionnaire';
  
  return '/intro';
};

/**
 * Track registration event.
 * 
 * Phase 2a: Logs to console (placeholder)
 * Phase 2b: Will call AppsFlyer.logEvent()
 */
export const trackRegistration = (userId: string): void => {
  console.log(`[Attribution] Registration tracked for user: ${userId}`);
  // TODO Phase 2b: appsFlyer.logEvent('af_complete_registration', { af_customer_user_id: userId })
};

/**
 * Clear onboarding state after registration.
 */
export const clearOnboardingState = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(ONBOARDING_STATE_KEY);
  // Keep attribution data - don't delete ATTRIBUTION_KEY
};

/**
 * Get attribution data formatted for API request.
 */
export const getAttributionForApi = async (): Promise<{
  source?: string;
  campaign?: string;
  location_id?: string;
  is_organic: boolean;
} | null> => {
  const attribution = await getStoredAttribution();
  if (!attribution) return null;
  
  return {
    source: attribution.source,
    campaign: attribution.campaign,
    location_id: attribution.location_id,
    is_organic: attribution.is_organic,
  };
};
