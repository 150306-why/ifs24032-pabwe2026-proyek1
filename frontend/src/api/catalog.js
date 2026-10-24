import http from './http';

export const fetchPorts = () => http.get('/ports').then((r) => r.data.data);
export const fetchSchedules = (params) => http.get('/schedules', { params }).then((r) => r.data.data);
export const fetchSchedule = (id) => http.get(`/schedules/${id}`).then((r) => r.data.data);
