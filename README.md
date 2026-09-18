# Daymoment

Daymoment adalah aplikasi undangan pernikahan digital dengan frontend React/Vite, API Hono pada Cloudflare Workers, database PostgreSQL Supabase, dan penyimpanan foto/musik di Cloudflare R2.

Tampilan dan alur Puspa Jawi dipertahankan dari versi PHP: katalog, preview paket, order, pembayaran demo, editor sembilan langkah, live preview, daftar tamu personal, publish, template undangan, RSVP/ucapan, musik, galeri, dan multi rekening.

## Teknologi

- React 19 + Vite untuk frontend.
- Hono/JavaScript untuk backend Node-compatible di Cloudflare Workers.
- Supabase PostgreSQL untuk seluruh data relasional.
- Supabase Realtime untuk memperbarui undangan dan ucapan tanpa refresh manual.
- Cloudflare R2 untuk gasfoto cover, foto mempelai, galeri, dan musik.
- Workers Static Assets untuk HTML, CSS, JavaScript, gambar template, dan SPA routing.

## Persiapan

Butuh Node.js 20 atau lebih baru, akun Cloudflare, dan project Supabase.

1. Pasang dependency:

   ```bash
   npm install
   ```

2. Buka Supabase SQL Editor. Jalankan berurutan:

   - `database/schema.sql`
   - `database/seed.sql`

   File `schema.sql` membuat ulang tabel dan bersifat destruktif. Gunakan hanya pada database baru atau setelah backup.

   Jika database sudah dibuat sebelum integrasi Midtrans Snap, jangan jalankan ulang `schema.sql`. Jalankan sekali `database/migrations/2026_09_17_midtrans_snap.sql`.

3. Buat bucket R2:

   ```bash
   npx wrangler login
   npx wrangler r2 bucket create daymoment-media
   npx wrangler r2 bucket create daymoment-media-preview
   ```

4. Isi URL Supabase pada `wrangler.toml` bagian `SUPABASE_URL`. Untuk lokal, buat `.dev.vars`:

   ```dotenv
   SUPABASE_URL=https://PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=service-role-key
   APP_URL=http://localhost:8080
   MIDTRANS_SERVER_KEY=
   MIDTRANS_CLIENT_KEY=
   MIDTRANS_IS_PRODUCTION=false
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=email-pengirim@gmail.com
   SMTP_APP_PASSWORD=app-password-16-karakter
   SMTP_FROM_NAME=Daymoment by Daysheet Group
   ```

   Salin `.env.example` menjadi `.env.local`, lalu isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari Supabase Project Settings. Keduanya memang aman digunakan browser dan hanya mendapat akses baca yang dibatasi RLS. Jangan pernah memasukkan service-role key ke variabel `VITE_*`.

   Jangan memakai nama variabel berawalan `VITE_` untuk service-role Supabase atau server key Midtrans. Variabel `VITE_` ikut masuk ke bundle browser.

5. Untuk production, simpan rahasia melalui Cloudflare:

   ```bash
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx wrangler secret put MIDTRANS_SERVER_KEY
   npx wrangler secret put MIDTRANS_CLIENT_KEY
   npx wrangler secret put SMTP_USER
   npx wrangler secret put SMTP_APP_PASSWORD
   ```

   Pembayaran memakai Midtrans Snap. Worker membuat Snap token dengan Server Key, memverifikasi status langsung ke Midtrans, dan menerima notifikasi pada `/api/payments/midtrans/notification`. Editor hanya dapat diakses setelah status pembayaran `paid`.

   Email konfirmasi order dikirim langsung melalui Gmail SMTP TLS port 465. Aktifkan 2-Step Verification pada akun Google, buat App Password khusus Daymoment, lalu simpan App Password hanya di `.dev.vars` atau Cloudflare Secret. Jangan memakai password Gmail utama.

6. Ganti `APP_URL` di `wrangler.toml` menjadi URL production, misalnya `https://daymoment.example.com` atau URL `workers.dev` yang diberikan Cloudflare.

## Menjalankan secara lokal

Jalankan backend Worker pada terminal pertama:

```bash
npm run dev:worker
```

Jalankan frontend Vite pada terminal kedua:

```bash
npm run dev
```

Buka `http://localhost:8080`. Vite meneruskan `/api` dan `/media` ke Worker pada port 8787.

## Deploy Cloudflare

```bash
npm run deploy
```

Perintah tersebut membangun React ke `dist`, kemudian Wrangler mengunggah bundle Worker beserta static assets. Route `/api/*` dan `/media/*` dijalankan oleh Worker; file tampilan dilayani langsung sebagai static assets agar tidak menghabiskan kuota request dinamis.

## Struktur utama

```text
src/                 React pages dan komponen
worker/              Hono API untuk Cloudflare Workers
public/assets/       CSS, animasi lama, gambar, dan ornamen Puspa Jawi
database/schema.sql  Struktur PostgreSQL Supabase
database/seed.sql    Template dan paket awal
wrangler.toml        Konfigurasi Worker, assets, dan R2
```

## Catatan migrasi data lama

Skema lama memakai MySQL sedangkan versi ini memakai PostgreSQL. Jangan mengimpor dump MySQL langsung ke Supabase. Buat skema PostgreSQL terlebih dahulu, ekspor data lama ke CSV per tabel, lalu impor dengan urutan:

1. `templates`
2. `template_packages`
3. `orders`
4. `invitations`
5. `payments`, `invitation_media`, `gift_accounts`, `invitation_guests`, dan `guest_messages`

Nilai `id` dan foreign key harus dipertahankan. Berkas pada `public/uploads` lama perlu diunggah ke R2 dan kolom path diperbarui menjadi key R2 seperti `invitations/12/cover-uuid.webp`.

## Keamanan

- Browser hanya berkomunikasi dengan Worker; service-role Supabase tidak pernah dikirim ke frontend.
- Seluruh tabel mengaktifkan RLS tanpa policy publik. Worker mengakses database menggunakan service-role.
- Foto dan musik disimpan pada bucket R2 privat dan disajikan melalui route `/media/*`.
- Tautan editor menggunakan token acak 64 karakter dan harus dijaga tetap pribadi.
