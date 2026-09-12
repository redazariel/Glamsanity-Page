/* FILE 6: admin.js */

/* =========================================================
   GLAMSANITY ADMIN DASHBOARD
   NO LOGIN
   SUPABASE + IMAGE UPLOAD + CRUD
   ========================================================= */

const SUPABASE_URL =
    "https://dhbrmfoainutmimocqit.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_huQ5eTD3dDnbwY2nSAN0qA_XbMkhSY8";

const STORAGE_BUCKET =
    "glamsanity-images";

const MAX_IMAGE_SIZE =
    10 * 1024 * 1024;

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


let products = [];
let bundles = [];
let containers = [];
let currentServices = [];


document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupNavigation();
        setupTheme();
        setupForms();
        setupImageInputs();

        loadEverything();

    }
);


/* =========================================================
   INITIAL LOAD
   ========================================================= */

async function loadEverything() {

    await Promise.all([
        loadProducts(),
        loadBundles(),
        loadContainers(),
        loadServices(),
        loadCompanySettings(),
        loadPaymentInformation()
    ]);

    updateDashboardCounts();

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-button"
        );

    const sections =
        document.querySelectorAll(
            ".admin-section"
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const sectionId =
                    button.dataset.section;

                if (!sectionId) return;

                buttons.forEach(btn =>
                    btn.classList.remove(
                        "active"
                    )
                );

                button.classList.add(
                    "active"
                );

                sections.forEach(section =>
                    section.classList.remove(
                        "active"
                    )
                );

                const section =
                    document.getElementById(
                        sectionId
                    );

                if (section) {
                    section.classList.add(
                        "active"
                    );
                }

                const title =
                    document.getElementById(
                        "pageTitle"
                    );

                const titles = {
                    dashboard: "Dashboard",
                    products: "Products",
                    bundles: "Bundles",
                    containers: "Containers",
                    services: "Services Offered",
                    settings: "Company Information",
                    payment: "Payment Information"
                };

                if (title) {
                    title.textContent =
                        titles[sectionId] ||
                        "Glamsanity";
                }

            }
        );

    });

}


/* =========================================================
   THEME
   ========================================================= */

function setupTheme() {

    const button =
        document.getElementById(
            "themeToggle"
        );

    let saved = "dark";

    try {
        saved =
            localStorage.getItem(
                "glamsanity-theme"
            ) || "dark";
    } catch {}

    if (saved === "light") {
        document.body.classList.add(
            "light-theme"
        );
    }

    updateThemeButton();

    if (!button) return;

    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light-theme"
            );

            const light =
                document.body.classList.contains(
                    "light-theme"
                );

            try {
                localStorage.setItem(
                    "glamsanity-theme",
                    light
                        ? "light"
                        : "dark"
                );
            } catch {}

            updateThemeButton();

        }
    );

}


function updateThemeButton() {

    const button =
        document.getElementById(
            "themeToggle"
        );

    if (!button) return;

    button.textContent =
        document.body.classList.contains(
            "light-theme"
        )
            ? "☀ Dark Mode"
            : "☾ Light Mode";

}


/* =========================================================
   FORMS
   ========================================================= */

function setupForms() {

    const productForm =
        document.getElementById(
            "productForm"
        );

    const bundleForm =
        document.getElementById(
            "bundleForm"
        );

    const containerForm =
        document.getElementById(
            "containerForm"
        );

    const companyForm =
        document.getElementById(
            "companyForm"
        );

    const paymentForm =
        document.getElementById(
            "paymentForm"
        );

    if (productForm) {
        productForm.addEventListener(
            "submit",
            saveProduct
        );
    }

    if (bundleForm) {
        bundleForm.addEventListener(
            "submit",
            saveBundle
        );
    }

    if (containerForm) {
        containerForm.addEventListener(
            "submit",
            saveContainer
        );
    }

    if (companyForm) {
        companyForm.addEventListener(
            "submit",
            saveCompanySettings
        );
    }

    if (paymentForm) {
        paymentForm.addEventListener(
            "submit",
            savePaymentInformation
        );
    }

    bindClick(
        "cancelProduct",
        clearProductForm
    );

    bindClick(
        "cancelBundle",
        clearBundleForm
    );

    bindClick(
        "cancelContainer",
        clearContainerForm
    );

    bindClick(
        "saveServices",
        saveServices
    );

}


/* =========================================================
   IMAGE INPUTS
   ========================================================= */

function setupImageInputs() {

    setupImagePreview(
        "productImageFile",
        "productImagePreview"
    );

    setupImagePreview(
        "bundleImageFile",
        "bundleImagePreview"
    );

    setupImagePreview(
        "containerImageFile",
        "containerImagePreview"
    );

}


function setupImagePreview(
    inputId,
    previewId
) {

    const input =
        document.getElementById(
            inputId
        );

    const preview =
        document.getElementById(
            previewId
        );

    if (!input || !preview) return;

    input.addEventListener(
        "change",
        () => {

            const file =
                input.files?.[0];

            if (!file) return;

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                showToast(
                    "Please select a valid image.",
                    "error"
                );

                input.value = "";

                return;
            }

            if (
                file.size >
                MAX_IMAGE_SIZE
            ) {

                showToast(
                    "Image must be 10 MB or smaller.",
                    "error"
                );

                input.value = "";

                return;
            }

            const reader =
                new FileReader();

            reader.onload =
                event => {

                    preview.src =
                        event.target.result;

                    preview.classList.remove(
                        "hidden"
                    );

                };

            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   STORAGE
   ========================================================= */

async function uploadImage(
    file,
    folder
) {

    if (!file) return null;

    if (!file.type.startsWith("image/")) {
        throw new Error(
            "Selected file is not an image."
        );
    }

    if (file.size > MAX_IMAGE_SIZE) {
        throw new Error(
            "Image must be 10 MB or smaller."
        );
    }

    const extension =
        getExtension(file.name);

    const base =
        file.name
            .replace(/\.[^/.]+$/, "")
            .replace(
                /[^a-zA-Z0-9-_]/g,
                "-"
            )
            .toLowerCase() ||
        "image";

    const fileName =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2,9)}-${base}.${extension}`;

    const path =
        `${folder}/${fileName}`;

    const result =
        await supabaseClient.storage
            .from(STORAGE_BUCKET)
            .upload(
                path,
                file,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type
                }
            );

    if (result.error) {
        throw new Error(
            result.error.message
        );
    }

    const publicResult =
        supabaseClient.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(path);

    return publicResult.data.publicUrl;

}


function getExtension(name) {

    const extension =
        String(name)
            .split(".")
            .pop()
            .toLowerCase();

    const allowed = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif"
    ];

    return allowed.includes(
        extension
    )
        ? extension
        : "jpg";

}


/* =========================================================
   PRODUCTS
   ========================================================= */

async function loadProducts() {

    const result =
        await supabaseClient
            .from("products")
            .select("*")
            .order(
                "id",
                {
                    ascending: false
                }
            );

    if (result.error) {

        console.error(
            "Products:",
            result.error
        );

        products = [];

        showToast(
            `Products error: ${result.error.message}`,
            "error"
        );

    } else {

        products =
            result.data || [];

    }

    renderProducts();

}


function renderProducts() {

    const list =
        document.getElementById(
            "adminProductsList"
        );

    if (!list) return;

    if (!products.length) {

        list.innerHTML = `
            <div class="loading">
                No products available.
            </div>
        `;

        return;
    }

    list.innerHTML =
        products
            .map(item =>
                createAdminCard(
                    item,
                    "product"
                )
            )
            .join("");

}


async function saveProduct(event) {

    event?.preventDefault();

    const name =
        value("productName").trim();

    if (!name) {

        showToast(
            "Please enter a product name.",
            "error"
        );

        return;
    }

    const id =
        value("productId");

    const existing =
        findById(products, id);

    let image =
        existing?.image_url ||
        existing?.image ||
        "";

    try {

        const file =
            document.getElementById(
                "productImageFile"
            )?.files?.[0];

        if (file) {

            showToast(
                "Uploading product image..."
            );

            image =
                await uploadImage(
                    file,
                    "products"
                );

        }

        const payload = {
            name,
            description:
                value("productDescription").trim(),
            category:
                value("productCategory").trim(),
            price:
                number("productPrice"),
            stock:
                integer("productStock"),
            image_url:
                image || null
        };

        let result;

        if (id) {

            result =
                await supabaseClient
                    .from("products")
                    .update(payload)
                    .eq("id", id);

        } else {

            result =
                await supabaseClient
                    .from("products")
                    .insert(payload);

        }

        if (result.error) {
            throw result.error;
        }

        showToast(
            id
                ? "Product updated successfully."
                : "Product added successfully."
        );

        clearProductForm();

        await loadProducts();

        updateDashboardCounts();

    } catch (error) {

        console.error(error);

        showToast(
            `Could not save product: ${error.message}`,
            "error"
        );

    }

}


function editProduct(id) {

    const item =
        findById(products, id);

    if (!item) return;

    setValue("productId", item.id);
    setValue("productName", item.name);
    setValue("productDescription", item.description);
    setValue("productCategory", item.category);
    setValue("productPrice", item.price);
    setValue("productStock", item.stock);

    showPreview(
        "productImagePreview",
        item.image_url || item.image
    );

    clearFile(
        "productImageFile"
    );

    switchSection("products");

}


async function deleteProduct(id) {

    const item =
        findById(products, id);

    if (!item) return;

    if (
        !confirm(
            `Delete "${item.name}"?`
        )
    ) {
        return;
    }

    const result =
        await supabaseClient
            .from("products")
            .delete()
            .eq("id", id);

    if (result.error) {

        showToast(
            `Could not delete product: ${result.error.message}`,
            "error"
        );

        return;
    }

    showToast(
        "Product deleted successfully."
    );

    await loadProducts();

    updateDashboardCounts();

}


function clearProductForm() {

    document
        .getElementById("productForm")
        ?.reset();

    setValue(
        "productId",
        ""
    );

    hidePreview(
        "productImagePreview"
    );

    clearFile(
        "productImageFile"
    );

}


/* =========================================================
   BUNDLES
   ========================================================= */

async function loadBundles() {

    const result =
        await supabaseClient
            .from("bundles")
            .select("*")
            .order(
                "id",
                {
                    ascending: false
                }
            );

    if (result.error) {

        bundles = [];

        showToast(
            `Bundles error: ${result.error.message}`,
            "error"
        );

    } else {

        bundles =
            result.data || [];

    }

    renderBundles();

}


function renderBundles() {

    const list =
        document.getElementById(
            "adminBundlesList"
        );

    if (!list) return;

    if (!bundles.length) {

        list.innerHTML = `
            <div class="loading">
                No bundles available.
            </div>
        `;

        return;
    }

    list.innerHTML =
        bundles
            .map(item =>
                createAdminCard(
                    item,
                    "bundle"
                )
            )
            .join("");

}


async function saveBundle(event) {

    event?.preventDefault();

    const name =
        value("bundleName").trim();

    if (!name) {

        showToast(
            "Please enter a bundle name.",
            "error"
        );

        return;
    }

    const id =
        value("bundleId");

    const existing =
        findById(bundles, id);

    let image =
        existing?.image_url ||
        existing?.image ||
        "";

    try {

        const file =
            document.getElementById(
                "bundleImageFile"
            )?.files?.[0];

        if (file) {

            showToast(
                "Uploading bundle image..."
            );

            image =
                await uploadImage(
                    file,
                    "bundles"
                );

        }

        const payload = {
            name,
            description:
                value("bundleDescription").trim(),
            price:
                number("bundlePrice"),
            stock:
                integer("bundleStock"),
            image_url:
                image || null
        };

        let result;

        if (id) {

            result =
                await supabaseClient
                    .from("bundles")
                    .update(payload)
                    .eq("id", id);

        } else {

            result =
                await supabaseClient
                    .from("bundles")
                    .insert(payload);

        }

        if (result.error) {
            throw result.error;
        }

        showToast(
            id
                ? "Bundle updated successfully."
                : "Bundle added successfully."
        );

        clearBundleForm();

        await loadBundles();

        updateDashboardCounts();

    } catch (error) {

        showToast(
            `Could not save bundle: ${error.message}`,
            "error"
        );

    }

}


function editBundle(id) {

    const item =
        findById(bundles, id);

    if (!item) return;

    setValue("bundleId", item.id);
    setValue("bundleName", item.name);
    setValue("bundleDescription", item.description);
    setValue("bundlePrice", item.price);
    setValue("bundleStock", item.stock);

    showPreview(
        "bundleImagePreview",
        item.image_url || item.image
    );

    clearFile(
        "bundleImageFile"
    );

    switchSection("bundles");

}


async function deleteBundle(id) {

    const item =
        findById(bundles, id);

    if (!item) return;

    if (
        !confirm(
            `Delete "${item.name}"?`
        )
    ) {
        return;
    }

    const result =
        await supabaseClient
            .from("bundles")
            .delete()
            .eq("id", id);

    if (result.error) {

        showToast(
            `Could not delete bundle: ${result.error.message}`,
            "error"
        );

        return;
    }

    showToast(
        "Bundle deleted successfully."
    );

    await loadBundles();

    updateDashboardCounts();

}


function clearBundleForm() {

    document
        .getElementById("bundleForm")
        ?.reset();

    setValue(
        "bundleId",
        ""
    );

    hidePreview(
        "bundleImagePreview"
    );

    clearFile(
        "bundleImageFile"
    );

}


/* =========================================================
   CONTAINERS
   ========================================================= */

async function loadContainers() {

    const result =
        await supabaseClient
            .from("containers")
            .select("*")
            .order(
                "id",
                {
                    ascending: false
                }
            );

    if (result.error) {

        containers = [];

        showToast(
            `Containers error: ${result.error.message}`,
            "error"
        );

    } else {

        containers =
            result.data || [];

    }

    renderContainers();

}


function renderContainers() {

    const list =
        document.getElementById(
            "adminContainersList"
        );

    if (!list) return;

    if (!containers.length) {

        list.innerHTML = `
            <div class="loading">
                No containers available.
            </div>
        `;

        return;
    }

    list.innerHTML =
        containers
            .map(item =>
                createAdminCard(
                    item,
                    "container"
                )
            )
            .join("");

}


async function saveContainer(event) {

    event?.preventDefault();

    const name =
        value("containerName").trim();

    if (!name) {

        showToast(
            "Please enter a container name.",
            "error"
        );

        return;
    }

    const id =
        value("containerId");

    const existing =
        findById(containers, id);

    let image =
        existing?.image_url ||
        existing?.image ||
        "";

    try {

        const file =
            document.getElementById(
                "containerImageFile"
            )?.files?.[0];

        if (file) {

            showToast(
                "Uploading container image..."
            );

            image =
                await uploadImage(
                    file,
                    "containers"
                );

        }

        const payload = {
            name,
            description:
                value("containerDescription").trim(),
            price:
                number("containerPrice"),
            stock:
                integer("containerStock"),
            source:
                value("containerSource").trim(),
            image_url:
                image || null
        };

        let result;

        if (id) {

            result =
                await supabaseClient
                    .from("containers")
                    .update(payload)
                    .eq("id", id);

        } else {

            result =
                await supabaseClient
                    .from("containers")
                    .insert(payload);

        }

        if (result.error) {
            throw result.error;
        }

        showToast(
            id
                ? "Container updated successfully."
                : "Container added successfully."
        );

        clearContainerForm();

        await loadContainers();

        updateDashboardCounts();

    } catch (error) {

        showToast(
            `Could not save container: ${error.message}`,
            "error"
        );

    }

}


function editContainer(id) {

    const item =
        findById(containers, id);

    if (!item) return;

    setValue("containerId", item.id);
    setValue("containerName", item.name);
    setValue("containerDescription", item.description);
    setValue("containerPrice", item.price);
    setValue("containerStock", item.stock);
    setValue("containerSource", item.source);

    showPreview(
        "containerImagePreview",
        item.image_url || item.image
    );

    clearFile(
        "containerImageFile"
    );

    switchSection("containers");

}


async function deleteContainer(id) {

    const item =
        findById(containers, id);

    if (!item) return;

    if (
        !confirm(
            `Delete "${item.name}"?`
        )
    ) {
        return;
    }

    const result =
        await supabaseClient
            .from("containers")
            .delete()
            .eq("id", id);

    if (result.error) {

        showToast(
            `Could not delete container: ${result.error.message}`,
            "error"
        );

        return;
    }

    showToast(
        "Container deleted successfully."
    );

    await loadContainers();

    updateDashboardCounts();

}


function clearContainerForm() {

    document
        .getElementById("containerForm")
        ?.reset();

    setValue(
        "containerId",
        ""
    );

    hidePreview(
        "containerImagePreview"
    );

    clearFile(
        "containerImageFile"
    );

}


/* =========================================================
   ADMIN CARD
   ========================================================= */

function createAdminCard(
    item,
    type
) {

    const name =
        item.name ||
        "Unnamed Item";

    const description =
        item.description ||
        "No description provided.";

    const image =
        item.image_url ||
        item.image ||
        "";

    const price =
        Number(item.price || 0);

    const stock =
        Number(item.stock || 0);

    return `
        <div class="admin-item">

            <div class="admin-item-image">

                ${
                    image
                        ? `
                            <img
                                src="${escapeAttribute(image)}"
                                alt="${escapeAttribute(name)}"
                                loading="lazy"
                            >
                          `
                        : `
                            <div class="admin-placeholder">
                                GLAMSANITY
                            </div>
                          `
                }

            </div>

            <div class="admin-item-content">

                <h3>
                    ${escapeHtml(name)}
                </h3>

                <p>
                    ${escapeHtml(description)}
                </p>

                <p>
                    ₱${formatPrice(price)}
                    &nbsp; • &nbsp;
                    Stock: ${stock}
                </p>

                ${
                    type === "container"
                        ? `
                            <p>
                                <strong>Source:</strong>
                                ${escapeHtml(
                                    item.source ||
                                    "Not specified"
                                )}
                            </p>
                          `
                        : ""
                }

                <div class="admin-actions">

                    <button
                        type="button"
                        class="edit-button"
                        data-action="edit"
                        data-type="${type}"
                        data-id="${item.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-button"
                        data-action="delete"
                        data-type="${type}"
                        data-id="${item.id}"
                    >
                        Delete
                    </button>

                </div>

            </div>

        </div>
    `;

}


document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );

        if (!button) return;

        const action =
            button.dataset.action;

        const type =
            button.dataset.type;

        const id =
            button.dataset.id;

        if (action === "edit") {

            if (type === "product") {
                editProduct(id);
            }

            if (type === "bundle") {
                editBundle(id);
            }

            if (type === "container") {
                editContainer(id);
            }

        }

        if (action === "delete") {

            if (type === "product") {
                deleteProduct(id);
            }

            if (type === "bundle") {
                deleteBundle(id);
            }

            if (type === "container") {
                deleteContainer(id);
            }

        }

    }
);


/* =========================================================
   SERVICES
   ========================================================= */

async function loadServices() {

    const result =
        await supabaseClient
            .from("glamsanity_settings")
            .select("services_offered")
            .eq("id", 1)
            .maybeSingle();

    if (result.error) {

        currentServices = [];

        showToast(
            `Services error: ${result.error.message}`,
            "error"
        );

    } else {

        currentServices =
            Array.isArray(
                result.data?.services_offered
            )
                ? result.data.services_offered
                : [];

    }

    renderServiceEditor();

}


function renderServiceEditor() {

    const editor =
        document.getElementById(
            "servicesEditor"
        );

    if (!editor) return;

    const count =
        Math.max(
            currentServices.length,
            6
        );

    const services = [];

    for (let i = 0; i < count; i++) {

        services.push(
            currentServices[i] || {
                name: "",
                description: "",
                image: ""
            }
        );

    }

    editor.innerHTML =
        services
            .map(
                (service, index) =>
                    serviceEditor(
                        service,
                        index
                    )
            )
            .join("");

    setupServiceImageInputs();

}


function serviceEditor(
    service,
    index
) {

    const image =
        service.image || "";

    return `
        <div
            class="service-editor-card"
            data-service-index="${index}"
        >

            <h3>
                Service ${String(index + 1).padStart(2, "0")}
            </h3>

            <label>
                Service Name

                <input
                    type="text"
                    class="service-name"
                    value="${escapeAttribute(
                        service.name || ""
                    )}"
                    placeholder="Service name"
                >
            </label>

            <label>
                Description

                <textarea
                    class="service-description"
                    rows="4"
                    placeholder="Service description"
                >${escapeHtml(
                    service.description || ""
                )}</textarea>
            </label>

            <label>
                Service Image

                <input
                    type="file"
                    class="service-image-file"
                    data-index="${index}"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                >
            </label>

            <div
                class="service-image-preview"
                id="servicePreview${index}"
            >

                ${
                    image
                        ? `
                            <img
                                src="${escapeAttribute(image)}"
                                alt="Service image"
                            >
                          `
                        : `
                            <span class="admin-placeholder">
                                GLAMSANITY
                            </span>
                          `
                }

            </div>

        </div>
    `;

}


function setupServiceImageInputs() {

    document
        .querySelectorAll(
            ".service-image-file"
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    const file =
                        input.files?.[0];

                    if (!file) return;

                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        input.value = "";

                        showToast(
                            "Please select a valid image.",
                            "error"
                        );

                        return;
                    }

                    if (
                        file.size >
                        MAX_IMAGE_SIZE
                    ) {

                        input.value = "";

                        showToast(
                            "Image must be 10 MB or smaller.",
                            "error"
                        );

                        return;
                    }

                    const preview =
                        document.getElementById(
                            `servicePreview${input.dataset.index}`
                        );

                    const reader =
                        new FileReader();

                    reader.onload =
                        event => {

                            preview.innerHTML = `
                                <img
                                    src="${escapeAttribute(
                                        event.target.result
                                    )}"
                                    alt="Service preview"
                                >
                            `;

                        };

                    reader.readAsDataURL(file);

                }
            );

        });

}


async function saveServices(event) {

    event?.preventDefault();

    const cards =
        document.querySelectorAll(
            ".service-editor-card"
        );

    const services = [];

    try {

        for (
            let index = 0;
            index < cards.length;
            index++
        ) {

            const card =
                cards[index];

            const name =
                card
                    .querySelector(
                        ".service-name"
                    )
                    ?.value
                    .trim() || "";

            const description =
                card
                    .querySelector(
                        ".service-description"
                    )
                    ?.value
                    .trim() || "";

            const file =
                card
                    .querySelector(
                        ".service-image-file"
                    )
                    ?.files?.[0];

            let image =
                currentServices[index]
                    ?.image || "";

            if (file) {

                showToast(
                    `Uploading Service ${index + 1}...`
                );

                image =
                    await uploadImage(
                        file,
                        "services"
                    );

            }

            if (
                name ||
                description ||
                image
            ) {

                services.push({
                    name,
                    description,
                    image
                });

            }

        }

        const result =
            await upsertSettings({
                services_offered:
                    services
            });

        if (result.error) {
            throw result.error;
        }

        currentServices =
            services;

        renderServiceEditor();

        showToast(
            "Services saved successfully."
        );

        updateDashboardCounts();

    } catch (error) {

        showToast(
            `Could not save services: ${error.message}`,
            "error"
        );

    }

}


/* =========================================================
   COMPANY INFORMATION
   ========================================================= */

async function loadCompanySettings() {

    const result =
        await supabaseClient
            .from("glamsanity_settings")
            .select(
                "company_intro,company_mission,company_vision"
            )
            .eq("id", 1)
            .maybeSingle();

    if (result.error) {

        showToast(
            `Company settings error: ${result.error.message}`,
            "error"
        );

        return;
    }

    setValue(
        "companyIntroInput",
        result.data?.company_intro || ""
    );

    setValue(
        "companyMissionInput",
        result.data?.company_mission || ""
    );

    setValue(
        "companyVisionInput",
        result.data?.company_vision || ""
    );

}


async function saveCompanySettings(event) {

    event?.preventDefault();

    try {

        const result =
            await upsertSettings({
                company_intro:
                    value("companyIntroInput").trim(),

                company_mission:
                    value("companyMissionInput").trim(),

                company_vision:
                    value("companyVisionInput").trim()
            });

        if (result.error) {
            throw result.error;
        }

        showToast(
            "Company information saved successfully."
        );

    } catch (error) {

        showToast(
            `Could not save company information: ${error.message}`,
            "error"
        );

    }

}


/* =========================================================
   PAYMENT INFORMATION
   ========================================================= */

async function loadPaymentInformation() {

    const result =
        await supabaseClient
            .from("glamsanity_settings")
            .select("payment_information")
            .eq("id", 1)
            .maybeSingle();

    if (result.error) {

        showToast(
            `Payment settings error: ${result.error.message}`,
            "error"
        );

        return;
    }

    const payment =
        result.data?.payment_information || {};

    setValue(
        "paymentMethodsInput",
        payment.methods || ""
    );

    setValue(
        "paymentInstructionsInput",
        payment.instructions || ""
    );

    setValue(
        "paymentDownPaymentInput",
        payment.down_payment || ""
    );

    setValue(
        "paymentScheduleInput",
        payment.schedule || ""
    );

    setValue(
        "paymentConfirmationInput",
        payment.confirmation || ""
    );

    setValue(
        "paymentRemindersInput",
        payment.reminders || ""
    );

}


async function savePaymentInformation(event) {

    event?.preventDefault();

    const payment = {

        methods:
            value(
                "paymentMethodsInput"
            ).trim(),

        instructions:
            value(
                "paymentInstructionsInput"
            ).trim(),

        down_payment:
            value(
                "paymentDownPaymentInput"
            ).trim(),

        schedule:
            value(
                "paymentScheduleInput"
            ).trim(),

        confirmation:
            value(
                "paymentConfirmationInput"
            ).trim(),

        reminders:
            value(
                "paymentRemindersInput"
            ).trim()

    };

    try {

        const result =
            await upsertSettings({
                payment_information:
                    payment
            });

        if (result.error) {
            throw result.error;
        }

        showToast(
            "Payment information saved successfully."
        );

    } catch (error) {

        showToast(
            `Could not save payment information: ${error.message}`,
            "error"
        );

    }

}


/* =========================================================
   SETTINGS UPSERT
   ========================================================= */

async function upsertSettings(fields) {

    const existing =
        await supabaseClient
            .from("glamsanity_settings")
            .select("id")
            .eq("id", 1)
            .maybeSingle();

    if (existing.error) {
        return {
            error: existing.error
        };
    }

    if (existing.data) {

        return await supabaseClient
            .from("glamsanity_settings")
            .update(fields)
            .eq("id", 1);

    }

    return await supabaseClient
        .from("glamsanity_settings")
        .insert({
            id: 1,
            ...fields
        });

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboardCounts() {

    setText(
        "productCount",
        products.length
    );

    setText(
        "bundleCount",
        bundles.length
    );

    setText(
        "containerCount",
        containers.length
    );

    setText(
        "serviceCount",
        currentServices.length
    );

}


/* =========================================================
   HELPERS
   ========================================================= */

function bindClick(id, callback) {

    const element =
        document.getElementById(id);

    if (element) {
        element.addEventListener(
            "click",
            callback
        );
    }

}


function switchSection(sectionId) {

    const button =
        document.querySelector(
            `.nav-button[data-section="${sectionId}"]`
        );

    if (button) {
        button.click();
    }

}


function findById(list, id) {

    if (!id) return null;

    return list.find(
        item =>
            String(item.id) ===
            String(id)
    ) || null;

}


function value(id) {

    return String(
        document.getElementById(id)
            ?.value ?? ""
    );

}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value =
            value ?? "";
    }

}


function number(id) {

    const result =
        parseFloat(value(id));

    return Number.isFinite(result)
        ? Math.max(0, result)
        : 0;

}


function integer(id) {

    const result =
        parseInt(value(id), 10);

    return Number.isFinite(result)
        ? Math.max(0, result)
        : 0;

}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value ?? "";
    }

}


function clearFile(id) {

    const input =
        document.getElementById(id);

    if (input) {
        input.value = "";
    }

}


function showPreview(id, url) {

    const image =
        document.getElementById(id);

    if (!image) return;

    if (!url) {

        hidePreview(id);

        return;
    }

    image.src = url;

    image.classList.remove(
        "hidden"
    );

}


function hidePreview(id) {

    const image =
        document.getElementById(id);

    if (!image) return;

    image.src = "";

    image.classList.add(
        "hidden"
    );

}


function formatPrice(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "0.00";
    }

    return number.toLocaleString(
        "en-PH",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHtml(value);

}


function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast) {

        console.log(message);

        return;
    }

    toast.textContent =
        message;

    toast.className =
        `toast ${type} show`;

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

window.saveProduct = saveProduct;
window.saveBundle = saveBundle;
window.saveContainer = saveContainer;
window.saveServices = saveServices;
window.saveCompanySettings = saveCompanySettings;
window.savePaymentInformation = savePaymentInformation;

window.editProduct = editProduct;
window.editBundle = editBundle;
window.editContainer = editContainer;

window.deleteProduct = deleteProduct;
window.deleteBundle = deleteBundle;
window.deleteContainer = deleteContainer;

window.loadProducts = loadProducts;
window.loadBundles = loadBundles;
window.loadContainers = loadContainers;
window.loadServices = loadServices;