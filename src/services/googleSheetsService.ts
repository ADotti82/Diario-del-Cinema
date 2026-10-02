/**
 * Google Sheets & Drive API Integration Service
 * Automatically creates and syncs the CineDiario spreadsheet on user's Google Drive
 */

import { DiaryEntry } from '../types';

export const SPREADSHEET_TITLE = 'CineDiario - Diario Cinematografico';
export const SHEET_NAME = 'DiarioFilm';
export const HEADERS = [
  'ID',
  'Titolo',
  'Locandina',
  'Data Visione',
  'Luogo',
  'Voto',
  'Commenti',
  'Timestamp'
];

const SHEET_ID_KEY = 'cinediario_google_sheet_id';

export function getStoredSpreadsheetId(): string | null {
  return localStorage.getItem(SHEET_ID_KEY);
}

export function setStoredSpreadsheetId(id: string | null) {
  if (id) {
    localStorage.setItem(SHEET_ID_KEY, id);
  } else {
    localStorage.removeItem(SHEET_ID_KEY);
  }
}

/**
 * Find existing CineDiario spreadsheet in Google Drive or create a new one automatically
 */
export async function findOrCreateGoogleSpreadsheet(
  accessToken: string
): Promise<{ spreadsheetId: string; webViewLink: string; isNew: boolean }> {
  const cachedId = getStoredSpreadsheetId();

  // 1. If we have a cached spreadsheet ID, verify it exists and is accessible
  if (cachedId) {
    try {
      const verifyRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cachedId}?fields=spreadsheetId,properties.title`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      if (verifyRes.ok) {
        return {
          spreadsheetId: cachedId,
          webViewLink: `https://docs.google.com/spreadsheets/d/${cachedId}/edit`,
          isNew: false
        };
      }
    } catch {
      // If error or not found, proceed to search Drive
    }
  }

  // 2. Search user's Google Drive for an existing spreadsheet with this title
  try {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
      SPREADSHEET_TITLE
    )}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink)&pageSize=1`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const found = searchData.files[0];
        setStoredSpreadsheetId(found.id);
        return {
          spreadsheetId: found.id,
          webViewLink: found.webViewLink || `https://docs.google.com/spreadsheets/d/${found.id}/edit`,
          isNew: false
        };
      }
    }
  } catch (err) {
    console.warn('Drive search error, attempting direct creation:', err);
  }

  // 3. Create a brand new Google Spreadsheet automatically with headers
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_TITLE
      },
      sheets: [
        {
          properties: {
            title: SHEET_NAME,
            gridProperties: {
              frozenRowCount: 1
            }
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: HEADERS.map((header) => ({
                    userEnteredValue: { stringValue: header },
                    userEnteredFormat: {
                      backgroundColor: { red: 0.1, green: 0.15, blue: 0.22 },
                      textFormat: {
                        foregroundColor: { red: 0.98, green: 0.98, blue: 0.98 },
                        bold: true
                      },
                      horizontalAlignment: 'CENTER'
                    }
                  }))
                }
              ]
            }
          ]
        }
      ]
    })
  });

  if (!createRes.ok) {
    const errBody = await createRes.text();
    throw new Error(`Creazione foglio Google fallita (HTTP ${createRes.status}): ${errBody}`);
  }

  const created = await createRes.json();
  const newId = created.spreadsheetId;
  const webViewLink = `https://docs.google.com/spreadsheets/d/${newId}/edit`;

  setStoredSpreadsheetId(newId);

  return {
    spreadsheetId: newId,
    webViewLink,
    isNew: true
  };
}

/**
 * Fetch all diary entries from the Google Sheet
 */
export async function fetchEntriesFromGoogleSheet(
  spreadsheetId: string,
  accessToken: string
): Promise<DiaryEntry[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A2:H`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Lettura da Google Sheets fallita: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.values || !Array.isArray(data.values)) {
    return [];
  }

  return data.values.map((row: any[]) => ({
    id: String(row[0] || Date.now()),
    title: String(row[1] || 'Senza Titolo'),
    poster_path: String(row[2] || ''),
    watch_date: String(row[3] || ''),
    location: String(row[4] || ''),
    rating: row[5] !== '' && row[5] !== undefined ? Number(row[5]) : null,
    comments: String(row[6] || ''),
    timestamp: String(row[7] || new Date().toISOString())
  })).reverse();
}

/**
 * Append a new diary entry row to the Google Sheet
 */
export async function appendEntryToGoogleSheet(
  spreadsheetId: string,
  accessToken: string,
  entry: DiaryEntry
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A:H:append?valueInputOption=USER_ENTERED`;

  const rowValues = [
    entry.id,
    entry.title,
    entry.poster_path,
    entry.watch_date,
    entry.location,
    entry.rating !== null && entry.rating !== undefined ? entry.rating : '',
    entry.comments,
    entry.timestamp || new Date().toISOString()
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [rowValues]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Scrittura su Google Sheets fallita: ${errText}`);
  }
}

/**
 * Batch append multiple entries (e.g. migrate local storage to new Google Sheet)
 */
export async function batchAppendEntriesToGoogleSheet(
  spreadsheetId: string,
  accessToken: string,
  entries: DiaryEntry[]
): Promise<void> {
  if (entries.length === 0) return;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A:H:append?valueInputOption=USER_ENTERED`;

  const rows = entries.map((entry) => [
    entry.id,
    entry.title,
    entry.poster_path,
    entry.watch_date,
    entry.location,
    entry.rating !== null && entry.rating !== undefined ? entry.rating : '',
    entry.comments,
    entry.timestamp || new Date().toISOString()
  ]);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: rows
    })
  });

  if (!res.ok) {
    throw new Error(`Salvataggio cumulativo su Google Sheets fallito`);
  }
}

/**
 * Delete a movie entry row from Google Sheets by ID
 */
export async function deleteEntryFromGoogleSheet(
  spreadsheetId: string,
  accessToken: string,
  entryId: string
): Promise<boolean> {
  // First, find the row index
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A:A`;
  const readRes = await fetch(readUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!readRes.ok) return false;
  const data = await readRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(entryId)) {
      rowIndex = i + 1; // 1-indexed row in Sheet
      break;
    }
  }

  if (rowIndex === -1) return false;

  // Clear that row's contents
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A${rowIndex}:H${rowIndex}:clear`;
  const clearRes = await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  return clearRes.ok;
}
