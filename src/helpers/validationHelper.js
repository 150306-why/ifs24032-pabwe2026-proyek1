/** Pesan validasi form bersama (halaman masuk, daftar, dan profil). */
export const FORM_MESSAGES = Object.freeze({
  emailInvalid: 'Email tidak valid',
  secretRequired: 'Password wajib diisi',
  secretTooShort: 'Password minimal 8 karakter',
  currentSecretRequired: 'Password saat ini wajib diisi',
  newSecretTooShort: 'Password baru minimal 8 karakter',
  confirmMismatch: 'Konfirmasi password tidak sama',
});

/**
 * Cek bentuk email sederhana: tanpa spasi, ada "@" setelah minimal 1 karakter,
 * lalu titik yang diapit karakter di bagian domain. Linear, tanpa regex bercabang.
 */
export function isValidEmail(value) {
  const text = String(value ?? '');
  if (text === '' || /\s/.test(text)) return false;
  const at = text.indexOf('@', 1);
  if (at === -1) return false;
  const domain = text.slice(at + 1);
  const dot = domain.indexOf('.', 1);
  return dot !== -1 && dot < domain.length - 1;
}
