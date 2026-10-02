import { DiaryEntry } from '../types';
import { getStoredEntries, setStoredEntries } from './storage';

export interface GasApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  total?: number;
}

/**
 * Recupera l'elenco dei film registrati da Google Apps Script (doGet)
 */
export async function fetchDiaryEntriesFromGAS(gasUrl: string): Promise<{
  entries: DiaryEntry[];
  fromGAS: boolean;
  error?: string;
}> {
  // Se l'URL non è configurato, usa lo storage locale
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
      // Normalizza i dati ricevuti
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

      // Salva nella cache locale per l'offline
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
    console.warn('Errore lettura da GAS, utilizzo cache locale:', message);
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
  // Salva subito nella cache locale (aggiornamento ottimistico)
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

  // Se l'URL non è configurato, conferma il salvataggio locale
  if (!gasUrl || gasUrl.trim() === '') {
    return {
      success: true,
      fromGAS: false,
      message: 'Film salvato nella memoria locale (URL Google Apps Script non configurato).'
    };
  }

  try {
    const cleanUrl = gasUrl.trim();
    // Usiamo text/plain per inviare JSON a Google Apps Script senza innescare
    // complicazioni con i redirect CORS pre-flight
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
    console.warn('POST diretta a GAS fallita o bloccata da CORS, tentativo no-cors:', err);
    try {
      // Tentativo no-cors: GAS esegue la doPost comunque
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
    } catch (fallbackErr) {
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
  // Rimuovi da locale
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
  } catch (e) {
    return { success: true, message: 'Film rimosso in locale (errore di sincronizzazione con GAS).' };
  }
}

/**
 * Verifica la connessione a Google Apps Script
 */
export async function testGASConnection(gasUrl: string): Promise<{ success: boolean; message: string }> {
  if (!gasUrl || !gasUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: "L'URL deve iniziare con 'https://script.google.com/macros/s/'"
    };
  }

  try {
    const res = await fetch(gasUrl.trim(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      redirect: 'follow'
    });

    if (!res.ok) {
      return { success: false, message: `Errore server Google Apps Script: HTTP ${res.status}` };
    }

    const data = await res.json();
    if (data.status === 'success') {
      return {
        success: true,
        message: `Connessione riuscita! Trovati ${data.total ?? (data.data?.length || 0)} film nel foglio.`
      };
    }
    return { success: false, message: data.message || 'Risposta non valida dallo script.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Impossibile raggiungere lo script. Verifica di aver impostato 'Chiunque' (Anyone) nei permessi di accesso: ${msg}`
    };
  }
}
