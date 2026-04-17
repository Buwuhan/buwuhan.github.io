# Buwuhan Tracker ✍️📊

Aplikasi manajemen sumbangan hajatan (buwuhan) modern yang aman, praktis, dan sepenuhnya berada di bawah kendali pengguna. Data Anda disimpan di Google Drive pribadi Anda sendiri.

👉 **[Buka Aplikasi (Gratis & Siap Pakai)](https://buwuhan.github.io/)**

## Fitur Utama

- **Catat Cepat**: Input sumbangan uang maupun barang dalam hitungan detik.
- **Pantau Saldo**: Kalkulasi otomatis siapa yang perlu "dibalas" sumbangannya.
- **Buku Tamu Digital**: Kelola riwayat tamu di setiap acara.
- **Sinkronisasi Cloud**: Data aman tersimpan di Google Drive App Data Folder Anda.
- **Offline First**: Tetap bisa digunakan meski tanpa koneksi internet.

## Panduan Self-Hosting (Teknis)

Jika Anda ingin menjalankan atau meng-host aplikasi ini sendiri, ikuti langkah-langkah berikut:

### 1. Persiapan Google Cloud Console

Aplikasi ini memerlukan Google OAuth Client ID untuk sinkronisasi Google Drive.

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru.
3. Aktifkan **Google Drive API**.
4. Konfigurasikan **OAuth Consent Screen** (pilih External).
5. Tambahkan scope: `.../auth/drive.appdata` atau `.../auth/drive.file`.
6. Buat **Credentials** > **OAuth client ID** > **Web Application**.
7. Tambahkan "Authorized JavaScript origins" (misal: `http://localhost:5173` dan URL production Anda).

### 2. Instalasi Lokal

1. Clone repositori ini:

   ```bash
   git clone https://github.com/buwuhan/buwuhan.github.io.git
   cd buwuhan.github.io
   ```

2. Instal dependensi:

   ```bash
   npm install
   ```

### 3. Konfigurasi Environment

Buat file `.env` di root direktori dan masukkan Client ID Anda:

```env
VITE_GOOGLE_CLIENT_ID=MASUKKAN_CLIENT_ID_ANDA_DI_SINI.apps.googleusercontent.com
```

### 4. Pengembangan & Build

- Menjalankan server development:

  ```bash
  npm run dev
  ```

- Melakukan build untuk production:

  ```bash
  npm run build
  ```

### 5. Deployment

Aplikasi ini dioptimalkan untuk GitHub Pages.

- **Otomatis**: Push perubahan ke branch `main`, dan GitHub Actions ([deploy.yml](.github/workflows/deploy.yml)) akan melakukan build & deploy secara otomatis.
- **Manual**: Jalankan `npm run deploy` untuk mengunggah folder `dist` ke branch `gh-pages`.

## Filosofi 💡

Proyek ini dibuat dengan semangat melestarikan tradisi hajatan (buwuhan) melalui pendekatan teknologi modern. Dibangun murni menggunakan kolaborasi AI (**Vibe Code**), aplikasi ini mengedepankan transparansi, kedaulatan data pengguna, dan akses gratis bagi siapa saja.

## Lisensi 📄

Proyek ini dilisensikan di bawah **MIT License**. Lihat file [LICENSE](LICENSE) untuk informasi lebih lanjut.

---
© 2026 Buwuhan Tracker.
