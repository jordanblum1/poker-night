# Poker Night - Project Context

## Project Vision
A web application that streamlines the process of settling poker game finances by automatically calculating and generating Venmo payment links. The system simplifies the settlement process by providing direct Venmo deep links for each required transaction.

## Core Functionality

### Session Creation & Management
- Hosts can create new poker sessions
- System generates shareable links for player participation
- Sessions are temporary (cleaned up after 24 hours)

### Player Flow
1. Players receive unique session link
2. Players submit their:
   - Name
   - Buy-in amount
   - End game amount
   - Venmo handle (@username)

### Settlement Process
1. Host confirms all player information is submitted
2. System automatically calculates settlements:
   - Calculate each player's net position (final amount - buy in)
   - Players with positive net are owed money
   - Players with negative net owe money
   - Minimize number of transactions between players
3. System generates Venmo deep links for each transaction:
   - Links open directly in Venmo app if installed
   - Falls back to Venmo web interface
   - Pre-fills amount and descriptive note
   - Makes it easy for players to execute payments

## Technical Requirements
- Session management
- Settlement calculations
- Venmo deep link generation
- User-friendly interface
- Unique session links
- Real-time status tracking

## Technical Architecture

### Route Structure
- `/` - Landing page with session creation
- `/host/[sessionId]` - Host session management dashboard
- `/join/[sessionId]` - Player entry form
- `/api/sessions/*` - Session management endpoints

### Data Models

#### Session
```typescript
interface Session {
  id: string;
  createdAt: Date;
  status: 'active' | 'pending_settlement' | 'settled';
  players: Player[];
}
```

#### Player
```typescript
interface Player {
  name: string;
  buyInAmount: number;
  finalAmount?: number;
  venmoHandle?: string;
  status: 'pending' | 'submitted';
}
```

#### Venmo Link
```typescript
interface VenmoLink {
  url: string;      // Web fallback URL
  mobileUrl: string; // Deep link URL
  amount: number;
  from: string;
  to: string;
}
```

### Settlement Algorithm
1. Calculate net position for each player
2. Sort players by net amount (descending)
3. Match players who owe money with players who are owed:
   - Start with largest debts/credits
   - Create transactions to settle balances
   - Minimize number of transactions
4. Generate Venmo deep links for each transaction

Example:
```typescript
Players:
A: +100 (won 100) @userA
B: +50  (won 50)  @userB
C: -70  (lost 70) @userC
D: -80  (lost 80) @userD

Calculated Transactions:
1. D → A: $80 (venmo://paycharge?txn=pay&recipients=userA&amount=80)
2. C → A: $20 (venmo://paycharge?txn=pay&recipients=userA&amount=20)
3. C → B: $50 (venmo://paycharge?txn=pay&recipients=userB&amount=50)
```

### Implementation Status

1. Core Infrastructure ✅
   - In-memory session storage
   - Session cleanup mechanism
   - API routes for sessions and players

2. Session Management ✅
   - Session creation
   - Unique link generation
   - Player management

3. Player Management (In Progress)
   - Join session form (needs Venmo handle field)
   - Player information submission
   - Status tracking

4. Settlement System (In Progress)
   - Settlement calculations ✅
   - Venmo deep link generation ✅
   - Settlement UI (TODO)

5. Security & Polish (TODO)
   - Error handling
   - UI/UX improvements
   - Toast notifications

## Next Steps
1. Update player join form to collect Venmo handles
2. Update settlement UI to display and handle Venmo links
3. Add toast notifications for better feedback
4. Polish error handling and UX
5. Add session status indicators 