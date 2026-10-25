import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useToastStore } from './toastStore';

describe('toast store', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('success dan error menambah notifikasi dengan tipe berbeda', () => {
    const toast = useToastStore();
    toast.success('Berhasil');
    toast.error('Gagal');
    expect(toast.items.map((t) => [t.type, t.message])).toEqual([['success', 'Berhasil'], ['error', 'Gagal']]);
  });

  it('hilang otomatis: sukses 4 detik, error 6 detik', () => {
    const toast = useToastStore();
    toast.success('A');
    toast.error('B');
    vi.advanceTimersByTime(4000);
    expect(toast.items.map((t) => t.message)).toEqual(['B']);
    vi.advanceTimersByTime(2000);
    expect(toast.items).toHaveLength(0);
  });

  it('durasi 0 membuat notifikasi menetap sampai ditutup', () => {
    const toast = useToastStore();
    const id = toast.push('Tetap', 'success', 0);
    vi.advanceTimersByTime(60000);
    expect(toast.items).toHaveLength(1);
    toast.dismiss(id);
    expect(toast.items).toHaveLength(0);
  });
});
