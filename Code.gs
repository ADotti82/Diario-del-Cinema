/**
 * CineDiario - Google Apps Script Backend (Code.gs)
 * 
 * Questo script funge da backend API per la SPA CineDiario.
 * Salva e recupera i film visti su un foglio di calcolo Google Sheets.
 * 
 * Colonne del Foglio di Calcolo:
 * 1. ID (ID univoco film TMDB o generato)
 * 2. Titolo (Titolo del film in italiano)
 * 3. Locandina (URL completo o percorso del poster)
 * 4. Data Visione (Data in cui il film è stato visto - facoltativa)
 * 5. Luogo (Cinema, Casa, Streaming, ecc. - facoltativo)
 * 6. Voto (Valutazione da 1 a 10 o stelle - facoltativo)
 * 7. Commenti (Recensione o note personali - facoltativo)
 * 8. Timestamp (Data e ora di registrazione nel diario)
 */

// Nome della scheda nel foglio di calcolo
var SHEET_NAME = "DiarioFilm";
var HEADERS = ["ID", "Titolo", "Locandina", "Data Visione", "Luogo", "Voto", "Commenti", "Timestamp"];

/**
 * Inizializza il foglio di calcolo con le intestazioni se non esistono
 */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Se il foglio è vuoto, imposta le intestazioni
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

/**
 * Gestione richieste HTTP GET
 * Legge tutti i film registrati dal foglio Google Sheets
 */
function doGet(e) {
  try {
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    
    // Se ci sono solo le intestazioni, restituisci array vuoto
    if (lastRow <= 1) {
      return createJsonResponse({
        status: "success",
        total: 0,
        data: []
      });
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
    }).reverse(); // Mostra i più recenti in cima
    
    return createJsonResponse({
      status: "success",
      total: movies.length,
      data: movies
    });
    
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Gestione richieste HTTP POST
 * Accoda una nuova riga con il film nel foglio di calcolo
 */
function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var payload = {};
    
    // Supporta sia payload JSON raw che parametri form URL-encoded
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }
    
    // Azione opzionale: eliminazione film per ID
    if (payload.action === "delete" && payload.id) {
      return deleteMovieById(sheet, String(payload.id));
    }
    
    // Campi del film (tutti facoltativi tranne il titolo)
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
    
    // Formatta la data se è un oggetto data o stringa
    if (watchDate) {
      watchDate = formatDate(watchDate);
    }
    
    // Accoda la nuova riga nel foglio
    var newRow = [
      id,
      title,
      poster,
      watchDate,
      location,
      rating,
      comments,
      timestamp
    ];
    
    sheet.appendRow(newRow);
    
    return createJsonResponse({
      status: "success",
      message: "Film aggiunto con successo al diario cinematografico",
      data: {
        id: id,
        title: title,
        poster_path: poster,
        watch_date: watchDate,
        location: location,
        rating: rating !== "" ? rating : null,
        comments: comments,
        timestamp: timestamp
      }
    });
    
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Errore durante il salvataggio: " + error.toString()
    });
  }
}

/**
 * Gestione richieste OPTIONS (pre-flight CORS)
 */
function doOptions(e) {
  return createJsonResponse({ status: "ok" });
}

/**
 * Elimina un film cercandolo per ID nella colonna 1
 */
function deleteMovieById(sheet, targetId) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse({ status: "error", message: "Foglio vuoto" });
  }
  
  var idRange = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idRange.length; i++) {
    if (String(idRange[i][0]) === targetId) {
      sheet.deleteRow(i + 2);
      return createJsonResponse({
        status: "success",
        message: "Film eliminato con successo",
        deletedId: targetId
      });
    }
  }
  
  return createJsonResponse({
    status: "error",
    message: "Film non trovato con ID: " + targetId
  });
}

/**
 * Formatta date in formato leggibile YYYY-MM-DD
 */
function formatDate(dateVal) {
  if (!dateVal) return "";
  if (typeof dateVal === "string") {
    // Se è già YYYY-MM-DD restituiscila
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
    try {
      var d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return Utilities.formatDate(d, Session.getScriptTimeZone() || "GMT+1", "yyyy-MM-dd");
      }
    } catch (e) {}
    return dateVal;
  }
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, Session.getScriptTimeZone() || "GMT+1", "yyyy-MM-dd");
  }
  return String(dateVal);
}

/**
 * Crea la risposta JSON con MimeType corretto per CORS
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
