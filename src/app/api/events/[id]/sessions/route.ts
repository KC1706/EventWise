import { NextResponse } from 'next/server';
import { sessionService } from '@/lib/firestore-service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessions = await sessionService.getSessionsByEvent(params.id);
    
    // Convert Firestore Timestamps to ISO strings
    const serialized = sessions.map(session => ({
      ...session,
      startTime: session.startTime?.toDate().toISOString(),
      endTime: session.endTime?.toDate().toISOString(),
      createdAt: session.createdAt?.toDate().toISOString(),
      updatedAt: session.updatedAt?.toDate().toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
