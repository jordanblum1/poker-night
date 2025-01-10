export interface VenmoLink {
  url: string;
  mobileUrl: string;
  amount: number;
  from: string;
  to: string;
}

export function generateVenmoLink(recipient: string, amount: number, note: string, isRequest: boolean = false): string {
  // Remove @ from recipient if present
  const cleanRecipient = recipient.startsWith('@') ? recipient.slice(1) : recipient;
  
  // Create the deep link
  const baseUrl = isRequest ? 'venmo://paycharge?txn=charge' : 'venmo://paycharge?txn=pay';
  const params = new URLSearchParams({
    recipients: cleanRecipient,
    amount: amount.toFixed(2),
    note: note
  });

  return `${baseUrl}&${params.toString()}`;
}

export function generateVenmoWebLink(recipient: string, amount: number, note: string, isRequest: boolean = false): string {
  // Remove @ from recipient if present
  const cleanRecipient = recipient.startsWith('@') ? recipient.slice(1) : recipient;
  
  // Create the web fallback URL
  const baseUrl = 'https://venmo.com/';
  const action = isRequest ? 'charge' : 'pay';
  
  return `${baseUrl}${action}/${cleanRecipient}?amount=${amount.toFixed(2)}&note=${encodeURIComponent(note)}`;
}

export function formatPaymentNote(message: string): string {
  return `Poker Night Settlement - ${message}`;
} 