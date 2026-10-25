import { describe, expect, it } from 'vitest';
import { getErrorMessage, getFieldErrors } from './errorHelper';

describe('helpers/errorHelper', () => {
  it('getErrorMessage memakai pesan dari server', () => {
    expect(getErrorMessage({ response: { data: { message: 'Email sudah terdaftar' } } })).toBe('Email sudah terdaftar');
  });

  it('getErrorMessage fallback bila tidak ada respons', () => {
    const fallback = 'Tidak dapat terhubung ke server. Coba lagi.';
    expect(getErrorMessage(new Error('Network Error'))).toBe(fallback);
    expect(getErrorMessage(undefined)).toBe(fallback);
    expect(getErrorMessage({ response: { data: {} } })).toBe(fallback);
  });

  it('getFieldErrors mengambil detail per field atau objek kosong', () => {
    expect(getFieldErrors({ response: { data: { errors: { email: 'salah' } } } })).toEqual({ email: 'salah' });
    expect(getFieldErrors(new Error('x'))).toEqual({});
    expect(getFieldErrors(null)).toEqual({});
  });
});
