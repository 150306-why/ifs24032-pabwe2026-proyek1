const request = require('supertest');
const { createTestContext, bearer, createSchedule, book, adults } = require('./helpers');

describe('API katalog (pelabuhan, kapal, rute, jadwal)', () => {
  let ctx;
  const asAdmin = (req) => req.set(bearer(ctx.adminToken));
  const asCustomer = (req) => req.set(bearer(ctx.customerToken));

  beforeAll(async () => { ctx = await createTestContext(); });
  afterAll(() => { ctx.db.close(); });

  describe('pelabuhan', () => {
    it('GET /api/ports publik, terurut berdasarkan nama', async () => {
      const res = await request(ctx.app).get('/api/ports');
      expect(res.status).toBe(200);
      const names = res.body.data.map((p) => p.name);
      expect(names).toEqual(expect.arrayContaining(['Ajibata', 'Tomok', 'Tuktuk']));
      expect(names).toEqual([...names].sort());
    });

    it('CRUD lengkap oleh admin', async () => {
      const created = await asAdmin(request(ctx.app).post('/api/ports')).send({ name: 'Pelabuhan Uji' });
      expect(created.status).toBe(201);
      expect(created.body.message).toBe('Pelabuhan berhasil dibuat');
      const { id } = created.body.data;

      const updated = await asAdmin(request(ctx.app).put(`/api/ports/${id}`)).send({ name: 'Pelabuhan Uji 2' });
      expect(updated.status).toBe(200);
      expect(updated.body.data.name).toBe('Pelabuhan Uji 2');
      expect(updated.body.message).toBe('Pelabuhan berhasil diperbarui');

      const removed = await asAdmin(request(ctx.app).delete(`/api/ports/${id}`));
      expect(removed.status).toBe(200);
      expect(removed.body).toEqual({ data: null, message: 'Pelabuhan berhasil dihapus' });

      expect((await asAdmin(request(ctx.app).delete(`/api/ports/${id}`))).status).toBe(404);
    });

    it('nama duplikat -> 409, nama pendek -> 422 dengan detail field', async () => {
      await asAdmin(request(ctx.app).post('/api/ports')).send({ name: 'Pelabuhan Kembar' });
      const dup = await asAdmin(request(ctx.app).post('/api/ports')).send({ name: 'Pelabuhan Kembar' });
      expect(dup.status).toBe(409);
      expect(dup.body.message).toBe('Data sudah ada');

      const invalid = await asAdmin(request(ctx.app).post('/api/ports')).send({ name: 'A' });
      expect(invalid.status).toBe(422);
      expect(invalid.body.errors.name).toBe('Nama minimal 2 karakter');
    });

    it('ubah pelabuhan yang tidak ada -> 404; id bukan angka -> 422', async () => {
      const missing = await asAdmin(request(ctx.app).put('/api/ports/99999')).send({ name: 'Tidak Ada' });
      expect(missing.status).toBe(404);
      expect(missing.body.message).toBe('Pelabuhan tidak ditemukan');
      expect((await asAdmin(request(ctx.app).put('/api/ports/abc')).send({ name: 'Tidak Ada' })).status).toBe(422);
    });

    it('customer tidak boleh mengubah pelabuhan', async () => {
      expect((await asCustomer(request(ctx.app).put('/api/ports/1')).send({ name: 'Diubah' })).status).toBe(403);
      expect((await asCustomer(request(ctx.app).delete('/api/ports/1'))).status).toBe(403);
    });
  });

  describe('kapal', () => {
    it('daftar dan detail hanya untuk admin', async () => {
      expect((await request(ctx.app).get('/api/boats')).status).toBe(401);
      expect((await asCustomer(request(ctx.app).get('/api/boats'))).status).toBe(403);

      const list = await asAdmin(request(ctx.app).get('/api/boats'));
      expect(list.status).toBe(200);
      expect(list.body.data.length).toBeGreaterThanOrEqual(2);

      const detail = await asAdmin(request(ctx.app).get('/api/boats/1'));
      expect(detail.status).toBe(200);
      expect(detail.body.data).toMatchObject({ id: 1, name: 'KMP Toba Sejahtera', type: 'ferry', capacity: 120 });

      const missing = await asAdmin(request(ctx.app).get('/api/boats/99999'));
      expect(missing.status).toBe(404);
      expect(missing.body.message).toBe('Kapal tidak ditemukan');
    });

    it('CRUD lengkap oleh admin', async () => {
      const created = await asAdmin(request(ctx.app).post('/api/boats'))
        .send({ name: 'Boat Uji', type: 'speedboat', capacity: 12 });
      expect(created.status).toBe(201);
      expect(created.body.message).toBe('Kapal berhasil dibuat');
      const { id } = created.body.data;

      const updated = await asAdmin(request(ctx.app).put(`/api/boats/${id}`))
        .send({ name: 'Boat Uji B', type: 'wisata', capacity: 15 });
      expect(updated.status).toBe(200);
      expect(updated.body.data).toMatchObject({ name: 'Boat Uji B', type: 'wisata', capacity: 15 });

      expect((await asAdmin(request(ctx.app).delete(`/api/boats/${id}`))).status).toBe(200);
      expect((await asAdmin(request(ctx.app).get(`/api/boats/${id}`))).status).toBe(404);
    });

    it('validasi tipe dan kapasitas -> 422', async () => {
      const badType = await asAdmin(request(ctx.app).post('/api/boats')).send({ name: 'Boat X', type: 'kano', capacity: 5 });
      expect(badType.status).toBe(422);
      expect(badType.body.errors).toHaveProperty('type');

      const badCapacity = await asAdmin(request(ctx.app).post('/api/boats')).send({ name: 'Boat X', type: 'ferry', capacity: 0 });
      expect(badCapacity.status).toBe(422);
      expect(badCapacity.body.errors).toHaveProperty('capacity');
    });

    it('kapal yang dipakai jadwal tidak bisa dihapus -> 409', async () => {
      const res = await asAdmin(request(ctx.app).delete('/api/boats/1'));
      expect(res.status).toBe(409);
    });
  });

  describe('rute', () => {
    const body = (extra = {}) => ({
      origin_port_id: 3, destination_port_id: 1, duration_min: 90, fares: { dewasa: 30000, anak: 18000 }, ...extra,
    });

    it('GET /api/routes publik berisi pelabuhan dan tarif', async () => {
      const res = await request(ctx.app).get('/api/routes');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      res.body.data.forEach((r) => {
        expect(r.origin.name).toEqual(expect.any(String));
        expect(r.destination.name).toEqual(expect.any(String));
        expect(r.fares.dewasa).toEqual(expect.any(Number));
        expect(r.fares.anak).toEqual(expect.any(Number));
      });
    });

    it('create, update, delete rute beserta tarif', async () => {
      const created = await asAdmin(request(ctx.app).post('/api/routes')).send(body());
      expect(created.status).toBe(201);
      expect(created.body.data).toMatchObject({
        duration_min: 90,
        origin: { id: 3, name: 'Tuktuk' },
        destination: { id: 1, name: 'Ajibata' },
        fares: { dewasa: 30000, anak: 18000 },
      });
      const { id } = created.body.data;

      const updated = await asAdmin(request(ctx.app).put(`/api/routes/${id}`))
        .send(body({ duration_min: 100, fares: { dewasa: 25000, anak: 15000 } }));
      expect(updated.status).toBe(200);
      expect(updated.body.data.duration_min).toBe(100);
      expect(updated.body.data.fares).toEqual({ dewasa: 25000, anak: 15000 });

      expect((await asAdmin(request(ctx.app).delete(`/api/routes/${id}`))).status).toBe(200);
      const list = await request(ctx.app).get('/api/routes');
      expect(list.body.data.find((r) => r.id === id)).toBeUndefined();
    });

    it('rute kembar -> 409', async () => {
      const dup = await asAdmin(request(ctx.app).post('/api/routes')).send(body({ origin_port_id: 1, destination_port_id: 2 }));
      expect(dup.status).toBe(409);
    });

    it('asal sama dengan tujuan -> 422 pada destination_port_id', async () => {
      const res = await asAdmin(request(ctx.app).post('/api/routes')).send(body({ destination_port_id: 3 }));
      expect(res.status).toBe(422);
      expect(res.body.errors.destination_port_id).toBe('Pelabuhan asal dan tujuan tidak boleh sama');
    });

    it('tarif tidak lengkap -> 422; pelabuhan tidak ada -> 409', async () => {
      expect((await asAdmin(request(ctx.app).post('/api/routes')).send(body({ fares: { dewasa: 1000 } }))).status).toBe(422);
      expect((await asAdmin(request(ctx.app).post('/api/routes')).send(body({ destination_port_id: 99999 }))).status).toBe(409);
    });

    it('ubah/hapus rute tidak ada -> 404; rute yang punya jadwal tidak bisa dihapus -> 409', async () => {
      const missing = await asAdmin(request(ctx.app).put('/api/routes/99999')).send(body());
      expect(missing.status).toBe(404);
      expect(missing.body.message).toBe('Rute tidak ditemukan');
      expect((await asAdmin(request(ctx.app).delete('/api/routes/99999'))).status).toBe(404);
      expect((await asAdmin(request(ctx.app).delete('/api/routes/1'))).status).toBe(409);
    });

    it('hanya admin yang boleh membuat rute', async () => {
      expect((await request(ctx.app).post('/api/routes').send(body())).status).toBe(401);
      expect((await asCustomer(request(ctx.app).post('/api/routes')).send(body())).status).toBe(403);
    });
  });

  describe('jadwal (admin)', () => {
    const future = () => new Date(Date.now() + 5 * 24 * 3600e3).toISOString();

    it('GET /api/schedules/admin/list: admin melihat jadwal lampau, publik tidak', async () => {
      ctx.db.prepare(
        "INSERT INTO schedules (route_id, boat_id, departure_at, capacity) VALUES (1, 1, '2020-01-01T00:00:00.000Z', 5)",
      ).run();

      expect((await request(ctx.app).get('/api/schedules/admin/list')).status).toBe(401);
      expect((await asCustomer(request(ctx.app).get('/api/schedules/admin/list'))).status).toBe(403);

      const all = await asAdmin(request(ctx.app).get('/api/schedules/admin/list?limit=50'));
      expect(all.status).toBe(200);
      expect(all.body.data.items[0].departure_at).toBe('2020-01-01T00:00:00.000Z');

      const pub = await request(ctx.app).get('/api/schedules?limit=50');
      pub.body.data.items.forEach((s) => expect(s.departure_at).not.toBe('2020-01-01T00:00:00.000Z'));
    });

    it('GET /api/schedules/:id mengembalikan detail', async () => {
      const res = await request(ctx.app).get('/api/schedules/1');
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.boat).toHaveProperty('name');
    });

    it('create: kapasitas bawaan dari kapal; validasi dan referensi', async () => {
      const ok = await asAdmin(request(ctx.app).post('/api/schedules'))
        .send({ route_id: 1, boat_id: 2, departure_at: future() });
      expect(ok.status).toBe(201);
      expect(ok.body.message).toBe('Jadwal berhasil dibuat');
      expect(ok.body.data.capacity).toBe(20);

      const tooMany = await asAdmin(request(ctx.app).post('/api/schedules'))
        .send({ route_id: 1, boat_id: 2, departure_at: future(), capacity: 21 });
      expect(tooMany.status).toBe(422);
      expect(tooMany.body.message).toBe('Kapasitas melebihi kapasitas kapal');

      const noRoute = await asAdmin(request(ctx.app).post('/api/schedules'))
        .send({ route_id: 999, boat_id: 1, departure_at: future() });
      expect(noRoute.status).toBe(404);
      expect(noRoute.body.message).toBe('Rute tidak ditemukan');

      const badDate = await asAdmin(request(ctx.app).post('/api/schedules'))
        .send({ route_id: 1, boat_id: 1, departure_at: 'besok' });
      expect(badDate.status).toBe(422);
      expect(badDate.body.errors).toHaveProperty('departure_at');
    });

    it('update status, body kosong ditolak, kapasitas melebihi kapal ditolak', async () => {
      const created = await createSchedule(ctx, { capacity: 10 });

      const closed = await asAdmin(request(ctx.app).put(`/api/schedules/${created.id}`)).send({ status: 'closed' });
      expect(closed.status).toBe(200);
      expect(closed.body.data.status).toBe('closed');
      expect(closed.body.message).toBe('Jadwal berhasil diperbarui');

      const empty = await asAdmin(request(ctx.app).put(`/api/schedules/${created.id}`)).send({});
      expect(empty.status).toBe(422);
      expect(empty.body.errors).toBeDefined();

      const tooBig = await asAdmin(request(ctx.app).put(`/api/schedules/${created.id}`)).send({ capacity: 500 });
      expect(tooBig.status).toBe(422);

      expect((await asAdmin(request(ctx.app).put('/api/schedules/99999')).send({ status: 'open' })).status).toBe(404);
    });

    it('kapasitas tidak boleh lebih kecil dari kursi yang sudah dipesan', async () => {
      const created = await createSchedule(ctx, { capacity: 10 });
      await book(ctx, ctx.customerToken, created.id, adults(3));
      const res = await asAdmin(request(ctx.app).put(`/api/schedules/${created.id}`)).send({ capacity: 2 });
      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/lebih kecil/);
    });

    it('hapus jadwal: kosong berhasil, tidak ada 404, sudah dipesan 409', async () => {
      const empty = await createSchedule(ctx, { capacity: 5 });
      const removed = await asAdmin(request(ctx.app).delete(`/api/schedules/${empty.id}`));
      expect(removed.status).toBe(200);
      expect(removed.body.message).toBe('Jadwal berhasil dihapus');
      expect((await asAdmin(request(ctx.app).delete(`/api/schedules/${empty.id}`))).status).toBe(404);

      const booked = await createSchedule(ctx, { capacity: 5 });
      await book(ctx, ctx.customerToken, booked.id, adults(1));
      expect((await asAdmin(request(ctx.app).delete(`/api/schedules/${booked.id}`))).status).toBe(409);
    });
  });
});
