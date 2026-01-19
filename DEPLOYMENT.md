# EventWise Deployment Guide

## Prerequisites

- Node.js 20+
- Firebase account
- Stripe account
- Google AI API key
- Vercel account (for hosting)

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google AI
GOOGLE_AI_API_KEY=your_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## Firebase Setup

1. Create a Firebase project
2. Enable Firestore Database
3. Enable Authentication (Email/Password, Google)
4. Set up Firestore security rules
5. Create composite indexes for queries

## Stripe Setup

1. Create Stripe account
2. Create products and prices for:
   - Subscription plans (Starter, Professional, Enterprise)
   - Premium attendee subscription
3. Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`
4. Configure webhook to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

## Post-Deployment Checklist

- [ ] Verify Firebase connection
- [ ] Test authentication flows
- [ ] Test payment processing
- [ ] Verify webhook endpoint
- [ ] Set up monitoring
- [ ] Configure custom domain
- [ ] Enable SSL
