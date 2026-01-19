import { subscriptionService } from './firestore-service';
import type { UserProfile } from './firestore-types';

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export interface PlanLimits {
  maxAttendees: number;
  maxEvents: number;
  features: string[];
}

export const planLimits: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxAttendees: 0, // No events allowed
    maxEvents: 0,
    features: ['Basic attendee features'],
  },
  starter: {
    maxAttendees: 500,
    maxEvents: 5,
    features: [
      'Up to 500 attendees per event',
      'Up to 5 events',
      'Basic analytics',
      'Email support',
    ],
  },
  professional: {
    maxAttendees: 2000,
    maxEvents: 20,
    features: [
      'Up to 2,000 attendees per event',
      'Up to 20 events',
      'Advanced analytics',
      'AI matchmaking',
      'Priority support',
    ],
  },
  enterprise: {
    maxAttendees: Infinity,
    maxEvents: Infinity,
    features: [
      'Unlimited attendees',
      'Unlimited events',
      'Custom analytics',
      'White-label options',
      'Dedicated support',
      'API access',
    ],
  },
};

export async function getUserSubscriptionPlan(userId: string): Promise<SubscriptionPlan> {
  const subscription = await subscriptionService.getSubscriptionByUser(userId);
  
  if (!subscription || subscription.status !== 'active') {
    return 'free';
  }

  return subscription.plan;
}

export async function checkUsageLimit(
  userId: string,
  limitType: 'attendees' | 'events',
  currentCount: number
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const plan = await getUserSubscriptionPlan(userId);
  const limits = planLimits[plan];

  let limit: number;
  if (limitType === 'attendees') {
    limit = limits.maxAttendees;
  } else {
    limit = limits.maxEvents;
  }

  return {
    allowed: currentCount < limit,
    limit,
    current: currentCount,
  };
}

export async function canCreateEvent(userId: string, currentEventCount: number): Promise<boolean> {
  const { allowed } = await checkUsageLimit(userId, 'events', currentEventCount);
  return allowed;
}

export async function canAddAttendee(userId: string, eventId: string, currentAttendeeCount: number): Promise<boolean> {
  const { allowed } = await checkUsageLimit(userId, 'attendees', currentAttendeeCount);
  return allowed;
}
