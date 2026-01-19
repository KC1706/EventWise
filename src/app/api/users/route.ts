import { NextResponse } from 'next/server';
import { userService } from '@/lib/firestore-service';

export async function GET() {
  try {
    const users = await userService.getAllUsers();
    
    // Convert Firestore Timestamps to ISO strings
    const serializedUsers = users.map(user => ({
      ...user,
      createdAt: user.createdAt?.toDate().toISOString(),
      updatedAt: user.updatedAt?.toDate().toISOString(),
    }));

    return NextResponse.json(serializedUsers);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { message: 'Error fetching users', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, email, name, ...otherData } = data;

    if (!userId || !email || !name) {
      return NextResponse.json(
        { error: 'userId, email, and name are required' },
        { status: 400 }
      );
    }

    // Create user in Firestore
    await userService.createUser(userId, {
      email,
      name,
      role: 'attendee',
      interests: [],
      ...otherData,
    });

    return NextResponse.json({ message: 'User created successfully', userId }, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { message: 'Error creating user', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
