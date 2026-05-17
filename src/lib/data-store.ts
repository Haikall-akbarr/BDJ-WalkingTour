import { isSupabaseProvider } from '@/lib/database-provider';
import * as mysqlStore from '@/lib/mysql-store';
import * as supabaseStore from '@/lib/supabase-store';

const store = isSupabaseProvider() ? supabaseStore : mysqlStore;

export const listTours = store.listTours;
export const getTourById = store.getTourById;
export const createTour = store.createTour;
export const updateTour = store.updateTour;
export const deleteTour = store.deleteTour;
export const listBookings = store.listBookings;
export const getBookingById = store.getBookingById;
export const getBookingByAttendanceCode = store.getBookingByAttendanceCode;
export const createBooking = store.createBooking;
export const updateBooking = store.updateBooking;
