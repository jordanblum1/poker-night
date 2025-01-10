import { NextResponse } from 'next/server';
import { sessionStore } from '@/lib/sessionStore';

interface RouteParams {
  params: {
    sessionId: string;
    playerIndex: string;
  };
}

interface UpdatePlayerBody {
  buyInAmount?: number;
  finalAmount?: number;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = sessionStore.getSession(params.sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const playerIndex = parseInt(params.playerIndex);
    if (isNaN(playerIndex) || playerIndex < 0 || playerIndex >= session.players.length) {
      return NextResponse.json(
        { error: 'Invalid player index' },
        { status: 400 }
      );
    }

    const body: UpdatePlayerBody = await request.json();
    const player = session.players[playerIndex];

    if (body.buyInAmount !== undefined) {
      player.buyInAmount = body.buyInAmount;
    }

    if (body.finalAmount !== undefined) {
      player.finalAmount = body.finalAmount;
    }

    // Update the session store
    sessionStore.updateSession(params.sessionId, session);

    return NextResponse.json({ player });
  } catch (error) {
    console.error('Failed to update player:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
} 