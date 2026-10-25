import http from '@/helpers/apiHelper';

/** CRUD generik untuk resource admin; respons list bisa array atau { items }. */
export function resourceApi(path, listPath = path) {
  const unwrap = (d) => (Array.isArray(d) ? d : d.items);
  return {
    list: () => http.get(listPath, { params: { limit: 50 } }).then((r) => unwrap(r.data.data)),
    create: (payload) => http.post(path, payload).then((r) => r.data.data),
    update: (id, payload) => http.put(`${path}/${id}`, payload).then((r) => r.data.data),
    remove: (id) => http.delete(`${path}/${id}`).then((r) => r.data),
  };
}

export const checkInTicket = (code) => http.post(`/tickets/${encodeURIComponent(code)}/checkin`).then((r) => r.data.data);
