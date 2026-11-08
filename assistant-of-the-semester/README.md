# Assistant of the Semester — Voting DSP (Program Studi + Kelompok)

Website voting dengan **Next.js 16 + Vercel + Neon PostgreSQL**. Form publik dibuat seperti Google Form, tetapi pilihan kandidat menggunakan foto/kartu interaktif. Diperbarui berdasarkan enam file daftar kelompok Praktikum DSP, termasuk Teknik Biomedis.

## Alur voting

1. Pilih **Program Studi/Jalur** (Teknik Telekomunikasi, Teknik Telekomunikasi INT, Teknik Komputer, Teknik Elektro, Teknik Elektro INT, Teknik Biomedis).
2. Pilih **Nomor Kelompok**. Daftar kelompok menyesuaikan program studi.
3. Pilih **Nama Mahasiswa**. Hanya nama anggota kelompok itu yang ditampilkan.
4. Masukkan **kode voting pribadi** yang dibagikan panitia.
5. Pilih satu asisten bergambar untuk masing-masing: Terfavorit, Terkagum, Terasik, Terdingin.
6. Konfirmasi dan kirim. **Satu mahasiswa satu formulir; pengiriman ulang ditolak oleh constraint PostgreSQL `UNIQUE (voter_id)`.**

Panitia dapat mengelola kandidat + foto, menambah kelompok, mengimpor peserta, melihat partisipasi per prodi/kelompok, mengekspor statistik, serta membuka atau menutup voting. Nilai individual pilihan mahasiswa tidak ditampilkan di dashboard.

## Data asli yang sudah dikonversi

Data tersedia di **`data/peserta-dsp.csv`** (di dalam ZIP), dan juga disediakan sebagai file unduhan terpisah. Isinya **1.113 mahasiswa dan 340 kelompok**:

| Program studi/jalur | Mahasiswa | Kelompok |
|---|---:|---:|
| Teknik Telekomunikasi | 412 | 129 |
| Teknik Telekomunikasi INT | 9 | 3 |
| Teknik Komputer | 273 | 70 |
| Teknik Elektro | 285 | 95 |
| Teknik Elektro INT | 12 | 4 |
| Teknik Biomedis | 122 | 39 |
| **Total** | **1.113** | **340** |

Data Excel menggunakan sel Kelompok yang hanya terisi di baris pertama tiap kelompok. Saat konversi, nomor kelompok diteruskan ke anggota berikutnya sampai nomor kelompok baru muncul. Tidak ditemukan NIM duplikat di keenam file.

**CSV berisi data pribadi (nama dan NIM). Simpan repository GitHub sebagai PRIVATE, batasi akses panitia, dan jangan unggah CSV/kode voting ke folder `public/`.** Berkas `data/peserta-dsp.csv` hanya dibaca admin melalui upload lokal, tidak perlu dipublikasikan sebagai aset web. Anda boleh menghapus file CSV dari deployment setelah impor sukses untuk mengurangi penyimpanan data di source production.

## 1. Jalankan secara lokal

Pastikan Node.js **20.19+** tersedia.

```bash
npm install
cp .env.example .env
```

Siapkan database Neon PostgreSQL dan isi `DATABASE_URL` di `.env`, serta `ADMIN_PASSWORD` (min. 12 karakter) dan `ADMIN_SESSION_SECRET` (min. 32 karakter). Contoh membuat secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Selanjutnya:

```bash
npm run db:init
npm run dev
```

Buka `http://localhost:3000` (form) dan `http://localhost:3000/admin` (panitia).

## 2. Deploy ke Vercel

1. Buat repository **GitHub PRIVATE**; unggah isi folder proyek ini, bukan ZIP di dalam folder lain.
2. Vercel → **Add New Project → Import Git Repository → Deploy**.
3. Buat database Neon dan sambungkan ke project (Vercel Storage atau langsung di neon.tech); set `DATABASE_URL` pada **Environment Variables**.
4. Set `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` pada Environment Variables; jangan menaruhnya di source control.
5. Jalankan `scripts/schema.sql` di **Neon SQL Editor**, atau dari komputer yang `.env`-nya mengarah ke database Neon dengan `npm run db:init`.
6. Redeploy bila env variable baru ditambahkan setelah deployment.
7. Buka `/admin`, login, impor `data/peserta-dsp.csv`, unduh file kode voting, tambah foto kandidat, lalu pilih **Buka Voting**.

Tanpa database, halaman publik hanya menampilkan **mode pratinjau** dan tombol submit dinonaktifkan. Tidak ada suara yang tersimpan sampai Neon dikonfigurasi.

## 3. Cara impor 1.113 peserta (penting)

Di `/admin` → **Pemilih & Kelompok** → **Impor Mahasiswa dari Excel DSP**:

- Pilih file **`data/peserta-dsp.csv`** dari komputer Anda. Header yang diterima: `program_studi,kelompok,nim,nama`.
- Klik **Impor 1.113 mahasiswa**.
- Website mengirim batch berurutan masing-masing **60 mahasiswa** sehingga lebih aman untuk serverless Vercel.
- Kelompok baru dibuat otomatis. NIM unik dicek oleh database; NIM terdaftar tidak dimasukkan dua kali.
- Setelah selesai, browser mengunduh **`kode-voting-RAHASIA.csv`**, berisi Program Studi, Kelompok, NIM, Nama, Kode Voting.
- **Simpan file kode secara aman dan bagikan kode melalui jalur privat.** Di database kode hanya disimpan dalam bentuk hash; tidak bisa ditampilkan kembali. Jika hilang, admin dapat melakukan reset kode mahasiswa tersebut.
- Jika koneksi terputus di tengah impor, gunakan tombol **Unduh kode voting** untuk menyelamatkan kode dari batch yang sudah berhasil. Saat impor ulang, baris yang sudah ada akan dilewati. Kode yang terlupa dari batch sebelumnya harus di-reset secara manual.

Contoh baris:

```csv
program_studi,kelompok,nim,nama
Teknik Telekomunikasi,1,101012400273,DIASTRA AVILA ZANDRA
Teknik Elektro INT,1,101022340327,ADNAN KUSUMA PUTRA
```

**PENTING:** CSV yang berisi kode voting bukan bukti identitas mahasiswa; panitia perlu memastikan kode dibagikan kepada pemilik NIM yang tepat. Jangan membagikan file berisi seluruh kode ke grup kelas.

### Menambahkan Teknik Biomedis pada website dengan database yang sudah berjalan

Jika lima program studi sebelumnya sudah diimpor ke Neon, **jangan mengimpor ulang seluruh peserta**. Cukup:
1. Masuk ke `/admin` pada website DSP yang sudah aktif.
2. Buka menu impor mahasiswa dan pilih **`Daftar_Pemilih_DSP_Teknik_Biomedis.csv`** (file tambahan terpisah).
3. Jalankan impor 122 peserta, lalu simpan berkas kode voting pribadi yang terunduh.
4. Teknik Biomedis dan Kelompok 1–39 akan muncul otomatis dari database. **Tidak perlu migrasi skema atau redeploy** selama website sudah menggunakan versi DSP yang mendukung program studi + kelompok.
5. Untuk website baru yang belum berisi peserta, gunakan **`Daftar_Pemilih_DSP_6_Program_Studi.csv`** untuk mengimpor 1.113 peserta sekaligus.

Sistem melewati NIM yang sudah terdaftar; kode voting lama **tidak dapat diunduh kembali** karena disimpan sebagai hash. Simpan setiap hasil kode voting baru secara privat. Jangan me-reset kode mahasiswa yang sudah memilih.

## 4. Pengelolaan asisten dan foto

Buka `/admin` → **Kandidat Asisten**. Tambah nama dan foto kandidat asisten:

- URL HTTPS gambar publik, atau
- unggah JPG/PNG/WebP maksimal 4 MB jika sudah mengaktifkan **Vercel Blob** (token `BLOB_READ_WRITE_TOKEN`).

Kandidat tanpa foto menampilkan placeholder. Foto dan kandidat yang sama ditampilkan pada keempat kategori; satu kandidat boleh dipilih di lebih dari satu kategori.

## 5. Skema database dan migrasi dari versi lama

Perubahan ini **kompatibel dengan database versi sebelumnya** yang memakai `classes` (kelas TB-48-xx):

- `classes` sekarang memiliki kolom `program_name` dan `group_number` (dengan kode internal yang unik).
- `voters` sekarang memiliki kolom `nim` dengan unique index.
- Kolom `class_id` internal pada voter tetap dipertahankan, tetapi kini menunjuk ke **program + kelompok**, bukan kelas akademik.
- Menjalankan `scripts/schema.sql` pada database lama menambah kolom dan indeks **tanpa menghapus peserta/suara lama**. Peserta tanpa program studi (data dari skema kelas lama) tidak ditampilkan pada formulir DSP, dan suaranya tidak dihitung dalam rekap DSP yang baru.
- Jika database sudah pernah digunakan untuk voting sungguhan, **buat backup sebelum migrasi**. Suara lama tetap ada di database; migrasi tidak menghapusnya.

Pengaman server: permintaan voter ID harus cocok dengan ID kelompok dan kode pribadi. Database memiliki indeks NIM unik dan `ballots.voter_id UNIQUE`, sehingga peserta yang sudah voting tidak bisa mengirim ulang meskipun menggunakan perangkat lain.

## 6. Struktur berkas

```text
app/
  page.jsx                          Halaman formulir publik
  components/VotingForm.jsx        Pilih prodi > kelompok > nama + 4 kategori
  admin/AdminClient.jsx            Pengelolaan kelompok, impor, foto, hasil
  api/vote/route.js                Validasi dan simpan surat suara atomik
  api/admin/action/route.js        API impor peserta dan admin
lib/
  db.js                            Query Neon
  security.js                      Hash kode, autentikasi admin
  constants.js                     4 kategori dan contoh pratinjau
scripts/
  schema.sql                       Skema + migrasi aman
  setup.mjs                        Inisialisasi Neon
  data/peserta-dsp.csv             Peserta DSP (1.113 baris), hanya untuk panitia
```

## Status pengujian

Pemeriksaan data Excel dan konsistensi NIM/kelompok telah dilakukan, begitu juga syntax check JavaScript. Website tetap memerlukan **uji build dan uji integrasi database Neon** pada lingkungan yang memiliki dependensi npm serta DATABASE_URL. Tidak ada deployment live atau voting nyata yang dilakukan dalam paket ini.
