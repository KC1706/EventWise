'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SponsorCard } from '@/components/sponsor/sponsor-card';
import { useAuth } from '@/components/auth/auth-provider';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SponsorsPage() {
  const { user } = useAuth();
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // In a real app, you'd get eventId from URL params or context
  const eventId = 'current-event-id'; // This would come from route params

  useEffect(() => {
    if (user && eventId) {
      fetchSponsors();
    }
  }, [user, eventId]);

  async function fetchSponsors() {
    try {
      const response = await fetch(`/api/sponsors?eventId=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setSponsors(data);
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading sponsors...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sponsors</h1>
          <p className="text-muted-foreground">
            Manage sponsors for your event
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Sponsor
        </Button>
      </div>

      {sponsors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No sponsors yet. Add your first sponsor to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((sponsor) => (
            <SponsorCard key={sponsor.id} sponsor={sponsor} />
          ))}
        </div>
      )}
    </div>
  );
}
