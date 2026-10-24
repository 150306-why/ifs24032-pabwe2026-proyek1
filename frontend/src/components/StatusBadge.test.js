import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import StatusBadge from './StatusBadge.vue';

describe('StatusBadge', () => {
  it.each([
    ['pending', 'Menunggu pembayaran'],
    ['paid', 'Lunas'],
    ['cancelled', 'Dibatalkan'],
  ])('menampilkan label untuk %s', (status, label) => {
    expect(mount(StatusBadge, { props: { status } }).text()).toBe(label);
  });
});
