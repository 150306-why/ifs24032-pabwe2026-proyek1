# Skrip Video Demo (target 6 sampai 8 menit)

Persiapan sebelum merekam: hapus folder `toba-tix` lokal, siapkan dua terminal kosong, buka browser baru, tutup notifikasi, pastikan Node 20+ dan Git terpasang. Rekam layar dengan suara.

| Menit | Langkah | Yang diucapkan / ditunjukkan |
|---|---|---|
| 0:00 | Pembukaan | Nama, NIM, judul "Toba Tix", tujuan aplikasi. |
| 0:30 | `git clone <URL-REPO>` lalu `cd toba-tix` | Tunjukkan struktur folder: backend, frontend, Jenkinsfile, README. |
| 1:00 | Backend: `cd backend`, `npm install`, `cp .env.example .env` | Buka `.env`, isi JWT_SECRET dan password seed (sensor password di layar). |
| 2:00 | `npm run db:seed`, `npm run dev` | Tunjukkan pesan server hidup; buka `http://localhost:3000/api/health` di browser. |
| 2:45 | Terminal baru: `cd frontend`, `npm install`, `cp .env.example .env`, `npm run dev` | Buka `http://localhost:5173`. |
| 3:30 | Customer: Daftar akun baru, lalu Masuk | Tunjukkan validasi form (email salah, password pendek). |
| 4:15 | Beranda: pilih Ajibata, Tomok, tanggal, Cari | Hasil kartu jadwal: kapal, jam, durasi, harga, sisa kursi. |
| 4:45 | Pilih jadwal, tambah 2 penumpang (dewasa dan anak) | Total berubah live; tekan Pesan. |
| 5:30 | Halaman pembayaran | Tunjukkan hitung mundur, tekan Bayar. Lihat tiket dengan QR. |
| 6:00 | Admin: logout, login admin | Kelola jadwal (tambah satu jadwal), tunjukkan menu rute/kapal/pelabuhan. |
| 6:45 | Admin: Check-in | Masukkan kode tiket: ditolak jika bukan hari keberangkatan (jelaskan aturan). |
| 7:15 | `npm test` backend (dan frontend) | Tunjukkan semua test lulus, sebut kasus kursi habis dan cancel. |
| 7:45 | Jenkins (tangkapan layar atau layar langsung) dan URL online | Tunjukkan build hijau dan aplikasi online terbuka. |
| 8:00 | Penutup | Ringkas fitur dan tautan di deskripsi video. |

Isi deskripsi YouTube: URL repo, URL aplikasi online, daftar langkah dan waktu (chapter).
