# PRD Alignment Status

## Sudah disesuaikan
- Frontend React + TypeScript tetap aktif dan UI sudah diarahkan ke PRD V2.
- Menu/fokus fitur: Mitra, Armada, Reservasi, Transaksi, Laporan, Maintenance, Pengguna.
- Docker deployment dasar ditambahkan melalui `docker-compose.yml`.
- Struktur monorepo mulai dirapikan ke `apps/web`, `apps/api-go`, dan `lib/db`.
- Scaffold backend Golang tersedia di `apps/api-go`.

## Gap yang masih tersisa
- Snapshot backend Node lama masih tersisa di `artifacts/api-server` dan belum sepenuhnya dipindahkan/dihapus.
- Backend Golang yang baru masih berupa scaffold endpoint dan health check, belum berisi business logic penuh dan query PostgreSQL.
- Integrasi PostgreSQL schema/query dari implementasi Node ke Golang belum dipindahkan.
- Pembersihan folder `artifacts/` lama masih diperlukan setelah semua file tidak lagi terkunci editor/tooling.

## Prioritas implementasi berikutnya
1. Migrasi endpoint vehicles/customers/bookings/transactions/reports ke Gin.
2. Pindahkan akses PostgreSQL ke Golang (`database/sql` + query layer / sqlc / gorm).
3. Tambahkan auth + RBAC di backend Golang.
4. Ubah frontend agar consume backend Golang sebagai backend utama.
