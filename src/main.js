import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { configureHttp } from './helpers/apiHelper';
import { useAuthStore } from './features/auth/states/authStore';
import './index.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);

const auth = useAuthStore();
configureHttp({
  getToken: () => auth.token,
  onUnauthorized: () => {
    auth.logout();
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
  },
});

app.mount('#app');
