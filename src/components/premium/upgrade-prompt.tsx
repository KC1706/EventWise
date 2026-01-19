'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getFeatureDescription, type PremiumFeature } from '@/lib/premium-service';

interface UpgradePromptProps {
  feature: PremiumFeature;
  currentUsage?: number;
  limit?: number;
}

export function UpgradePrompt({ feature, currentUsage, limit }: UpgradePromptProps) {
  const description = getFeatureDescription(feature);

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <CardTitle>Premium Feature</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUsage !== undefined && limit !== undefined && (
          <div className="text-sm text-muted-foreground">
            You've used {currentUsage} of {limit === Infinity ? 'unlimited' : limit} {limit === 1 ? 'use' : 'uses'}.
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Upgrade to Premium to unlock this feature</span>
        </div>
        <Button asChild className="w-full">
          <Link href="/premium">Upgrade to Premium</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
