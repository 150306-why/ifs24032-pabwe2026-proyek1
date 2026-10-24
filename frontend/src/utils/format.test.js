import { describe, expect, it } from 'vitest';
import { formatDuration, formatRupiah, formatTime } from './format';

describe('format', () => {
  it('formatRupiah memakai pemisah ribuan Indonesia', () => {
    expect(formatRupiah(20000).replace(/\s/g, '')).toBe('Rp20.000');
    expect(formatRupiah(null)).toBe('-');
  });

  it('formatDuration', () => {
    expect(formatDuration(60)).toBe('1 jam');
    expect(formatDuration(90)).toBe('1 jam 30 mnt');
    expect(formatDuration(30)).toBe('30 mnt');
  });

  it('formatTime memakai zona WIB', () => {
    expect(formatTime('2026-10-25T01:00:00.000Z').replace(':', '.')).toBe('08.00');
  });
});
