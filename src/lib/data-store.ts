import { isSupabaseProvider } from '@/lib/database-provider';
import * as mysqlStore from '@/lib/mysql-store';
import * as supabaseStore from '@/lib/supabase-store';

function getStore() {
	return isSupabaseProvider() ? supabaseStore : mysqlStore;
}

export function listTours(...args: Parameters<typeof mysqlStore.listTours>) {
	return getStore().listTours(...args);
}

export function getTourById(...args: Parameters<typeof mysqlStore.getTourById>) {
	return getStore().getTourById(...args);
}

export function createTour(...args: Parameters<typeof mysqlStore.createTour>) {
	return getStore().createTour(...args);
}

export function updateTour(...args: Parameters<typeof mysqlStore.updateTour>) {
	return getStore().updateTour(...args);
}

export function deleteTour(...args: Parameters<typeof mysqlStore.deleteTour>) {
	return getStore().deleteTour(...args);
}

export function listBookings(...args: Parameters<typeof mysqlStore.listBookings>) {
	return getStore().listBookings(...args);
}

export function getBookingById(...args: Parameters<typeof mysqlStore.getBookingById>) {
	return getStore().getBookingById(...args);
}

export function getBookingByAttendanceCode(...args: Parameters<typeof mysqlStore.getBookingByAttendanceCode>) {
	return getStore().getBookingByAttendanceCode(...args);
}

export function createBooking(...args: Parameters<typeof mysqlStore.createBooking>) {
	return getStore().createBooking(...args);
}

export function updateBooking(...args: Parameters<typeof mysqlStore.updateBooking>) {
	return getStore().updateBooking(...args);
}
