import { NextResponse } from 'next/server';
import { userService } from '@/lib/firestore-service';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, ...profileData } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Update user profile in Firestore
    await userService.updateUser(userId, {
      name: profileData.name,
      title: profileData.title,
      company: profileData.company,
      interests: profileData.interests || [],
      goals: profileData.goals,
    });

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Failed to process profile update:', error);
    return NextResponse.json(
      { message: 'Error updating profile', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const user = await userService.getUser(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Convert Firestore Timestamps to ISO strings
    const serializedUser = {
      ...user,
      createdAt: user.createdAt?.toDate().toISOString(),
      updatedAt: user.updatedAt?.toDate().toISOString(),
    };

    return NextResponse.json(serializedUser);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json(
      { message: 'Error fetching profile', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
