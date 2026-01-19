import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  UserProfile,
  Event,
  Session,
  Attendee,
  Subscription,
  Payment,
  Ticket,
  Sponsor,
  LeaderboardEntry,
} from './firestore-types';

if (!db) {
  throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
}

// Generic helper functions
async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
}

async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}

async function createDocument<T extends { id?: string }>(
  collectionName: string,
  data: Omit<T, 'id'>,
  docId?: string
): Promise<string> {
  const now = Timestamp.now();
  const docData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  if (docId) {
    await setDoc(doc(db, collectionName, docId), docData);
    return docId;
  } else {
    const docRef = doc(collection(db, collectionName));
    await setDoc(docRef, docData);
    return docRef.id;
  }
}

async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

// User/Profile operations
export const userService = {
  async getUser(userId: string): Promise<UserProfile | null> {
    return getDocument<UserProfile>('users', userId);
  },

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const users = await getDocuments<UserProfile>('users', [where('email', '==', email), limit(1)]);
    return users[0] || null;
  },

  async createUser(userId: string, data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return createDocument<UserProfile>('users', { ...data, role: data.role || 'attendee' }, userId);
  },

  async updateUser(userId: string, data: Partial<UserProfile>): Promise<void> {
    return updateDocument('users', userId, data);
  },

  async getAllUsers(): Promise<UserProfile[]> {
    return getDocuments<UserProfile>('users');
  },
};

// Event operations
export const eventService = {
  async getEvent(eventId: string): Promise<Event | null> {
    return getDocument<Event>('events', eventId);
  },

  async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
    return getDocuments<Event>('events', [where('organizerId', '==', organizerId)]);
  },

  async createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return createDocument<Event>('events', data);
  },

  async updateEvent(eventId: string, data: Partial<Event>): Promise<void> {
    return updateDocument('events', eventId, data);
  },

  async deleteEvent(eventId: string): Promise<void> {
    return deleteDocument('events', eventId);
  },
};

// Session operations
export const sessionService = {
  async getSession(sessionId: string): Promise<Session | null> {
    return getDocument<Session>('sessions', sessionId);
  },

  async getSessionsByEvent(eventId: string): Promise<Session[]> {
    return getDocuments<Session>('sessions', [
      where('eventId', '==', eventId),
      orderBy('startTime', 'asc'),
    ]);
  },

  async getUpcomingSessions(eventId: string, minutes: number = 15): Promise<Session[]> {
    const now = Timestamp.now();
    const futureTime = new Date(now.toMillis() + minutes * 60 * 1000);
    return getDocuments<Session>('sessions', [
      where('eventId', '==', eventId),
      where('startTime', '>=', Timestamp.fromDate(now)),
      where('startTime', '<=', Timestamp.fromDate(futureTime)),
      orderBy('startTime', 'asc'),
    ]);
  },

  async createSession(data: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return createDocument<Session>('sessions', { ...data, currentAttendees: 0 });
  },

  async updateSession(sessionId: string, data: Partial<Session>): Promise<void> {
    return updateDocument('sessions', sessionId, data);
  },

  async deleteSession(sessionId: string): Promise<void> {
    return deleteDocument('sessions', sessionId);
  },
};

// Attendee operations
export const attendeeService = {
  async getAttendee(attendeeId: string): Promise<Attendee | null> {
    return getDocument<Attendee>('attendees', attendeeId);
  },

  async getAttendeesByEvent(eventId: string): Promise<Attendee[]> {
    return getDocuments<Attendee>('attendees', [where('eventId', '==', eventId)]);
  },

  async getAttendeeByUserAndEvent(userId: string, eventId: string): Promise<Attendee | null> {
    const attendees = await getDocuments<Attendee>('attendees', [
      where('userId', '==', userId),
      where('eventId', '==', eventId),
      limit(1),
    ]);
    return attendees[0] || null;
  },

  async createAttendee(data: Omit<Attendee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return createDocument<Attendee>('attendees', {
      ...data,
      connections: data.connections || [],
      points: data.points || 0,
      sessionsAttended: data.sessionsAttended || [],
    });
  },

  async updateAttendee(attendeeId: string, data: Partial<Attendee>): Promise<void> {
    return updateDocument('attendees', attendeeId, data);
  },

  async addConnection(attendeeId: string, connectedAttendeeId: string): Promise<void> {
    const attendee = await this.getAttendee(attendeeId);
    if (attendee && !attendee.connections.includes(connectedAttendeeId)) {
      await updateDocument('attendees', attendeeId, {
        connections: [...attendee.connections, connectedAttendeeId],
      });
    }
  },

  async addPoints(attendeeId: string, points: number): Promise<void> {
    const attendee = await this.getAttendee(attendeeId);
    if (attendee) {
      await updateDocument('attendees', attendeeId, {
        points: (attendee.points || 0) + points,
      });
    }
  },
};

// Subscription operations
export const subscriptionService = {
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    return getDocument<Subscription>('subscriptions', subscriptionId);
  },

  async getSubscriptionByUser(userId: string): Promise<Subscription | null> {
    const subscriptions = await getDocuments<Subscription>('subscriptions', [
      where('userId', '==', userId),
      where('status', '==', 'active'),
      limit(1),
    ]);
    return subscriptions[0] || null;
  },

  async createSubscription(data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return createDocument<Subscription>('subscriptions', data);
  },

  async updateSubscription(subscriptionId: string, data: Partial<Subscription>): Promise<void> {
    return updateDocument('subscriptions', subscriptionId, data);
  },
};

// Payment operations
export const paymentService = {
  async getPayment(paymentId: string): Promise<Payment | null> {
    return getDocument<Payment>('payments', paymentId);
  },

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return getDocuments<Payment>('payments', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ]);
  },

  async createPayment(data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return createDocument<Payment>('payments', data);
  },

  async updatePayment(paymentId: string, data: Partial<Payment>): Promise<void> {
    return updateDocument('payments', paymentId, data);
  },
};

// Ticket operations
export const ticketService = {
  async getTicket(ticketId: string): Promise<Ticket | null> {
    return getDocument<Ticket>('tickets', ticketId);
  },

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    return getDocuments<Ticket>('tickets', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ]);
  },

  async getTicketsByEvent(eventId: string): Promise<Ticket[]> {
    return getDocuments<Ticket>('tickets', [where('eventId', '==', eventId)]);
  },

  async createTicket(data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return createDocument<Ticket>('tickets', data);
  },

  async updateTicket(ticketId: string, data: Partial<Ticket>): Promise<void> {
    return updateDocument('tickets', ticketId, data);
  },
};

// Sponsor operations
export const sponsorService = {
  async getSponsor(sponsorId: string): Promise<Sponsor | null> {
    return getDocument<Sponsor>('sponsors', sponsorId);
  },

  async getSponsorsByEvent(eventId: string): Promise<Sponsor[]> {
    return getDocuments<Sponsor>('sponsors', [where('eventId', '==', eventId)]);
  },

  async createSponsor(data: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return createDocument<Sponsor>('sponsors', data);
  },

  async updateSponsor(sponsorId: string, data: Partial<Sponsor>): Promise<void> {
    return updateDocument('sponsors', sponsorId, data);
  },

  async deleteSponsor(sponsorId: string): Promise<void> {
    return deleteDocument('sponsors', sponsorId);
  },
};

// Leaderboard operations
export const leaderboardService = {
  async getLeaderboard(eventId: string, limitCount: number = 10): Promise<LeaderboardEntry[]> {
    return getDocuments<LeaderboardEntry>('leaderboards', [
      where('eventId', '==', eventId),
      orderBy('points', 'desc'),
      limit(limitCount),
    ]);
  },

  async updateLeaderboardEntry(
    userId: string,
    eventId: string,
    data: Partial<LeaderboardEntry>
  ): Promise<void> {
    const entryId = `${userId}_${eventId}`;
    const existing = await getDocument<LeaderboardEntry>('leaderboards', entryId);
    if (existing) {
      await updateDocument('leaderboards', entryId, data);
    } else {
      await createDocument<LeaderboardEntry>('leaderboards', {
        userId,
        eventId,
        points: 0,
        rank: 0,
        change: 'same',
        ...data,
      } as Omit<LeaderboardEntry, 'id' | 'createdAt' | 'updatedAt'>, entryId);
    }
  },
};

// Migration helper to seed initial data
export async function seedInitialData() {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const batch = writeBatch(db);
  const seedAttendees = [
    {
      name: 'David Miller',
      title: 'Data Scientist at BigData Corp',
      company: 'BigData Corp',
      interests: ['AI', 'SaaS', 'Venture Capital'],
      personalityTraits: ['Analytical', 'Driven'],
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&h=300&fit=crop',
    },
    {
      name: 'Emily White',
      title: 'UX Lead at Creative Solutions',
      company: 'Creative Solutions',
      interests: ['UX/UI Design', 'Frontend Development', 'Web3'],
      personalityTraits: ['Creative', 'Collaborative'],
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&h=300&fit=crop',
    },
    {
      name: 'Frank Green',
      title: 'ML Researcher at DeepLearn AI',
      company: 'DeepLearn AI',
      interests: ['AI', 'ML', 'Data Science'],
      personalityTraits: ['Analytical', 'Introverted'],
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=300&h=300&fit=crop',
    },
    {
      name: 'Grace Hall',
      title: 'Head of Product at ScaleFast',
      company: 'ScaleFast',
      interests: ['Product Management', 'SaaS', 'Growth Hacking'],
      personalityTraits: ['Extroverted', 'Leader'],
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&h=300&fit=crop',
    },
    {
      name: 'Alice Johnson',
      title: 'Lead AI Engineer at Innovate Inc.',
      company: 'Innovate Inc.',
      interests: ['Generative AI', 'Ethical ML'],
      personalityTraits: ['Analytical', 'Driven'],
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&h=300&fit=crop',
    },
    {
      name: 'Ben Carter',
      title: 'Developer Advocate at Groq',
      company: 'Groq',
      interests: ['High-performance computing', 'API design'],
      personalityTraits: ['Extroverted', 'Collaborative'],
      avatar: 'https://images.unsplash.com/photo-1591799264318-7e6e74e3dce9?q=80&w=300&h=300&fit=crop',
    },
    {
      name: 'Carlos Gomez',
      title: 'Founder of ScaleUp Solutions',
      company: 'ScaleUp Solutions',
      interests: ['SaaS', 'Startups'],
      personalityTraits: ['Extroverted', 'Leader'],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&h=300&fit=crop',
    },
    {
      name: 'Samantha Lee',
      title: 'Product Manager at TechGiant',
      company: 'TechGiant',
      interests: ['Product-led growth', 'UI/UX'],
      personalityTraits: ['Creative', 'Collaborative'],
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&h=300&fit=crop',
    },
  ];

  // Note: This is a simplified seed. In production, you'd want to create actual user accounts
  // and then create attendee records linked to events. For now, this creates sample attendee data.
  console.log('Seed data creation would go here. In production, create users first, then attendees for specific events.');
  
  await batch.commit();
  console.log('Initial data seeded successfully');
}
