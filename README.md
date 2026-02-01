# MyKeuangan (Project GO)

Aplikasi pencatatan keuangan pribadi dengan fitur Hybrid Storage (Offline & Online). Memungkinkan pengguna mencatat transaksi tanpa internet (SQLite) dan sinkronisasi ke cloud (Firebase) saat online.

## 📱 Fitur Utama

- **Hybrid Storage**: Menggunakan user-local DB (SQLite) untuk performa cepat & offline, serta Cloud Firestore untuk backup.
- **Manajemen Dompet**: Tambahkan berbagai akun/dompet (Tunai, Bank, E-Wallet).
- **Kategori Transaksi**: Ikon dan warna kategori yang dapat disesuaikan.
- **Rekap Bulanan**: Pantau Surplus/Defisit dan total pengeluaran per bulan.
- **Visualisasi Data**: Grafik ringkasan pemasukan vs pengeluaran (Dashboard).
- **Multi-Device**: Login dengan akun Google/Email untuk akses data di perangkat lain.

## 🛠 Teknologi

- **Framework**: React Native (Expo SDK 52)
- **Local DB**: `expo-sqlite`
- **Cloud DB**: Firebase Firestore & Auth
- **Build System**: EAS (Expo Application Services)

## 🚀 Cara Install & Menjalankan (Development)

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/project-GO.git
    cd project-GO
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # atau
    npx expo install
    ```

3.  **Konfigurasi Firebase**
    Agar aplikasi bisa berjalan, Anda perlu file `firebase.js` dengan kredensial Anda.
    *   Duplikasi file contoh: `cp src/config/firebase.example.js src/config/firebase.js`
    *   Buka `src/config/firebase.js` dan isi dengan config dari Firebase Console Anda:
        ```javascript
        const firebaseConfig = {
            apiKey: "...",
            authDomain: "...",
            projectId: "...",
            // ...
        };
        ```
    *   *Note: File `firebase.js` yang asli sudah di-ignore oleh git agar kredensial aman.*

4.  **Jalankan Aplikasi**
    ```bash
    npx expo start
    ```
    *   Scan QR Code dengan aplikasi **Expo Go** (Android/iOS).

## 📦 Cara Build APK (Android)

Untuk membuat file `.apk` yang bisa diinstall langsung di HP:

1.  **Install EAS CLI** (jika belum)
    ```bash
    npm install -g eas-cli
    ```

2.  **Login ke Expo**
    ```bash
    npx eas-cli login
    ```

3.  **Build**
    ```bash
    npx eas-cli build -p android --profile preview
    ```
    *   Tunggu proses build selesai (bisa dipantau di link yang muncul).
    *   Download file `.apk` dan install di HP.

## 🔒 Keamanan

- **Credential**: Kredensial Firebase (API Key dll) disimpan di `src/config/firebase.js` yang **TIDAK** disertakan dalam repository ini (masuk `.gitignore`).
- Gunakan `src/config/firebase.example.js` sebagai template.

---

**Dibuat dengan ❤️ oleh deelwholaugh**
