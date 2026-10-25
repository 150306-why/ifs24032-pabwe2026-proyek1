import { describe, expect, it } from 'vitest';
import { mountWithApp } from '@/test/helpers';
import { useToastStore } from '@/features/common/states/toastStore';
import ToastHost from './ToastHost.vue';

describe('ToastHost', () => {
  it('menampilkan notifikasi dengan role sesuai tipe dan bisa ditutup', async () => {
    const { wrapper, pinia } = await mountWithApp(ToastHost);
    const toast = useToastStore(pinia);
    toast.push('Tersimpan', 'success', 0);
    toast.push('Gagal simpan', 'error', 0);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="status"]').text()).toContain('Tersimpan');
    expect(wrapper.find('[role="alert"]').text()).toContain('Gagal simpan');

    await wrapper.find('button[aria-label="Tutup notifikasi"]').trigger('click');
    expect(wrapper.text()).not.toContain('Tersimpan');
  });
});
