/**
 * PRODUCT MANAGER (Frontend) - Xeon Invoice Generator
 * Bersih, Andal, Kalkulasi Margin Laba Otomatis & Filter Kategori Cepat
 */

const ProductManager = {
  currentEditId: null,
  activeCategory: 'ALL',

  openAddModal() {
    this.currentEditId = null;
    const title = document.getElementById('modal-title');
    if (title) title.innerText = 'Tambah Barang Baru';
    const form = document.getElementById('prod-form');
    if (form) form.reset();
    const idInput = document.getElementById('prod-id');
    if (idInput) idInput.value = '';
    
    this.updateMarginPreview();

    const modal = document.getElementById('product-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex', 'active');
    }
    const nameInput = document.getElementById('prod-name');
    if (nameInput) nameInput.focus();
  },

  openEditModal(id, barcode, name, category, costPrice, sellingPrice, unit, stock) {
    this.currentEditId = id;
    const title = document.getElementById('modal-title');
    if (title) title.innerText = 'Ubah Data Barang';
    
    document.getElementById('prod-id').value = id;
    document.getElementById('prod-barcode').value = barcode && barcode !== '-' ? barcode : '';
    document.getElementById('prod-name').value = name || '';
    document.getElementById('prod-category').value = category || 'Umum';
    document.getElementById('prod-cost-price').value = costPrice || 0;
    document.getElementById('prod-selling-price').value = sellingPrice || 0;
    document.getElementById('prod-unit').value = unit || 'Pcs';
    document.getElementById('prod-stock').value = stock || 0;

    this.updateMarginPreview();

    const modal = document.getElementById('product-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex', 'active');
    }
    const nameInput = document.getElementById('prod-name');
    if (nameInput) nameInput.focus();
  },

  closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex', 'active');
    }
    this.currentEditId = null;
  },

  updateMarginPreview() {
    const cost = parseFloat(document.getElementById('prod-cost-price')?.value) || 0;
    const sell = parseFloat(document.getElementById('prod-selling-price')?.value) || 0;
    const badge = document.getElementById('margin-preview-badge');
    if (!badge) return;

    if (sell <= 0 && cost <= 0) {
      badge.classList.add('hidden');
      return;
    }

    badge.classList.remove('hidden');
    const profit = sell - cost;
    const pct = cost > 0 ? ((profit / cost) * 100).toFixed(1) : 0;
    const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    if (profit > 0) {
      badge.className = 'pos-badge pos-badge-success text-xs';
      badge.innerHTML = `<span class="material-symbols-outlined text-xs">trending_up</span><span>Laba: ${formatRp(profit)} (+${pct}%)</span>`;
    } else if (profit === 0) {
      badge.className = 'pos-badge pos-badge-neutral text-xs';
      badge.innerHTML = `<span>Balik Modal (0%)</span>`;
    } else {
      badge.className = 'pos-badge pos-badge-danger text-xs';
      badge.innerHTML = `<span class="material-symbols-outlined text-xs">trending_down</span><span>Rugi: ${formatRp(profit)} (${pct}%)</span>`;
    }
  },

  async handleFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('prod-id').value;
    const barcode = document.getElementById('prod-barcode').value.trim();
    const name = document.getElementById('prod-name').value.trim();
    const category = document.getElementById('prod-category').value.trim();
    const costPrice = parseFloat(document.getElementById('prod-cost-price').value) || 0;
    const sellingPrice = parseFloat(document.getElementById('prod-selling-price').value) || 0;
    const unit = document.getElementById('prod-unit').value.trim();
    const stock = parseInt(document.getElementById('prod-stock').value, 10) || 0;

    if (!name) {
      if (typeof showToast === 'function') showToast('Nama barang wajib diisi!', 'warning');
      return;
    }

    const payload = { barcode, name, category, costPrice, sellingPrice, unit, stock };

    try {
      const url = id ? `/api/products/${encodeURIComponent(id)}` : '/api/products';
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.message || 'Gagal menyimpan barang');
      }

      this.closeModal();
      if (typeof showToast === 'function') {
        showToast(id ? 'Data barang berhasil diperbarui' : 'Barang berhasil ditambahkan', 'success');
      }
      setTimeout(() => {
        window.location.reload();
      }, 350);

    } catch (error) {
      console.error('[ProductManager] Error simpan:', error);
      if (typeof showToast === 'function') {
        showToast('Gagal menyimpan: ' + error.message, 'error');
      } else {
        alert('Gagal menyimpan: ' + error.message);
      }
    }
  },

  async deleteProduct(id, name) {
    if (!confirm(`Hapus barang "${name}" dari daftar?`)) return;

    try {
      const response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.message || 'Gagal menghapus');
      }

      if (typeof showToast === 'function') {
        showToast(`"${name}" berhasil dihapus`, 'info');
      }
      setTimeout(() => {
        window.location.reload();
      }, 350);

    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    }
  },

  filterCategory(catName) {
    this.activeCategory = catName;
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(chip => {
      const target = chip.getAttribute('data-category');
      if (target === catName) {
        chip.classList.add('bg-[var(--color-primary)]', 'text-white');
        chip.classList.remove('bg-[var(--color-bg-subtle)]', 'text-[var(--color-text-muted)]');
      } else {
        chip.classList.remove('bg-[var(--color-primary)]', 'text-white');
        chip.classList.add('bg-[var(--color-bg-subtle)]', 'text-[var(--color-text-muted)]');
      }
    });

    const searchInput = document.getElementById('search-product-input');
    this.applyFilters(searchInput ? searchInput.value : '');
  },

  filterTable(query) {
    this.applyFilters(query);
  },

  applyFilters(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.product-table-row');
    let visibleCount = 0;

    rows.forEach(row => {
      const text = row.getAttribute('data-search') || '';
      const cat = row.getAttribute('data-row-category') || '';
      
      const matchSearch = !q || text.includes(q);
      const matchCat = this.activeCategory === 'ALL' || cat.toLowerCase() === this.activeCategory.toLowerCase();

      if (matchSearch && matchCat) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    const countEl = document.getElementById('visible-product-count');
    if (countEl) countEl.innerText = visibleCount;
  }
};

window.ProductManager = ProductManager;

document.addEventListener('DOMContentLoaded', () => {
  const costEl = document.getElementById('prod-cost-price');
  const sellEl = document.getElementById('prod-selling-price');
  if (costEl) costEl.addEventListener('input', () => ProductManager.updateMarginPreview());
  if (sellEl) sellEl.addEventListener('input', () => ProductManager.updateMarginPreview());

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') ProductManager.closeModal();
  });
});
