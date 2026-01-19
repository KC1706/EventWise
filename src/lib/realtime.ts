'use client';

import { onSnapshot, Unsubscribe, doc } from 'firebase/firestore';
import { collection, query, where, orderBy, limit as limitQuery } from 'firebase/firestore';
import { db } from './firebase';

if (!db) {
  throw new Error('Firestore is not initialized');
}

// Real-time listener for leaderboard
export function subscribeToLeaderboard(
  eventId: string,
  callback: (entries: any[]) => void,
  limitCount: number = 10
): Unsubscribe {
  const q = query(
    collection(db, 'leaderboards'),
    where('eventId', '==', eventId),
    orderBy('points', 'desc'),
    limitQuery(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(entries);
  });
}

// Real-time listener for event sessions
export function subscribeToSessions(
  eventId: string,
  callback: (sessions: any[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'sessions'),
    where('eventId', '==', eventId),
    orderBy('startTime', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(sessions);
  });
}

// Real-time listener for attendees
export function subscribeToAttendees(
  eventId: string,
  callback: (attendees: any[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'attendees'),
    where('eventId', '==', eventId)
  );

  return onSnapshot(q, (snapshot) => {
    const attendees = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(attendees);
  });
}

// Real-time listener for event updates
export function subscribeToEvent(
  eventId: string,
  callback: (event: any) => void
): Unsubscribe {
  const eventRef = doc(db, 'events', eventId);

  return onSnapshot(eventRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback({ id: docSnapshot.id, ...docSnapshot.data() });
    } else {
      callback(null);
    }
  });
}
