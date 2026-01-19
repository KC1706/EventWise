'use client';

import { useEffect, useState } from 'react';
import { subscribeToLeaderboard, subscribeToSessions, subscribeToAttendees, subscribeToEvent } from '@/lib/realtime';
import type { Unsubscribe } from 'firebase/firestore';

export function useRealtimeLeaderboard(eventId: string, limit: number = 10) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = subscribeToLeaderboard(eventId, (entries) => {
      setData(entries);
      setLoading(false);
    }, limit);

    return () => unsubscribe();
  }, [eventId, limit]);

  return { data, loading };
}

export function useRealtimeSessions(eventId: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = subscribeToSessions(eventId, (sessions) => {
      setData(sessions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  return { data, loading };
}

export function useRealtimeAttendees(eventId: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = subscribeToAttendees(eventId, (attendees) => {
      setData(attendees);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  return { data, loading };
}

export function useRealtimeEvent(eventId: string) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = subscribeToEvent(eventId, (event) => {
      setData(event);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  return { data, loading };
}
