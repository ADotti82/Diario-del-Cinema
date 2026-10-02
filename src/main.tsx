import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registrazione del Service Worker per supporto PWA e caching offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registrato con successo. Scope:', registration.scope);

        // Controllo aggiornamenti periodici o al cambio di stato
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Nuovo contenuto disponibile; ricarica per aggiornare.');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[PWA] Registrazione Service Worker fallita:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
