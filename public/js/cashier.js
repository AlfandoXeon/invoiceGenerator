/**
 * CASHIER CONTROLLER (Frontend) - Xeon Invoice Generator
 * Bersih, Reaktif, Validasi Konfirmasi Sebelum Cetak & Simpan
 */

const CashierApp = {
  state: {
    items: [],
    discount: 0,
    taxPercent: 10,
    cashReceived: 0,
    paymentMethod: 'TUNAI',
    cashier: 'Kasir',
    invoiceNumber: '',
    note: '',
    pendingActionType: 'print' // 'print' atau 'png'
  },

  init(initialConfig, nextInvoice) {
    this.config = initialConfig || {};
    this.state.taxPercent = this.config.pos?.defaultTaxPercent ?? 10;
    this.state.paymentMethod = this.config.pos?.defaultPaymentMethod || 'TUNAI';
    this.state.cashier = this.config.pos?.defaultCashier || 'Kasir';
    this.state.invoiceNumber = nextInvoice || 'NOTA-0001';

    const taxInput = document.getElementById('input-tax-percent');
    if (taxInput) taxInput.value = this.state.taxPercent;

    const cashierInput = document.getElementById('input-cashier');
    if (cashierInput) cashierInput.value = this.state.cashier;

    const invoiceInput = document.getElementById('input-invoice-number');
    if (invoiceInput) invoiceInput.value = this.state.invoiceNumber;

    const paymentMethodSelect = document.getElementById('select-payment-method');
    if (paymentMethodSelect) paymentMethodSelect.value = this.state.paymentMethod;

    this.render();
  },

  formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  },

  addItem(name, price, qty = 1) {
    name = (name || '').trim();
    price = parseFloat(price) || 0;
    qty = parseInt(qty) || 1;

    if (!name) {
      if (typeof showToast === 'function') showToast('Nama barang harus diisi', 'warning');
      return;
    }

    const existingIndex = this.state.items.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
    if (existingIndex > -1) {
      this.state.items[existingIndex].qty += qty;
    } else {
      this.state.items.push({ name, price, qty });
    }

    this.render();
    if (typeof showToast === 'function') showToast(`"${name}" dimasukkan ke daftar`, 'info');
  },

  addFromPreset(productId) {
    if (!window.STORE_PRODUCTS) return;
    const prod = window.STORE_PRODUCTS.find(p => String(p.id) === String(productId));
    if (prod) {
      this.addItem(prod.name, prod.sellingPrice, 1);
    }
  },

  changeQty(index, delta) {
    if (!this.state.items[index]) return;
    this.state.items[index].qty += delta;
    if (this.state.items[index].qty <= 0) {
      this.state.items.splice(index, 1);
    }
    this.render();
  },

  removeItem(index) {
    if (!this.state.items[index]) return;
    this.state.items.splice(index, 1);
    this.render();
  },

  clearAll() {
    if (this.state.items.length === 0) return;
    if (confirm('Kosongkan semua daftar belanjaan?')) {
      this.state.items = [];
      this.state.discount = 0;
      this.state.cashReceived = 0;
      const discountInput = document.getElementById('input-discount');
      if (discountInput) discountInput.value = 0;
      const cashInput = document.getElementById('input-cash');
      if (cashInput) cashInput.value = 0;
      this.render();
      if (typeof showToast === 'function') showToast('Daftar belanjaan dikosongkan', 'info');
    }
  },

  calculate() {
    const subtotal = this.state.items.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const discount = Math.min(subtotal, Math.max(0, this.state.discount));
    const taxable = Math.max(0, subtotal - discount);
    const taxAmount = Math.round(taxable * (this.state.taxPercent / 100));
    const grandTotal = taxable + taxAmount;
    const change = Math.max(0, this.state.cashReceived - grandTotal);
    const isUnderpaid = this.state.paymentMethod === 'TUNAI' && this.state.items.length > 0 && this.state.cashReceived < grandTotal;

    return {
      subtotal,
      discount,
      taxable,
      taxAmount,
      grandTotal,
      change,
      isUnderpaid
    };
  },

  setFastCash(amount) {
    const calc = this.calculate();
    if (amount === 'exact') {
      this.state.cashReceived = calc.grandTotal;
    } else {
      this.state.cashReceived = parseFloat(amount) || 0;
    }
    const cashInput = document.getElementById('input-cash');
    if (cashInput) cashInput.value = this.state.cashReceived;
    this.render();
  },

  updateStateFromInputs() {
    const cashierInput = document.getElementById('input-cashier');
    if (cashierInput) this.state.cashier = cashierInput.value;

    const invoiceInput = document.getElementById('input-invoice-number');
    if (invoiceInput) this.state.invoiceNumber = invoiceInput.value;

    const discountInput = document.getElementById('input-discount');
    if (discountInput) this.state.discount = parseFloat(discountInput.value) || 0;

    const taxInput = document.getElementById('input-tax-percent');
    if (taxInput) this.state.taxPercent = parseFloat(taxInput.value) || 0;

    const cashInput = document.getElementById('input-cash');
    if (cashInput) this.state.cashReceived = parseFloat(cashInput.value) || 0;

    const methodInput = document.getElementById('select-payment-method');
    if (methodInput) this.state.paymentMethod = methodInput.value;

    this.render();
  },

  render() {
    const calc = this.calculate();

    // 1. Render Tabel Item di Form Kasir (Kiri)
    const tableBody = document.getElementById('cashier-items-body');
    if (tableBody) {
      if (this.state.items.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="py-8 text-center text-slate-400">
              <span class="material-symbols-outlined text-3xl text-slate-300 block mb-1">shopping_basket</span>
              <p class="text-xs">Belum ada barang di daftar belanjaan.</p>
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = this.state.items.map((item, idx) => `
          <tr class="hover:bg-slate-50 transition">
            <td class="py-2.5 px-3 font-semibold text-slate-800 text-xs sm:text-sm">${item.name}</td>
            <td class="py-2.5 px-2 text-center">
              <div class="inline-flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5">
                <button type="button" onclick="CashierApp.changeQty(${idx}, -1)" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-100 rounded font-bold">
                  <span class="material-symbols-outlined text-xs">remove</span>
                </button>
                <span class="w-6 text-center font-bold text-xs text-slate-900">${item.qty}</span>
                <button type="button" onclick="CashierApp.changeQty(${idx}, 1)" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-100 rounded font-bold">
                  <span class="material-symbols-outlined text-xs">add</span>
                </button>
              </div>
            </td>
            <td class="py-2.5 px-3 text-right text-xs text-slate-600 font-mono">${this.formatRupiah(item.price)}</td>
            <td class="py-2.5 px-3 text-right text-xs font-bold text-slate-900 font-mono">${this.formatRupiah(item.price * item.qty)}</td>
            <td class="py-2.5 px-2 text-center">
              <button type="button" onclick="CashierApp.removeItem(${idx})" class="p-1 text-slate-400 hover:text-red-600 rounded transition" title="Hapus">
                <span class="material-symbols-outlined text-base">delete</span>
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    // 2. Render Total & Kembalian
    const elGrandTotal = document.getElementById('val-grandtotal');
    if (elGrandTotal) elGrandTotal.innerText = this.formatRupiah(calc.grandTotal);

    const elChange = document.getElementById('val-change');
    if (elChange) {
      elChange.innerText = this.formatRupiah(calc.change);
      if (calc.isUnderpaid) {
        elChange.classList.add('text-red-600');
        elChange.classList.remove('text-emerald-600');
      } else {
        elChange.classList.remove('text-red-600');
        elChange.classList.add('text-emerald-600');
      }
    }

    // 3. Render Preview Struk (Kanan)
    const previewInvoice = document.getElementById('preview-receipt-no');
    if (previewInvoice) previewInvoice.innerText = this.state.invoiceNumber;

    const previewCashier = document.getElementById('preview-cashier');
    if (previewCashier) previewCashier.innerText = this.state.cashier;

    const previewMethod = document.getElementById('preview-payment-method');
    if (previewMethod) previewMethod.innerText = this.state.paymentMethod;

    const previewItems = document.getElementById('preview-items-list');
    if (previewItems) {
      if (this.state.items.length === 0) {
        previewItems.innerHTML = `
          <div class="text-center py-4 text-slate-400 italic text-[11px]">
            Keranjang Kosong
          </div>
        `;
      } else {
        previewItems.innerHTML = this.state.items.map(item => `
          <div class="thermal-row text-[11px] leading-tight py-1 font-mono">
            <div class="font-bold text-black uppercase tracking-tight">${item.name}</div>
            <div class="flex justify-between text-slate-700">
              <span>${item.qty} x ${this.formatRupiah(item.price).replace('Rp', '')}</span>
              <span class="font-bold text-black">${this.formatRupiah(item.price * item.qty).replace('Rp', '')}</span>
            </div>
          </div>
        `).join('');
      }
    }

    const prevSubtotal = document.getElementById('prev-subtotal');
    if (prevSubtotal) prevSubtotal.innerText = this.formatRupiah(calc.subtotal);

    const prevDiscount = document.getElementById('prev-discount');
    if (prevDiscount) prevDiscount.innerText = this.formatRupiah(calc.discount);

    const prevTaxRate = document.getElementById('prev-tax-rate');
    if (prevTaxRate) prevTaxRate.innerText = this.state.taxPercent;

    const prevTaxAmount = document.getElementById('prev-tax-amount');
    if (prevTaxAmount) prevTaxAmount.innerText = this.formatRupiah(calc.taxAmount);

    const prevGrandTotal = document.getElementById('prev-grandtotal');
    if (prevGrandTotal) prevGrandTotal.innerText = this.formatRupiah(calc.grandTotal);

    const prevCash = document.getElementById('prev-cash');
    if (prevCash) prevCash.innerText = this.formatRupiah(this.state.cashReceived);

    const prevChange = document.getElementById('prev-change');
    if (prevChange) prevChange.innerText = this.formatRupiah(calc.change);
  },

  /**
   * TAHAP 1: VALIDASI & BUKA MODAL KONFIRMASI (TIDAK LANGSUNG SIMPAN KE DB)
   */
  startCheckout(actionType = 'print') {
    if (this.state.items.length === 0) {
      if (typeof showToast === 'function') showToast('Daftar belanjaan masih kosong', 'warning');
      return;
    }

    this.state.pendingActionType = actionType;
    const calc = this.calculate();

    // Isi ringkasan di modal konfirmasi
    document.getElementById('conf-invoice').innerText = this.state.invoiceNumber;
    document.getElementById('conf-cashier').innerText = this.state.cashier;
    document.getElementById('conf-method').innerText = this.state.paymentMethod;
    document.getElementById('conf-total-items').innerText = `${this.state.items.length} macam (${this.state.items.reduce((a, c) => a + c.qty, 0)} pcs)`;
    document.getElementById('conf-grandtotal').innerText = this.formatRupiah(calc.grandTotal);
    document.getElementById('conf-cash').innerText = this.formatRupiah(this.state.cashReceived);
    document.getElementById('conf-change').innerText = this.formatRupiah(calc.change);

    // Render daftar ringkas item di modal konfirmasi
    const itemsPreview = document.getElementById('conf-items-summary');
    if (itemsPreview) {
      itemsPreview.innerHTML = this.state.items.map(item => `
        <div class="flex justify-between py-1 text-xs border-b border-slate-100 last:border-0">
          <span class="font-medium text-slate-800">${item.name} <span class="text-slate-500">x${item.qty}</span></span>
          <span class="font-mono font-semibold text-slate-900">${this.formatRupiah(item.price * item.qty)}</span>
        </div>
      `).join('');
    }

    // Peringatan jika kurang bayar pada pembayaran tunai
    const warningEl = document.getElementById('conf-warning-box');
    if (warningEl) {
      if (calc.isUnderpaid) {
        warningEl.classList.remove('hidden');
        warningEl.innerText = `Catatan: Uang diterima (${this.formatRupiah(this.state.cashReceived)}) kurang dari total belanja (${this.formatRupiah(calc.grandTotal)}).`;
      } else {
        warningEl.classList.add('hidden');
      }
    }

    // Buka Modal Konfirmasi
    const modal = document.getElementById('order-confirm-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  closeConfirmModal() {
    const modal = document.getElementById('order-confirm-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  /**
   * TAHAP 2: KASIR SUDAH YAKIN -> EKSEKUSI CETAK & SIMPAN (ATAU CETAK SAJA)
   */
  async confirmAndExecute(saveToDb = true) {
    this.closeConfirmModal();

    const calc = this.calculate();
    const storeName = this.config.store?.name || 'Toko';

    try {
      if (saveToDb) {
        const payload = {
          invoiceNumber: this.state.invoiceNumber,
          cashier: this.state.cashier,
          items: this.state.items,
          subtotal: calc.subtotal,
          discount: calc.discount,
          taxPercent: this.state.taxPercent,
          taxAmount: calc.taxAmount,
          grandTotal: calc.grandTotal,
          paymentMethod: this.state.paymentMethod,
          cashReceived: this.state.cashReceived,
          change: calc.change,
          note: this.state.note
        };

        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Gagal menyimpan transaksi');
        }

        if (typeof showToast === 'function') {
          showToast('Transaksi berhasil disimpan ke riwayat', 'success');
        }
      } else {
        if (typeof showToast === 'function') {
          showToast('Mencetak struk (tanpa simpan ke riwayat)', 'info');
        }
      }

      // Lakukan aksi cetak fisik atau unduh gambar
      if (this.state.pendingActionType === 'png') {
        await ReceiptExporter.exportToPng('receipt-paper', this.state.invoiceNumber, storeName);
      } else {
        const paperSize = this.config.pos?.paperSize || '58mm';
        ReceiptExporter.printDirect(paperSize);
      }

      // Jika disimpan ke DB, siapkan transaksi berikutnya dan bersihkan form
      if (saveToDb) {
        await this.fetchNextInvoice();
        this.state.items = [];
        this.state.discount = 0;
        this.state.cashReceived = 0;
        const cashInput = document.getElementById('input-cash');
        if (cashInput) cashInput.value = 0;
        const discInput = document.getElementById('input-discount');
        if (discInput) discInput.value = 0;
        this.render();
      }

    } catch (error) {
      console.error('[CashierApp] Checkout Error:', error);
      alert('Terjadi kesalahan: ' + error.message);
    }
  },

  async fetchNextInvoice() {
    try {
      const res = await fetch('/api/next-invoice');
      const json = await res.json();
      if (json.success && json.data?.invoiceNumber) {
        this.state.invoiceNumber = json.data.invoiceNumber;
        const invoiceInput = document.getElementById('input-invoice-number');
        if (invoiceInput) invoiceInput.value = this.state.invoiceNumber;
        this.render();
      }
    } catch (err) {
      console.warn('Gagal ambil nomor nota baru:', err);
    }
  }
};

window.CashierApp = CashierApp;
