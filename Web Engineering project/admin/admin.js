const API = "../php/api";

const pageTitles = {
  dashboard: "Dashboard",
  orders: "Orders",
  categories: "Categories",
  products: "Product Catalogue",
  customers: "Customers",
  profile: "Profile Settings",
};

let salesChart = null;
let statusChart = null;
let customerPage = 1;
let categoriesCache = [];

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function setSidebarOpen(open) {
  sidebar.classList.toggle("open", open);
  if (sidebarOverlay) {
    sidebarOverlay.classList.toggle("visible", open);
    sidebarOverlay.setAttribute("aria-hidden", open ? "false" : "true");
  }
}

sidebarToggle?.addEventListener("click", () =>
  setSidebarOpen(!sidebar.classList.contains("open")),
);
sidebarOverlay?.addEventListener("click", () => setSidebarOpen(false));

document.addEventListener("click", (e) => {
  if (
    window.innerWidth <= 820 &&
    sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) &&
    !sidebarToggle.contains(e.target)
  ) {
    setSidebarOpen(false);
  }
});

function showSection(id, linkEl) {
  document
    .querySelectorAll(".content-section")
    .forEach((s) => s.classList.remove("active"));
  const target = document.getElementById("sec-" + id);
  if (target) target.classList.add("active");

  document
    .querySelectorAll(".nav-item")
    .forEach((li) => li.classList.remove("active"));
  if (linkEl) linkEl.closest(".nav-item")?.classList.add("active");

  document.getElementById("pageTitle").textContent = pageTitles[id] || id;
  if (window.innerWidth <= 820) setSidebarOpen(false);

  if (id === "orders") loadOrders();
  if (id === "products") loadProducts();
  if (id === "categories") loadCategories();
  if (id === "customers") loadCustomers();

  return false;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}/${path}`, {
    credentials: "same-origin",
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function statusBadge(status) {
  const s = String(status || "pending").toLowerCase();
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return `<span class="badge-status ${s}">${label}</span>`;
}

function formatMoney(amount) {
  return "Rs. " + Number(amount || 0).toLocaleString();
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function loadDashboard() {
  const data = await apiFetch("dashboard.php");
  const s = data.stats;

  document.getElementById("statSales").textContent = formatMoney(s.total_sales);
  document.getElementById("statOrders").textContent = s.total_orders;
  document.getElementById("statCustomers").textContent = s.total_customers;
  document.getElementById("statProducts").textContent = s.total_products;
  document.getElementById("statCategories").textContent = s.total_categories;

  renderOrdersTable("recentOrdersTable", data.recent_orders, false);
  renderTopProducts(data.top_products);
  renderLowStock(data.low_stock);
  renderCharts(data.monthly_sales, data.status_breakdown);
}

function renderTopProducts(items) {
  const list = document.getElementById("topProductsList");
  if (!list) return;
  if (!items.length) {
    list.innerHTML = '<li><span class="tp-name">No sales data yet</span></li>';
    return;
  }
  const max = Math.max(...items.map((i) => i.revenue), 1);
  list.innerHTML = items
    .map(
      (item, idx) => `
    <li>
      <div class="tp-info"><span class="tp-rank">${idx + 1}</span><span class="tp-name">${item.name}</span></div>
      <div class="tp-bar-wrap"><div class="tp-bar" style="width:${Math.round((item.revenue / max) * 100)}%"></div></div>
      <span class="tp-value">${formatMoney(item.revenue)}</span>
    </li>`,
    )
    .join("");
}

function renderLowStock(items) {
  const card = document.getElementById("lowStockCard");
  const list = document.getElementById("lowStockList");
  if (!card || !list) return;
  if (!items.length) {
    card.style.display = "none";
    return;
  }
  card.style.display = "block";
  list.innerHTML = items
    .map(
      (p) =>
        `<li><span class="tp-name">${p.name}</span><span class="tp-value">${p.stock_quantity} left</span></li>`,
    )
    .join("");
}

function renderCharts(monthlySales, statusBreakdown) {
  const salesEl = document.getElementById("salesChart");
  const statusEl = document.getElementById("statusChart");
  if (!salesEl || !statusEl || typeof Chart === "undefined") return;

  const salesLabels = monthlySales.map((m) => m.label);
  const salesValues = monthlySales.map((m) => m.total);

  if (salesChart) salesChart.destroy();
  salesChart = new Chart(salesEl.getContext("2d"), {
    type: "line",
    data: {
      labels: salesLabels.length ? salesLabels : ["No data"],
      datasets: [
        {
          label: "Revenue",
          data: salesValues.length ? salesValues : [0],
          borderColor: "#E67A00",
          backgroundColor: "rgba(230,122,0,0.15)",
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });

  if (statusChart) statusChart.destroy();
  statusChart = new Chart(statusEl.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: statusBreakdown.map((s) => s.status),
      datasets: [
        {
          data: statusBreakdown.map((s) => s.count),
          backgroundColor: [
            "#22c55e",
            "#3b82f6",
            "#f97316",
            "#E67A00",
            "#ef4444",
          ],
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

function renderOrdersTable(tableId, orders, showAction = false) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = (orders || [])
    .map(
      (o) => `
    <tr data-status="${o.status}" data-id="${o.order_row_id}">
      <td data-label="Order ID">#${o.order_id}</td>
      <td data-label="Customer">${o.customer}</td>
      <td data-label="Product">${o.product}</td>
      <td data-label="Amount">${formatMoney(o.amount)}</td>
      <td data-label="Status">${statusBadge(o.status)}</td>
      <td data-label="Date">${formatDate(o.date)}</td>
      ${
        showAction
          ? `<td data-label="Action">
        <button class="action-btn view" onclick="viewOrder(${o.order_row_id})" title="View"><i class="fa-solid fa-eye"></i></button>
        <select onchange="updateOrderStatus(${o.order_row_id}, this.value)">
          <option value="">Update…</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </td>`
          : ""
      }
    </tr>`,
    )
    .join("");
}

async function loadOrders() {
  const status = document.getElementById("orderStatusFilter")?.value || "all";
  const sort = document.getElementById("orderSort")?.value || "date_desc";
  const search = document.getElementById("orderSearch")?.value || "";
  const qs = new URLSearchParams({ status, sort, search });
  const data = await apiFetch(`orders.php?${qs.toString()}`);
  renderOrdersTable("allOrdersTable", data.orders, true);
}

async function updateOrderStatus(orderRowId, status) {
  if (!status) return;
  await apiFetch("orders.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "update_status",
      order_row_id: orderRowId,
      status,
    }),
  });
  showToast("Order status updated");
  await loadOrders();
  await loadDashboard();
}

async function viewOrder(orderRowId) {
  const data = await apiFetch("orders.php");
  const order = data.orders.find(
    (o) => Number(o.order_row_id) === Number(orderRowId),
  );
  if (!order) return;

  document.getElementById("modalBody").innerHTML = `
    <div class="modal-row"><label>Order ID</label><span>#${order.order_id}</span></div>
    <div class="modal-row"><label>Customer</label><span>${order.customer}</span></div>
    <div class="modal-row"><label>Product</label><span>${order.product}</span></div>
    <div class="modal-row"><label>Amount</label><span>${formatMoney(order.amount)}</span></div>
    <div class="modal-row"><label>Status</label><span>${order.status}</span></div>
    <div class="modal-row"><label>Date</label><span>${formatDate(order.date)}</span></div>
    <div class="modal-row"><label>Address</label><span>${order.address || ""}</span></div>
  `;
  document.getElementById("orderModal").classList.add("open");
}

function closeModal() {
  document.getElementById("orderModal").classList.remove("open");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeCategoryModal();
    closeProductModal();
  }
});

async function loadCategories() {
  const data = await apiFetch("categories.php");
  categoriesCache = data.categories;
  const tbody = document.querySelector("#categoriesTable tbody");
  tbody.innerHTML = categoriesCache
    .map(
      (c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.name}</td>
      <td>${c.description || ""}</td>
      <td>
        <button class="pac-btn edit" onclick="openCategoryModalById(${c.category_id})">Edit</button>
        <button class="pac-btn view" onclick="deleteCategory(${c.category_id}, '${String(c.name).replace(/'/g, "&#39;")}')">Delete</button>
      </td>
    </tr>`,
    )
    .join("");

  const select = document.getElementById("productCategory");
  if (select) {
    select.innerHTML =
      '<option value="">— Select —</option>' +
      categoriesCache
        .map((c) => `<option value="${c.category_id}">${c.name}</option>`)
        .join("");
  }
}

function openCategoryModalById(id) {
  const category = categoriesCache.find(
    (c) => Number(c.category_id) === Number(id),
  );
  openCategoryModal(category || null);
}

function openProductModalById(id) {
  apiFetch("products.php").then((data) => {
    const product = data.products.find(
      (p) => Number(p.product_id) === Number(id),
    );
    openProductModal(product || null);
  });
}

function openCategoryModal(category = null) {
  document.getElementById("categoryModalTitle").textContent = category
    ? "Edit Category"
    : "Add Category";
  document.getElementById("categoryId").value = category?.category_id || "";
  document.getElementById("categoryName").value = category?.name || "";
  document.getElementById("categoryDescription").value =
    category?.description || "";
  document.getElementById("categoryModal").classList.add("open");
}

function closeCategoryModal() {
  document.getElementById("categoryModal").classList.remove("open");
}

async function saveCategory(e) {
  e.preventDefault();
  const id = document.getElementById("categoryId").value;
  const payload = {
    name: document.getElementById("categoryName").value.trim(),
    description: document.getElementById("categoryDescription").value.trim(),
  };

  if (id) {
    await apiFetch("categories.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_id: Number(id), ...payload }),
    });
  } else {
    await apiFetch("categories.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  closeCategoryModal();
  showToast("Category saved");
  await loadCategories();
  await loadDashboard();
}

async function deleteCategory(id, name) {
  if (
    !confirm(
      `Delete category "${name}"? Products in this category will be unlinked.`,
    )
  )
    return;
  await apiFetch("categories.php", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category_id: id }),
  });
  showToast("Category deleted");
  await loadCategories();
}

async function loadProducts() {
  const data = await apiFetch("products.php");
  const grid = document.getElementById("productsAdminGrid");
  grid.innerHTML = data.products
    .map((p) => {
      const stockClass = p.is_low_stock ? "low" : "ok";
      const stockText = p.is_low_stock
        ? `<i class="fa-solid fa-triangle-exclamation"></i> Low stock (${p.stock_quantity})`
        : `<i class="fa-solid fa-circle-check"></i> In stock (${p.stock_quantity})`;
      return `
      <div class="product-admin-card">
        <div class="pac-img-wrap">
          <img src="${p.image_path || "../product/images.png"}" alt="${p.name}" onerror="this.src='../product/images.png'" />
          <span class="pac-category">${p.category_name || "—"}</span>
        </div>
        <div class="pac-body">
          <h4>${p.name}</h4>
          <div class="pac-price">${formatMoney(p.price)}</div>
          <div class="pac-stock ${stockClass}">${stockText}</div>
        </div>
        <div class="pac-actions">
          <button class="pac-btn edit" onclick="openProductModalById(${p.product_id})">Edit</button>
          <a href="../product/product_detail.html?product=${p.slug}" class="pac-btn view" target="_blank">View</a>
          <button class="pac-btn view" onclick="deleteProduct(${p.product_id}, '${p.name.replace(/'/g, "\\'")}')">Remove</button>
        </div>
      </div>`;
    })
    .join("");
}

function openProductModal(product = null) {
  document.getElementById("productModalTitle").textContent = product
    ? "Edit Product"
    : "Add Product";
  document.getElementById("productId").value = product?.product_id || "";
  document.getElementById("productName").value = product?.name || "";
  document.getElementById("productSlug").value = product?.slug || "";
  document.getElementById("productCategory").value = product?.category_id || "";
  document.getElementById("productPrice").value = product?.price || "";
  document.getElementById("productStock").value = product?.stock_quantity ?? 0;
  document.getElementById("productLowStock").value =
    product?.low_stock_threshold ?? 5;
  document.getElementById("productDescription").value =
    product?.description || "";
  document.getElementById("productImage").value = "";
  document.getElementById("productModal").classList.add("open");
}

function closeProductModal() {
  document.getElementById("productModal").classList.remove("open");
}

async function saveProduct(e) {
  e.preventDefault();
  const formData = new FormData();
  const id = document.getElementById("productId").value;
  formData.append("name", document.getElementById("productName").value.trim());
  formData.append("slug", document.getElementById("productSlug").value.trim());
  formData.append(
    "category_id",
    document.getElementById("productCategory").value,
  );
  formData.append("price", document.getElementById("productPrice").value);
  formData.append(
    "stock_quantity",
    document.getElementById("productStock").value,
  );
  formData.append(
    "low_stock_threshold",
    document.getElementById("productLowStock").value,
  );
  formData.append(
    "description",
    document.getElementById("productDescription").value.trim(),
  );

  const imageInput = document.getElementById("productImage");
  if (imageInput.files[0]) formData.append("image", imageInput.files[0]);

  if (id) {
    formData.append("action", "update");
    formData.append("product_id", id);
    await fetch(`${API}/products.php`, {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Update failed");
    });
  } else {
    await fetch(`${API}/products.php`, {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Create failed");
    });
  }

  closeProductModal();
  showToast("Product saved");
  await loadProducts();
  await loadDashboard();
}

async function deleteProduct(id, name) {
  if (!confirm(`Remove product "${name}" from the catalogue?`)) return;
  await apiFetch("products.php", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: id }),
  });
  showToast("Product removed");
  await loadProducts();
}

async function loadCustomers() {
  const search = document.getElementById("customerSearch")?.value || "";
  const city = document.getElementById("customerCity")?.value || "";
  const qs = new URLSearchParams({ page: customerPage, search, city });
  const data = await apiFetch(`customers.php?${qs}`);
  const tbody = document.querySelector("#customersTable tbody");
  tbody.innerHTML = data.customers
    .map(
      (c, i) => `
    <tr>
      <td>${(data.pagination.page - 1) * data.pagination.per_page + i + 1}</td>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.phone}</td>
      <td>${c.city || "—"}</td>
      <td>${c.order_count}</td>
      <td>${formatDate(c.created_at)}</td>
    </tr>`,
    )
    .join("");

  document.getElementById("customerPageInfo").textContent =
    `Page ${data.pagination.page} of ${Math.max(1, data.pagination.total_pages)} (${data.pagination.total} customers)`;
}

function changeCustomerPage(delta) {
  customerPage = Math.max(1, customerPage + delta);
  loadCustomers();
}

async function loadProfile() {
  const data = await apiFetch("admin_profile.php");
  document.getElementById("adminName").value = data.profile.username;
  document.getElementById("adminEmail").value = data.profile.email;
  document.getElementById("adminPhone").value = data.profile.phonenumber || "";
}

async function updateProfile(e) {
  e.preventDefault();
  try {
    await apiFetch("admin_profile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_profile",
        username: document.getElementById("adminName").value.trim(),
        email: document.getElementById("adminEmail").value.trim(),
        phonenumber: document.getElementById("adminPhone").value.trim(),
      }),
    });

    const name = document.getElementById("adminName").value.trim();
    document.getElementById("sidebarAdminName").textContent = name;
    document.getElementById("sidebarAvatar").textContent = name
      .charAt(0)
      .toUpperCase();
    showToast("✅ Profile updated");
  } catch (err) {
    showToast("⚠️ " + err.message);
  }
}

async function changePassword(e) {
  e.preventDefault();

  const newPwd = document.getElementById("newPassword").value;
  const confirmPwd = document.getElementById("confirmNewPassword").value;

  if (newPwd !== confirmPwd) {
    showToast("⚠️ New passwords do not match");
    return;
  }
  if (newPwd.length < 8) {
    showToast("⚠️ Password must be at least 8 characters");
    return;
  }

  try {
    await apiFetch("admin_profile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "change_password",
        current_password: document.getElementById("currentPassword").value,
        new_password: newPwd,
        confirm_password: confirmPwd,
      }),
    });
    showToast(
      "✅ Password changed — please log in again with your new password",
    );
    document.getElementById("passwordForm").reset();
    setTimeout(() => {
      window.location.href = "login.php";
    }, 2200);
  } catch (err) {
    showToast("⚠️ " + err.message);
  }
}

document
  .getElementById("globalSearch")
  ?.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    const q = this.value.trim().toLowerCase();
    if (!q) return;
    const sectionMap = {
      order: "orders",
      product: "products",
      category: "categories",
      customer: "customers",
      dashboard: "dashboard",
    };
    for (const [key, sec] of Object.entries(sectionMap)) {
      if (q.includes(key)) {
        const link = document.querySelector(`[data-section="${sec}"] a`);
        showSection(sec, link);
        showToast(`Navigated to ${pageTitles[sec]}`);
        this.value = "";
        return;
      }
    }
    showToast(`No results for "${q}"`);
    this.value = "";
  });

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadCategories();
    await loadDashboard();
    await loadProfile();
    await loadOrders();
  } catch (err) {
    showToast("⚠️ " + err.message + " — run database/install.sql and seed.sql");
    console.error(err);
  }
});
