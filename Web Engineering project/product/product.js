/* ============================================================
   product.js — Honey Sugar Bakery · Product Page
   All interactive features for the product listing page
   ============================================================ */

/* ── 1. DOM READY ── */
document.addEventListener("DOMContentLoaded", () => {
  initCart();
  initFilters();
  initMobileMenu();
  initSearch();
  initWishlist();
  initScrollToTop();
  initLazyImages();
  initCardAnimations();
  initProductQuickView();
  updateCartBadge();
  loadWishlistState();
});

/* ============================================================
   2. CART SYSTEM
   ============================================================ */
const CART_KEY = "honey_cart";

/** Return current cart array from localStorage */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

/** Persist cart array to localStorage */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/** Add a product to the cart (or increment quantity) */
function addToCart(name, price, image = "🍯") {
  const cart = getCart();
  const existing = cart.find((i) => i.name === name);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ name, price, image, quantity: 1 });
  }
  saveCart(cart);
  updateCartBadge();
  showToast(`🍯 "${name}" added to cart!`, "success");
  animateCartIcon();
}

/** Remove a product from the cart by name */
function removeFromCart(name) {
  const cart = getCart().filter((i) => i.name !== name);
  saveCart(cart);
  updateCartBadge();
  renderCartSidebar();
}

/** Change quantity of a cart item */
function changeQty(name, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.name === name);
  if (!item) return;
  item.quantity = Math.max(1, (item.quantity || 1) + delta);
  saveCart(cart);
  renderCartSidebar();
  updateCartBadge();
}

/** Clear entire cart */
function clearCart() {
  saveCart([]);
  updateCartBadge();
  renderCartSidebar();
  showToast("Cart cleared.", "info");
}

/** Update the cart icon badge count */
function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const badge = document.getElementById("cartBadge");
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? "flex" : "none";
  }
}

/** Render cart items inside the sidebar */
function renderCartSidebar() {
  const container = document.querySelector(".cart-content");
  if (!container) return;
  const cart = getCart();

  if (!cart.length) {
    container.innerHTML = `<p class="empty-cart-message">🛒 Your cart is currently empty.</p>`;
    return;
  }

  let subtotal = 0;
  const itemsHTML = cart
    .map((item) => {
      const price = Number(String(item.price || 0).replace(/[^0-9]/g, ""));
      const qty = item.quantity || 1;
      subtotal += price * qty;
      return `
        <div class="cart-item">
          <span class="cart-item-emoji">${item.image || "🍯"}</span>
          <div class="cart-item-info">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">Rs. ${(price * qty).toLocaleString()}</span>
          </div>
          <div class="cart-qty-controls">
            <button onclick="changeQty('${item.name}', -1)" class="qty-btn">−</button>
            <span class="qty-display">${qty}</span>
            <button onclick="changeQty('${item.name}', 1)" class="qty-btn">+</button>
          </div>
          <button class="remove-item-btn" onclick="removeFromCart('${item.name}')" title="Remove">✕</button>
        </div>`;
    })
    .join("");

  container.innerHTML = `
    <div class="cart-items-list">${itemsHTML}</div>
    <div class="cart-footer">
      <div class="cart-subtotal">
        <span>Subtotal</span>
        <strong>Rs. ${subtotal.toLocaleString()}</strong>
      </div>
      <a href="../Cart checkout/checkout.html" class="checkout-btn">Proceed to Checkout 🍯</a>
      <button class="clear-cart-btn" onclick="clearCart()">Clear Cart</button>
    </div>`;
}

/** Wire up cart open/close */
function initCart() {
  const cartToggle = document.getElementById("cartToggle");
  const closeCart = document.getElementById("closeCart");
  const cartSidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("cartOverlay") || createCartOverlay();

  if (cartToggle) {
    cartToggle.addEventListener("click", () => {
      cartSidebar.classList.add("open");
      overlay.classList.add("visible");
      renderCartSidebar();
    });
  }

  if (closeCart) {
    closeCart.addEventListener("click", closeCartSidebar);
  }

  overlay.addEventListener("click", closeCartSidebar);

  // Wire up "Add to Cart" buttons on each product card
  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const card = btn.closest(".product-card");
      const name = card.querySelector("h3")?.textContent.trim() || "Honey Product";
      const price = card.querySelector(".price")?.textContent.trim() || "Rs. 0";
      addToCart(name, price, "🍯");

      // Button feedback
      btn.textContent = "✓ Added!";
      btn.classList.add("added");
      setTimeout(() => {
        btn.textContent = "Add to Cart";
        btn.classList.remove("added");
      }, 1800);
    });
  });

  function closeCartSidebar() {
    cartSidebar.classList.remove("open");
    overlay.classList.remove("visible");
  }
}

/** Create a dark overlay behind the cart sidebar */
function createCartOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "cartOverlay";
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1999;" +
    "opacity:0;pointer-events:none;transition:opacity 0.35s;";
  document.body.appendChild(overlay);
  overlay.addEventListener("transitionend", () => {
    if (!overlay.classList.contains("visible")) {
      overlay.style.pointerEvents = "none";
    }
  });
  // Intercept classList changes to toggle opacity
  const origAdd = overlay.classList.add.bind(overlay.classList);
  const origRemove = overlay.classList.remove.bind(overlay.classList);
  overlay.classList.add = (...args) => {
    origAdd(...args);
    if (args.includes("visible")) {
      overlay.style.opacity = "1";
      overlay.style.pointerEvents = "all";
    }
  };
  overlay.classList.remove = (...args) => {
    origRemove(...args);
    if (args.includes("visible")) {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
    }
  };
  return overlay;
}

/** Bounce animation on the cart icon */
function animateCartIcon() {
  const icon = document.getElementById("cartToggle");
  if (!icon) return;
  icon.style.transform = "scale(1.35)";
  setTimeout(() => (icon.style.transform = "scale(1)"), 300);
}

/* ============================================================
   3. PRODUCT FILTERING
   ============================================================ */
function initFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const products = document.querySelectorAll(".product-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update active state
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");
      let visibleCount = 0;

      products.forEach((card) => {
        const match =
          filter === "all" || card.getAttribute("data-category") === filter;
        if (match) {
          card.style.display = "flex";
          card.style.animation = "fadeSlideIn 0.4s ease forwards";
          visibleCount++;
        } else {
          card.style.display = "none";
        }
      });

      if (visibleCount === 0) showNoResults();
      else removeNoResults();
    });
  });
}

function showNoResults() {
  removeNoResults();
  const grid = document.querySelector(".products-grid");
  if (!grid) return;
  const msg = document.createElement("p");
  msg.id = "noResultsMsg";
  msg.style.cssText =
    "grid-column:1/-1;text-align:center;padding:40px;color:#A66A00;font-size:1rem;";
  msg.textContent = "No products found for this category.";
  grid.appendChild(msg);
}

function removeNoResults() {
  document.getElementById("noResultsMsg")?.remove();
}

/* ============================================================
   4. MOBILE MENU
   ============================================================ */
function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const navCenter = document.getElementById("navCenter");
  if (!menuToggle || !navCenter) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = navCenter.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!menuToggle.contains(e.target) && !navCenter.contains(e.target)) {
      navCenter.classList.remove("active");
      menuToggle.textContent = "☰";
    }
  });
}

/* ============================================================
   5. PRODUCT SEARCH
   ============================================================ */
function initSearch() {
  // Inject a search bar below the filter nav
  const productNav = document.querySelector(".product-nav");
  if (!productNav) return;

  const searchWrap = document.createElement("div");
  searchWrap.className = "search-bar-wrap";
  searchWrap.innerHTML = `
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input type="text" id="productSearch" placeholder="Search products…" autocomplete="off" />
      <button id="clearSearch" class="clear-search-btn" title="Clear search" style="display:none">✕</button>
    </div>`;
  productNav.insertAdjacentElement("afterend", searchWrap);

  const searchInput = document.getElementById("productSearch");
  const clearBtn = document.getElementById("clearSearch");
  const products = document.querySelectorAll(".product-card");

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    clearBtn.style.display = query ? "flex" : "none";
    let visible = 0;

    products.forEach((card) => {
      const name = card.querySelector("h3")?.textContent.toLowerCase() || "";
      const desc = card.querySelector("p")?.textContent.toLowerCase() || "";
      const match = name.includes(query) || desc.includes(query);
      card.style.display = match ? "flex" : "none";
      if (match) visible++;
    });

    if (visible === 0) showNoResults();
    else removeNoResults();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.style.display = "none";
    products.forEach((c) => (c.style.display = "flex"));
    removeNoResults();
    searchInput.focus();
  });
}

/* ============================================================
   6. WISHLIST (HEART TOGGLE)
   ============================================================ */
const WISH_KEY = "honey_wishlist";

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISH_KEY)) || [];
  } catch {
    return [];
  }
}

function toggleWishlist(name, btn) {
  let list = getWishlist();
  if (list.includes(name)) {
    list = list.filter((n) => n !== name);
    btn.classList.remove("wished");
    btn.title = "Add to Wishlist";
    showToast(`💔 Removed from wishlist`, "info");
  } else {
    list.push(name);
    btn.classList.add("wished");
    btn.title = "Remove from Wishlist";
    showToast(`❤️ Added to wishlist!`, "success");
  }
  localStorage.setItem(WISH_KEY, JSON.stringify(list));
}

function initWishlist() {
  const wishlist = getWishlist();
  document.querySelectorAll(".product-card").forEach((card) => {
    const name = card.querySelector("h3")?.textContent.trim() || "";

    // Inject wishlist button
    const btn = document.createElement("button");
    btn.className = "wishlist-btn";
    btn.title = "Add to Wishlist";
    btn.innerHTML = "♡";
    if (wishlist.includes(name)) {
      btn.classList.add("wished");
      btn.innerHTML = "♥";
      btn.title = "Remove from Wishlist";
    }
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleWishlist(name, btn);
      btn.innerHTML = btn.classList.contains("wished") ? "♥" : "♡";
    });
    card.style.position = "relative";
    card.appendChild(btn);
  });
}

function loadWishlistState() {
  // Re-apply saved wishlist state (called after initWishlist on DOMContentLoaded)
  const wishlist = getWishlist();
  document.querySelectorAll(".wishlist-btn").forEach((btn) => {
    const card = btn.closest(".product-card");
    const name = card?.querySelector("h3")?.textContent.trim() || "";
    if (wishlist.includes(name)) {
      btn.classList.add("wished");
      btn.innerHTML = "♥";
    }
  });
}

/* ============================================================
   7. SCROLL-TO-TOP BUTTON
   ============================================================ */
function initScrollToTop() {
  const btn = document.createElement("button");
  btn.id = "scrollTopBtn";
  btn.innerHTML = "▲";
  btn.title = "Back to top";
  btn.style.cssText =
    "position:fixed;bottom:32px;right:32px;z-index:900;" +
    "width:44px;height:44px;border-radius:50%;border:none;" +
    "background:linear-gradient(135deg,#E67A00,#D35400);color:#fff;" +
    "font-size:1.1rem;cursor:pointer;box-shadow:0 4px 14px rgba(211,84,0,0.35);" +
    "opacity:0;transform:translateY(20px);transition:all 0.3s ease;pointer-events:none;";
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    const show = window.scrollY > 300;
    btn.style.opacity = show ? "1" : "0";
    btn.style.transform = show ? "translateY(0)" : "translateY(20px)";
    btn.style.pointerEvents = show ? "all" : "none";
  });

  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
}

/* ============================================================
   8. LAZY IMAGE LOADING
   ============================================================ */
function initLazyImages() {
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
          }
          img.classList.add("img-loaded");
          io.unobserve(img);
        }
      });
    },
    { rootMargin: "0px 0px 100px 0px" }
  );

  document.querySelectorAll(".product-card img").forEach((img) => io.observe(img));
}

/* ============================================================
   9. CARD ENTER ANIMATIONS (Intersection Observer)
   ============================================================ */
function initCardAnimations() {
  if (!("IntersectionObserver" in window)) return;
  const cards = document.querySelectorAll(".product-card");
  cards.forEach((c) => {
    c.style.opacity = "0";
    c.style.transform = "translateY(24px)";
    c.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }, idx * 80);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  cards.forEach((c) => io.observe(c));
}

/* ============================================================
   10. QUICK VIEW MODAL
   ============================================================ */
function initProductQuickView() {
  // Build modal DOM once
  const modal = document.createElement("div");
  modal.id = "quickViewModal";
  modal.innerHTML = `
    <div class="qv-overlay" id="qvOverlay"></div>
    <div class="qv-box" id="qvBox">
      <button class="qv-close" id="qvClose">✕</button>
      <img id="qvImg" src="" alt="" />
      <div class="qv-info">
        <h2 id="qvName"></h2>
        <p id="qvDesc"></p>
        <div class="qv-price" id="qvPrice"></div>
        <button class="qv-add-btn" id="qvAddBtn">Add to Cart 🍯</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const closeQV = () => modal.classList.remove("qv-open");
  document.getElementById("qvClose").addEventListener("click", closeQV);
  document.getElementById("qvOverlay").addEventListener("click", closeQV);

  document.querySelectorAll(".product-card").forEach((card) => {
    // "Quick View" button
    const qvBtn = document.createElement("button");
    qvBtn.className = "quick-view-btn";
    qvBtn.textContent = "Quick View";
    const imgWrap = card.querySelector("a");
    if (imgWrap) imgWrap.appendChild(qvBtn);

    qvBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const name = card.querySelector("h3")?.textContent.trim() || "";
      const desc = card.querySelector("p")?.textContent.trim() || "";
      const price = card.querySelector(".price")?.textContent.trim() || "";
      const imgSrc = card.querySelector("img")?.src || "";

      document.getElementById("qvImg").src = imgSrc;
      document.getElementById("qvName").textContent = name;
      document.getElementById("qvDesc").textContent = desc;
      document.getElementById("qvPrice").textContent = price;

      const addBtn = document.getElementById("qvAddBtn");
      addBtn.onclick = () => {
        addToCart(name, price, "🍯");
        closeQV();
      };
      modal.classList.add("qv-open");
    });
  });
}

/* ============================================================
   11. TOAST NOTIFICATIONS
   ============================================================ */
function showToast(message, type = "success") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.cssText =
      "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
      "z-index:9999;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none;";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  const bg =
    type === "success"
      ? "linear-gradient(135deg,#E67A00,#D35400)"
      : type === "error"
      ? "linear-gradient(135deg,#e74c3c,#c0392b)"
      : "linear-gradient(135deg,#8C5500,#6b3e00)";

  toast.style.cssText =
    `background:${bg};color:#fff;padding:12px 24px;border-radius:30px;` +
    "font-size:0.93rem;font-weight:500;box-shadow:0 6px 20px rgba(0,0,0,0.2);" +
    "animation:toastIn 0.35s ease;pointer-events:none;white-space:nowrap;";
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastOut 0.35s ease forwards";
    setTimeout(() => toast.remove(), 350);
  }, 2600);
}

// Inject toast keyframes (once)
(function injectToastStyles() {
  if (document.getElementById("toastKeyframes")) return;
  const s = document.createElement("style");
  s.id = "toastKeyframes";
  s.textContent = `
    @keyframes toastIn  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes toastOut { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(16px)} }
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

    /* Cart sidebar items */
    .cart-items-list { display:flex;flex-direction:column;gap:12px;flex:1;overflow-y:auto;padding:20px 22px; }
    .cart-item { display:flex;align-items:center;gap:10px;padding:10px;background:#fff8ee;border-radius:10px;border:1px solid rgba(230,168,0,0.2); }
    .cart-item-emoji { font-size:1.6rem;width:38px;text-align:center;flex-shrink:0; }
    .cart-item-info { flex:1;display:flex;flex-direction:column; }
    .cart-item-name { font-size:0.86rem;font-weight:600;color:#3E2300; }
    .cart-item-price { font-size:0.8rem;color:#E67A00;font-weight:600; }
    .cart-qty-controls { display:flex;align-items:center;gap:6px; }
    .qty-btn { background:#FFD54F;border:none;border-radius:6px;width:26px;height:26px;font-size:1rem;cursor:pointer;transition:background 0.2s; }
    .qty-btn:hover { background:#E67A00;color:#fff; }
    .qty-display { font-size:0.9rem;font-weight:700;color:#3E2300;min-width:18px;text-align:center; }
    .remove-item-btn { background:transparent;border:none;color:#c0392b;cursor:pointer;font-size:0.85rem;padding:4px; }
    .cart-footer { padding:16px 22px;border-top:1px solid rgba(230,168,0,0.2); }
    .cart-subtotal { display:flex;justify-content:space-between;font-size:0.95rem;color:#4A2B00;margin-bottom:12px; }
    .checkout-btn { display:block;text-align:center;background:linear-gradient(135deg,#E67A00,#D35400);color:#fff;padding:12px;border-radius:10px;text-decoration:none;font-weight:700;font-size:0.95rem;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 4px 14px rgba(211,84,0,0.3);margin-bottom:10px; }
    .checkout-btn:hover { transform:translateY(-2px);box-shadow:0 7px 20px rgba(211,84,0,0.4); }
    .clear-cart-btn { display:block;width:100%;background:transparent;border:1px solid #e5d8c0;border-radius:8px;padding:8px;color:#A66A00;font-size:0.82rem;cursor:pointer;transition:background 0.2s; }
    .clear-cart-btn:hover { background:#fff3e0; }

    /* Search bar */
    .search-bar-wrap { width:100%;display:flex;justify-content:center;padding:0 5% 28px; }
    .search-bar { display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #e5d8c0;border-radius:30px;padding:9px 18px;width:100%;max-width:420px;box-shadow:0 4px 14px rgba(230,122,0,0.08);transition:border-color 0.25s,box-shadow 0.25s; }
    .search-bar:focus-within { border-color:#E67A00;box-shadow:0 0 0 3px rgba(230,122,0,0.12); }
    .search-icon { font-size:1.05rem;color:#A66A00; }
    #productSearch { border:none;outline:none;flex:1;font-size:0.93rem;color:#3E2300;background:transparent;font-family:inherit; }
    .clear-search-btn { background:transparent;border:none;color:#A66A00;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;padding:2px 4px; }

    /* Wishlist button */
    .wishlist-btn { position:absolute;top:10px;right:10px;z-index:5;background:rgba(255,255,255,0.85);border:none;border-radius:50%;width:34px;height:34px;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#ccc;transition:all 0.25s;box-shadow:0 2px 8px rgba(0,0,0,0.1); }
    .wishlist-btn:hover,.wishlist-btn.wished { color:#E67A00;transform:scale(1.15); }

    /* "Added!" state */
    .add-to-cart-btn.added { background:linear-gradient(135deg,#E67A00,#D35400)!important;color:#fff!important;border-color:transparent!important; }

    /* Quick-view button (appears on image hover) */
    .quick-view-btn { position:absolute;bottom:0;left:0;right:0;background:rgba(230,122,0,0.9);color:#fff;border:none;padding:10px;font-size:0.88rem;font-weight:600;cursor:pointer;opacity:0;transition:opacity 0.25s;font-family:inherit; }
    .product-card:hover .quick-view-btn { opacity:1; }

    /* Quick View Modal */
    #quickViewModal { position:fixed;inset:0;z-index:8000;display:none;align-items:center;justify-content:center; }
    #quickViewModal.qv-open { display:flex; }
    .qv-overlay { position:absolute;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px); }
    .qv-box { position:relative;background:#FFFBF0;border-radius:20px;overflow:hidden;display:flex;max-width:680px;width:90%;max-height:90vh;box-shadow:0 25px 60px rgba(0,0,0,0.25);animation:popIn 0.4s ease; }
    @keyframes popIn { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }
    .qv-box img { width:45%;object-fit:cover;flex-shrink:0; }
    .qv-info { padding:32px 28px;display:flex;flex-direction:column;gap:12px;flex:1;overflow-y:auto; }
    .qv-info h2 { font-size:1.4rem;font-weight:700;color:#5A3A00; }
    .qv-info p { font-size:0.92rem;color:#7A4A00;line-height:1.6; }
    .qv-price { font-size:1.5rem;font-weight:800;color:#E67A00; }
    .qv-add-btn { margin-top:auto;padding:13px;background:linear-gradient(135deg,#E67A00,#D35400);color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 4px 14px rgba(211,84,0,0.3); }
    .qv-add-btn:hover { transform:translateY(-2px);box-shadow:0 7px 20px rgba(211,84,0,0.42); }
    .qv-close { position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:32px;height:32px;font-size:1rem;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;transition:background 0.2s; }
    .qv-close:hover { background:#FFD54F; }

    /* Cart badge */
    #cartBadge { position:absolute;top:-6px;right:-8px;background:#E67A00;color:#fff;font-size:0.65rem;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center; }
    #cartToggle { position:relative;display:inline-block; }
  `;
  document.head.appendChild(s);
})();
