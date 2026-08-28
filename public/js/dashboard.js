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
  const isAdmin = (currentUser.role || '').trim().toLowerCase() === 'admin';
  ['addBtn', 'updateBtn', 'deleteBtn', 'usersBtn', 'customerBillBtn', 'invoiceHistoryBtn'].forEach((id) => {
    document.getElementById(id).style.display = isAdmin ? '' : 'none';
  });

  // Wifi Numbers: Admin, plus the specific user "thanusi", even though
  // thanusi is a regular User role - everyone else stays hidden from it.
  const username = (currentUser.username || '').trim().toLowerCase();
  const canSeeWifi = isAdmin || username === 'thanusi';
  document.getElementById('wifiBtn').style.display = canSeeWifi ? '' : 'none';
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
  initCustomerBillModal();
  initCustomerBillFormModal();
  initWifiModal();
  initWifiFormModal();
  initInvoiceModal();
  initInvoiceHistoryModal();

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
    allProducts = sortForDisplay(await API.get('/products' + query));
    renderProductTable(allProducts);
    setStatus(currentCategory === 'All Products' ? 'All Products Loaded' : `Filtered: ${currentCategory}`);
  } catch (err) {
    setStatus('Error loading products: ' + err.message);
  }
}

// Some categories get a custom item order instead of plain alphabetical.
// Each entry is checked in order against the product name; unmatched
// items fall into a final "others" group (alphabetical). Categories not
// listed here are left in their existing (server-sorted) order.
const CATEGORY_GROUP_MATCHERS = {
  CCTV: [
    /\bdvr\b/i,
    /\b20m\b/i,
    /\b40m\b/i,
    /rotation/i,
    /wifi/i,
  ],
  Cables: [
    /cat\s*6/i,
    /3c2v/i,
    /\btt\b/i,
    /1\.4/i,
  ],
};

function categoryGroupRank(category, productName) {
  const matchers = CATEGORY_GROUP_MATCHERS[category];
  if (!matchers) return -1;
  const idx = matchers.findIndex((re) => re.test(productName));
  return idx === -1 ? matchers.length : idx;
}

function sortForDisplay(rows) {
  return [...rows].sort((a, b) => {
    if (a.category === b.category && CATEGORY_GROUP_MATCHERS[a.category]) {
      const rankDiff = categoryGroupRank(a.category, a.product_name) - categoryGroupRank(b.category, b.product_name);
      if (rankDiff !== 0) return rankDiff;
      return a.product_name.localeCompare(b.product_name);
    }
    return 0;
  });
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

// ================= CUSTOMER BILL MODAL =================

function initCustomerBillModal() {
  const overlay = document.getElementById('customerBillModal');
  document.getElementById('customerBillCloseBtn').addEventListener('click', () => overlay.classList.remove('open'));

  const search = document.getElementById('customerBillSearch');
  let timer;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => searchCustomerBills(search.value.trim()), 300);
  });

  document.getElementById('customerBillBtn').addEventListener('click', openCustomerBillModal);
}

function openCustomerBillModal() {
  document.getElementById('customerBillSearch').value = '';
  document.getElementById('customerBillTableBody').innerHTML = '';
  document.getElementById('customerBillEmptyState').style.display = 'none';
  document.getElementById('customerBillTotal').textContent = 'Type a customer name or date to search.';
  document.getElementById('customerBillModal').classList.add('open');
  document.getElementById('customerBillSearch').focus();
}

function formatBillDate(dateStr) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

async function searchCustomerBills(keyword) {
  const tbody = document.getElementById('customerBillTableBody');
  const empty = document.getElementById('customerBillEmptyState');
  const total = document.getElementById('customerBillTotal');

  if (!keyword) {
    tbody.innerHTML = '';
    empty.style.display = 'none';
    total.textContent = 'Type a customer name or date to search.';
    return;
  }

  try {
    const rows = await API.get('/customer-bills/search?q=' + encodeURIComponent(keyword));
    tbody.innerHTML = '';

    if (rows.length === 0) {
      empty.style.display = 'block';
      total.textContent = '';
      return;
    }
    empty.style.display = 'none';

    rows.forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(r.customer_name)}</td><td>${formatBillDate(r.bill_date)}</td>`;
      tbody.appendChild(tr);
    });
    total.textContent = `${rows.length} Result(s)`;
  } catch (err) {
    total.textContent = 'Search error: ' + err.message;
  }
}

// ================= ADD CUSTOMER BILL MODAL =================

function initCustomerBillFormModal() {
  const overlay = document.getElementById('customerBillFormModal');
  const form = document.getElementById('customerBillForm');
  document.getElementById('customerBillFormCancelBtn').addEventListener('click', () => overlay.classList.remove('open'));
  document.getElementById('customerBillAddBtn').addEventListener('click', openCustomerBillFormModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorText = document.getElementById('customerBillFormError');
    errorText.textContent = '';

    const payload = {
      customer_name: document.getElementById('cbCustomerName').value.trim(),
      bill_date: document.getElementById('cbBillDate').value
    };

    try {
      await API.post('/customer-bills', payload);
      overlay.classList.remove('open');
      document.getElementById('customerBillSearch').value = payload.customer_name;
      await searchCustomerBills(payload.customer_name);
      setStatus('Customer bill added successfully.');
    } catch (err) {
      errorText.textContent = err.message;
    }
  });
}

function openCustomerBillFormModal() {
  document.getElementById('customerBillForm').reset();
  document.getElementById('cbBillDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('customerBillFormError').textContent = '';
  document.getElementById('customerBillFormModal').classList.add('open');
}

// ================= WIFI NUMBERS MODAL =================

function initWifiModal() {
  const overlay = document.getElementById('wifiModal');
  document.getElementById('wifiCloseBtn').addEventListener('click', () => overlay.classList.remove('open'));

  const search = document.getElementById('wifiSearch');
  let timer;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => searchWifiNumbers(search.value.trim()), 300);
  });

  document.getElementById('wifiBtn').addEventListener('click', openWifiModal);
}

function openWifiModal() {
  document.getElementById('wifiSearch').value = '';
  document.getElementById('wifiTableBody').innerHTML = '';
  document.getElementById('wifiEmptyState').style.display = 'none';
  document.getElementById('wifiTotal').textContent = 'Type a code, number or name to search.';

  // Adding wifi numbers is Admin only, even though thanusi can also
  // search this modal - see requireAdmin on POST /api/wifi-numbers.
  const isAdmin = (currentUser.role || '').trim().toLowerCase() === 'admin';
  document.getElementById('wifiAddBtn').style.display = isAdmin ? '' : 'none';

  document.getElementById('wifiModal').classList.add('open');
  document.getElementById('wifiSearch').focus();
}

async function searchWifiNumbers(keyword) {
  const tbody = document.getElementById('wifiTableBody');
  const empty = document.getElementById('wifiEmptyState');
  const total = document.getElementById('wifiTotal');

  if (!keyword) {
    tbody.innerHTML = '';
    empty.style.display = 'none';
    total.textContent = 'Type a code, number or name to search.';
    return;
  }

  try {
    const rows = await API.get('/wifi-numbers/search?q=' + encodeURIComponent(keyword));
    tbody.innerHTML = '';

    if (rows.length === 0) {
      empty.style.display = 'block';
      total.textContent = '';
      return;
    }
    empty.style.display = 'none';

    rows.forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(r.code || '—')}</td><td>${escapeHtml(r.number || '—')}</td><td>${escapeHtml(r.name || '—')}</td>`;
      tbody.appendChild(tr);
    });
    total.textContent = `${rows.length} Result(s)`;
  } catch (err) {
    total.textContent = 'Search error: ' + err.message;
  }
}

// ================= ADD WIFI NUMBER MODAL =================

function initWifiFormModal() {
  const overlay = document.getElementById('wifiFormModal');
  const form = document.getElementById('wifiForm');
  document.getElementById('wifiFormCancelBtn').addEventListener('click', () => overlay.classList.remove('open'));
  document.getElementById('wifiAddBtn').addEventListener('click', openWifiFormModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorText = document.getElementById('wifiFormError');
    errorText.textContent = '';

    const payload = {
      code: document.getElementById('wifiCode').value.trim(),
      number: document.getElementById('wifiNumber').value.trim(),
      name: document.getElementById('wifiName').value.trim()
    };

    try {
      await API.post('/wifi-numbers', payload);
      overlay.classList.remove('open');
      document.getElementById('wifiSearch').value = payload.name;
      await searchWifiNumbers(payload.name);
      setStatus('Wifi number added successfully.');
    } catch (err) {
      errorText.textContent = err.message;
    }
  });
}

function openWifiFormModal() {
  document.getElementById('wifiForm').reset();
  document.getElementById('wifiFormError').textContent = '';
  document.getElementById('wifiFormModal').classList.add('open');
}

// ================= INVOICE MODAL =================

let invoiceItems = [];
let invoiceRowCounter = 0;
let invoiceSaved = false;
let currentInvoiceId = null;

// These two lines always sit at the bottom of every new invoice. The user
// fills in the quantity / unit price by hand; the names are fixed and can't
// be edited or removed.
const FIXED_INVOICE_ITEM_NAMES = ['Hardware Materials', 'Installation/Repairing Charges'];

function formatRs(n) {
  return 'Rs ' + Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Warranty is picked as a number of years. 0 (or blank) means no warranty.
function warrantyText(years) {
  const n = Number(years) || 0;
  return n > 0 ? n + ' Years' : 'N/W';
}

function initInvoiceModal() {
  document.getElementById('invoiceBtn').addEventListener('click', openInvoiceModal);
  document.getElementById('invoiceCloseBtn').addEventListener('click', () => {
    document.getElementById('invoiceModal').classList.remove('open');
  });

  ['invCustomerName', 'invCustomerMobile', 'invCustomerAddress', 'invDate'].forEach((id) => {
    document.getElementById(id).addEventListener('input', checkInvoiceUnlock);
  });

  document.getElementById('invDiscount').addEventListener('input', recalcInvoiceTotals);
  document.getElementById('invAdvance').addEventListener('input', recalcInvoiceTotals);

  const search = document.getElementById('invStockSearch');
  let timer;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => searchInvoiceStock(search.value.trim()), 250);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.invoice-search-wrap')) {
      document.getElementById('invStockResults').innerHTML = '';
    }
  });

  document.getElementById('invAddBlankBtn').addEventListener('click', () => addInvoiceItem(null));

  document.getElementById('invClearBtn').addEventListener('click', () => {
    if (invoiceItems.length > 0 && !confirm('Clear this invoice? Everything entered will be lost.')) return;
    resetInvoiceForm();
  });

  document.getElementById('invSaveBtn').addEventListener('click', saveInvoice);
  document.getElementById('invPrintBtn').addEventListener('click', () => window.print());
  document.getElementById('invDownloadBtn').addEventListener('click', downloadInvoiceImage);
  document.getElementById('invNewBtn').addEventListener('click', resetInvoiceForm);

  document.getElementById('invoiceItemsBody').addEventListener('input', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const rowId = Number(tr.dataset.rowId);
    const item = invoiceItems.find((it) => it.rowId === rowId);
    if (!item) return;

    const field = e.target.dataset.field;
    if (field === 'item_name') {
      item.item_name = e.target.value;
    } else if (field === 'warranty_years') {
      item.warranty_years = e.target.value;
      const cell = tr.querySelector('.c-war');
      const n = Number(e.target.value) || 0;
      cell.classList.toggle('is-nw', n <= 0);
      cell.querySelector('.inv-war-unit').textContent = n > 0 ? 'Years' : 'N/W';
    } else if (field === 'quantity') {
      item.quantity = e.target.value;
    } else if (field === 'unit_price') {
      item.unit_price = e.target.value;
    }

    if (field === 'quantity' || field === 'unit_price') {
      tr.querySelector('.invoice-row-total').textContent = formatRs(
        (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
      );
      recalcInvoiceTotals();
    }
  });

  document.getElementById('invoiceItemsBody').addEventListener('click', (e) => {
    const btn = e.target.closest('.invoice-row-remove');
    if (!btn) return;
    removeInvoiceItem(Number(btn.closest('tr').dataset.rowId));
  });
}

function openInvoiceModal() {
  resetInvoiceForm();
  document.getElementById('invoiceModal').classList.add('open');
}

function resetInvoiceForm() {
  invoiceSaved = false;
  invoiceItems = [];
  invoiceRowCounter = 0;
  currentInvoiceId = null;

  document.getElementById('invCustomerName').value = '';
  document.getElementById('invCustomerMobile').value = '';
  document.getElementById('invCustomerAddress').value = '';
  document.getElementById('invProjectLocation').value = '';
  document.getElementById('invInstallType').value = '';
  document.getElementById('invPaymentMode').value = 'Ready Cash';
  document.getElementById('invDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('invDiscount').value = 0;
  document.getElementById('invAdvance').value = 0;
  document.getElementById('invStockSearch').value = '';
  document.getElementById('invStockResults').innerHTML = '';
  document.getElementById('invoiceFormError').textContent = '';
  document.getElementById('invNoValue').textContent = 'DRAFT';
  document.getElementById('invMakerValue').textContent = (currentUser && currentUser.username) || '—';

  [
    'invCustomerName', 'invCustomerMobile', 'invCustomerAddress',
    'invProjectLocation', 'invInstallType', 'invPaymentMode', 'invDate',
    'invDiscount', 'invAdvance'
  ].forEach((id) => { document.getElementById(id).disabled = false; });

  document.getElementById('invClearBtn').style.display = '';
  document.getElementById('invSaveBtn').style.display = '';
  document.getElementById('invPrintBtn').style.display = 'none';
  document.getElementById('invDownloadBtn').style.display = 'none';
  document.getElementById('invNewBtn').style.display = 'none';

  appendFixedInvoiceItems();

  renderInvoiceItems();
  recalcInvoiceTotals();
  checkInvoiceUnlock();
}

function appendFixedInvoiceItems() {
  FIXED_INVOICE_ITEM_NAMES.forEach((name) => {
    invoiceRowCounter += 1;
    invoiceItems.push({
      rowId: invoiceRowCounter,
      product_id: null,
      item_name: name,
      warranty_years: 0,
      quantity: 1,
      unit_price: 0,
      fixed: true
    });
  });
}

function checkInvoiceUnlock() {
  const unlocked =
    document.getElementById('invCustomerName').value.trim() &&
    document.getElementById('invCustomerMobile').value.trim() &&
    document.getElementById('invCustomerAddress').value.trim() &&
    document.getElementById('invDate').value;

  // Something is actually worth invoicing once at least one line has a price.
  const hasPricedLine = invoiceItems.some((it) => Number(it.unit_price) > 0);

  document.getElementById('invoiceLockNotice').style.display = unlocked || invoiceSaved ? 'none' : 'block';
  document.getElementById('invStockSearch').disabled = !unlocked || invoiceSaved;
  document.getElementById('invAddBlankBtn').disabled = !unlocked || invoiceSaved;
  document.getElementById('invSaveBtn').disabled = !unlocked || !hasPricedLine || invoiceSaved;
}

function renderInvoiceItems() {
  const tbody = document.getElementById('invoiceItemsBody');
  const empty = document.getElementById('invoiceItemsEmpty');

  if (invoiceItems.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = invoiceItems.map((it, idx) => {
    const lock = invoiceSaved ? 'disabled' : '';
    const years = Number(it.warranty_years) || 0;
    const nameLock = invoiceSaved || it.fixed ? 'disabled' : '';
    return `
    <tr data-row-id="${it.rowId}">
      <td class="c-no">${idx + 1}</td>
      <td class="c-desc"><input type="text" data-field="item_name" value="${escapeHtml(it.item_name)}" placeholder="Item description" ${nameLock}></td>
      <td class="c-war${years > 0 ? '' : ' is-nw'}">
        <input type="number" min="0" max="20" step="1" data-field="warranty_years" value="${years}" ${lock}>
        <span class="inv-war-unit">${years > 0 ? 'Years' : 'N/W'}</span>
      </td>
      <td class="c-qty"><input type="number" min="1" data-field="quantity" value="${it.quantity}" ${lock}></td>
      <td class="c-unit"><input type="number" min="0" step="0.01" data-field="unit_price" value="${it.unit_price}" ${lock}></td>
      <td class="c-tot invoice-row-total">${formatRs((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}</td>
      <td class="c-rm no-print">${invoiceSaved || it.fixed ? '' : '<button type="button" class="invoice-row-remove" title="Remove">✕</button>'}</td>
    </tr>
  `;
  }).join('');
}

function recalcInvoiceTotals() {
  const subtotal = invoiceItems.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
  const discount = Number(document.getElementById('invDiscount').value) || 0;
  const advance = Number(document.getElementById('invAdvance').value) || 0;
  const finalAmount = Math.max(subtotal - discount, 0);
  const balanceDue = finalAmount - advance;

  document.getElementById('invSubtotal').textContent = formatRs(subtotal);
  document.getElementById('invFinalAmount').textContent = formatRs(finalAmount);
  document.getElementById('invBalanceDue').textContent = formatRs(balanceDue);

  checkInvoiceUnlock();
}

function addInvoiceItem(product) {
  invoiceRowCounter += 1;
  const newItem = {
    rowId: invoiceRowCounter,
    product_id: product ? product.id : null,
    item_name: product ? product.product_name : '',
    warranty_years: 0,
    quantity: 1,
    unit_price: product ? Number(product.price) : 0
  };

  // Keep "Hardware Materials" / "Installation..." pinned to the bottom -
  // new items go in just above the first fixed line.
  const firstFixed = invoiceItems.findIndex((it) => it.fixed);
  if (firstFixed === -1) invoiceItems.push(newItem);
  else invoiceItems.splice(firstFixed, 0, newItem);

  document.getElementById('invStockSearch').value = '';
  document.getElementById('invStockResults').innerHTML = '';

  renderInvoiceItems();
  recalcInvoiceTotals();
}

function removeInvoiceItem(rowId) {
  const item = invoiceItems.find((it) => it.rowId === rowId);
  if (!item || item.fixed) return;
  invoiceItems = invoiceItems.filter((it) => it.rowId !== rowId);
  renderInvoiceItems();
  recalcInvoiceTotals();
}

async function searchInvoiceStock(keyword) {
  const results = document.getElementById('invStockResults');
  if (!keyword) {
    results.innerHTML = '';
    return;
  }

  try {
    const rows = await API.get('/products/search?q=' + encodeURIComponent(keyword));
    if (rows.length === 0) {
      results.innerHTML = '<div class="invoice-search-empty">No matching products.</div>';
      return;
    }
    results.innerHTML = rows.map((p, i) => `
      <div class="invoice-search-item" data-index="${i}">
        <span>${escapeHtml(p.product_name)}</span>
        <span class="invoice-search-meta">${formatRs(p.price)} · Stock ${p.stock_count}</span>
      </div>
    `).join('');

    results.querySelectorAll('.invoice-search-item').forEach((el, i) => {
      el.addEventListener('click', () => addInvoiceItem(rows[i]));
    });
  } catch (err) {
    results.innerHTML = `<div class="invoice-search-empty">${escapeHtml(err.message)}</div>`;
  }
}

async function saveInvoice() {
  const errorText = document.getElementById('invoiceFormError');
  errorText.textContent = '';

  const payload = {
    customer_name: document.getElementById('invCustomerName').value.trim(),
    customer_mobile: document.getElementById('invCustomerMobile').value.trim(),
    customer_address: document.getElementById('invCustomerAddress').value.trim(),
    invoice_date: document.getElementById('invDate').value,
    items: invoiceItems.map((it) => ({
      product_id: it.product_id,
      item_name: (it.item_name || '').trim(),
      warranty: warrantyText(it.warranty_years),
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price)
    })),
    discount: Number(document.getElementById('invDiscount').value) || 0,
    advance_paid: Number(document.getElementById('invAdvance').value) || 0,
    created_by: currentUser.username
  };

  try {
    const invoice = await API.post('/invoices', payload);
    enterInvoiceSavedMode(invoice);
    setStatus(`Invoice #${invoice.id} saved for ${invoice.customer_name}.`);
  } catch (err) {
    errorText.textContent = err.message;
  }
}

function enterInvoiceSavedMode(invoice) {
  invoiceSaved = true;
  currentInvoiceId = invoice.id;

  document.getElementById('invNoValue').textContent = `INV-${String(invoice.id).padStart(6, '0')}`;

  [
    'invCustomerName', 'invCustomerMobile', 'invCustomerAddress',
    'invProjectLocation', 'invInstallType', 'invPaymentMode', 'invDate',
    'invDiscount', 'invAdvance', 'invStockSearch', 'invAddBlankBtn'
  ].forEach((id) => { document.getElementById(id).disabled = true; });

  document.getElementById('invoiceLockNotice').style.display = 'none';
  document.getElementById('invClearBtn').style.display = 'none';
  document.getElementById('invSaveBtn').style.display = 'none';
  document.getElementById('invPrintBtn').style.display = '';
  document.getElementById('invDownloadBtn').style.display = '';
  document.getElementById('invNewBtn').style.display = '';

  renderInvoiceItems();
}

async function downloadInvoiceImage() {
  const btn = document.getElementById('invDownloadBtn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Preparing...';

  try {
    const doc = document.getElementById('invoiceDoc');
    const canvas = await html2canvas(doc, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      width: doc.offsetWidth,
      height: doc.offsetHeight,
      windowWidth: Math.max(doc.offsetWidth + 48, document.documentElement.clientWidth),
      scrollX: 0,
      scrollY: -window.scrollY,
      ignoreElements: (el) => el.classList && el.classList.contains('no-print')
    });
    const link = document.createElement('a');
    link.download = `Invoice-INV-${String(currentInvoiceId).padStart(6, '0')}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  } catch (err) {
    alert('Could not generate the invoice image: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ================= INVOICE HISTORY MODAL (Admin only) =================

function initInvoiceHistoryModal() {
  const overlay = document.getElementById('invoiceHistoryModal');
  document.getElementById('invoiceHistoryCloseBtn').addEventListener('click', () => overlay.classList.remove('open'));
  document.getElementById('invoiceHistoryBtn').addEventListener('click', openInvoiceHistoryModal);

  const search = document.getElementById('invoiceHistorySearch');
  let timer;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => loadInvoiceHistory(search.value.trim()), 300);
  });

  document.getElementById('invoiceHistoryTableBody').addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    openInvoiceForViewing(Number(tr.dataset.id));
  });
}

function openInvoiceHistoryModal() {
  document.getElementById('invoiceHistorySearch').value = '';
  document.getElementById('invoiceHistoryModal').classList.add('open');
  loadInvoiceHistory('');
}

async function loadInvoiceHistory(keyword) {
  const tbody = document.getElementById('invoiceHistoryTableBody');
  const empty = document.getElementById('invoiceHistoryEmptyState');
  const total = document.getElementById('invoiceHistoryTotal');

  try {
    const query = keyword ? `?q=${encodeURIComponent(keyword)}` : '';
    const rows = await API.get('/invoices' + query);
    tbody.innerHTML = '';

    if (rows.length === 0) {
      empty.style.display = 'block';
      total.textContent = '';
      return;
    }
    empty.style.display = 'none';

    rows.forEach((r) => {
      const tr = document.createElement('tr');
      tr.dataset.id = r.id;
      tr.innerHTML = `
        <td>INV-${String(r.id).padStart(6, '0')}</td>
        <td>${escapeHtml(r.customer_name)}</td>
        <td>${escapeHtml(r.customer_mobile)}</td>
        <td>${formatBillDate(String(r.invoice_date).slice(0, 10))}</td>
        <td>${formatRs(r.final_amount)}</td>
        <td>${formatRs(r.balance_due)}</td>
        <td>${escapeHtml(r.created_by)}</td>
      `;
      tbody.appendChild(tr);
    });
    total.textContent = `${rows.length} Invoice(s) — tap a row to view`;
  } catch (err) {
    total.textContent = 'Error: ' + err.message;
  }
}

async function openInvoiceForViewing(id) {
  try {
    const invoice = await API.get('/invoices/' + id);
    resetInvoiceForm();

    document.getElementById('invCustomerName').value = invoice.customer_name;
    document.getElementById('invCustomerMobile').value = invoice.customer_mobile;
    document.getElementById('invCustomerAddress').value = invoice.customer_address;
    document.getElementById('invMakerValue').textContent = invoice.created_by || '—';
    document.getElementById('invDate').value = String(invoice.invoice_date).slice(0, 10);
    document.getElementById('invDiscount').value = invoice.discount;
    document.getElementById('invAdvance').value = invoice.advance_paid;

    invoiceItems = invoice.items.map((it) => {
      invoiceRowCounter += 1;
      return {
        rowId: invoiceRowCounter,
        product_id: it.product_id,
        item_name: it.item_name,
        warranty_years: parseInt(it.warranty, 10) || 0,
        quantity: it.quantity,
        unit_price: it.unit_price
      };
    });

    renderInvoiceItems();
    recalcInvoiceTotals();
    enterInvoiceSavedMode(invoice);

    document.getElementById('invoiceHistoryModal').classList.remove('open');
    document.getElementById('invoiceModal').classList.add('open');
  } catch (err) {
    alert(err.message);
  }
}
