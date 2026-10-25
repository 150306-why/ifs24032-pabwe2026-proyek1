import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PaginationBar from './PaginationBar.vue';

const render = (props) => mount(PaginationBar, { props });
const btn = (w, text) => w.findAll('button').find((b) => b.text() === text);

describe('PaginationBar', () => {
  it('menampilkan rentang data dan nomor halaman', () => {
    const wrapper = render({ page: 2, limit: 10, total: 25 });
    expect(wrapper.text()).toContain('Menampilkan 11–20 dari 25');
    expect(wrapper.text()).toContain('Halaman 2 / 3');
  });

  it('halaman pertama menonaktifkan Sebelumnya, terakhir menonaktifkan Berikutnya', () => {
    const first = render({ page: 1, limit: 10, total: 25 });
    expect(btn(first, 'Sebelumnya').attributes('disabled')).toBeDefined();
    expect(btn(first, 'Berikutnya').attributes('disabled')).toBeUndefined();
    const last = render({ page: 3, limit: 10, total: 25 });
    expect(btn(last, 'Berikutnya').attributes('disabled')).toBeDefined();
  });

  it('mengirim event change dengan halaman tujuan', async () => {
    const wrapper = render({ page: 2, limit: 10, total: 50 });
    await btn(wrapper, 'Berikutnya').trigger('click');
    await btn(wrapper, 'Sebelumnya').trigger('click');
    expect(wrapper.emitted('change')).toEqual([[3], [1]]);
  });

  it('total 0 menampilkan 0–0 dan satu halaman', () => {
    const wrapper = render({ page: 1, limit: 10, total: 0 });
    expect(wrapper.text()).toContain('Menampilkan 0–0 dari 0');
    expect(wrapper.text()).toContain('Halaman 1 / 1');
  });

  it('halaman terakhir terpotong menampilkan batas atas yang benar', () => {
    expect(render({ page: 3, limit: 10, total: 25 }).text()).toContain('21–25 dari 25');
  });
});
