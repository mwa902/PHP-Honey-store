document.addEventListener("DOMContentLoaded", () => {
  const checkoutForm = document.querySelector("#checkout-form");
  const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
  const proofContainer = document.querySelector("#payment-proof-container");
  const proofInput = document.querySelector("#payment-proof");
  const proofHint = document.querySelector("#payment-proof-hint");
  const successPage = document.querySelector("#success-page");
  const checkoutPage = document.querySelector("#checkout-page");
  const homeButtons = document.querySelectorAll(".go-home");

  function updateProofUI() {
    const selected = document.querySelector('input[name="payment-method"]:checked');
    const needsProof = selected && ["online-transfer", "jazzcash", "easypaisa"].includes(selected.value);
    proofContainer.style.display = needsProof ? "block" : "none";
    proofInput.required = needsProof;
    proofHint.textContent = needsProof
      ? "Choose a file or paste a screenshot/image of your payment receipt."
      : "";
  }

  paymentRadios.forEach((radio) => radio.addEventListener("change", updateProofUI));
  updateProofUI();

  if (proofInput) {
    proofInput.addEventListener("paste", (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image")) {
          const file = item.getAsFile();
          const dt = new DataTransfer();
          dt.items.add(file);
          proofInput.files = dt.files;
          proofHint.textContent = "Image pasted successfully.";
          event.preventDefault();
          break;
        }
      }
    });
  }

  checkoutForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(checkoutForm);
    const requiredFields = ["name", "email", "address", "payment-method"];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        alert("Please fill in all required checkout fields.");
        return;
      }
    }

    const paymentMethod = formData.get("payment-method");
    if (
      ["online-transfer", "jazzcash", "easypaisa"].includes(paymentMethod) &&
      proofInput &&
      proofInput.files.length === 0
    ) {
      alert("Please upload or paste your payment proof before checkout.");
      return;
    }

    checkoutPage.style.display = "none";
    successPage.style.display = "block";
    successPage.querySelector(".success-message")?.textContent = "Order placed successfully!";
  });

  homeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      alert("OK");
      window.location.href = "index.html";
    });
  });
});
