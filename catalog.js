// ============================================================
// GLAMSANITY PUBLIC CATALOG
// ============================================================

const PRODUCTS_TABLE = "products";
const CONTAINERS_TABLE = "containers";
const BUNDLES_TABLE = "bundles";
const SETTINGS_TABLE = "glamsanity_settings";


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadCatalog();

        setupCatalogRealtime();

    }
);


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


// ============================================================
// EMPTY MESSAGE
// ============================================================

function empty(
    message = "No items available yet."
) {

    return `

        <div class="empty">

            ${escapeHTML(message)}

        </div>

    `;

}


// ============================================================
// LOAD EVERYTHING
// ============================================================

async function loadCatalog() {

    try {

        const [

            productsResult,

            containersResult,

            bundlesResult,

            settingsResult

        ] = await Promise.all([

            supabaseClient
                .from(PRODUCTS_TABLE)
                .select("*")
                .order("created_at", {
                    ascending: false
                }),

            supabaseClient
                .from(CONTAINERS_TABLE)
                .select("*")
                .order("created_at", {
                    ascending: false
                }),

            supabaseClient
                .from(BUNDLES_TABLE)
                .select("*")
                .order("created_at", {
                    ascending: false
                }),

            supabaseClient
                .from(SETTINGS_TABLE)
                .select("*")
                .eq("id", 1)
                .maybeSingle()

        ]);


        if (productsResult.error) {

            throw productsResult.error;

        }


        if (containersResult.error) {

            throw containersResult.error;

        }


        if (bundlesResult.error) {

            throw bundlesResult.error;

        }


        if (settingsResult.error) {

            throw settingsResult.error;

        }


        const products =
            productsResult.data || [];


        const containers =
            containersResult.data || [];


        const bundles =
            bundlesResult.data || [];


        const settings =
            settingsResult.data || {};


        renderProducts(products);

        renderContainers(containers);

        renderBundles(bundles);

        renderSettings(settings);

        renderPaymentInformation(settings);


    } catch (error) {

        console.error(
            "Catalog loading error:",
            error
        );

    }

}


// ============================================================
// PRODUCTS
// ============================================================

function renderProducts(products) {

    const categories = {

        "Skincare": "skincare",

        "Soap": "soap",

        "Lip Products": "lip",

        "Personal Care": "other",

        "Cosmetics": "other"

    };


    const targetIds = [
        "skincare",
        "soap",
        "lip",
        "other"
    ];


    targetIds.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.innerHTML =
                empty();

        }

    });


    Object.entries(categories)
        .forEach(
            ([category, targetId]) => {

                const element =
                    document.getElementById(
                        targetId
                    );

                if (!element) {
                    return;
                }


                if (targetId === "other") {
                    return;
                }


                const matching =
                    products.filter(
                        product =>
                            product.category ===
                            category
                    );


                element.innerHTML =
                    matching.length

                        ? matching
                            .map(productCard)
                            .join("")

                        : empty();

            }
        );


    const otherElement =
        document.getElementById("other");


    if (otherElement) {

        const otherProducts =
            products.filter(
                product =>
                    [
                        "Personal Care",
                        "Cosmetics"
                    ].includes(
                        product.category
                    )
            );


        otherElement.innerHTML =
            otherProducts.length

                ? otherProducts
                    .map(productCard)
                    .join("")

                : empty();

    }

}


// ============================================================
// PRODUCT CARD
// ============================================================

function productCard(product) {

    return `

        <article class="catalog-card">

            ${
                product.image
                    ? `

                        <img
                            src="${escapeHTML(
                                product.image
                            )}"
                            alt="${escapeHTML(
                                product.name
                            )}"
                        >

                    `
                    : ""
            }


            <div class="content">

                <h4>
                    ${escapeHTML(
                        product.name
                    )}
                </h4>


                ${
                    product.description
                        ? `
                            <p>
                                ${escapeHTML(
                                    product.description
                                )}
                            </p>
                          `
                        : ""
                }


                ${
                    product.ingredients
                        ? `
                            <p>
                                <strong>
                                    Ingredients:
                                </strong>

                                ${escapeHTML(
                                    product.ingredients
                                )}
                            </p>
                          `
                        : ""
                }


                ${
                    product.benefits
                        ? `
                            <p>
                                <strong>
                                    Benefits:
                                </strong>

                                ${escapeHTML(
                                    product.benefits
                                )}
                            </p>
                          `
                        : ""
                }


                ${
                    product.size
                        ? `
                            <p>
                                <strong>
                                    Size:
                                </strong>

                                ${escapeHTML(
                                    product.size
                                )}
                            </p>
                          `
                        : ""
                }


                ${
                    product.packaging
                        ? `
                            <p>
                                <strong>
                                    Packaging:
                                </strong>

                                ${escapeHTML(
                                    product.packaging
                                )}
                            </p>
                          `
                        : ""
                }


                ${
                    product.moq
                        ? `
                            <p>
                                <strong>
                                    MOQ:
                                </strong>

                                ${escapeHTML(
                                    product.moq
                                )}
                            </p>
                          `
                        : ""
                }


                ${
                    product.price
                        ? `
                            <span class="price">
                                ₱${escapeHTML(
                                    product.price
                                )}
                            </span>
                          `
                        : ""
                }

            </div>

        </article>

    `;

}


// ============================================================
// CONTAINERS
// ============================================================

function renderContainers(containers) {

    const available =
        document.getElementById(
            "availableContainers"
        );


    const preorder =
        document.getElementById(
            "preorderContainers"
        );


    if (available) {

        const list =
            containers.filter(
                container =>
                    String(
                        container.availability ||
                        ""
                    ).toLowerCase() !==
                    "preorder"
            );


        available.innerHTML =
            list.length

                ? list
                    .map(containerCard)
                    .join("")

                : empty();

    }


    if (preorder) {

        const list =
            containers.filter(
                container =>
                    String(
                        container.availability ||
                        ""
                    ).toLowerCase() ===
                    "preorder"
            );


        preorder.innerHTML =
            list.length

                ? list
                    .map(containerCard)
                    .join("")

                : empty();

    }

}


// ============================================================
// CONTAINER CARD
// ============================================================

function containerCard(container) {

    return `

        <article class="catalog-card">

            <div class="content">

                <h4>
                    ${escapeHTML(
                        container.name
                    )}
                </h4>


                ${
                    container.size
                        ? `
                            <p>
                                <strong>
                                    Size:
                                </strong>

                                ${escapeHTML(
                                    container.size
                                )}
                            </p>
                          `
                        : ""
                }


                ${
                    container.color
                        ? `
                            <p>
                                <strong>
                                    Color:
                                </strong>

                                ${escapeHTML(
                                    container.color
                                )}
                            </p>
                          `
                        : ""
                }


                ${
                    container.quantity ||
                    container.qty
                        ? `
                            <p>
                                <strong>
                                    Quantity:
                                </strong>

                                ${escapeHTML(
                                    container.quantity ||
                                    container.qty
                                )}
                            </p>
                          `
                        : ""
                }


                ${
                    container.availability
                        ? `
                            <p>
                                <strong>
                                    Status:
                                </strong>

                                ${escapeHTML(
                                    container.availability
                                )}
                            </p>
                          `
                        : ""
                }

            </div>

        </article>

    `;

}


// ============================================================
// BUNDLES
// ============================================================

function renderBundles(bundles) {

    const element =
        document.getElementById(
            "bundleCatalog"
        );


    if (!element) {
        return;
    }


    element.innerHTML =
        bundles.length

            ? bundles
                .map(bundleCard)
                .join("")

            : empty();

}


// ============================================================
// BUNDLE CARD
// ============================================================

function bundleCard(bundle) {

    return `

        <article class="catalog-card">

            ${
                bundle.image
                    ? `

                        <img
                            src="${escapeHTML(
                                bundle.image
                            )}"
                            alt="${escapeHTML(
                                bundle.name
                            )}"
                        >

                    `
                    : ""
            }


            <div class="content">

                <h4>
                    ${escapeHTML(
                        bundle.name
                    )}
                </h4>


                ${
                    bundle.details
                        ? `
                            <p>
                                ${escapeHTML(
                                    bundle.details
                                )}
                            </p>
                          `
                        : ""
                }


                ${
                    bundle.price
                        ? `
                            <span class="price">
                                ₱${escapeHTML(
                                    bundle.price
                                )}
                            </span>
                          `
                        : ""
                }

            </div>

        </article>

    `;

}


// ============================================================
// COMPANY INFORMATION
// ============================================================

function renderSettings(settings) {

    const intro =
        document.getElementById(
            "companyIntro"
        );


    if (intro) {

        intro.textContent =
            settings.company_intro ||
            "Welcome to Glamsanity.";

    }

}


// ============================================================
// PAYMENT INFORMATION
// ============================================================

function renderPaymentInformation(settings) {

    const element =
        document.getElementById(
            "paymentInformation"
        );


    if (!element) {

        return;

    }


    const payment =
        settings.payment_information || {

            accepted_methods: [],

            payment_instructions: "",

            required_down_payment: "",

            balance_payment_schedule: "",

            payment_confirmation: "",

            important_reminders: ""

        };


    const methods =
        Array.isArray(
            payment.accepted_methods
        )
            ? payment.accepted_methods
            : [];


    const hasContent =
        methods.length > 0 ||

        payment.payment_instructions ||

        payment.required_down_payment ||

        payment.balance_payment_schedule ||

        payment.payment_confirmation ||

        payment.important_reminders;


    if (!hasContent) {

        element.innerHTML = `

            <div class="payment-info-card">

                <h3>
                    Payment Information
                </h3>

                <p>
                    Payment information will
                    be displayed here.
                </p>

            </div>

        `;

        return;

    }


    let number = 0;


    function section(
        title,
        content
    ) {

        if (!content) {
            return "";
        }


        number++;


        return `

            <article class="payment-info-card">

                <div class="payment-info-number">
                    ${number}
                </div>

                <div>

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <div class="payment-info-text">
                        ${escapeHTML(
                            content
                        ).replace(
                            /\n/g,
                            "<br>"
                        )}
                    </div>

                </div>

            </article>

        `;

    }


    let html = `

        <div class="payment-info-header">

            <h3>
                Payment Information
            </h3>

            <p>
                Please review the following
                payment requirements and
                procedures before making a payment.
            </p>

        </div>

    `;


    if (methods.length > 0) {

        number++;


        html += `

            <article class="payment-info-card">

                <div class="payment-info-number">
                    ${number}
                </div>

                <div>

                    <h3>
                        Accepted Payment Methods
                    </h3>

                    <div class="payment-method-list">

                        ${
                            methods
                                .map(
                                    method => `
                                        <span>
                                            ${escapeHTML(
                                                method
                                            )}
                                        </span>
                                    `
                                )
                                .join("")
                        }

                    </div>

                </div>

            </article>

        `;

    }


    html += section(
        "Payment Instructions",
        payment.payment_instructions
    );


    html += section(
        "Required Down Payment",
        payment.required_down_payment
    );


    html += section(
        "Balance / Payment Schedule",
        payment.balance_payment_schedule
    );


    html += section(
        "Payment Confirmation Procedures",
        payment.payment_confirmation
    );


    if (
        payment.important_reminders
    ) {

        number++;


        html += `

            <article
                class="payment-info-card payment-reminders"
            >

                <div class="payment-info-number">
                    ${number}
                </div>

                <div>

                    <h3>
                        Important Payment Reminders
                    </h3>

                    <div class="payment-info-text">
                        ${escapeHTML(
                            payment.important_reminders
                        ).replace(
                            /\n/g,
                            "<br>"
                        )}
                    </div>

                </div>

            </article>

        `;

    }


    element.innerHTML = html;

}


// ============================================================
// REALTIME
// ============================================================

function setupCatalogRealtime() {

    supabaseClient

        .channel("glamsanity-catalog")

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: PRODUCTS_TABLE
            },
            () => loadCatalog()
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: CONTAINERS_TABLE
            },
            () => loadCatalog()
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: BUNDLES_TABLE
            },
            () => loadCatalog()
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: SETTINGS_TABLE
            },
            () => loadCatalog()
        )

        .subscribe();

}