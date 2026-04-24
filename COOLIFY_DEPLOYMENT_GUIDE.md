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

### 3a. Jika muncul error GitHub authentication di Coolify

Contoh error:

```text
fatal: could not read Username for 'https://github.com': No such device or address
```

Artinya Coolify mencoba mengakses repository GitHub lewat **HTTPS**, tetapi repository Anda dibaca sebagai **private** atau Coolify belum punya kredensial untuk clone repository tersebut.

#### Solusi yang benar

Pilih salah satu dari opsi berikut:

1. **Jadikan repository GitHub public**
   - Jika repo memang boleh public, ini cara paling mudah.
   - Setelah itu, di Coolify pilih **Public Repository**.

2. **Gunakan GitHub App / GitHub integration di Coolify**
   - Buka Coolify → `Sources` → tambah GitHub source.
   - Authorize GitHub account/repository Anda.
   - Pilih repo `A-ang/pos` dari source tersebut.
   - Ini adalah opsi yang paling direkomendasikan untuk repo private.

3. **Gunakan SSH repository URL**
   - Ganti URL repo dari:

   ```text
   https://github.com/A-ang/pos
   ```

   menjadi:

   ```text
   git@github.com:A-ang/pos.git
   ```

   - Lalu tambahkan **SSH deploy key** dari Coolify ke GitHub repository:
     - GitHub → Repo → `Settings` → `Deploy keys`
     - tambahkan public key dari Coolify

4. **Gunakan Personal Access Token (PAT)** bila memakai HTTPS private repo
   - Buat GitHub token dengan akses repo read.
   - Simpan token itu di Coolify source/repository authentication.

#### Rekomendasi saya untuk kasus Anda

Karena error menunjukkan Coolify mencoba clone dari URL berikut:

```text
https://github.com/A-ang/pos
```

maka kemungkinan besar repo Anda **private** dan Coolify belum dihubungkan ke GitHub source yang benar.

Solusi tercepat:
- jika repo private → pakai **GitHub source integration** atau **SSH deploy key**
- jika repo public → pastikan URL repo di Coolify benar dan pilih mode **Public Repository**

### 4. Strategi Deploy yang Disarankan
Repo ini paling mudah dideploy memakai **Docker Compose** karena sudah memiliki:
- `web-frontend`
- `api-backend`
- `db-postgres`

Di Coolify:
- pilih **Docker Compose** deployment,
- arahkan ke file `docker-compose.yml` di root repo.

> **Penting:** jangan deploy repo ini sebagai **Application / Nixpacks Node app**.
> Jika Coolify mendeteksi `Found application type: node` lalu menjalankan `nixpacks`, berarti tipe resource yang dipilih salah.
> Repo ini adalah **multi-service app** (frontend + backend + postgres), jadi harus dijalankan sebagai **Docker Compose resource**.

### 4a. Jika Coolify masih mencoba build dengan Nixpacks

Tanda-tandanya biasanya seperti ini:

```text
Found application type: node
RUN pnpm i --frozen-lockfile
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH
```

Ini berarti Coolify sedang memperlakukan repo sebagai aplikasi Node tunggal, bukan stack Docker Compose.

#### Solusi

1. Hapus resource deploy lama yang bertipe **Application** / **Nixpacks**.
2. Buat resource baru di Coolify dengan tipe **Docker Compose**.
3. Pilih repository `A-ang/pos`.
4. Set branch ke `main`.
5. Gunakan file: `docker-compose.yml`.
6. Deploy ulang.

#### Kenapa error `pnpm --frozen-lockfile` muncul?

Karena Nixpacks mencoba menjalankan install root monorepo seperti aplikasi Node biasa.
Padahal repo ini sudah disiapkan untuk deployment lewat Docker service berikut:
- `web-frontend`
- `api-backend`
- `db-postgres`

Jadi error lockfile itu **gejala**, bukan akar masalah utama.
Akar masalahnya adalah **mode deploy di Coolify salah**.

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

---

# Tutorial Deploy Langsung ke VPS Tanpa Coolify

Panduan ini cocok kalau Anda ingin deploy langsung ke VPS Linux memakai Docker Compose.

## 1. Spesifikasi minimum VPS

Rekomendasi minimum:

- OS: Ubuntu 22.04 / 24.04
- RAM: minimal 2 GB, disarankan 4 GB
- CPU: 2 core
- Storage: minimal 20 GB
- Port yang dibuka:
  - `22` untuk SSH
  - `80` untuk HTTP
  - `443` untuk HTTPS

> Untuk keamanan, nanti port `5432` sebaiknya **jangan dibuka ke publik**.

## 2. Login ke VPS

Dari komputer lokal:

```bash
ssh root@IP_VPS_ANDA
```

Atau jika memakai user biasa:

```bash
ssh username@IP_VPS_ANDA
```

## 3. Install Docker dan Docker Compose

Jalankan di VPS:

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg lsb-release git

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker
docker --version
docker compose version
```

## 4. Clone repository

Masuk ke direktori kerja misalnya `/opt`:

```bash
cd /opt
git clone https://github.com/A-ang/pos.git
cd pos
```

Jika repo private, gunakan SSH atau PAT.

## 5. Siapkan environment production

Buat file `.env` di root project:

```bash
cp .env.example .env
nano .env
```

Isi minimal yang disarankan:

```env
POSTGRES_DB=pos_rental
POSTGRES_USER=pos_user
POSTGRES_PASSWORD=GANTI_PASSWORD_DB_YANG_AMAN
DATABASE_URL=postgres://pos_user:GANTI_PASSWORD_DB_YANG_AMAN@db-postgres:5432/pos_rental?sslmode=disable
API_PORT=8080
WEB_PORT=3000
```

> Catatan: `docker-compose.yml` Anda saat ini masih memakai default env hardcoded untuk Postgres/backend. Jika ingin production lebih aman, saya sarankan next step kita ubah compose supaya membaca `.env` sepenuhnya.

## 6. Cara update aplikasi di VPS setelah ada perubahan dari Git

Setelah Anda push perubahan terbaru ke repository, login ke VPS lalu jalankan langkah berikut:

```bash
cd /opt/pos
git pull origin main
docker compose down
docker compose up -d --build
```

Jika Anda ingin update tanpa mematikan semua service terlalu lama, bisa pakai:

```bash
cd /opt/pos
git pull origin main
docker compose up -d --build
```

## 7. Verifikasi setelah update

Sesudah update, cek container:

```bash
docker compose ps
```

Cek log jika ada error:

```bash
docker compose logs -f --tail=100
```

Cek health backend:

```bash
curl http://localhost:8080/api/healthz
```

## 8. Jika update gagal

Kalau ada container gagal jalan:

```bash
docker compose logs api-backend
docker compose logs web-frontend
docker compose logs db-postgres
```

Kalau image/build bermasalah, bersihkan lalu build ulang:

```bash
docker compose down
docker system prune -af
docker compose up -d --build
```

## 9. Rekomendasi workflow update production

Urutan yang aman:

1. Kerjakan perubahan di lokal
2. Jalankan test/build lokal
3. Commit dan push ke GitHub
4. Login ke VPS
5. `git pull origin main`
6. `docker compose up -d --build`
7. Verifikasi web, login, reservasi, transaksi, dan laporan

## 10. Pengamanan login dan integrasi Cloudflare

Untuk meningkatkan keamanan, sistem sekarang mendukung verifikasi **Cloudflare Turnstile** pada halaman login.

Tambahkan environment berikut di VPS / Coolify:

```env
TURNSTILE_SECRET_KEY=isi_dengan_secret_key_cloudflare
VITE_TURNSTILE_SITE_KEY=isi_dengan_site_key_cloudflare
```

### Langkah setup Cloudflare Turnstile

1. Login ke dashboard Cloudflare.
2. Buka menu **Turnstile**.
3. Buat site baru.
4. Tambahkan domain aplikasi Anda.
5. Salin:
   - **Site Key** → isi ke `VITE_TURNSTILE_SITE_KEY`
   - **Secret Key** → isi ke `TURNSTILE_SECRET_KEY`
6. Redeploy aplikasi.

### Efek keamanan yang ditambahkan

- Login dapat diproteksi verifikasi Cloudflare.
- Cookie session backend dibuat lebih ketat (`HttpOnly`, `SameSite=Strict`, dan `Secure` saat HTTPS aktif).
- Session frontend dipaksa per-tab, sehingga saat tab ditutup user akan diminta login kembali.
- Tombol logout dibuat lebih jelas di desktop dan mobile.

## 11. Kenapa data hilang saat redeploy dan apa yang sudah diperbaiki

Sebelumnya backend Go memakai data **in-memory**, sehingga setiap restart container data kembali ke seed awal.

Sekarang sudah mulai dimigrasikan agar backend Go bisa:

- membaca data dari PostgreSQL saat startup,
- menyimpan perubahan utama ke PostgreSQL untuk data inti seperti:
  - users,
  - partners,
  - vehicles,
  - customers,
  - bookings,
  - transactions,
  - maintenance logs,
  - activity logs.

Artinya setelah update ini, data tidak lagi hanya bergantung pada memory proses.

### Penting

- PostgreSQL harus aktif dan sehat.
- `DATABASE_URL` harus benar.
- Volume `postgres-data` **jangan dihapus** kalau tidak ingin data hilang.

Jangan jalankan ini di production jika ingin data tetap ada:

```bash
docker compose down -v
```

Karena flag `-v` akan menghapus volume database.

### Cara update aman di VPS tanpa menghapus data

```bash
cd /opt/pos
git pull origin main
docker compose up -d --build
```

Kalau mau restart service, gunakan:

```bash
cd /opt/pos
docker compose down
docker compose up -d --build
```

**Jangan** pakai `down -v` kecuali Anda memang ingin reset database.

## 6. Jalankan aplikasi

Di root project VPS:

```bash
docker compose up -d --build
```

Cek status:

```bash
   docker compose ps
```

Kalau normal, hasilnya akan menunjukkan:

- `web-frontend` up
- `api-backend` up
- `db-postgres` up

## 7. Verifikasi aplikasi

Cek backend:

```bash
curl http://localhost:8080/api/healthz
```

Harus mengembalikan JSON seperti:

```json
{"service":"api-backend-golang","status":"ok"}
```

Cek frontend:

```bash
curl -I http://localhost:3000
```

Cek tabel database:

```bash
docker exec db-postgres psql -U postgres -d pos_rental -c "\dt"
```

## 8. Jika database belum membuat tabel otomatis

Jalankan manual:

```bash
cat db/init/001_schema.sql | docker exec -i db-postgres psql -U postgres -d pos_rental
```

Lalu cek lagi:

```bash
docker exec db-postgres psql -U postgres -d pos_rental -c "\dt"
```

## 9. Pasang Nginx reverse proxy di VPS

Supaya domain bisa diakses tanpa port `3000`, install Nginx di host VPS:

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

Buat config:

```bash
nano /etc/nginx/sites-available/pos-rental
```

Isi contoh:

```nginx
server {
    listen 80;
    server_name domainanda.com www.domainanda.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan:

```bash
ln -s /etc/nginx/sites-available/pos-rental /etc/nginx/sites-enabled/pos-rental
nginx -t
systemctl reload nginx
```

## 10. Pasang SSL HTTPS dengan Certbot

Install certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

Generate SSL:

```bash
certbot --nginx -d domainanda.com -d www.domainanda.com
```

Ikuti prosesnya sampai selesai.

## 11. Update aplikasi saat ada perubahan dari GitHub

Kalau ada update kode:

```bash
cd /opt/pos
git pull origin main
docker compose up -d --build
```

## 12. Perintah penting untuk maintenance

Lihat log:

```bash
docker compose logs -f
```

Restart service:

```bash
docker compose restart
```

Stop semua service:

```bash
docker compose down
```

Reset total termasuk volume database:

```bash
docker compose down -v
docker compose up -d --build
```

## 13. Rekomendasi keamanan production

- Ganti password default Postgres
- Jangan expose port `5432` ke internet
- Gunakan domain + HTTPS
- Jalankan firewall:

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

- Backup volume database secara berkala

## 14. Catatan penting arsitektur saat ini

Walaupun PostgreSQL sudah berjalan, backend Go saat ini masih dominan memakai data in-memory untuk operasi aplikasi. Jadi:

- aplikasi bisa jalan,
- frontend bisa dibuka,
- backend health check aman,
- database bisa dibuat,

tetapi persistensi penuh aplikasi ke PostgreSQL belum sepenuhnya dipindahkan ke backend Go.

Kalau Anda mau, langkah berikutnya saya bisa bantu:

1. buatkan `docker-compose.prod.yml` yang lebih aman,
2. ubah `docker-compose.yml` agar pakai `.env` penuh,
3. atau setup Nginx + domain + HTTPS yang siap production.