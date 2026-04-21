import {getProducts, addProduct, bookProduct} from "./api.js";
import {ADD_PRODUCT_FORM, renderNotification} from "./utils.js";

export async function renderSaleCard() {  
    const panel = document.querySelector(".sales-container");
    if (!panel) return;
   
    const products = await getProducts();

    let html = "<h3>Продаётся</h3><div class='sales-grid'>";

    products.forEach((p) => {
        html += `
            <article class="sales-card">
                <div class="sales-card-body">
                    <h3 class="sales-card-title">${p.title || "Товар"}</h3>
                    <img class="sales-card-media" alt="${p.title}" src="${p.image || 'pupupu.png'}">
                    <p class="sales-card-description">${escapeHtml(p.description)}</p>
                    <p class="sales-price">${p.price ?? 0} ₽</p>
                    <p class="sales-stock">${p.stock ?? 1} шт</p>
                    <p class="sales-seller_contact">${p.seller_contact ?? "Продавец неизвестен"}
                    <button class="sales-btn" data-id="${p.id}">Забронировать</button>
                </div>
            </article>
        `;
    });

    html += `</div>`;

    if (window.currentUser?.role === "student") {
        html += ADD_PRODUCT_FORM;
    }

    panel.innerHTML = html;

    panel.addEventListener('click', async (e) => {
        if (e.target.classList.contains('sales-btn')) {
            const productId = e.target.dataset.id;
            try {
                await bookProduct(productId);
                console.log(`Бронируем товар с номером ${product_id}`);
                renderNotification("Товар забронирован", "success");
            } catch(err) {
                renderNotification("Ошибка: " + err.message, "error");
            }
        }
    });

    const form = document.getElementById('product-form');
    if(form === null) {
        return;
    }
    form.addEventListener('submit', async(e) => {
        e.preventDefault();
        const fd = new FormData(form);
        try {
        await addProduct(fd);
        renderNotification("Товар опубликован!", "success");
        form.reset();
        renderSaleCard();
    } catch (err) {
        console.error(err);
        renderNotification("Ошибка: " + err.message, "error");
    }
    });
}

function escapeHtml(text) {
    if (!text) return 'Описание отсутствует';
    return text.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
}
