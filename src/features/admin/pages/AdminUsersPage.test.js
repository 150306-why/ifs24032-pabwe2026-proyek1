import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { findByText, mountWithApp, squash } from '@/test-utils';

vi.mock('@/features/admin/api/adminApi', () => ({ fetchAdminUsers: vi.fn(), resourceApi: vi.fn(() => ({})) }));

import { fetchAdminUsers } from '@/features/admin/api/adminApi';
import AdminUsersPage from './AdminUsersPage.vue';

const USERS = {
  items: [
    { id: 1, name: 'Admin', email: 'admin@tobatix.test', role: 'admin', bookings: 0, spent: 0 },
    { id: 2, name: 'Budi', email: 'budi@test.com', role: 'customer', bookings: 3, spent: 96000 },
  ],
  pagination: { page: 1, limit: 10, total: 2 },
};

const render = async () => {
  const app = await mountWithApp(AdminUsersPage, { route: '/admin/users' });
  await flushPromises();
  return app;
};

describe('AdminUsersPage', () => {
  beforeEach(() => { vi.resetAllMocks(); fetchAdminUsers.mockResolvedValue(USERS); });

  it('menampilkan pengguna dengan peran, jumlah booking, dan total belanja', async () => {
    const { wrapper } = await render();
    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].text()).toContain('Admin');
    expect(squash(rows[1].text())).toContain('Pelanggan3Rp96.000');
    expect(fetchAdminUsers).toHaveBeenCalledWith({
      role: undefined, q: undefined, page: 1, limit: 10,
    });
  });

  it('filter peran dan pencarian memuat ulang', async () => {
    const { wrapper } = await render();
    await findByText(wrapper, 'button', 'Pelanggan').trigger('click');
    await flushPromises();
    expect(fetchAdminUsers).toHaveBeenLastCalledWith({
      role: 'customer', q: undefined, page: 1, limit: 10,
    });
    await wrapper.find('input[type="search"]').setValue('bud');
    await wrapper.find('form[role="search"]').trigger('submit');
    await flushPromises();
    expect(fetchAdminUsers).toHaveBeenLastCalledWith({
      role: 'customer', q: 'bud', page: 1, limit: 10,
    });
  });

  it('paginasi dan keadaan kosong', async () => {
    fetchAdminUsers.mockResolvedValue({ ...USERS, pagination: { page: 1, limit: 10, total: 30 } });
    const { wrapper } = await render();
    await findByText(wrapper, 'button', 'Berikutnya').trigger('click');
    await flushPromises();
    expect(fetchAdminUsers).toHaveBeenLastCalledWith({
      role: undefined, q: undefined, page: 2, limit: 10,
    });

    fetchAdminUsers.mockResolvedValue({ items: [], pagination: { page: 1, limit: 10, total: 0 } });
    const empty = await render();
    expect(empty.wrapper.text()).toContain('Tidak ada pengguna yang cocok');
  });
});
