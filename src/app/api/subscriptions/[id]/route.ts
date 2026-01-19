import { NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/firestore-service';
import { stripe } from '@/lib/stripe';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const subscription = await subscriptionService.getSubscription(params.id);
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Convert Firestore Timestamps to ISO strings
    const serialized = {
      ...subscription,
      currentPeriodStart: subscription.currentPeriodStart?.toDate().toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd?.toDate().toISOString(),
      createdAt: subscription.createdAt?.toDate().toISOString(),
      updatedAt: subscription.updatedAt?.toDate().toISOString(),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, newPlan } = body;

    const subscription = await subscriptionService.getSubscription(params.id);
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'cancel': {
        // Cancel subscription at period end
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        
        await subscriptionService.updateSubscription(params.id, {
          cancelAtPeriodEnd: true,
        });
        break;
      }

      case 'resume': {
        // Resume canceled subscription
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
        
        await subscriptionService.updateSubscription(params.id, {
          cancelAtPeriodEnd: false,
        });
        break;
      }

      case 'upgrade':
      case 'downgrade': {
        if (!newPlan) {
          return NextResponse.json(
            { error: 'newPlan is required for upgrade/downgrade' },
            { status: 400 }
          );
        }

        // Get the new price ID based on plan
        // In production, these would be stored in environment or database
        const planPriceIds: Record<string, string> = {
          starter: process.env.STRIPE_STARTER_PRICE_ID || '',
          professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || '',
          enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
        };

        const newPriceId = planPriceIds[newPlan];
        if (!newPriceId) {
          return NextResponse.json(
            { error: 'Invalid plan specified' },
            { status: 400 }
          );
        }

        // Update subscription in Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          }],
          proration_behavior: 'always_invoice',
        });

        // Update in Firestore
        await subscriptionService.updateSubscription(params.id, {
          plan: newPlan as 'starter' | 'professional' | 'enterprise',
        });

        // Update user subscription status
        const { userService } = await import('@/lib/firestore-service');
        await userService.updateUser(subscription.userId, {
          subscriptionStatus: newPlan as any,
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: cancel, resume, upgrade, or downgrade' },
          { status: 400 }
        );
    }

    return NextResponse.json({ message: 'Subscription updated successfully' });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
