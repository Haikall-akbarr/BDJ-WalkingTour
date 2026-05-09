"use client"

import { initializeApp, getApps } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth"

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

  // Use redirect flow which is more reliable in production (avoids popup blockers)
  await signInWithRedirect(auth, provider)

  // This function does not return a token immediately because the page will redirect.
  return null
}

export async function handleFirebaseRedirectResult() {
  initFirebaseClient()
  const auth = getAuth()

  try {
    const result = await getRedirectResult(auth)
    if (!result || !result.user) return null
    const firebaseIdToken = await result.user.getIdToken(true)
    return { result, firebaseIdToken }
  } catch (err) {
    // Forward error to caller for handling
    throw err
  }
}

export default null
