# Lunara v19: review analisis PDF

Permintaan: optimasi perangkat rendah tanpa mengubah gaya, durasi, urutan animasi, bunga, atau kupu-kupu. PDF dipakai sebagai masukan; hipotesisnya diperiksa terhadap kode.

## Temuan dan keputusan

- **Beban JavaScript/layout saat reveal:** diterapkan. Antrean memakai koordinat yang sudah diberikan IntersectionObserver, disesuaikan dengan perpindahan scroll. Pengukuran langsung hanya untuk memastikan elemen benar-benar sudah terlewat sebelum menyelesaikannya tanpa transisi. Cadence 115ms tetap.
- **Mount seluruh konten saat tombol dibuka:** tidak ditemukan. Template sudah memasang konten sebelum tombol dibuka; tidak perlu perubahan arsitektur React.
- **Animasi JS setiap frame / Framer / GSAP / Lottie:** tidak ditemukan pada runtime Lunara. Gerakan memakai CSS. Tidak mengganti mesin animasi.
- **Decode gambar menghambat pembukaan:** sudah ditangani v18 dengan batas waktu load/decode, deduplikasi decode, dan prioritas runtime. Bukan perubahan baru v19.
- **Tekstur terlalu besar:** background mobile yang diperiksa 480 x 720, desktop 960 x 540. Tidak ditemukan dasar untuk estimasi memori GPU dalam PDF; ukuran file terkompresi juga bukan ukuran VRAM.
- **content-visibility:auto dengan tinggi perkiraan:** tidak diterapkan secara menyeluruh. Perubahan tinggi layout saat section dibuka berisiko menggeser posisi scroll dan observer; belum ada pengukuran yang membuktikan manfaatnya di template ini.
- **Mengurangi promosi GPU:** percobaan melepas transform 3D setelah animasi selesai tidak menunjukkan hasil lebih baik, sehingga dibatalkan. CSS dan template JSX identik dengan baseline v18.
- **Kompatibilitas build:** minifikasi runtime Lunara mengikuti target browser Vite (termasuk Chrome 90), menggantikan esnext untuk file ini saja. Ini tidak menambahkan polyfill atau menjamin dukungan browser yang lebih lama.

## Validasi lokal

Fixture memakai template asli dan aset lokal, viewport 390 x 844 dengan DPR 2; foto galeri pengguna tidak dimuat. Profil mencakup scroll hingga bawah dan kembali ke Wedding Gift. Screenshot `v19-legacy-gift.png` memperlihatkan bunga dan kupu-kupu tetap ada.

- CPU 4x, API img.decode dan requestIdleCallback dinonaktifkan, runtime diminifikasi: seluruh garden terbuka, tanpa error runtime yang tertangkap; animasi section di luar viewport berhenti.
- CPU 8x + notifikasi tekanan memori Chrome: pembacaan geometri langsung untuk reveal turun dari 30 menjadi 0 pada jalur scroll turun yang diukur. Pengukuran langsung tetap tersedia untuk kasus elemen terlewat.
- Hasil frame dan long task berfluktuasi, dan sebagian hasil setelah perubahan lebih buruk. Belum ada bukti peningkatan FPS menyeluruh; jangan mengklaim lag sudah hilang. JSON baseline dan hasil disimpan untuk peninjauan.
- CSS tidak berubah; nama, durasi, delay, easing animasi kupu-kupu dicatat dalam JSON.

CPU throttling dan notifikasi tekanan memori bukan HP fisik dengan RAM penuh. Fallback API pada Chrome sekarang bukan pengujian mesin Chrome lawas. Perubahan belum dideploy.

Perbandingan ulang CPU 8x (`v18-repeat.json` / `v19-repeat.json`): frame di atas 34ms 113 → 96, tetapi total durasi long task 1067 → 1161ms dan p95 tetap 50,1ms. Hasil campuran ini mendukung pembatasan klaim di atas.
