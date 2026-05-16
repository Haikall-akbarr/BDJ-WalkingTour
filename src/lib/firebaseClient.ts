"use client"

import { initializeApp, getApps } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

function assertFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !String(value || "").trim())
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Konfigurasi Firebase belum lengkap: ${missing.join(", ")}. Periksa NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, dan NEXT_PUBLIC_FIREBASE_APP_ID.`)
  }
}

export function initFirebaseClient() {
  assertFirebaseConfig()

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

  console.log('[firebaseClient] Starting popup sign-in...')
  console.log('[firebaseClient] Current auth state:', { uid: auth.currentUser?.uid, email: auth.currentUser?.email })

  // Force account selection so cached sessions don't auto-login the wrong account
  try {
    provider.setCustomParameters({ prompt: 'select_account' })
  } catch (e) {
    // ignore if provider doesn't support custom parameters
  }

  try {
    const result = await signInWithPopup(auth, provider)
    const firebaseIdToken = await result.user.getIdToken(true)
    console.log('[firebaseClient] Popup sign-in success, got ID token length:', firebaseIdToken.length)
    return { result, firebaseIdToken }
  } catch (err: any) {
    console.error('[firebaseClient] signInWithPopup error:', err?.code, err?.message)
    throw err
  }
}

// Redirect flow disabled: using popup sign-in instead. Keep a compatibility no-op.
export async function handleFirebaseRedirectResult() {
  console.log('[firebaseClient] handleFirebaseRedirectResult called but redirect flow is disabled (using popup).')
  return null
}

export async function getCurrentUserToken() {
  initFirebaseClient()
  const auth = getAuth()
  
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('[firebaseClient] No current user')
      return null
    }
    
    console.log('[firebaseClient] Current user found:', currentUser.email)
    const firebaseIdToken = await currentUser.getIdToken(true)
    return { currentUser, firebaseIdToken }
  } catch (err: any) {
    console.error('[firebaseClient] Error getting current user token:', err?.message)
    return null
  }
}

export async function signOutFirebase() {
  initFirebaseClient()
  const auth = getAuth()
  try {
    await firebaseSignOut(auth)
    console.log('[firebaseClient] Signed out Firebase client')
  } catch (err: any) {
    console.error('[firebaseClient] Error signing out Firebase client:', err?.message)
  }
}
