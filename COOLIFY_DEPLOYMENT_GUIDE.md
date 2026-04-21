## Local Docker Deployment

Project ini sekarang bisa dijalankan dengan 3 service utama:

- `db-postgres` — PostgreSQL database
- `api-backend` — backend Go
- `web-frontend` — frontend React/Vite via Nginx

### Jalankan semua service

```bash
docker compose up -d --build
```

### Endpoint default

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api/healthz`
- PostgreSQL: `localhost:5432`

### Catatan database

- Schema database otomatis dibuat dari `db/init/001_schema.sql`
- Inisialisasi ini berjalan saat volume Postgres masih baru / pertama kali dibuat
- Jika ingin ulang dari nol, hapus volume terlebih dulu:

```bash
docker compose down -v
docker compose up -d --build
```
## Tutorial Deploy POS Rental ke VPS Self-Hosted Coolify

### 1. Persiapan VPS
- Gunakan VPS Linux dengan Docker Engine aktif.
- Pastikan domain/subdomain sudah diarahkan ke IP VPS.
- Buka port `80`, `443`, dan jika perlu `8000`/`8080` hanya untuk testing internal.

### 2. Install Coolify
- Install Coolify di VPS mengikuti installer resmi.
- Setelah selesai, login ke dashboard Coolify dan buat project baru.

### 3. Hubungkan Repository
- Push repo ini ke GitHub/GitLab/private git server.
- Di Coolify, pilih **New Resource > Application > Public Repository** atau private repository.
- Set branch deployment, misalnya `main`.

### 4. Strategi Deploy yang Disarankan
Repo ini paling mudah dideploy memakai **Docker Compose** karena sudah memiliki:
- `web-frontend`
- `api-backend`
- `db-postgres`

Di Coolify:
- pilih **Docker Compose** deployment,
- arahkan ke file `docker-compose.yml` di root repo.

### 5. Environment yang Perlu Diperhatikan
Secara default compose memakai:
- frontend di port `3000:80`
- backend di port `8080:8080`
- postgres di port `5432:5432`

Untuk production di Coolify:
- expose hanya service frontend ke domain publik,
- biarkan backend dan database tetap internal network bila memungkinkan,
- ubah credential database default.

Minimal environment yang perlu diganti:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- jika nanti backend Express dipakai lagi: `SESSION_SECRET`

Contoh `DATABASE_URL`:

```env
postgres://app_user:password_aman@db-postgres:5432/pos_rental?sslmode=disable
```

### 6. Catatan Penting Arsitektur Saat Ini
- Frontend saat ini diarahkan ke backend Go mock/in-memory.
- Data backend Go **belum persisten** walaupun PostgreSQL tersedia di compose.
- Jika container backend Go restart, data in-memory akan reset ke seed awal.

Artinya untuk production sungguhan Anda perlu salah satu opsi berikut:
- lanjutkan migrasi backend Go ke PostgreSQL,
- atau sementara aktifkan backend Express lama yang sudah lebih dekat ke database/session PostgreSQL.

### 7. Langkah Deploy di Coolify
1. Buat resource Docker Compose.
2. Pilih repository dan branch.
3. Set build context ke root repo.
4. Gunakan file `docker-compose.yml`.
5. Tambahkan environment production yang aman.
6. Deploy.
7. Setelah running, hubungkan domain ke service frontend.

### 8. Verifikasi Setelah Deploy
Periksa:
- frontend terbuka normal,
- login berhasil,
- endpoint health backend merespons,
- pembuatan reservasi berjalan,
- invoice dapat dicetak,
- laporan menampilkan biaya antar jemput.

Health check backend:

```bash
curl https://domain-anda/api/healthz
```

### 9. Rekomendasi Hardening Production
- Ganti semua password default.
- Jangan expose PostgreSQL langsung ke internet.
- Tambahkan backup volume PostgreSQL terjadwal.
- Gunakan domain dengan HTTPS aktif dari Coolify.
- Pisahkan environment staging dan production.

### 10. Checklist Migrasi
- [ ] Repository sudah dipush ke git remote
- [ ] Docker Compose berhasil build di lokal
- [ ] Credential production sudah diganti
- [ ] Domain/subdomain sudah diarahkan
- [ ] Coolify project dan application sudah dibuat
- [ ] Service frontend, backend, database sehat
- [ ] Uji login, reservasi, transaksi, cetak invoice, laporan

Jika Anda mau, setelah ini saya bisa lanjut bantu membuatkan **versi docker-compose khusus production untuk Coolify** yang lebih aman dan rapi.