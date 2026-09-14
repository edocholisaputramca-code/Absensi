# RANCANGAN SISTEM ABSENSI DIGITAL SEKOLAH
### Dokumen Rancangan (Design Document) — Bukan Dokumen Teknis/Coding
Versi 1.0 · Draft awal untuk dibahas bersama pihak sekolah

---

## 0. Cara Membaca Dokumen Ini

Dokumen ini menjawab tiga pertanyaan:

1. **APA** yang dibangun (fitur, modul, alur kerja)
2. **BAGAIMANA** sistemnya bekerja (arsitektur, peran, aturan bisnis)
3. **APA SAJA YANG HARUS DILAKUKAN** (tahapan pengerjaan, tim, risiko, biaya)

Dokumen ini **tidak berisi kode program**. Ia menjadi dasar bagi:
- Kepala sekolah & yayasan → mengambil keputusan dan menyetujui anggaran
- Tim IT/pengembang → membuat spesifikasi teknis dan mulai membangun
- Guru & TU → memahami perubahan cara kerja (SOP baru)
- Orang tua → memahami manfaat dan alur izin

---

## 0.1 Revisi Rancangan — Keputusan yang Disepakati (Versi SMK)

Bagian ini **menggantikan** beberapa asumsi awal pada rancangan. Tujuh keputusan berikut sudah disepakati bersama pengguna dan menjadi acuan seluruh bagian dokumen di bawahnya.

| # | Keputusan | Dampak pada rancangan |
|---|---|---|
| 1 | **Tidak ada notifikasi WhatsApp.** Hasil absensi diunduh sebagai **dokumen/Excel**. | Modul M4 berubah dari "Notifikasi" menjadi **Pusat Unduhan Berkas Excel**. Biaya gateway WhatsApp hilang dari RAB. Orang tua mendapat informasi lewat mekanisme yang sudah ada (surat, grup kelas, atau pengumuman sekolah). |
| 2 | **Batas terlambat pukul 06:45.** | Parameter: jam masuk **06:45**, toleransi **0 menit**. Masuk ≤ 06:45 = HADIR; **lewat 06:45 = TERLAMBAT**. Batas akhir absen masuk **08:00** (setelah itu otomatis ALPA tanpa verifikasi). |
| 3 | **Izin dikonfirmasi oleh GURU PIKET**, bukan wali kelas. | Peran penyetuju berubah di matriks hak akses (§11) dan di alur proses (§6.2). Guru piket memegang otoritas penuh atas status kehadiran harian. |
| 4 | **Izin wajib menyerahkan surat** — surat sakit (dokter/puskesmas) atau surat izin tertulis lain. | Menjadi **validasi wajib**: tanpa surat, pengajuan **tidak dapat disetujui**. Ada dua jalur: (a) surat diserahkan fisik ke guru piket → dicatat & langsung disetujui; (b) diunggah saat pengajuan → menunggu konfirmasi. Surat fisik diarsipkan TU per kelas per bulan. |
| 5 | **Rekap harian & bulanan masing-masing menjadi file Excel sendiri**, dan **dipisahkan per kelas**. | 1 kelas = 1 file. Rekap harian tersedia **setelah jam pulang** (rilis 15:30). Rekap bulanan tersedia terus dan diperbarui sampai akhir bulan. Format & penamaan diatur di §10-M4 dan Pengaturan. |
| 6 | **Struktur SMK: ada JURUSAN.** | Entitas **JURUSAN** ditambahkan; KELAS memiliki atribut `jurusan`. Dashboard, laporan, dan unduhan bisa disaring **per kelas** maupun **per jurusan**. Peran **Kaprodi (Ka. Jurusan)** ditambahkan. |
| 7 | File harian baru boleh diunduh **setelah jam pulang**. | Sistem menahan rilis berkas harian sampai jam yang ditentukan (default 15:30) supaya data jam pulang ikut tercatat. |

### Contoh struktur kelas SMK yang dipakai dalam rancangan

| Kelas | Jurusan | Nama Jurusan |
|---|---|---|
| X TKJ 1, X TKJ 2, XI TKJ 1 | TKJ | Teknik Komputer & Jaringan |
| X MM 1, XI MM 1 | MM | Multimedia |
| X AKL 1, XI AKL 1 | AKL | Akuntansi & Keuangan Lembaga |
| X OTKP 1 | OTKP | Otomatisasi & Tata Kelola Perkantoran |
| XI TKR 1, XII TKR 1 | TKR | Teknik Kendaraan Ringan |

> **Catatan:** daftar jurusan & kelas di atas hanya contoh. Sesuaikan dengan jurusan yang benar-benar ada di sekolah Anda — ini salah satu hal yang perlu dikonfirmasi (lihat §21).

---

## 1. Ringkasan Eksekutif

Sistem absensi digital menggantikan daftar hadir kertas dengan pencatatan kehadiran secara elektronik yang **langsung terpusat**, **dapat dipantau orang tua**, dan **menghasilkan laporan otomatis**.

**Inti perubahan:**

| Aspek | Kondisi Sekarang (Kertas) | Target (Digital) |
|---|---|---|
| Pencatatan | Guru menulis manual di buku | Pemindaian QR / ketuk kartu / input guru, tersimpan otomatis |
| Waktu rekap | Hari–minggu (di jumlah manual) | Real-time, laporan otomatis |
| Orang tua | Tahu belakangan (atau tidak sama sekali) | Rekap tertulis per kelas tersedia hari itu juga (diunduh/dicetak dari Excel) |
| Kehilangan/kerusakan | Buku absen hilang = data hilang | Data ter-backup harian |
| Analisis | Sulit mendeteksi pola bolos | Dashboard mendeteksi siswa berisiko putus sekolah |
| Beban guru piket | Tinggi (rekap + tulis) | Turun drastis |

**Prinsip rancangan:**
- **Sederhana dulu (MVP)** — jangan langsung biometrik wajah jika QR sudah cukup.
- **Offline-first** — sistem tetap jalan walau internet putus (sangat penting di sekolah daerah).
- **Ramah guru** — maksimal 2 ketukan untuk menyelesaikan satu aksi.
- **Privasi-by-design** — patuh UU No. 27/2022 tentang Pelindungan Data Pribadi (PDP); biometrik hanya opsional dan butuh persetujuan tertulis orang tua.

---

## 2. Masalah Absensi Kertas (Yang Akan Diselesaikan)

1. **Data lambat & tidak real-time** — TU baru tahu rekap kehadiran berminggu kemudian.
2. **Rentan manipulasi** — siswa bisa menandatangani untuk teman yang tidak hadir; coretan mudah diubah.
3. **Beban administrasi guru** — mengisi, memindahkan ke rekap bulanan, menghitung persentase manual.
4. **Risiko kehilangan data** — buku absen rusak, hilang, terkena air, atau tertinggal.
5. **Orang tua terlambat tahu** — baru tahu saat pembagian rapor atau surat panggilan.
6. **Sulit mendeteksi pola** — siswa yang bolos jam tertentu atau sering terlambat sulit terdeteksi dini.
7. **Biaya tersembunyi** — kertas, cetak, tinta, map, lemari arsip, waktu guru yang terbuang.
8. **Tidak ada jejak audit** — jika ada sengketa, tidak bisa dibuktikan siapa mengubah data dan kapan.

---

## 3. Tujuan & Indikator Keberhasilan

### 3.1 Tujuan
- Menurunkan waktu pencatatan dan rekap kehadiran hingga **>80%**.
- Memberikan informasi kehadiran **real-time** kepada wali kelas dan orang tua.
- Menyediakan data kehadiran yang **akurat, aman, dan dapat diaudit**.
- Mendeteksi dini siswa dengan pola ketidakhadiran bermasalah.

### 3.2 KPI (diukur 3 bulan setelah pemakaian penuh)

| KPI | Baseline (kertas) | Target |
|---|---|---|
| Waktu rekap kehadiran per kelas per bulan | ±4–6 jam | < 30 menit |
| Kehadiran tercatat dalam 1 jam setelah jam masuk | ±0% | > 95% |
| Tingkat kesalahan input | tidak terukur | < 1% |
| Rekap harian tersedia tanpa rekap manual | 0% | 100% (file Excel otomatis pukul 15:30) |
| Waktu menyusun rekap bulanan per kelas | ±3–5 jam | < 5 menit (unduh file) |
| Keluhan "absen titip" | sering | < 5% dari total hari |
| Ketersediaan sistem (uptime) | – | > 99% jam sekolah |

---

## 4. Ruang Lingkup

### 4.1 Masuk ruang lingkup (Fase 1 — MVP)
- Absensi **masuk** dan **pulang** siswa harian
- Absensi **per jam pelajaran** (presensi mapel) — *aktifkan bertahap*
- Pengajuan dan persetujuan **izin/sakit/dispensasi**
- **Notifikasi otomatis** ke orang tua (WhatsApp)
- **Dashboard & laporan**: harian, bulanan, per siswa, per kelas
- Manajemen data: siswa, guru, kelas, jadwal, tahun ajaran, hari libur
- **Mode offline** dengan sinkronisasi otomatis
- ** Koreksi/override** oleh wali kelas dengan jejak audit
- Impor data siswa dari **Dapodik/NISN** atau CSV Excel

### 4.2 Tidak masuk Fase 1 (ditunda)
- Absensi guru & pegawai (Fase 2 — bisa pakai modul yang sama, beda peran)
- Integrasi e-rapor / kenaikan kelas otomatis
- Aplikasi mobile native (Android/iOS) — Fase 1 gunakan **web app** yang bisa dipasang di HP (PWA)
- Pembayaran SPP / keuangan
- Absensi kegiatan ekstrakurikuler & asrama
- Biometrik wajah (hanya jika disetujui komite + orang tua)

---

## 5. Pemangku Kepentingan & Peran

| Peran | Kebutuhan Utama | Fitur yang Dipakai |
|---|---|---|
| **Siswa** | Absen cepat, tidak ribet | Kartu QR / ID, lihat riwayat & poin kehadiran |
| **Guru Piket** | Mencatat kehadiran di gerbang/kelas dengan cepat | Mode pemindaian, input manual darurat, daftar terlambat |
| **Guru Mapel** | Presensi per jam pelajaran | Mode presensi kelas, tandai bolos |
| **Wali Kelas** | Pantau anak bimbingannya, verifikasi koreksi | Dashboard kelas, approval izin, tindak lanjut |
| **Tata Usaha / Admin** | Kelola data master, cetak laporan, tutup buku bulanan | Manajemen data, laporan, pengaturan jam & kalender |
| **Kepala Sekolah** | Gambaran agregat, dasar kebijakan | Dashboard eksekutif, peringkat kelas, tren |
| **Orang Tua** | Tahu anak hadir/izin, ajukan izin | Notifikasi WA, portal ringkas, form izin |
| **BK / Konselor** | Deteksi siswa bermasalah | Alarm pola ketidakhadiran |
| **Tim IT** | Sistem stabil & aman | Monitoring, backup, manajemen akun |

---

## 6. Alur Proses Bisnis

### 6.1 Alur Utama: Absensi Masuk (To-Be)

```
Siswa datang ke sekolah
        │
        ▼
[Titik Absen] Gerbang / Kiosk / HP Guru Piket
        │
        ├─► (A) Pindai Kartu QR Siswa      ── cepat, murah, direkomendasikan
        ├─► (B) Ketuk Kartu RFID/NFC       ── cepat, butuh kartu + reader
        ├─► (C) Input NIS/Nama di kiosk    ── cadangan kalau lupa kartu
        └─► (D) Scan QR Dinamis di layar   ── anti-titip, QR berubah 30–60 detik
                │
                ▼
   Sistem validasi:
   • Apakah ID siswa dikenal & aktif?
   • Apakah sudah absen hari ini? (cegah dobel)
   • Apakah dalam radius sekolah (geofence)? (opsional)
   • Apakah waktunya masuk/pulang?
                │
      ┌─────────┴──────────┐
      ▼                    ▼
  ONLINE                OFFLINE
  Simpan ke server      Simpan ke antrean lokal perangkat
  (langsung tercatat)   (tersimpan + timestamp, sinkron nanti)
      └─────────┬──────────┘
                ▼
   Mesin Status menentukan: HADIR / TERLAMBAT / (lihat aturan §7)
                │
                ▼
   Notifikasi WA otomatis ke orang tua (jika diaktifkan)
                │
                ▼
   Muncul di dashboard wali kelas & rekap harian
```

### 6.2 Alur: Izin / Sakit

```
Orang tua / siswa mengajukan
  • Lewat link form (tanpa perlu install aplikasi), atau
  • Surat kertas → di-input oleh TU
        │
        ▼
Unggah bukti (foto surat dokter / surat orang tua) — opsional
        │
        ▼
Notifikasi ke Wali Kelas → SETUJUI / TOLAK / MINTA REVISI
        │
        ▼
Status otomatis jadi SAKIT / IZIN (menggantikan ALPA)
        │
        ▼
Notifikasi balasan ke orang tua + tercatat di rekap
```

### 6.3 Alur: Koreksi / Kejadian Khusus

- Siswa lupa bawa kartu → guru piket input manual dengan **alasan wajib** + **otorisasi guru** (PIN/guru login).
- Siswa terlambat karena urusan sekolah (ekskul, upacara) → wali kelas tandai **Dispensasi**.
- Data salah input → wali kelas ajukan koreksi → **jejak audit mencatat siapa, kapan, alasan, nilai sebelum & sesudah**.
- Listrik/internet mati total → **Mode Daftar Kertas Darurat** (1 lembar per kelas), di-input TU maksimal 1×24 jam, ditandai sebagai "input manual terlambat".

### 6.4 Alur: Pulang & Jam Pelajaran
- Absensi **pulang** dicatat di titik yang sama (atau perangkat yang ditentukan), dengan aturan jam pulang minimal.
- Absensi **per jam pelajaran** dicatat oleh guru mapel di awal jam (maks. 2 menit). Siswa yang tidak tercatat otomatis berstatus "tidak hadir di jam ini" dan masuk **antrean verifikasi** wali kelas.

---

## 7. Aturan Bisnis & Status Kehadiran (Mesin Status)

### 7.1 Definisi Status

| Status | Kode | Definisi | Dihitung Alpa? |
|---|---|---|---|
| Hadir | H | Masuk sebelum/tepat jam masuk + toleransi | Tidak |
| Terlambat | T | Masuk setelah toleransi keterlambatan | Tidak (tapi dicatat) |
| Sakit | S | Ada keterangan sakit yang disetujui (surat dokter/orang tua) | Tidak |
| Izin | I | Ada keterangan izin yang disetujui | Tidak |
| Dispensasi | D | Tidak hadir karena tugas sekolah yang sah | Tidak |
| Alpa / Tanpa Keterangan | A | Tidak hadir dan tidak ada keterangan yang disetujui | **Ya** |
| Bolos (per jam) | B | Tidak hadir di jam pelajaran tertentu tanpa keterangan | Ya (dikonversi) |
| Pulang Cepat | PC | Pulang sebelum jam pulang seharusnya | Diatur kebijakan |
| Libur / Kegiatan | L | Hari libur/kegiatan khusus — sistem tidak menghitung | Tidak |

### 7.2 Parameter yang Bisa Diatur Sekolah
- Jam masuk, jam pulang, **toleransi keterlambatan** (mis. 15 menit)
- Jam masuk berbeda per hari (mis. Jumat lebih pagi, Senin upacara)
- **Batas waktu absen masuk** (mis. setelah 09:00 tidak bisa absen masuk tanpa verifikasi)
- Kalender akademik: hari libur, UTS/UAS, kegiatan, study tour
- Ambang peringatan otomatis (mis. alpa 3 hari berturut → notif BK & wali kelas)
- Radius/geofence lokasi (mis. 100 meter dari titik sekolah)
- Template & jadwal notifikasi (WA/SMS/email)

### 7.3 Contoh Aturan Otomatis
```
Jika  jam_masuk <= waktu_absen <= jam_masuk + toleransi   → HADIR
Jika  waktu_absen > jam_masuk + toleransi                → TERLAMBAT
Jika  tidak ada record absen & ada izin disetujui        → SAKIT / IZIN
Jika  tidak ada record absen & tidak ada keterangan      → ALPA  (ditetapkan otomatis jam 10:00)
Jika  alpa 3 hari berturut-turut                         → Alarm ke Wali Kelas + BK
Jika  alpa 7 hari (tidak berturut) dalam 1 bulan         → Draft Surat Panggilan Orang Tua (PDF)
```

---

## 8. Arsitektur Sistem

### 8.1 Diagram Lapisan (Konseptual)

```
┌───────────────────────────────────────────────────────────────────────┐
│ LAPIS 1 — PERANGKAT & PENGGUNA                                        │
│  Kiosk Gerbang      HP/Android Guru       HP Orang Tua      Laptop    │
│  (tablet + QR/RFID)  Piket & Mapel        (WhatsApp/Web)    Admin/TU  │
└───────────────────────────────┬───────────────────────────────────────┘
                                │  HTTPS (atau antrean lokal saat offline)
┌───────────────────────────────▼───────────────────────────────────────┐
│ LAPIS 2 — APLIKASI & LAYANAN                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Gerbang API  │ │  Autentikasi │ │   Layanan    │ │   Layanan    │  │
│  │  & Validasi  │ │  & Otorisasi │ │   ABSENSI    │ │  IZIN &      │  │
│  │              │ │    (RBAC)    │ │ (mesin status)│ │ PERSETUJUAN  │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  Layanan     │ │  Mesin       │ │   Layanan    │ │   Layanan    │  │
│  │ NOTIFIKASI   │ │  LAPORAN     │ │  SINKRONISASI│ │  AUDIT LOG   │  │
│  │ (WA/SMS/Email)│ │ & ANALITIK   │ │   OFFLINE    │ │              │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│ LAPIS 3 — PENYIMPANAN DATA                                            │
│  Database Utama     Penyimpanan Berkas     Antrean/Cache    Backup    │
│  (siswa, presensi,  (foto surat, bukti     (performa &      (harian + │
│   jadwal, audit)     izin, ekspor PDF)      antrean offline)  mingguan)│
└───────────────────────────────┬───────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│ LAPIS 4 — INTEGRASI EKSTERNAL                                         │
│   WhatsApp Business API   ·   Dapodik / NISN   ·   e-Rapor   ·  PDF   │
└───────────────────────────────────────────────────────────────────────┘
```

*(Lihat juga berkas `diagram-arsitektur.svg` di workspace.)*

### 8.2 Pilihan Teknologi (tingkat rancangan, bukan implementasi)

| Komponen | Rekomendasi | Alasan |
|---|---|---|
| Bentuk aplikasi | **Web app responsif (PWA)** | Bisa dibuka di HP Android/iOS, tablet, laptop — tanpa install dari Play Store |
| Basis data | Database relasional (mis. PostgreSQL/MySQL) | Data terstruktur, relasi kuat (siswa–kelas–jadwal) |
| Backend | API terpusat | Satu sumber data untuk semua perangkat |
| Penyimpanan berkas | Object storage / folder terenkripsi | Untuk foto surat izin, ekspor PDF |
| Notifikasi | WhatsApp (gateway pihak ketiga) + email cadangan | WA paling dipakai orang tua di Indonesia |
| Hosting | VPS/cloud Indonesia (Jakarta) atau server lokal sekolah | Lihat §12 untuk pertimbangan & biaya |
| Pencadangan | Otomatis harian, simpan 30 hari, uji pemulihan bulanan | Anti kehilangan data |

### 8.3 Strategi Offline-First (WAJIB)
1. Perangkat absen menyimpan antrean lokal (maks. 3–7 hari kehadiran).
2. Setiap catatan diberi **timestamp perangkat + ID perangkat + ID unik**, agar tidak dobel saat sinkron.
3. Saat internet kembali, sinkron otomatis; antrean dikirim berurutan.
4. Konflik (mis. siswa sudah diabsen manual oleh guru) diselesaikan dengan aturan: **data dengan otoritas lebih tinggi menang** (guru > kiosk) dan **duplikat dibuang, bukan ditimpa**.
5. Indikator status koneksi tampil jelas di layar perangkat (Hijau = online, Kuning = antrean tertunda, Merah = offline lama).

---

## 9. Perbandingan Metode Identifikasi (Keputusan Penting)

| Metode | Kecepatan | Biaya | Akurasi | Anti-titip | Risiko/Privasi | Rekomendasi |
|---|---|---|---|---|---|---|
| **Kartu QR (statis, dicetak)** | ★★★★☆ | ★★★★★ (sangat murah) | ★★★★☆ | ★★☆☆☆ | Rendah | **Direkomendasikan sebagai default** |
| **QR dinamis di layar/token berputar** | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★★ | Rendah | **Tambahan terbaik untuk cegah titip absen** |
| **Kartu RFID/NFC** | ★★★★★ | ★★★☆☆ (kartu + reader) | ★★★★☆ | ★★★☆☆ | Rendah | Baik jika volume besar & gerbang padat |
| **Kode batang (barcode)** | ★★★☆☆ | ★★★★★ | ★★★☆☆ | ★★☆☆☆ | Rendah | Alternatif paling murah, kamera kurang baik |
| **PIN / input NIS di kiosk** | ★★☆☆☆ | ★★★★★ | ★★★★☆ | ★★☆☆☆ | Rendah | Wajib ada sebagai **cadangan** |
| **Biometrik wajah/sidik jari** | ★★★★★ | ★☆☆☆☆ (mahal) | ★★★★☆ | ★★★★★ | **TINGGI** (data biometrik anak) | Hanya jika disetujui tertulis orang tua + komite; patuh UU PDP |
| **GPS/geofence di HP siswa (BYOD)** | ★★★☆☆ | ★★★☆☆ | ★★☆☆☆ | ★★★☆☆ | Sedang | Tidak disarankan: tidak semua siswa punya HP |

**Rekomendasi rancangan:** **Kartu QR ber-ID unik + QR dinamis untuk verifikasi berkala + PIN sebagai cadangan.**
Alasan: murah (bisa dicetak di kertas laminasi / printer sekolah), cepat, mudah diganti jika hilang, dan tidak menyimpan data biometrik anak.

### 9.1 Spesifikasi Kartu QR Siswa

| Aspek | Spesifikasi |
|---|---|
| **Ukuran kartu** | 85,6 × 54 mm (ukuran kartu pelajar/ID standar) |
| **Bahan** | Kertas 120–180 gsm + **laminasi**, atau **stiker QR** yang ditempel di kartu pelajar yang sudah ada |
| **Isi QR** | **Token acak per siswa**, format `SKM1.{NIS}.{7 karakter acak}` — **bukan** NISN asli, sehingga tidak bisa ditebak atau dibuat sendiri |
| **Format QR** | Level **M** (toleransi kerusakan ±15% — tetap terbaca walau tergores/bercak), versi 2 (25 × 25 modul) |
| **Ukuran QR cetak** | Minimal **2 × 2 cm** (di demo: 86 px pada kartu, 10 px/modul saat diunduh) |
| **Tampilan kartu** | Kop sekolah, foto 3×4, nama, NIS, NISN, kelas, **jurusan**, QR, tahun ajaran, dan keterangan "bila hilang kembalikan ke TU" |
| **Pencetakan** | Dilakukan sekolah sendiri — printer + laminator. Biaya cetak ulang ~Rp 3.000 |
| **Kehilangan/kerusakan** | Nonaktifkan token lama di sistem → cetak kartu baru (langsung jadi, tidak menunggu vendor) |
| **Cadangan** | Sediakan **10% kartu kosong** di TU + jalur input manual ber-PIN |

**Yang perlu disiapkan sekolah:** printer (atau jasa cetak), laminator & plastik laminasi, pemotong kartu/kertas HVS tebal, dan daftar siswa yang sudah final.

### 9.2 Pengamanan Anti-Kecurangan
1. QR siswa berisi **ID acak unik** (bukan NISN langsung) agar tidak mudah ditebak.
2. Deteksi **absen ganda** dalam hari yang sama.
3. **Batas kecepatan (rate limit)** per perangkat: mis. maks. 1 pemindaian per 3 detik per perangkat.
4. **Deteksi anomali**: seorang siswa absen dari 2 lokasi berbeda dalam waktu berdekatan → ditandai.
5. **QR dinamis** ditampilkan di layar kiosk, berubah tiap 30–60 detik (untuk mode verifikasi acak).
6. **Foto opsional** saat input manual/terlambat (bukan wajah recognition, hanya bukti tersimpan terenkripsi).
7. **Mode audit acak**: guru piket melakukan verifikasi kehadiran langsung ke kelas 1–2× per minggu.

---

## 10. Rincian Fitur per Modul

### M1 — Manajemen Data Master
- Data siswa: NIS, NISN, nama, kelas, jenis kelamin, tanggal lahir, **kontak orang tua/wali (WA)**, alamat, foto (opsional)
- Data guru & pegawai: NUPTK/NIP, nama, mata pelajaran, wali kelas, jam mengajar
- Struktur kelas & rombongan belajar; naik/mutasi/lulus siswa antar tahun ajaran
- Tahun ajaran & semester (aktif/nonaktif)
- Jadwal pelajaran (hari, jam ke-, guru, mapel, ruang)
- Impor massal dari **CSV/Excel** dan/atau **Dapodik**; validasi duplikat & data wajib
- Penonaktifan siswa (pindah/DO) tanpa menghapus riwayat

### M2 — Absensi (Inti)
- Mode **Kiosk/Gerbang**: layar besar, tombol besar, pemindaian QR, umpan balik langsung (bunyi + warna + nama siswa)
- Mode **Guru Piket**: pemindaian cepat lewat HP, daftar "belum absen" real-time
- Mode **Guru Mapel**: presensi per jam pelajaran, tandai H/I/S/A/B massal per kelas
- **Input manual** dengan alasan wajib + otorisasi guru
- Absensi **pulang**
- Riwayat kehadiran per siswa (kalender visual)
- Tanda tangan/paraf digital tidak diperlukan; **jejakan audit menggantikannya**

### M3 — Izin, Sakit & Dispensasi
- **Wajib melampirkan surat**: surat sakit (dokter/puskesmas) atau surat izin tertulis orang tua. **Tanpa surat, tombol "Setujui" tidak aktif.**
- Dua jalur pencatatan:
  - **(a) Surat fisik diserahkan ke guru piket** → guru piket mencatat di sistem (siswa, jenis, nomor surat, tanggal) → status **langsung Disetujui**, karena bukti sudah dipegang sekolah.
  - **(b) Diunggah saat pengajuan** (foto/PDF) → status **Menunggu** → guru piket periksa kesesuaian surat → Setujui / Tolak.
- Field pengajuan: siswa, jenis (Sakit / Izin / Dispensasi), tanggal mulai–selesai, alasan, **berkas surat (wajib)**, nomor surat, centang "surat fisik diterima".
- **Penyetuju tunggal: GURU PIKET.** (Kesiswaan hanya untuk kasus khusus >3 hari — opsional, bisa diaktifkan di Pengaturan.)
- Status pengajuan: Menunggu / Disetujui / Ditolak
- Begitu disetujui, status kehadiran hari tersebut berubah otomatis ALPA → SAKIT / IZIN / DISPENSASI
- **Arsip surat**: surat fisik disimpan TU per map kelas per bulan, diberi nomor urut yang sama dengan nomor di sistem, sehingga bisa dilacak saat audit.

### M4 — Pusat Unduhan Berkas Excel *(menggantikan modul notifikasi)*
- **Rekap Harian — 1 file per kelas.** Tersedia otomatis **setelah jam pulang** (jam rilis bisa diatur, default 15:30). Sebelum jam itu, tombol unduh nonaktif dengan keterangan "tersedia pukul 15:30".
- **Rekap Bulanan — 1 file per kelas.** Terus diperbarui sepanjang bulan; bisa diunduh kapan saja.
- **Opsi "Semua Kelas"**: 1 buku kerja berisi **sheet per kelas** (mempermudah TU/kepsek).
- **Penamaan file** (bisa diubah di Pengaturan):
  - `Absensi_Harian_{kelas}_{tanggal}.xlsx` → contoh: `Absensi_Harian_X-TKJ-1_2026-09-14.xlsx`
  - `Rekap_Bulanan_{kelas}_{bulan}.xlsx` → contoh: `Rekap_Bulanan_X-TKJ-1_September-2026.xlsx`
- **Isi rekap harian**: kop sekolah, kelas, jurusan, wali kelas, tanggal, jam masuk & batas terlambat, lalu tabel: No · NIS · NISN · Nama · Kelas · Jurusan · Jam Masuk · Status · Jam Pulang · Keterangan — ditutup **ringkasan** (H/T/S/I/D/A, % kehadiran) dan **kolom tanda tangan** guru piket & wali kelas.
- **Isi rekap bulanan**: kop, periode & hari efektif, tabel: No · NIS · NISN · Nama · Kelas · Jurusan · H · T · S · I · D · A · Hari Efektif · % Kehadiran · Keterangan — ditutup ringkasan + kolom tanda tangan wali kelas & kepala sekolah.
- **Riwayat unduhan**: siapa mengunduh apa dan kapan (masuk jejak audit).
- Format: **.xlsx** (bisa dibuka Excel, LibreOffice, Google Sheets). Cadangan: **.csv** bila diperlukan.

### M5 — Laporan & Dashboard
- Dashboard **Kepala Sekolah**: kehadiran hari ini, tren 30 hari, perbandingan antar kelas
- Dashboard **Wali Kelas**: daftar belum hadir hari ini, siswa berisiko, izin menunggu
- Laporan **harian** (per kelas), **mingguan**, **bulanan** (rekap per siswa: H/T/S/I/D/A + % kehadiran)
- **Rekap per siswa** untuk dilampirkan ke rapor
- Draft **Surat Panggilan Orang Tua** otomatis (siap cetak PDF)
- Ekspor **Excel / PDF / CSV**
- Filter: rentang tanggal, kelas, status, siswa

### M6 — Pengaturan & Kebijakan
- Jam masuk (**06:45**), toleransi (**0**), batas absen masuk (08:00), jam pulang, **jam rilis file harian (15:30)**
- **Pola penamaan file Excel** & pilihan isi kolom
- **Saklar "izin wajib surat"** (aktif secara default)
- Kalender akademik & hari libur
- Pengelolaan perangkat absen (daftar perangkat terdaftar & terakhir sinkron)
- Ambang alarm & eskalasi

### M7 — Keamanan, Hak Akses & Audit
- Lihat matriks peran §11
- **Jejak audit**: setiap perubahan mencatat siapa, kapan, nilai lama & baru, alasan
- Kata sandi terenkripsi, verifikasi dua langkah (opsional untuk admin)
- Kedaluwarsa sesi otomatis; perangkat absen memakai **token khusus perangkat**
- Pencadangan & pemulihan (RPO 24 jam, RTO 4 jam)

### M8 — Integrasi (bertahap)
- **Dapodik/NISN** → sinkron data siswa (Fase 2)
- **Pembuat berkas Excel (.xlsx) & PDF** → inti Fase 1 (modul M4)
- **e-Rapor** → kirim rekap kehadiran (Fase 3)
- **Ekspor CSV** → untuk kebutuhan dinas/laporan manual (Fase 1)

---

## 11. Matriks Hak Akses (RBAC)

| Fitur | Siswa | Orang Tua | Guru Mapel | **Guru Piket** | Wali Kelas | Kaprog | TU/Admin | Kepsek |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Absen sendiri | ✔ | ✕ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Lihat kehadiran sendiri/anak | ✔ | ✔ | – | – | – | – | – | – |
| Presensi per jam pelajaran | ✕ | ✕ | ✔ | ✔ | ✔ | ✕ | ✔ | ✕ |
| Input manual + otorisasi | ✕ | ✕ | ✕ | **✔** | ✕ | ✕ | ✔ | ✕ |
| Lihat data 1 kelas bimbingan | ✕ | ✕ | ✕ | ✕ | ✔ | ✔ (jurusannya) | ✔ | ✔ |
| **Setujui/tolak izin & periksa surat** | ✕ | ✕ | ✕ | **✔ (satu-satunya)** | ✕ | ✕ | ✔ (darurat) | ✕ |
| Ajukan / catat izin | ✔ | ✔ | ✕ | ✔ | ✕ | ✕ | ✔ | ✕ |
| Koreksi data kehadiran | ✕ | ✕ | ✕ | ✔ | ✔ (ajukan) | ✕ | ✔ (setujui) | ✔ |
| Lihat laporan perkelasnya | ✕ | ✕ | ✕ | ✔ | ✔ | ✔ (jurusannya) | ✔ | ✔ |
| **Unduh Excel per kelas** | ✕ | ✕ | ✕ | ✔ (kelasnya) | ✔ (kelasnya) | ✔ (jurusannya) | ✔ (semua) | ✔ (semua) |
| Lihat semua kelas/laporan sekolah | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ✔ | ✔ |
| Kelola data master & jadwal | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ✔ | ✕ |
| Ubah pengaturan & kebijakan | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ✔ | ✔ |
| Kelola akun & peran | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ✔ | ✕ |

**Catatan penting:** guru piket adalah **satu-satunya** pihak yang berhak mengonfirmasi izin harian, karena dialah yang menerima dan memeriksa **surat aslinya**. Wali kelas & kaprog berhak melihat dan mengunduh, tetapi tidak mengubah status.
| Lihat jejak audit | ✕ | ✕ | ✕ | ✕ | ✕ | ✔ | ✔ |

---

## 12. Model Data (Tingkat Konseptual)

Berikut entitas utama dan relasinya — untuk dipahami bersama, bukan skema teknis.

```
JURUSAN (id, nama, ka. jurusan) ──1:N──> KELAS ──1:N──> SISWA
                                          │              │
TAHUN_AJARAN ──1:N──> KELAS               │              └──1:N──> ORANG_TUA_WALI
                                          │
                                          └──1:N──> JADWAL_PELAJARAN ──N:1──> GURU / MAPEL

SISWA ──1:N──> KEHADIRAN_HARIAN   (tanggal, jam_masuk, jam_pulang, status,
                                    metode, perangkat, sumber: online/offline)
SISWA ──1:N──> KEHADIRAN_PER_JAM  (tanggal, jam_ke, mapel, status)
SISWA ──1:N──> PENGAJUAN_IZIN     (jenis, tanggal_mulai, tanggal_selesai, alasan,
                                    SURAT: berkas/nama berkas + nomor_surat + flag
                                    "surat fisik diterima", status,
                                    PENYETUJU = GURU PIKET, waktu konfirmasi)

KELAS ──1:N──> BERKAS_REKAP       (jenis: harian|bulanan, periode, nama_file,
                                    waktu_rilis, siap_diunduh, diunduh_oleh,
                                    waktu_unduh)  ← 1 kelas = 1 file
KEHADIRAN_HARIAN ──1:N──> KOREKSI (oleh, waktu, nilai_lama, nilai_baru, alasan)

PENGGUNA ──N:1──> PERAN ──N:M──> HAK_AKSES
PERANGKAT_ABSEN (ID, lokasi, token, terakhir_sinkron)
AUDIT_LOG (pengguna, aksi, entitas, waktu, nilai_lama, nilai_baru, IP/perangkat)
PENGATURAN (per sekolah: jam, toleransi, kalender, ambang alarm, template pesan)
```

**Catatan penting:** siswa yang pindah/DO **tidak dihapus** — cukup ditandai nonaktif agar riwayat kehadiran masa lalu tetap utuh dan bisa diaudit.

---

## 13. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| Waktu respons pemindaian | < 2 detik dari pindai hingga konfirmasi tampil |
| Kapasitas | Rampungkan antrean 500–1.000 siswa dalam < 20 menit (3–5 titik absen) |
| Ketersediaan | > 99% selama jam sekolah (07:00–16:00) |
| Mode offline | Tetap dapat mencatat minimal 7 hari tanpa internet |
| Keamanan data | Enkripsi saat transit (HTTPS) & data sensitif terenkripsi saat disimpan |
| Privasi | Hanya data yang diperlukan; data biometrik **tidak dikumpulkan** pada Fase 1; patuh UU No. 27/2022 (PDP) |
| Retensi data | Data kehadiran disimpan minimal 5 tahun (kebutuhan arsip sekolah) |
| Pencadangan | Otomatis harian; simpan 30 harian + 12 bulanan; uji pemulihan tiap 3 bulan |
| Kemudahan pakai | Guru dapat beroperasi setelah pelatihan ≤ 30 menit |
| Perangkat | Minimal layar 5" (HP) untuk guru; tablet 10" untuk kiosk |
| Aksesibilitas | Kontras tinggi, huruf besar, tombol besar di mode kiosk |
| Logging | Semua aksi penting tercatat & tidak bisa dihapus (append-only) |

---

## 14. Kebutuhan Infrastruktur & Perkiraan Biaya (Indikatif)

### 14.1 Pilihan Hosting

| Opsi | Kelebihan | Kekurangan | Cocok untuk |
|---|---|---|---|
| **VPS/Cloud (Jakarta/Surabaya)** | Bisa diakses dari mana saja, backup mudah, orang tua bisa lihat portal | Perlu internet stabil, biaya bulanan | Hampir semua sekolah — **direkomendasikan** |
| **Server lokal di sekolah** | Internet putus tetap jalan untuk jaringan internal | Perawatan, listrik, backup manual, akses orang tua terbatas | Sekolah dengan internet tidak stabil + ada staf IT |
| **Hibrida (lokal + sinkron cloud)** | Paling tangguh | Paling kompleks & mahal | Fase lanjutan / sekolah besar |

### 14.2 Perkiraan Biaya (indikatif, kisaran pasar Indonesia — perlu pengecekan harga aktual)

| Item | Kebutuhan | Perkiraan Biaya |
|---|---|---|
| Domain (nama domain sekolah) | 1 / tahun | Rp 150.000 – 250.000 / tahun |
| VPS/cloud | 1 (2 vCPU, 4 GB RAM) | Rp 150.000 – 400.000 / bulan |
| Tablet Android 10" untuk kiosk | 2–4 unit (gerbang utama) | Rp 2.000.000 – 3.500.000 / unit |
| Dudukan/stand kiosk + pelindung | 2–4 unit | Rp 300.000 – 800.000 / unit |
| Printer kartu / cetak kartu QR | 1 paket awal | Rp 500.000 – 1.500.000 (cetak kartu laminasi jauh lebih murah) |
| Kartu QR siswa (laminasi) | per siswa | Rp 3.000 – 10.000 / siswa |
| Internet sekolah (upgrade) | 1 paket | Rp 300.000 – 700.000 / bulan (bila belum ada) |
| Gateway WhatsApp (bagian notifikasi) | paket | Rp 300.000 – 1.000.000 / bulan (tergantung volume) |
| Pengembangan sistem (tim) | 2–4 bulan | Sangat bervariasi — lihat catatan di bawah |
| Pelatihan & SOP | 1 paket | Internal (bisa Rp 0) |
| **Total awal (perkiraan kasar)** | | **Rp 8–25 juta** + biaya pengembangan & langganan bulanan Rp 0,5–2 juta |

> **Catatan:** Biaya terbesar biasanya **bukan** server, melainkan **waktu pengembangan/pengadaan** dan **perangkat kiosk**. Untuk menekan biaya awal, Fase 1 bisa dimulai dengan **HP Android milik guru piket** (tanpa beli tablet) dan kartu QR yang dicetak dengan printer sekolah lalu dilaminasi.

---

## 15. Rencana Kerja & Tahapan (Roadmap)

### Fase 0 — Penemuan & Persiapan (2 minggu)
**Kegiatan:**
1. Wawancara: kepsek, TU, guru piket, wali kelas, perwakilan orang tua
2. Petakan kondisi nyata: jumlah siswa, titik masuk, jam masuk, jumlah gerbang, kekuatan internet & listrik
3. Tentukan **metode identifikasi** (lihat §9) dan **anggaran**
4. Tentukan kebijakan: toleransi keterlambatan, definisi alpa, ambang surat panggilan
5. Siapkan SOP darurat (listrik mati, internet putus, kartu hilang)

**Hasil:** Dokumen kebutuhan final + persetujuan kepala sekolah/yayasan.

---

### Fase 1 — MVP (6–8 minggu)
**Yang dibangun:**
- Manajemen data master (siswa, kelas, guru, jadwal) + impor Excel
- Absensi masuk/pulang (kiosk + mode guru) + input manual berotorisasi
- Mesin status kehadiran & penetapan ALPA otomatis
- Mode offline + sinkronisasi
- Dashboard wali kelas & kepsek
- Laporan harian/bulanan + ekspor Excel/PDF
- Login & hak akses dasar + jejak audit
- Notifikasi WhatsApp (ke orang tua) — jika anggaran memungkinkan

**Hasil:** Sistem bisa dipakai oleh 1–2 kelas uji coba.

---

### Fase 2 — Uji Coba Terbatas / Pilot (2–4 minggu)
**Kegiatan:**
- Jalankan **paralel**: kertas + digital, selama 2–4 minggu
- Bandingkan hasil: apakah data digital sama dengan kertas? (target: 99% cocok)
- Kumpulkan keluhan guru & waktu tempuh absen (ukur detik per siswa)
- Perbaiki bug & alur yang membingungkan
- Uji skenario buruk: internet putus 1 hari, 100 siswa antre, kartu hilang

**Hasil:** Daftar perbaikan + keputusan "lanjut / tunda".

---

### Fase 3 — Peluncuran Penuh (2–3 minggu)
- Cetak kartu QR seluruh siswa (siapkan 10% cadangan)
- Pasang titik absen tambahan jika antrean > 10 menit
- **Pelatihan**: sesi 1 untuk guru (30–45 menit), sesi 2 untuk TU/admin (60 menit)
- **Sosialisasi orang tua**: lewat grup WA kelas + 1 lembar panduan singkat
- Tetapkan "champion" di setiap kelompok (1 guru yang paling paham, jadi rujukan)
- Masa transisi: **kertas tetap disiapkan sebagai cadangan 1 bulan**

**Hasil:** Seluruh kelas memakai sistem digital.

---

### Fase 4 — Pemantauan & Penyempurnaan (berkelanjutan, 1–3 bulan)
- Tinjau KPI §3.2 tiap bulan
- Tambah fitur: absensi guru/pegawai, integrasi Dapodik, absensi per jam pelajaran menyeluruh, portal orang tua, aplikasi mobile
- Otomatisasi surat panggilan
- Evaluasi kuartalan bersama komite sekolah

---

### 15.1 Ringkasan Garis Waktu

| Minggu | 1–2 | 3–10 | 11–14 | 15–17 | 18–30 |
|---|---|---|---|---|---|
| Fase | Penemuan | Bangun MVP | Pilot | Peluncuran | Pemantauan |
| Tonggak utama | Kebutuhan disetujui | MVP siap uji | Pilot lulus | Semua kelas pakai | KPI tercapai |

---

## 16. Struktur Tim

| Peran | Tanggung Jawab | Keterlibatan |
|---|---|---|
| Penanggung jawab sekolah (Kepsek/Wakasek) | Keputusan kebijakan, pengesahan SOP, sosialisasi | Sepanjang proyek |
| Koordinator sekolah (guru/TU) | Jembatan harian dengan tim, kumpulkan kebutuhan | Sepanjang proyek |
| Manajer Produk / Analis | Menyusun kebutuhan, prioritas, menguji hasil | Fase 0–2 |
| Perancang UI/UX | Desain tampilan kiosk & dashboard | Fase 1 |
| Pengembang Backend | API, basis data, mesin status, sinkronisasi | Fase 1–4 |
| Pengembang Frontend | Tampilan web/kiosk/dashboard | Fase 1–4 |
| Penguji (QA) | Skenario uji, uji beban, uji offline | Fase 1–3 |
| Admin Sistem (staf sekolah) | Kelola data, akun, backup harian | Fase 3–4 |
| Champion Guru | Rujukan rekan sejawat saat pemakaian | Fase 3–4 |

> Untuk sekolah dengan anggaran terbatas, peran teknis bisa digabung (1–2 orang pengembang full-stack + 1 orang sekolah sebagai koordinator).

---

## 17. Manajemen Perubahan (Sering Terlupakan & Sering Jadi Biaya Gagal)

1. **Jangan hapus kertas mendadak.** Jalankan paralel 2–4 minggu. Ini menurunkan resistensi dan memberi jaring pengaman.
2. **Tunjuk "champion" per kelompok kerja.** Rekan sejawat lebih didengar daripada手册 dari luar.
3. **Buat SOP 1 halaman** (bukan dokumen 20 halaman) — lihat contoh di bawah.
4. **Ukur waktu nyata** saat pelatihan: jika absen 1 kelas lebih dari 3 menit, berarti alurnya masih salah.
5. **Siapkan prosedur eskalasi tertulis**: kartu hilang ke mana, internet putus bagaimana, data salah siapa yang berwenang mengoreksi.
6. **Sosialisasi ke orang tua sebelum peluncuran**, bukan sesudahnya. Jelaskan: manfaat, nomor WA yang benar, cara ajukan izin, dan bahwa notifikasi bukan untuk "mengawasi" melainkan keselamatan.
7. **Jangan hukum guru atas data yang salah di minggu pertama.** Fase adaptasi butuh ruang.

### Contoh SOP Harian (draft 1 halaman)

**Guru Piket — Pagi (06:45–07:15)**
1. Nyalakan perangkat absen, pastikan indikator koneksi **Hijau**.
2. Buka mode "Absen Masuk", pastikan tanggal & jam benar.
3. Siswa memindai kartu QR ke kiosk. Pastikan nama & foto muncul sebelum siswa lewat.
4. Jika kartu hilang: **Input Manual** → ketik NIS → pilih alasan "Lupa kartu" → **otentikasi dengan PIN guru**.
5. Jika internet merah (putus): tetap lanjutkan; pastikan notifikasi "Tersimpan Lokal" muncul; laporkan ke TU sore hari.
6. Jam 07:15: tutup sesi, lihat daftar "Belum Hadir", serahkan ke wali kelas.

**Wali Kelas — Siang**
1. Buka "Izin Menunggu" → setujui/tolak maksimal 2 jam setelah pengajuan.
2. Tinjau "Alarm" (alpa berturut-turut) → hubungi orang tua melalui telepon/WA.

**TU — Sore**
1. Cek "Perangkat Belum Sinkron" → pastikan semua kosong.
2. Cek rekap harian, tandai anomali.

---

## 18. Risiko & Mitigasi

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| 1 | Listrik/internet padam saat jam masuk | Absensi gagal massal | Mode offline wajib; baterai cadangan (powerbank/UPS) untuk tablet; kertas darurat 1 lembar/kelas; input ulang maks. 1×24 jam |
| 2 | Titip absen / siswa membawa kartu teman | Data tidak valid | QR dinamis, verifikasi acak ke kelas, batas kecepatan perangkat, deteksi anomali lokasi, foto bukti pada input manual |
| 3 | Siswa lupa/hilang kartu | Antrean panjang | Input manual ber-PIN + kartu cadangan 10% di TU + penggantian hari itu juga |
| 4 | Antrean panjang di gerbang | Terlambat masuk kelas | Ukur waktu; jika > 10 menit, tambah titik absen atau pakai mode HP ganda |
| 5 | Guru menolak / kembali ke kertas | Sistem tidak dipakai | Libatkan guru sejak Fase 0; antarmuka sangat sederhana; champion; pelatihan 30 menit; jangan hukum kesalahan awal |
| 6 | Data orang tua salah/tidak lengkap | Notifikasi tidak sampai | Validasi nomor WA saat impor; verifikasi lewat kode OTP sekali; sediakan alternatif SMS/surat |
| 7 | Pelanggaran privasi data anak | Hukum & reputasi | Minimalkan data; tanpa biometrik di Fase 1; enkripsi; kebijakan privasi tertulis; persetujuan orang tua; patuh UU PDP 27/2022 |
| 8 | Kehilangan data (server rusak) | Data absen hilang | Backup harian otomatis + bulanan tersimpan terpisah; uji pemulihan tiap 3 bulan |
| 9 | Perangkat kiosk dicuri/rusak | Tidak bisa absen | Kunci perangkat; token perangkat bisa dicabut jarak jauh; ada 2+ perangkat |
| 10 | Lingkup proyek melebar (semua fitur diminta sekaligus) | Waktu & biaya membengkak | Kunci ruang lingkup Fase 1 (§4); fitur baru masuk Fase 4 |
| 11 | Nomor WhatsApp diblokir/spam | Notifikasi gagal | Gunakan gateway resmi; template pesan disetujui; sediakan email cadangan |
| 12 | Data siswa pindah/DO merusak laporan | Rekap tidak akurat | Nonaktifkan, jangan hapus; laporan hanya hitung siswa aktif |

---

## 19. Skenario Uji Penerimaan (UAT)

Daftar ini dipakai untuk menilai apakah sistem **layak diluncurkan**.

| # | Skenario | Kriteria Lulus |
|---|---|---|
| 1 | 40 siswa memindai berturut-turut | Semua tercatat, rata-rata < 3 detik/siswa, tidak ada dobel |
| 2 | Siswa memindai 2 kali | Kali kedua ditolak/ditandai, tidak dobel |
| 3 | Internet dimatikan saat absen | Data tersimpan lokal; saat online kembali, tersinkron tanpa dobel & tanpa kehilangan |
| 4 | Siswa lupa kartu | Guru bisa input manual dengan PIN; alasan tercatat di audit log |
| 5 | Pengajuan izin tanpa surat | Tombol "Setujui" tidak aktif — sistem menolak dengan pesan "surat wajib dilampirkan" |
| 5b | Guru piket menyetujui izin bersurat | Status berubah ALPA → SAKIT/IZIN, dan tercatat di jejak audit beserta nama penyetuju |
| 6 | Siswa alpa 3 hari berturut | Alarm muncul di dashboard wali kelas & BK |
| 7 | Admin salah input jam masuk | Koreksi bisa dilakukan; audit log mencatat nilai lama & baru |
| 8 | Cetak rekap bulanan | Laporan sesuai dengan data harian; total H+T+S+I+D+A = jumlah hari efektif |
| 9 | Hapus/ubah data kehadiran | Tidak bisa dihapus permanen; hanya koreksi berjejak |
| 10 | Guru baru pertama kali memakai | Selesai absen 1 kelas dalam < 5 menit tanpa didampingi (setelah pelatihan 30 menit) |
| 11 | Kirim 200 notifikasi WA | Terkirim > 95% dalam 15 menit |
| 12 | Server dimatikan lalu dinyalakan (simulasi bencana) | Data pulih dari backup, kehilangan data ≤ 24 jam |

---

## 20. Format Laporan (Contoh)

**Rekap Kehadiran Bulanan — Kelas VII-A · September 2026**

| No | NIS | Nama | H | T | S | I | D | A | Total Hari Efektif | % Kehadiran |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026001 | Ahmad | 18 | 2 | 1 | 0 | 0 | 0 | 21 | 100% |
| 2 | 2026002 | Siti | 15 | 4 | 0 | 2 | 0 | 0 | 21 | 100% |
| 3 | 2026003 | Budi | 12 | 3 | 0 | 0 | 0 | 6 | 21 | 71,4% |

> % Kehadiran = (H + T + S + I + D) ÷ Hari Efektif × 100%. Siswa dengan % < 85% otomatis masuk daftar pantauan BK.

### Contoh bentuk file Excel harian per kelas

```
A1  REKAP KEHADIRAN HARIAN SISWA                                       (tebal)
A2  SMKN 1 MOJOSARI  —  Tahun Ajaran 2026/2027                         (tebal)
A3  Kelas: X TKJ 1    Jurusan: TKJ - Teknik Komputer & Jaringan    Wali Kelas: Sri Wahyuni, S.Pd
A4  Tanggal: 14 September 2026    Jam masuk: 06:45    Batas terlambat: 06:45    Jam pulang: 15:00
A5  (kosong)
A6  No | NIS | NISN | Nama Siswa | Kelas | Jurusan | Jam Masuk | Status | Jam Pulang | Keterangan   (tebal)
A7  1  | 2026001 | 0031... | Ahmad Fauzi | X TKJ 1 | TKJ | 06:38 | Hadir    | 15:02 | Kartu QR
A8  2  | 2026002 | 0031... | Andi Kusuma | X TKJ 1 | TKJ | 06:51 | Terlambat| 15:00 | Kartu QR
A9  3  | 2026003 | 0031... | Anisa M.    | X TKJ 1 | TKJ | —      | Sakit    | —     | Surat sakit No. SD/09/001
...
    (kosong)
    RINGKASAN KELAS      (tebal)
    Hadir      : 26
    Terlambat  : 3
    Sakit      : 1
    Izin       : 0
    Dispensasi : 0
    Alpa       : 2
    Jumlah siswa         : 32
    Persentase kehadiran : 94%
    (kosong)
    Dibuat otomatis oleh sistem absensi digital · 14 September 2026 15:32
    Guru Piket: ..................      Wali Kelas: ..................
```

Catatan: kolom **Jurusan** diisi otomatis dari data kelas, sehingga file setiap kelas langsung bisa dipakai untuk laporan ke kompetensi keahlian masing-masing.

---

## 21. Status Keputusan

### 21.1 Sudah diputuskan (lihat §0.1)

| # | Keputusan | Status |
|---|---|---|
| 1 | Metode identifikasi: **kartu QR** (dengan input manual ber-PIN sebagai cadangan) | ✅ Disepakati |
| 2 | **Tanpa notifikasi WA** — diganti unduhan **file Excel per kelas** | ✅ Disepakati |
| 3 | Batas terlambat **06:45** | ✅ Disepakati |
| 4 | Izin dikonfirmasi **guru piket** | ✅ Disepakati |
| 5 | Izin **wajib surat** (surat sakit / surat izin) | ✅ Disepakati |
| 6 | Rekap **harian & bulanan terpisah**, masing-masing per kelas | ✅ Disepakati |
| 7 | Struktur **SMK dengan jurusan**; dashboard & laporan bisa disaring per kelas/jurusan | ✅ Disepakati |
| 8 | File harian baru bisa diunduh **setelah jam pulang** | ✅ Disepakati |

### 21.2 Masih perlu dikonfirmasi

1. **Daftar jurusan & jumlah kelas yang sebenarnya** — 5 jurusan / 10 kelas pada dokumen ini hanya contoh. Mohon daftar resminya (nama jurusan, tingkat, jumlah rombel, jumlah siswa per rombel).
2. **Jam pulang & jam rilis file harian** — apakah 15:00 / 15:30 sudah sesuai, atau ada jadwal sholat/kegiatan yang memengaruhi?
3. **Jumlah titik absen & gerbang** — berapa gerbang masuk yang aktif di jam sibuk? (Menentukan jumlah perangkat.)
4. **Perangkat yang sudah tersedia** — HP/tablet milik sekolah, printer, laminator, dan kualitas internet.
5. **Siapa saja yang boleh mengunduh** — hanya TU & kepsek, atau wali kelas/kaprodi juga boleh mengunduh kelasnya masing-masing?
6. **Retensi arsip** — berapa lama file harian & bulanan disimpan di server (rekomendasi: harian 1 tahun, bulanan 5 tahun), dan apakah surat fisik wajib diarsipkan (rekomendasi: ya, 1 tahun berjalan).
7. **Presensi per jam pelajaran** — diperlukan sejak awal, atau menyusul setelah absensi masuk/pulang berjalan stabil?
8. **Anggaran** — kisaran biaya pembangunan awal & biaya bulanan yang disiapkan.

---

## Lampiran A — Glosarium

| Istilah | Arti |
|---|---|
| MVP | Minimum Viable Product — versi paling sederhana yang sudah bisa dipakai |
| PWA | Aplikasi web yang bisa dipasang di HP seperti aplikasi biasa |
| RBAC | Role-Based Access Control — pengaturan hak akses berdasarkan peran |
| Geofence | Batas area geografis virtual (mis. radius 100 m dari sekolah) |
| Sinkronisasi offline | Proses mengirim data yang tersimpan sementara di perangkat saat internet kembali ada |
| Jejak audit | Catatan permanen siapa mengubah apa, kapan, dan alasannya |
| UAT | User Acceptance Testing — uji kelayakan oleh pengguna akhir |
| RPO / RTO | Target jumlah data yang boleh hilang / target waktu pemulihan sistem |
| Dapodik | Data Pokok Pendidikan — basis data siswa resmi Kemendikbud |
| NIS / NISN | Nomor Induk Siswa / Nomor Induk Siswa Nasional |

---

## Lampiran B — Dokumen Turunan yang Perlu Dibuat Setelah Ini

1. **Dokumen Kebutuhan Rinci (PRD)** — penjabaran tiap modul + kriteria penerimaan
2. **Spesifikasi Teknis** — pilihan teknologi, skema basis data, desain API, rencana keamanan
3. **Desain Antarmuka (wireframe)** — layar kiosk, dashboard wali kelas, form izin, laporan
4. **Rencana Pengujian** — 12 skenario UAT di atas + uji beban
5. **SOP Operasional** — versi final 1 halaman per peran
6. **Kebijakan Privasi & Persetujuan Orang Tua** — untuk kepatuhan UU PDP
7. **Rencana Anggaran Final (RAB)** — dengan harga penawaran aktual
8. **Materi Sosialisasi** — panduan 1 halaman untuk guru & orang tua
9. **Rencana Pelatihan** — jadwal & materi tiap peran

---

*Dokumen ini adalah rancangan tingkat tinggi. Setelah keputusan pada §21 dikonfirmasi, rancangan ini akan diperinci menjadi dokumen kebutuhan rinci dan spesifikasi teknis.*
