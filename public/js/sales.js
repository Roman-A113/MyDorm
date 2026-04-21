import { getProducts, addProduct, bookProduct } from "./api.js";
import { renderNotification } from "./utils.js";

function initEventListeners(panel) {
    const formPanel = document.getElementById("addProductPanel");
    const toggleBtn = document.getElementById("toggleAddProduct");
    toggleBtn.addEventListener("click", () => {
        formPanel.classList.toggle("hidden");
        toggleBtn.textContent = formPanel.classList.contains("hidden") ? "+ Добавить товар" : "Скрыть форму";
    });

    const grid = document.getElementById("products-grid");
    grid.addEventListener("click", async (e) => {
        const btn = e.target.closest("[data-action='book']");
        if (!btn) return;

        const productId = btn.dataset.id;
        await bookProduct(productId);
        renderNotification("Товар забронирован!", "success");
        renderSales();
    });

    const productForm = document.getElementById("product-form");
    productForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const fd = new FormData(productForm);
        await addProduct(fd);
        renderNotification("Товар опубликован!", "success");
        productForm.reset();
        formPanel?.classList.add("hidden");
        if (toggleBtn) toggleBtn.textContent = "+ Добавить товар";
        renderSales();
    });

    const phoneInput = document.getElementById("seller_contact");
    phoneInput.addEventListener("input", function (e) {
        let x = e.target.value.replace(/\D/g, "");

        if (!x) {
            e.target.value = "";
            return;
        }

        if (["7", "8", "9"].indexOf(x[0]) > -1) {
            if (x[0] === "9") x = "7" + x;
            let firstSymbols = "+7";
            if (x[0] === "8") firstSymbols = "8";

            let formattedValue = firstSymbols + " ";

            if (x.length > 1) {
                formattedValue += "(" + x.substring(1, 4);
            }
            if (x.length >= 5) {
                formattedValue += ") " + x.substring(4, 7);
            }
            if (x.length >= 8) {
                formattedValue += "-" + x.substring(7, 9);
            }
            if (x.length >= 10) {
                formattedValue += "-" + x.substring(9, 11);
            }

            e.target.value = formattedValue;
        } else {
            e.target.value = "+" + x.substring(0, 15);
        }
    });

    phoneInput.addEventListener("keydown", function (e) {
        if (e.key === "Backspace") {
            const val = e.target.value;
            if (val === "+7 " || val === "+7" || val === "8 " || val === "8") {
                e.target.value = "";
                e.preventDefault();
            }
        }
    });
}

function renderSaleCard(p) {
    return `
                <article class="sales-card" data-id="${p.id}">
                    <div class="sales-card-body">
                        <h3 class="sales-card-title">${p.title}</h3>
                        <img class="sales-card-media" alt="${p.title}" src="${p.image || "pupupu.png"}">
                        <p class="sales-card-description">${p.description}</p>
                        <p class="sales-price">${p.price} ₽</p>
                        <p class="sales-stock">${p.stock} шт</p>
                        <p class="sales-seller-contact">${p.seller_contact}</p>
                        <button class="sales-btn" data-action="book" data-id="${p.id}">Забронировать</button>
                    </div>
                </article>
            `;
}

export async function renderSales() {
    const panel = document.querySelector(".sales-container");

    document.getElementById("products-grid")?.remove();
    const products = await getProducts();

    panel.innerHTML += `
        <div id="products-grid" class="sales-grid">
            ${products.map((p) => renderSaleCard(p)).join("")}
        </div>
    `;

    initEventListeners(panel);
}
