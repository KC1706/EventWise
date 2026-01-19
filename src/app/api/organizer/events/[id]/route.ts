import { NextResponse } from 'next/server';
import { eventService } from '@/lib/firestore-service';
import { Timestamp } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const event = await eventService.getEvent(params.id);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Convert Firestore Timestamps to ISO strings
    const serialized = {
      ...event,
      startDate: event.startDate?.toDate().toISOString(),
      endDate: event.endDate?.toDate().toISOString(),
      createdAt: event.createdAt?.toDate().toISOString(),
      updatedAt: event.updatedAt?.toDate().toISOString(),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event', details: error instanceof Error ? error.message : 'Unknown error' },
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
    const updateData: any = {};

    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.startDate) updateData.startDate = Timestamp.fromDate(new Date(body.startDate));
    if (body.endDate) updateData.endDate = Timestamp.fromDate(new Date(body.endDate));
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.venueMapUrl !== undefined) updateData.venueMapUrl = body.venueMapUrl;
    if (body.branding) updateData.branding = body.branding;
    if (body.settings) updateData.settings = body.settings;

    await eventService.updateEvent(params.id, updateData);

    return NextResponse.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await eventService.deleteEvent(params.id);
    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
