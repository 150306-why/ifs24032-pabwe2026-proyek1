import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,AAAA') } }));

import BoardingPass from './BoardingPass.vue';

const schedule = {
  departure_at: '2030-01-01T01:00:00.000Z', origin: 'Ajibata', destination: 'Tomok', boat_name: 'KMP Toba Sejahtera',
};
const ticket = {
  passenger_name: 'Budi', category: 'dewasa', price: 20000, code: 'TK-AAA', checked_in_at: null,
};
const render = (props = {}) => mount(BoardingPass, { props: { ticket, schedule, ...props } });

describe('BoardingPass', () => {
  it('menampilkan penumpang, rute, kapal, tarif, dan kode tiket', () => {
    const text = render().text().replace(/\s/g, '');
    expect(text).toContain('Budi');
    expect(text).toContain('Ajibata');
    expect(text).toContain('Tomok');
    expect(text).toContain('KMPTobaSejahtera');
    expect(text).toContain('Rp20.000');
    expect(text).toContain('TK-AAA');
    expect(render().find('article').attributes('aria-label')).toBe('Tiket Budi');
  });

  it('perkiraan tiba hanya muncul bila durasi diketahui', () => {
    expect(render().text()).not.toContain('tiba');
    expect(render({ durationMin: 60 }).text()).toContain('tiba ±09.00 WIB');
  });

  it('status check-in dan petunjuk', () => {
    expect(render().text()).toContain('Tunjukkan saat naik kapal');
    expect(render({ ticket: { ...ticket, checked_in_at: '2030-01-01T01:30:00.000Z' } }).text()).toContain('Sudah check-in');
  });
});
