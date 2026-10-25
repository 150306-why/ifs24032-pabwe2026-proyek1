import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import LakeScene from './LakeScene.vue';

describe('LakeScene', () => {
  it('dekoratif: tersembunyi dari pembaca layar, posisi kapal dan matahari bisa diatur', () => {
    const wrapper = mount(LakeScene, { props: { ferryX: 500, sunX: 100 } });
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('.ferry').attributes('transform')).toBe('translate(500 372)');
    expect(wrapper.find('circle').attributes('cx')).toBe('100');
  });

  it('varian gelap untuk panel admin', () => {
    expect(mount(LakeScene, { props: { dark: true } }).html()).toContain('#07222d');
  });
});
