import { isSupabaseProvider } from '@/lib/database-provider';
import * as mysqlAuthStore from '@/lib/mysql-auth-store';
import * as supabaseAuthStore from '@/lib/supabase-auth-store';

const store = isSupabaseProvider() ? supabaseAuthStore : mysqlAuthStore;

export const getUserByEmail = store.getUserByEmail;
export const getUserById = store.getUserById;
export const listUsers = store.listUsers;
export const deleteUserById = store.deleteUserById;
export const upsertUser = store.upsertUser;
export const updateUserPasswordHash = store.updateUserPasswordHash;
export const createSession = store.createSession;
export const getSessionByTokenHash = store.getSessionByTokenHash;
export const touchSession = store.touchSession;
export const deleteSessionByTokenHash = store.deleteSessionByTokenHash;
export const deleteSessionsByUserId = store.deleteSessionsByUserId;
export const deleteExpiredSessions = store.deleteExpiredSessions;
export const createPasswordResetToken = store.createPasswordResetToken;
export const getPasswordResetTokenByHash = store.getPasswordResetTokenByHash;
export const markPasswordResetTokenUsed = store.markPasswordResetTokenUsed;
export const deleteExpiredPasswordResetTokens = store.deleteExpiredPasswordResetTokens;
