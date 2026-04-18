import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { FieldValue, getFirestore, initializeFirestore, type Firestore } from 'firebase-admin/firestore';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env.local' });

let firestoreInstance: Firestore | null = null;

function normalizePrivateKey(privateKey?: string) {
  return privateKey?.replace(/\\n/g, '\n');
}

function getProjectId() {
  if (process.env.FIREBASE_ADMIN_PROJECT_ID) return process.env.FIREBASE_ADMIN_PROJECT_ID;
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (process.env.FIREBASE_CONFIG) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_CONFIG);
      if (typeof parsed?.projectId === 'string' && parsed.projectId) {
        return parsed.projectId;
      }
    } catch {
      // Ignore malformed FIREBASE_CONFIG; downstream checks handle missing projectId.
    }
  }

  return undefined;
}

function getServiceAccountFromEnv() {
  const rawServiceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64;

  if (rawServiceAccount) {
    try {
      const decoded = rawServiceAccount.trim().startsWith('{')
        ? rawServiceAccount
        : Buffer.from(rawServiceAccount, 'base64').toString('utf8');

      const parsed = JSON.parse(decoded);
      return {
        projectId: parsed.project_id || parsed.projectId,
        clientEmail: parsed.client_email || parsed.clientEmail,
        privateKey: normalizePrivateKey(parsed.private_key || parsed.privateKey),
      };
    } catch {
      // Ignore invalid JSON/base64 and fallback to split env vars.
    }
  }

  return {
    projectId: getProjectId(),
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
  };
}

function getDatabaseUrl() {
  return process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
}

function syncGoogleProjectEnv(projectId?: string) {
  if (!projectId) return;
  if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = projectId;
  if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = projectId;
}

function getOrInitAdminApp(): App {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const projectId = getProjectId();
  const databaseURL = getDatabaseUrl();
  syncGoogleProjectEnv(projectId);
  const { clientEmail, privateKey } = getServiceAccountFromEnv();

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
      ...(databaseURL ? { databaseURL } : {}),
    });
  }

  if (projectId) {
    return initializeApp({
      projectId,
      ...(databaseURL ? { databaseURL } : {}),
    });
  }

  return initializeApp(databaseURL ? { databaseURL } : undefined);
}

export function getServerFirestore(): Firestore {
  if (firestoreInstance) return firestoreInstance;

  const app = getOrInitAdminApp();
  const projectId = getProjectId();

  firestoreInstance = projectId
    ? initializeFirestore(app, { projectId })
    : getFirestore(app);

  return firestoreInstance;
}

export function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

export function isFirebaseAdminUnavailableError(error: unknown) {
  const message = (error as any)?.message || '';
  return (
    typeof message === 'string' &&
    (message.includes('Could not load the default credentials') ||
      message.includes('Unable to detect a Project Id') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('Missing or insufficient permissions') ||
      message.includes('UNAUTHENTICATED') ||
      message.includes('invalid_grant'))
  );
}
