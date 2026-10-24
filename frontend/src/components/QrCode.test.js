import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn() },
}));

import QRCode from 'qrcode';
import QrCode from './QrCode.vue';

describe('QrCode', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    QRCode.toDataURL.mockResolvedValue('data:image/png;base64,AAAA');
  });

  it('membuat gambar QR dari nilai dengan ukuran bawaan 180', async () => {
    const wrapper = mount(QrCode, { props: { value: 'TK-123' } });
    await flushPromises();
    expect(QRCode.toDataURL).toHaveBeenCalledWith('TK-123', { width: 180, margin: 1 });
    const img = wrapper.find('img');
    expect(img.attributes('src')).toBe('data:image/png;base64,AAAA');
    expect(img.attributes('alt')).toBe('Kode QR tiket TK-123');
    expect(img.attributes('width')).toBe('180');
    expect(img.attributes('height')).toBe('180');
  });

  it('ukuran dapat diatur', async () => {
    const wrapper = mount(QrCode, { props: { value: 'TK-1', size: 120 } });
    await flushPromises();
    expect(QRCode.toDataURL).toHaveBeenCalledWith('TK-1', { width: 120, margin: 1 });
    expect(wrapper.find('img').attributes('width')).toBe('120');
  });

  it('gambar belum tampil sebelum QR selesai dibuat', () => {
    QRCode.toDataURL.mockReturnValue(new Promise(() => {}));
    const wrapper = mount(QrCode, { props: { value: 'TK-1' } });
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('membuat ulang QR saat nilai berubah', async () => {
    const wrapper = mount(QrCode, { props: { value: 'TK-1' } });
    await flushPromises();
    await wrapper.setProps({ value: 'TK-2' });
    await flushPromises();
    expect(QRCode.toDataURL).toHaveBeenLastCalledWith('TK-2', { width: 180, margin: 1 });
    expect(wrapper.find('img').attributes('alt')).toBe('Kode QR tiket TK-2');
  });
});
