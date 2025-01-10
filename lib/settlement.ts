import { Player } from './sessionStore';

export interface Transaction {
  from: string;
  to: string;
  amount: number;
  toName: string;
  isRequest?: boolean;
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculateSettlements(players: Player[], marginOfError: number = 0): Transaction[] {
  if (players.length < 2) return [];

  // Calculate balances for all players
  const playerBalances = players.map(player => {
    // Calculate base balance
    const baseBalance = roundToTwo((player.finalAmount || 0) - player.buyInAmount);
    
    // Add equal share of margin of error to each player
    const marginShare = roundToTwo(marginOfError / players.length);
    
    return {
      ...player,
      balance: roundToTwo(baseBalance + marginShare)
    };
  });

  console.log('Player balances:', playerBalances.map(p => ({
    name: p.name,
    balance: p.balance,
    venmoHandle: p.venmoHandle
  })));

  const transactions: Transaction[] = [];

  // First process players who lost money
  for (const player of playerBalances) {
    if (!player.venmoHandle) continue;
    const balance = player.balance;
    
    // Skip players with zero balance or positive balance
    if (balance >= -0.01) continue;

    // Player lost money - create a request FROM them
    const tx = {
      from: player.venmoHandle,    // FROM the losing player
      to: '',                      // TO whoever clicks
      amount: roundToTwo(Math.abs(balance)),
      toName: `${player.name} owes $${roundToTwo(Math.abs(balance))}`,  // Full message for display
      isRequest: true
    };
    console.log('Created loser transaction:', tx);
    transactions.push(tx);
  }

  // Then process players who won money
  for (const player of playerBalances) {
    if (!player.venmoHandle) continue;
    const balance = player.balance;
    
    // Skip players with zero balance or negative balance
    if (balance <= 0.01) continue;

    // Player won money - create a payment TO them
    const tx = {
      from: '',                    // FROM whoever clicks
      to: player.venmoHandle,      // TO the winning player
      amount: roundToTwo(balance),
      toName: `${player.name} won $${roundToTwo(balance)}`,  // Full message for display
      isRequest: false
    };
    console.log('Created winner transaction:', tx);
    transactions.push(tx);
  }

  console.log('Final transactions:', transactions);
  return transactions;
}

export function validateSettlements(players: Player[], transactions: Transaction[], marginOfError: number = 0): boolean {
  // Calculate total net position (should be equal to margin of error)
  const totalNet = roundToTwo(players.reduce((sum, player) => 
    sum + ((player.finalAmount || 0) - player.buyInAmount), 0)
  );

  // Allow for small floating point differences
  if (Math.abs(totalNet - marginOfError) > 0.01) {
    console.error('Total net amount does not match margin of error:', totalNet, marginOfError);
    return false;
  }

  // Calculate expected balance for each player (including margin share)
  const marginShare = roundToTwo(marginOfError / players.length);

  // Check that each player has a corresponding transaction
  for (const player of players) {
    if (!player.venmoHandle) continue;
    
    const baseBalance = roundToTwo((player.finalAmount || 0) - player.buyInAmount);
    const balance = roundToTwo(baseBalance + marginShare);
    if (Math.abs(balance) <= 0.01) continue;
    
    // Find matching transaction
    const tx = transactions.find(t => {
      if (balance < 0) {
        // For losers, check they have a request transaction FROM them
        return t.from === player.venmoHandle && 
               t.isRequest === true && 
               Math.abs(roundToTwo(t.amount) - Math.abs(balance)) <= 0.01;
      } else {
        // For winners, check they have a payment transaction TO them
        return t.to === player.venmoHandle && 
               t.isRequest === false && 
               Math.abs(roundToTwo(t.amount) - balance) <= 0.01;
      }
    });
    
    if (!tx) {
      console.error('Missing transaction for player:', {
        player: player.name,
        balance,
        transactions
      });
      return false;
    }
  }

  return true;
} 