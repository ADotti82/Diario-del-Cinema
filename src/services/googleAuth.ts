/**
 * Google Workspace & Firebase Authentication Service
 * Manages client-side OAuth tokens with in-memory caching and fallback to Google Identity Services
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Unified user profile compatible with Firebase User and Google OAuth UserInfo
export interface AppGoogleUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

// Configure Google Provider with required Workspace scopes
export const googleProvider = new GoogleAuthProvider();
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
];

SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// In-memory token storage (Do NOT store in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize auth listener. Called on app load.
 */
export const initAuth = (
  onAuthSuccess?: (user: AppGoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) {
          onAuthSuccess(
            {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL
            },
            cachedAccessToken
          );
        }
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Attempt sign-in with Google Identity Services (GIS) token client as fallback
 */
function signInWithGIS(): Promise<{ user: AppGoogleUser; accessToken: string }> {
  return new Promise((resolve, reject) => {
    const googleObj = (window as any).google;
    if (!googleObj?.accounts?.oauth2) {
      reject(new Error('Google Identity Services non caricato'));
      return;
    }

    try {
      const client = googleObj.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: `${SCOPES.join(' ')} https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email`,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            const isMismatch =
              tokenResponse.error === 'origin_mismatch' ||
              tokenResponse.error_description?.includes('origin_mismatch');
            const err: any = new Error(
              isMismatch
                ? 'Errore 400: origin_mismatch - Registra l\'origine JavaScript in Google Cloud Console'
                : tokenResponse.error_description || tokenResponse.error
            );
            err.code = isMismatch ? 'origin_mismatch' : tokenResponse.error;
            reject(err);
            return;
          }

          const accessToken = tokenResponse.access_token;
          cachedAccessToken = accessToken;

          try {
            // Fetch user info from Google endpoint
            const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (infoRes.ok) {
              const profile = await infoRes.json();
              const appUser: AppGoogleUser = {
                uid: profile.sub || String(Date.now()),
                displayName: profile.name || profile.given_name || 'Utente Google',
                email: profile.email || '',
                photoURL: profile.picture || null
              };
              resolve({ user: appUser, accessToken });
              return;
            }
          } catch {
            // Fallback user if profile fetch failed
          }

          resolve({
            user: {
              uid: String(Date.now()),
              displayName: 'Utente Google',
              email: null,
              photoURL: null
            },
            accessToken
          });
        },
        error_callback: (err: any) => {
          const isMismatch =
            err?.type === 'origin_mismatch' ||
            err?.message?.includes('origin_mismatch') ||
            String(err).includes('origin_mismatch');
          const customErr: any = new Error(
            isMismatch
              ? 'Errore 400: origin_mismatch - Registra l\'origine JavaScript in Google Cloud Console'
              : err?.message || 'Errore OAuth'
          );
          customErr.code = isMismatch ? 'origin_mismatch' : 'oauth_error';
          reject(customErr);
        }
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (e: any) {
      const isMismatch =
        e?.type === 'origin_mismatch' ||
        e?.message?.includes('origin_mismatch') ||
        String(e).includes('origin_mismatch');
      if (isMismatch) {
        const customErr: any = new Error(
          'Errore 400: origin_mismatch - Registra l\'origine JavaScript in Google Cloud Console'
        );
        customErr.code = 'origin_mismatch';
        reject(customErr);
        return;
      }
      reject(e);
    }
  });
}

/**
 * Sign in with Google Popup and obtain access token for Drive & Sheets
 */
export const googleSignIn = async (): Promise<{ user: AppGoogleUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;

    // 1. Try Firebase Auth popup
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('Impossibile ottenere il token di accesso Google.');
      }

      cachedAccessToken = credential.accessToken;
      return {
        user: {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL
        },
        accessToken: cachedAccessToken
      };
    } catch (firebaseErr: any) {
      // If domain is not authorized in Firebase Auth, attempt Google Identity Services (GIS)
      if (
        firebaseErr?.code === 'auth/unauthorized-domain' ||
        firebaseErr?.message?.includes('unauthorized-domain')
      ) {
        console.warn('Firebase auth/unauthorized-domain rilevato. Tentativo con Google Identity Services...');
        try {
          return await signInWithGIS();
        } catch (gisErr: any) {
          console.warn('Fallback GIS non riuscito o bloccato:', gisErr);
          if (
            gisErr?.code === 'origin_mismatch' ||
            gisErr?.message?.includes('origin_mismatch')
          ) {
            throw gisErr;
          }
          // Re-throw with specific unauthorized-domain code for the UI modal
          const error: any = new Error(
            `Il dominio ${window.location.hostname} non è ancora autorizzato nella console Firebase.`
          );
          error.code = 'auth/unauthorized-domain';
          error.domain = window.location.hostname;
          throw error;
        }
      }
      throw firebaseErr;
    }
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve cached access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Set in-memory access token
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Sign out and clear cached token
 */
export const googleSignOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
  }
};
