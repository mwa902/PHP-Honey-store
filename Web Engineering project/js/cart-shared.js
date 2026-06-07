(function (global) {
  const CART_KEY = "honey_cart";

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function parsePrice(item) {
    const n = Number(item.priceNum);
    if (n > 0) return Math.round(n);
    const cleaned = String(item.price || 0).replace(/[^0-9.]/g, "");
    return Math.round(parseFloat(cleaned) || 0);
  }

  function updateCartBadge() {
    const cart = getCart();
    const total = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    const badge = document.getElementById("cartBadge");
    if (!badge) return;
    badge.textContent = total;
    badge.style.display = total > 0 ? "flex" : "none";
  }

  function renderCartSidebar(checkoutHref) {
    const container = document.querySelector(".cart-content");
    if (!container) return;

    const cart = getCart();
    if (!cart.length) {
      container.innerHTML =
        '<p class="empty-cart-message">\uD83D\uDED2 Your cart is currently empty.<br><small style="color:#8C5500;margin-top:8px;display:block">Browse products to add items.</small></p>' +
        '<a href="' + (checkoutHref || "../product/product.html") + '" class="checkout-btn" style="margin:16px">Shop Products</a>';
      return;
    }

    let subtotal = 0;
    let html = '<div class="cart-items-list">';
    cart.forEach((item, idx) => {
      const price = parsePrice(item);
      const qty = item.quantity || 1;
      subtotal += price * qty;
      html +=
        '<div class="cart-item">' +
        '<span class="cart-item-emoji">' + (item.image || "\uD83C\uDF6F") + "</span>" +
        '<div class="cart-item-info">' +
        '<span class="cart-item-name">' + item.name + "</span>" +
        '<span class="cart-item-price">Rs. ' + (price * qty).toLocaleString() + "</span>" +
        "</div>" +
        '<div class="cart-qty-controls">' +
        '<button type="button" class="qty-btn" data-qty-idx="' + idx + '" data-qty-delta="-1">\u2212</button>' +
        '<span class="qty-display">' + qty + "</span>" +
        '<button type="button" class="qty-btn" data-qty-idx="' + idx + '" data-qty-delta="1">+</button>' +
        "</div>" +
        '<button type="button" class="remove-item-btn" data-remove-idx="' + idx + '">\u2715</button>' +
        "</div>";
    });
    html += "</div>";
    html +=
      '<div class="cart-footer">' +
      '<div class="cart-subtotal"><span>Subtotal</span><strong>Rs. ' + subtotal.toLocaleString() + "</strong></div>" +
      '<a href="' + checkoutHref + '" class="checkout-btn">Proceed to Checkout \uD83C\uDF6F</a>' +
      '<button type="button" class="clear-cart-btn" id="clearCartBtn">Clear Cart</button>' +
      "</div>";
    container.innerHTML = html;

    container.querySelectorAll("[data-qty-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-qty-idx"));
        const delta = Number(btn.getAttribute("data-qty-delta"));
        const c = getCart();
        c[idx].quantity = Math.max(1, (c[idx].quantity || 1) + delta);
        saveCart(c);
        updateCartBadge();
        renderCartSidebar(checkoutHref);
      });
    });

    container.querySelectorAll("[data-remove-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const c = getCart();
        c.splice(Number(btn.getAttribute("data-remove-idx")), 1);
        saveCart(c);
        updateCartBadge();
        renderCartSidebar(checkoutHref);
      });
    });

    const clearBtn = document.getElementById("clearCartBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        saveCart([]);
        updateCartBadge();
        renderCartSidebar(checkoutHref);
      });
    }
  }

  function initCartUI(options) {
    const opts = Object.assign({ checkoutHref: "../Cart%20checkout/checkout.html" }, options || {});

    const cartToggle = document.getElementById("cartToggle");
    const closeCart = document.getElementById("closeCart");
    const cartSidebar = document.getElementById("cartSidebar");
    const menuToggle = document.getElementById("menuToggle");
    const navCenter = document.getElementById("navCenter");

    if (cartToggle && cartSidebar) {
      cartToggle.addEventListener("click", () => {
        cartSidebar.classList.add("open");
        renderCartSidebar(opts.checkoutHref);
      });
    }

    if (closeCart && cartSidebar) {
      closeCart.addEventListener("click", () => {
        cartSidebar.classList.remove("open");
      });
    }

    if (menuToggle && navCenter) {
      menuToggle.addEventListener("click", () => {
        navCenter.classList.toggle("active");
      });
    }

    updateCartBadge();
    renderCartSidebar(opts.checkoutHref);
  }

  global.HoneyCart = { CART_KEY, getCart, saveCart, parsePrice, updateCartBadge, renderCartSidebar, initCartUI };
})(window);
