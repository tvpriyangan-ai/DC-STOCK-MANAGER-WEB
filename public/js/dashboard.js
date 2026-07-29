// dashboard.js - equivalent of inventory.py, product_manager.py,
// add/update/stock_update dialogs, user_management, history_dialog

const user = Session.requireLogin();

// ---------------- state ----------------
let allProducts = [];
let selectedProduct = null;
let currentCategory = "All Products";
let selectedUserId = null;
let editingProductId = null; // null = add mode
let pickedImageFile = null;

// ---------------- header / welcome ----------------
if (user) {
  document.getElementById("welcomeText").textContent = `👋 Welcome ${user.username}`;
}
if (!user || user.role !== "ADMIN") {
  // Non-admins don't get the Users button, mirroring role-gated behaviour
  const usersBtn = document.getElementById("usersBtn");
  if (usersBtn && user && user.role !== "ADMIN") usersBtn.style.display = "none";
}

function updateClock() {
  const now = new Date();
  document.getElementById("todayDate").textContent =
    "📅 " + now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  document.getElementById("nowTime").textContent =
    "🕒 " + now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
updateClock();
setInterval(updateClock, 30000);

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Do you want to logout?")) {
    Session.clear();
    window.location.href = "index.html";
  }
});

// ---------------- toast ----------------
function toast(message, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2600);
}

function setStatus(text) {
  document.getElementById("statusLine").textContent = text;
  document.getElementById("footerStatus").textContent = text;
}

// ---------------- sidebar (mobile) ----------------
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
document.getElementById("hamburgerBtn").addEventListener("click", () => {
  sidebar.classList.add("open");
  sidebarBackdrop.classList.add("show");
});
sidebarBackdrop.addEventListener("click", closeSidebar);
function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarBackdrop.classList.remove("show");
}

document.querySelectorAll(".category-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    document.getElementById("searchInput").value = "";
    loadProducts();
    closeSidebar();
  });
});

// ---------------- dashboard stat cards ----------------
async function loadDashboardCounts() {
  try {
    const counts = await Api.getDashboardCounts();
    document.getElementById("statTotalProducts").textContent = counts.total_products;
    document.getElementById("statTotalStock").textContent = counts.total_stock;
    document.getElementById("statLowStock").textContent = counts.low_stock;
    document.getElementById("statOutOfStock").textContent = counts.out_of_stock;
  } catch (err) {
    console.error(err);
  }
}

// ---------------- product table ----------------
function stockBadge(stock) {
  if (stock === 0) return `<span class="stock-badge stock-out">${stock}</span>`;
  if (stock <= 5) return `<span class="stock-badge stock-low">${stock}</span>`;
  return `<span class="stock-badge stock-ok">${stock}</span>`;
}

function renderProducts(rows) {
  const tbody = document.getElementById("productTableBody");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No products found.</td></tr>`;
    return;
  }

  rows.forEach((p) => {
    const tr = document.createElement("tr");
    tr.dataset.id = p.id;
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>${escapeHtml(p.product_name)}</td>
      <td>${escapeHtml(p.condition)}</td>
      <td>Rs. ${Number(p.price).toFixed(2)}</td>
      <td>${stockBadge(p.stock_count)}</td>
      <td>${escapeHtml(p.created_by)}</td>
    `;
    tr.addEventListener("click", () => selectProduct(p, tr));
    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function selectProduct(product, rowEl) {
  selectedProduct = product;
  document.querySelectorAll("#productTableBody tr").forEach((r) => r.classList.remove("selected"));
  if (rowEl) rowEl.classList.add("selected");
  renderDetails(product);
}

function renderDetails(p) {
  const imgWrap = document.getElementById("detailsImageWrap");
  if (p.image_path) {
    imgWrap.innerHTML = `<img src="/${p.image_path}" alt="${escapeHtml(p.product_name)}" onerror="this.parentElement.innerHTML='<span class=\\'placeholder\\'>No Image</span>'">`;
  } else {
    imgWrap.innerHTML = `<span class="placeholder">No Image</span>`;
  }

  let stockLabel;
  if (p.stock_count === 0) stockLabel = `<span style="color:#F44336;font-weight:700;">Out of Stock</span>`;
  else if (p.stock_count <= 5) stockLabel = `<span style="color:#FF9800;font-weight:700;">${p.stock_count} Available (Low)</span>`;
  else stockLabel = `<span style="color:#00E676;font-weight:700;">${p.stock_count} Available</span>`;

  document.getElementById("detailsBody").innerHTML = `
    <div class="detail-row"><span>Category</span><span>${escapeHtml(p.category)}</span></div>
    <div class="detail-row"><span>Product</span><span>${escapeHtml(p.product_name)}</span></div>
    <div class="detail-row"><span>Condition</span><span>${escapeHtml(p.condition)}</span></div>
    <div class="detail-row"><span>Price</span><span>Rs. ${Number(p.price).toFixed(2)}</span></div>
    <div class="detail-row"><span>Stock</span><span>${stockLabel}</span></div>
    <div class="detail-row"><span>Created By</span><span>${escapeHtml(p.created_by)}</span></div>
  `;
}

async function loadProducts() {
  setStatus("Loading products...");
  try {
    const params = currentCategory !== "All Products" ? { category: currentCategory } : {};
    allProducts = await Api.getProducts(params);
    renderProducts(allProducts);
    setStatus(`${allProducts.length} Product(s) Loaded`);
  } catch (err) {
    toast(err.message, "error");
    setStatus("Failed to load products");
  }
  loadDashboardCounts();
}

document.getElementById("refreshBtn").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  loadProducts();
});

// ---------------- search (debounced) ----------------
let searchTimer;
document.getElementById("searchInput").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  const keyword = e.target.value.trim();
  searchTimer = setTimeout(async () => {
    if (!keyword) {
      loadProducts();
      return;
    }
    try {
      const rows = await Api.getProducts({ search: keyword });
      renderProducts(rows);
      setStatus(`${rows.length} Product(s) Found`);
    } catch (err) {
      toast(err.message, "error");
    }
  }, 300);
});

// ---------------- out of stock ----------------
document.getElementById("outOfStockBtn").addEventListener("click", async () => {
  try {
    const rows = await Api.getOutOfStock();
    renderProducts(rows);
    setStatus(`${rows.length} Out-of-Stock Product(s)`);
  } catch (err) {
    toast(err.message, "error");
  }
});

// ---------------- delete ----------------
document.getElementById("deleteBtn").addEventListener("click", async () => {
  if (!selectedProduct) {
    toast("Please select a product first.", "error");
    return;
  }
  if (!confirm(`Delete "${selectedProduct.product_name}"? This cannot be undone.`)) return;
  try {
    await Api.deleteProduct(selectedProduct.id);
    toast("Product deleted successfully.");
    selectedProduct = null;
    loadProducts();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ==================================================================
// ADD / UPDATE PRODUCT MODAL
// ==================================================================

const productModalBackdrop = document.getElementById("productModalBackdrop");
const productForm = document.getElementById("productForm");

function openProductModal(mode, product = null) {
  editingProductId = mode === "update" ? product.id : null;
  pickedImageFile = null;
  document.getElementById("productModalTitle").textContent =
    mode === "update" ? "UPDATE PRODUCT" : "ADD NEW PRODUCT";

  if (mode === "update" && product) {
    document.getElementById("pf_category").value = product.category;
    document.getElementById("pf_name").value = product.product_name;
    document.getElementById("pf_condition").value = product.condition;
    document.getElementById("pf_price").value = product.price;
    document.getElementById("pf_stock").value = product.stock_count;
    document.getElementById("pf_created_by").value = product.created_by;
    const previewBox = document.getElementById("pf_imagePreviewBox");
    previewBox.innerHTML = product.image_path
      ? `<img src="/${product.image_path}">`
      : `<span class="placeholder">No Image</span>`;
  } else {
    productForm.reset();
    document.getElementById("pf_created_by").value = "Admin";
    document.getElementById("pf_imagePreviewBox").innerHTML = `<span class="placeholder">No Image</span>`;
  }

  productModalBackdrop.classList.add("show");
}

function closeProductModal() {
  productModalBackdrop.classList.remove("show");
}

document.getElementById("addBtn").addEventListener("click", () => openProductModal("add"));
document.getElementById("updateBtn").addEventListener("click", () => {
  if (!selectedProduct) {
    toast("Please select a product first.", "error");
    return;
  }
  openProductModal("update", selectedProduct);
});
document.getElementById("productCancelBtn").addEventListener("click", closeProductModal);

document.getElementById("pf_image").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  pickedImageFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById("pf_imagePreviewBox").innerHTML = `<img src="${ev.target.result}">`;
  };
  reader.readAsDataURL(file);
});

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("pf_name").value.trim();
  const price = document.getElementById("pf_price").value;
  const stock = document.getElementById("pf_stock").value;

  if (!name) return toast("Please enter Product Name.", "error");
  if (price === "") return toast("Please enter Product Price.", "error");
  if (stock === "") return toast("Please enter Stock Quantity.", "error");

  const fd = new FormData();
  fd.append("category", document.getElementById("pf_category").value);
  fd.append("product_name", name);
  fd.append("condition", document.getElementById("pf_condition").value);
  fd.append("price", price);
  fd.append("stock_count", stock);
  fd.append("created_by", document.getElementById("pf_created_by").value || "Admin");
  if (pickedImageFile) fd.append("image", pickedImageFile);
  if (editingProductId && selectedProduct) fd.append("existing_image_path", selectedProduct.image_path || "");

  const saveBtn = document.getElementById("productSaveBtn");
  saveBtn.disabled = true;

  try {
    if (editingProductId) {
      await Api.updateProduct(editingProductId, fd);
      toast("Product updated successfully.");
    } else {
      await Api.addProduct(fd);
      toast("Product added successfully.");
    }
    closeProductModal();
    loadProducts();
  } catch (err) {
    toast(err.message, "error");
  } finally {
    saveBtn.disabled = false;
  }
});

// ==================================================================
// STOCK UPDATE MODAL
// ==================================================================

const stockModalBackdrop = document.getElementById("stockModalBackdrop");
const stockForm = document.getElementById("stockForm");

document.getElementById("stockBtn").addEventListener("click", () => {
  if (!selectedProduct) {
    toast("Please select a product first.", "error");
    return;
  }
  document.getElementById("sf_productName").value = selectedProduct.product_name;
  document.getElementById("sf_currentStock").value = selectedProduct.stock_count;
  document.getElementById("sf_quantity").value = 1;
  stockForm.sf_operation.value = "IN";
  stockModalBackdrop.classList.add("show");
});

document.getElementById("stockCancelBtn").addEventListener("click", () => {
  stockModalBackdrop.classList.remove("show");
});

stockForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const qty = parseInt(document.getElementById("sf_quantity").value, 10);
  if (!qty || qty <= 0) return toast("Quantity must be greater than zero.", "error");

  const operation = stockForm.sf_operation.value;

  try {
    await Api.updateStock(selectedProduct.id, { operation, quantity: qty, username: user.username });
    toast("Stock updated successfully.");
    stockModalBackdrop.classList.remove("show");
    loadProducts();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ==================================================================
// HISTORY MODAL
// ==================================================================

const historyModalBackdrop = document.getElementById("historyModalBackdrop");
let historyRows = [];

document.getElementById("historyBtn").addEventListener("click", async () => {
  historyModalBackdrop.classList.add("show");
  document.getElementById("historySearch").value = "";
  await loadHistory();
});
document.getElementById("historyCloseBtn").addEventListener("click", () => {
  historyModalBackdrop.classList.remove("show");
});

async function loadHistory() {
  try {
    historyRows = await Api.getActivity(100);
    renderHistory(historyRows);
  } catch (err) {
    toast(err.message, "error");
  }
}

function renderHistory(rows) {
  const tbody = document.getElementById("historyTableBody");
  tbody.innerHTML = rows
    .map(
      (r) => `<tr><td>${escapeHtml(r.created_at)}</td><td>${escapeHtml(r.username)}</td><td>${escapeHtml(r.activity)}</td></tr>`
    )
    .join("");
  document.getElementById("historyCount").textContent = `Showing Last ${rows.length} Activities`;
}

document.getElementById("historySearch").addEventListener("input", (e) => {
  const keyword = e.target.value.trim().toLowerCase();
  if (!keyword) {
    renderHistory(historyRows);
    return;
  }
  const filtered = historyRows.filter((r) =>
    `${r.created_at} ${r.username} ${r.activity}`.toLowerCase().includes(keyword)
  );
  const tbody = document.getElementById("historyTableBody");
  tbody.innerHTML = filtered
    .map(
      (r) => `<tr><td>${escapeHtml(r.created_at)}</td><td>${escapeHtml(r.username)}</td><td>${escapeHtml(r.activity)}</td></tr>`
    )
    .join("");
  document.getElementById("historyCount").textContent = `Showing ${filtered.length} Result(s)`;
});

// ==================================================================
// USER MANAGEMENT MODAL
// ==================================================================

const usersModalBackdrop = document.getElementById("usersModalBackdrop");

document.getElementById("usersBtn").addEventListener("click", async () => {
  usersModalBackdrop.classList.add("show");
  await loadUsers();
});
document.getElementById("usersCloseBtn").addEventListener("click", () => {
  usersModalBackdrop.classList.remove("show");
});

async function loadUsers() {
  try {
    const rows = await Api.getUsers();
    const tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = rows
      .map(
        (u) => `<tr data-id="${u.id}">
          <td>${u.id}</td><td>${escapeHtml(u.full_name || "")}</td>
          <td>${escapeHtml(u.username)}</td><td>${escapeHtml(u.role)}</td>
          <td>${escapeHtml(u.status)}</td></tr>`
      )
      .join("");
    tbody.querySelectorAll("tr").forEach((tr) => {
      tr.addEventListener("click", () => {
        tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("selected"));
        tr.classList.add("selected");
        selectedUserId = tr.dataset.id;
      });
    });
  } catch (err) {
    toast(err.message, "error");
  }
}

document.getElementById("refreshUsersBtn").addEventListener("click", loadUsers);

document.getElementById("blockUserBtn").addEventListener("click", async () => {
  if (!selectedUserId) return toast("Please select a user.", "error");
  try {
    await Api.toggleUserStatus(selectedUserId);
    loadUsers();
  } catch (err) {
    toast(err.message, "error");
  }
});

document.getElementById("deleteUserBtn").addEventListener("click", async () => {
  if (!selectedUserId) return toast("Please select a user.", "error");
  if (!confirm("Are you sure you want to delete this user?")) return;
  try {
    await Api.deleteUser(selectedUserId);
    toast("User deleted successfully.");
    selectedUserId = null;
    loadUsers();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ---------------- add/edit user form modal ----------------
const userFormModalBackdrop = document.getElementById("userFormModalBackdrop");
const userForm = document.getElementById("userForm");
let editingUserId = null;

document.getElementById("addUserBtn").addEventListener("click", () => {
  editingUserId = null;
  document.getElementById("userFormTitle").textContent = "ADD USER";
  userForm.reset();
  userFormModalBackdrop.classList.add("show");
});

document.getElementById("editUserBtn").addEventListener("click", async () => {
  if (!selectedUserId) return toast("Please select a user.", "error");
  try {
    const u = await Api.getUser(selectedUserId);
    editingUserId = selectedUserId;
    document.getElementById("userFormTitle").textContent = "EDIT USER";
    document.getElementById("uf_fullname").value = u.full_name || "";
    document.getElementById("uf_username").value = u.username;
    document.getElementById("uf_password").value = u.password;
    document.getElementById("uf_role").value = u.role;
    document.getElementById("uf_status").value = u.status;
    userFormModalBackdrop.classList.add("show");
  } catch (err) {
    toast(err.message, "error");
  }
});

document.getElementById("userFormCancelBtn").addEventListener("click", () => {
  userFormModalBackdrop.classList.remove("show");
});

userForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    full_name: document.getElementById("uf_fullname").value.trim(),
    username: document.getElementById("uf_username").value.trim(),
    password: document.getElementById("uf_password").value,
    role: document.getElementById("uf_role").value,
    status: document.getElementById("uf_status").value,
  };
  try {
    if (editingUserId) {
      await Api.updateUser(editingUserId, body);
      toast("User Updated.");
    } else {
      await Api.addUser(body);
      toast("User Added Successfully.");
    }
    userFormModalBackdrop.classList.remove("show");
    loadUsers();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ---------------- init ----------------
loadProducts();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}
