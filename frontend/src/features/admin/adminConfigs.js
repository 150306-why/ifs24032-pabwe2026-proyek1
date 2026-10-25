import { resourceApi } from '@/features/admin/api/adminApi';
import { formatDateTime, formatRupiah, toLocalInput } from '@/helpers/formatHelper';

const BOAT_TYPES = [
  { value: 'ferry', label: 'Ferry' },
  { value: 'speedboat', label: 'Speedboat' },
  { value: 'wisata', label: 'Wisata' },
];
const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Sumber pilihan untuk field select yang mereferensi resource lain. */
export const OPTION_SOURCES = {
  ports: { api: resourceApi('/ports'), label: (r) => r.name },
  boats: { api: resourceApi('/boats'), label: (r) => `${r.name} (${r.capacity} kursi)` },
  routes: { api: resourceApi('/routes'), label: (r) => `${r.origin.name} → ${r.destination.name}` },
};

const toNumber = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));

/**
 * Konfigurasi tiap halaman admin. View generik membaca konfigurasi ini
 * sehingga tidak perlu satu komponen per resource (DRY).
 */
export const RESOURCES = {
  ports: {
    title: 'Pelabuhan',
    icon: 'anchor',
    singular: 'pelabuhan',
    api: resourceApi('/ports'),
    columns: [{ key: 'name', label: 'Nama', value: (r) => r.name }],
    fields: [{ key: 'name', label: 'Nama pelabuhan', type: 'text' }],
    emptyForm: () => ({ name: '' }),
    toForm: (r) => ({ name: r.name }),
    toPayload: (f) => ({ name: f.name.trim() }),
  },
  boats: {
    title: 'Kapal',
    icon: 'ship',
    singular: 'kapal',
    api: resourceApi('/boats'),
    columns: [
      { key: 'name', label: 'Nama', value: (r) => r.name },
      { key: 'type', label: 'Tipe', value: (r) => r.type, kind: 'pill', tone: () => 'blue' },
      { key: 'capacity', label: 'Kapasitas', value: (r) => r.capacity },
    ],
    fields: [
      { key: 'name', label: 'Nama kapal', type: 'text' },
      { key: 'type', label: 'Tipe', type: 'select', options: BOAT_TYPES },
      { key: 'capacity', label: 'Kapasitas', type: 'number', min: 1 },
    ],
    emptyForm: () => ({ name: '', type: '', capacity: '' }),
    toForm: (r) => ({ name: r.name, type: r.type, capacity: r.capacity }),
    toPayload: (f) => ({ name: f.name.trim(), type: f.type, capacity: toNumber(f.capacity) }),
  },
  routes: {
    title: 'Rute',
    icon: 'route',
    singular: 'rute',
    api: resourceApi('/routes'),
    columns: [
      { key: 'route', label: 'Rute', value: (r) => `${r.origin.name} → ${r.destination.name}` },
      { key: 'duration', label: 'Durasi', value: (r) => `${r.duration_min} mnt` },
      { key: 'fares', label: 'Dewasa / Anak', value: (r) => `${formatRupiah(r.fares.dewasa)} / ${formatRupiah(r.fares.anak)}` },
    ],
    fields: [
      { key: 'origin_port_id', label: 'Asal', type: 'select', optionsFrom: 'ports' },
      { key: 'destination_port_id', label: 'Tujuan', type: 'select', optionsFrom: 'ports' },
      { key: 'duration_min', label: 'Durasi (menit)', type: 'number', min: 1 },
      { key: 'fare_dewasa', label: 'Tarif dewasa (Rp)', type: 'number', min: 0 },
      { key: 'fare_anak', label: 'Tarif anak (Rp)', type: 'number', min: 0 },
    ],
    emptyForm: () => ({ origin_port_id: '', destination_port_id: '', duration_min: '', fare_dewasa: '', fare_anak: '' }),
    toForm: (r) => ({
      origin_port_id: r.origin.id,
      destination_port_id: r.destination.id,
      duration_min: r.duration_min,
      fare_dewasa: r.fares.dewasa,
      fare_anak: r.fares.anak,
    }),
    toPayload: (f) => ({
      origin_port_id: toNumber(f.origin_port_id),
      destination_port_id: toNumber(f.destination_port_id),
      duration_min: toNumber(f.duration_min),
      fares: { dewasa: toNumber(f.fare_dewasa), anak: toNumber(f.fare_anak) },
    }),
  },
  schedules: {
    title: 'Jadwal',
    icon: 'calendar',
    singular: 'jadwal',
    paginated: true, // server berpaginasi, urut keberangkatan terbaru
    api: resourceApi('/schedules', '/schedules/admin/list'),
    columns: [
      { key: 'route', label: 'Rute', value: (r) => `${r.route.origin.name} → ${r.route.destination.name}` },
      { key: 'boat', label: 'Kapal', value: (r) => r.boat.name },
      { key: 'departure', label: 'Berangkat', value: (r) => formatDateTime(r.departure_at) },
      { key: 'seats', label: 'Terisi', value: (r) => `${r.booked}/${r.capacity}` },
      {
        key: 'status',
        label: 'Status',
        value: (r) => r.status,
        kind: 'pill',
        tone: (r) => ({ open: 'green', closed: 'amber', cancelled: 'gray' }[r.status] || 'gray'),
      },
    ],
    fields: [
      { key: 'route_id', label: 'Rute', type: 'select', optionsFrom: 'routes', createOnly: true },
      { key: 'boat_id', label: 'Kapal', type: 'select', optionsFrom: 'boats' },
      { key: 'departure_at', label: 'Waktu berangkat', type: 'datetime-local' },
      { key: 'capacity', label: 'Kapasitas (kosong = kapasitas kapal)', type: 'number', min: 1 },
      { key: 'status', label: 'Status', type: 'select', options: STATUSES, editOnly: true },
    ],
    emptyForm: () => ({ route_id: '', boat_id: '', departure_at: '', capacity: '', status: 'open' }),
    toForm: (r) => ({
      route_id: r.route.id,
      boat_id: r.boat.id,
      departure_at: toLocalInput(r.departure_at),
      capacity: r.capacity,
      status: r.status,
    }),
    toPayload: (f, isEdit) => {
      const base = {
        boat_id: toNumber(f.boat_id),
        departure_at: f.departure_at ? new Date(f.departure_at).toISOString() : undefined,
        capacity: toNumber(f.capacity),
      };
      return isEdit ? { ...base, status: f.status } : { ...base, route_id: toNumber(f.route_id) };
    },
  },
};
