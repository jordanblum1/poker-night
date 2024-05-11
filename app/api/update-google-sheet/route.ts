import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const sheets = google.sheets('v4');

const googleKey = {
  "type": "service_account",
  "project_id": process.env.GOOGLE_SHEETS_PROJECT_ID,
  "private_key_id": process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID,
  "private_key": process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  "client_id": process.env.GOOGLE_SHEETS_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.GOOGLE_SHEETS_CLIENT_X509_CERT_URL,
  "universe_domain": "googleapis.com"
};

const auth = new google.auth.GoogleAuth({
  credentials: googleKey,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function appendValuesToSheet(date: string, playersData: { name: string, buyIn: string, finalAmount: string }[]) {
  const client = await auth.getClient();
  const spreadsheetId = '1PjG71ReuwMSh0OPXlQzwjnGevBvc3LqObrhl1S2qao8';

  try {
    // Fetch current headers
    const headersResponse = await sheets.spreadsheets.values.get({
      auth: client as unknown as string,
      spreadsheetId,
      range: 'PokerTrack!B1:Z1', // Fetch headers starting from B1
    });

    const headers: string[] = headersResponse.data.values ? headersResponse.data.values[0] : [];
    const playerNames: string[] = playersData.map((player) => player.name);
    const missingHeaders = playerNames.filter((name: string) => !headers.includes(name));

    // Add missing player names to headers
    if (missingHeaders.length > 0) {
      await sheets.spreadsheets.values.update({
        auth: client as unknown as string,
        spreadsheetId,
        range: `PokerTrack!${String.fromCharCode(66 + headers.length)}1`, // B is 66 in ASCII
        valueInputOption: 'RAW',
        requestBody: {
          values: [missingHeaders],
        },
      });
    }

    // Refresh headers after update
    const updatedHeadersResponse = await sheets.spreadsheets.values.get({
      auth: client as unknown as string,
      spreadsheetId,
      range: 'PokerTrack!B1:Z1',
    });

    const updatedHeaders: string[] = updatedHeadersResponse.data.values ? updatedHeadersResponse.data.values[0] : [];
    const row = new Array(updatedHeaders.length + 1).fill(''); // +1 for date column
    row[0] = date; // Date is placed in the first column

    // Map each player's data to the correct column
    playersData.forEach((player) => {
      const colIndex = updatedHeaders.indexOf(player.name) + 1; // +1 to account for date column
      row[colIndex] = (Number(player.finalAmount) - Number(player.buyIn)).toString();
    });

    // Remove existing totals and averages
    const allDataResponse = await sheets.spreadsheets.values.get({
      auth: client as unknown as string,
      spreadsheetId,
      range: 'PokerTrack!A1:Z1000', // Fetch all rows
    });

    const allRows = allDataResponse.data.values || [];
    const numSessions = allRows.length; // Number of sessions

    if (numSessions > 2) {
      await sheets.spreadsheets.values.clear({
        auth: client as unknown as string,
        spreadsheetId,
        range: `PokerTrack!A${numSessions - 1}:Z${numSessions}`, // Last two rows
      });
    }

    // Append the row with the new data
    await sheets.spreadsheets.values.append({
      auth: client as unknown as string,
      spreadsheetId,
      range: 'PokerTrack!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    // Fetch all rows including new data
    const updatedAllDataResponse = await sheets.spreadsheets.values.get({
      auth: client as unknown as string,
      spreadsheetId,
      range: 'PokerTrack!A2:Z1000', // Fetch a larger range to calculate totals and averages
    });

    const updatedAllRows = updatedAllDataResponse.data.values || [];
    const updatedNumSessions = updatedAllRows.length; // Number of sessions

    // Initialize totals and averages arrays
    const totals = new Array(updatedHeaders.length + 1).fill('');
    const averages = new Array(updatedHeaders.length + 1).fill('');
    totals[0] = 'Total';
    averages[0] = 'Avg Per Session';

    // Calculate totals and averages
    for (let i = 1; i < updatedHeaders.length + 1; i++) { // +1 to account for date column
      let total = 0;
      for (let j = 0; j < updatedNumSessions; j++) {
        const value = Number(updatedAllRows[j][i]);
        if (!isNaN(value)) {
          total += value;
        }
      }
      totals[i] = total.toString();
      averages[i] = (total / updatedNumSessions).toFixed(2);
    }

    // Determine the correct rows for totals and averages
    const totalRow = updatedNumSessions + 4; // Two rows below the last session
    const avgRow = totalRow + 1; // One row after totals

    // Update totals
    await sheets.spreadsheets.values.update({
      auth: client as unknown as string,
      spreadsheetId,
      range: `PokerTrack!A${totalRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [totals],
      },
    });

    // Update averages
    await sheets.spreadsheets.values.update({
      auth: client as unknown as string,
      spreadsheetId,
      range: `PokerTrack!A${avgRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [averages],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating sheet:', error);
    return { success: false, error };
  }
}

export async function POST(request: Request) {
  const { date, players } = await request.json();

  const result = await appendValuesToSheet(date, players);

  if (result?.success) {
    return NextResponse.json({ message: 'Sheet updated successfully' });
  } else {
    console.error('Error updating sheet:', result?.error);
    return NextResponse.json({ message: 'Error updating sheet', error: result?.error || 'Unknown error' }, { status: 500 });
  }
}
