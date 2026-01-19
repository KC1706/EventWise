import { NextResponse } from 'next/server';
import { subscriptionService, userService } from '@/lib/firestore-service';
import { useAuth } from '@/components/auth/auth-provider';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const subscription = await subscriptionService.getSubscriptionByUser(userId);
    
    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    // Convert Firestore Timestamps to ISO strings
    const serialized = {
      ...subscription,
      currentPeriodStart: subscription.currentPeriodStart?.toDate().toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd?.toDate().toISOString(),
      createdAt: subscription.createdAt?.toDate().toISOString(),
      updatedAt: subscription.updatedAt?.toDate().toISOString(),
    };

    return NextResponse.json({ subscription: serialized });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, plan, stripeSubscriptionId, stripeCustomerId } = body;

    if (!userId || !plan || !stripeSubscriptionId || !stripeCustomerId) {
      return NextResponse.json(
        { error: 'userId, plan, stripeSubscriptionId, and stripeCustomerId are required' },
        { status: 400 }
      );
    }

    // This is typically called from the webhook, but can be used for manual creation
    const subscriptionId = await subscriptionService.createSubscription({
      userId,
      plan: plan as 'starter' | 'professional' | 'enterprise',
      stripeSubscriptionId,
      stripeCustomerId,
      status: 'active',
      currentPeriodStart: { seconds: Date.now() / 1000 } as any,
      currentPeriodEnd: { seconds: Date.now() / 1000 + 30 * 24 * 60 * 60 } as any, // 30 days from now
      cancelAtPeriodEnd: false,
    });

    // Update user subscription status
    await userService.updateUser(userId, {
      subscriptionStatus: plan as any,
      stripeCustomerId,
    });

    return NextResponse.json({ subscriptionId }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
