import Stripe from 'stripe';
import { env } from './env';

if (!env.stripe.secretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

// Initialize Stripe server-side client
export const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Stripe client-side (for browser)
export function getStripeClient() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Dynamically import @stripe/stripe-js only on client
  return import('@stripe/stripe-js').then(({ loadStripe }) => {
    return loadStripe(env.stripe.publishableKey);
  });
}

// Helper to create checkout session
export async function createCheckoutSession(params: {
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer_email: params.metadata?.email,
    metadata: {
      userId: params.userId,
      ...params.metadata,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}

// Helper to create subscription checkout session
export async function createSubscriptionCheckoutSession(params: {
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer_email: params.metadata?.email,
    metadata: {
      userId: params.userId,
      ...params.metadata,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: {
      metadata: {
        userId: params.userId,
        ...params.metadata,
      },
    },
  });

  return session;
}

// Helper to create or retrieve customer
export async function getOrCreateCustomer(userId: string, email: string) {
  // Check if customer exists in metadata
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer
  return stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });
}
