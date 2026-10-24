const TZ = 'Asia/Jakarta';

/** 20000 -> "Rp20.000" */
export function formatRupiah(value) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

/** ISO -> "Sab, 24 Okt 2026, 08.00 WIB" */
export function formatDateTime(iso) {
  const text = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: TZ,
  }).format(new Date(iso));
  return `${text} WIB`;
}

/** ISO -> "08.00" */
export function formatTime(iso) {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date(iso));
}

/** 90 -> "1 jam 30 mnt" */
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} jam` : '', m ? `${m} mnt` : ''].filter(Boolean).join(' ');
}

/** Tanggal hari ini (lokal) berformat YYYY-MM-DD untuk input date. */
export function todayInput() {
  return new Date().toLocaleDateString('sv-SE');
}

/** ISO -> nilai untuk input datetime-local (waktu lokal browser). */
export function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
