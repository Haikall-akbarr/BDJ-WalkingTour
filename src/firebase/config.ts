
function requireFirebaseEnv(name: string) {
  const value = process.env[name as keyof NodeJS.ProcessEnv];

  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${name}. Set it in .env.local and in Vercel.`);
  }

  return value;
}

export const firebaseConfig = {
  apiKey: requireFirebaseEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: requireFirebaseEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: requireFirebaseEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: requireFirebaseEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requireFirebaseEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requireFirebaseEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
};
