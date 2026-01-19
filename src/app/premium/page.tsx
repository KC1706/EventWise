import { PricingCard } from '@/components/payment/pricing-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPremiumFeatures, getFeatureDescription } from '@/lib/premium-service';
import { Check } from 'lucide-react';

export default function PremiumPage() {
  const features = getPremiumFeatures();

  // These would come from your Stripe products
  // For now, using placeholder price IDs
  const premiumPriceId = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || 'price_premium';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upgrade to Premium</h1>
        <p className="text-muted-foreground">
          Unlock advanced features and unlimited access to AI-powered tools
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Premium Features</CardTitle>
            <CardDescription>
              Everything you get with Premium
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-medium">{getFeatureDescription(feature)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <PricingCard
          name="Premium"
          price="$9.99"
          priceDescription="per month"
          features={[
            'Unlimited AI matchmaking',
            'Unlimited AI assistant queries',
            'CRM export (Salesforce, HubSpot)',
            'Calendar sync (Google, Outlook)',
            'Advanced personal analytics',
          ]}
          priceId={premiumPriceId}
          isFeatured={true}
          cta="Subscribe Now"
          type="subscription"
        />
      </div>
    </div>
  );
}
