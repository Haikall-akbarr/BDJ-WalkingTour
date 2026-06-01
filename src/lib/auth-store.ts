import { isSupabaseProvider } from '@/lib/database-provider';
import * as mysqlAuthStore from '@/lib/mysql-auth-store';
import * as supabaseAuthStore from '@/lib/supabase-auth-store';

function getStore() {
	return isSupabaseProvider() ? supabaseAuthStore : mysqlAuthStore;
}

export function getUserByEmail(...args: Parameters<typeof mysqlAuthStore.getUserByEmail>) {
	return getStore().getUserByEmail(...args);
}

export function getUserById(...args: Parameters<typeof mysqlAuthStore.getUserById>) {
	return getStore().getUserById(...args);
}

export function listUsers(...args: Parameters<typeof mysqlAuthStore.listUsers>) {
	return getStore().listUsers(...args);
}

export function deleteUserById(...args: Parameters<typeof mysqlAuthStore.deleteUserById>) {
	return getStore().deleteUserById(...args);
}

export function upsertUser(...args: Parameters<typeof mysqlAuthStore.upsertUser>) {
	return getStore().upsertUser(...args);
}

export function updateUserPasswordHash(...args: Parameters<typeof mysqlAuthStore.updateUserPasswordHash>) {
	return getStore().updateUserPasswordHash(...args);
}

export function createSession(...args: Parameters<typeof mysqlAuthStore.createSession>) {
	return getStore().createSession(...args);
}

export function getSessionByTokenHash(...args: Parameters<typeof mysqlAuthStore.getSessionByTokenHash>) {
	return getStore().getSessionByTokenHash(...args);
}

export function touchSession(...args: Parameters<typeof mysqlAuthStore.touchSession>) {
	return getStore().touchSession(...args);
}

export function deleteSessionByTokenHash(...args: Parameters<typeof mysqlAuthStore.deleteSessionByTokenHash>) {
	return getStore().deleteSessionByTokenHash(...args);
}

export function deleteSessionsByUserId(...args: Parameters<typeof mysqlAuthStore.deleteSessionsByUserId>) {
	return getStore().deleteSessionsByUserId(...args);
}

export function deleteExpiredSessions(...args: Parameters<typeof mysqlAuthStore.deleteExpiredSessions>) {
	return getStore().deleteExpiredSessions(...args);
}

export function createPasswordResetToken(...args: Parameters<typeof mysqlAuthStore.createPasswordResetToken>) {
	return getStore().createPasswordResetToken(...args);
}

export function getPasswordResetTokenByHash(...args: Parameters<typeof mysqlAuthStore.getPasswordResetTokenByHash>) {
	return getStore().getPasswordResetTokenByHash(...args);
}

export function markPasswordResetTokenUsed(...args: Parameters<typeof mysqlAuthStore.markPasswordResetTokenUsed>) {
	return getStore().markPasswordResetTokenUsed(...args);
}

export function deleteExpiredPasswordResetTokens(...args: Parameters<typeof mysqlAuthStore.deleteExpiredPasswordResetTokens>) {
	return getStore().deleteExpiredPasswordResetTokens(...args);
}
