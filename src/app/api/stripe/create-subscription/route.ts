import { NextResponse } from 'next/server';
import { createSubscriptionCheckoutSession } from '@/lib/stripe';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceId, userId, email } = body;

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'priceId and userId are required' },
        { status: 400 }
      );
    }

    const baseUrl = env.app.url;
    const successUrl = `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/subscription/cancel`;

    const session = await createSubscriptionCheckoutSession({
      priceId,
      userId,
      successUrl,
      cancelUrl,
      metadata: { email },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
