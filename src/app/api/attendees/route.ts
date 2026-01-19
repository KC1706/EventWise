import { NextResponse } from 'next/server';
import { attendeeService } from '@/lib/firestore-service';

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

    const attendees = await attendeeService.getAttendeesByEvent(eventId);
    
    // Convert Firestore Timestamps to ISO strings for JSON serialization
    const serializedAttendees = attendees.map(attendee => ({
      ...attendee,
      createdAt: attendee.createdAt?.toDate().toISOString(),
      updatedAt: attendee.updatedAt?.toDate().toISOString(),
    }));

    return NextResponse.json(serializedAttendees);
  } catch (error) {
    console.error('Failed to fetch attendees:', error);
    return NextResponse.json(
      { message: 'Error fetching attendees', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
