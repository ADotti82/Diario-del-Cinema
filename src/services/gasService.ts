import { DiaryEntry } from '../types';
import { getStoredEntries, setStoredEntries } from './storage';

export interface GasApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  total?: number;
}

/**
 * Script Google Apps Script (Code.gs) completo e pronto all'uso
 */
export const CODE_GS_TEMPLATE = `/**
 * ====================================================================
 * CineDiario - Backend Google Apps Script (Code.gs)
 * Salva e sincronizza automaticamente i film nel tuo Google Sheets
 * ====================================================================
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss);
    var data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return createJsonResponse({ status: "success", data: [], total: 0 });
    }

    var entries = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[1]) continue;
      entries.push({
        id: String(row[0]),
        title: String(row[1] || ""),
        poster_path: String(row[2] || ""),
        watch_date: formatDate(row[3]),
        location: String(row[4] || ""),
        rating: row[5] !== "" && row[5] !== null ? Number(row[5]) : null,
        comments: String(row[6] || ""),
        timestamp: String(row[7] || "")
      });
    }

    return createJsonResponse({
      status: "success",
      data: entries.reverse(),
      total: entries.length
    });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss);
    var body = e.postData ? e.postData.contents : "";
    if (!body) {
      return createJsonResponse({ status: "error", message: "Nessun dato inviato" });
    }

    var item = JSON.parse(body);

    // Azione: Elimina film
    if (item.action === "delete" && item.id) {
      var data = sheet.getDataRange().getValues();
      for (var r = 1; r < data.length; r++) {
        if (String(data[r][0]) === String(item.id)) {
          sheet.deleteRow(r + 1);
          return createJsonResponse({ status: "success", message: "Film eliminato" });
        }
      }
      return createJsonResponse({ status: "success", message: "Film non trovato" });
    }

    // Azione: Batch sync (più film contemporaneamente)
    if (item.action === "batch_sync" && Array.isArray(item.entries)) {
      var existingData = sheet.getDataRange().getValues();
      var existingIds = {};
      for (var k = 1; k < existingData.length; k++) {
        if (existingData[k][0]) existingIds[String(existingData[k][0])] = true;
      }

      var newRows = [];
      for (var b = 0; b < item.entries.length; b++) {
        var entry = item.entries[b];
        if (!existingIds[String(entry.id)]) {
          newRows.push([
            String(entry.id),
            String(entry.title || ""),
            String(entry.poster_path || ""),
            String(entry.watch_date || ""),
            String(entry.location || ""),
            entry.rating !== null && entry.rating !== undefined ? entry.rating : "",
            String(entry.comments || ""),
            String(entry.timestamp || new Date().toISOString())
          ]);
        }
      }

      if (newRows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 8).setValues(newRows);
      }
      return createJsonResponse({ status: "success", message: newRows.length + " film sincronizzati nel foglio!" });
    }

    // Azione standard: Salva o Aggiorna singolo film
    var data = sheet.getDataRange().getValues();
    var existingRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(item.id)) {
        existingRow = i + 1;
        break;
      }
    }

    var rowValues = [
      String(item.id),
      String(item.title || ""),
      String(item.poster_path || ""),
      String(item.watch_date || ""),
      String(item.location || ""),
      item.rating !== null && item.rating !== undefined ? item.rating : "",
      String(item.comments || ""),
      String(item.timestamp || new Date().toISOString())
    ];

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, 8).setValues([rowValues]);
      return createJsonResponse({ status: "success", message: "Film aggiornato nel foglio!" });
    } else {
      sheet.appendRow(rowValues);
      return createJsonResponse({ status: "success", message: "Film salvato nel foglio!" });
    }
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function getOrCreateSheet(ss) {
  var sheet = ss.getSheetByName("DiarioFilm");
  if (!sheet) {
    sheet = ss.insertSheet("DiarioFilm");
    var headers = ["ID", "Titolo", "Locandina", "Data Visione", "Luogo", "Voto", "Commenti", "Timestamp"];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setBackground("#0f172a");
    headerRange.setFontColor("#f8fafc");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 8);
  }
  return sheet;
}

function formatDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ("0" + (val.getMonth() + 1)).slice(-2);
    var d = ("0" + val.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }
  return String(val);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

/**
 * Recupera l'elenco dei film registrati da Google Apps Script (doGet)
 */
export async function fetchDiaryEntriesFromGAS(gasUrl: string): Promise<{
  entries: DiaryEntry[];
  fromGAS: boolean;
  error?: string;
}> {
  if (!gasUrl || gasUrl.trim() === '') {
    return {
      entries: getStoredEntries(),
      fromGAS: false
    };
  }

  try {
    const cleanUrl = gasUrl.trim();
    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Impossibile leggere dal foglio`);
    }

    const json: GasApiResponse<DiaryEntry[]> = await response.json();

    if (json.status === 'success' && Array.isArray(json.data)) {
      const normalized: DiaryEntry[] = json.data.map((item) => ({
        id: String(item.id || Date.now()),
        title: item.title || 'Senza Titolo',
        poster_path: item.poster_path || '',
        watch_date: item.watch_date || '',
        location: item.location || '',
        rating: item.rating !== null && item.rating !== undefined ? Number(item.rating) : null,
        comments: item.comments || '',
        timestamp: item.timestamp || new Date().toISOString()
      }));

      // Cache locale
      setStoredEntries(normalized);

      return {
        entries: normalized,
        fromGAS: true
      };
    } else {
      throw new Error(json.message || 'Risposta inattesa da Google Apps Script');
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Errore lettura da GAS, fallback su cache locale:', message);
    return {
      entries: getStoredEntries(),
      fromGAS: false,
      error: message
    };
  }
}

/**
 * Salva una nuova voce nel diario inviando una POST a Google Apps Script (doPost)
 */
export async function saveDiaryEntryToGAS(
  gasUrl: string,
  entry: DiaryEntry
): Promise<{ success: boolean; fromGAS: boolean; message: string }> {
  // Aggiornamento ottimistico
  const currentEntries = getStoredEntries();
  const existingIdx = currentEntries.findIndex((e) => String(e.id) === String(entry.id));
  let updatedEntries: DiaryEntry[];

  if (existingIdx >= 0) {
    updatedEntries = [...currentEntries];
    updatedEntries[existingIdx] = entry;
  } else {
    updatedEntries = [entry, ...currentEntries];
  }
  setStoredEntries(updatedEntries);

  if (!gasUrl || gasUrl.trim() === '') {
    return {
      success: true,
      fromGAS: false,
      message: 'Film salvato nella memoria locale.'
    };
  }

  try {
    const cleanUrl = gasUrl.trim();
    const payload = JSON.stringify(entry);

    const response = await fetch(cleanUrl, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow'
    });

    if (response.ok) {
      const resJson = await response.json();
      return {
        success: true,
        fromGAS: true,
        message: resJson.message || 'Film registrato con successo nel foglio Google!'
      };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err: unknown) {
    console.warn('POST diretta a GAS fallita, tentativo no-cors:', err);
    try {
      await fetch(gasUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(entry),
        headers: {
          'Content-Type': 'text/plain'
        }
      });
      return {
        success: true,
        fromGAS: true,
        message: 'Film inviato a Google Sheets (in modalità asincrona).'
      };
    } catch {
      return {
        success: true,
        fromGAS: false,
        message: 'Salvato offline! Il salvataggio su Google Sheets riproverà quando connesso.'
      };
    }
  }
}

/**
 * Elimina una voce dal diario su GAS e in locale
 */
export async function deleteDiaryEntryGAS(
  gasUrl: string,
  id: string
): Promise<{ success: boolean; message: string }> {
  const current = getStoredEntries();
  const updated = current.filter((e) => String(e.id) !== String(id));
  setStoredEntries(updated);

  if (!gasUrl || gasUrl.trim() === '') {
    return { success: true, message: 'Film rimosso dalla memoria locale.' };
  }

  try {
    const payload = JSON.stringify({ action: 'delete', id: String(id) });
    await fetch(gasUrl.trim(), {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow'
    });
    return { success: true, message: 'Film eliminato dal foglio Google.' };
  } catch {
    return { success: true, message: 'Film rimosso in locale.' };
  }
}

/**
 * Batch upload di tutti i film locali verso Google Apps Script
 */
export async function batchSyncEntriesToGAS(
  gasUrl: string,
  entries: DiaryEntry[]
): Promise<{ success: boolean; message: string }> {
  if (!gasUrl || entries.length === 0) {
    return { success: true, message: 'Nessun elemento da sincronizzare.' };
  }

  try {
    const payload = JSON.stringify({ action: 'batch_sync', entries });
    const response = await fetch(gasUrl.trim(), {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow'
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message || 'Sincronizzazione completata!' };
    }
    return { success: true, message: 'Sincronizzazione inviata.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Errore sincronizzazione: ${msg}` };
  }
}

/**
 * Verifica la connessione a Google Apps Script
 */
export async function testGASConnection(gasUrl: string): Promise<{ success: boolean; message: string; count?: number }> {
  const cleanUrl = (gasUrl || '').trim();

  if (!cleanUrl) {
    return {
      success: false,
      message: "Inserisci l'URL della Web App di Google Apps Script."
    };
  }

  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: "L'URL deve iniziare con 'https://script.google.com/macros/s/'"
    };
  }

  try {
    const res = await fetch(cleanUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      redirect: 'follow'
    });

    if (!res.ok) {
      return { success: false, message: `Errore server Google Apps Script: HTTP ${res.status}` };
    }

    const data = await res.json();
    if (data.status === 'success') {
      const total = data.total ?? (data.data?.length || 0);
      return {
        success: true,
        message: `Connessione riuscita! Il foglio è collegato (${total} film registrati).`,
        count: total
      };
    }
    return { success: false, message: data.message || 'Risposta inattesa dallo script.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Impossibile raggiungere lo script. Verifica che il deploy sia configurato con 'Chiunque' (Anyone) come accesso: ${msg}`
    };
  }
}
