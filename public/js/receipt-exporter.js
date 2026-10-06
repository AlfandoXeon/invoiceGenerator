/**
 * RECEIPT EXPORTER - Xeon Invoice Generator
 * Ekspor Gambar Struk untuk WhatsApp, Cetak Printer & Generator Teks WhatsApp
 */

class ReceiptExporter {
  /**
   * Ekspor struk menjadi file gambar (PNG)
   * @param {string} elementId - ID elemen struk
   * @param {string} invoiceNumber - Nomor nota
   * @param {string} storeName - Nama toko
   */
  static async exportToPng(elementId = 'receipt-paper', invoiceNumber = 'NOTA', storeName = 'Toko') {
    const receiptElement = document.getElementById(elementId);
    if (!receiptElement) {
      if (typeof showToast === 'function') showToast('Area struk tidak ditemukan', 'warning');
      return;
    }

    const downloadBtn = document.getElementById('btn-download-png');
    let originalHtml = '';
    if (downloadBtn) {
      originalHtml = downloadBtn.innerHTML;
      downloadBtn.innerHTML = `
        <span class="material-symbols-outlined text-base animate-spin" aria-hidden="true">progress_activity</span>
        <span>Menyimpan gambar...</span>
      `;
      downloadBtn.disabled = true;
    }

    try {
      if (typeof html2canvas === 'undefined') {
        throw new Error('Alat pembuat gambar belum siap.');
      }

      // Render gambar bersih
      const canvas = await html2canvas(receiptElement, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 5000,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            clonedElement.style.boxShadow = 'none';
            clonedElement.style.borderRadius = '0';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // Unduh file gambar
      const link = document.createElement('a');
      const cleanStore = storeName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const cleanInvoice = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase();
      link.download = `struk-${cleanStore}-${cleanInvoice}.png`;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (typeof showToast === 'function') {
        showToast('Gambar struk berhasil diunduh', 'success');
      }
    } catch (error) {
      console.error('[ReceiptExporter] Gagal simpan gambar:', error);
      if (typeof showToast === 'function') {
        showToast('Gagal membuat gambar: ' + error.message, 'error');
      } else {
        alert('Gagal membuat gambar: ' + error.message);
      }
    } finally {
      if (downloadBtn) {
        downloadBtn.innerHTML = originalHtml;
        downloadBtn.disabled = false;
      }
    }
  }

  /**
   * Format teks nota untuk dikirim ke WhatsApp pelanggan
   */
  static generateWhatsAppText(storeConfig, state, calc) {
    const storeName = storeConfig?.store?.name || 'TOKO ANDA';
    const tagline = storeConfig?.store?.tagline ? `_${storeConfig.store.tagline}_\n` : '';
    const phone = storeConfig?.store?.phone ? `Telp: ${storeConfig.store.phone}\n` : '';

    const formatIdr = (num) => new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num || 0);

    let text = `🧾 *${storeName.toUpperCase()}*\n`;
    if (tagline) text += tagline;
    if (phone) text += phone;
    text += `================================\n`;
    text += `No. Nota : *${state.invoiceNumber}*\n`;
    text += `Tanggal  : ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n`;
    text += `Kasir    : ${state.cashier}\n`;
    text += `Bayar    : ${state.paymentMethod}\n`;
    text += `--------------------------------\n`;
    text += `*DETAIL BARANG:*\n`;

    (state.items || []).forEach(item => {
      text += `• ${item.name.toUpperCase()}\n`;
      text += `  ${item.qty} x ${formatIdr(item.price)} = *${formatIdr(item.price * item.qty)}*\n`;
    });

    text += `--------------------------------\n`;
    text += `Subtotal  : ${formatIdr(calc.subtotal)}\n`;
    if (calc.discount > 0) text += `Diskon    : -${formatIdr(calc.discount)}\n`;
    if (calc.taxAmount > 0) text += `PPN (${state.taxPercent}%) : ${formatIdr(calc.taxAmount)}\n`;
    text += `*TOTAL     : ${formatIdr(calc.grandTotal)}*\n`;
    text += `Bayar     : ${formatIdr(state.cashReceived)}\n`;
    text += `Kembalian : *${formatIdr(calc.change)}*\n`;
    text += `================================\n`;
    text += `Terima kasih atas kunjungan Anda!\n`;
    if (storeConfig?.pos?.footerNote) {
      text += `\n_${storeConfig.pos.footerNote.trim()}_\n`;
    }

    return text;
  }

  /**
   * Salin teks nota WhatsApp ke Clipboard
   */
  static async copyWhatsAppText(storeConfig, state, calc) {
    try {
      const text = this.generateWhatsAppText(storeConfig, state, calc);
      await navigator.clipboard.writeText(text);
      if (typeof showToast === 'function') {
        showToast('Nota teks format WhatsApp berhasil disalin ke clipboard!', 'success');
      }
    } catch (err) {
      console.error('Clipboard error:', err);
      if (typeof showToast === 'function') {
        showToast('Gagal menyalin teks ke clipboard: ' + err.message, 'error');
      }
    }
  }

  /**
   * Terapkan aturan @page CSS dinamis agar ukuran kertas printer / dialog cetak
   * secara otomatis mengikuti ukuran roll dari aplikasi (58mm atau 80mm)
   */
  static applyPrintPageStyle(paperSize = '58mm') {
    let printStyle = document.getElementById('thermal-print-page-style');
    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = 'thermal-print-page-style';
      document.head.appendChild(printStyle);
    }
    const width = (paperSize === '80mm') ? '80mm' : '58mm';
    printStyle.textContent = `
      @media print {
        @page {
          size: ${width} auto !important;
          margin: 0mm !important;
        }
        #receipt-paper,
        .receipt-paper-container {
          margin: 0 auto !important;
          width: ${width} !important;
          max-width: ${width} !important;
        }
      }
    `;
  }

  /**
   * Cetak langsung struk ke printer thermal
   * @param {string} paperSize - '58mm' atau '80mm'
   */
  static printDirect(paperSize = '58mm') {
    const printWrapper = document.getElementById('receipt-paper');
    if (!printWrapper) {
      if (typeof showToast === 'function') showToast('Area struk tidak ditemukan', 'warning');
      return;
    }

    // Terapkan class ukuran kertas pada elemen struk & body
    if (paperSize === '80mm') {
      printWrapper.classList.remove('paper-58mm');
      printWrapper.classList.add('paper-80mm');
      document.body.classList.remove('print-58mm');
      document.body.classList.add('print-80mm');
    } else {
      printWrapper.classList.remove('paper-80mm');
      printWrapper.classList.add('paper-58mm');
      document.body.classList.remove('print-80mm');
      document.body.classList.add('print-58mm');
    }

    // Terapkan ukuran @page cetak ke dokumen agar browser langsung memilih ukuran kertas yang tepat
    this.applyPrintPageStyle(paperSize);

    // Panggil window.print secara langsung (sinkron) agar DOM struk tidak terlanjur dibersihkan
    window.print();
  }
}

window.ReceiptExporter = ReceiptExporter;
