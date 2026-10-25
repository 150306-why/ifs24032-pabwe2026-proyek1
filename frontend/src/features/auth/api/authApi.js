import http from '@/helpers/apiHelper';

const quiet = { skipAuthRedirect: true };

export const login = (payload) => http.post('/auth/login', payload, quiet).then((r) => r.data.data);
export const register = (payload) => http.post('/auth/register', payload, quiet).then((r) => r.data.data);
export const fetchMe = () => http.get('/auth/me').then((r) => r.data.data);
export const updateProfile = (payload) => http.put('/auth/profile', payload).then((r) => r.data.data);
export const changePassword = (payload) => http.put('/auth/password', payload).then((r) => r.data);
