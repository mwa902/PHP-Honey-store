(function () {
  "use strict";

  HoneyCart.initCartUI({ checkoutHref: "../Cart%20checkout/cart.html" });

  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      document.querySelectorAll(".tab-panel").forEach(function (p) {
        p.classList.remove("active");
      });
      btn.classList.add("active");
      var panel = document.getElementById("tab-" + btn.dataset.tab);
      if (panel) panel.classList.add("active");
    });
  });

  function showToast(msg, duration) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function () {
      t.classList.remove("show");
    }, duration || 3000);
  }

  function statusClass(s) {
    var map = {
      pending: "status-pending",
      processing: "status-processing",
      shipped: "status-shipped",
      delivered: "status-delivered",
      cancelled: "status-cancelled",
    };
    return map[(s || "").toLowerCase()] || "status-pending";
  }

  var STEPS = [
    {
      key: "pending",
      label: "Order Placed",
      icon: "📋",
      desc: "Your order has been received.",
    },
    {
      key: "processing",
      label: "Processing",
      icon: "⚙️",
      desc: "We are preparing your order.",
    },
    {
      key: "shipped",
      label: "Shipped",
      icon: "🚚",
      desc: "Your order is on the way.",
    },
    {
      key: "delivered",
      label: "Delivered",
      icon: "✅",
      desc: "Order delivered successfully.",
    },
  ];

  function buildTimeline(currentStatus) {
    if (currentStatus === "cancelled") {
      return '<div class="tracking-timeline"><div class="timeline-step"><div class="step-dot pending">✕</div><div class="step-info"><h5>Order Cancelled</h5><p>This order was cancelled.</p></div></div></div>';
    }
    var idx = STEPS.findIndex(function (s) {
      return s.key === currentStatus;
    });
    var html = '<div class="tracking-timeline">';
    STEPS.forEach(function (step, i) {
      var cls = i < idx ? "done" : i === idx ? "active" : "pending";
      html += '<div class="timeline-step">';
      html +=
        '<div class="step-dot ' +
        cls +
        '">' +
        (cls === "done" ? "✓" : step.icon) +
        "</div>";
      html +=
        '<div class="step-info"><h5>' +
        step.label +
        "</h5><p>" +
        step.desc +
        "</p></div>";
      html += "</div>";
    });
    html += "</div>";
    return html;
  }

  var allOrders = [];

  function renderOrders(orders) {
    var list = document.getElementById("ordersList");
    var empty = document.getElementById("ordersEmpty");
    var loading = document.getElementById("ordersLoading");

    loading.style.display = "none";

    if (!orders || !orders.length) {
      empty.style.display = "block";
      list.style.display = "none";
      return;
    }

    empty.style.display = "none";
    list.style.display = "flex";

    list.innerHTML = orders
      .map(function (o) {
        var statusLower = (o.status || "pending").toLowerCase();
        return (
          '<div class="order-card">' +
          '<div class="order-card-header">' +
          "<div>" +
          '<div class="order-id">' +
          escHtml(o.order_id || "") +
          "</div>" +
          '<div class="order-date">📅 ' +
          escHtml(o.date || "") +
          "</div>" +
          "</div>" +
          '<span class="order-status ' +
          statusClass(statusLower) +
          '">' +
          escHtml(o.status || "") +
          "</span>" +
          "</div>" +
          '<div class="order-card-body">' +
          '<div class="order-product">🍯 ' +
          escHtml(o.product || "") +
          "</div>" +
          '<div class="order-meta">' +
          "<span>Amount: <strong>Rs. " +
          Number(o.amount || 0).toLocaleString() +
          "</strong></span>" +
          "<span>Address: " +
          escHtml(o.address || "—") +
          "</span>" +
          "</div>" +
          "</div>" +
          '<div class="order-card-footer">' +
          '<button class="btn-outline" onclick="viewOrder(' +
          o.order_row_id +
          ')"><i class="fa-solid fa-eye"></i> View Details</button>' +
          (statusLower !== "cancelled"
            ? '<button class="btn-outline" onclick="trackOrder(' +
              o.order_row_id +
              ')"><i class="fa-solid fa-truck"></i> Track</button>'
            : "") +
          (statusLower === "delivered"
            ? '<button class="btn-reorder" onclick="reorder(' +
              o.order_row_id +
              ')"><i class="fa-solid fa-rotate-right"></i> Reorder</button>'
            : "") +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  window.filterOrders = function () {
    var val = document.getElementById("orderStatusFilter").value;
    if (val === "all") {
      renderOrders(allOrders);
    } else {
      renderOrders(
        allOrders.filter(function (o) {
          return (o.status || "").toLowerCase() === val;
        }),
      );
    }
  };

  window.viewOrder = function (rowId) {
    var o = allOrders.find(function (x) {
      return x.order_row_id == rowId;
    });
    if (!o) return;
    var html =
      '<div class="modal-detail-row"><span>Order ID</span><span>' +
      escHtml(o.order_id || "") +
      "</span></div>" +
      '<div class="modal-detail-row"><span>Date</span><span>' +
      escHtml(o.date || "") +
      "</span></div>" +
      '<div class="modal-detail-row"><span>Product</span><span>' +
      escHtml(o.product || "") +
      "</span></div>" +
      '<div class="modal-detail-row"><span>Amount</span><span>Rs. ' +
      Number(o.amount || 0).toLocaleString() +
      "</span></div>" +
      '<div class="modal-detail-row"><span>Status</span><span class="order-status ' +
      statusClass(o.status) +
      '">' +
      escHtml(o.status || "") +
      "</span></div>" +
      '<div class="modal-detail-row"><span>Shipping Address</span><span>' +
      escHtml(o.address || "—") +
      "</span></div>";
    document.getElementById("modalBody").innerHTML = html;
    document.getElementById("orderModal").classList.add("open");
  };

  window.trackOrder = function (rowId) {
    var o = allOrders.find(function (x) {
      return x.order_row_id == rowId;
    });
    if (!o) return;
    var html =
      '<div class="modal-detail-row"><span>Order ID</span><span>' +
      escHtml(o.order_id || "") +
      "</span></div>" +
      '<div class="modal-detail-row"><span>Product</span><span>' +
      escHtml(o.product || "") +
      "</span></div>" +
      '<div class="modal-detail-row"><span>Status</span><span class="order-status ' +
      statusClass(o.status) +
      '">' +
      escHtml(o.status || "") +
      "</span></div>" +
      '<h4 style="margin:20px 0 12px;color:#3e2300">Shipment Tracking</h4>' +
      buildTimeline((o.status || "").toLowerCase()) +
      '<p style="margin-top:16px;font-size:.82rem;color:#a66a00">Estimated delivery: 2–4 business days after dispatch. For support, call (+92) 332-0241610.</p>';
    document.getElementById("modalBody").innerHTML = html;
    document.getElementById("orderModal").classList.add("open");
  };

  window.closeModal = function () {
    document.getElementById("orderModal").classList.remove("open");
  };

  window.reorder = function (rowId) {
    var o = allOrders.find(function (x) {
      return x.order_row_id == rowId;
    });
    if (!o) return;

    var cart = HoneyCart.getCart();
    var productName = o.product;
    var productPrice = Math.round(Number(o.amount) || 0);
    var existing = cart.find(function (i) {
      return i.name === productName;
    });
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        name: productName,
        price: productPrice,
        image: "🍯",
        quantity: 1,
      });
    }
    HoneyCart.saveCart(cart);
    HoneyCart.updateCartBadge();
    HoneyCart.renderCartSidebar("../Cart%20checkout/cart.html");
    document.getElementById("cartSidebar").classList.add("open");
    showToast("🍯 " + productName + " added to cart!");
  };

  function loadOrders() {
    fetch("../php/api/customer_orders.php")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data.ok) {
          allOrders = data.orders || [];
          renderOrders(allOrders);
        } else {
          document.getElementById("ordersLoading").style.display = "none";
          document.getElementById("ordersEmpty").style.display = "block";
          if (data.error === "Not logged in") {
            showToast("Please log in to view your orders.");
            setTimeout(function () {
              window.location.href = "../login.php";
            }, 2000);
          }
        }
      })
      .catch(function () {
        document.getElementById("ordersLoading").style.display = "none";
        document.getElementById("ordersEmpty").style.display = "block";
      });
  }

  function loadProfile() {
    fetch("../php/api/profile.php")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data.ok && data.customer) {
          var c = data.customer;
          document.getElementById("profUsername").value = c.username || "";
          document.getElementById("profEmail").value = c.email || "";
          document.getElementById("profPhone").value = c.phonenumber || "";
          document.getElementById("profCity").value = c.city || "";
          document.getElementById("welcomeName").textContent =
            "Welcome back, " + (c.username || "Customer") + "!";
          document.getElementById("welcomeEmail").textContent = c.email || "";
          document.getElementById("avatarCircle").textContent = (
            c.username || "U"
          )
            .charAt(0)
            .toUpperCase();
        }
      })
      .catch(function () {});
  }

  window.saveProfile = function (e) {
    e.preventDefault();
    var msg = document.getElementById("profileMsg");
    var payload = {
      username: document.getElementById("profUsername").value.trim(),
      email: document.getElementById("profEmail").value.trim(),
      phonenumber: document.getElementById("profPhone").value.trim(),
      city: document.getElementById("profCity").value.trim(),
    };

    fetch("../php/api/profile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        msg.style.display = "block";
        if (data.ok) {
          msg.className = "form-msg success";
          msg.textContent = "✅ Profile updated successfully!";
          loadProfile();
        } else {
          msg.className = "form-msg error";
          msg.textContent = "❌ " + (data.error || "Update failed.");
        }
        setTimeout(function () {
          msg.style.display = "none";
        }, 4000);
      })
      .catch(function () {
        msg.style.display = "block";
        msg.className = "form-msg error";
        msg.textContent = "❌ Network error. Please try again.";
      });
  };

  window.changePassword = function (e) {
    e.preventDefault();
    var msg = document.getElementById("passwordMsg");
    var newPwd = document.getElementById("newPwd").value;
    var confirmPwd = document.getElementById("confirmPwd").value;

    if (newPwd !== confirmPwd) {
      msg.style.display = "block";
      msg.className = "form-msg error";
      msg.textContent = "❌ New passwords do not match.";
      return;
    }

    var payload = {
      current_password: document.getElementById("currentPwd").value,
      new_password: newPwd,
    };

    fetch("../php/api/profile.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        Object.assign({ action: "change_password" }, payload),
      ),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        msg.style.display = "block";
        if (data.ok) {
          msg.className = "form-msg success";
          msg.textContent = "✅ Password updated successfully!";
          document.getElementById("passwordForm").reset();
        } else {
          msg.className = "form-msg error";
          msg.textContent = "❌ " + (data.error || "Update failed.");
        }
        setTimeout(function () {
          msg.style.display = "none";
        }, 4000);
      })
      .catch(function () {
        msg.style.display = "block";
        msg.className = "form-msg error";
        msg.textContent = "❌ Network error. Please try again.";
      });
  };

  window.togglePwd = function (inputId, btn) {
    var input = document.getElementById(inputId);
    var icon = btn.querySelector("i");
    if (input.type === "password") {
      input.type = "text";
      icon.className = "fa-solid fa-eye-slash";
    } else {
      input.type = "password";
      icon.className = "fa-solid fa-eye";
    }
  };

  function escHtml(str) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
  }

  loadOrders();
  loadProfile();
})();
