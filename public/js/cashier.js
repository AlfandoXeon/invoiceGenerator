/**
 * CASHIER CONTROLLER (Frontend) - Xeon Invoice Generator
 * Bersih, Reaktif, Cepat, Shortcut Keyboard Lengkap & Validasi Transaksi Atomik
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
    paperSize: '58mm',
    pendingActionType: 'print' // 'print' atau 'png'
  },

  init(initialConfig, nextInvoice) {
    this.config = initialConfig || {};
    this.state.taxPercent = this.config.pos?.defaultTaxPercent ?? 10;
    this.state.paymentMethod = this.config.pos?.defaultPaymentMethod || 'TUNAI';
    this.state.cashier = this.config.pos?.defaultCashier || 'Kasir';
    this.state.invoiceNumber = nextInvoice || 'NOTA-0001';
    this.state.paperSize = this.config.pos?.paperSize || '58mm';

    const taxInput = document.getElementById('input-tax-percent');
    if (taxInput) taxInput.value = this.state.taxPercent;

    const cashierInput = document.getElementById('input-cashier');
    if (cashierInput) cashierInput.value = this.state.cashier;

    const invoiceInput = document.getElementById('input-invoice-number');
    if (invoiceInput) invoiceInput.value = this.state.invoiceNumber;

    const paymentMethodSelect = document.getElementById('select-payment-method');
    if (paymentMethodSelect) paymentMethodSelect.value = this.state.paymentMethod;

    this.bindKeyboardShortcuts();
    this.setPaperSize(this.state.paperSize);
    this.render();
  },

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Abaikan jika fokus di modal lain atau sedang mengetik di input tertentu jika bukan F-keys
      if (e.key === 'F2') {
        e.preventDefault();
        const nameInput = document.getElementById('quick-item-name');
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        this.startCheckout('print');
      } else if (e.key === 'F8') {
        e.preventDefault();
        const discInput = document.getElementById('input-discount');
        if (discInput) {
          discInput.focus();
          discInput.select();
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        this.clearAll();
      } else if (e.key === 'Escape') {
        this.closeConfirmModal();
      }
    });
  },

  setPaperSize(size) {
    this.state.paperSize = size;
    const paper = document.getElementById('receipt-paper');
    const badge = document.getElementById('current-paper-label');
    const btn58 = document.getElementById('btn-paper-58');
    const btn80 = document.getElementById('btn-paper-80');

    if (paper) {
      if (size === '80mm') {
        paper.classList.remove('paper-58mm');
        paper.classList.add('paper-80mm');
        paper.style.maxWidth = '400px';
      } else {
        paper.classList.remove('paper-80mm');
        paper.classList.add('paper-58mm');
        paper.style.maxWidth = '340px';
      }
    }

    if (badge) badge.innerText = size;

    if (btn58 && btn80) {
      if (size === '80mm') {
        btn80.classList.add('bg-[var(--color-primary)]', 'text-white');
        btn80.classList.remove('text-[var(--color-text-muted)]');
        btn58.classList.remove('bg-[var(--color-primary)]', 'text-white');
        btn58.classList.add('text-[var(--color-text-muted)]');
      } else {
        btn58.classList.add('bg-[var(--color-primary)]', 'text-white');
        btn58.classList.remove('text-[var(--color-text-muted)]');
        btn80.classList.remove('bg-[var(--color-primary)]', 'text-white');
        btn80.classList.add('text-[var(--color-text-muted)]');
      }
    }

    // Sinkronkan CSS @page cetak printer sejak awal
    if (typeof ReceiptExporter !== 'undefined' && typeof ReceiptExporter.applyPrintPageStyle === 'function') {
      ReceiptExporter.applyPrintPageStyle(size);
    }
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

    const catalogProd = productId ? this.findProduct(productId) : this.findProduct(name);
    const finalName = catalogProd ? catalogProd.name : name;
    const finalPrice = price > 0 ? price : (catalogProd ? catalogProd.sellingPrice : 0);
    const finalId = catalogProd ? catalogProd.id : null;
    const finalUnit = catalogProd ? (catalogProd.unit || 'Pcs') : 'Pcs';
    const isCatalogItem = !!catalogProd;
    const availableStock = isCatalogItem ? (parseInt(catalogProd.stock, 10) || 0) : null;

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
    if (typeof showToast === 'function') showToast(`"${finalName}" ditambahkan`, 'info', 1800);
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

    const methodInput = document.getElementById('select-payment-method');
    if (methodInput) this.state.paymentMethod = methodInput.value;

    const calc = this.calculate();
    const cashInput = document.getElementById('input-cash');

    if (this.state.paymentMethod !== 'TUNAI') {
      this.state.cashReceived = calc.grandTotal;
      if (cashInput) {
        cashInput.value = calc.grandTotal;
        cashInput.readOnly = true;
        cashInput.classList.add('opacity-75');
      }
    } else {
      if (cashInput) {
        cashInput.readOnly = false;
        cashInput.classList.remove('opacity-75');
        let cashVal = parseFloat(cashInput.value);
        if (isNaN(cashVal) || cashVal < 0) {
          cashVal = Math.max(0, cashVal || 0);
          cashInput.value = cashVal;
        }
        this.state.cashReceived = cashVal;
      }
    }

    this.render();
  },

  render() {
    const calc = this.calculate();

    // 1. Render Tabel Item di Keranjang
    const tableBody = document.getElementById('cashier-items-body');
    if (tableBody) {
      if (this.state.items.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="py-10 text-center text-[var(--color-text-subtle)]">
              <span class="material-symbols-outlined text-4xl opacity-40 block mb-1.5" aria-hidden="true">shopping_basket</span>
              <p class="text-xs font-medium">Belum ada barang di daftar belanjaan.</p>
              <p class="text-[11px] opacity-75 mt-0.5">Pilih dari tombol cepat atau ketik di form atas (Tekan F2).</p>
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = this.state.items.map((item, idx) => {
          const prod = this.findProduct(item.id || item.name);
          const currentStock = prod ? (parseInt(prod.stock, 10) || 0) : null;
          const remaining = currentStock !== null ? (currentStock - item.qty) : null;

          return `
          <tr class="hover:bg-[var(--color-bg-hover)] transition">
            <td class="py-2.5 px-3">
              <div class="font-semibold text-[var(--color-text-main)] text-xs sm:text-sm">${item.name}</div>
              ${currentStock !== null ? `
                <div class="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                  <span>Stok: ${currentStock}</span> &bull; 
                  <span>Sisa: <span class="${remaining < 0 ? 'text-[var(--color-destructive)] font-bold' : 'font-semibold text-[var(--color-text-main)]'}">${remaining} ${prod.unit || 'Pcs'}</span></span>
                </div>
              ` : `
                <div class="text-[10px] text-[var(--color-text-subtle)] italic">Barang Manual</div>
              `}
            </td>
            <td class="py-2.5 px-2 text-center">
              <div class="pos-stepper mx-auto">
                <button type="button" onclick="CashierApp.changeQty(${idx}, -1)" class="pos-stepper-btn" title="Kurangi 1">
                  <span class="material-symbols-outlined text-xs" aria-hidden="true">remove</span>
                </button>
                <input type="text" readonly value="${item.qty}" class="pos-stepper-input">
                <button type="button" onclick="CashierApp.changeQty(${idx}, 1)" class="pos-stepper-btn" title="Tambah 1">
                  <span class="material-symbols-outlined text-xs" aria-hidden="true">add</span>
                </button>
              </div>
            </td>
            <td class="py-2.5 px-3 text-right text-xs text-[var(--color-text-muted)] font-mono">${this.formatRupiah(item.price)}</td>
            <td class="py-2.5 px-3 text-right text-xs font-bold text-[var(--color-text-main)] font-mono">${this.formatRupiah(item.price * item.qty)}</td>
            <td class="py-2.5 px-2 text-center">
              <button type="button" onclick="CashierApp.removeItem(${idx})" class="p-1 rounded text-[var(--color-text-subtle)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive-subtle)] transition" title="Hapus Barang">
                <span class="material-symbols-outlined text-base" aria-hidden="true">delete</span>
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

    if (this.state.items.length === 0 || calc.grandTotal === 0) {
      if (elChangeLabel) elChangeLabel.innerText = 'Kembalian:';
      if (elChange) {
        elChange.innerText = 'Rp0';
        elChange.style.color = 'var(--color-success)';
      }
      if (elStatusNote) elStatusNote.classList.add('hidden');
    } else if (this.state.paymentMethod !== 'TUNAI') {
      if (elChangeLabel) elChangeLabel.innerText = 'Kembalian:';
      if (elChange) {
        elChange.innerText = 'Rp0';
        elChange.style.color = 'var(--color-success)';
      }
      if (elStatusNote) {
        elStatusNote.classList.remove('hidden');
        elStatusNote.className = 'text-xs mt-1.5 p-2 rounded-lg font-medium flex items-center gap-1.5 border';
        elStatusNote.style.backgroundColor = 'var(--color-success-subtle)';
        elStatusNote.style.color = 'var(--color-success)';
        elStatusNote.style.borderColor = 'rgba(5, 150, 105, 0.2)';
        elStatusNote.innerHTML = `<span class="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span><span>Non-Tunai (${this.state.paymentMethod}): Pembayaran Pas</span>`;
      }
    } else if (this.state.cashReceived === 0) {
      if (elChangeLabel) elChangeLabel.innerText = 'Kembalian:';
      if (elChange) {
        elChange.innerText = 'Rp0';
        elChange.style.color = 'var(--color-text-muted)';
      }
      if (elStatusNote) {
        elStatusNote.classList.remove('hidden');
        elStatusNote.className = 'text-xs mt-1.5 p-2 rounded-lg font-medium flex items-center gap-1.5 border';
        elStatusNote.style.backgroundColor = 'var(--color-bg-subtle)';
        elStatusNote.style.color = 'var(--color-text-muted)';
        elStatusNote.style.borderColor = 'var(--color-border)';
        elStatusNote.innerHTML = `<span class="material-symbols-outlined text-sm" aria-hidden="true">payments</span><span>Menunggu uang tunai (otomatis Uang Pas saat cetak)</span>`;
      }
    } else if (calc.isUnderpaid) {
      if (elChangeLabel) elChangeLabel.innerText = 'Kurang Bayar:';
      if (elChange) {
        elChange.innerText = `-${this.formatRupiah(calc.shortage)}`;
        elChange.style.color = 'var(--color-destructive)';
      }
      if (elStatusNote) {
        elStatusNote.classList.remove('hidden');
        elStatusNote.className = 'text-xs mt-1.5 p-2 rounded-lg font-medium flex items-center gap-1.5 border';
        elStatusNote.style.backgroundColor = 'var(--color-destructive-subtle)';
        elStatusNote.style.color = 'var(--color-destructive)';
        elStatusNote.style.borderColor = 'rgba(220, 38, 38, 0.2)';
        elStatusNote.innerHTML = `<span class="material-symbols-outlined text-sm" aria-hidden="true">error</span><span>Kurang ${this.formatRupiah(calc.shortage)} (klik Uang Pas jika pas)</span>`;
      }
    } else {
      if (elChangeLabel) elChangeLabel.innerText = 'Kembalian:';
      if (elChange) {
        elChange.innerText = this.formatRupiah(calc.change);
        elChange.style.color = 'var(--color-success)';
      }
      if (elStatusNote) {
        elStatusNote.classList.remove('hidden');
        elStatusNote.className = 'text-xs mt-1.5 p-2 rounded-lg font-medium flex items-center gap-1.5 border';
        elStatusNote.style.backgroundColor = 'var(--color-success-subtle)';
        elStatusNote.style.color = 'var(--color-success)';
        elStatusNote.style.borderColor = 'rgba(5, 150, 105, 0.2)';
        elStatusNote.innerHTML = `<span class="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span><span>Pembayaran Lunas</span>`;
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
          <div class="text-center py-4 text-black/50 italic text-[11px]">
            Keranjang Kosong
          </div>
        `;
      } else {
        previewItems.innerHTML = this.state.items.map(item => `
          <div class="thermal-row text-[11px] leading-tight py-1 font-mono">
            <div class="font-bold text-black uppercase tracking-tight">${item.name}</div>
            <div class="flex justify-between text-black">
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

  startCheckout(actionType = 'print') {
    if (this.state.items.length === 0) {
      if (typeof showToast === 'function') {
        showToast('Daftar belanjaan masih kosong (Tekan F2 untuk cari barang)', 'warning');
      }
      const nameInput = document.getElementById('quick-item-name');
      if (nameInput) nameInput.focus();
      return;
    }

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
    let calc = this.calculate();

    // 1. Non-tunai otomatis pas
    if (this.state.paymentMethod !== 'TUNAI') {
      this.state.cashReceived = calc.grandTotal;
      const cashInput = document.getElementById('input-cash');
      if (cashInput) cashInput.value = calc.grandTotal;
      calc = this.calculate();
    } else {
      // 2. Tunai tapi kasir belum mengisi nominal (masih 0) -> Otomatis Uang Pas agar tidak macet
      if (this.state.cashReceived === 0 && calc.grandTotal > 0) {
        this.state.cashReceived = calc.grandTotal;
        const cashInput = document.getElementById('input-cash');
        if (cashInput) cashInput.value = calc.grandTotal;
        calc = this.calculate();
      }
    }

    // 3. Validasi nilai minus
    if (this.state.cashReceived < 0) {
      if (typeof showToast === 'function') showToast('Nominal uang diterima tidak boleh minus', 'error');
      const cashInput = document.getElementById('input-cash');
      if (cashInput) {
        cashInput.value = 0;
        cashInput.focus();
      }
      this.state.cashReceived = 0;
      this.render();
      return;
    }

    // 4. Jika tunai dan uang kurang saat mau cetak struk fisik
    if (calc.isUnderpaid && actionType === 'print') {
      const shortageFormatted = this.formatRupiah(calc.shortage);
      const grandTotalFormatted = this.formatRupiah(calc.grandTotal);
      const cashFormatted = this.formatRupiah(this.state.cashReceived);
      const errMsg = `Uang diterima (${cashFormatted}) masih kurang ${shortageFormatted} dari total belanja (${grandTotalFormatted}).`;

      if (typeof showToast === 'function') showToast(errMsg, 'error');

      const cashInput = document.getElementById('input-cash');
      if (cashInput) {
        cashInput.focus();
        cashInput.select();
      }
      return;
    }

    this.render();
    calc = this.calculate();

    // 5. Cek apakah modal konfirmasi dinonaktifkan di pengaturan
    if (this.config?.pos?.requireConfirmation === false) {
      this.confirmAndExecute(true);
      return;
    }

    // 6. Tampilkan Modal Konfirmasi dengan teks yang relevan
    const modalTitle = document.getElementById('conf-modal-title');
    const modalIcon = document.getElementById('conf-modal-icon');
    const modalDesc = document.getElementById('conf-modal-desc');
    const btnPrimaryText = document.getElementById('btn-conf-primary-text');
    const btnSecondary = document.getElementById('btn-conf-secondary');

    if (actionType === 'png') {
      if (modalTitle) modalTitle.innerText = 'Konfirmasi Simpan Gambar (PNG)';
      if (modalIcon) modalIcon.innerText = 'image';
      if (modalDesc) modalDesc.innerText = 'Periksa rincian sebelum struk disimpan sebagai file gambar PNG:';
      if (btnPrimaryText) btnPrimaryText.innerText = 'Ya, Simpan PNG & Riwayat';
      if (btnSecondary) btnSecondary.innerText = 'Hanya Simpan PNG (Tanpa Riwayat)';
    } else {
      if (modalTitle) modalTitle.innerText = 'Konfirmasi Pesanan Kasir';
      if (modalIcon) modalIcon.innerText = 'fact_check';
      if (modalDesc) modalDesc.innerText = 'Periksa kembali rincian belanjaan dan pembayaran pelanggan sebelum struk dicetak:';
      if (btnPrimaryText) btnPrimaryText.innerText = 'Ya, Cetak & Simpan';
      if (btnSecondary) btnSecondary.innerText = 'Hanya Cetak (Tanpa Simpan ke Riwayat)';
    }

    // Isi ringkasan di modal konfirmasi
    const confInv = document.getElementById('conf-invoice');
    if (confInv) confInv.innerText = this.state.invoiceNumber;
    const confCashier = document.getElementById('conf-cashier');
    if (confCashier) confCashier.innerText = this.state.cashier;
    const confMethod = document.getElementById('conf-method');
    if (confMethod) confMethod.innerText = this.state.paymentMethod;
    const confItems = document.getElementById('conf-total-items');
    if (confItems) confItems.innerText = `${this.state.items.length} jenis (${this.state.items.reduce((a, c) => a + c.qty, 0)} pcs)`;
    const confGrand = document.getElementById('conf-grandtotal');
    if (confGrand) confGrand.innerText = this.formatRupiah(calc.grandTotal);
    const confCash = document.getElementById('conf-cash');
    if (confCash) confCash.innerText = this.formatRupiah(this.state.cashReceived);
    const confChange = document.getElementById('conf-change');
    if (confChange) confChange.innerText = this.formatRupiah(calc.change);

    const itemsPreview = document.getElementById('conf-items-summary');
    if (itemsPreview) {
      itemsPreview.innerHTML = this.state.items.map(item => {
        const prod = this.findProduct(item.id || item.name);
        const currentStock = prod ? (parseInt(prod.stock, 10) || 0) : null;
        const remaining = currentStock !== null ? Math.max(0, currentStock - item.qty) : null;

        return `
        <div class="flex justify-between py-1 text-xs border-b border-[var(--color-border-subtle)] last:border-0">
          <div>
            <span class="font-medium text-[var(--color-text-main)]">${item.name} <span class="text-[var(--color-text-muted)]">x${item.qty}</span></span>
            ${remaining !== null ? `<span class="text-[10px] text-[var(--color-text-subtle)] ml-1">(Sisa: ${remaining})</span>` : ''}
          </div>
          <span class="font-mono font-semibold text-[var(--color-text-main)]">${this.formatRupiah(item.price * item.qty)}</span>
        </div>
      `;
      }).join('');
    }

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

  async confirmAndExecute(saveToDb = true) {
    this.closeConfirmModal();
    let calc = this.calculate();

    if (this.state.items.length === 0) {
      if (typeof showToast === 'function') showToast('Daftar belanjaan masih kosong', 'warning');
      return;
    }

    if (this.state.paymentMethod !== 'TUNAI' || (this.state.cashReceived === 0 && calc.grandTotal > 0)) {
      this.state.cashReceived = calc.grandTotal;
      calc = this.calculate();
    }

    if (calc.isUnderpaid && this.state.pendingActionType === 'print') {
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
          throw new Error(result.message || 'Gagal memproses transaksi');
        }

        // Sinkronisasi data stok barang terbaru dari server
        if (result.data && Array.isArray(result.data.products)) {
          window.STORE_PRODUCTS = result.data.products;
          this.refreshCatalogUI();
        }

        if (typeof showToast === 'function') {
          showToast('Transaksi berhasil disimpan & stok diperbarui!', 'success');
        }
      } else {
        if (typeof showToast === 'function') {
          showToast(this.state.pendingActionType === 'png' ? 'Menyimpan gambar struk...' : 'Mencetak struk fisik...', 'info');
        }
      }

      // Pastikan struk dirender lengkap dengan item belanjaan saat ini
      this.render();

      const resetTransactionState = async () => {
        if (saveToDb) {
          await this.fetchNextInvoice();
          this.state.items = [];
          this.state.discount = 0;
          this.state.cashReceived = 0;
          const cashInput = document.getElementById('input-cash');
          if (cashInput) {
            cashInput.value = 0;
            cashInput.readOnly = false;
            cashInput.classList.remove('opacity-75');
          }
          const discInput = document.getElementById('input-discount');
          if (discInput) discInput.value = 0;
          this.render();
        }
      };

      // Lakukan aksi cetak fisik atau unduh gambar
      if (this.state.pendingActionType === 'png') {
        await ReceiptExporter.exportToPng('receipt-paper', this.state.invoiceNumber, storeName);
        await resetTransactionState();
      } else {
        const size = this.state.paperSize || this.config.pos?.paperSize || '58mm';

        let hasReset = false;
        const handleAfterPrint = async () => {
          if (!hasReset) {
            hasReset = true;
            window.removeEventListener('afterprint', handleAfterPrint);
            await resetTransactionState();
          }
        };

        window.addEventListener('afterprint', handleAfterPrint, { once: true });

        // Cetak struk ke printer
        ReceiptExporter.printDirect(size);

        // Fallback panggil reset setelah dialog print ditutup
        setTimeout(handleAfterPrint, 1500);
      }

    } catch (error) {
      console.error('[CashierApp] Checkout Error:', error);
      if (typeof showToast === 'function') {
        showToast('Gagal memproses: ' + error.message, 'error');
      } else {
        alert('Terjadi kesalahan: ' + error.message);
      }
    }
  },

  copyWhatsAppReceipt() {
    const calc = this.calculate();
    ReceiptExporter.copyWhatsAppText(this.config, this.state, calc);
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

  refreshCatalogUI() {
    if (!window.STORE_PRODUCTS || !Array.isArray(window.STORE_PRODUCTS)) return;

    // 1. Datalist input barang
    const datalist = document.getElementById('products-datalist');
    if (datalist) {
      datalist.innerHTML = window.STORE_PRODUCTS.map(p => `
        <option value="${p.name}" data-price="${p.sellingPrice}" data-stock="${p.stock}">
          ${this.formatRupiah(p.sellingPrice)} - Stok: ${p.stock}
        </option>
      `).join('');
    }

    // 2. Preset Cepat
    const quickContainer = document.getElementById('quick-presets-container');
    if (quickContainer) {
      quickContainer.innerHTML = window.STORE_PRODUCTS.slice(0, 10).map(prod => {
        const isOut = prod.stock <= 0;
        return `
          <button type="button" 
            onclick="CashierApp.addFromPreset('${prod.id}')" 
            class="pos-quick-chip ${isOut ? 'opacity-40 cursor-not-allowed' : ''}"
            ${isOut ? 'title="Stok Habis" disabled' : ''}>
            <span>${prod.name}</span>
            <span class="text-[var(--color-text-subtle)] text-[10px]">(${this.formatRupiah(prod.sellingPrice).replace('Rp', '')} | ${prod.stock})</span>
          </button>
        `;
      }).join('');
    }

    // 3. Ringkasan Kartu
    const countEl = document.getElementById('stat-products-count');
    if (countEl) countEl.innerText = `${window.STORE_PRODUCTS.length} Produk`;
  }
};

window.CashierApp = CashierApp;
