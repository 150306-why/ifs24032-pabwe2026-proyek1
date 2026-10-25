import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addMinutes, dateInputFromToday, formatDateInput, formatDateTime, formatDayShort, formatDuration, formatRupiah,
  formatTime, todayInput, toLocalInput,
} from './formatHelper';

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

describe('format tanggal untuk pencarian', () => {
  it('addMinutes menambah menit pada waktu ISO', () => {
    expect(addMinutes('2030-01-01T01:00:00.000Z', 90)).toBe('2030-01-01T02:30:00.000Z');
  });

  it('formatDayShort memakai zona WIB', () => {
    expect(formatDayShort('2030-01-01T20:00:00.000Z')).toContain('2 Jan');
  });

  it('formatDateInput tidak bergeser zona waktu', () => {
    expect(formatDateInput('2030-01-15')).toContain('15 Jan');
  });

  it('dateInputFromToday menambah hari dari hari ini', () => {
    expect(dateInputFromToday()).toBe(todayInput());
    const base = new Date(`${todayInput()}T12:00:00`);
    base.setDate(base.getDate() + 3);
    expect(dateInputFromToday(3)).toBe(base.toLocaleDateString('sv-SE'));
  });
});
