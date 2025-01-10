const VENMO_CLIENT_ID = process.env.NEXT_PUBLIC_VENMO_CLIENT_ID!;
const VENMO_CLIENT_SECRET = process.env.VENMO_CLIENT_SECRET!;
const VENMO_REDIRECT_URI = process.env.NEXT_PUBLIC_VENMO_REDIRECT_URI!;
const VENMO_API_BASE = 'https://api.venmo.com/v1';

export interface VenmoAuth {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    display_name: string;
    profile_picture_url: string;
  };
}

export interface VenmoError {
  error: string;
  error_description: string;
}

export function getVenmoAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: VENMO_CLIENT_ID,
    response_type: 'code',
    state, // Used to prevent CSRF and pass sessionId
    scope: 'access_profile make_payments',
    redirect_uri: VENMO_REDIRECT_URI,
  });
  
  return `${VENMO_API_BASE}/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<VenmoAuth> {
  const params = new URLSearchParams({
    code,
    client_id: VENMO_CLIENT_ID,
    client_secret: VENMO_CLIENT_SECRET,
    redirect_uri: VENMO_REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const response = await fetch(`${VENMO_API_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error: VenmoError = await response.json();
    throw new Error(error.error_description || 'Failed to exchange code for token');
  }

  return response.json();
}

export async function refreshVenmoToken(refreshToken: string): Promise<VenmoAuth> {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: VENMO_CLIENT_ID,
    client_secret: VENMO_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  const response = await fetch(`${VENMO_API_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error: VenmoError = await response.json();
    throw new Error(error.error_description || 'Failed to refresh token');
  }

  return response.json();
}

export async function requestVenmoPayment(
  accessToken: string,
  to: string,
  amount: number,
  note: string
): Promise<{ payment_id: string }> {
  const response = await fetch(`${VENMO_API_BASE}/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: to,
      amount: -amount, // Negative amount for payment request
      note,
    }),
  });

  if (!response.ok) {
    const error: VenmoError = await response.json();
    throw new Error(error.error_description || 'Failed to request payment');
  }

  return response.json();
}

export async function getVenmoUserInfo(accessToken: string) {
  const response = await fetch(`${VENMO_API_BASE}/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error: VenmoError = await response.json();
    throw new Error(error.error_description || 'Failed to get user info');
  }

  return response.json();
} 