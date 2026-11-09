# Audit foto Lunara / Butterfly Blum

PDF baru dibaca sebagai masukan, bukan bukti bahwa skor Lighthouse menjamin scroll lancar atau penggunaan RAM tertentu. Ukuran gambar diperiksa langsung dari API preview publik dan file media pada 9 November 2026.

## Temuan

- Background mobile yang sudah ada: 480 x 720, sekitar 7-20 KB per file. Tidak dikurangi lagi agar detailnya terjaga.
- Delapan foto unik pada preview Prestige: 18.883.749 byte JPG; sebagian besar sekitar 1792 x 2400 piksel. Foto tersebut belum terwakili dalam fixture performa sebelumnya yang memakai placeholder.
- Foto demo dari ketiga paket dibuat menjadi WebP kualitas 84, dengan pilihan lebar 480, 800, 1200 piksel, tanpa crop atau perubahan komposisi. Semua sumber asli di server tetap utuh.
- Delapan foto Prestige pada varian 800: 764.488 byte, turun sekitar 96%. Ini ukuran file foto, bukan persentase peningkatan FPS atau pengurangan seluruh penggunaan RAM browser.
- Untuk 15 foto demo lintas paket: 37.324.589 byte sumber menjadi 1.464.952 byte bila semuanya memakai varian 800. Satu pengunjung hanya memakai foto paket yang dipilih.

## Integrasi

Template memakai srcset/sizes agar browser memilih resolusi sesuai layar. Foto profil, cerita, dan galeri dimuat secara lazy dengan decode async; hero tetap diprioritaskan. Lightbox memakai URL asli. CSS, bunga, kupu-kupu, dan koreografi tidak diubah.

Manifest cocok dengan path foto sumber yang persis. Foto unggahan pelanggan atau demo baru yang belum masuk manifest tetap memakai URL aslinya. Jika aset WebP gagal, gambar kembali ke URL asli. Jalankan `node scripts/optimize-lunara-demo-photos.mjs` setelah foto demo diganti, lalu build/deploy seperti biasa. Generator hanya membaca layanan publik dan menulis aset lokal; tidak mengubah R2 atau database. Nama aset memakai hash isi agar aman terhadap cache.

## Pemeriksaan

- Render lokal pada viewport 390 x 844, DPR 2, CPU 4x memakai foto demo Prestige yang sebenarnya.
- Sembilan elemen foto (cover dipakai dua kali) berhasil dimuat, semuanya memilih WebP 800; tidak ada request JPG sumber saat scroll. Seluruh garden terbuka dan tidak ada error runtime yang tertangkap.
- Hasil sekali jalan: p95 frame sekitar 16,8 ms dan 0 long task. Ini bukan perbandingan sebelum/sesudah yang terkontrol atau jaminan untuk HP fisik.
- Perbandingan visual `v20-photo-comparison.png`: sumber di kiri, WebP 800 di kanan, ditampilkan pada lebar 400. Wajah dan detail pakaian tetap terlihat baik pada ukuran tersebut.
- Perubahan belum dideploy.
