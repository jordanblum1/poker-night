import { NextResponse } from 'next/server';
import { sessionStore } from '@/lib/sessionStore';

interface RouteParams {
  params: {
    sessionId: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = sessionStore.getSession(params.sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.buyInAmount || !body.finalAmount || !body.venmoHandle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if player name is already taken
    if (session.players.some(p => p.name === body.name)) {
      return NextResponse.json(
        { error: 'A player with this name already exists' },
        { status: 400 }
      );
    }

    const player = sessionStore.addPlayer(params.sessionId, {
      name: body.name,
      buyInAmount: Number(body.buyInAmount),
      finalAmount: Number(body.finalAmount),
      venmoHandle: body.venmoHandle,
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Failed to add player' },
        { status: 500 }
      );
    }

    // Update player status to submitted since they provided all info
    const updatedPlayer = sessionStore.updatePlayer(params.sessionId, body.name, {
      status: 'submitted'
    });

    if (!updatedPlayer) {
      return NextResponse.json(
        { error: 'Failed to update player status' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error('Failed to create player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
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

    return NextResponse.json(session.players);
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
} 