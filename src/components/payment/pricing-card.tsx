'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { CheckoutButton } from './checkout-button';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  name: string;
  price: string;
  priceDescription?: string;
  features: string[];
  priceId: string;
  isFeatured?: boolean;
  cta: string;
  type?: 'payment' | 'subscription';
}

export function PricingCard({
  name,
  price,
  priceDescription,
  features,
  priceId,
  isFeatured = false,
  cta,
  type = 'payment',
}: PricingCardProps) {
  return (
    <Card className={cn('flex flex-col h-full', isFeatured && 'border-primary shadow-lg relative')}>
      {isFeatured && (
        <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
          <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </div>
        </div>
      )}
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <div className="flex items-baseline gap-2 pt-2">
          <span className="text-4xl font-bold">{price}</span>
          {priceDescription && (
            <span className="text-muted-foreground">{priceDescription}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <CheckoutButton priceId={priceId} type={type} className="w-full" variant={isFeatured ? 'default' : 'outline'}>
          {cta}
        </CheckoutButton>
      </CardFooter>
    </Card>
  );
}
