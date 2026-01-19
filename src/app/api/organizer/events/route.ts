import { NextResponse } from 'next/server';
import { eventService } from '@/lib/firestore-service';
import { canCreateEvent } from '@/lib/subscription-service';
import { Timestamp } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get('organizerId');

    if (!organizerId) {
      return NextResponse.json(
        { error: 'organizerId query parameter is required' },
        { status: 400 }
      );
    }

    const events = await eventService.getEventsByOrganizer(organizerId);
    
    // Convert Firestore Timestamps to ISO strings
    const serialized = events.map(event => ({
      ...event,
      startDate: event.startDate?.toDate().toISOString(),
      endDate: event.endDate?.toDate().toISOString(),
      createdAt: event.createdAt?.toDate().toISOString(),
      updatedAt: event.updatedAt?.toDate().toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      organizerId,
      title,
      description,
      startDate,
      endDate,
      venue,
      venueMapUrl,
      branding,
      settings,
    } = body;

    if (!organizerId || !title || !description || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'organizerId, title, description, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Check if organizer can create more events
    const events = await eventService.getEventsByOrganizer(organizerId);
    const canCreate = await canCreateEvent(organizerId, events.length);
    
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Event creation limit reached. Please upgrade your subscription.' },
        { status: 403 }
      );
    }

    const eventId = await eventService.createEvent({
      organizerId,
      title,
      description,
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: Timestamp.fromDate(new Date(endDate)),
      venue,
      venueMapUrl,
      branding: branding || {},
      settings: settings || {
        allowPublicRegistration: true,
        requireApproval: false,
      },
    });

    return NextResponse.json({ eventId }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
