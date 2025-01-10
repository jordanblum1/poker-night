"use client";

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Card, Stack, Divider, Alert } from '@mui/joy';
import { useParams, useRouter } from 'next/navigation';
import { Session, Player } from '@/lib/sessionStore';
import { Transaction } from '@/lib/settlement';
import toast from 'react-hot-toast';

interface VenmoLinks {
  deepLink: string;
  webLink: string;
  isRequest: boolean;
}

interface TransactionWithLinks extends Transaction {
  venmoLinks?: VenmoLinks;
  status?: 'pending' | 'completed' | 'error';
  error?: string;
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export default function SessionManagement() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session>();
  const [isSettling, setIsSettling] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string>();
  const [settlements, setSettlements] = useState<Transaction[]>();
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [transactionStatuses, setTransactionStatuses] = useState<TransactionWithLinks[]>([]);
  const [transactionConfirmed, setTransactionConfirmed] = useState<Set<number>>(new Set());
  const [marginOfError, setMarginOfError] = useState<number>(0);
  const [editingPlayer, setEditingPlayer] = useState<{index: number, buyIn: number, final: number} | null>(null);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error('Failed to load session');
        const data = await res.json();
        setSession(data);
      } catch (err) {
        setError('Failed to load session');
        toast.error('Failed to load session data');
      }
    };

    fetchSession();
    // Refresh every 5 seconds
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);
  
  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${sessionId}`;
    navigator.clipboard.writeText(link)
      .then(() => toast.success('Invite link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy invite link'));
  };

  const handleSettleUp = async () => {
    setIsSettling(true);
    setError(undefined);
    const toastId = toast.loading('Calculating settlements...');
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marginOfError
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to calculate settlements');
      }

      const { transactions } = await response.json();
      console.log('Settlement response:', {
        transactions,
        hostVenmoHandle: session?.players[0]?.venmoHandle
      });
      
      setSettlements(transactions);
      setTransactionStatuses(transactions.map((tx: Transaction) => ({ ...tx })));
      toast.success('Settlements calculated successfully!', { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to settle up';
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsSettling(false);
    }
  };

  const handleExecuteTransaction = async (index: number) => {
    const tx = settlements?.[index];
    if (!tx) return;

    const toastId = toast.loading(`Opening Venmo...`);
    setSelectedTransactions(new Set([index]));
    setIsExecuting(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/execute-settlements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: tx,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Venmo link');
      }

      const { venmoLinks } = await response.json();
      
      // Try to open the deep link first
      window.location.href = venmoLinks.deepLink;
      
      // After a short delay, check if the deep link worked
      // If not, open the web link in a new tab
      setTimeout(() => {
        if (document.hidden) {
          // Venmo app opened successfully
          toast.success('Opened in Venmo app', { id: toastId });
        } else {
          // Fallback to web link
          window.open(venmoLinks.webLink, '_blank');
          toast.success('Opened Venmo in browser', { id: toastId });
        }
      }, 1000);

      // Update transaction status to pending
      const newStatuses = [...transactionStatuses];
      newStatuses[index] = { ...tx, status: 'pending', venmoLinks };
      setTransactionStatuses(newStatuses);
    } catch (err) {
      const newStatuses = [...transactionStatuses];
      newStatuses[index] = { 
        ...tx, 
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to open Venmo'
      };
      setTransactionStatuses(newStatuses);
      toast.error('Failed to open Venmo', { id: toastId });
    } finally {
      setIsExecuting(false);
      setSelectedTransactions(new Set());
    }
  };

  const handleConfirmTransaction = (index: number) => {
    const tx = settlements?.[index];
    if (!tx) return;

    setTransactionConfirmed(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });

    const newStatuses = [...transactionStatuses];
    newStatuses[index] = { ...tx, status: 'completed' };
    setTransactionStatuses(newStatuses);
    toast.success('Transaction marked as completed');
  };

  const handleEditPlayer = (index: number) => {
    const player = session?.players[index];
    if (!player) return;

    setEditingPlayer({
      index,
      buyIn: player.buyInAmount,
      final: player.finalAmount || player.buyInAmount
    });
  };

  const handleSavePlayerEdit = async () => {
    if (!editingPlayer || !session) return;

    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/players/${editingPlayer.index}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            buyInAmount: editingPlayer.buyIn,
            finalAmount: editingPlayer.final
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update player');
      }

      // Clear any existing settlements since they're now invalid
      setSettlements(undefined);
      setTransactionStatuses([]);
      toast.success('Player amounts updated successfully');
    } catch (err) {
      toast.error('Failed to update player amounts');
    } finally {
      setEditingPlayer(null);
    }
  };

  // Calculate totals for both submitted and all players
  const liveTotal = {
    buyIn: session?.players.reduce((sum, p) => sum + p.buyInAmount, 0) || 0,
    current: session?.players.reduce((sum, p) => sum + (p.finalAmount || p.buyInAmount), 0) || 0,
    submitted: session?.players.filter(p => p.status === 'submitted').length || 0,
    total: session?.players.length || 0
  };

  if (!session) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography level="h1" mb={3}>Session Management</Typography>
        <Alert color="warning">Loading session data...</Alert>
      </Box>
    );
  }

  const allPlayersSubmitted = !session.players.some(p => p.status === 'pending');
  const showSettlements = settlements && settlements.length > 0;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography level="h1" mb={3}>Session Management</Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <Stack spacing={2}>
          <Typography level="h3">Invite Players</Typography>
          <Typography>Share this link with your players:</Typography>
          <Button 
            variant="outlined" 
            onClick={copyInviteLink}
          >
            Copy Invite Link
          </Button>
        </Stack>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography level="h3">Players</Typography>
            <Card
              variant="soft"
              color={liveTotal.submitted === liveTotal.total ? "success" : "neutral"}
              sx={{ p: 1 }}
            >
              <Stack spacing={0.5}>
                <Typography level="body-sm">
                  Running Total ({liveTotal.submitted}/{liveTotal.total} submitted)
                </Typography>
                <Typography level="body-sm">
                  Buy-in: <strong>${roundToTwo(liveTotal.buyIn)}</strong>
                </Typography>
                <Typography level="body-sm">
                  Current: <strong>${roundToTwo(liveTotal.current)}</strong>
                </Typography>
              </Stack>
            </Card>
          </Stack>
          <Divider />
          {session.players.length === 0 ? (
            <Typography level="body-lg" sx={{ textAlign: 'center', py: 2 }}>
              No players have joined yet. Share the invite link to get started!
            </Typography>
          ) : (
            session.players.map((player, index) => (
              <Box key={index}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack spacing={1}>
                    <Typography level="body-lg">{player.name}</Typography>
                    <Typography level="body-sm">
                      Buy-in: ${player.buyInAmount} | Final: ${player.finalAmount || 'Not submitted'}
                    </Typography>
                    {player.venmoHandle && (
                      <Typography level="body-sm" sx={{ color: 'neutral.500' }}>
                        {player.venmoHandle}
                      </Typography>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      variant="plain"
                      color="neutral"
                      size="sm"
                      onClick={() => handleEditPlayer(index)}
                    >
                      Edit
                    </Button>
                    <Typography
                      sx={{
                        color: player.status === 'submitted' ? 'success.main' : 'warning.main'
                      }}
                    >
                      {player.status === 'submitted' ? 'Submitted' : 'Pending'}
                    </Typography>
                  </Stack>
                </Stack>
                {index < session.players.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))
          )}
        </Stack>
      </Card>

      {editingPlayer !== null && (
        <Card
          variant="outlined"
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '400px',
            p: 3,
            zIndex: 1000,
            boxShadow: 'lg',
          }}
        >
          <Stack spacing={2}>
            <Typography level="h4">Edit Player Amounts</Typography>
            <Stack spacing={1}>
              <Typography level="body-sm">Buy-in Amount:</Typography>
              <input
                type="number"
                step="0.25"
                value={editingPlayer.buyIn}
                onChange={(e) => setEditingPlayer({
                  ...editingPlayer,
                  buyIn: Number(e.target.value)
                })}
                style={{
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  width: '100%'
                }}
              />
            </Stack>
            <Stack spacing={1}>
              <Typography level="body-sm">Final Amount:</Typography>
              <input
                type="number"
                step="0.25"
                value={editingPlayer.final}
                onChange={(e) => setEditingPlayer({
                  ...editingPlayer,
                  final: Number(e.target.value)
                })}
                style={{
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  width: '100%'
                }}
              />
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="soft"
                color="neutral"
                onClick={() => setEditingPlayer(null)}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                color="primary"
                onClick={handleSavePlayerEdit}
              >
                Save
              </Button>
            </Stack>
          </Stack>
        </Card>
      )}

      {editingPlayer !== null && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          onClick={() => setEditingPlayer(null)}
        />
      )}

      {error && (
        <Alert color="danger" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {session.players.length > 0 && (
        <Button
          fullWidth
          onClick={handleSettleUp}
          loading={isSettling}
          disabled={!allPlayersSubmitted}
          sx={{ mb: 3 }}
        >
          Calculate Settlements
        </Button>
      )}

      {showSettlements && (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <Stack spacing={2}>
              <Typography level="h3">Round Summary</Typography>
              <Stack spacing={1}>
                <Typography>
                  Total Buy In: <strong>${roundToTwo(liveTotal.buyIn)}</strong>
                </Typography>
                <Typography>
                  Total After Match: <strong>${roundToTwo(liveTotal.current)}</strong>
                </Typography>
                <Typography color={liveTotal.current - liveTotal.buyIn === 0 ? "success" : "danger"}>
                  Difference: <strong>${liveTotal.current - liveTotal.buyIn}</strong>
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Typography level="body-sm">
                    If the total is off due to lost chips, enter the amount to distribute evenly:
                  </Typography>
                  <input
                    type="number"
                    step="0.25"
                    value={marginOfError}
                    onChange={(e) => setMarginOfError(Number(e.target.value))}
                    style={{
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      width: '100px'
                    }}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Card>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <Stack spacing={2}>
              <Typography level="h3">Settlements</Typography>
              <Typography level="body-sm">
                Click the Venmo buttons to request money from players who lost or pay players who won.
                After each transaction is complete, click "Confirm" to mark it as done:
              </Typography>
              <Divider />
              {settlements.map((tx, index) => {
                const status = transactionStatuses[index]?.status;
                const player = session.players.find(p => p.venmoHandle === (tx.isRequest ? tx.from : tx.to));
                if (!player) return null;
                
                const balance = (player.finalAmount || 0) - player.buyInAmount;
                const isLoss = balance < 0;

                return (
                  <Box key={index}>
                    <Stack spacing={1}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Stack spacing={0.5}>
                          <Typography level="body-lg">
                            {isLoss ? `${player.name} owes $${tx.amount}` : `${player.name} won $${tx.amount}`}
                          </Typography>
                          {status === 'pending' && (
                            <Typography level="body-sm" color="warning">
                              ⏳ Waiting for confirmation
                            </Typography>
                          )}
                          {status === 'completed' && (
                            <Typography level="body-sm" color="success">
                              ✓ Transaction completed
                            </Typography>
                          )}
                          {status === 'error' && (
                            <Typography level="body-sm" color="danger">
                              ✗ {transactionStatuses[index].error || 'Transaction failed'}
                            </Typography>
                          )}
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          {status === 'pending' && (
                            <Button
                              variant="soft"
                              color="success"
                              onClick={() => handleConfirmTransaction(index)}
                            >
                              Confirm
                            </Button>
                          )}
                          <Button
                            variant="soft"
                            color={isLoss ? "warning" : "success"}
                            onClick={() => handleExecuteTransaction(index)}
                            loading={isExecuting && selectedTransactions.has(index)}
                            disabled={status === 'completed'}
                            endDecorator={isLoss ? "Request" : "Pay"}
                          >
                            Venmo
                          </Button>
                        </Stack>
                      </Stack>
                    </Stack>
                    {index < settlements.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                );
              })}
            </Stack>
          </Card>
        </>
      )}
    </Box>
  );
} 