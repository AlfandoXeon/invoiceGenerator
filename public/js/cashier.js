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

  findProduct(identifier) {
    if (!window.STORE_PRODUCTS || !Array.isArray(window.STORE_PRODUCTS)) return null;
    const idStr = String(identifier || '').trim();
    if (!idStr) return null;
    const lower = idStr.toLowerCase();

    return window.STORE_PRODUCTS.find(p => 
      String(p.id) === idStr ||
      (p.barcode && p.barcode.toLowerCase() === lower) ||
      (p.name && p.name.toLowerCase() === lower)
    ) || null;
  },

  addItem(name, price, qty = 1, productId = null) {
    name = (name || '').trim();
    price = parseFloat(price) || 0;
    qty = parseInt(qty, 10) || 1;

    if (!name) {
      if (typeof showToast === 'function') showToast('Nama barang harus diisi', 'warning');
      return false;
    }

    if (qty <= 0) {
      if (typeof showToast === 'function') showToast('Jumlah barang minimal 1', 'warning');
      return false;
    }

    // Cari apakah barang ini terdaftar di katalog produk toko
    const catalogProd = productId ? this.findProduct(productId) : this.findProduct(name);
    const finalName = catalogProd ? catalogProd.name : name;
    const finalPrice = price > 0 ? price : (catalogProd ? catalogProd.sellingPrice : 0);
    const finalId = catalogProd ? catalogProd.id : null;
    const finalUnit = catalogProd ? (catalogProd.unit || 'Pcs') : 'Pcs';
    const isCatalogItem = !!catalogProd;
    const availableStock = isCatalogItem ? (parseInt(catalogProd.stock, 10) || 0) : null;

    // Validasi stok jika barang terdaftar di katalog
    if (isCatalogItem) {
      if (availableStock <= 0) {
        const msg = `Stok "${finalName}" telah habis (Sisa: 0 ${finalUnit})`;
        if (typeof showToast === 'function') {
          showToast(msg, 'error');
        } else {
          alert(msg);
        }
        return false;
      }

      // Hitung total permintaan termasuk yang sudah ada di keranjang
      const existingIndex = this.state.items.findIndex(i => 
        (finalId && i.id === finalId) || i.name.toLowerCase() === finalName.toLowerCase()
      );

      const currentQtyInCart = existingIndex > -1 ? this.state.items[existingIndex].qty : 0;
      const totalDemand = currentQtyInCart + qty;

      if (totalDemand > availableStock) {
        const msg = `Stok "${finalName}" tidak mencukupi. Tersedia: ${availableStock} ${finalUnit}, di keranjang saat ini: ${currentQtyInCart}`;
        if (typeof showToast === 'function') {
          showToast(msg, 'warning');
        } else {
          alert(msg);
        }
        return false;
      }

      if (existingIndex > -1) {
        this.state.items[existingIndex].qty = totalDemand;
        this.state.items[existingIndex].stock = availableStock;
        this.state.items[existingIndex].unit = finalUnit;
      } else {
        this.state.items.push({
          id: finalId,
          name: finalName,
          price: finalPrice,
          qty: qty,
          stock: availableStock,
          unit: finalUnit
        });
      }
    } else {
      // Barang bebas (manual non-katalog)
      const existingIndex = this.state.items.findIndex(i => i.name.toLowerCase() === finalName.toLowerCase());
      if (existingIndex > -1) {
        this.state.items[existingIndex].qty += qty;
      } else {
        this.state.items.push({
          id: null,
          name: finalName,
          price: finalPrice,
          qty: qty,
          stock: null,
          unit: 'Pcs'
        });
      }
    }

    this.render();
    if (typeof showToast === 'function') showToast(`"${finalName}" dimasukkan ke daftar`, 'info');
    return true;
  },

  addFromPreset(productId) {
    const prod = this.findProduct(productId);
    if (prod) {
      this.addItem(prod.name, prod.sellingPrice, 1, prod.id);
    }
  },

  changeQty(index, delta) {
    const item = this.state.items[index];
    if (!item) return;

    if (delta > 0) {
      const prod = this.findProduct(item.id || item.name);
      if (prod) {
        const available = parseInt(prod.stock, 10) || 0;
        if (item.qty + delta > available) {
          if (typeof showToast === 'function') {
            showToast(`Jumlah melebihi stok yang tersedia (${available} ${prod.unit || 'Pcs'})`, 'warning');
          }
          return;
        }
      }
    }

    item.qty += delta;
    if (item.qty <= 0) {
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
    const cash = Math.max(0, parseFloat(this.state.cashReceived) || 0);
    const shortage = Math.max(0, grandTotal - cash);
    const change = Math.max(0, cash - grandTotal);
    const isUnderpaid = this.state.items.length > 0 && cash < grandTotal;

    return {
      subtotal,
      discount,
      taxable,
      taxAmount,
      grandTotal,
      cash,
      shortage,
      change,
      isUnderpaid
    };
  },

  setFastCash(amount) {
    const calc = this.calculate();
    const cashInput = document.getElementById('input-cash');
    const current = Math.max(0, cashInput ? (parseFloat(cashInput.value) || 0) : (parseFloat(this.state.cashReceived) || 0));

    if (amount === 'exact') {
      this.state.cashReceived = Math.max(0, calc.grandTotal);
    } else if (amount === 'reset' || amount === 0) {
      this.state.cashReceived = 0;
    } else {
      const addedValue = Math.max(0, parseFloat(amount) || 0);
      this.state.cashReceived = current + addedValue;
    }
    if (cashInput) cashInput.value = this.state.cashReceived;
    this.render();
  },

  updateStateFromInputs() {
    const cashierInput = document.getElementById('input-cashier');
    if (cashierInput) this.state.cashier = cashierInput.value;

    const invoiceInput = document.getElementById('input-invoice-number');
    if (invoiceInput) this.state.invoiceNumber = invoiceInput.value;

    const discountInput = document.getElementById('input-discount');
    if (discountInput) {
      const discVal = parseFloat(discountInput.value) || 0;
      this.state.discount = Math.max(0, discVal);
      if (discVal < 0) discountInput.value = 0;
    }

    const taxInput = document.getElementById('input-tax-percent');
    if (taxInput) {
      const taxVal = parseFloat(taxInput.value) || 0;
      this.state.taxPercent = Math.max(0, taxVal);
      if (taxVal < 0) taxInput.value = 0;
    }

    const cashInput = document.getElementById('input-cash');
    if (cashInput) {
      let cashVal = parseFloat(cashInput.value);
      if (isNaN(cashVal) || cashVal < 0) {
        if (cashInput.value !== '' && cashVal < 0) {
          if (typeof showToast === 'function') {
            showToast('Nominal uang tidak boleh bernilai minus', 'warning');
          }
        }
        cashVal = Math.max(0, cashVal || 0);
        cashInput.value = cashVal;
      }
      this.state.cashReceived = cashVal;
    }

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
        tableBody.innerHTML = this.state.items.map((item, idx) => {
          const prod = this.findProduct(item.id || item.name);
          const currentStock = prod ? (parseInt(prod.stock, 10) || 0) : null;
          const remaining = currentStock !== null ? (currentStock - item.qty) : null;

          return `
          <tr class="hover:bg-slate-50 transition">
            <td class="py-2.5 px-3">
              <div class="font-semibold text-slate-800 text-xs sm:text-sm">${item.name}</div>
              ${currentStock !== null ? `
                <div class="text-[10px] text-slate-500">
                  Stok: ${currentStock} &bull; Sisa: <span class="${remaining < 0 ? 'text-red-600 font-bold' : 'text-slate-700 font-medium'}">${remaining} ${prod.unit || 'Pcs'}</span>
                </div>
              ` : `
                <div class="text-[10px] text-slate-400 italic">Barang Manual</div>
              `}
            </td>
            <td class="py-2.5 px-2 text-center">
              <div class="inline-flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5">
                <button type="button" onclick="CashierApp.changeQty(${idx}, -1)" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-100 rounded font-bold" title="Kurangi">
                  <span class="material-symbols-outlined text-xs">remove</span>
                </button>
                <span class="w-6 text-center font-bold text-xs text-slate-900">${item.qty}</span>
                <button type="button" onclick="CashierApp.changeQty(${idx}, 1)" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-100 rounded font-bold" title="Tambah">
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
        `;
        }).join('');
      }
    }

    // 2. Render Total & Kembalian
    const elGrandTotal = document.getElementById('val-grandtotal');
    if (elGrandTotal) elGrandTotal.innerText = this.formatRupiah(calc.grandTotal);

    const elChangeLabel = document.getElementById('label-change');
    const elChange = document.getElementById('val-change');
    const elStatusNote = document.getElementById('cash-status-note');

    if (calc.isUnderpaid) {
      if (elChangeLabel) elChangeLabel.innerText = 'Kurang:';
      if (elChange) {
        elChange.innerText = `-${this.formatRupiah(calc.shortage)}`;
        elChange.classList.add('text-red-600');
        elChange.classList.remove('text-emerald-600');
      }
      if (elStatusNote) {
        elStatusNote.classList.remove('hidden');
        elStatusNote.className = 'text-xs mt-1.5 p-1.5 rounded bg-red-50 text-red-600 border border-red-200 font-medium flex items-center gap-1';
        elStatusNote.innerHTML = `<span class="material-symbols-outlined text-sm">error</span><span>Uang kurang ${this.formatRupiah(calc.shortage)} (belum bisa cetak struk)</span>`;
      }
    } else {
      if (elChangeLabel) elChangeLabel.innerText = 'Kembalian:';
      if (elChange) {
        elChange.innerText = this.formatRupiah(calc.change);
        elChange.classList.remove('text-red-600');
        elChange.classList.add('text-emerald-600');
      }
      if (elStatusNote) {
        if (this.state.items.length > 0 && calc.grandTotal > 0) {
          elStatusNote.classList.remove('hidden');
          elStatusNote.className = 'text-xs mt-1.5 p-1.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1';
          elStatusNote.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span><span>Pembayaran Pas / Lunas</span>`;
        } else {
          elStatusNote.classList.add('hidden');
        }
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

  validateCartStock() {
    if (!window.STORE_PRODUCTS || !Array.isArray(window.STORE_PRODUCTS)) {
      return { valid: true, errors: [] };
    }

    const errors = [];
    const aggregated = new Map();

    for (const item of this.state.items) {
      const prod = this.findProduct(item.id || item.name);
      if (prod) {
        const entry = aggregated.get(prod.id) || { prod, totalQty: 0 };
        entry.totalQty += (parseInt(item.qty, 10) || 0);
        aggregated.set(prod.id, entry);
      }
    }

    for (const [, { prod, totalQty }] of aggregated) {
      const available = parseInt(prod.stock, 10) || 0;
      if (available <= 0) {
        errors.push(`Stok "${prod.name}" telah habis`);
      } else if (totalQty > available) {
        errors.push(`Stok "${prod.name}" kurang (Tersedia: ${available}, diminta: ${totalQty})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * TAHAP 1: VALIDASI & BUKA MODAL KONFIRMASI (TIDAK LANGSUNG SIMPAN KE DB)
   */
  startCheckout(actionType = 'print') {
    if (this.state.items.length === 0) {
      if (typeof showToast === 'function') showToast('Daftar belanjaan masih kosong', 'warning');
      return;
    }

    // Validasi stok seluruh item sebelum kasir diarahkan ke konfirmasi
    const stockCheck = this.validateCartStock();
    if (!stockCheck.valid) {
      const errMsg = stockCheck.errors.join('; ');
      if (typeof showToast === 'function') {
        showToast(errMsg, 'error');
      } else {
        alert('Stok tidak mencukupi: ' + errMsg);
      }
      return;
    }

    this.state.pendingActionType = actionType;
    const calc = this.calculate();

    // 2. Validasi nominal uang tidak boleh minus
    if (this.state.cashReceived < 0) {
      if (typeof showToast === 'function') {
        showToast('Nominal uang diterima tidak boleh minus (negatif)', 'error');
      } else {
        alert('Nominal uang diterima tidak boleh minus');
      }
      const cashInput = document.getElementById('input-cash');
      if (cashInput) {
        cashInput.value = 0;
        cashInput.focus();
      }
      this.state.cashReceived = 0;
      this.render();
      return;
    }

    // 3. Validasi uang tidak boleh kurang dari harga total (jika kurang tidak bisa cetak struk)
    if (calc.isUnderpaid) {
      const shortageFormatted = this.formatRupiah(calc.shortage);
      const grandTotalFormatted = this.formatRupiah(calc.grandTotal);
      const cashFormatted = this.formatRupiah(this.state.cashReceived);
      const errMsg = `Uang diterima (${cashFormatted}) kurang ${shortageFormatted} dari total belanja (${grandTotalFormatted}). Tidak bisa mencetak struk sebelum pembayaran lunas.`;

      if (typeof showToast === 'function') {
        showToast(errMsg, 'error');
      } else {
        alert(errMsg);
      }

      const cashInput = document.getElementById('input-cash');
      if (cashInput) {
        cashInput.focus();
        cashInput.classList.add('border-red-500', 'ring-2', 'ring-red-400');
        setTimeout(() => cashInput.classList.remove('border-red-500', 'ring-2', 'ring-red-400'), 2500);
      }
      return;
    }

    // Isi ringkasan di modal konfirmasi
    document.getElementById('conf-invoice').innerText = this.state.invoiceNumber;
    document.getElementById('conf-cashier').innerText = this.state.cashier;
    document.getElementById('conf-method').innerText = this.state.paymentMethod;
    document.getElementById('conf-total-items').innerText = `${this.state.items.length} macam (${this.state.items.reduce((a, c) => a + c.qty, 0)} pcs)`;
    document.getElementById('conf-grandtotal').innerText = this.formatRupiah(calc.grandTotal);
    document.getElementById('conf-cash').innerText = this.formatRupiah(this.state.cashReceived);
    document.getElementById('conf-change').innerText = this.formatRupiah(calc.change);

    // Render daftar ringkas item di modal konfirmasi beserta info sisa stok
    const itemsPreview = document.getElementById('conf-items-summary');
    if (itemsPreview) {
      itemsPreview.innerHTML = this.state.items.map(item => {
        const prod = this.findProduct(item.id || item.name);
        const currentStock = prod ? (parseInt(prod.stock, 10) || 0) : null;
        const remaining = currentStock !== null ? Math.max(0, currentStock - item.qty) : null;

        return `
        <div class="flex justify-between py-1 text-xs border-b border-slate-100 last:border-0">
          <div>
            <span class="font-medium text-slate-800">${item.name} <span class="text-slate-500">x${item.qty}</span></span>
            ${remaining !== null ? `<span class="text-[10px] text-slate-500 ml-1">(Sisa stok: ${remaining})</span>` : ''}
          </div>
          <span class="font-mono font-semibold text-slate-900">${this.formatRupiah(item.price * item.qty)}</span>
        </div>
      `;
      }).join('');
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

    if (this.state.items.length === 0) {
      if (typeof showToast === 'function') showToast('Daftar belanjaan masih kosong', 'warning');
      return;
    }

    if (this.state.cashReceived < 0) {
      if (typeof showToast === 'function') showToast('Nominal uang tidak boleh bernilai minus', 'error');
      return;
    }

    if (calc.isUnderpaid) {
      const shortageFormatted = this.formatRupiah(calc.shortage);
      if (typeof showToast === 'function') {
        showToast(`Uang diterima kurang ${shortageFormatted}. Tidak bisa mencetak struk.`, 'error');
      } else {
        alert(`Uang diterima kurang ${shortageFormatted}. Tidak bisa mencetak struk.`);
      }
      return;
    }

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

        // Sinkronisasi data stok barang terbaru dari server
        if (result.data && Array.isArray(result.data.products)) {
          window.STORE_PRODUCTS = result.data.products;
          this.refreshCatalogUI();
        }

        if (typeof showToast === 'function') {
          showToast('Transaksi berhasil disimpan dan stok barang telah diperbarui', 'success');
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
  },

  /**
   * Memperbarui elemen antarmuka yang menampilkan stok barang secara realtime
   */
  refreshCatalogUI() {
    if (!window.STORE_PRODUCTS || !Array.isArray(window.STORE_PRODUCTS)) return;

    // 1. Perbarui Datalist input barang
    const datalist = document.getElementById('products-datalist');
    if (datalist) {
      datalist.innerHTML = window.STORE_PRODUCTS.map(p => `
        <option value="${p.name}" data-price="${p.sellingPrice}" data-stock="${p.stock}">
          ${this.formatRupiah(p.sellingPrice)} - Stok: ${p.stock}
        </option>
      `).join('');
    }

    // 2. Perbarui Tombol Pilihan Cepat
    const quickContainer = document.getElementById('quick-presets-container');
    if (quickContainer) {
      quickContainer.innerHTML = window.STORE_PRODUCTS.slice(0, 8).map(prod => {
        const isOut = prod.stock <= 0;
        return `
          <button type="button" 
            onclick="CashierApp.addFromPreset('${prod.id}')" 
            class="px-2.5 py-1 rounded-md text-xs transition flex items-center gap-1 active:scale-95 ${isOut ? 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}"
            ${isOut ? 'title="Stok Habis"' : ''}>
            <span>${prod.name}</span>
            <span class="text-slate-400 text-[11px]">(${this.formatRupiah(prod.sellingPrice).replace('Rp', '')} | Stok: ${prod.stock})</span>
          </button>
        `;
      }).join('');
    }

    // 3. Perbarui Ringkasan Kartu
    const countEl = document.getElementById('stat-products-count');
    if (countEl) countEl.innerText = `${window.STORE_PRODUCTS.length} Produk`;
  }
};

window.CashierApp = CashierApp;
