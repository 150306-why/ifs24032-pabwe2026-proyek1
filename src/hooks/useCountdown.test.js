import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useCountdown } from './useCountdown';

/** Memasang composable di dalam komponen agar onBeforeUnmount punya instance. */
function setup(initial) {
  const target = ref(initial);
  let result;
  const wrapper = mount(defineComponent({
    setup() {
      result = useCountdown(target);
      return () => h('div');
    },
  }));
  return { target, wrapper, result };
}

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));
  });
  afterEach(() => { vi.useRealTimers(); });

  const inMs = (ms) => new Date(Date.now() + ms).toISOString();

  it('menampilkan sisa waktu mm:ss dan berkurang tiap detik', () => {
    const { result, wrapper } = setup(inMs(65000));
    expect(result.label.value).toBe('01:05');
    expect(result.expired.value).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(result.label.value).toBe('01:04');
    wrapper.unmount();
  });

  it('expired menjadi true saat waktu habis dan timer berhenti', () => {
    const { result, wrapper } = setup(inMs(3000));
    vi.advanceTimersByTime(3000);
    expect(result.remainingMs.value).toBe(0);
    expect(result.label.value).toBe('00:00');
    expect(result.expired.value).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    wrapper.unmount();
  });

  it('target yang sudah lewat langsung expired tanpa timer', () => {
    const { result, wrapper } = setup(inMs(-5000));
    expect(result.expired.value).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    wrapper.unmount();
  });

  it('target null: 00:00 dan belum dianggap expired', () => {
    const { result, wrapper } = setup(null);
    expect(result.label.value).toBe('00:00');
    expect(result.expired.value).toBe(false);
    wrapper.unmount();
  });

  it('mengganti target memulai ulang hitungan, mengosongkan target menghentikannya', async () => {
    const { result, target, wrapper } = setup(inMs(10000));
    target.value = inMs(120000);
    await nextTick();
    expect(result.label.value).toBe('02:00');

    target.value = null;
    await nextTick();
    expect(result.remainingMs.value).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    wrapper.unmount();
  });

  it('unmount menghentikan timer', () => {
    const { wrapper } = setup(inMs(60000));
    expect(vi.getTimerCount()).toBe(1);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
