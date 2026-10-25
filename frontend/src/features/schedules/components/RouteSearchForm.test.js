import { describe, expect, it } from 'vitest';
import { mountWithApp } from '@/test-utils';
import RouteSearchForm from './RouteSearchForm.vue';

const PORTS = [{ id: 1, name: 'Ajibata' }, { id: 2, name: 'Tomok' }];
const render = (props = {}) => mountWithApp(RouteSearchForm, { props: { ports: PORTS, ...props } });

describe('RouteSearchForm', () => {
  it('mengisi nilai awal dari prop initial', async () => {
    const { wrapper } = await render({ initial: { origin: '1', destination: '2', date: '2030-02-02' } });
    expect(wrapper.find('#origin').element.value).toBe('1');
    expect(wrapper.find('#destination').element.value).toBe('2');
    expect(wrapper.find('#date').element.value).toBe('2030-02-02');
  });

  it('input valid mengirim event search; tidak valid menampilkan error', async () => {
    const { wrapper } = await render({ submitLabel: 'Ubah pencarian' });
    expect(wrapper.find('button[type="submit"]').text()).toBe('Ubah pencarian');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('search')).toBeUndefined();
    expect(wrapper.text()).toContain('Pilih pelabuhan asal');

    await wrapper.find('#origin').setValue('1');
    await wrapper.find('#destination').setValue('2');
    await wrapper.find('#date').setValue('2030-01-15');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('search')[0][0]).toEqual({ origin: 1, destination: 2, date: '2030-01-15' });
  });
});
