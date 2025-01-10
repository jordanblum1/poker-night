import { NextResponse } from 'next/server';
import { sessionStore } from '@/lib/sessionStore';
import { calculateSettlements, validateSettlements } from '@/lib/settlement';

interface RouteParams {
  params: {
    sessionId: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = sessionStore.getSession(params.sessionId);
    const { marginOfError } = await request.json();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if all players have submitted their final amounts
    const allSubmitted = !session.players.some(p => p.status === 'pending');
    if (!allSubmitted) {
      return NextResponse.json(
        { error: 'Not all players have submitted their final amounts' },
        { status: 400 }
      );
    }

    // Ensure host has a Venmo handle
    if (!session.players[0]?.venmoHandle) {
      return NextResponse.json(
        { error: 'Host must have a Venmo handle' },
        { status: 400 }
      );
    }

    // Calculate settlements with margin of error
    const transactions = calculateSettlements(session.players, marginOfError);
    console.log('Calculated transactions:', transactions);

    // Validate the settlements
    if (!validateSettlements(session.players, transactions, marginOfError)) {
      return NextResponse.json(
        { error: 'Settlement calculation failed validation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Failed to calculate settlements:', error);
    return NextResponse.json(
      { error: 'Failed to calculate settlements' },
      { status: 500 }
    );
  }
} 