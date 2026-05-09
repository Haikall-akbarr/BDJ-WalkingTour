"use client"

import { initializeApp, getApps } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

export function initFirebaseClient() {
  if (!getApps().length) {
    try {
      initializeApp(firebaseConfig)
    } catch (e) {
      // ignore if already initialized
    }
  }
}

export async function signInWithFirebaseGoogle() {
  initFirebaseClient()
  const auth = getAuth()
  const provider = new GoogleAuthProvider()

  const result = await signInWithPopup(auth, provider)

  const firebaseIdToken = await result.user.getIdToken(true)

  return { result, firebaseIdToken }
}

export default null
