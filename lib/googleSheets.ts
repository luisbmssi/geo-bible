import { google } from "googleapis";

let cache: any = null;
let lastFetch = 0;

const CACHE_TIME = 60 * 1000;

export async function getSheetData() {
  console.log("Buscando informações...");
  const now = Date.now();

  if (cache && now - lastFetch < CACHE_TIME) {
    return cache;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Página1!A:E",
  });

  const rows = response.data.values || [];

  const [headers, ...data] = rows;

  const formatted = data.map((row) => {
    return headers.reduce((acc: any, header: string, index: number) => {
      acc[header] = row[index] || null;
      return acc;
    }, {});
  });

  cache = formatted;
  lastFetch = now;

  return formatted;
}
