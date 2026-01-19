import { NextResponse } from 'next/server';
import { stripe, createCheckoutSession } from '@/lib/stripe';
import { ticketService, paymentService } from '@/lib/firestore-service';
import { env } from '@/lib/env';
import * as QRCode from 'qrcode';

// Calculate transaction fee (4% of ticket price)
function calculateTransactionFee(amount: number): number {
  return Math.round(amount * 0.04 * 100) / 100; // 4% fee, rounded to 2 decimals
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, userId, ticketType, email } = body;

    if (!eventId || !userId || !ticketType) {
      return NextResponse.json(
        { error: 'eventId, userId, and ticketType are required' },
        { status: 400 }
      );
    }

    // Define ticket prices (in dollars)
    const ticketPrices: Record<string, number> = {
      general: 99,
      vip: 299,
      student: 49,
    };

    const basePrice = ticketPrices[ticketType] || ticketPrices.general;
    const transactionFee = calculateTransactionFee(basePrice);
    const totalAmount = basePrice + transactionFee;

    // Create Stripe price for this ticket (one-time payment)
    // In production, you'd have pre-configured prices in Stripe
    // For now, we'll create a checkout session with the amount
    const baseUrl = env.app.url;
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/ticketing`;

    // Create payment intent directly for ticket purchase
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        eventId,
        ticketType,
        basePrice: basePrice.toString(),
        transactionFee: transactionFee.toString(),
      },
    });

    // Generate QR code for the ticket (will be finalized after payment)
    const ticketId = `ticket_${Date.now()}_${userId}`;
    const qrCodeData = JSON.stringify({
      ticketId,
      eventId,
      userId,
      ticketType,
    });

    const qrCode = await QRCode.toDataURL(qrCodeData);

    // Create ticket record (pending status)
    await ticketService.createTicket({
      eventId,
      userId,
      ticketType: ticketType as 'general' | 'vip' | 'student',
      price: totalAmount,
      qrCode,
      status: 'pending',
      paymentId: paymentIntent.id,
    });

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      ticketId,
    });
  } catch (error) {
    console.error('Error processing ticket purchase:', error);
    return NextResponse.json(
      { error: 'Failed to process ticket purchase', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
