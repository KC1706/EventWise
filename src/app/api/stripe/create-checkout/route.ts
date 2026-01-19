import { NextResponse } from 'next/server';
import { stripe, createCheckoutSession } from '@/lib/stripe';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceId, userId, email, type = 'payment' } = body;

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'priceId and userId are required' },
        { status: 400 }
      );
    }

    const baseUrl = env.app.url;
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment/cancel`;

    let session;
    if (type === 'subscription') {
      const { createSubscriptionCheckoutSession } = await import('@/lib/stripe');
      session = await createSubscriptionCheckoutSession({
        priceId,
        userId,
        successUrl,
        cancelUrl,
        metadata: { email },
      });
    } else {
      session = await createCheckoutSession({
        priceId,
        userId,
        successUrl,
        cancelUrl,
        metadata: { email },
      });
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
