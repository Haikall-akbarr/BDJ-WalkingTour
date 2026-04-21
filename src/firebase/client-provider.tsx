
'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export const FirebaseClientProvider = ({ children }: { children: ReactNode }) => {
  const [instances, setInstances] = useState<{
    firebaseApp: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
  } | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const initialized = initializeFirebase();
      if (initialized) {
        setInstances(initialized);
        setFirebaseAvailable(true);
        setFirebaseError(null);
      } else {
        setFirebaseAvailable(false);
        setFirebaseError("Konfigurasi Firebase client belum lengkap di .env.local");
      }
    } catch (err) {
      setInstances(null);
      setFirebaseAvailable(false);
      const message = err instanceof Error ? err.message : String(err);
      setFirebaseError(message || "Inisialisasi Firebase gagal");
    } finally {
      setFirebaseReady(true);
    }
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={instances?.firebaseApp ?? null}
      firestore={instances?.firestore ?? null}
      auth={instances?.auth ?? null}
      firebaseReady={firebaseReady}
      firebaseAvailable={firebaseAvailable}
      firebaseError={firebaseError}
    >
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
};
