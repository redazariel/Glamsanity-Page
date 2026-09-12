/* FILE 3: catalog.js */

const SUPABASE_URL = "https://dhbrmfoainutmimocqit.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_huQ5eTD3dDnbwY2nSAN0qA_XbMkhSY8";
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let products = [];
let bundles = [];
let containers = [];
let services = [];
let settings = {};
let cart = JSON.parse(localStorage.getItem("glamsanity-cart") || "[]");

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  setupTheme();
  setupCart();
  setupSearch();

  await loadAll();
});

async function loadAll() {
  await Promise.all([
    loadProducts(),
    loadBundles(),
    loadContainers(),
    loadServices(),
    loadSettings()
  ]);

  renderProducts();
  renderBundles();
  renderContainers();
  renderServices();
  renderCompany();
  renderPayment();
  updateCart();
}

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (!error) products = data || [];

  buildCategories();
}

async function loadBundles() {
  const { data, error } = await supabaseClient
    .from("bundles")
    .select("*")
    .order("created_at", { ascending: false });

  if (!error) bundles = data || [];
}

async function loadContainers() {
  const { data, error } = await supabaseClient
    .from("containers")
    .select("*")
    .order("created_at", { ascending: false });

  if (!error) containers = data || [];
}

async function loadServices() {
  const { data } = await supabaseClient
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });

  services = data || [];

  if (!services.length) {
    const { data: fallback } = await supabaseClient
      .from("glamsanity_settings")
      .select("services_offered")
      .eq("id", 1)
      .maybeSingle();

    if (fallback?.services_offered) {
      services = Array.isArray(fallback.services_offered)
        ? fallback.services_offered
        : [];
    }
  }
}

async function loadSettings() {
  const { data } = await supabaseClient
    .from("glamsanity_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  settings = data || {};
}

function buildCategories() {
  const select = document.getElementById("categoryFilter");
  if (!select) return;

  const categories = [
    ...new Set(
      products
        .map(p => p.category)
        .filter(Boolean)
    )
  ];

  select.innerHTML = `<option value="all">All Categories</option>`;

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function setupSearch() {
  const search = document.getElementById("searchInput");
  const filter = document.getElementById("categoryFilter");

  search?.addEventListener("input", renderProducts);
  filter?.addEventListener("change", renderProducts);
}

function imageOrPlaceholder(url, title) {
  return url ||
    `https://placehold.co/700x700/111111/D4AF37?text=${encodeURIComponent(title || "Glamsanity")}`;
}

function money(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  const search = (
    document.getElementById("searchInput")?.value || ""
  ).toLowerCase();

  const category =
    document.getElementById("categoryFilter")?.value || "all";

  const filtered = products.filter(product => {
    const text = `${product.name || ""} ${product.description || ""} ${product.category || ""}`.toLowerCase();

    return (
      text.includes(search) &&
      (category === "all" || product.category === category)
    );
  });

  grid.innerHTML = filtered.length
    ? filtered.map(productCard).join("")
    : `<p>No products available.</p>`;

  attachProductButtons(grid);
}

function productCard(item) {
  const stock = Number(item.stock || 0);
  const date = item.stock_checked_date
    ? new Date(item.stock_checked_date).toLocaleDateString()
    : "Not specified";

  return `
    <article class="product-card">
      <img class="product-image"
           src="${imageOrPlaceholder(item.image_url, item.name)}"
           alt="${escapeHtml(item.name || "")}"
           onclick="openImage('${escapeAttr(item.image_url || "")}','${escapeAttr(item.name || "")}')">

      <div class="product-content">
        <h3>${escapeHtml(item.name || "Unnamed Product")}</h3>
        <p class="product-description">${escapeHtml(item.description || "")}</p>

        <div class="product-meta">
          <div class="price">₱${money(item.price)}</div>
          <div class="stock">
            Available Stock: ${stock}
          </div>
          <div class="stock">
            Stock Checked: ${escapeHtml(date)}
          </div>
        </div>

        <button
          class="gold-button add-cart"
          data-type="product"
          data-id="${item.id}"
          ${stock <= 0 ? "disabled" : ""}>
          ${stock <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </article>
  `;
}

function renderBundles() {
  const grid = document.getElementById("bundlesGrid");
  if (!grid) return;

  grid.innerHTML = bundles.length
    ? bundles.map(item => `
      <article class="product-card">
        <img class="product-image"
             src="${imageOrPlaceholder(item.image_url, item.name)}"
             alt="${escapeHtml(item.name || "")}"
             onclick="openImage('${escapeAttr(item.image_url || "")}','${escapeAttr(item.name || "")}')">

        <div class="product-content">
          <h3>${escapeHtml(item.name || "Bundle")}</h3>
          <p class="product-description">${escapeHtml(item.description || "")}</p>
          <div class="product-meta">
            <div class="price">₱${money(item.price)}</div>
            <div class="stock">Available Stock: ${Number(item.stock || 0)}</div>
            <div class="stock">
              Stock Checked:
              ${item.stock_checked_date
                ? new Date(item.stock_checked_date).toLocaleDateString()
                : "Not specified"}
            </div>
          </div>
          <button
            class="gold-button add-cart"
            data-type="bundle"
            data-id="${item.id}"
            ${Number(item.stock || 0) <= 0 ? "disabled" : ""}>
            ${Number(item.stock || 0) <= 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </article>
    `).join("")
    : `<p>No bundles available.</p>`;

  attachProductButtons(grid);
}

function renderContainers() {
  const grid = document.getElementById("containersGrid");
  if (!grid) return;

  grid.innerHTML = containers.length
    ? containers.map(item => `
      <article class="product-card">
        <img class="product-image"
             src="${imageOrPlaceholder(item.image_url, item.name)}"
             alt="${escapeHtml(item.name || "")}"
             onclick="openImage('${escapeAttr(item.image_url || "")}','${escapeAttr(item.name || "")}')">

        <div class="product-content">
          <h3>${escapeHtml(item.name || "Container")}</h3>
          <p class="product-description">${escapeHtml(item.description || "")}</p>

          <div class="product-meta">
            <div class="price">₱${money(item.price)}</div>
            <div class="stock">
              Available Stock: ${Number(item.stock || 0)}
            </div>
            <div class="stock">
              Stock Checked:
              ${item.stock_checked_date
                ? new Date(item.stock_checked_date).toLocaleDateString()
                : "Not specified"}
            </div>

            <div class="lead-time">
              Estimated Lead Time:
              ${escapeHtml(item.lead_time || "Not specified")}
            </div>
          </div>

          <button
            class="gold-button add-cart"
            data-type="container"
            data-id="${item.id}">
            Add to Cart
          </button>
        </div>
      </article>
    `).join("")
    : `<p>No pre-order containers available.</p>`;

  attachProductButtons(grid);
}

function renderServices() {
  const grid = document.getElementById("servicesGrid");
  if (!grid) return;

  grid.innerHTML = services.length
    ? services.map(service => `
      <article class="service-card">
        ${service.image_url
          ? `<img src="${service.image_url}"
                  alt="${escapeHtml(service.name || "Service")}"
                  onclick="openImage('${escapeAttr(service.image_url)}','${escapeAttr(service.name || "")}')">`
          : ""}

        <div class="service-content">
          <h3>${escapeHtml(service.name || "Service")}</h3>
          <p>${escapeHtml(service.description || "")}</p>
        </div>
      </article>
    `).join("")
    : `<p>No services available.</p>`;
}

function renderCompany() {
  const intro =
    settings.company_introduction ||
    settings.company_intro ||
    "";

  const mission = settings.mission || "";
  const vision = settings.vision || "";

  document.getElementById("companyIntroduction").textContent = intro;
  document.getElementById("companyMission").textContent = mission;
  document.getElementById("companyVision").textContent = vision;

  document.getElementById("aboutIntroduction").textContent = intro;
  document.getElementById("aboutMission").textContent = mission;
  document.getElementById("aboutVision").textContent = vision;
}

function renderPayment() {
  const container = document.getElementById("paymentInformation");
  const info = settings.payment_information || {};

  const fields = [
    ["Accepted Payment Methods", info.payment_methods],
    ["Payment Instructions", info.payment_instructions],
    ["Required Down Payment", info.down_payment],
    ["Balance / Payment Schedule", info.balance_schedule],
    ["Payment Confirmation Procedure", info.confirmation_procedure],
    ["Important Payment Reminders", info.payment_reminders]
  ];

  container.innerHTML = fields
    .filter(([, value]) => value)
    .map(([title, value]) => `
      <div class="payment-item">
        <h3>${title}</h3>
        <p>${escapeHtml(value).replace(/\n/g, "<br>")}</p>
      </div>
    `)
    .join("");

  renderDocumentImages(
    "policyImagesGrid",
    settings.rules_policy_images || []
  );

  renderDocumentImages(
    "paymentImagesGrid",
    settings.payment_mode_images || []
  );
}

function renderDocumentImages(elementId, images) {
  const grid = document.getElementById(elementId);
  if (!grid) return;

  grid.innerHTML = (images || []).map((url, index) => `
    <img
      class="document-image"
      src="${url}"
      alt="Document ${index + 1}"
      onclick="openImage('${escapeAttr(url)}','Document ${index + 1}')">
  `).join("");
}

function attachProductButtons(container) {
  container.querySelectorAll(".add-cart").forEach(button => {
    button.addEventListener("click", () => {
      addToCart(
        button.dataset.type,
        Number(button.dataset.id)
      );
    });
  });
}

function getItem(type, id) {
  const list = {
    product: products,
    bundle: bundles,
    container: containers
  }[type] || [];

  return list.find(item => Number(item.id) === Number(id));
}

function addToCart(type, id) {
  const item = getItem(type, id);
  if (!item) return;

  const existing = cart.find(
    c => c.type === type && Number(c.id) === Number(id)
  );

  const stock = Number(item.stock || 0);

  if (existing) {
    if (type !== "container" && existing.quantity >= stock) {
      alert("You cannot add more than the available stock.");
      return;
    }

    existing.quantity++;
  } else {
    cart.push({
      type,
      id,
      name: item.name,
      price: Number(item.price || 0),
      image_url: item.image_url || "",
      quantity: 1
    });
  }

  saveCart();
  updateCart();
  document.getElementById("cartPanel").classList.add("open");
}

function saveCart() {
  localStorage.setItem("glamsanity-cart", JSON.stringify(cart));
}

function updateCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent = money(total);

  const container = document.getElementById("cartItems");

  if (!cart.length) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  container.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <img src="${imageOrPlaceholder(item.image_url, item.name)}" alt="">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <div>₱${money(item.price)} × ${item.quantity}</div>

        <div class="cart-controls">
          <button onclick="changeQuantity(${index}, -1)">−</button>
          <span>${item.quantity}</span>
          <button onclick="changeQuantity(${index}, 1)">+</button>
          <button onclick="removeCartItem(${index})">Remove</button>
        </div>
      </div>
    </div>
  `).join("");
}

function changeQuantity(index, amount) {
  const item = cart[index];
  if (!item) return;

  const source = getItem(item.type, item.id);

  if (amount > 0 && item.type !== "container") {
    if (item.quantity >= Number(source?.stock || 0)) {
      alert("Maximum available stock reached.");
      return;
    }
  }

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  updateCart();
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveCart();
  updateCart();
}

function setupCart() {
  document.getElementById("cartButton")
    ?.addEventListener("click", () =>
      document.getElementById("cartPanel").classList.add("open")
    );

  document.getElementById("closeCart")
    ?.addEventListener("click", () =>
      document.getElementById("cartPanel").classList.remove("open")
    );

  document.getElementById("copyOrderButton")
    ?.addEventListener("click", copyOrderSummary);

  document.getElementById("closeImageModal")
    ?.addEventListener("click", () =>
      document.getElementById("imageModal").classList.remove("open")
    );
}

async function copyOrderSummary() {
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  let text = "GLAMSANITY ORDER\n\n";

  cart.forEach((item, index) => {
    text += `${index + 1}. ${item.name}\n`;
    text += `Quantity: ${item.quantity}\n`;
    text += `Price: ₱${money(item.price)}\n`;
    text += `Subtotal: ₱${money(item.price * item.quantity)}\n\n`;
  });

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  text += `TOTAL: ₱${money(total)}\n`;

  try {
    await navigator.clipboard.writeText(text);
    alert("Order summary copied.");
  } catch {
    prompt("Copy your order summary:", text);
  }
}

function setupTheme() {
  const saved = localStorage.getItem("glamsanity-theme");

  if (saved === "light") {
    document.body.classList.add("light-theme");
  }

  document.getElementById("themeToggle")
    ?.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");

      localStorage.setItem(
        "glamsanity-theme",
        document.body.classList.contains("light-theme")
          ? "light"
          : "dark"
      );
    });
}

function openImage(url, title) {
  if (!url) return;

  document.getElementById("modalImage").src = url;
  document.getElementById("modalImage").alt = title || "";
  document.getElementById("imageModal").classList.add("open");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}