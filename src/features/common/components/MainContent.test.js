import { describe, expect, it } from 'vitest';
import { mountWithApp } from '@/test-utils';
import MainContent from './MainContent.vue';

describe('MainContent', () => {
  it('membungkus RouterView dalam <main id="main"> sebagai target tautan lewati konten', async () => {
    const { wrapper } = await mountWithApp(MainContent);
    const main = wrapper.find('main#main');
    expect(main.exists()).toBe(true);
    expect(wrapper.findAll('main')).toHaveLength(1);
  });

  it('meneruskan class dari pemanggil ke elemen <main>', async () => {
    const { wrapper } = await mountWithApp(MainContent, { global: {}, props: { class: 'mx-auto px-4' } });
    expect(wrapper.find('main#main').classes()).toEqual(expect.arrayContaining(['mx-auto', 'px-4']));
  });
});
