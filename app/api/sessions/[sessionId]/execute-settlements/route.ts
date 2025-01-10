import { NextResponse } from 'next/server';
import { sessionStore } from '@/lib/sessionStore';
import { Transaction } from '@/lib/settlement';
import { generateVenmoLink, generateVenmoWebLink, formatPaymentNote } from '@/lib/payments';

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
    const transaction: Transaction = body.transaction;

    // The transaction already contains Venmo handles in from/to fields
    // and display names in fromName/toName fields
    const hostVenmoHandle = session.players[0].venmoHandle;

    if (!transaction.from || !transaction.to || !hostVenmoHandle) {
      return NextResponse.json(
        { error: 'Missing Venmo handles' },
        { status: 400 }
      );
    }

    // If the host is the 'from' player, it's a payment to a winner
    // If the host is NOT the 'from' player, it's a request from a loser
    const isHostPaying = transaction.from === hostVenmoHandle;
    const targetHandle = isHostPaying ? transaction.to : transaction.from;
    const isRequest = !isHostPaying;

    const note = formatPaymentNote(transaction.toName);
    
    const deepLink = generateVenmoLink(
      targetHandle,
      transaction.amount,
      note,
      isRequest
    );

    const webLink = generateVenmoWebLink(
      targetHandle,
      transaction.amount,
      note,
      isRequest
    );

    return NextResponse.json({
      transaction,
      venmoLinks: {
        deepLink,
        webLink,
        isRequest
      }
    });
  } catch (error) {
    console.error('Failed to generate Venmo link:', error);
    return NextResponse.json(
      { error: 'Failed to generate Venmo link' },
      { status: 500 }
    );
  }
} 