# Piano di Implementazione: Archiviazione Cloud con Google Apps Script (GAS)

## Contesto e Obiettivo
L'autenticazione tramite Google OAuth 2.0 (`signInWithPopup` / Google Identity Services) genera l'errore `Errore 400: origin_mismatch` a causa delle restrizioni di sicurezza sui domini di anteprima dinamici di Cloud Run (`*.run.app`).

In base alle tue risposte:
1. **Scelta di archiviazione**: Passaggio completo a **Google Apps Script (GAS)** senza vincoli di dominio o configurazioni complesse nella Google Cloud Console.
2. **Esperienza di configurazione**: **Predisposizione della connessione automatica allo script** con procedura guidata assistita, test istantaneo e sincronizzazione automatica.

---

## 1. Architettura e Flusso Funzionale

### A. Eliminazione degli Errori OAuth
- Sostituzione del flusso basato su popup OAuth (soggetto a `origin_mismatch`) con l'architettura collaudata **Google Apps Script Web App**.
- Google Apps Script gira come Web App personale nel tuo Google Drive con autorizzazione diretta dell'utente: **nessun controllo sulle origini JavaScript** e compatibilità al 100% con qualsiasi browser, dispositivo mobile e URL di anteprima.

### B. Procedura Guidata di Connessione Automatica ("Assistente 1-Clic")
- **Scorciatoia Diretta**: Pulsante per aprire subito un nuovo foglio di calcolo (`https://sheets.new`).
- **Codice `Code.gs` Preconfigurato**: Copia del codice con un solo clic, comprensivo della creazione automatica della scheda `DiarioFilm` e delle intestazioni stilizzate:
  `ID | Titolo | Locandina | Data Visione | Luogo | Voto | Commenti | Timestamp`
- **Verifica e Test Automatico della Connessione**:
  - Appena incolli l'URL della Web App (o al clic su "Collega"), CineDiario esegue un test istantaneo di lettura/scrittura.
  - Sincronizza subito i film salvati in locale nel nuovo foglio Google.
- **Stato Connessione Sempre Visibile**:
  - Badge nella barra di navigazione che indica chiaramente:  
    `Foglio Google Connesso ✓` (con link diretto al foglio) oppure `Salvataggio Locale (Configura Cloud)`.

### C. Salvataggio Continuo e Recupero
- Ogni aggiunta, modifica o eliminazione di film aggiorna istantaneamente la memoria locale e accoda/aggiorna la riga nel foglio Google.
- Supporto offline totale: se sei offline, l'app registra in locale e sincronizza non appena torna la connessione.
- Estrazione CSV completa (già predisposta nella vista Diario) sempre accessibile.

---

## 2. Modifiche ai Componenti

1. **`src/services/gasService.ts`**:
   - Potenziamento delle funzioni di connessione: test automatico della Web App, recupero immediato dei record, accodamento asincrono e sincronizzazione cumulativa dei dati locali.
2. **`src/components/GASAutoConnectModal.tsx`**:
   - Nuova finestra di onboarding / collegamento rapido in 3 passaggi chiari e visivi:
     1. Crea foglio (`sheets.new`) e apri Apps Script.
     2. Incolla il codice (copiato con 1 clic) ed esegui il deploy come Web App.
     3. Incolla l'URL e clicca "Collega e Sincronizza".
3. **`src/components/Navbar.tsx` & `src/App.tsx`**:
   - Rimozione della modale bloccante di OAuth Google.
   - Sostituzione con il pulsante e badge di stato Google Apps Script.
   - Apertura dell'assistente automatico al primo avvio se il foglio non è ancora collegato.
4. **`src/components/DiaryHistory.tsx`**:
   - Mantenimento della nuova barra di filtraggio avanzata (Anno, Voto, Genere) e del pulsante di esportazione CSV.

---

## 3. Piano di Verifica
- Esecuzione di `compile_applet` e `lint_applet` per confermare l'assenza di errori di compilazione e TypeScript.
- Test del flusso di salvataggio in locale e della procedura di verifica automatica dell'URL di Apps Script.
