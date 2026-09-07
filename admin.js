// ============================================================
// GLAMSANITY ADMIN JAVASCRIPT
// ============================================================

let currentSettings = null;


// ============================================================
// DEFAULT PAYMENT INFORMATION
// ============================================================

function defaultPaymentInformation() {
    return {
        accepted_methods: [],
        payment_instructions: "",
        required_down_payment: "",
        balance_payment_schedule: "",
        payment_confirmation: "",
        important_reminders: ""
    };
}


// ============================================================
// START
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    setupLogin();
    setupLogout();

    await checkSession();

});


// ============================================================
// LOGIN
// ============================================================

function setupLogin() {

    const form = document.getElementById("loginForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const message =
            document.getElementById("loginMessage");

        message.textContent = "Logging in...";

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {

            console.error(error);

            message.textContent = error.message;

            return;
        }

        if (data.session) {

            showAdmin();

        }

    });

}


// ============================================================
// SESSION
// ============================================================

async function checkSession() {

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();

    if (error) {

        console.error(error);

        return;
    }

    if (data.session) {

        showAdmin();

    } else {

        showLogin();

    }

    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            if (session) {

                showAdmin();

            } else {

                showLogin();

            }

        }
    );

}


// ============================================================
// SHOW LOGIN
// ============================================================

function showLogin() {

    const loginSection =
        document.getElementById("loginSection");

    const adminApp =
        document.getElementById("adminApp");

    if (loginSection) {

        loginSection.classList.remove("hidden");

    }

    if (adminApp) {

        adminApp.classList.add("hidden");

    }

}


// ============================================================
// SHOW ADMIN
// ============================================================

async function showAdmin() {

    const loginSection =
        document.getElementById("loginSection");

    const adminApp =
        document.getElementById("adminApp");

    if (loginSection) {

        loginSection.classList.add("hidden");

    }

    if (adminApp) {

        adminApp.classList.remove("hidden");

    }

    showSection("dashboard");

    await refreshAll();

}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {

    const button =
        document.getElementById("logoutButton");

    if (!button) {
        return;
    }

    button.addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

    });

}


// ============================================================
// SECTION NAVIGATION
// ============================================================

function showSection(id) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.add("hidden");

        });

    const section =
        document.getElementById(id);

    if (section) {

        section.classList.remove("hidden");

    }

    document
        .querySelectorAll(".nav-button")
        .forEach(button => {

            button.classList.remove("active");

        });

}


// ============================================================
// REFRESH EVERYTHING
// ============================================================

async function refreshAll() {

    await Promise.all([
        updateDashboard(),
        loadProductsAdmin(),
        loadContainersAdmin(),
        loadBundlesAdmin(),
        loadSettingsAdmin()
    ]);

}


// ============================================================
// DASHBOARD
// ============================================================

async function updateDashboard() {

    const [
        products,
        containers,
        bundles
    ] = await Promise.all([

        supabaseClient
            .from("products")
            .select("id", {
                count: "exact",
                head: true
            }),

        supabaseClient
            .from("containers")
            .select("id", {
                count: "exact",
                head: true
            }),

        supabaseClient
            .from("bundles")
            .select("id", {
                count: "exact",
                head: true
            })

    ]);


    const totalProducts =
        document.getElementById("totalProducts");

    const totalContainers =
        document.getElementById("totalContainers");

    const totalBundles =
        document.getElementById("totalBundles");

    if (totalProducts) {

        totalProducts.textContent =
            products.count || 0;

    }

    if (totalContainers) {

        totalContainers.textContent =
            containers.count || 0;

    }

    if (totalBundles) {

        totalBundles.textContent =
            bundles.count || 0;

    }


    const status =
        document.getElementById("statusText");

    if (status) {

        status.textContent =
            "Connected to Supabase";

    }

}


// ============================================================
// FILE → BASE64
// ============================================================

function fileToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {

            resolve(reader.result);

        };

        reader.onerror = reject;

        reader.readAsDataURL(file);

    });

}


// ============================================================
// ADD PRODUCT
// ============================================================

async function addProduct() {

    const name =
        document.getElementById("productName")
            ?.value.trim();

    if (!name) {

        alert("Please enter a product name.");

        return;

    }


    const file =
        document.getElementById("productImage")
            ?.files[0];

    let image = null;

    if (file) {

        image =
            await fileToBase64(file);

    }


    const product = {

        name,

        category:
            document.getElementById("productCategory")
                ?.value || "",

        description:
            document.getElementById("productDescription")
                ?.value.trim() || "",

        ingredients:
            document.getElementById("productIngredients")
                ?.value.trim() || "",

        benefits:
            document.getElementById("productBenefits")
                ?.value.trim() || "",

        size:
            document.getElementById("productSize")
                ?.value.trim() || "",

        packaging:
            document.getElementById("productPackaging")
                ?.value.trim() || "",

        moq:
            document.getElementById("productMOQ")
                ?.value.trim() || "",

        price:
            document.getElementById("productPrice")
                ?.value || null,

        image

    };


    const {
        error
    } = await supabaseClient
        .from("products")
        .insert(product);


    if (error) {

        console.error(error);

        alert(
            "Could not add product:\n\n" +
            error.message
        );

        return;

    }


    alert("Product added successfully!");

    clearProductForm();

    await refreshAll();

}


// ============================================================
// CLEAR PRODUCT FORM
// ============================================================

function clearProductForm() {

    [
        "productName",
        "productDescription",
        "productIngredients",
        "productBenefits",
        "productSize",
        "productPackaging",
        "productMOQ",
        "productPrice"
    ]
    .forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.value = "";

        }

    });


    const image =
        document.getElementById("productImage");

    if (image) {

        image.value = "";

    }

}


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProductsAdmin() {

    const {
        data,
        error
    } = await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", {
            ascending: false
        });


    const list =
        document.getElementById("productList");

    if (!list) {
        return;
    }


    if (error) {

        list.innerHTML =
            `<p>${escapeHTML(error.message)}</p>`;

        return;

    }


    if (!data || data.length === 0) {

        list.innerHTML =
            "<p>No products yet.</p>";

        return;

    }


    list.innerHTML = "";


    data.forEach(product => {

        list.innerHTML += `

            <div class="admin-item">

                <div>

                    <strong>
                        ${escapeHTML(product.name)}
                    </strong>

                    <p>
                        ${escapeHTML(product.category)}
                    </p>

                </div>

                <button
                    class="danger-button"
                    onclick="deleteProduct('${product.id}')"
                >
                    Delete
                </button>

            </div>

        `;

    });

}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(id) {

    if (!confirm("Delete this product?")) {

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("products")
        .delete()
        .eq("id", id);


    if (error) {

        alert(error.message);

        return;

    }


    await refreshAll();

}


// ============================================================
// ADD CONTAINER
// ============================================================

async function addContainer() {

    const name =
        document.getElementById("containerName")
            ?.value.trim();

    if (!name) {

        alert("Please enter a container name.");

        return;

    }


    const container = {

        name,

        size:
            document.getElementById("containerSize")
                ?.value.trim() || "",

        color:
            document.getElementById("containerColor")
                ?.value.trim() || "",

        quantity:
            document.getElementById("containerQty")
                ?.value || null,

        availability:
            document.getElementById("containerAvailability")
                ?.value || "available"

    };


    const {
        error
    } = await supabaseClient
        .from("containers")
        .insert(container);


    if (error) {

        alert(error.message);

        return;

    }


    alert("Container added successfully!");


    [
        "containerName",
        "containerSize",
        "containerColor",
        "containerQty"
    ]
    .forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.value = "";

        }

    });


    await refreshAll();

}


// ============================================================
// LOAD CONTAINERS
// ============================================================

async function loadContainersAdmin() {

    const {
        data,
        error
    } = await supabaseClient
        .from("containers")
        .select("*")
        .order("created_at", {
            ascending: false
        });


    const list =
        document.getElementById("containerList");

    if (!list) {
        return;
    }


    if (error) {

        list.innerHTML =
            `<p>${escapeHTML(error.message)}</p>`;

        return;

    }


    if (!data || data.length === 0) {

        list.innerHTML =
            "<p>No containers yet.</p>";

        return;

    }


    list.innerHTML = "";


    data.forEach(container => {

        list.innerHTML += `

            <div class="admin-item">

                <div>

                    <strong>
                        ${escapeHTML(container.name)}
                    </strong>

                    <p>
                        ${escapeHTML(
                            container.availability || ""
                        )}
                    </p>

                </div>

                <button
                    class="danger-button"
                    onclick="deleteContainer('${container.id}')"
                >
                    Delete
                </button>

            </div>

        `;

    });

}


// ============================================================
// DELETE CONTAINER
// ============================================================

async function deleteContainer(id) {

    if (!confirm("Delete this container?")) {

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("containers")
        .delete()
        .eq("id", id);


    if (error) {

        alert(error.message);

        return;

    }


    await refreshAll();

}


// ============================================================
// ADD BUNDLE
// ============================================================

async function addBundle() {

    const name =
        document.getElementById("bundleName")
            ?.value.trim();

    if (!name) {

        alert("Please enter a bundle name.");

        return;

    }


    const file =
        document.getElementById("bundleImage")
            ?.files[0];

    let image = null;

    if (file) {

        image =
            await fileToBase64(file);

    }


    const bundle = {

        name,

        price:
            document.getElementById("bundlePrice")
                ?.value || null,

        details:
            document.getElementById("bundleDetails")
                ?.value.trim() || "",

        image

    };


    const {
        error
    } = await supabaseClient
        .from("bundles")
        .insert(bundle);


    if (error) {

        alert(error.message);

        return;

    }


    alert("Bundle added successfully!");


    [
        "bundleName",
        "bundlePrice",
        "bundleDetails"
    ]
    .forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.value = "";

        }

    });


    const imageInput =
        document.getElementById("bundleImage");

    if (imageInput) {

        imageInput.value = "";

    }


    await refreshAll();

}


// ============================================================
// LOAD BUNDLES
// ============================================================

async function loadBundlesAdmin() {

    const {
        data,
        error
    } = await supabaseClient
        .from("bundles")
        .select("*")
        .order("created_at", {
            ascending: false
        });


    const list =
        document.getElementById("bundleList");

    if (!list) {
        return;
    }


    if (error) {

        list.innerHTML =
            `<p>${escapeHTML(error.message)}</p>`;

        return;

    }


    if (!data || data.length === 0) {

        list.innerHTML =
            "<p>No bundles yet.</p>";

        return;

    }


    list.innerHTML = "";


    data.forEach(bundle => {

        list.innerHTML += `

            <div class="admin-item">

                <div>

                    <strong>
                        ${escapeHTML(bundle.name)}
                    </strong>

                    <p>
                        ${
                            bundle.price
                                ? "₱" +
                                  escapeHTML(bundle.price)
                                : ""
                        }
                    </p>

                </div>

                <button
                    class="danger-button"
                    onclick="deleteBundle('${bundle.id}')"
                >
                    Delete
                </button>

            </div>

        `;

    });

}


// ============================================================
// DELETE BUNDLE
// ============================================================

async function deleteBundle(id) {

    if (!confirm("Delete this bundle?")) {

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("bundles")
        .delete()
        .eq("id", id);


    if (error) {

        alert(error.message);

        return;

    }


    await refreshAll();

}


// ============================================================
// LOAD SETTINGS
// ============================================================

async function loadSettingsAdmin() {

    const {
        data,
        error
    } = await supabaseClient
        .from("glamsanity_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();


    if (error) {

        console.error(
            "Settings loading error:",
            error
        );

        return;

    }


    currentSettings =
        data || {};


    const companyIntro =
        document.getElementById("companyIntro");

    if (companyIntro) {

        companyIntro.value =
            data?.company_intro || "";

    }


    const payment =
        data?.payment_information ||
        defaultPaymentInformation();


    setCheckbox(
        "paymentGCash",
        payment.accepted_methods,
        "GCash"
    );

    setCheckbox(
        "paymentMaya",
        payment.accepted_methods,
        "Maya"
    );

    setCheckbox(
        "paymentBank",
        payment.accepted_methods,
        "Bank Transfer"
    );

    setCheckbox(
        "paymentCOD",
        payment.accepted_methods,
        "Cash on Delivery"
    );

    setCheckbox(
        "paymentOther",
        payment.accepted_methods,
        "Other"
    );


    setValue(
        "paymentInstructions",
        payment.payment_instructions
    );

    setValue(
        "requiredDownPayment",
        payment.required_down_payment
    );

    setValue(
        "balancePaymentSchedule",
        payment.balance_payment_schedule
    );

    setValue(
        "paymentConfirmationProcedures",
        payment.payment_confirmation
    );

    setValue(
        "importantPaymentReminders",
        payment.important_reminders
    );

}


// ============================================================
// SET INPUT VALUE
// ============================================================

function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.value =
            value || "";

    }

}


// ============================================================
// SET CHECKBOX
// ============================================================

function setCheckbox(
    id,
    methods,
    value
) {

    const checkbox =
        document.getElementById(id);

    if (!checkbox) {
        return;
    }

    checkbox.checked =
        Array.isArray(methods) &&
        methods.includes(value);

}


// ============================================================
// SAVE COMPANY INFORMATION
// ============================================================

async function saveCompanySettings() {

    const companyIntro =
        document.getElementById("companyIntro")
            ?.value.trim() || "";


    const {
        error
    } = await supabaseClient
        .from("glamsanity_settings")
        .upsert(
            {
                id: 1,
                company_intro: companyIntro
            },
            {
                onConflict: "id"
            }
        );


    if (error) {

        console.error(error);

        alert(
            "Could not save company information:\n\n" +
            error.message
        );

        return;

    }


    alert(
        "Company information saved!"
    );


    await loadSettingsAdmin();

}


// ============================================================
// SAVE PAYMENT INFORMATION
// ============================================================

async function savePaymentInformation() {

    const acceptedMethods = [];


    const methodCheckboxes = [

        {
            id: "paymentGCash",
            value: "GCash"
        },

        {
            id: "paymentMaya",
            value: "Maya"
        },

        {
            id: "paymentBank",
            value: "Bank Transfer"
        },

        {
            id: "paymentCOD",
            value: "Cash on Delivery"
        },

        {
            id: "paymentOther",
            value: "Other"
        }

    ];


    methodCheckboxes.forEach(method => {

        const checkbox =
            document.getElementById(method.id);

        if (
            checkbox &&
            checkbox.checked
        ) {

            acceptedMethods.push(
                method.value
            );

        }

    });


    const paymentInformation = {

        accepted_methods:
            acceptedMethods,

        payment_instructions:
            document.getElementById(
                "paymentInstructions"
            )?.value.trim() || "",

        required_down_payment:
            document.getElementById(
                "requiredDownPayment"
            )?.value.trim() || "",

        balance_payment_schedule:
            document.getElementById(
                "balancePaymentSchedule"
            )?.value.trim() || "",

        payment_confirmation:
            document.getElementById(
                "paymentConfirmationProcedures"
            )?.value.trim() || "",

        important_reminders:
            document.getElementById(
                "importantPaymentReminders"
            )?.value.trim() || ""

    };


    const {
        error
    } = await supabaseClient
        .from("glamsanity_settings")
        .upsert(
            {
                id: 1,
                payment_information:
                    paymentInformation
            },
            {
                onConflict: "id"
            }
        );


    if (error) {

        console.error(error);

        alert(
            "Could not save payment information:\n\n" +
            error.message
        );

        return;

    }


    currentSettings = {

        ...(currentSettings || {}),

        payment_information:
            paymentInformation

    };


    alert(
        "Payment Information saved successfully!"
    );

}


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