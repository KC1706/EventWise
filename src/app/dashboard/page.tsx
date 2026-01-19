'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, PieChart, Users, Star } from 'lucide-react';
import { organizerStats } from '@/lib/data';
import DashboardClient from '@/components/dashboard-client';
import { useAuth } from '@/components/auth/auth-provider';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user) return;
      
      try {
        const queryParam = eventId ? `eventId=${eventId}` : `organizerId=${user.uid}`;
        const response = await fetch(`/api/organizer/analytics?${queryParam}`);
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          // Fallback to mock data
          setAnalytics(null);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      fetchAnalytics();
    }
  }, [user, eventId]);

  const stats = analytics || organizerStats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
        <p className="text-muted-foreground">
          Live insights and engagement analytics for your event.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttendees.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analytics ? 'Current event' : '+20.1% from last event'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.engagementRate}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics ? 'Real-time' : '+5.2% in the last hour'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Session Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageSessionRating?.toFixed(1) || '4.6'} / 5.0
              </div>
              <p className="text-xs text-muted-foreground">
                Based on {stats.sessionsRated?.toLocaleString() || '0'} ratings
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <DashboardClient eventId={eventId || undefined} organizerId={user?.uid} />
    </div>
  );
}
