# Xeon Invoice Generator

Sistem Kasir (Point of Sale) dan Generator Struk Belanja Offline untuk UMKM Mini.

Aplikasi ini dirancang khusus untuk toko kelontong, warung, minimarket mandiri, dan UMKM yang membutuhkan sistem pencatatan transaksi serta cetak struk kasir tanpa biaya langganan, tanpa hosting online, dan berjalan 100% mandiri di komputer lokal.

---

## Fitur Utama

1. Berjalan 100% Offline di Komputer Lokal:
   Tidak memerlukan akses internet untuk operasional kasir sehari-hari maupun pencetakan struk.

2. Dukungan Dual Output (Cetak Thermal dan Gambar WhatsApp):
   - Cetak langsung ke printer thermal kasir ukuran 58mm atau 80mm tanpa jeda margin peramban.
   - Ekspor gambar struk beresolusi tinggi (format PNG) yang siap dibagikan langsung ke chat WhatsApp pelanggan.

3. Validasi dan Konfirmasi Transaksi Sebelum Cetak:
   Sistem menampilkan jendela peninjauan ulang pesanan sebelum disimpan ke riwayat dan dicetak, sehingga kasir dapat memastikan kesesuaian barang dan nominal uang belanja.

4. Penyimpanan Berkas JSON Independen:
   Seluruh data disimpan dalam berkas JSON lokal di dalam folder data (config.json, products.json, transactions.json) dengan mekanisme penulisan aman untuk mencegah kerusakan data saat listrik padam tiba-tiba.

5. Pengaturan Petugas Kasir dan Dukungan Multi-Tema:
   - Daftar petugas kasir dapat dikelola dan dipilih langsung saat transaksi.
   - Pilihan 4 tema tampilan visual yang nyaman di mata (Terang Bersih, Krem Lembut, Abu Minimalis, Gelap Halus).

6. Katalog Barang dan Pilihan Cepat:
   Manajemen data produk dengan pencarian cepat nama atau kode barcode, serta tombol pintas barang favorit di meja kasir.

7. Riwayat Penjualan Lengkap dan Cetak Ulang:
   Setiap transaksi tersimpan rapi dan dapat ditinjau ulang maupun dicetak ulang kapan saja.

8. Pencadangan Data:
   Fitur ekspor cadangan data lengkap dalam satu berkas untuk memudahkan pemindahan data ke komputer lain.

---

## Cara Menjalankan Aplikasi

### Metode 1: Menggunakan Peluncur Otomatis (Khusus Windows)
1. Buka folder aplikasi.
2. Klik ganda pada berkas `start.bat`.
3. Server lokal akan aktif dan peramban web akan terbuka secara otomatis pada alamat `http://localhost:3000`.

### Metode 2: Menggunakan Terminal / Command Prompt
```bash
# 1. Pasang dependensi (hanya saat pertama kali pemasangan)
npm install

# 2. Jalankan server lokal
node index.js
```
Setelah server berjalan, buka peramban Anda dan akses tautan:
`http://localhost:3000`

---

## Struktur Folder dan Arsitektur

Aplikasi dibangun menggunakan pola arsitektur Model-View-Controller (MVC) dan Object-Oriented Programming (OOP):

```text
Invoice Image Generator/
|-- data/                         Penyimpanan database JSON lokal
|   |-- config.json               Konfigurasi profil toko dan preferensi nota
|   |-- products.json             Daftar barang dan harga jual
|   `-- transactions.json         Riwayat seluruh transaksi nota belanja
|
|-- public/                       Aset statis antarmuka
|   |-- css/
|   |   |-- app.css               Tata gaya antarmuka dan sistem tema
|   |   `-- print-thermal.css     Tata letak khusus printer thermal 58mm dan 80mm
|   |-- js/
|   |   |-- cashier.js            Logika perhitungan kasir dan konfirmasi pesanan
|   |   |-- product-manager.js    Pengelolaan data barang
|   |   `-- receipt-exporter.js   Pembuat berkas gambar PNG dan cetak printer
|   `-- uploads/                  Direktori penyimpanan logo toko
|
|-- src/
|   |-- controllers/              Pengendali alur aplikasi (Controller OOP)
|   |   |-- BaseController.js
|   |   |-- CashierController.js
|   |   |-- ConfigController.js
|   |   |-- ProductController.js
|   |   |-- HistoryController.js
|   |   `-- SettingsController.js
|   |-- models/                   Model data dan akses berkas (Model OOP)
|   |   |-- JsonStorage.js        Utilitas penyimpanan aman atomic write
|   |   |-- StoreConfig.js        Model konfigurasi toko
|   |   |-- Product.js            Model data produk
|   |   `-- Transaction.js        Model transaksi nota
|   |-- routes/                   Rute endpoint aplikasi
|   `-- views/                    Tampilan antarmuka berbasis EJS
|       |-- pages/                Halaman utama (kasir, produk, riwayat, profil, pengaturan)
|       `-- partials/             Komponen antarmuka (header, navigasi, footer, toast)
|
|-- PANDUAN_PENGGUNAAN.md         Buku panduan lengkap penggunaan kasir
|-- README.md                     Dokumentasi teknis proyek
|-- index.js                      Titik masuk server lokal Express
|-- package.json                  Daftar dependensi paket Node.js
`-- start.bat                     Berkas peluncur satu-klik di Windows
```

---

## Panduan Pengaturan Printer Thermal

Untuk mendapatkan hasil cetak fisik yang rapi:
1. Hubungkan printer thermal (USB atau Bluetooth) ke komputer Anda.
2. Buka tab Profil Toko pada aplikasi, lalu pilih ukuran kertas yang sesuai:
   - 58mm: Printer kasir kecil / mini Bluetooth.
   - 80mm: Printer kasir standar minimarket / supermarket.
3. Saat dialog cetak peramban muncul:
   - Pada pilihan printer (Destination), pilih printer thermal Anda.
   - Pada bagian More Settings, hilangkan centang (uncheck) pada opsi Headers and footers agar alamat web dan tanggal peramban tidak ikut tercetak.
   - Atur Margins ke None atau Default.
4. Klik Print untuk mencetak struk.

---

## Buku Panduan Pengguna

Panduan langkah demi langkah lengkap untuk kasir dan pemilik toko dapat dibaca pada berkas `PANDUAN_PENGGUNAAN.md`.
