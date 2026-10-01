@echo off
TITLE Xeon Invoice Generator - Server Kasir Lokal UMKM
COLOR 0C

echo ========================================================
echo         ⚡ XEON INVOICE GENERATOR POS ⚡
echo    Aplikasi Kasir & Generator Struk Offline UMKM
echo ========================================================
echo.

:: Periksa apakah NodeJS terinstall
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak ditemukan di komputer ini!
    echo Silakan install Node.js terlebih dahulu dari https://nodejs.org
    echo.
    pause
    exit /b
)

:: Jalankan server lokal di background dan buka browser
echo [1/2] Menyalakan server lokal Xeon POS...
start "" node index.js

:: Tunggu 2 detik agar server siap
timeout /t 2 /nobreak >nul

echo [2/2] Membuka antarmuka kasir di browser Anda...
start http://localhost:3000

echo.
echo ========================================================
echo  Server sedang berjalan di: http://localhost:3000
echo  JANGAN TUTUP JENDELA INI SELAMA KASIR DIGUNAKAN!
echo  Untuk mematikan kasir, tutup jendela ini (Close).
echo ========================================================
echo.
pause
