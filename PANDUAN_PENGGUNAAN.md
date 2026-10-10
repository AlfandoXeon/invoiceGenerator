# Panduan Lengkap & Tutorial Penggunaan Aplikasi Kasir Toko

Dokumen ini berisi panduan langkah demi langkah penggunaan aplikasi kasir dan cetak struk lokal untuk pemilik toko dan petugas kasir.

---

## Daftar Isi
- Bab 1: Persiapan dan Menyalakan Aplikasi
- Bab 2: Mengatur Profil dan Identitas Toko
- Bab 3: Mengatur Petugas Kasir dan Tema Tampilan
- Bab 4: Mengisi dan Mengelola Daftar Barang
- Bab 5: Alur Transaksi Penjualan di Menu Kasir
- Bab 6: Validasi dan Konfirmasi Pesanan Sebelum Cetak
- Bab 7: Panduan Cetak Struk dan Simpan Gambar untuk WhatsApp
- Bab 8: Riwayat Penjualan dan Pencadangan Data

---

## Bab 1: Persiapan dan Menyalakan Aplikasi

### 1.1 Persyaratan Sistem
- Komputer atau laptop dengan sistem operasi Windows (Windows 7/8/10/11).
- Perangkat lunak Node.js sudah terpasang (dapat diunduh dari situs resmi nodejs.org).
- Printer thermal kasir (tipe Bluetooth atau kabel USB), dengan ukuran kertas 58mm atau 80mm (opsional, jika ingin mencetak struk fisik).

### 1.2 Cara Menjalankan Aplikasi (1-Klik)
1. Buka folder utama aplikasi.
2. Cari berkas bernama `start.bat`.
3. Klik ganda (double-click) pada berkas `start.bat`.
4. Jendela terminal kecil akan muncul dan aplikasi otomatis terbuka di peramban (browser) Anda pada alamat:
   `http://localhost:3000`
5. Jangan menutup jendela terminal tersebut selama kasir sedang digunakan melayani pelanggan.

---

## Bab 2: Mengatur Profil dan Identitas Toko

Sebelum mulai berjualan, atur identitas toko Anda terlebih dahulu agar informasi yang tercetak pada nota struk sesuai dengan usaha Anda.

1. Klik tab **Profil Toko** pada menu atas.
2. Isi kolom yang tersedia:
   - **Nama Toko**: Nama usaha Anda (contoh: Toko Berkah Mandiri).
   - **Slogan Toko**: Kata mutiara atau pesan singkat (contoh: Belanja Hemat, Pasti Lengkap).
   - **Alamat Toko**: Alamat fisik toko Anda.
   - **Nomor Telepon / WhatsApp**: Nomor kontak yang dapat dihubungi oleh pelanggan.
   - **Logo Toko**: Klik tombol **Ganti Logo** untuk mengunggah gambar logo toko (format PNG atau JPG).
   - Beri tanda centang pada opsi *Cetak logo toko di bagian atas struk* jika ingin logo tampil pada struk.
3. Atur preferensi struk:
   - **Ukuran Kertas Printer**: Pilih `58mm` untuk printer mini Bluetooth atau `80mm` untuk printer kasir ukuran besar.
   - **Awalan Nomor Nota**: Kode awal nota belanja (contoh: NOTA- atau AX-).
   - **Tarif Pajak PPN (%)**: Isi 0 jika tidak mengenakan pajak, atau isi angka persen yang berlaku.
   - **Pesan di Bawah Struk**: Tulis ucapan terima kasih atau informasi penukaran barang.
4. Klik tombol **Simpan Profil Toko**.

---

## Bab 3: Mengatur Petugas Kasir dan Tema Tampilan

Aplikasi ini mendukung pergantian petugas kasir dan pilihan warna tampilan agar mata tidak lelah.

### 3.1 Mengatur Petugas Kasir
1. Buka tab **Pengaturan** pada menu navigasi atas.
2. Pada bagian **Daftar & Petugas Kasir**:
   - Kolom **Daftar Semua Kasir Toko**: Tuliskan nama kasir toko Anda, satu nama per baris (contoh: Ani, Budi, Owner).
   - Kolom **Kasir Utama**: Pilih nama kasir yang paling sering bertugas.
3. Klik tombol **Simpan Semua Pengaturan**.

### 3.2 Memilih Tema Tampilan
Pada halaman **Pengaturan**, terdapat 4 pilihan tema visual yang bersih:
- **Terang Bersih (Default)**: Tampilan putih kontras tinggi yang jelas di ruangan terang.
- **Krem Lembut (Warm Cream)**: Warna hangat yang ramah di mata saat menatap layar berjam-jam.
- **Abu Minimalis (Slate)**: Nuansa abu-abu modern dan netral.
- **Gelap Halus (Dark Soft)**: Tema gelap yang tidak menyilaukan mata saat toko beroperasi di malam hari.

*Tips:* Klik salah satu kartu tema untuk melihat perubahan warna secara langsung di layar Anda.

---

## Bab 4: Mengisi dan Mengelola Daftar Barang

Agar kasir tidak perlu mengetik nama dan harga barang berulang-ulang, daftarkan produk toko Anda terlebih dahulu.

### 4.1 Menambahkan Barang Baru
1. Buka tab **Daftar Barang** pada menu atas.
2. Klik tombol **Tambah Barang**.
3. Isi data barang pada jendela yang muncul:
   - **Nama Barang**: Nama produk (contoh: Minyak Goreng 2 Liter).
   - **Kode / Barcode**: Scan menggunakan barcode scanner atau isi manual (opsional).
   - **Kategori**: Kelompok barang (contoh: Sembako, Minuman, Snack).
   - **Harga Beli / Modal**: Harga saat Anda kulakan barang (untuk pencatatan internal).
   - **Harga Jual**: Harga yang dibayarkan oleh pembeli.
   - **Jumlah Stok**: Jumlah barang yang ada di toko.
   - **Satuan**: Pcs, Bungkus, Botol, Kotak, atau Sak.
4. Klik tombol **Simpan Barang**.

### 4.2 Mengubah atau Menghapus Barang
- Untuk mengubah harga atau stok: Klik ikon pensil (Ubah Data) pada baris barang tersebut, sesuaikan angkanya, lalu klik simpan.
- Untuk menghapus barang: Klik ikon tempat sampah pada baris barang terkait.

### 4.3 Restock / Barang Masuk Cepat (Kulakan Distributor)
Saat Anda menerima kiriman stok baru dari suplier atau distributor:
1. Klik tombol **Barang Masuk / Restock** di bagian atas atau klik ikon kotak masuk (`move_to_inbox`) pada baris produk yang ingin ditambah.
2. Masukkan **Jumlah Barang Masuk** (contoh: kulakan 24 pcs).
3. Jika harga beli modal dari suplier mengalami perubahan naik/turun, isi kolom **Harga Modal Baru (Opsional)**.
4. Periksa ringkasan *Estimasi Stok Baru* dan *Estimasi Biaya Masuk*.
5. Klik **Konfirmasi Barang Masuk**. Stok akan langsung terakumulasi tanpa mengedit data barang secara manual.

### 4.4 Ekspor Katalog Barang ke Excel / CSV
Untuk keperluan stok opname atau pembukuan fisik:
1. Klik tombol **Ekspor CSV** di bagian atas tabel barang.
2. Berkas CSV berstandar UTF-8 akan otomatis terunduh dan dapat langsung dibuka di Microsoft Excel dengan kolom lengkap (modal, jual, margin laba, stok, dan total nilai aset modal).

---

## Bab 5: Alur Transaksi Penjualan di Menu Kasir

Tab **Kasir** adalah ruang kerja harian untuk melayani pembeli.

### 5.1 Menambahkan Barang Belanjaan
Ada dua cara mudah memasukkan barang:
- **Cara 1 (Pilihan Cepat)**: Klik salah satu tombol nama barang yang ada pada baris *Pilihan Cepat*. Barang akan langsung masuk ke daftar belanjaan.
- **Cara 2 (Ketik Nama / Barcode)**:
  1. Pada kolom *Nama Barang*, ketik nama produk atau scan barcode barang.
  2. Harga akan terisi otomatis dari data yang tersimpan.
  3. Masukkan jumlah (qty) yang dibeli pelanggan.
  4. Klik tombol tambah (+).

### 5.2 Mengatur Jumlah Barang di Keranjang
- Tekan tombol minus (-) untuk mengurangi jumlah barang. Jika jumlah mencapai nol, barang akan terhapus dari keranjang.
- Tekan tombol plus (+) untuk menambah jumlah barang.
- Tekan tombol tempat sampah untuk menghapus baris barang tersebut dari keranjang.

### 5.3 Menghitung Pembayaran dan Kembalian
1. Periksa bagian **Rincian Pembayaran** di sebelah kiri:
   - **Nama Kasir**: Pastikan kasir yang melayani sudah benar.
   - **Metode Bayar**: Pilih TUNAI, QRIS, KARTU DEBIT, atau TRANSFER BANK.
   - **Potongan Diskon (Rp)**: Masukkan nominal potongan jika ada promosi.
   - **Pajak PPN (%)**: Angka pajak akan otomatis dihitung ke total belanja.
2. Masukkan nominal uang yang diserahkan pembeli pada kolom **Uang Diterima (Rp)**:
   - Anda juga dapat menekan tombol cepat: `Uang Pas`, `10k`, `20k`, `50k`, atau `100k`.
3. Nilai **Kembalian** dan **Total Belanja** akan langsung terhitung secara otomatis.

---

## Bab 6: Validasi dan Konfirmasi Pesanan Sebelum Cetak

Untuk mencegah kesalahan ketik harga atau jumlah barang yang merugikan toko, aplikasi dilengkapi dengan sistem konfirmasi ganda sebelum struk dicetak atau disimpan.

1. Setelah keranjang belanja selesai diisi, klik tombol **Cetak Struk** atau **Simpan Gambar (WhatsApp)**.
2. Jendela **Periksa Kembali Pesanan** akan muncul di layar.
3. Kasir dapat memeriksa ulang:
   - Daftar barang yang dibeli beserta kuantitasnya.
   - Total belanja akhir.
   - Jumlah uang tunai yang diterima dan kembalian yang harus diberikan kepada pembeli.
   - Catatan peringatan otomatis jika uang yang diserahkan kurang dari total belanja.
4. Pilihan tindakan kasir:
   - Klik **Periksa Lagi (Batal)** jika pembeli ingin menambah belanjaan atau ada salah ketik.
   - Klik **Ya, Cetak & Simpan** jika pesanan sudah benar. Data akan tersimpan ke riwayat dan perintah cetak langsung berjalan.
   - Klik **Hanya Cetak (Tanpa Simpan ke Riwayat)** jika hanya ingin mencetak draf atau struk percobaan.

---

## Bab 7: Panduan Cetak Struk dan Simpan Gambar untuk WhatsApp

### 7.1 Mencetak Struk Fisik ke Printer Kasir
1. Pastikan printer thermal Anda sudah terhubung ke komputer/laptop (melalui USB atau Bluetooth) dan sudah terpasang kertas struk.
2. Saat jendela cetak peramban muncul:
   - Pilih nama printer kasir Anda pada kolom *Destination*.
   - Buka menu pengaturan tambahan (*More settings*).
   - Hilangkan tanda centang (uncheck) pada opsi **Headers and footers** agar tanggal dan alamat web peramban tidak ikut tercetak.
   - Atur margin ke **None** atau **Default**.
3. Klik tombol **Print**.

### 7.2 Menyimpan Gambar Struk untuk Dikirim ke WhatsApp
Jika pembeli tidak ingin struk fisik atau berbelanja secara daring (online):
1. Klik tombol **Simpan Gambar (WhatsApp)**.
2. Lakukan konfirmasi pesanan, lalu klik **Ya, Cetak & Simpan**.
3. Berkas gambar struk beresolusi tinggi (format PNG) akan terunduh otomatis ke folder `Downloads` komputer Anda dengan nama berkas yang memuat nomor nota.
4. Buka WhatsApp Web, lampirkan gambar struk tersebut ke chat pelanggan Anda.

---

## Bab 8: Riwayat Penjualan dan Pencadangan Data

### 8.1 Melihat Riwayat dan Mencetak Ulang Nota Lama
1. Buka tab **Riwayat Penjualan**.
2. Anda akan melihat seluruh daftar transaksi yang pernah dilakukan lengkap dengan tanggal, jam, nama kasir, total belanja, dan estimasi laba.
3. Anda dapat mencari nomor nota tertentu melalui kolom pencarian di bagian atas.
4. Pada kolom pilihan di ujung kanan:
   - Ikon printer: Untuk mencetak ulang struk nota tersebut.
   - Ikon mata: Untuk melihat rincian isi belanjaan nota yang bersangkutan beserta rincian modal (HPP) dan estimasi laba.
   - Ikon tempat sampah: Untuk menghapus catatan transaksi jika diperlukan (stok barang akan otomatis dikembalikan ke katalog).

### 8.2 Memantau Laporan Laba Bersih dan Filter Tanggal
Pada bagian atas halaman riwayat:
1. Periksa kartu indikator: **Total Omset**, **Total Modal (HPP)**, dan **Estimasi Laba Bersih** (keuntungan murni setelah dikurangi harga modal kulakan).
2. Gunakan kolom tanggal **Dari** dan **Sampai**, lalu klik **Filter** untuk melihat ringkasan omset dan laba pada rentang tanggal tertentu (misalnya rekap mingguan atau bulanan).
3. Klik tombol **Reset** untuk kembali menampilkan seluruh data.

### 8.3 Ekspor Rekap Penjualan ke Excel / CSV
1. Klik tombol **Ekspor CSV** di samping kolom pencarian riwayat.
2. Jika Anda sedang memfilter rentang tanggal tertentu, berkas CSV yang diunduh akan otomatis memuat transaksi pada periode tersebut saja.
3. Berkas memuat rincian lengkap: nomor nota, tanggal, kasir, metode pembayaran, subtotal, diskon, PPN, omset, HPP, estimasi laba, dan detail rincian produk yang terjual.

### 8.4 Mencadangkan Data Toko (Backup Data)
Seluruh data toko (profil, daftar barang, dan transaksi) disimpan di komputer Anda dalam basis data SQLite 3 dan berkas konfigurasi lokal. Agar data tetap aman:
1. Buka tab **Pengaturan**.
2. Gulir ke bagian paling bawah pada kartu **Cadangan Data Toko (Backup ZIP)**.
3. Klik tombol **Download Salinan Data (.ZIP)**.
4. Berkas cadangan arsip berekstensi `.zip` (berisi `database.sqlite` dan `config.json`) akan tersimpan di komputer Anda.
5. Pindahkan berkas cadangan tersebut ke flashdisk atau penyimpanan awan Anda sebagai arsip cadangan berkala.
