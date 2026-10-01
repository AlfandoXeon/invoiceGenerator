/**
 * RECEIPT EXPORTER - Xeon Invoice Generator
 * Ekspor Gambar Struk untuk WhatsApp & Cetak Printer
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
      alert('Struk tidak ditemukan');
      return;
    }

    const downloadBtn = document.getElementById('btn-download-png');
    let originalHtml = '';
    if (downloadBtn) {
      originalHtml = downloadBtn.innerHTML;
      downloadBtn.innerHTML = `
        <span class="material-symbols-outlined text-base">hourglass_empty</span>
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
      alert('Gagal membuat gambar: ' + error.message);
    } finally {
      if (downloadBtn) {
        downloadBtn.innerHTML = originalHtml;
        downloadBtn.disabled = false;
      }
    }
  }

  /**
   * Cetak langsung struk ke printer
   * @param {string} paperSize - '58mm' atau '80mm'
   */
  static printDirect(paperSize = '58mm') {
    const printWrapper = document.getElementById('receipt-paper');
    if (!printWrapper) {
      alert('Area struk tidak ditemukan');
      return;
    }

    if (paperSize === '80mm') {
      printWrapper.classList.remove('paper-58mm');
      printWrapper.classList.add('paper-80mm');
    } else {
      printWrapper.classList.remove('paper-80mm');
      printWrapper.classList.add('paper-58mm');
    }

    window.print();
  }
}

window.ReceiptExporter = ReceiptExporter;
