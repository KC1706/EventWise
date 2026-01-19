'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, ExternalLink } from 'lucide-react';
import type { Sponsor } from '@/lib/firestore-types';

interface SponsorCardProps {
  sponsor: Sponsor;
}

export function SponsorCard({ sponsor }: SponsorCardProps) {
  const tierColors = {
    gold: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    silver: 'bg-gray-400/20 text-gray-700 dark:text-gray-400',
    bronze: 'bg-amber-600/20 text-amber-700 dark:text-amber-400',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={sponsor.logoUrl} alt={sponsor.name} />
            <AvatarFallback>{sponsor.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle>{sponsor.name}</CardTitle>
            <Badge className={tierColors[sponsor.tier]}>{sponsor.tier}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sponsor.website && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Globe className="h-4 w-4" />
            <a
              href={sponsor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {sponsor.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </CardContent>
      {sponsor.website && (
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
              Visit Website
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
