import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createPinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from './App.vue';

async function render(path = '/') {
  localStorage.clear();
  const Page = defineComponent({ render: () => h('p', 'Isi halaman uji') });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Page },
      { path: '/masuk', component: Page, meta: { layout: 'bare' } },
      { path: '/admin', component: Page, meta: { layout: 'admin' } },
      { path: '/:pathMatch(.*)*', component: Page },
    ],
  });
  router.push(path);
  await router.isReady();
  const wrapper = mount(App, { global: { plugins: [createPinia(), router] } });
  await flushPromises();
  return wrapper;
}

describe('App', () => {
  it('menyusun header, konten halaman aktif, dan footer', async () => {
    const wrapper = await render();
    expect(wrapper.find('header').text()).toContain('Toba Tix');
    expect(wrapper.find('main#main').text()).toBe('Isi halaman uji');
    expect(wrapper.find('footer').text()).toContain('Data jadwal dan harga hanyalah contoh');
  });

  it('menyediakan tautan lewati ke konten utama untuk aksesibilitas', async () => {
    const wrapper = await render();
    const skip = wrapper.find('a[href="#main"]');
    expect(skip.exists()).toBe(true);
    expect(skip.text()).toBe('Lewati ke konten');
  });

  it('layout bare (halaman masuk) tanpa header dan footer situs', async () => {
    const wrapper = await render('/masuk');
    expect(wrapper.find('header').exists()).toBe(false);
    expect(wrapper.find('footer').exists()).toBe(false);
    expect(wrapper.find('main#main').text()).toBe('Isi halaman uji');
  });

  it('layout admin memakai sidebar menu admin, bukan header publik', async () => {
    const wrapper = await render('/admin');
    expect(wrapper.find('header').exists()).toBe(false);
    expect(wrapper.find('nav[aria-label="Menu admin"]').exists()).toBe(true);
    expect(wrapper.find('main#main').text()).toBe('Isi halaman uji');
  });
});
