import { isSupabaseProvider } from '@/lib/database-provider';
import * as mysqlStore from '@/lib/mysql-store';
import * as supabaseStore from '@/lib/supabase-store';

function getStore() {
	return isSupabaseProvider() ? supabaseStore : mysqlStore;
}

async function checkAndExpireBooking(booking: any) {
	if (!booking) return null;

	const isPending = ['pending', 'pending_payment'].includes(String(booking.status || '').toLowerCase()) ||
		['pending', 'pending_payment'].includes(String(booking.paymentStatus || '').toLowerCase());

	if (isPending && booking.createdAt) {
		const createdTime = new Date(booking.createdAt).getTime();
		const tenMinutes = 10 * 60 * 1000;

		if (Date.now() - createdTime > tenMinutes) {
			// Expired! Update database
			booking.status = 'rejected';
			booking.paymentStatus = 'cancelled';
			try {
				await getStore().updateBooking(booking.id, {
					status: 'rejected',
					paymentStatus: 'cancelled'
				});
			} catch (err) {
				console.error(`Failed to auto-expire booking ${booking.id}:`, err);
			}
		}
	}
	return booking;
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

export async function listBookings(...args: Parameters<typeof mysqlStore.listBookings>) {
	const bookings = await getStore().listBookings(...args);
	const updatedBookings = await Promise.all(bookings.map((b) => checkAndExpireBooking(b)));
	return updatedBookings.filter(Boolean);
}

export async function getBookingById(...args: Parameters<typeof mysqlStore.getBookingById>) {
	const booking = await getStore().getBookingById(...args);
	return checkAndExpireBooking(booking);
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

export function deleteBookingsByTourId(...args: Parameters<typeof mysqlStore.deleteBookingsByTourId>) {
	return getStore().deleteBookingsByTourId(...args);
}
