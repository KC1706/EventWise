import { subscriptionService } from './firestore-service';
import type { UserProfile } from './firestore-types';

export type PremiumFeature = 
  | 'unlimited_matchmaking'
  | 'unlimited_ai_queries'
  | 'crm_export'
  | 'calendar_sync'
  | 'advanced_analytics';

export interface FeatureLimits {
  matchmakingQueries: number;
  aiQueries: number;
  crmExports: number;
  calendarSyncs: number;
}

const freeLimits: FeatureLimits = {
  matchmakingQueries: 5,
  aiQueries: 10,
  crmExports: 0,
  calendarSyncs: 0,
};

const premiumLimits: FeatureLimits = {
  matchmakingQueries: Infinity,
  aiQueries: Infinity,
  crmExports: Infinity,
  calendarSyncs: Infinity,
};

export async function isPremiumUser(userId: string): Promise<boolean> {
  const subscription = await subscriptionService.getSubscriptionByUser(userId);
  return subscription?.status === 'active' && subscription.plan !== 'free';
}

export async function getFeatureLimits(userId: string): Promise<FeatureLimits> {
  const isPremium = await isPremiumUser(userId);
  return isPremium ? premiumLimits : freeLimits;
}

export async function canUseFeature(
  userId: string,
  feature: PremiumFeature,
  currentUsage: number = 0
): Promise<{ allowed: boolean; limit: number; current: number; isPremium: boolean }> {
  const limits = await getFeatureLimits(userId);
  const isPremium = await isPremiumUser(userId);

  let limit: number;
  switch (feature) {
    case 'unlimited_matchmaking':
      limit = limits.matchmakingQueries;
      break;
    case 'unlimited_ai_queries':
      limit = limits.aiQueries;
      break;
    case 'crm_export':
      limit = limits.crmExports;
      break;
    case 'calendar_sync':
      limit = limits.calendarSyncs;
      break;
    case 'advanced_analytics':
      return { allowed: isPremium, limit: isPremium ? 1 : 0, current: isPremium ? 1 : 0, isPremium };
    default:
      limit = 0;
  }

  return {
    allowed: currentUsage < limit,
    limit,
    current: currentUsage,
    isPremium,
  };
}

export function getPremiumFeatures(): PremiumFeature[] {
  return [
    'unlimited_matchmaking',
    'unlimited_ai_queries',
    'crm_export',
    'calendar_sync',
    'advanced_analytics',
  ];
}

export function getFeatureDescription(feature: PremiumFeature): string {
  const descriptions: Record<PremiumFeature, string> = {
    unlimited_matchmaking: 'Unlimited AI-powered matchmaking recommendations',
    unlimited_ai_queries: 'Unlimited queries to the AI assistant',
    crm_export: 'Export contacts to CRM systems (Salesforce, HubSpot)',
    calendar_sync: 'Sync agenda with Google Calendar or Outlook',
    advanced_analytics: 'Access to advanced personal analytics and insights',
  };
  return descriptions[feature];
}
