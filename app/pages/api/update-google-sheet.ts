import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

const sheets = google.sheets('v4');

const auth = new google.auth.GoogleAuth({
  keyFile: '../../../poker-tracker-google-auth.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { players } = req.body;

    const client = await auth.getClient();
    const spreadsheetId = 'enterId';

    const rows = players.map((player: any) => [
      player.name,
      player.buyIn,
      player.finalAmount,
      player.finalAmount - player.buyIn,
    ]);

    await sheets.spreadsheets.values.append({
        auth: client as any,
        spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: {
            values: rows,
        },
    });

    res.status(200).json({ message: 'Sheet updated successfully' });
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
