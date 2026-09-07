# Temuara — Platform Undangan Pernikahan Digital

**Tempat kisah baik dimulai.**

Temuara adalah platform undangan digital end-to-end dengan PHP native, MySQL, HTML/CSS, dan JavaScript vanilla. Project ini mencakup pemilihan template, order, placeholder pembayaran, editor bertahap, live preview, autosave, upload foto, publish ke URL personal, serta form kehadiran dan ucapan.

## Fitur

- Satu template aktif **Puspa Jawi** dengan art direction Jawa botanical, split-screen desktop, animasi awan, dan layout mobile-first.
- Order dengan validasi nomor Indonesia dan token editor 256-bit dari fungsi random_bytes.
- Placeholder pembayaran yang siap diganti integrasi gateway.
- Builder tujuh tahap, responsive, live preview iframe dan postMessage.
- Autosave Fetch API dengan debounce satu detik dan indikator status.
- Kompresi foto via Canvas (maksimal 1600px) serta validasi MIME server.
- Slug unik, reserved slug, dan saran otomatis seperti andi-2.
- Publish dan URL publik, termasuk parameter aman ?to=Bapak+Budi.
- RSVP/ucapan AJAX, output escaped, batas 500 karakter, dan rate limit sesi.
- PDO prepared statements, CSRF untuk seluruh POST, cookie session HttpOnly/SameSite.

## Requirement

- PHP **8.0 atau lebih baru**. Direkomendasikan PHP 8.2.
- Ekstensi PHP: pdo_mysql, mbstring, fileinfo, session.
- MySQL 8.0.
- Apache dengan mod_rewrite untuk deployment Apache.

Tidak diperlukan Composer, Node.js, framework, atau package pihak ketiga.

## Instalasi lokal

### 1. Buat database

Masuk ke MySQL lalu buat database:

~~~sql
CREATE DATABASE undangan_digital
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
~~~

Import schema dan seed dari terminal:

~~~bash
mysql -u root -p undangan_digital < database/schema.sql
mysql -u root -p undangan_digital < database/seed.sql
~~~

> **Peringatan:** schema.sql menghapus enam tabel project sebelum membuatnya ulang. Gunakan pada database baru atau lakukan backup terlebih dahulu.

Alternatif: buka phpMyAdmin, pilih database undangan_digital, lalu import database/schema.sql dan setelahnya database/seed.sql.

### 2. Konfigurasi

Salin file contoh.

PowerShell:

~~~powershell
Copy-Item config/config.example.php config/config.php
~~~

Linux/macOS:

~~~bash
cp config/config.example.php config/config.php
~~~

Edit config/config.php:

~~~php
'app' => [
    'base_url' => 'http://localhost:8080',
    'timezone' => 'Asia/Jakarta',
    'debug' => true,
],
'database' => [
    'host' => '127.0.0.1',
    'port' => 3306,
    'name' => 'undangan_digital',
    'username' => 'root',
    'password' => 'PASSWORD_LOKAL_ANDA',
    'charset' => 'utf8mb4',
],
~~~

config/config.php diabaikan oleh Git agar kredensial tidak masuk repository. Jika file tersebut belum ada, aplikasi memakai nilai development dari config.example.php.

### 3. Jalankan

Dari root project:

~~~bash
php -S localhost:8080 -t public public/router.php
~~~

Buka:

- Homepage: http://localhost:8080/
- Preview: http://localhost:8080/template/puspa_jawi
- Contoh URL setelah publish: http://localhost:8080/andi
- Contoh nama tamu: http://localhost:8080/andi?to=Bapak+Budi

URL editor pribadi dibuat otomatis setelah order dan hanya ditampilkan kepada pemesan.

## Menjalankan dengan XAMPP

1. Pastikan XAMPP memakai PHP 8.0+ dan aktifkan Apache serta MySQL.
2. Letakkan project, misalnya, di C:\xampp\htdocs\web-undangan.
3. Buat database dan import schema/seed melalui phpMyAdmin.
4. Salin config.example.php menjadi config.php; sesuaikan database dan base_url.
5. Cara paling bersih adalah membuat VirtualHost dengan DocumentRoot menuju C:/xampp/htdocs/web-undangan/public.
6. Aktifkan mod_rewrite dengan memastikan baris berikut tidak dikomentari di apache/conf/httpd.conf:

~~~apache
LoadModule rewrite_module modules/mod_rewrite.so
~~~

7. Pada blok Directory untuk document root, gunakan AllowOverride All, lalu restart Apache.

Contoh VirtualHost:

~~~apache
<VirtualHost *:80>
    ServerName undangan.local
    DocumentRoot "C:/xampp/htdocs/web-undangan/public"
    <Directory "C:/xampp/htdocs/web-undangan/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
~~~

Tambahkan 127.0.0.1 undangan.local ke file hosts dan ubah base_url menjadi http://undangan.local.

Jika tidak memakai VirtualHost, root .htaccess project meneruskan request ke public/index.php, sehingga project dapat dibuka dari folder htdocs. Sesuaikan base_url dengan subfolder aktual.

## Deploy ke AeonFree

Per Agustus 2026, situs resmi AeonFree menyebut dukungan PHP 8.2, MySQL 8.0, .htaccess, FTP, dan custom PHP site. Lihat [fitur hosting AeonFree](https://aeonfree.com/) dan [panduan upload custom website](https://kb.aeonfree.com/support/how-to-build-a-website/).

1. Buat hosting account/domain dan database MySQL dari control panel AeonFree.
2. Catat host, nama database, username, dan password yang diberikan. Nama database hosting biasanya tidak sama dengan nama lokal.
3. Import database/schema.sql, lalu database/seed.sql melalui phpMyAdmin hosting.
4. Upload **seluruh isi project** ke folder htdocs menggunakan File Manager atau FTP. Root .htaccess sudah memblokir folder aplikasi dan meneruskan route ke public/index.php.
5. Buat config/config.php dari contoh dan isi kredensial hosting. Atur:

~~~php
'base_url' => 'https://domain-anda.example',
'debug' => false,
~~~

6. Pastikan public/uploads dapat ditulis PHP (umumnya permission folder 755 atau 775, tergantung server).
7. Pastikan file .htaccess ikut terunggah; beberapa FTP client menyembunyikan dotfile.
8. Buka homepage, buat satu order demo, upload foto, publish, lalu uji URL slug.

Jangan menaruh kredensial asli di config.example.php atau commit Git.

## Struktur utama

~~~text
app/
  Controllers/       HTTP controller dan endpoint API
  Repositories/      Seluruh akses data PDO
  Services/          Order, undangan, slug, upload, payment stub
  Views/             Homepage, order, builder, dan template publik
  Helpers/           CSRF, response, validation, URL, upload
config/              Konfigurasi contoh dan koneksi PDO
database/            schema.sql dan seed.sql
public/
  assets/            CSS, JavaScript, SVG original
  uploads/           Foto pengguna; eksekusi script dinonaktifkan
  index.php          Front controller/router
  router.php         Router PHP built-in server
storage/logs/        Log error aplikasi
storage/sessions/    File sesi PHP di luar document root
tests/smoke.php      Smoke test tanpa dependency
~~~

## PaymentService

Pembayaran masih berupa placeholder. app/Services/PaymentService.php menyediakan dua titik integrasi:

- createTransaction(array $order)
- handleNotification(array $payload)

Saat ini order dibuat dengan status waiting_payment, payment pending, lalu tombol Mode Demo hanya mengubah order menjadi editing. payment_status tetap pending. Integrasi Midtrans/Tripay nantinya dapat ditambahkan di service dan webhook baru tanpa mengubah builder.

## Pengujian

Smoke test struktur dan keamanan:

~~~bash
php tests/smoke.php
~~~

Setelah database terkonfigurasi:

~~~bash
php tests/smoke.php --db
~~~

Lint seluruh file PHP (PowerShell):

~~~powershell
Get-ChildItem -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
~~~

Checklist manual penting:

1. Buka tiga preview dan uji tombol pembuka.
2. Buat order dengan nomor 08... dan +62...; pastikan format lain ditolak.
3. Masuk Mode Demo, isi builder, tunggu indikator “Tersimpan”, lalu refresh.
4. Ganti template dan pastikan data tetap ada.
5. Upload JPG/PNG/WEBP serta coba file script yang diganti ekstensi; file berbahaya harus ditolak.
6. Coba slug duplikat dan pilih saran otomatis.
7. Publish, buka URL publik, uji ?to=, RSVP, ucapan, dan tombol bagikan.
8. Uji viewport 360×800, 390×844, 430×932, 768×1024, dan 1366×768 di DevTools.

## Backup

Database:

~~~bash
mysqldump -u USER -p NAMA_DATABASE > backup-undangan.sql
~~~

Salin juga seluruh folder public/uploads. Untuk restore, import dump SQL lalu kembalikan folder uploads ke path yang sama.

## Troubleshooting

- **could not find driver** — aktifkan ekstensi pdo_mysql di php.ini, lalu restart PHP/Apache.
- **Database connection refused** — pastikan MySQL aktif dan host/port/config benar.
- **404 pada URL slug** — aktifkan mod_rewrite, gunakan AllowOverride All, dan pastikan .htaccess terunggah.
- **Error 500 setelah deploy** — ubah sementara debug menjadi true, periksa storage/logs/app.log, kemudian matikan kembali debug.
- **Upload gagal** — cek upload_max_filesize, post_max_size, ekstensi fileinfo, serta permission public/uploads.
- **Foto lebih dari 2 MB** — browser mengompres lebih dulu, tetapi server tetap menolak hasil akhir di atas 2 MB.
- **CSRF/session error** — pastikan cookie tidak diblokir dan domain pada base_url sesuai.
- **Folder sesi tidak dapat ditulis** — pastikan storage/sessions writable oleh PHP.
- **Perubahan CSS belum terlihat** — hard refresh browser dan bersihkan cache/CDN.
