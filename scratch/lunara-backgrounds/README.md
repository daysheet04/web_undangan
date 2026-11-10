# Background Lunara v21 - 10 November 2026

Sepuluh background (cover dan semua section) dipulihkan dari sumber asli 1920x1080 di commit `354210a42e497284a65057e6c8e5f4d0868c8b82`.

- Desktop: 960x540 menjadi 1920x1080. Salinan WebP asli, tanpa encoding lossy tambahan. Total 2.132.484 byte.
- Mobile: 480x720 menjadi 720x1080. Crop sumber asli dengan WebP quality 86; total 576.434 byte, sekitar 28-73 KB per background.
- Komposisi mobile dipertahankan: crop kiri 600px, Hero 672px, Greeting 816px. Tidak memperbesar gambar kecil yang sudah pecah.
- Hanya URL background pada CSS yang berubah; perbandingan stylesheet mengonfirmasi seluruh deklarasi animasi dan layout tetap identik. Runtime hanya memperbarui suffix background untuk decode cover. Preload React dan cache CSS/JS memakai versi baru.
- Foto demo responsif dari optimasi sebelumnya tetap dipakai. Tidak ada perubahan bunga atau kupu-kupu.

## Validasi

Render lokal memakai foto Prestige, CPU 4x, mobile 390x844 DPR2 serta desktop 1440x900 DPR1. Seluruh background memilih varian yang sesuai, seluruh foto berhasil dimuat, semua garden terbuka, dan tidak ada error runtime yang tertangkap.

| Skenario | Frame >34ms | p95 frame | Long task |
| --- | ---: | ---: | ---: |
| Mobile sebelum | 8 | 16,8ms | 0 |
| Mobile HD pertama | 7 | 33,3ms | 0 |
| Mobile HD final | 12 | 33,3ms | 2 / 114ms total |
| Desktop HD | 6 | 33,4ms | 1 / 51ms total |

Pengukuran ini tidak membuktikan performa identik: p95 mobile naik dalam pengujian, walaupun jumlah frame >34ms relatif sedikit. Resolusi lebih tinggi membutuhkan lebih banyak memori decode (sekitar 3 MiB per background mobile dan 7,9 MiB desktop untuk bitmap RGBA, bukan pengukuran total RAM/GPU). Belum ada pengujian pada HP fisik dengan RAM hampir penuh; jangan mengklaim bebas lag di seluruh perangkat.

`comparison-mobile.png` dan `comparison-desktop.png`: sebelum di kiri, sesudah di kanan. Detail garis dan tekstur diperiksa secara visual. `report.json` menyimpan ukuran tiap file. Skrip reproduksi: `node scripts/restore-lunara-backgrounds.mjs` (memerlukan riwayat Git sumber). Belum dideploy.
