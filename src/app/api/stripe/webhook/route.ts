import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { headers } from 'next/headers';
import { paymentService, subscriptionService, ticketService } from '@/lib/firestore-service';
import { userService } from '@/lib/firestore-service';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature || !env.stripe.webhookSecret) {
    return NextResponse.json(
      { error: 'Missing stripe signature or webhook secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.stripe.webhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const email = session.customer_email || session.metadata?.email;

        if (!userId) {
          console.error('No userId in session metadata');
          break;
        }

        if (session.mode === 'subscription') {
          // Handle subscription creation
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          await subscriptionService.createSubscription({
            userId,
            plan: subscription.items.data[0].price.metadata?.plan as 'starter' | 'professional' | 'enterprise' || 'starter',
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: subscription.customer as string,
            status: subscription.status === 'active' ? 'active' : 'trialing',
            currentPeriodStart: subscription.current_period_start ? 
              { seconds: subscription.current_period_start } as any : 
              { seconds: Date.now() / 1000 } as any,
            currentPeriodEnd: subscription.current_period_end ? 
              { seconds: subscription.current_period_end } as any : 
              { seconds: Date.now() / 1000 } as any,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });

          // Update user subscription status
          const user = await userService.getUser(userId);
          if (user) {
            const plan = subscription.items.data[0].price.metadata?.plan || 'starter';
            await userService.updateUser(userId, {
              subscriptionStatus: plan as any,
              stripeCustomerId: subscription.customer as string,
            });
          }
        } else {
          // Handle one-time payment (ticket purchase)
          const amount = session.amount_total ? session.amount_total / 100 : 0;
          
          await paymentService.createPayment({
            userId,
            eventId: session.metadata?.eventId,
            type: 'ticket',
            amount,
            currency: session.currency || 'usd',
            status: 'succeeded',
            stripePaymentIntentId: session.payment_intent as string,
          });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Payment succeeded - already handled in checkout.session.completed
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata?.userId;
        
        if (userId) {
          await paymentService.createPayment({
            userId,
            eventId: paymentIntent.metadata?.eventId,
            type: 'ticket',
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: 'failed',
            stripePaymentIntentId: paymentIntent.id,
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          const existing = await subscriptionService.getSubscriptionByUser(userId);
          if (existing) {
            await subscriptionService.updateSubscription(existing.id, {
              status: subscription.status === 'active' ? 'active' : 
                      subscription.status === 'canceled' ? 'canceled' : 
                      subscription.status === 'past_due' ? 'past_due' : 'trialing',
              currentPeriodStart: subscription.current_period_start ? 
                { seconds: subscription.current_period_start } as any : undefined,
              currentPeriodEnd: subscription.current_period_end ? 
                { seconds: subscription.current_period_end } as any : undefined,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            });

            // Update user subscription status
            if (subscription.status === 'canceled' || subscription.status === 'past_due') {
              await userService.updateUser(userId, {
                subscriptionStatus: 'free',
              });
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
