import { NextResponse } from 'next/server';
import { eventService, attendeeService, sessionService } from '@/lib/firestore-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const organizerId = searchParams.get('organizerId');

    if (!eventId && !organizerId) {
      return NextResponse.json(
        { error: 'eventId or organizerId query parameter is required' },
        { status: 400 }
      );
    }

    let events;
    if (eventId) {
      const event = await eventService.getEvent(eventId);
      events = event ? [event] : [];
    } else {
      events = await eventService.getEventsByOrganizer(organizerId!);
    }

    // Aggregate analytics across all events
    let totalAttendees = 0;
    let totalSessions = 0;
    let totalRatings = 0;
    let totalRatingSum = 0;
    const interestCounts: Record<string, number> = {};
    const sessionRatings: Record<string, { sum: number; count: number }> = {};

    for (const event of events) {
      const attendees = await attendeeService.getAttendeesByEvent(event.id);
      totalAttendees += attendees.length;

      const sessions = await sessionService.getSessionsByEvent(event.id);
      totalSessions += sessions.length;

      // Calculate engagement metrics
      for (const attendee of attendees) {
        // Count interests
        for (const interest of attendee.interests) {
          interestCounts[interest] = (interestCounts[interest] || 0) + 1;
        }
      }

      // In a real implementation, you'd have a ratings collection
      // For now, we'll use placeholder data
    }

    // Calculate engagement rate (simplified)
    const engagementRate = totalAttendees > 0 
      ? Math.round((totalAttendees / (totalAttendees + 100)) * 100) // Placeholder calculation
      : 0;

    // Format interest distribution
    const interestDistribution = Object.entries(interestCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Calculate average session rating (placeholder)
    const averageRating = totalRatings > 0 ? totalRatingSum / totalRatings : 4.6;

    return NextResponse.json({
      totalAttendees,
      engagementRate,
      averageSessionRating: averageRating,
      totalSessions,
      sessionsRated: totalRatings,
      interestDistribution,
      sessionRatings: Object.entries(sessionRatings).map(([name, data]) => ({
        name,
        rating: data.count > 0 ? data.sum / data.count : 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
