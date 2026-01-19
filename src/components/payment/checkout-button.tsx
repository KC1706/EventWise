'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';

interface CheckoutButtonProps {
  priceId: string;
  type?: 'payment' | 'subscription';
  children: React.ReactNode;
  className?: string;
}

export function CheckoutButton({ priceId, type = 'payment', children, className }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please sign in to continue.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = type === 'subscription' 
        ? '/api/stripe/create-subscription'
        : '/api/stripe/create-checkout';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          email: userProfile?.email || user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start checkout process.',
      });
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} disabled={isLoading} className={className}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
