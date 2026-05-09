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

  console.log('[firebaseClient] Starting redirect sign-in...')
  // Use redirect flow which is more reliable in production (avoids popup blockers)
  await signInWithRedirect(auth, provider)
  console.log('[firebaseClient] Redirect initiated')

  // This function does not return a token immediately because the page will redirect.
  return null
}

export async function handleFirebaseRedirectResult() {
  initFirebaseClient()
  const auth = getAuth()

  try {
    console.log('[firebaseClient] Getting redirect result...')
    const result = await getRedirectResult(auth)
    console.log('[firebaseClient] Redirect result:', { hasResult: !!result, hasUser: !!result?.user, email: result?.user?.email })
    
    if (!result || !result.user) return null
    
    const firebaseIdToken = await result.user.getIdToken(true)
    console.log('[firebaseClient] Got ID token, length:', firebaseIdToken.length)
    
    return { result, firebaseIdToken }
  } catch (err: any) {
    console.error('[firebaseClient] Error getting redirect result:', err?.message)
    // Forward error to caller for handling
    throw err
  }
}

export default null
