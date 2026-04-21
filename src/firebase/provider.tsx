
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

interface FirebaseContextProps {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  firebaseReady: boolean;
  firebaseAvailable: boolean;
  firebaseError: string | null;
}

const FirebaseContext = createContext<FirebaseContextProps>({
  firebaseApp: null,
  firestore: null,
  auth: null,
  firebaseReady: false,
  firebaseAvailable: false,
  firebaseError: null,
});

export const FirebaseProvider = ({
  children,
  firebaseApp,
  firestore,
  auth,
  firebaseReady,
  firebaseAvailable,
  firebaseError,
}: FirebaseContextProps & { children: ReactNode }) => {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth, firebaseReady, firebaseAvailable, firebaseError }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useContext(FirebaseContext).firebaseApp;
export const useFirestore = () => useContext(FirebaseContext).firestore;
export const useAuth = () => useContext(FirebaseContext).auth;
export const useFirebaseStatus = () => {
  const { firebaseReady, firebaseAvailable, firebaseError } = useContext(FirebaseContext);
  return { firebaseReady, firebaseAvailable, firebaseError };
};
