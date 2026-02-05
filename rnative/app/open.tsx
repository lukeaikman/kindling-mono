/**
 * Deep Link Handler Route
 * 
 * This route handles incoming deep links like:
 * kindling://open?show_video=1&source=facebook
 * 
 * It captures the params, stores attribution, and redirects to the appropriate screen.
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { KindlingColors } from '../src/styles/theme';

const ATTRIBUTION_KEY = 'kindling_attribution';
const ONBOARDING_STATE_KEY = 'kindling_onboarding_state';

interface AttributionData {
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

interface OnboardingState {
  video_completed: boolean;
  video_version?: number;
  questionnaire_completed: boolean;
  questionnaire_version?: number;
}

function parseIntParam(value: string | string[] | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const strValue = Array.isArray(value) ? value[0] : value;
  const parsed = parseInt(strValue, 10);
  if (isNaN(parsed) || parsed < 0) return 1;
  return parsed;
}

function parseFirstShow(value: string | string[] | undefined): 'video' | 'risk_questionnaire' {
  const strValue = Array.isArray(value) ? value[0] : value;
  if (strValue === 'risk_questionnaire') return 'risk_questionnaire';
  return 'video';
}

export default function OpenDeepLinkHandler() {
  const params = useLocalSearchParams<{
    source?: string;
    campaign?: string;
    location_id?: string;
    show_video?: string;
    show_risk_questionnaire?: string;
    first_show?: string;
  }>();

  useEffect(() => {
    const handleDeepLink = async () => {
      console.log('=== DEBUGGING DEEP LINK PARSER ===');
      console.log('Received params:', JSON.stringify(params, null, 2));
      console.log('show_video raw:', params.show_video);
      console.log('show_risk_questionnaire raw:', params.show_risk_questionnaire);
      console.log('source raw:', params.source);
      console.log('==================================');
      
      // Check for existing attribution (don't overwrite first-touch)
      const existing = await SecureStore.getItemAsync(ATTRIBUTION_KEY);
      
      if (!existing) {
        // Store new attribution from deep link
        const attribution: AttributionData = {
          source: params.source,
          campaign: params.campaign,
          location_id: params.location_id,
          show_video: parseIntParam(params.show_video, 1),
          show_risk_questionnaire: parseIntParam(params.show_risk_questionnaire, 0),
          first_show: parseFirstShow(params.first_show),
          captured_at: new Date().toISOString(),
          is_organic: false,
          raw_url: `kindling://open?${new URLSearchParams(params as Record<string, string>).toString()}`,
        };
        
        await SecureStore.setItemAsync(ATTRIBUTION_KEY, JSON.stringify(attribution));
        
        // Initialize onboarding state
        const onboardingState: OnboardingState = {
          video_completed: false,
          video_version: attribution.show_video > 0 ? attribution.show_video : undefined,
          questionnaire_completed: false,
          questionnaire_version: attribution.show_risk_questionnaire > 0 ? attribution.show_risk_questionnaire : undefined,
        };
        await SecureStore.setItemAsync(ONBOARDING_STATE_KEY, JSON.stringify(onboardingState));
        
        // Determine where to go
        const needsVideo = attribution.show_video > 0;
        const needsQuestionnaire = attribution.show_risk_questionnaire > 0;
        
        console.log('=== ROUTING DECISION (new attribution) ===');
        console.log('show_video parsed:', attribution.show_video);
        console.log('show_risk_questionnaire parsed:', attribution.show_risk_questionnaire);
        console.log('needsVideo:', needsVideo);
        console.log('needsQuestionnaire:', needsQuestionnaire);
        console.log('first_show:', attribution.first_show);
        
        if (needsVideo && needsQuestionnaire) {
          const dest = attribution.first_show === 'video' ? '/video-intro' : '/risk-questionnaire';
          console.log('Routing to:', dest);
          router.replace(dest);
        } else if (needsVideo) {
          console.log('Routing to: /video-intro');
          router.replace('/video-intro');
        } else if (needsQuestionnaire) {
          console.log('Routing to: /risk-questionnaire');
          router.replace('/risk-questionnaire');
        } else {
          console.log('Routing to: /intro');
          router.replace('/intro');
        }
        console.log('==========================================');
      } else {
        // Already have attribution - go to appropriate screen based on state
        console.log('=== EXISTING ATTRIBUTION FOUND ===');
        console.log('Existing attribution:', existing);
        
        const storedAttribution: AttributionData = JSON.parse(existing);
        const stateStr = await SecureStore.getItemAsync(ONBOARDING_STATE_KEY);
        const state: OnboardingState | null = stateStr ? JSON.parse(stateStr) : null;
        
        console.log('Stored onboarding state:', stateStr);
        
        if (!state) {
          console.log('No onboarding state found, routing to /intro');
          router.replace('/intro');
          return;
        }
        
        const needsVideo = storedAttribution.show_video > 0 && !state.video_completed;
        const needsQuestionnaire = storedAttribution.show_risk_questionnaire > 0 && !state.questionnaire_completed;
        
        console.log('needsVideo:', needsVideo, '(show_video:', storedAttribution.show_video, ', completed:', state.video_completed, ')');
        console.log('needsQuestionnaire:', needsQuestionnaire, '(show_risk_questionnaire:', storedAttribution.show_risk_questionnaire, ', completed:', state.questionnaire_completed, ')');
        
        if (needsVideo && needsQuestionnaire) {
          const dest = storedAttribution.first_show === 'video' ? '/video-intro' : '/risk-questionnaire';
          console.log('Routing to:', dest);
          router.replace(dest);
        } else if (needsVideo) {
          console.log('Routing to: /video-intro');
          router.replace('/video-intro');
        } else if (needsQuestionnaire) {
          console.log('Routing to: /risk-questionnaire');
          router.replace('/risk-questionnaire');
        } else {
          console.log('Routing to: /intro');
          router.replace('/intro');
        }
        console.log('=====================================');
      }
    };

    handleDeepLink();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={KindlingColors.cream} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
