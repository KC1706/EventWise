import { NextResponse } from 'next/server';
import { sponsorService } from '@/lib/firestore-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId query parameter is required' },
        { status: 400 }
      );
    }

    const sponsors = await sponsorService.getSponsorsByEvent(eventId);
    
    // Convert Firestore Timestamps to ISO strings
    const serialized = sponsors.map(sponsor => ({
      ...sponsor,
      createdAt: sponsor.createdAt?.toDate().toISOString(),
      updatedAt: sponsor.updatedAt?.toDate().toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsors', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, name, logoUrl, website, tier, placement, materials } = body;

    if (!eventId || !name || !tier) {
      return NextResponse.json(
        { error: 'eventId, name, and tier are required' },
        { status: 400 }
      );
    }

    const sponsorId = await sponsorService.createSponsor({
      eventId,
      name,
      logoUrl,
      website,
      tier: tier as 'gold' | 'silver' | 'bronze',
      placement: placement || [],
      materials: materials || {},
    });

    return NextResponse.json({ sponsorId }, { status: 201 });
  } catch (error) {
    console.error('Error creating sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to create sponsor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
