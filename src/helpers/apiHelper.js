import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
});

let getToken = () => null;
let handleUnauthorized = () => {};

/** Dipasang dari main.js agar http.js tidak bergantung langsung pada store/router (hindari import melingkar). */
export function configureHttp(options) {
  getToken = options.getToken;
  handleUnauthorized = options.onUnauthorized;
}

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 pada login/register ditangani form (skipAuthRedirect), selain itu sesi dianggap habis.
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) handleUnauthorized();
    return Promise.reject(error);
  },
);

export default http;
