import {getProducts, addProduct, bookProduct} from "./api.js";
import {ADD_PRODUCT_FORM, renderNotification} from "./utils.js";

export async function renderSaleCard() {
    const panel = document.querySelector(".sales-container");
    if (!panel) return;

    const products = await getProducts();

    let html = `
        <div class="sales-header">
            <h3>Продаётся</h3>
            ${window.currentUser?.role === "student" 
                ? `<button class="toggle-form-btn" id="toggleAddProduct">+ Добавить товар</button>` 
                : ''}
        </div>
        
        <div class="sales-grid" id="products-grid">
            ${products.map(p => `
                <article class="sales-card" data-id="${p.id}">
                    <div class="sales-card-body">
                        <h3 class="sales-card-title">${escapeHtml(p.title || "Товар")}</h3>
                        <img class="sales-card-media" alt="${escapeHtml(p.title)}" src="${p.image || 'pupupu.png'}">
                        <p class="sales-card-description">${escapeHtml(p.description)}</p>
                        <p class="sales-price">${p.price ?? 0} ₽</p>
                        <p class="sales-stock">${p.stock ?? 1} шт</p>
                        <p class="sales-seller-contact">${escapeHtml(p.seller_contact ?? "Продавец неизвестен")}</p>
                        <button class="sales-btn" data-action="book" data-id="${p.id}">Забронировать</button>
                    </div>
                </article>
            `).join('')}
        </div>
    `;

    if (window.currentUser?.role === "student") {
        html += `
            <div class="add-product-panel hidden" id="addProductPanel">
                <form class="product-form" id="product-form" enctype="multipart/form-data">
                    <div class="form-header">
                        <h4>Новый товар</h4>
                        <button type="button" class="close-form" id="closeAddProduct">&times;</button>
                    </div>
                    
                    <label class="form-label">
                        <span>Название *</span>
                        <input type="text" name="title" required placeholder="Например: Джинсы">
                    </label>
                    
                    <label class="form-label">
                        <span>Фото</span>
                        <input type="file" name="image" accept="image/*">
                    </label>
                    
                    <label class="form-label">
                        <span>Описание</span>
                        <textarea name="description" rows="3" placeholder="Состояние, размер..."></textarea>
                    </label>
                    
                    <label class="form-label">
                        <span>Цена (₽) *</span>
                        <input type="number" name="price" min="0" step="1" required>
                    </label>
                    
                    <label class="form-label">
                        <span>Количество *</span>
                        <input type="number" name="stock" min="0" step="1" required>
                    </label>
                    
                    <label class="form-label">
                        <span>Контакты *</span>
                        <input type="text" name="seller_contact" required placeholder="@telegram или телефон">
                    </label>
                    
                    <button type="submit" class="form-btn">Опубликовать</button>
                </form>
            </div>
        `;
    }

    panel.innerHTML = html;

    const toggleBtn = document.getElementById("toggleAddProduct");
    const closeBtn = document.getElementById("closeAddProduct");
    const formPanel = document.getElementById("addProductPanel");
    
    if (toggleBtn && formPanel) {
        toggleBtn.addEventListener("click", () => {
            formPanel.classList.toggle("hidden");
            toggleBtn.textContent = formPanel.classList.contains("hidden") 
                ? "Добавить товар" 
                : "Скрыть форму";
        });
    }
    if (closeBtn && formPanel) {
        closeBtn.addEventListener("click", () => {
            formPanel.classList.add("hidden");
            if (toggleBtn) toggleBtn.textContent = "+ Добавить товар";
        });
    }

    const grid = document.getElementById("products-grid");
    if (grid) {
        grid.addEventListener("click", async (e) => {
            const btn = e.target.closest("[data-action='book']");
            if (!btn) return;
            
            const productId = btn.dataset.id;
            try {
                await bookProduct(productId);
                renderNotification("Товар забронирован!", "success");
                renderSaleCard();
            } catch (err) {
                renderNotification("Ошибка: " + err.message, "error");
            }
        });
    }

    const form = document.getElementsByClassName("product-form");
    if (form) {
        document.getElementsByClassName("form-btn")[0].addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            
            try {
                await addProduct(fd);
                renderNotification("Товар опубликован!", "success");
                form.reset();
                formPanel?.classList.add("hidden");
                if (toggleBtn) toggleBtn.textContent = "+ Добавить товар";
                renderSaleCard();
            } catch (err) {
                renderNotification("Ошибка: " + err.message, "error");
            }
        });
    }
}

function escapeHtml(text) {
    if (!text) return 'Описание отсутствует';
    return text.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
}
