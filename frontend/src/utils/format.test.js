import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatDateTime, formatDuration, formatRupiah, formatTime, todayInput, toLocalInput,
} from './format';

describe('format', () => {
  it('formatRupiah memakai pemisah ribuan Indonesia', () => {
    expect(formatRupiah(20000).replace(/\s/g, '')).toBe('Rp20.000');
    expect(formatRupiah(null)).toBe('-');
    expect(formatRupiah(undefined)).toBe('-');
    expect(formatRupiah(0).replace(/\s/g, '')).toBe('Rp0');
  });

  it('formatDuration', () => {
    expect(formatDuration(60)).toBe('1 jam');
    expect(formatDuration(90)).toBe('1 jam 30 mnt');
    expect(formatDuration(30)).toBe('30 mnt');
    expect(formatDuration(0)).toBe('');
  });

  it('formatTime memakai zona WIB', () => {
    expect(formatTime('2026-10-25T01:00:00.000Z').replace(':', '.')).toBe('08.00');
  });

  it('formatDateTime memakai zona WIB dan akhiran WIB', () => {
    const text = formatDateTime('2026-10-25T01:00:00.000Z');
    expect(text).toMatch(/WIB$/);
    expect(text).toContain('2026');
    expect(text.replace(':', '.')).toContain('08.00');
  });
});

describe('format tanggal input', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('todayInput berformat YYYY-MM-DD sesuai tanggal lokal', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 24, 12, 0, 0));
    expect(todayInput()).toBe('2026-10-24');
  });

  it('toLocalInput mengubah ISO ke nilai datetime-local (waktu lokal)', () => {
    const iso = new Date(2026, 9, 24, 8, 5).toISOString();
    expect(toLocalInput(iso)).toBe('2026-10-24T08:05');
  });
});
