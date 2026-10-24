import { describe, expect, it } from 'vitest';
import { useAsync } from './useAsync';

describe('useAsync', () => {
  it('sukses: menyimpan data dan mengembalikannya', async () => {
    const task = useAsync(async (a, b) => a + b);
    expect(task.loading.value).toBe(false);
    const promise = task.run(1, 2);
    expect(task.loading.value).toBe(true);
    await expect(promise).resolves.toBe(3);
    expect(task.data.value).toBe(3);
    expect(task.error.value).toBe('');
    expect(task.loading.value).toBe(false);
  });

  it('gagal: menyimpan pesan error ramah pengguna dan mengembalikan null', async () => {
    const task = useAsync(async () => {
      throw Object.assign(new Error('x'), { response: { data: { message: 'Gagal memuat' } } });
    });
    await expect(task.run()).resolves.toBeNull();
    expect(task.error.value).toBe('Gagal memuat');
    expect(task.loading.value).toBe(false);
  });

  it('error jaringan memakai pesan bawaan; run berikutnya membersihkan error', async () => {
    let fail = true;
    const task = useAsync(async () => {
      if (fail) throw new Error('Network Error');
      return 'pulih';
    });
    await task.run();
    expect(task.error.value).toBe('Tidak dapat terhubung ke server. Coba lagi.');
    fail = false;
    await task.run();
    expect(task.error.value).toBe('');
    expect(task.data.value).toBe('pulih');
  });
});
