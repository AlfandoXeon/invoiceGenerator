/**
 * PRODUCT MANAGER (Frontend) - Xeon Invoice Generator
 * Bersih, Andal & Bebas Bug JSON Parse
 */

const ProductManager = {
  currentEditId: null,

  openAddModal() {
    this.currentEditId = null;
    const title = document.getElementById('modal-title');
    if (title) title.innerText = 'Tambah Barang Baru';
    const form = document.getElementById('prod-form');
    if (form) form.reset();
    const idInput = document.getElementById('prod-id');
    if (idInput) idInput.value = '';
    
    const modal = document.getElementById('product-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
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
    document.getElementById('prod-category').value = category || 'Sembako';
    document.getElementById('prod-cost-price').value = costPrice || 0;
    document.getElementById('prod-selling-price').value = sellingPrice || 0;
    document.getElementById('prod-unit').value = unit || 'Pcs';
    document.getElementById('prod-stock').value = stock || 0;

    const modal = document.getElementById('product-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
    const nameInput = document.getElementById('prod-name');
    if (nameInput) nameInput.focus();
  },

  closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.currentEditId = null;
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
    const stock = parseInt(document.getElementById('prod-stock').value) || 0;

    if (!name) {
      alert('Nama barang wajib diisi!');
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

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Respon server tidak valid (${response.status})`);
      }

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.message || 'Gagal menyimpan barang');
      }

      this.closeModal();
      if (typeof showToast === 'function') {
        showToast(id ? 'Barang berhasil diperbarui' : 'Barang berhasil ditambahkan', 'success');
      }
      setTimeout(() => {
        window.location.reload();
      }, 400);

    } catch (error) {
      console.error('[ProductManager] Error simpan:', error);
      alert('Gagal menyimpan barang: ' + error.message);
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
        showToast(`"${name}" dihapus`, 'info');
      }
      setTimeout(() => {
        window.location.reload();
      }, 400);

    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    }
  },

  filterTable(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.product-table-row');
    rows.forEach(row => {
      const text = row.getAttribute('data-search') || '';
      if (!q || text.includes(q)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }
};

window.ProductManager = ProductManager;
