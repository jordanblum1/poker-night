import { NextResponse } from 'next/server';
import { sessionStore } from '@/lib/sessionStore';

interface RouteParams {
  params: {
    sessionId: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = sessionStore.getSession(params.sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// We'll implement PATCH and DELETE if needed later 