import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BrandMark from './BrandMark.vue';

describe('BrandMark', () => {
  it('menampilkan nama merek; varian terang berteks putih', () => {
    expect(mount(BrandMark).text()).toBe('Toba Tix');
    expect(mount(BrandMark).classes()).toContain('text-lake-900');
    expect(mount(BrandMark, { props: { light: true } }).classes()).toContain('text-white');
  });
});
