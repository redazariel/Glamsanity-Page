/* FILE 6: admin.js */

const SUPABASE_URL = "https://dhbrmfoainutmimocqit.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_huQ5eTD3dDnbwY2nSAN0qA_XbMkhSY8";
const STORAGE_BUCKET = "glamsanity-images";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let products = [];
let bundles = [];
let containers = [];
let services = [];
let settings = {};
let policyImages = [];
let paymentImages = [];

document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  setupTheme();
  setupForms();
  setupImagePreviews();

  await loadEverything();
});

async function loadEverything() {
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
  renderServicesEditor();
  renderSettings();

  updateDashboard();
}

function setupNavigation() {
  document.querySelectorAll(".nav-button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-button")
        .forEach(b => b.classList.remove("active"));

      document.querySelectorAll(".admin-section")
        .forEach(section => section.classList.remove("active"));

      button.classList.add("active");

      const section = document.getElementById(
        button.dataset.section
      );

      section?.classList.add("active");
    });
  });
}

function setupTheme() {
  if (localStorage.getItem("glamsanity-theme") === "light") {
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

function setupForms() {
  document.getElementById("productForm")
    ?.addEventListener("submit", saveProduct);

  document.getElementById("bundleForm")
    ?.addEventListener("submit", saveBundle);

  document.getElementById("containerForm")
    ?.addEventListener("submit", saveContainer);

  document.getElementById("companyForm")
    ?.addEventListener("submit", saveCompany);

  document.getElementById("paymentForm")
    ?.addEventListener("submit", savePayment);

  document.getElementById("policyForm")
    ?.addEventListener("submit", savePolicies);

  document.getElementById("saveServices")
    ?.addEventListener("click", saveServices);

  document.getElementById("addService")
    ?.addEventListener("click", () => {
      services.push({
        name: "",
        description: "",
        image_url: "",
        sort_order: services.length
      });

      renderServicesEditor();
    });

  document.getElementById("cancelProduct")
    ?.addEventListener("click", clearProductForm);

  document.getElementById("cancelBundle")
    ?.addEventListener("click", clearBundleForm);

  document.getElementById("cancelContainer")
    ?.addEventListener("click", clearContainerForm);
}

function setupImagePreviews() {
  previewFile("productImageFile", "productImagePreview");
  previewFile("bundleImageFile", "bundleImagePreview");
  previewFile("containerImageFile", "containerImagePreview");
}

function previewFile(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

  input?.addEventListener("change", () => {
    const file = input.files?.[0];

    if (!file) {
      preview.style.display = "none";
      return;
    }

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  });
}

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  products = data || [];
}

async function loadBundles() {
  const { data, error } = await supabaseClient
    .from("bundles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  bundles = data || [];
}

async function loadContainers() {
  const { data, error } = await supabaseClient
    .from("containers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  containers = data || [];
}

async function loadServices() {
  const { data, error } = await supabaseClient
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!error) {
    services = data || [];
  }

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
  const { data, error } = await supabaseClient
    .from("glamsanity_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  settings = data || {};

  policyImages = settings.rules_policy_images || [];
  paymentImages = settings.payment_mode_images || [];
}

async function uploadImage(file, folder) {
  if (!file) return null;

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  const extension =
    file.name.split(".").pop().toLowerCase() || "jpg";

  const filename =
    `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filename);

  return data.publicUrl;
}

async function uploadMultiple(files, folder) {
  const urls = [];

  for (const file of Array.from(files || [])) {
    const url = await uploadImage(file, folder);
    if (url) urls.push(url);
  }

  return urls;
}

async function saveProduct(event) {
  event.preventDefault();

  try {
    const id = document.getElementById("productId").value;
    const file = document.getElementById("productImageFile").files[0];

    let imageUrl = id
      ? products.find(p => Number(p.id) === Number(id))?.image_url || ""
      : "";

    if (file) {
      imageUrl = await uploadImage(file, "products");
    }

    const record = {
      name: document.getElementById("productName").value.trim(),
      description: document.getElementById("productDescription").value.trim(),
      category: document.getElementById("productCategory").value.trim(),
      price: Number(document.getElementById("productPrice").value || 0),
      stock: Number(document.getElementById("productStock").value || 0),
      stock_checked_date:
        document.getElementById("productStockCheckedDate").value || null,
      image_url: imageUrl
    };

    let result;

    if (id) {
      result = await supabaseClient
        .from("products")
        .update(record)
        .eq("id", id);
    } else {
      result = await supabaseClient
        .from("products")
        .insert(record);
    }

    if (result.error) throw result.error;

    alert("Product saved.");
    clearProductForm();
    await loadProducts();
    renderProducts();
    updateDashboard();

  } catch (error) {
    alert("Error saving product: " + error.message);
  }
}

async function saveBundle(event) {
  event.preventDefault();

  try {
    const id = document.getElementById("bundleId").value;
    const existing = bundles.find(
      b => Number(b.id) === Number(id)
    );

    const file = document.getElementById("bundleImageFile").files[0];

    let imageUrl = existing?.image_url || "";

    if (file) {
      imageUrl = await uploadImage(file, "bundles");
    }

    const record = {
      name: document.getElementById("bundleName").value.trim(),
      description: document.getElementById("bundleDescription").value.trim(),
      price: Number(document.getElementById("bundlePrice").value || 0),
      stock: Number(document.getElementById("bundleStock").value || 0),
      stock_checked_date:
        document.getElementById("bundleStockCheckedDate").value || null,
      image_url: imageUrl
    };

    const result = id
      ? await supabaseClient.from("bundles").update(record).eq("id", id)
      : await supabaseClient.from("bundles").insert(record);

    if (result.error) throw result.error;

    alert("Bundle saved.");
    clearBundleForm();

    await loadBundles();
    renderBundles();
    updateDashboard();

  } catch (error) {
    alert("Error saving bundle: " + error.message);
  }
}

async function saveContainer(event) {
  event.preventDefault();

  try {
    const id = document.getElementById("containerId").value;
    const existing = containers.find(
      c => Number(c.id) === Number(id)
    );

    const file = document.getElementById("containerImageFile").files[0];

    let imageUrl = existing?.image_url || "";

    if (file) {
      imageUrl = await uploadImage(file, "containers");
    }

    const record = {
      name: document.getElementById("containerName").value.trim(),
      description: document.getElementById("containerDescription").value.trim(),
      price: Number(document.getElementById("containerPrice").value || 0),
      stock: Number(document.getElementById("containerStock").value || 0),
      stock_checked_date:
        document.getElementById("containerStockCheckedDate").value || null,
      lead_time:
        document.getElementById("containerLeadTime").value.trim(),
      image_url: imageUrl,
      source:
        document.getElementById("containerSource").value.trim()
    };

    const result = id
      ? await supabaseClient.from("containers").update(record).eq("id", id)
      : await supabaseClient.from("containers").insert(record);

    if (result.error) throw result.error;

    alert("Container saved.");
    clearContainerForm();

    await loadContainers();
    renderContainers();
    updateDashboard();

  } catch (error) {
    alert("Error saving container: " + error.message);
  }
}

function renderProducts() {
  const list = document.getElementById("adminProductsList");

  list.innerHTML = products.length
    ? products.map(item => `
      <article class="admin-item">
        <img src="${item.image_url || placeholder(item.name)}" alt="">
        <div class="admin-item-content">
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description || "")}</p>
          <p>Price: ₱${money(item.price)}</p>
          <p>Available Stock: ${Number(item.stock || 0)}</p>
          <p>
            Stock Checked:
            ${item.stock_checked_date
              ? new Date(item.stock_checked_date).toLocaleDateString()
              : "Not specified"}
          </p>

          <div class="admin-actions">
            <button class="edit-button"
              onclick="editProduct(${item.id})">Edit</button>
            <button class="delete-button"
              onclick="deleteProduct(${item.id})">Delete</button>
          </div>
        </div>
      </article>
    `).join("")
    : "<p>No products.</p>";
}

function renderBundles() {
  const list = document.getElementById("adminBundlesList");

  list.innerHTML = bundles.length
    ? bundles.map(item => `
      <article class="admin-item">
        <img src="${item.image_url || placeholder(item.name)}" alt="">
        <div class="admin-item-content">
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description || "")}</p>
          <p>Price: ₱${money(item.price)}</p>
          <p>Available Stock: ${Number(item.stock || 0)}</p>
          <p>
            Stock Checked:
            ${item.stock_checked_date
              ? new Date(item.stock_checked_date).toLocaleDateString()
              : "Not specified"}
          </p>

          <div class="admin-actions">
            <button class="edit-button"
              onclick="editBundle(${item.id})">Edit</button>
            <button class="delete-button"
              onclick="deleteBundle(${item.id})">Delete</button>
          </div>
        </div>
      </article>
    `).join("")
    : "<p>No bundles.</p>";
}

function renderContainers() {
  const list = document.getElementById("adminContainersList");

  list.innerHTML = containers.length
    ? containers.map(item => `
      <article class="admin-item">
        <img src="${item.image_url || placeholder(item.name)}" alt="">
        <div class="admin-item-content">
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description || "")}</p>
          <p>Price: ₱${money(item.price)}</p>
          <p>Available Stock: ${Number(item.stock || 0)}</p>
          <p>
            Stock Checked:
            ${item.stock_checked_date
              ? new Date(item.stock_checked_date).toLocaleDateString()
              : "Not specified"}
          </p>
          <p>
            Estimated Lead Time:
            ${escapeHtml(item.lead_time || "Not specified")}
          </p>
          <p>Source: ${escapeHtml(item.source || "Not specified")}</p>

          <div class="admin-actions">
            <button class="edit-button"
              onclick="editContainer(${item.id})">Edit</button>
            <button class="delete-button"
              onclick="deleteContainer(${item.id})">Delete</button>
          </div>
        </div>
      </article>
    `).join("")
    : "<p>No containers.</p>";
}

function renderServicesEditor() {
  const editor = document.getElementById("servicesEditor");

  editor.innerHTML = services.map((service, index) => `
    <div class="service-editor-card">
      <h3>Service ${index + 1}</h3>

      <label>
        Service Name
        <input
          class="service-name"
          data-index="${index}"
          value="${escapeAttr(service.name || "")}">
      </label>

      <label>
        Description
        <textarea class="service-description"
          data-index="${index}">${escapeHtml(service.description || "")}</textarea>
      </label>

      <label>
        Service Image
        <input
          type="file"
          class="service-image"
          data-index="${index}"
          accept="image/*">
      </label>

      ${service.image_url
        ? `<img class="service-current-image"
                src="${service.image_url}"
                style="width:180px;height:140px;object-fit:cover;">`
        : ""}

      <button
        type="button"
        class="delete-button remove-service"
        data-index="${index}">
        Remove Service
      </button>
    </div>
  `).join("");

  editor.querySelectorAll(".service-name").forEach(input => {
    input.addEventListener("input", () => {
      services[input.dataset.index].name = input.value;
    });
  });

  editor.querySelectorAll(".service-description").forEach(input => {
    input.addEventListener("input", () => {
      services[input.dataset.index].description = input.value;
    });
  });

  editor.querySelectorAll(".remove-service").forEach(button => {
    button.addEventListener("click", () => {
      services.splice(Number(button.dataset.index), 1);
      renderServicesEditor();
    });
  });
}

async function saveServices() {
  try {
    const files = document.querySelectorAll(".service-image");

    for (const input of files) {
      const index = Number(input.dataset.index);

      if (input.files[0]) {
        services[index].image_url =
          await uploadImage(input.files[0], "services");
      }
    }

    await supabaseClient
      .from("services")
      .delete()
      .neq("id", 0);

    const records = services
      .filter(s => s.name?.trim())
      .map((s, index) => ({
        name: s.name.trim(),
        description: s.description || "",
        image_url: s.image_url || "",
        sort_order: index
      }));

    if (records.length) {
      const { error } = await supabaseClient
        .from("services")
        .insert(records);

      if (error) throw error;
    }

    await saveServicesFallback();

    alert("Services saved.");
    await loadServices();
    renderServicesEditor();
    updateDashboard();

  } catch (error) {
    alert("Error saving services: " + error.message);
  }
}

async function saveServicesFallback() {
  await supabaseClient
    .from("glamsanity_settings")
    .update({
      services_offered: services.filter(s => s.name?.trim())
    })
    .eq("id", 1);
}

function renderSettings() {
  document.getElementById("companyIntroInput").value =
    settings.company_introduction || "";

  document.getElementById("companyMissionInput").value =
    settings.mission || "";

  document.getElementById("companyVisionInput").value =
    settings.vision || "";

  const payment = settings.payment_information || {};

  document.getElementById("paymentMethodsInput").value =
    payment.payment_methods || "";

  document.getElementById("paymentInstructionsInput").value =
    payment.payment_instructions || "";

  document.getElementById("downPaymentInput").value =
    payment.down_payment || "";

  document.getElementById("balanceScheduleInput").value =
    payment.balance_schedule || "";

  document.getElementById("confirmationProcedureInput").value =
    payment.confirmation_procedure || "";

  document.getElementById("paymentRemindersInput").value =
    payment.payment_reminders || "";

  renderUploadedImages(
    "policyImagePreview",
    policyImages
  );

  renderUploadedImages(
    "paymentModeImagePreview",
    paymentImages
  );
}

async function saveCompany(event) {
  event.preventDefault();

  const record = {
    company_introduction:
      document.getElementById("companyIntroInput").value.trim(),

    mission:
      document.getElementById("companyMissionInput").value.trim(),

    vision:
      document.getElementById("companyVisionInput").value.trim()
  };

  const { error } = await supabaseClient
    .from("glamsanity_settings")
    .update(record)
    .eq("id", 1);

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  Object.assign(settings, record);
  alert("Company information saved.");
}

async function savePayment(event) {
  event.preventDefault();

  try {
    const files =
      document.getElementById("paymentModeImagesInput").files;

    const newImages =
      await uploadMultiple(files, "payment");

    paymentImages = [
      ...paymentImages,
      ...newImages
    ];

    const paymentInformation = {
      payment_methods:
        document.getElementById("paymentMethodsInput").value.trim(),

      payment_instructions:
        document.getElementById("paymentInstructionsInput").value.trim(),

      down_payment:
        document.getElementById("downPaymentInput").value.trim(),

      balance_schedule:
        document.getElementById("balanceScheduleInput").value.trim(),

      confirmation_procedure:
        document.getElementById("confirmationProcedureInput").value.trim(),

      payment_reminders:
        document.getElementById("paymentRemindersInput").value.trim()
    };

    const { error } = await supabaseClient
      .from("glamsanity_settings")
      .update({
        payment_information: paymentInformation,
        payment_mode_images: paymentImages
      })
      .eq("id", 1);

    if (error) throw error;

    settings.payment_information = paymentInformation;
    settings.payment_mode_images = paymentImages;

    renderUploadedImages(
      "paymentModeImagePreview",
      paymentImages
    );

    alert("Mode of payment saved.");

  } catch (error) {
    alert("Error saving payment information: " + error.message);
  }
}

async function savePolicies(event) {
  event.preventDefault();

  try {
    const files =
      document.getElementById("policyImagesInput").files;

    const newImages =
      await uploadMultiple(files, "policies");

    policyImages = [
      ...policyImages,
      ...newImages
    ];

    const { error } = await supabaseClient
      .from("glamsanity_settings")
      .update({
        rules_policy_images: policyImages
      })
      .eq("id", 1);

    if (error) throw error;

    settings.rules_policy_images = policyImages;

    renderUploadedImages(
      "policyImagePreview",
      policyImages
    );

    alert("Rules and policies saved.");

  } catch (error) {
    alert("Error saving policies: " + error.message);
  }
}

function renderUploadedImages(elementId, images) {
  const container = document.getElementById(elementId);

  container.innerHTML = images.map((url, index) => `
    <div class="uploaded-image-wrapper">
      <img src="${url}" alt="Uploaded image">
      <button
        type="button"
        class="remove-image"
        onclick="removeUploadedImage('${elementId}', ${index})">
        ×
      </button>
    </div>
  `).join("");
}

async function removeUploadedImage(elementId, index) {
  if (elementId === "policyImagePreview") {
    policyImages.splice(index, 1);

    await supabaseClient
      .from("glamsanity_settings")
      .update({
        rules_policy_images: policyImages
      })
      .eq("id", 1);

    renderUploadedImages(elementId, policyImages);
  }

  if (elementId === "paymentModeImagePreview") {
    paymentImages.splice(index, 1);

    await supabaseClient
      .from("glamsanity_settings")
      .update({
        payment_mode_images: paymentImages
      })
      .eq("id", 1);

    renderUploadedImages(elementId, paymentImages);
  }
}

function editProduct(id) {
  const item = products.find(p => Number(p.id) === Number(id));
  if (!item) return;

  document.getElementById("productId").value = item.id;
  document.getElementById("productName").value = item.name || "";
  document.getElementById("productDescription").value = item.description || "";
  document.getElementById("productCategory").value = item.category || "";
  document.getElementById("productPrice").value = item.price || 0;
  document.getElementById("productStock").value = item.stock || 0;
  document.getElementById("productStockCheckedDate").value =
    item.stock_checked_date || "";

  if (item.image_url) {
    const preview = document.getElementById("productImagePreview");
    preview.src = item.image_url;
    preview.style.display = "block";
  }

  openSection("products");
}

function editBundle(id) {
  const item = bundles.find(b => Number(b.id) === Number(id));
  if (!item) return;

  document.getElementById("bundleId").value = item.id;
  document.getElementById("bundleName").value = item.name || "";
  document.getElementById("bundleDescription").value = item.description || "";
  document.getElementById("bundlePrice").value = item.price || 0;
  document.getElementById("bundleStock").value = item.stock || 0;
  document.getElementById("bundleStockCheckedDate").value =
    item.stock_checked_date || "";

  if (item.image_url) {
    const preview = document.getElementById("bundleImagePreview");
    preview.src = item.image_url;
    preview.style.display = "block";
  }

  openSection("bundles");
}

function editContainer(id) {
  const item = containers.find(c => Number(c.id) === Number(id));
  if (!item) return;

  document.getElementById("containerId").value = item.id;
  document.getElementById("containerName").value = item.name || "";
  document.getElementById("containerDescription").value = item.description || "";
  document.getElementById("containerPrice").value = item.price || 0;
  document.getElementById("containerStock").value = item.stock || 0;
  document.getElementById("containerStockCheckedDate").value =
    item.stock_checked_date || "";
  document.getElementById("containerLeadTime").value =
    item.lead_time || "";
  document.getElementById("containerSource").value =
    item.source || "";

  if (item.image_url) {
    const preview = document.getElementById("containerImagePreview");
    preview.src = item.image_url;
    preview.style.display = "block";
  }

  openSection("containers");
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadProducts();
  renderProducts();
  updateDashboard();
}

async function deleteBundle(id) {
  if (!confirm("Delete this bundle?")) return;

  const { error } = await supabaseClient
    .from("bundles")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadBundles();
  renderBundles();
  updateDashboard();
}

async function deleteContainer(id) {
  if (!confirm("Delete this container?")) return;

  const { error } = await supabaseClient
    .from("containers")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadContainers();
  renderContainers();
  updateDashboard();
}

function clearProductForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";

  const preview = document.getElementById("productImagePreview");
  preview.src = "";
  preview.style.display = "none";
}

function clearBundleForm() {
  document.getElementById("bundleForm").reset();
  document.getElementById("bundleId").value = "";

  const preview = document.getElementById("bundleImagePreview");
  preview.src = "";
  preview.style.display = "none";
}

function clearContainerForm() {
  document.getElementById("containerForm").reset();
  document.getElementById("containerId").value = "";

  const preview = document.getElementById("containerImagePreview");
  preview.src = "";
  preview.style.display = "none";
}

function openSection(id) {
  document.querySelectorAll(".nav-button")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.section === id
      );
    });

  document.querySelectorAll(".admin-section")
    .forEach(section => {
      section.classList.toggle(
        "active",
        section.id === id
      );
    });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function updateDashboard() {
  document.getElementById("productCount").textContent =
    products.length;

  document.getElementById("bundleCount").textContent =
    bundles.length;

  document.getElementById("containerCount").textContent =
    containers.length;

  document.getElementById("serviceCount").textContent =
    services.length;
}

function placeholder(text) {
  return `https://placehold.co/700x500/111111/D4AF37?text=${encodeURIComponent(text || "Glamsanity")}`;
}

function money(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
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
  return escapeHtml(value);
}