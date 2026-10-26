import { describe, expect, it } from 'vitest';
import { FORM_MESSAGES, isValidEmail } from './validationHelper';

describe('isValidEmail', () => {
  it('menerima email yang berbentuk benar', () => {
    expect(isValidEmail('budi@test.com')).toBe(true);
    expect(isValidEmail('a.b@mail.example.co.id')).toBe(true);
    expect(isValidEmail('a@b.c')).toBe(true);
  });

  it('menolak kosong, null, dan undefined', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });

  it('menolak yang mengandung spasi', () => {
    expect(isValidEmail('bu di@test.com')).toBe(false);
    expect(isValidEmail(' budi@test.com')).toBe(false);
  });

  it('menolak tanpa "@" atau "@" di awal', () => {
    expect(isValidEmail('budi.test.com')).toBe(false);
    expect(isValidEmail('@test.com')).toBe(false);
  });

  it('menolak domain tanpa titik yang diapit karakter', () => {
    expect(isValidEmail('budi@test')).toBe(false);
    expect(isValidEmail('budi@.com')).toBe(false);
    expect(isValidEmail('budi@test.')).toBe(false);
  });

  it('tetap cepat pada masukan panjang yang berulang', () => {
    const start = Date.now();
    expect(isValidEmail(`${'a@'.repeat(50000)}b`)).toBe(false);
    expect(Date.now() - start).toBeLessThan(500);
  });
});

describe('FORM_MESSAGES', () => {
  it('berisi pesan yang dipakai form', () => {
    expect(FORM_MESSAGES.emailInvalid).toBe('Email tidak valid');
    expect(Object.isFrozen(FORM_MESSAGES)).toBe(true);
  });
});
