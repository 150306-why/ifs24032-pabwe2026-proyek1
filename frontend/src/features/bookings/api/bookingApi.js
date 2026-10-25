import http from '@/helpers/apiHelper';

export const createBooking = (payload) => http.post('/bookings', payload).then((r) => r.data.data);
export const fetchBookings = () => http.get('/bookings').then((r) => r.data.data);
export const fetchBooking = (code) => http.get(`/bookings/${code}`).then((r) => r.data.data);
export const payBooking = (code) => http.post(`/bookings/${code}/pay`).then((r) => r.data.data);
export const cancelBooking = (code) => http.post(`/bookings/${code}/cancel`).then((r) => r.data.data);
