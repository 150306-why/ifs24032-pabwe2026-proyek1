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

describe('ScheduleCard', () => {
  it('menampilkan rute, kapal, sisa kursi, dan tautan ke detail', () => {
    const wrapper = mount(ScheduleCard, {
      props: { schedule },
      global: { stubs: { RouterLink: { props: ['to'], template: '<a :data-to="JSON.stringify(to)"><slot /></a>' } } },
    });
    const text = wrapper.text();
    expect(text).toContain('Ajibata → Tomok');
    expect(text).toContain('KMP Toba Sejahtera');
    expect(text).toContain('Sisa 3 kursi');
    expect(wrapper.find('a').attributes('data-to')).toContain('"id":7');
  });
});
