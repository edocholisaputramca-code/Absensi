# Demo Sistem Absensi Digital — SMKN 1 Mojosari

Demo ini kini **dipecah menjadi beberapa berkas** supaya mudah diedit.
Perubahan apa pun dilakukan di dalam folder `src/`, lalu digabung dengan satu perintah.

---

## 1. Cara pakai (ringkas)

```bash
# 1) edit berkas yang diinginkan di dalam folder src/
# 2) susun ulang menjadi index.html:
bash build.sh          # atau:  node build.js
# 3) buka index.html di browser (atau kirimkan berkasnya ke siapa pun)
```

**Cara cepat tanpa build** (perubahan langsung terlihat cukup dengan refresh browser):

```bash
python3 -m http.server 8000 --bind 0.0.0.0 --directory "$(pwd)"
# lalu buka:  http://localhost:8000/dev.html
```

> `dev.html` memuat berkas-berkas di `src/` satu per satu — cocok dipakai saat mengedit.
> `index.html` adalah hasil gabungan (satu berkas utuh) — cocok untuk dibagikan.

---

## 2. Peta berkas

| Berkas | Isi | Kapan diedit |
|---|---|---|
| **`index.html`** | Hasil build: CSS + semua JS ditanam di dalam (114 KB) | ⚠️ **Jangan diedit** — akan tertimpa saat build |
| **`dev.html`** | Versi pengembangan: memuat `src/` satu per satu | Jarang (hasil build juga) |
| **`build.js`** | Penyusun berkas (bundler) | Bila menambah berkas baru di `src/` (cukup beri nomor, otomatis ikut) |
| **`build.sh`** | Pintasan untuk `node build.js` | — |

### Isi folder `src/`

| Berkas | Baris | Berisi | Contoh yang sering diubah |
|---|:--:|---|---|
| `00-style.css` | 205 | Semua tampilan: warna, kartu, tabel, aturan cetak | Warna sekolah, ukuran kartu, `@media print` |
| `_head.html` | 5 | `<head>`: judul & meta | Nama sekolah di judul tab |
| `_body.html` | 33 | Kerangka halaman: sidebar, topbar, modal | Menambah menu di sidebar |
| `01-util.js` | 25 | Fungsi bantu: format tanggal, `esc`, `toast`, `openModal` | — |
| `02-excel.js` | 120 | Pembuat **file .xlsx asli** (ZIP + CRC32 + SpreadsheetML) | Menambah kolom pada rekap |
| `03-data.js` | 72 | **Data master**: `SEKOLAH`, `JURUSAN`, `KELAS`, `SISWA`, `MAPEL` | ⭐ Ganti nama sekolah, daftar **jurusan**, nama **kelas**, jumlah siswa |
| `04-state.js` | 121 | `state`, `ROLES`, `NAV`, aturan status, `rekap()`, `logAudit()` | ⭐ Hak akses per peran, menu per peran |
| `05-qr.js` | 213 | **Generator QR code** (byte mode, level M) + token siswa | Format isi QR (`tokenSiswa`) |
| `06-navigasi.js` | 112 | `render()`, `go()`, jam demo, `barChart`, `donut`, `filterBar` | — |
| `07-dashboard.js` | 94 | Halaman Dashboard + filter per kelas/jurusan | KPI yang ditampilkan |
| `08-absensi.js` | 141 | Halaman **Absensi Gerbang** (kiosk, pemindaian, input manual, antrean offline) | Alur pemindaian |
| `09-presensi.js` | 46 | Halaman Presensi per Jam Pelajaran | Daftar mata pelajaran (`MAPEL`) |
| `10-izin.js` | 107 | Halaman **Izin & Surat** (wajib surat, disetujui guru piket) | Aturan validasi surat |
| `11-kartu.js` | 80 | Halaman **Kartu QR Siswa** + cetak + cabut kartu | Tampilan kartu |
| `12-siswa.js` | 65 | Halaman Data Siswa | Kolom tabel |
| `13-laporan.js` | 51 | Halaman Laporan (rekap per siswa / kelas) | Ambang "perlu perhatian" |
| `14-unduhan.js` | 170 | Halaman **Unduhan Excel**: penamaan file, isi rekap harian & bulanan | ⭐ Format nama file, isi kolom Excel |
| `15-pengaturan.js` | 43 | Halaman Pengaturan (jam, rilis file, wajib surat) | Parameter bawaan |
| `16-audit.js` | 11 | Halaman Jejak Audit | — |
| `17-init.js` | 5 | Menjalankan aplikasi saat halaman dibuka | — |

---

## 3. Perubahan yang paling sering diminta

### Mengganti nama sekolah
`src/03-data.js` → bagian `SEKOLAH`

```js
const SEKOLAH = { nama:'SMKN 1 MOJOSARI', npsn:'20512345', alamat:'...', tahun:'2026/2027' };
```

### Mengganti daftar jurusan & kelas
`src/03-data.js` → `JURUSAN` dan `KELAS`

```js
const JURUSAN = [{id:'TKJ', nama:'Teknik Komputer & Jaringan'}, ...];
const KELAS   = [{id:'X-TKJ1', nama:'X TKJ 1', jurusan:'TKJ', wali:'Sri Wahyuni, S.Pd'}, ...];
```

Jumlah siswa per kelas diatur di bagian pembuatan `SISWA` (`for (let i=0;i<8;i++)`).

### Mengubah jam & batas terlambat
`src/04-state.js` → `state.settings`

```js
jamMasuk:'06:45', toleransi:0, jamPulang:'15:00', jamRilis:'15:30', batasAbsen:'08:00'
```

### Mengubah penamaan & isi file Excel
`src/14-unduhan.js` → fungsi `namaFile()`, `barisHarian()`, `barisBulanan()`

### Mengubah tampilan kartu QR
`src/11-kartu.js` → fungsi `kartuHTML()`
`src/00-style.css` → bagian `/* kartu siswa */`

### Menambah peran / mengubah hak akses
`src/04-state.js` → `ROLES` (daftar halaman yang boleh dibuka) dan `NAV` (urutan menu)

---

## 4. Catatan teknis

- Semua berkas JS berbagi **satu scope global**, jadi fungsi di `01-util.js` bisa dipakai di `14-unduhan.js`, dan seterusnya.
- **Urutan** berkas ditentukan oleh **nomor di depan nama** (`01-`, `02-`, …). Berkas baru cukup diberi nomor, dan otomatis ikut disusun oleh `build.js`.
- Tidak ada pustaka eksternal, CDN, atau internet — QR code dan file Excel **dibuat sendiri oleh JavaScript** di dalam browser.
- `index.html` adalah satu-satunya berkas yang perlu dibagikan ke kepala sekolah / guru; berkas `src/` dan `dev.html` hanya diperlukan saat mengembangkan.

---

## 5. Dokumen terkait (di folder induk)

- `rancangan-absensi-digital-sekolah.md` — dokumen rancangan lengkap (21 bab + §0.1 revisi + §9.1 spesifikasi kartu)
- `alur-absen-siswa.svg` — diagram alur siswa dari rumah sampai pulang
- `diagram-arsitektur.svg` — diagram 4 lapis arsitektur sistem
