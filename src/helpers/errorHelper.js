/** Pesan error ramah pengguna dari error axios. */
export function getErrorMessage(err) {
  return err?.response?.data?.message || 'Tidak dapat terhubung ke server. Coba lagi.';
}

/** Error per field dari respons 422: { email: "..." } */
export function getFieldErrors(err) {
  return err?.response?.data?.errors || {};
}
