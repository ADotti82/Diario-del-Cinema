import React, { useState } from 'react';
import { Settings, Copy, Check, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Key, Database, Globe, Rocket, HelpCircle } from 'lucide-react';
import { AppSettings } from '../types';
import { testGASConnection } from '../services/gasService';
import { DEFAULT_TMDB_API_KEY } from '../services/storage';

interface GASSetupModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClose?: () => void;
  isStandaloneTab?: boolean;
}

export const GASSetupModal: React.FC<GASSetupModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
  isStandaloneTab = false
}) => {
  const [gasUrl, setGasUrl] = useState(settings.gasWebAppUrl);
  const [tmdbKey, setTmdbKey] = useState(settings.tmdbApiKey || DEFAULT_TMDB_API_KEY);
  const [testingGAS, setTestingGAS] = useState(false);
  const [gasTestResult, setGasTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [saveBanner, setSaveBanner] = useState(false);

  // Full Code.gs string for 1-click copying
  const codeGsSource = `/**
 * CineDiario - Google Apps Script Backend (Code.gs)
 * Colonne: ID, Titolo, Locandina, Data Visione, Luogo, Voto, Commenti, Timestamp
 */

var SHEET_NAME = "DiarioFilm";
var HEADERS = ["ID", "Titolo", "Locandina", "Data Visione", "Luogo", "Voto", "Commenti", "Timestamp"];

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#1e293b");
    headerRange.setFontColor("#f8fafc");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  try {
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return createJsonResponse({ status: "success", total: 0, data: [] });
    }
    var dataRange = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
    var values = dataRange.getValues();
    var movies = values.map(function(row) {
      return {
        id: String(row[0] || ""),
        title: String(row[1] || ""),
        poster_path: String(row[2] || ""),
        watch_date: row[3] ? formatDate(row[3]) : "",
        location: String(row[4] || ""),
        rating: row[5] !== "" ? Number(row[5]) : null,
        comments: String(row[6] || ""),
        timestamp: row[7] ? String(row[7]) : ""
      };
    }).reverse();
    return createJsonResponse({ status: "success", total: movies.length, data: movies });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try { payload = JSON.parse(e.postData.contents); } catch (jsonErr) { payload = e.parameter || {}; }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    if (payload.action === "delete" && payload.id) {
      return deleteMovieById(sheet, String(payload.id));
    }

    var id = String(payload.id || "film_" + new Date().getTime());
    var title = String(payload.title || payload.titolo || "Senza Titolo").trim();
    var poster = String(payload.poster_path || payload.locandina || "").trim();
    var watchDate = payload.watch_date || payload.data_visione || "";
    var location = String(payload.location || payload.luogo || "").trim();
    var rating = (payload.rating !== undefined && payload.rating !== null && payload.rating !== "") 
      ? Number(payload.rating) 
      : (payload.voto !== undefined && payload.voto !== null && payload.voto !== "" ? Number(payload.voto) : "");
    var comments = String(payload.comments || payload.commenti || "").trim();
    var timestamp = payload.timestamp || new Date().toISOString();

    if (watchDate) { watchDate = formatDate(watchDate); }

    var newRow = [id, title, poster, watchDate, location, rating, comments, timestamp];
    sheet.appendRow(newRow);

    return createJsonResponse({
      status: "success",
      message: "Film aggiunto con successo",
      data: { id: id, title: title, poster_path: poster, watch_date: watchDate, location: location, rating: rating, comments: comments, timestamp: timestamp }
    });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function doOptions(e) {
  return createJsonResponse({ status: "ok" });
}

function deleteMovieById(sheet, targetId) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return createJsonResponse({ status: "error", message: "Foglio vuoto" });
  var idRange = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idRange.length; i++) {
    if (String(idRange[i][0]) === targetId) {
      sheet.deleteRow(i + 2);
      return createJsonResponse({ status: "success", message: "Film eliminato", deletedId: targetId });
    }
  }
  return createJsonResponse({ status: "error", message: "Non trovato" });
}

function formatDate(dateVal) {
  if (!dateVal) return "";
  if (typeof dateVal === "string") {
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(dateVal)) return dateVal;
    try {
      var d = new Date(dateVal);
      if (!isNaN(d.getTime())) return Utilities.formatDate(d, Session.getScriptTimeZone() || "GMT+1", "yyyy-MM-dd");
    } catch (e) {}
    return dateVal;
  }
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, Session.getScriptTimeZone() || "GMT+1", "yyyy-MM-dd");
  }
  return String(dateVal);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeGsSource);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestGAS = async () => {
    setTestingGAS(true);
    setGasTestResult(null);
    const res = await testGASConnection(gasUrl);
    setGasTestResult(res);
    setTestingGAS(false);
  };

  const handleSave = () => {
    onSaveSettings({
      gasWebAppUrl: gasUrl.trim(),
      tmdbApiKey: tmdbKey.trim() || DEFAULT_TMDB_API_KEY,
      offlineModeOnly: false
    });
    setSaveBanner(true);
    setTimeout(() => {
      setSaveBanner(false);
      if (onClose) onClose();
    }, 1200);
  };

  return (
    <div className={`space-y-6 animate-fadeIn ${isStandaloneTab ? 'pb-20' : ''}`}>
      {/* Title */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            Configurazione Backend & Guida al Deploy
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Collega il tuo foglio Google Sheets via Google Apps Script (GAS) e gestisci la chiave API TMDB.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
          >
            Chiudi
          </button>
        )}
      </div>

      {saveBanner && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Impostazioni salvate con successo!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Google Apps Script Web App URL */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Google Apps Script Web App URL</h3>
              <p className="text-[11px] text-slate-400">Endpoint per doGet (lettura) e doPost (scrittura)</p>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="url"
              value={gasUrl}
              onChange={(e) => {
                setGasUrl(e.target.value);
                setGasTestResult(null);
              }}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTestGAS}
                disabled={testingGAS || !gasUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingGAS ? 'animate-spin text-amber-400' : ''}`} />
                <span>Testa Connessione</span>
              </button>

              <span className="text-[11px] text-slate-400">
                {gasUrl ? 'URL impostato' : 'Non configurato (salvataggio locale)'}
              </span>
            </div>

            {gasTestResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                  gasTestResult.success
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {gasTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{gasTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Box 2: TMDB API Key */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Chiave API TMDB (The Movie Database)</h3>
              <p className="text-[11px] text-slate-400">Fornisce locandine, trame e metadati in italiano</p>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={tmdbKey}
              onChange={(e) => setTmdbKey(e.target.value)}
              placeholder="Inserisci la tua TMDB API Key (v3)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Chiave predefinita già attiva ✓</span>
              <button
                type="button"
                onClick={() => setTmdbKey(DEFAULT_TMDB_API_KEY)}
                className="text-amber-400 hover:underline"
              >
                Ripristina Default
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Settings Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          Salva Configurazione
        </button>
      </div>

      {/* Step-by-Step GAS Deployment Guide */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Guida Rapida: Pubblicazione Google Apps Script come Web App
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Segui questi 5 semplici passaggi per creare il tuo database Google Sheets gratuito in 2 minuti:
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer self-start sm:self-auto"
          >
            {copiedCode ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Codice Copiato!' : 'Copia Code.gs'}</span>
          </button>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">1</span>
              Crea un nuovo Foglio Google
            </div>
            <p className="text-slate-400 leading-relaxed">
              Vai su <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-3 h-3" /></a> e crea un foglio vuoto (es. <em>&quot;Il Mio Diario Film&quot;</em>). Le colonne (ID, Titolo, Locandina, Data Visione, Luogo, Voto, Commenti, Timestamp) verranno generate automaticamente dal codice!
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">2</span>
              Apri l'Editor Apps Script
            </div>
            <p className="text-slate-400 leading-relaxed">
              Nel menu del foglio Google, clicca su <strong>Estensioni &rarr; Apps Script</strong>. Si aprirà l'editor di codice Google.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">3</span>
              Incolla il codice Code.gs
            </div>
            <p className="text-slate-400 leading-relaxed">
              Cancella il codice preesistente in <code>Code.gs</code> e incolla il codice copiato tramite il pulsante <strong>&quot;Copia Code.gs&quot;</strong> in alto. Premi <strong>Salva (Ctrl+S / Cmd+S)</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">4</span>
              Distribuisci come Web App (CRUCIALE)
            </div>
            <p className="text-slate-400 leading-relaxed">
              In alto a destra clicca su <strong>Distribuisci (Deploy) &rarr; Nuova distribuzione (New deployment)</strong>:<br />
              &bull; Tipo: seleziona <strong>Applicazione web (Web app)</strong><br />
              &bull; Esegui come: <strong>Il mio account (Me)</strong><br />
              &bull; Chi ha accesso: <strong className="text-amber-300">Chiunque (Anyone)</strong> *(fondamentale per permettere alla SPA di salvare senza blocchi CORS)*.
            </p>
          </div>
        </div>

        {/* Step 5 */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/30 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-bold text-white">5. Copia l'URL Web App e incollalo qui sopra</p>
            <p className="text-slate-400 leading-relaxed">
              Google ti fornirà un URL del tipo <code>https://script.google.com/macros/s/AKfycb.../exec</code>. Incollalo nel campo <strong>&quot;Google Apps Script Web App URL&quot;</strong> qui sopra e premi <em>Salva</em>. Da questo momento, ogni film registrato verrà salvato sia nel tuo foglio Google sia nella memoria locale del tuo dispositivo!
            </p>
          </div>
        </div>

        {/* Frontend Deploy Information */}
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-bold text-white">
            <Rocket className="w-4 h-4 text-sky-400" />
            <span>Deploy del Frontend e PWA</span>
          </div>
          <p className="leading-relaxed">
            Per distribuire il frontend in produzione:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-300">
            <li>Esegui <code className="text-amber-400">npm run build</code> per generare il pacchetto statico ottimizzato nella cartella <code className="text-amber-400">dist/</code>.</li>
            <li>Il Service Worker (<code className="text-amber-400">public/sw.js</code>) e il Manifest (<code className="text-amber-400">public/manifest.json</code>) sono già predisposti per abilitare la PWA e la cache offline su qualsiasi hosting HTTPS (Google Cloud Run, Vercel, Netlify, Firebase Hosting o GitHub Pages).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
