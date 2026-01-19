import { Timestamp } from 'firebase/firestore';

// User types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  title?: string;
  company?: string;
  avatar?: string;
  interests: string[];
  goals?: string;
  role: 'attendee' | 'organizer' | 'speaker' | 'sponsor' | 'admin';
  subscriptionStatus?: 'free' | 'starter' | 'professional' | 'enterprise';
  subscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Event types
export interface Event {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  venue?: string;
  venueMapUrl?: string;
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
  };
  settings: {
    allowPublicRegistration: boolean;
    requireApproval: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Session types
export interface Session {
  id: string;
  eventId: string;
  title: string;
  description: string;
  startTime: Timestamp;
  endTime: Timestamp;
  tags: string[];
  speakerId?: string;
  speakerName?: string;
  location?: string;
  maxAttendees?: number;
  currentAttendees: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Attendee types (for event-specific attendee data)
export interface Attendee {
  id: string;
  userId: string;
  eventId: string;
  name: string;
  title?: string;
  company?: string;
  avatar?: string;
  interests: string[];
  personalityTraits: string[];
  connections: string[]; // Array of other attendee IDs
  points: number;
  sessionsAttended: string[]; // Array of session IDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  plan: 'starter' | 'professional' | 'enterprise';
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Payment types
export interface Payment {
  id: string;
  userId: string;
  eventId?: string;
  type: 'ticket' | 'subscription' | 'sponsorship';
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  ticketId?: string;
  subscriptionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Ticket types
export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  ticketType: 'general' | 'vip' | 'student';
  price: number;
  qrCode: string;
  status: 'pending' | 'confirmed' | 'used' | 'cancelled';
  paymentId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Sponsor types
export interface Sponsor {
  id: string;
  eventId: string;
  name: string;
  logoUrl?: string;
  website?: string;
  tier: 'gold' | 'silver' | 'bronze';
  placement: string[]; // Where sponsor appears: 'discovery', 'matchmaking', 'resource-hub'
  materials?: {
    brochures?: string[];
    videos?: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Leaderboard entry
export interface LeaderboardEntry {
  userId: string;
  eventId: string;
  name: string;
  avatar?: string;
  points: number;
  rank: number;
  change: 'up' | 'down' | 'same';
  lastUpdated: Timestamp;
}
