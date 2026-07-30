// dashboard.js
// Mirrors: inventory.py, product_manager.py (inferred from screenshot),
// add_product_dialog.py, update_product_dialog.py, stock_update_dialog.py,
// user_management.py, add_user_dialog.py, edit_user_dialog.py, history_dialog.py

let currentUser = null;
let allProducts = [];
let selectedProductId = null;
let currentCategory = 'All Products';
let allUsers = [];
let selectedUserId = null;

// ================= AUTH GUARD =================
(function checkAuth() {
  const stored = sessionStorage.getItem('dc_user');
  if (!stored) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = JSON.parse(stored);
})();

// Only Admin can add/update/delete products or manage users - everyone
// else can view products and adjust stock only. Enforced again on the
// server (see server/middleware/requireAdmin.js); this just keeps the
// buttons regular staff can't use out of their way.
function applyRolePermissions() {
  const isAdmin = currentUser.role === 'Admin';
  ['addBtn', 'updateBtn', 'deleteBtn', 'usersBtn'].forEach((id) => {
    document.getElementById(id).style.display = isAdmin ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyRolePermissions();
  initHeader();
  initSidebar();
  initToolbar();
  initProductModal();
  initStockModal();
  initHistoryModal();
  initUsersModal();
  initUserFormModal();

  loadDashboardCounts();
  loadProducts();
});

// ================= HEADER =================

function initHeader() {
  document.getElementById('welcomeText').textContent = `👋 Welcome ${currentUser.full_name || currentUser.username}`;

  const now = new Date();
  document.getElementById('dateText').textContent =
    '📅 ' + now.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  document.getElementById('timeText').textContent =
    '🕒 ' + now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Do you want to logout?')) {
      sessionStorage.removeItem('dc_user');
      window.location.href = 'index.html';
    }
  });

  document.getElementById('usersBtn').addEventListener('click', openUsersModal);
}

// ================= SIDEBAR =================

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('menuToggle');

  toggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  document.querySelectorAll('#categoryList li').forEach((li) => {
    li.addEventListener('click', () => {
      document.querySelectorAll('#categoryList li').forEach((x) => x.classList.remove('active'));
      li.classList.add('active');
      currentCategory = li.dataset.category;
      loadProducts();
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  });
}

// ================= DASHBOARD COUNTS =================

async function loadDashboardCounts() {
  try {
    const counts = await API.get('/products/dashboard/counts');
    document.getElementById('statTotalProducts').textContent = counts.total_products;
    document.getElementById('statTotalStock').textContent = counts.total_stock;
    document.getElementById('statLowStock').textContent = counts.low_stock;
    document.getElementById('statOutOfStock').textContent = counts.out_of_stock;
  } catch (err) {
    setStatus('Could not load dashboard counts: ' + err.message);
  }
}

// ================= PRODUCT TABLE =================

async function loadProducts() {
  try {
    const query = currentCategory === 'All Products' ? '' : `?category=${encodeURIComponent(currentCategory)}`;
    allProducts = await API.get('/products' + query);
    renderProductTable(allProducts);
    setStatus(currentCategory === 'All Products' ? 'All Products Loaded' : `Filtered: ${currentCategory}`);
  } catch (err) {
    setStatus('Error loading products: ' + err.message);
  }
}

function renderProductTable(rows) {
  const tbody = document.getElementById('productTableBody');
  const empty = document.getElementById('emptyState');
  tbody.innerHTML = '';

  if (rows.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  rows.forEach((p) => {
    const tr = document.createElement('tr');
    tr.dataset.id = p.id;
    if (p.id === selectedProductId) tr.classList.add('selected');

    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>${escapeHtml(p.product_name)}</td>
      <td>${escapeHtml(p.condition)}</td>
      <td>${Number(p.price).toFixed(2)}</td>
      <td>${p.stock_count}</td>
      <td>${escapeHtml(p.created_by)}</td>
    `;
    tr.addEventListener('click', () => selectProduct(p.id));
    tbody.appendChild(tr);
  });
}

function selectProduct(id) {
  selectedProductId = id;
  document.querySelectorAll('#productTableBody tr').forEach((tr) => {
    tr.classList.toggle('selected', Number(tr.dataset.id) === id);
  });
  renderProductDetails(allProducts.find((p) => p.id === id));
}

function renderProductDetails(p) {
  const rows = document.getElementById('detailRows');
  const img = document.getElementById('detailImage');
  const noImg = document.getElementById('detailNoImage');

  if (!p) {
    rows.innerHTML = '<p class="detail-placeholder">Tap a product row to see details here.</p>';
    img.style.display = 'none';
    noImg.style.display = 'block';
    return;
  }

  if (p.image_path) {
    img.src = p.image_path;
    img.style.display = 'block';
    noImg.style.display = 'none';
  } else {
    img.style.display = 'none';
    noImg.style.display = 'block';
  }

  let stockClass = 'stock-ok';
  let stockLabel = `🟢 ${p.stock_count} Available`;
  if (p.stock_count === 0) {
    stockClass = 'stock-out';
    stockLabel = '🔴 Out of Stock';
  } else if (p.stock_count <= 5) {
    stockClass = 'stock-low';
    stockLabel = `🟠 ${p.stock_count} Low Stock`;
  }

  rows.innerHTML = `
    <p>Category : ${escapeHtml(p.category)}</p>
    <p>Product : ${escapeHtml(p.product_name)}</p>
    <p>Condition : ${escapeHtml(p.condition)}</p>
    <p>Price : Rs. ${Number(p.price).toFixed(2)}</p>
    <p>Stock : <span class="${stockClass}">${stockLabel}</span></p>
    <p>Created By : ${escapeHtml(p.created_by)}</p>
  `;
}

function getSelectedProduct() {
  return allProducts.find((p) => p.id === selectedProductId);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function setStatus(text) {
  document.getElementById('statusBar').textContent = text;
}

// ================= TOOLBAR =================

function initToolbar() {
  document.getElementById('addBtn').addEventListener('click', openAddProductModal);

  document.getElementById('updateBtn').addEventListener('click', () => {
    const p = getSelectedProduct();
    if (!p) return alert('Please select a product first.');
    openUpdateProductModal(p);
  });

  document.getElementById('deleteBtn').addEventListener('click', async () => {
    const p = getSelectedProduct();
    if (!p) return alert('Please select a product first.');
    if (!confirm(`Delete "${p.product_name}"? This cannot be undone.`)) return;

    try {
      await API.delete('/products/' + p.id);
      selectedProductId = null;
      await loadProducts();
      await loadDashboardCounts();
      renderProductDetails(null);
      setStatus('Product deleted.');
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('refreshBtn').addEventListener('click', async () => {
    await loadProducts();
    await loadDashboardCounts();
    setStatus('Inventory Refreshed');
  });

  document.getElementById('stockBtn').addEventListener('click', () => {
    const p = getSelectedProduct();
    if (!p) return alert('Please select a product first.');
    openStockModal(p);
  });

  document.getElementById('historyBtn').addEventListener('click', openHistoryModal);

  document.getElementById('outOfStockBtn').addEventListener('click', async () => {
    try {
      const rows = await API.get('/products/out-of-stock');
      renderProductTable(rows);
      setStatus(`${rows.length} Out-of-Stock Product(s)`);
    } catch (err) {
      alert(err.message);
    }
  });

  const searchInput = document.getElementById('searchInput');
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const keyword = searchInput.value.trim();
      if (!keyword) return loadProducts();
      try {
        const rows = await API.get('/products/search?q=' + encodeURIComponent(keyword));
        renderProductTable(rows);
        setStatus(`${rows.length} Product(s) Found`);
      } catch (err) {
        setStatus('Search error: ' + err.message);
      }
    }, 300);
  });
}

// ================= ADD / UPDATE PRODUCT MODAL =================

let availableImages = [];

async function loadAvailableImages() {
  try {
    availableImages = await API.get('/images');
  } catch (err) {
    availableImages = [];
  }

  const select = document.getElementById('productImageSelect');
  const current = select.value;
  select.innerHTML = '<option value="">-- No Image --</option>';
  availableImages.forEach((filename) => {
    const opt = document.createElement('option');
    opt.value = 'images/' + filename;
    opt.textContent = filename;
    select.appendChild(opt);
  });
  select.value = current || '';
}

function updateImagePreview() {
  const select = document.getElementById('productImageSelect');
  const box = document.getElementById('imagePreviewImg');
  const text = document.getElementById('imagePreviewText');

  if (select.value) {
    box.src = select.value;
    box.style.display = 'block';
    text.style.display = 'none';
  } else {
    box.style.display = 'none';
    text.style.display = 'block';
  }
}

function initProductModal() {
  const overlay = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const cancelBtn = document.getElementById('productCancelBtn');
  const imageSelect = document.getElementById('productImageSelect');

  cancelBtn.addEventListener('click', () => overlay.classList.remove('open'));
  imageSelect.addEventListener('change', updateImagePreview);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorText = document.getElementById('productFormError');
    errorText.textContent = '';

    const id = document.getElementById('productId').value;
    const payload = {
      category: document.getElementById('productCategory').value,
      product_name: document.getElementById('productName').value.trim(),
      condition: document.getElementById('productCondition').value,
      price: document.getElementById('productPrice').value,
      stock_count: document.getElementById('productStock').value,
      created_by: document.getElementById('productCreatedBy').value || 'Admin',
      image_path: imageSelect.value
    };

    try {
      if (id) {
        await API.put('/products/' + id, payload);
        setStatus('Product updated successfully.');
      } else {
        await API.post('/products', payload);
        setStatus('Product added successfully.');
      }
      overlay.classList.remove('open');
      await loadProducts();
      await loadDashboardCounts();
    } catch (err) {
      errorText.textContent = err.message;
    }
  });
}

async function openAddProductModal() {
  document.getElementById('productModalTitle').textContent = 'ADD NEW PRODUCT';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productFormError').textContent = '';
  await loadAvailableImages();
  document.getElementById('productImageSelect').value = '';
  updateImagePreview();
  document.getElementById('productModal').classList.add('open');
}

async function openUpdateProductModal(p) {
  document.getElementById('productModalTitle').textContent = 'UPDATE PRODUCT';
  document.getElementById('productId').value = p.id;
  document.getElementById('productCategory').value = p.category;
  document.getElementById('productName').value = p.product_name;
  document.getElementById('productCondition').value = p.condition;
  document.getElementById('productPrice').value = p.price;
  document.getElementById('productStock').value = p.stock_count;
  document.getElementById('productCreatedBy').value = p.created_by;
  document.getElementById('productFormError').textContent = '';

  await loadAvailableImages();
  document.getElementById('productImageSelect').value = p.image_path || '';
  updateImagePreview();

  document.getElementById('productModal').classList.add('open');
}

// ================= STOCK UPDATE MODAL =================

function initStockModal() {
  const overlay = document.getElementById('stockModal');
  const form = document.getElementById('stockForm');
  document.getElementById('stockCancelBtn').addEventListener('click', () => overlay.classList.remove('open'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorText = document.getElementById('stockFormError');
    errorText.textContent = '';

    const p = getSelectedProduct();
    if (!p) return;

    const qty = parseInt(document.getElementById('stockQuantity').value);
    const operation = document.querySelector('input[name="stockOp"]:checked').value;

    try {
      await API.put(`/products/${p.id}/stock`, {
        operation,
        quantity: qty,
        username: currentUser.username
      });
      overlay.classList.remove('open');
      await loadProducts();
      await loadDashboardCounts();
      setStatus('Stock updated successfully.');
    } catch (err) {
      errorText.textContent = err.message;
    }
  });
}

function openStockModal(p) {
  document.getElementById('stockProductName').value = p.product_name;
  document.getElementById('stockCurrentStock').value = p.stock_count;
  document.getElementById('stockQuantity').value = 1;
  document.querySelector('input[name="stockOp"][value="IN"]').checked = true;
  document.getElementById('stockFormError').textContent = '';
  document.getElementById('stockModal').classList.add('open');
}

// ================= HISTORY MODAL =================

function initHistoryModal() {
  const overlay = document.getElementById('historyModal');
  document.getElementById('historyCloseBtn').addEventListener('click', () => overlay.classList.remove('open'));

  const search = document.getElementById('historySearch');
  let timer;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => loadHistory(search.value.trim()), 250);
  });
}

async function openHistoryModal() {
  document.getElementById('historySearch').value = '';
  document.getElementById('historyModal').classList.add('open');
  await loadHistory('');
}

async function loadHistory(keyword) {
  try {
    const query = keyword ? `?q=${encodeURIComponent(keyword)}` : '';
    const rows = await API.get('/activity' + query);
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      const when = new Date(r.created_at).toLocaleString();
      tr.innerHTML = `<td>${escapeHtml(when)}</td><td>${escapeHtml(r.username)}</td><td>${escapeHtml(r.activity)}</td>`;
      tbody.appendChild(tr);
    });
    document.getElementById('historyTotal').textContent = keyword
      ? `Showing ${rows.length} Result(s)`
      : `Showing Last ${rows.length} Activities`;
  } catch (err) {
    alert(err.message);
  }
}

// ================= USER MANAGEMENT MODAL =================

function initUsersModal() {
  const overlay = document.getElementById('usersModal');
  document.getElementById('usersCloseBtn').addEventListener('click', () => overlay.classList.remove('open'));

  document.getElementById('userAddBtn').addEventListener('click', openAddUserModal);

  document.getElementById('userEditBtn').addEventListener('click', () => {
    if (!selectedUserId) return alert('Please select a user.');
    openEditUserModal(selectedUserId);
  });

  document.getElementById('userBlockBtn').addEventListener('click', async () => {
    if (!selectedUserId) return alert('Please select a user.');
    try {
      await API.patch(`/users/${selectedUserId}/toggle-status`, {});
      await loadUsers();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('userDeleteBtn').addEventListener('click', async () => {
    if (!selectedUserId) return alert('Please select a user.');
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await API.delete('/users/' + selectedUserId);
      selectedUserId = null;
      await loadUsers();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('userRefreshBtn').addEventListener('click', loadUsers);
}

function openUsersModal() {
  document.getElementById('usersModal').classList.add('open');
  loadUsers();
}

async function loadUsers() {
  try {
    allUsers = await API.get('/users');
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';
    allUsers.forEach((u) => {
      const tr = document.createElement('tr');
      tr.dataset.id = u.id;
      if (u.id === selectedUserId) tr.classList.add('selected');
      tr.innerHTML = `<td>${u.id}</td><td>${escapeHtml(u.full_name)}</td><td>${escapeHtml(u.username)}</td><td>${escapeHtml(u.role)}</td><td>${escapeHtml(u.status)}</td>`;
      tr.addEventListener('click', () => {
        selectedUserId = u.id;
        document.querySelectorAll('#userTableBody tr').forEach((x) => x.classList.remove('selected'));
        tr.classList.add('selected');
      });
      tbody.appendChild(tr);
    });
  } catch (err) {
    alert(err.message);
  }
}

// ================= ADD / EDIT USER MODAL =================

function initUserFormModal() {
  const overlay = document.getElementById('userFormModal');
  const form = document.getElementById('userForm');
  document.getElementById('userFormCancelBtn').addEventListener('click', () => overlay.classList.remove('open'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorText = document.getElementById('userFormError');
    errorText.textContent = '';

    const id = document.getElementById('userId').value;
    const payload = {
      full_name: document.getElementById('userFullName').value.trim(),
      username: document.getElementById('userUsername').value.trim(),
      password: document.getElementById('userPassword').value,
      role: document.getElementById('userRole').value,
      status: document.getElementById('userStatus').value
    };

    try {
      if (id) {
        await API.put('/users/' + id, payload);
      } else {
        await API.post('/users', payload);
      }
      overlay.classList.remove('open');
      await loadUsers();
    } catch (err) {
      errorText.textContent = err.message;
    }
  });
}

function openAddUserModal() {
  document.getElementById('userFormTitle').textContent = 'ADD USER';
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('userFormError').textContent = '';
  document.getElementById('userFormModal').classList.add('open');
}

function openEditUserModal(id) {
  const u = allUsers.find((x) => x.id === id);
  if (!u) return;
  document.getElementById('userFormTitle').textContent = 'EDIT USER';
  document.getElementById('userId').value = u.id;
  document.getElementById('userFullName').value = u.full_name || '';
  document.getElementById('userUsername').value = u.username;
  document.getElementById('userPassword').value = '';
  document.getElementById('userRole').value = u.role;
  document.getElementById('userStatus').value = u.status;
  document.getElementById('userFormError').textContent = '';
  document.getElementById('userFormModal').classList.add('open');
}
