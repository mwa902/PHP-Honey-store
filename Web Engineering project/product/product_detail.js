const CART_KEY = "honey_cart";
const REVIEWS_KEY = "honey_reviews";

let currentProd = null;
let selectedRating = 0;

const productCatalog = {
  clove: {
    title: "Clove Infused Honey",
    price: "Rs. 500",
    priceNum: 500,
    desc: "Infused with cloves for a unique spicy-sweet flavor. Rich in natural antioxidants.",
    folder: "clove/",
    images: ["DSC00618.jpg", "DSC00665.jpg", "DSC00666.jpg", "DSC00668.jpg", "DSC00674.jpg"],
  },
  cinnamon: {
    title: "Cinnamon Infused Honey",
    price: "Rs. 500",
    priceNum: 500,
    desc: "Natural sweetener infused with cinnamon sticks. Great for flavor and natural antioxidants.",
    folder: "cinnamon/",
    images: ["DSC00631.jpg", "DSC00647.jpg", "DSC00650.jpg", "DSC00651.jpg", "DSC00654.jpg", "DSC00661.jpg"],
  },
  raw: {
    title: "Raw Honey",
    price: "Rs. 500",
    priceNum: 500,
    desc: "Pure, unfiltered raw honey straight from the hive. Retains all natural benefits.",
    folder: "raw/",
    images: ["DSC00627.jpg", "DSC00629.jpg", "DSC00683.jpg", "DSC00686.jpg"],
  },
  saffron: {
    title: "Saffron Infused Honey",
    price: "Rs. 800",
    priceNum: 800,
    desc: "Premium honey blended with strands of pure saffron for a luxurious taste.",
    folder: "saffron/",
    images: ["DSC00622.jpg", "DSC00624.jpg", "DSC00687.jpg", "DSC00693.jpg"],
  },
  shilajit: {
    title: "Shilajeet Shot",
    price: "Rs. 1000",
    priceNum: 1000,
    desc: "A powerful energy booster combining pure honey with Himalayan Shilajeet.",
    folder: "shilajeet sachet/",
    images: ["DSC00759.jpg", "DSC00761.jpg", "DSC00762.jpg", "DSC00763.jpg", "DSC00775.jpg"],
  },
  sachet: {
    title: "Classic Honey Sachets",
    price: "Rs. 250",
    priceNum: 250,
    desc: "Convenient, single-serve sachets of our pure honey. Perfect for on-the-go sweetness.",
    folder: "honey sachet/",
    images: ["DSC00766.jpg", "DSC00767.jpg", "DSC00774.jpg"],
  },
  tastingbox: {
    title: "The Honey Tasting Box",
    price: "Rs. 1800",
    priceNum: 1800,
    desc: "A beautiful box containing an assortment of our most popular honey sachets and natural infusions.",
    folder: "pack of four/",
    images: ["DSC00726.jpg", "DSC00734.jpg", "DSC00736.jpg", "DSC00739.jpg", "DSC00741.jpg", "DSC00757.jpg", "DSC00751.jpg"],
  },
};

function getProductSlug() {
  const p = new URLSearchParams(window.location.search).get("product");
  return p || "cinnamon";
}

function safeText(el, text) {
  if (el) el.textContent = text;
}

function parseStockQty(n) {
  const qty = Number(n ?? 0);
  return Number.isFinite(qty) ? qty : 0;
}

function initThumbMain() {
  const thumbContainer = document.getElementById("thumbnailContainer");
  const mainImage = document.getElementById("mainImage");
  if (!thumbContainer || !mainImage) return { thumbContainer: null, mainImage: null };
  thumbContainer.innerHTML = "";
  mainImage.src = "";
  return { thumbContainer, mainImage };
}

function setMainAndThumb(imgSrc, isActive, thumbContainer, mainImage) {
  const div = document.createElement("div");
  div.className = "thumb-item" + (isActive ? " active" : "");
  const img = document.createElement("img");
  img.src = imgSrc;
  img.onerror = function () { this.src = "../home/bee.png"; };
  div.onclick = function () {
    mainImage.src = imgSrc;
    document.querySelectorAll(".thumb-item").forEach((item) => {
      item.classList.remove("active");
      const childImg = item.querySelector("img");
      if (childImg) childImg.style.opacity = "0.55";
    });
    div.classList.add("active");
    img.style.opacity = "1";
  };
  img.style.opacity = isActive ? "1" : "0.55";
  div.appendChild(img);
  thumbContainer.appendChild(div);
  if (isActive) mainImage.src = imgSrc;
}

async function loadProduct() {
  const slug = getProductSlug();

  try {
    const response = await fetch("../php/api/products.php");
    const data = await response.json();

    if (data?.ok && Array.isArray(data.products)) {
      const product = data.products.find((p) => p.slug === slug);
      if (product) {
        const localCatalog = productCatalog[slug] || {};
        currentProd = {
          title: product.name,
          priceNum: Number(product.price ?? 0),
          price: "Rs. " + product.price,
          desc: product.description,
          image_path: product.image_path || "",
          stock_quantity: parseStockQty(product.stock_quantity),
          low_stock_threshold: Number(product.low_stock_threshold ?? 5),
          slug: product.slug,
          is_active: Number(product.is_active ?? 1) === 1,
          images: localCatalog.images || [],
          folder: localCatalog.folder || "",
        };
      }
    }
  } catch (e) {
    console.warn("API fetch failed, using local catalog:", e);
  }

  if (!currentProd) {
    const fallback = productCatalog[slug] || productCatalog["cinnamon"];
    currentProd = { ...fallback, stock_quantity: 999, is_active: true };
  }

  safeText(document.getElementById("productTitle"), currentProd.title);
  safeText(document.getElementById("productPrice"), currentProd.price);
  const productDescEl = document.getElementById("productDesc");
  if (productDescEl) productDescEl.textContent = currentProd.desc;
  document.title = currentProd.title + " \u2013 Honey Sugar Bakery";

  const stockStatus = document.getElementById("productStockStatus");
  const addBtn = document.getElementById("addToCartBtn");
  const soldOutBanner = document.getElementById("soldOutBanner");
  const inStock = currentProd.is_active && parseStockQty(currentProd.stock_quantity) > 0;
  const stockQty = parseStockQty(currentProd.stock_quantity);
  const lowThreshold = Number(currentProd.low_stock_threshold ?? 5);
  const isLow = inStock && stockQty <= lowThreshold;

  if (!inStock) {
    if (stockStatus) {
      stockStatus.innerHTML = '<span class="stock-out-label">❌ Out of Stock</span>';
      stockStatus.className = "product-stock out-of-stock";
    }
    if (addBtn) { addBtn.disabled = true; addBtn.textContent = "Out of Stock"; addBtn.classList.add("btn-out-of-stock"); }
    if (soldOutBanner) soldOutBanner.style.display = "flex";
  } else {
    if (stockStatus) {
      // Build a rich stock indicator
      var stockColor = isLow ? "#c95200" : "#1a7a2a";
      var stockBg    = isLow ? "#fff3e0" : "#e8f5e9";
      var stockIcon  = isLow ? "⚠️" : "✅";
      var stockLabel = isLow
        ? "Only " + stockQty + " left — order soon!"
        : stockQty + " units in stock";

      stockStatus.innerHTML =
        '<span class="stock-indicator" style="background:' + stockBg + ';color:' + stockColor + ';border:1px solid ' + stockColor + '33;padding:5px 14px;border-radius:20px;font-size:0.85rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">' +
          stockIcon + ' ' + stockLabel +
        '</span>';
      stockStatus.className = "product-stock " + (isLow ? "low-stock" : "in-stock");
    }
    if (addBtn) { addBtn.disabled = false; addBtn.textContent = "ADD TO CART 🍯"; addBtn.classList.remove("btn-out-of-stock"); }
    if (soldOutBanner) soldOutBanner.style.display = "none";
  }

  const { thumbContainer, mainImage } = initThumbMain();
  if (!thumbContainer || !mainImage) return;

  const localImages = Array.isArray(currentProd.images) && currentProd.images.length > 0 ? currentProd.images : null;

  if (localImages) {
    localImages.forEach((imgFile, index) => {
      const fullSrc = (currentProd.folder || "") + imgFile;
      setMainAndThumb(fullSrc, index === 0, thumbContainer, mainImage);
    });
  } else if (currentProd.image_path) {
    setMainAndThumb(currentProd.image_path, true, thumbContainer, mainImage);
  } else {
    setMainAndThumb("../home/bee.png", true, thumbContainer, mainImage);
  }

  renderReviews();
  updateRatingSummary();
}

function updateQty(change) {
  const input = document.getElementById("qtyInput");
  if (!input) return;
  let val = parseInt(input.value) + change;
  if (!Number.isFinite(val)) val = 1;
  if (val < 1) val = 1;
  if (val > 99) val = 99;
  if (currentProd && typeof currentProd.stock_quantity === "number" && currentProd.stock_quantity > 0) {
    val = Math.min(val, currentProd.stock_quantity);
  }
  input.value = val;
}

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(c) {
  localStorage.setItem(CART_KEY, JSON.stringify(c));
}

function addToCart() {
  if (!currentProd || !currentProd.is_active || parseStockQty(currentProd.stock_quantity) === 0) return;

  const qtyInput = document.getElementById("qtyInput");
  const qty = Math.max(1, Math.min(parseInt(qtyInput?.value || "1") || 1, currentProd.stock_quantity || 99));
  if (qtyInput) qtyInput.value = qty;

  const priceNum = Number(currentProd.priceNum) || 0;

  const cart = getCart();
  const existing = cart.find((i) => i.name === currentProd.title);

  if (existing) {
    existing.quantity = Math.min(currentProd.stock_quantity || 99, (existing.quantity || 1) + qty);
    existing.priceNum = priceNum;
  } else {
    cart.push({
      name: currentProd.title,
      slug: currentProd.slug || "",
      priceNum: priceNum,
      quantity: qty,
      image: "\uD83C\uDF6F",
    });
  }

  saveCart(cart);
  updateCartBadge();
  renderCartSidebar();
  document.getElementById("cartSidebar")?.classList.add("open");

  const btn = document.getElementById("addToCartBtn");
  if (btn) {
    btn.textContent = "\u2713 Added!";
    btn.style.background = "linear-gradient(135deg,#D35400,#E67A00)";
    btn.style.color = "#fff";
    setTimeout(() => {
      btn.textContent = "ADD TO CART \uD83C\uDF6F";
      btn.style.background = "";
      btn.style.color = "";
    }, 2000);
  }
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + (i.quantity || 1), 0);
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  badge.textContent = total;
  badge.style.display = total > 0 ? "flex" : "none";
}

function renderCartSidebar() {
  const container = document.getElementById("cartContent");
  if (!container) return;

  const cart = getCart();
  if (!cart.length) {
    container.innerHTML = '<p class="empty-cart-message">\uD83D\uDED2 Your cart is currently empty.</p>';
    return;
  }

  let subtotal = 0;
  const itemsHTML = cart.map((item, idx) => {
    const price = Number(item.priceNum) || 0;
    const qty = item.quantity || 1;
    subtotal += price * qty;
    return (
      '<div class="cart-item">' +
      '<span style="font-size:1.6rem;width:40px;text-align:center">' + (item.image || "\uD83C\uDF6F") + "</span>" +
      '<div style="flex:1"><div style="font-weight:600;font-size:0.87rem;color:#3E2300">' + item.name + "</div>" +
      '<div style="font-size:0.78rem;color:#E67A00;font-weight:600">Rs.' + (price * qty).toLocaleString() + "</div></div>" +
      '<div style="display:flex;align-items:center;gap:6px">' +
      '<button onclick="changeCartQty(' + idx + ',-1)" class="qty-ctrl-btn">\u2212</button>' +
      '<span style="font-weight:700;font-size:0.9rem">' + qty + "</span>" +
      '<button onclick="changeCartQty(' + idx + ',1)" class="qty-ctrl-btn">+</button></div>' +
      '<button onclick="removeCartItem(' + idx + ')" style="background:transparent;border:none;color:#c0392b;cursor:pointer;font-size:0.9rem;padding:4px">\u2715</button>' +
      "</div>"
    );
  }).join("");

  container.innerHTML =
    '<div style="display:flex;flex-direction:column;flex:1;overflow-y:auto;padding:16px 18px;gap:10px">' + itemsHTML + "</div>" +
    '<div style="padding:14px 18px;border-top:1px solid rgba(230,168,0,0.2)">' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:0.95rem;color:#4A2B00"><span>Subtotal</span><strong>Rs.' + subtotal.toLocaleString() + "</strong></div>" +
    '<a href="../Cart%20checkout/cart.html" style="display:block;text-align:center;background:linear-gradient(135deg,#E67A00,#D35400);color:#fff;padding:12px;border-radius:10px;text-decoration:none;font-weight:700;font-size:0.95rem;margin-bottom:8px">View Cart & Checkout \uD83C\uDF6F</a>' +
    '<button onclick="clearAllCart()" style="display:block;width:100%;background:transparent;border:1px solid #e5d8c0;border-radius:8px;padding:8px;color:#A66A00;font-size:0.82rem;cursor:pointer;font-family:inherit">Clear Cart</button>' +
    "</div>";
}

window.changeCartQty = function (idx, delta) {
  const cart = getCart();
  if (!cart[idx]) return;
  cart[idx].quantity = Math.max(1, (cart[idx].quantity || 1) + delta);
  saveCart(cart);
  updateCartBadge();
  renderCartSidebar();
};

window.removeCartItem = function (idx) {
  const cart = getCart();
  cart.splice(idx, 1);
  saveCart(cart);
  updateCartBadge();
  renderCartSidebar();
};

window.clearAllCart = function () {
  saveCart([]);
  updateCartBadge();
  renderCartSidebar();
};

function getReviewsForProduct(id) {
  try { return (JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {})[id] || []; }
  catch { return []; }
}

function saveReview(id, review) {
  let all = {};
  try { all = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {}; } catch {}
  if (!all[id]) all[id] = [];
  all[id].unshift(review);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
}

document.querySelectorAll(".star-pick").forEach(function (star) {
  star.addEventListener("mouseenter", function () { highlightStars(Number(star.dataset.val)); });
  star.addEventListener("mouseleave", function () { highlightStars(selectedRating); });
  star.addEventListener("click", function () {
    selectedRating = Number(star.dataset.val);
    highlightStars(selectedRating);
    const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
    document.getElementById("ratingHint").textContent = selectedRating + "/5 \u2013 " + labels[selectedRating];
  });
});

function highlightStars(count) {
  document.querySelectorAll(".star-pick").forEach(function (s) {
    s.classList.toggle("lit", Number(s.dataset.val) <= count);
  });
}

document.getElementById("reviewText").addEventListener("input", function () {
  document.getElementById("charCount").textContent = this.value.length;
});

document.getElementById("submitReviewBtn").addEventListener("click", function () {
  const name = document.getElementById("reviewName").value.trim();
  const text = document.getElementById("reviewText").value.trim();
  const successMsg = document.getElementById("reviewSuccessMsg");

  if (!name) { shake(document.getElementById("reviewName")); return; }
  if (!selectedRating) { shake(document.getElementById("starPicker")); return; }
  if (!text) { shake(document.getElementById("reviewText")); return; }

  const review = {
    name,
    rating: selectedRating,
    text,
    date: new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" }),
  };

  saveReview(getProductSlug(), review);
  renderReviews();
  updateRatingSummary();

  document.getElementById("reviewName").value = "";
  document.getElementById("reviewText").value = "";
  document.getElementById("charCount").textContent = "0";
  selectedRating = 0;
  highlightStars(0);
  document.getElementById("ratingHint").textContent = "Click a star to rate";

  if (successMsg) {
    successMsg.style.display = "block";
    setTimeout(function () { successMsg.style.display = "none"; }, 3500);
  }
});

function renderReviews() {
  const reviews = getReviewsForProduct(getProductSlug());
  const container = document.getElementById("reviewsList");

  if (!reviews.length) {
    container.innerHTML = '<p class="no-reviews-msg">No reviews yet. Be the first to share your experience! \uD83C\uDF6F</p>';
    return;
  }

  container.innerHTML = reviews.map(function (r, i) {
    return (
      '<div class="review-card" style="animation-delay:' + i * 0.07 + 's">' +
      '<div class="review-card-top">' +
      '<div class="reviewer-avatar">' + r.name.charAt(0).toUpperCase() + "</div>" +
      '<div class="reviewer-meta">' +
      '<span class="reviewer-name">' + escHtml(r.name) + "</span>" +
      '<span class="review-date">' + r.date + "</span>" +
      "</div>" +
      '<div class="review-stars">' + starsHTML(r.rating) + "</div>" +
      "</div>" +
      '<p class="review-body">' + escHtml(r.text) + "</p>" +
      "</div>"
    );
  }).join("");
}

function updateRatingSummary() {
  const reviews = getReviewsForProduct(getProductSlug());
  const count = reviews.length;
  const avg = count ? reviews.reduce(function (s, r) { return s + r.rating; }, 0) / count : 0;

  document.getElementById("bigRating").textContent = avg.toFixed(1);
  document.getElementById("totalReviewsLabel").textContent = count + " review" + (count !== 1 ? "s" : "");
  document.getElementById("summaryStars").innerHTML = starsHTML(Math.round(avg));
  document.getElementById("reviewCountDisplay").textContent = "(" + count + " review" + (count !== 1 ? "s" : "") + ")";
  document.getElementById("avgStarsDisplay").innerHTML = starsHTML(Math.round(avg));
}

function starsHTML(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += '<span class="' + (i <= rating ? "star-filled" : "star-empty") + '">\u2605</span>';
  }
  return html;
}

function escHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

function shake(el) {
  if (!el) return;
  el.style.animation = "none";
  void el.offsetHeight;
  el.style.animation = "shake 0.35s ease";
  el.classList.add("field-error");
  setTimeout(function () { el.style.animation = ""; el.classList.remove("field-error"); }, 700);
}

document.getElementById("cartToggle").onclick = function () {
  document.getElementById("cartSidebar").classList.add("open");
  renderCartSidebar();
};

document.getElementById("closeCart").onclick = function () {
  document.getElementById("cartSidebar").classList.remove("open");
};

document.getElementById("menuToggle").onclick = function () {
  document.getElementById("navCenter").classList.toggle("active");
};

document.getElementById("addToCartBtn").addEventListener("click", addToCart);

function renderRelatedProducts(currentSlug) {
  const catalog = Object.keys(productCatalog).filter((k) => k !== currentSlug);
  const picks = catalog.sort(() => Math.random() - 0.5).slice(0, 4);
  const grid = document.getElementById("relatedGrid");
  if (!grid) return;

  grid.innerHTML = picks.map(function (slug) {
    const p = productCatalog[slug];
    const imgSrc = p.folder + p.images[0];
    return (
      '<div class="related-card">' +
      '<a href="product_detail.html?product=' + slug + '" class="related-img-wrap">' +
      '<img src="' + imgSrc + '" alt="' + p.title + '" onerror="this.src=\'../home/bee.png\'" />' +
      "</a>" +
      '<div class="related-info">' +
      '<h4><a href="product_detail.html?product=' + slug + '">' + p.title + "</a></h4>" +
      '<div class="related-price">' + p.price + "</div>" +
      '<a href="product_detail.html?product=' + slug + '" class="related-btn">View Product</a>' +
      "</div>" +
      "</div>"
    );
  }).join("");
}

loadProduct()
  .then(() => {
    updateCartBadge();
    renderRelatedProducts(getProductSlug());
    renderCartSidebar();
  })
  .catch((err) => {
    console.error("Error loading product:", err);
    renderRelatedProducts(getProductSlug());
    updateCartBadge();
    renderCartSidebar();
  });
