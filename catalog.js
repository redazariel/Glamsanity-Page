/* FILE 3: catalog.js */

/* =========================================================
   GLAMSANITY PUBLIC CATALOG
   ========================================================= */

const SUPABASE_URL =
    "https://dhbrmfoainutmimocqit.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_huQ5eTD3dDnbwY2nSAN0qA_XbMkhSY8";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

let cart = [];

document.addEventListener("DOMContentLoaded", () => {

    setupTheme();
    setupCart();
    setCurrentYear();
    loadCatalog();

});


/* =========================================================
   LOAD EVERYTHING
   ========================================================= */

async function loadCatalog() {

    const results = await Promise.all([
        fetchRows("products"),
        fetchRows("bundles"),
        fetchRows("containers"),
        fetchSettings()
    ]);

    renderGrid(
        "productsGrid",
        results[0].data,
        results[0].error,
        "product"
    );

    renderGrid(
        "bundlesGrid",
        results[1].data,
        results[1].error,
        "bundle"
    );

    renderGrid(
        "containersGrid",
        results[2].data,
        results[2].error,
        "container"
    );

    renderSettings(
        results[3].data || {},
        results[3].error
    );

}


/* =========================================================
   DATABASE
   ========================================================= */

async function fetchRows(table) {

    try {

        const result =
            await supabaseClient
                .from(table)
                .select("*")
                .order("id", {
                    ascending: false
                });

        return {
            data: result.data || [],
            error: result.error
        };

    } catch (error) {

        return {
            data: [],
            error
        };

    }

}


async function fetchSettings() {

    try {

        const result =
            await supabaseClient
                .from("glamsanity_settings")
                .select("*")
                .eq("id", 1)
                .maybeSingle();

        return {
            data: result.data || {},
            error: result.error
        };

    } catch (error) {

        return {
            data: {},
            error
        };

    }

}


/* =========================================================
   RENDER PRODUCTS / BUNDLES / CONTAINERS
   ========================================================= */

function renderGrid(
    elementId,
    rows,
    error,
    type
) {

    const grid =
        document.getElementById(elementId);

    if (!grid) return;

    if (error) {

        console.error(type, error);

        grid.innerHTML = `
            <div class="error-message">
                Unable to load ${escapeHtml(type)}s.
                <br>
                ${escapeHtml(error.message)}
            </div>
        `;

        return;
    }

    if (!rows.length) {

        grid.innerHTML = `
            <div class="empty-message">
                No ${escapeHtml(type)}s available at this time.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        rows
            .map(item =>
                createCatalogCard(item, type)
            )
            .join("");

}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function createCatalogCard(item, type) {

    const name =
        item.name || "Unnamed Item";

    const description =
        item.description ||
        "Premium Glamsanity product.";

    const image =
        item.image_url ||
        item.image ||
        "";

    const price =
        Number(item.price || 0);

    const stock =
        Number(item.stock || 0);

    const category =
        item.category || "";

    const typeName =
        type === "product"
            ? "Product"
            : type === "bundle"
                ? "Bundle"
                : "Container";

    return `
        <article class="catalog-card">

            <div class="catalog-image">

                ${
                    image
                        ? `
                            <img
                                src="${escapeAttribute(image)}"
                                alt="${escapeAttribute(name)}"
                                loading="lazy"
                                onerror="this.style.display='none';this.nextElementSibling.style.display='grid';"
                            >

                            <div
                                class="catalog-placeholder"
                                style="display:none;"
                            >
                                GLAMSANITY
                            </div>
                          `
                        : `
                            <div class="catalog-placeholder">
                                GLAMSANITY
                            </div>
                          `
                }

                <span class="catalog-type">
                    ${typeName}
                </span>

            </div>


            <div class="catalog-content">

                ${
                    category
                        ? `
                            <div class="catalog-category">
                                ${escapeHtml(category)}
                            </div>
                          `
                        : ""
                }

                <h3>
                    ${escapeHtml(name)}
                </h3>

                <p class="catalog-description">
                    ${escapeHtml(description)}
                </p>

                <div class="catalog-bottom">

                    <strong class="catalog-price">
                        ₱${formatPrice(price)}
                    </strong>

                    <span class="stock-info ${
                        stock > 0
                            ? "in-stock"
                            : "out-of-stock"
                    }">
                        ${
                            stock > 0
                                ? `In Stock: ${stock}`
                                : "Out of Stock"
                        }
                    </span>

                </div>

                <button
                    type="button"
                    class="add-cart-button"
                    data-cart-id="${escapeAttribute(item.id)}"
                    data-cart-type="${type}"
                    ${stock <= 0 ? "disabled" : ""}
                >
                    ${
                        stock > 0
                            ? "ADD TO CART"
                            : "OUT OF STOCK"
                    }
                </button>

            </div>

        </article>
    `;

}


/* =========================================================
   SETTINGS
   ========================================================= */

function renderSettings(settings, error) {

    if (error) {
        console.warn(
            "Settings error:",
            error.message
        );
    }

    setText(
        "companyIntro",
        settings.company_intro ||
        "Welcome to Glamsanity."
    );

    setText(
        "companyMission",
        settings.company_mission ||
        "Our mission information will be available soon."
    );

    setText(
        "companyVision",
        settings.company_vision ||
        "Our vision information will be available soon."
    );

    renderServices(
        settings.services_offered
    );

    renderPayment(
        settings.payment_information
    );

}


/* =========================================================
   SERVICES
   ========================================================= */

function renderServices(value) {

    const grid =
        document.getElementById(
            "servicesOfferedGrid"
        );

    if (!grid) return;

    const services =
        Array.isArray(value)
            ? value
            : [];

    const usableServices =
        services.filter(service =>
            service &&
            (
                service.name ||
                service.description ||
                service.image
            )
        );

    if (!usableServices.length) {

        grid.innerHTML = `
            <div class="service-empty">
                Services information will be available soon.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        usableServices
            .map((service, index) => {

                const name =
                    service.name ||
                    `Service ${index + 1}`;

                const description =
                    service.description ||
                    "";

                const image =
                    service.image ||
                    "";

                return `
                    <article class="service-card">

                        <div class="service-image">

                            ${
                                image
                                    ? `
                                        <img
                                            src="${escapeAttribute(image)}"
                                            alt="${escapeAttribute(name)}"
                                            loading="lazy"
                                            onerror="this.style.display='none';this.nextElementSibling.style.display='grid';"
                                        >

                                        <div
                                            class="service-placeholder"
                                            style="display:none;"
                                        >
                                            GLAMSANITY
                                        </div>
                                      `
                                    : `
                                        <div class="service-placeholder">
                                            GLAMSANITY
                                        </div>
                                      `
                            }

                        </div>

                        <div class="service-content">

                            <span class="service-number">
                                ${String(index + 1).padStart(2, "0")}
                            </span>

                            <h4>
                                ${escapeHtml(name)}
                            </h4>

                            ${
                                description
                                    ? `
                                        <p>
                                            ${escapeHtml(description)}
                                        </p>
                                      `
                                    : ""
                            }

                        </div>

                    </article>
                `;

            })
            .join("");

}


/* =========================================================
   PAYMENT INFORMATION
   ========================================================= */

function renderPayment(value) {

    const payment =
        value &&
        typeof value === "object"
            ? value
            : {};

    setText(
        "paymentMethods",
        payment.methods ||
        "Payment information will be available soon."
    );

    setText(
        "paymentInstructions",
        payment.instructions ||
        "Please contact Glamsanity for payment instructions."
    );

    setText(
        "paymentDownPayment",
        payment.down_payment ||
        "Please contact Glamsanity for down payment requirements."
    );

    setText(
        "paymentSchedule",
        payment.schedule ||
        "Please contact Glamsanity for the payment schedule."
    );

    setText(
        "paymentConfirmation",
        payment.confirmation ||
        "Please send your payment confirmation according to the provided instructions."
    );

    setText(
        "paymentReminders",
        payment.reminders ||
        "Please keep your payment receipt or confirmation for reference."
    );

}


/* =========================================================
   CART
   ========================================================= */

function setupCart() {

    try {

        const saved =
            localStorage.getItem(
                "glamsanity-cart"
            );

        cart =
            saved
                ? JSON.parse(saved)
                : [];

        if (!Array.isArray(cart)) {
            cart = [];
        }

    } catch {
        cart = [];
    }

    updateCartCount();

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".add-cart-button"
                );

            if (button) {

                addToCart(
                    button.dataset.cartId,
                    button.dataset.cartType
                );

            }

            const remove =
                event.target.closest(
                    ".cart-remove"
                );

            if (remove) {

                removeFromCart(
                    Number(remove.dataset.index)
                );

            }

        }
    );

    const cartButton =
        document.getElementById(
            "cartButton"
        );

    const closeCart =
        document.getElementById(
            "closeCart"
        );

    const clearCart =
        document.getElementById(
            "clearCart"
        );

    if (cartButton) {
        cartButton.addEventListener(
            "click",
            openCart
        );
    }

    if (closeCart) {
        closeCart.addEventListener(
            "click",
            closeCartModal
        );
    }

    if (clearCart) {
        clearCart.addEventListener(
            "click",
            clearCartItems
        );
    }

    const modal =
        document.getElementById(
            "cartModal"
        );

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {
                    closeCartModal();
                }

            }
        );

    }

}


async function addToCart(id, type) {

    const result =
        await fetchRows(type === "product"
            ? "products"
            : type === "bundle"
                ? "bundles"
                : "containers"
        );

    if (result.error) {

        showToast(
            "Could not add item to cart.",
            "error"
        );

        return;
    }

    const item =
        result.data.find(
            row =>
                String(row.id) ===
                String(id)
        );

    if (!item) {

        showToast(
            "Item is no longer available.",
            "error"
        );

        return;
    }

    const stock =
        Number(item.stock || 0);

    if (stock <= 0) {

        showToast(
            "This item is out of stock.",
            "error"
        );

        return;
    }

    const existing =
        cart.find(
            row =>
                String(row.id) ===
                String(item.id) &&
                row.type === type
        );

    if (existing) {

        if (
            existing.quantity >= stock
        ) {

            showToast(
                "You cannot add more than the available stock.",
                "error"
            );

            return;
        }

        existing.quantity += 1;

    } else {

        cart.push({
            id: item.id,
            type,
            name: item.name,
            price: Number(item.price || 0),
            quantity: 1
        });

    }

    saveCart();

    showToast(
        `${item.name} added to cart.`
    );

}


function removeFromCart(index) {

    if (
        index < 0 ||
        index >= cart.length
    ) {
        return;
    }

    cart.splice(index, 1);

    saveCart();

    renderCart();

}


function clearCartItems() {

    cart = [];

    saveCart();

    renderCart();

}


function openCart() {

    const modal =
        document.getElementById(
            "cartModal"
        );

    if (!modal) return;

    modal.classList.remove(
        "hidden"
    );

    renderCart();

}


function closeCartModal() {

    const modal =
        document.getElementById(
            "cartModal"
        );

    if (modal) {
        modal.classList.add(
            "hidden"
        );
    }

}


function renderCart() {

    const container =
        document.getElementById(
            "cartItems"
        );

    const totalElement =
        document.getElementById(
            "cartTotal"
        );

    if (!container) return;

    if (!cart.length) {

        container.innerHTML = `
            <p class="empty-message">
                Your cart is empty.
            </p>
        `;

        if (totalElement) {
            totalElement.textContent =
                "₱0.00";
        }

        return;
    }

    container.innerHTML =
        cart
            .map((item, index) => `
                <div class="cart-item">

                    <div>
                        <h4>
                            ${escapeHtml(item.name)}
                        </h4>

                        <p>
                            ${item.quantity} ×
                            ₱${formatPrice(item.price)}
                        </p>
                    </div>

                    <div>
                        <strong>
                            ₱${formatPrice(
                                item.price *
                                item.quantity
                            )}
                        </strong>

                        <br>

                        <button
                            type="button"
                            class="cart-remove"
                            data-index="${index}"
                        >
                            Remove
                        </button>
                    </div>

                </div>
            `)
            .join("");

    const total =
        cart.reduce(
            (sum, item) =>
                sum +
                (
                    Number(item.price) *
                    Number(item.quantity)
                ),
            0
        );

    if (totalElement) {

        totalElement.textContent =
            `₱${formatPrice(total)}`;

    }

}


function saveCart() {

    try {

        localStorage.setItem(
            "glamsanity-cart",
            JSON.stringify(cart)
        );

    } catch (error) {

        console.warn(
            "Could not save cart:",
            error
        );

    }

    updateCartCount();

}


function updateCartCount() {

    const count =
        document.getElementById(
            "cartCount"
        );

    if (!count) return;

    count.textContent =
        cart.reduce(
            (sum, item) =>
                sum +
                Number(item.quantity || 0),
            0
        );

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
            ? "☀"
            : "☾";

}


/* =========================================================
   HELPERS
   ========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value || "";
    }

}


function setCurrentYear() {

    const year =
        document.getElementById(
            "currentYear"
        );

    if (year) {
        year.textContent =
            new Date().getFullYear();
    }

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

    if (!toast) return;

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
            3000
        );

}