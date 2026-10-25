import http from '@/helpers/apiHelper';

/** Verifikasi tiket publik; nama penumpang sudah disamarkan oleh server. */
export const verifyTicket = (code) => http.get(`/tickets/${encodeURIComponent(code)}`).then((r) => r.data.data);
