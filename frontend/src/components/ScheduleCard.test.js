import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ScheduleCard from './ScheduleCard.vue';

const schedule = {
  id: 7,
  departure_at: '2026-10-25T01:00:00.000Z',
  duration_min: 60,
  seats_left: 3,
  boat: { name: 'KMP Toba Sejahtera' },
  route: { origin: { name: 'Ajibata' }, destination: { name: 'Tomok' } },
  fares: { dewasa: 20000, anak: 12000 },
};

const RouterLink = { props: ['to'], template: '<a :data-to="JSON.stringify(to)"><slot /></a>' };
const render = (override = {}) => mount(ScheduleCard, {
  props: { schedule: { ...schedule, ...override } },
  global: { stubs: { RouterLink } },
});

describe('ScheduleCard', () => {
  it('menampilkan rute, kapal, sisa kursi, dan tautan ke detail', () => {
    const wrapper = render();
    const text = wrapper.text();
    expect(text).toContain('Ajibata → Tomok');
    expect(text).toContain('KMP Toba Sejahtera');
    expect(text).toContain('Sisa 3 kursi');
    expect(text).toContain('1 jam');
    expect(wrapper.find('a').attributes('data-to')).toContain('"id":7');
  });

  it('menampilkan harga dewasa dalam rupiah', () => {
    expect(render().text().replace(/\s/g, '')).toContain('Rp20.000');
  });

  it('sisa kursi sedikit ditandai merah, banyak berwarna netral', () => {
    const few = render({ seats_left: 5 }).findAll('p').find((p) => p.text().startsWith('Sisa'));
    expect(few.classes()).toContain('text-red-700');
    const many = render({ seats_left: 50 }).findAll('p').find((p) => p.text().startsWith('Sisa'));
    expect(many.classes()).toContain('text-slate-600');
  });
});
