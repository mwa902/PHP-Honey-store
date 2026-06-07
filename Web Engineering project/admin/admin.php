<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/php/auth.php';
require_admin_page();
$adminName = htmlspecialchars((string) ($_SESSION['admin_username'] ?? 'Admin'));
$adminInitial = strtoupper(substr((string) ($_SESSION['admin_username'] ?? 'A'), 0, 1));
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin Dashboard — Honey Sugar Bakery</title>
    <meta
      name="description"
      content="Admin control panel for Honey Sugar Bakery — manage orders, products, and analytics."
    />
    <link rel="stylesheet" href="admin.css" />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
    />
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  </head>
  <body>
    <div class="sidebar-overlay" id="sidebarOverlay" aria-hidden="true"></div>
    <!-- ===== SIDEBAR ===== -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">🍯</div>
        <div class="brand-text">
          <span class="brand-name">Honey Sugar</span>
          <span class="brand-sub">Admin Panel</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li class="nav-item active" data-section="dashboard">
            <a href="#" onclick="showSection('dashboard', this)">
              <i class="fa-solid fa-chart-pie"></i>
              <span>Dashboard</span>
            </a>
          </li>
          <li class="nav-item" data-section="orders">
            <a href="#" onclick="showSection('orders', this)">
              <i class="fa-solid fa-box-open"></i>
              <span>Orders</span>
              <span class="badge">10</span>
            </a>
          </li>
          <li class="nav-item" data-section="categories">
            <a href="#" onclick="showSection('categories', this)">
              <i class="fa-solid fa-tags"></i>
              <span>Categories</span>
            </a>
          </li>
          <li class="nav-item" data-section="products">
            <a href="#" onclick="showSection('products', this)">
              <i class="fa-solid fa-jar"></i>
              <span>Products</span>
            </a>
          </li>
          <li class="nav-item" data-section="customers">
            <a href="#" onclick="showSection('customers', this)">
              <i class="fa-solid fa-users"></i>
              <span>Customers</span>
            </a>
          </li>
          <li class="nav-item" data-section="profile">
            <a href="#" onclick="showSection('profile', this)">
              <i class="fa-solid fa-user-shield"></i>
              <span>Profile Settings</span>
            </a>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-profile">
          <div class="admin-avatar" id="sidebarAvatar"><?= $adminInitial ?></div>
          <div class="admin-info">
            <span class="admin-name" id="sidebarAdminName"><?= $adminName ?></span>
            <span class="admin-role">Super Admin</span>
          </div>
        </div>
        <a href="logout.php" class="logout-link" title="Logout">
          <i class="fa-solid fa-right-from-bracket"></i>
        </a>
      </div>
    </aside>

    <!-- ===== MAIN CONTENT ===== -->
    <div class="main-wrapper">
      <!-- Top Bar -->
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="sidebar-toggle"
            id="sidebarToggle"
            title="Toggle Sidebar"
          >
            <i class="fa-solid fa-bars"></i>
          </button>
          <div class="page-title" id="pageTitle">Dashboard</div>
        </div>
        <div class="topbar-right">
          <div class="search-box">
            <input type="text" placeholder="Search…" id="globalSearch" />
          </div>
          <div class="topbar-icon" title="Notifications">
            <i class="fa-solid fa-bell"></i>
            <span class="notif-dot"></span>
          </div>
          <a
            href="../home/home.html"
            class="view-site-btn"
            target="_blank"
          >
            View Site
          </a>
        </div>
      </header>

      <!-- ======= DASHBOARD SECTION ======= -->
      <section class="content-section active" id="sec-dashboard">
        <div class="section-header">
          <h2>Welcome back, <?= $adminName ?> 👑</h2>
          <p>Here's what's happening with your store today.</p>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card stat-revenue">
            <div class="stat-icon"></div>
            <div class="stat-body">
              <div class="stat-label">Total Revenue</div>
              <div class="stat-value" id="statSales">Rs. 0</div>
              <div class="stat-change neutral" id="statSalesNote">From completed orders</div>
            </div>
          </div>
          <div class="stat-card stat-orders">
            <div class="stat-icon"></div>
            <div class="stat-body">
              <div class="stat-label">Total Orders</div>
              <div class="stat-value" id="statOrders">0</div>
              <div class="stat-change neutral">All time</div>
            </div>
          </div>
          <div class="stat-card stat-customers">
            <div class="stat-icon"></div>
            <div class="stat-body">
              <div class="stat-label">Customers</div>
              <div class="stat-value" id="statCustomers">0</div>
              <div class="stat-change neutral">Registered users</div>
            </div>
          </div>
          <div class="stat-card stat-products">
            <div class="stat-icon"></div>
            <div class="stat-body">
              <div class="stat-label">Products</div>
              <div class="stat-value" id="statProducts">0</div>
              <div class="stat-change neutral">Active catalogue</div>
            </div>
          </div>
          <div class="stat-card stat-orders">
            <div class="stat-icon"></div>
            <div class="stat-body">
              <div class="stat-label">Categories</div>
              <div class="stat-value" id="statCategories">0</div>
              <div class="stat-change neutral">Product groups</div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="card">
            <div class="card-header"><h3>Sales Overview</h3></div>
            <div style="height:260px;padding:12px"><canvas id="salesChart"></canvas></div>
          </div>
          <div class="card">
            <div class="card-header"><h3>Order Status</h3></div>
            <div style="height:260px;padding:12px"><canvas id="statusChart"></canvas></div>
          </div>
          <div class="card top-products-card">
            <div class="card-header"><h3>Top Products</h3></div>
            <ul class="top-products-list" id="topProductsList"></ul>
          </div>
        </div>
        <div class="card" id="lowStockCard" style="display:none;margin-bottom:20px">
          <div class="card-header"><h3>Low Stock Alerts</h3></div>
          <ul id="lowStockList" class="top-products-list"></ul>
        </div>

        <!-- Recent Orders Table -->
        <div class="card recent-orders-card">
          <div class="card-header">
            <h3>Recent Orders</h3>
            <button
              class="text-btn"
              onclick="
                showSection(
                  'orders',
                  document.querySelector('[data-section=orders] a'),
                )
              "
            >
              View All
            </button>
          </div>
          <div class="table-wrapper orders-table-mobile">
            <table class="data-table" id="recentOrdersTable">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ======= ORDERS SECTION ======= -->
      <section class="content-section" id="sec-orders">
        <div class="section-header">
          <h2>Orders Management</h2>
          <p>Track and manage all customer orders.</p>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>All Orders</h3>
            <div class="filter-bar">
              <input type="search" id="orderSearch" placeholder="Search orders…" oninput="loadOrders()" />
              <select id="orderStatusFilter" onchange="loadOrders()">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select id="orderSort" onchange="loadOrders()">
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
                <option value="amount_desc">Amount high→low</option>
                <option value="amount_asc">Amount low→high</option>
                <option value="status">By status</option>
              </select>
            </div>
          </div>
          <div class="table-wrapper orders-table-mobile">
            <table class="data-table" id="allOrdersTable">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ======= CATEGORIES SECTION ======= -->
      <section class="content-section" id="sec-categories">
        <div class="section-header">
          <h2>Categories</h2>
          <p>Add, edit, or remove product categories.</p>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>All Categories</h3>
            <button class="btn-primary" type="button" onclick="openCategoryModal()">+ Add Category</button>
          </div>
          <div class="table-wrapper">
            <table class="data-table" id="categoriesTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ======= PRODUCTS SECTION ======= -->
      <section class="content-section" id="sec-products">
        <div class="section-header">
          <h2>Product Catalogue</h2>
          <p>Manage your honey product listing.</p>
        </div>
        <div style="margin-bottom:16px">
          <button class="btn-primary" type="button" onclick="openProductModal()">+ Add Product</button>
        </div>
        <div class="products-admin-grid" id="productsAdminGrid"></div>
      </section>

      <!-- ======= CUSTOMERS SECTION ======= -->
      <section class="content-section" id="sec-customers">
        <div class="section-header">
          <h2>Customer Management</h2>
          <p>View all registered customers.</p>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>All Customers</h3>
            <div class="filter-bar">
              <input type="search" id="customerSearch" placeholder="Search name, email, phone…" oninput="loadCustomers()" />
              <input type="text" id="customerCity" placeholder="Filter by city" oninput="loadCustomers()" />
            </div>
          </div>
          <div class="table-wrapper orders-table-mobile">
            <table class="data-table" id="customersTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Orders</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="card-header" style="border-top:1px solid var(--border)">
            <button class="text-btn" type="button" id="customerPrev" onclick="changeCustomerPage(-1)">← Prev</button>
            <span id="customerPageInfo">Page 1</span>
            <button class="text-btn" type="button" id="customerNext" onclick="changeCustomerPage(1)">Next →</button>
          </div>
        </div>
      </section>

      <!-- ======= PROFILE SECTION ======= -->
      <section class="content-section" id="sec-profile">
        <div class="section-header">
          <h2>Profile Settings</h2>
          <p>Manage your admin account details and security.</p>
        </div>

        <div class="profile-container">
          <!-- Profile Info Card -->
          <div class="card profile-card">
            <div class="card-header">
              <h3>Personal Information</h3>
            </div>
            <div class="card-body">
              <form id="profileForm" onsubmit="updateProfile(event)">
                <div class="form-group">
                  <label for="adminName">Full Name</label>
                  <input type="text" id="adminName" class="form-control" value="<?= $adminName ?>" required>
                </div>
                <div class="form-group">
                  <label for="adminEmail">Email Address</label>
                  <input type="email" id="adminEmail" class="form-control" value="" required>
                </div>
                <div class="form-group">
                  <label for="adminPhone">Phone Number</label>
                  <input type="text" id="adminPhone" class="form-control" value="+92 300 1234567">
                </div>
                <button type="submit" class="btn-primary">Save Changes</button>
              </form>
            </div>
          </div>

          <!-- Change Password Card -->
          <div class="card password-card">
            <div class="card-header">
              <h3>Change Password</h3>
            </div>
            <div class="card-body">
              <form id="passwordForm" onsubmit="changePassword(event)">
                <div class="form-group">
                  <label for="currentPassword">Current Password</label>
                  <input type="password" id="currentPassword" class="form-control" placeholder="Enter current password" required>
                </div>
                <div class="form-group">
                  <label for="newPassword">New Password</label>
                  <input type="password" id="newPassword" class="form-control" placeholder="Enter new password" required>
                </div>
                <div class="form-group">
                  <label for="confirmNewPassword">Confirm New Password</label>
                  <input type="password" id="confirmNewPassword" class="form-control" placeholder="Confirm new password" required>
                </div>
                <button type="submit" class="btn-primary">Update Password</button>
              </form>
            </div>
          </div>
        </div>
      </section>

    </div>

    <div class="modal-overlay" id="orderModal" onclick="if(event.target===this) closeModal()">
      <div class="modal">
        <button class="modal-close" onclick="closeModal()" aria-label="Close">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <h3 class="modal-title">Order Details</h3>
        <div class="modal-body" id="modalBody"></div>
      </div>
    </div>

    <div class="modal-overlay" id="categoryModal" onclick="if(event.target===this) closeCategoryModal()">
      <div class="modal">
        <button class="modal-close" onclick="closeCategoryModal()" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
        <h3 class="modal-title" id="categoryModalTitle">Add Category</h3>
        <form id="categoryForm" onsubmit="saveCategory(event)">
          <input type="hidden" id="categoryId" />
          <div class="form-group"><label>Name</label><input class="form-control" id="categoryName" required /></div>
          <div class="form-group"><label>Description</label><textarea class="form-control" id="categoryDescription" rows="3"></textarea></div>
          <button type="submit" class="btn-primary">Save Category</button>
        </form>
      </div>
    </div>

    <div class="modal-overlay" id="productModal" onclick="if(event.target===this) closeProductModal()">
      <div class="modal">
        <button class="modal-close" onclick="closeProductModal()" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
        <h3 class="modal-title" id="productModalTitle">Add Product</h3>
        <form id="productForm" onsubmit="saveProduct(event)" enctype="multipart/form-data">
          <input type="hidden" id="productId" />
          <div class="form-group"><label>Name</label><input class="form-control" id="productName" required /></div>
          <div class="form-group"><label>Slug (URL key)</label><input class="form-control" id="productSlug" required /></div>
          <div class="form-group"><label>Category</label><select class="form-control" id="productCategory"></select></div>
          <div class="form-group"><label>Price (Rs.)</label><input type="number" min="0" step="0.01" class="form-control" id="productPrice" required /></div>
          <div class="form-group"><label>Stock</label><input type="number" min="0" class="form-control" id="productStock" required /></div>
          <div class="form-group"><label>Low stock alert at</label><input type="number" min="0" class="form-control" id="productLowStock" value="5" /></div>
          <div class="form-group"><label>Description</label><textarea class="form-control" id="productDescription" rows="3"></textarea></div>
          <div class="form-group"><label>Image</label><input type="file" class="form-control" id="productImage" accept="image/*" /></div>
          <button type="submit" class="btn-primary">Save Product</button>
        </form>
      </div>
    </div>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>

    <script src="admin.js"></script>
  </body>
</html>
