import { getProducts, addProduct, deleteProduct, updateProduct } from './api.js';
import { renderNotification } from './utils.js';

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function openAddProductModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

function closeAddProductModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('active');
}

function fillFormWithProductData(product) {
    const form = document.getElementById('product-form');
    form.querySelector('[name="title"]').value = product.title;
    form.querySelector('[name="description"]').value = product.description;
    form.querySelector('[name="price"]').value = product.price;
    form.querySelector('[name="stock"]').value = product.stock;

    document.getElementById('seller_contact').value = product.seller_contact;
    document.getElementById('seller_contact_telegram').value = product.seller_contact_telegram;

    document.getElementById('btn-create-product').style.display = 'none';
    document.getElementById('btn-update-product').style.display = 'block';

    let hiddenId = form.querySelector('input[name="product_id"]');
    if (!hiddenId) {
        hiddenId = document.createElement('input');
        hiddenId.type = 'hidden';
        hiddenId.name = 'product_id';
        form.appendChild(hiddenId);
    }
    hiddenId.value = product.id;
}

function initEventListeners(panel, products) {
    const closeBtn = document.querySelector('.close-modal');
    const addProductBtn = document.getElementById('toggleAddProduct');

    addProductBtn.addEventListener('click', openAddProductModal);
    closeBtn.addEventListener('click', closeAddProductModal);

    const modal = document.getElementById('productModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAddProductModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeAddProductModal();
        }
    });

    const grid = document.getElementById('products-grid');
    grid.addEventListener('click', async (e) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const productId = button.dataset.id;

        if (action === 'edit') {
            openAddProductModal();
            const productToEdit = products.find((p) => String(p.id) === String(productId));
            fillFormWithProductData(productToEdit);
        } else if (action === 'delete') {
            if (confirm('Вы уверены, что хотите удалить объявление?')) {
                await deleteProduct(productId);
                renderNotification('Объявление успешно удалено', 'success');
                renderSales();
            }
        }
    });

    const productForm = document.getElementById('product-form');
    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const inputs = productForm.querySelectorAll(
            'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="password"], textarea, select',
        );

        inputs.forEach((input) => {
            if (typeof input.value === 'string') {
                input.value = input.value.trim();
            }
        });

        const fd = new FormData(productForm);

        const sellerPhoneNumber = document.getElementById('seller_contact').value;
        const sellerContactTelegram = document.getElementById('seller_contact_telegram').value;

        if (!sellerPhoneNumber && !sellerContactTelegram) {
            renderNotification('Заполните контактные данные', 'error');
            return;
        }

        await addProduct(fd);
        closeAddProductModal();
        productForm.reset();
        renderNotification('Товар опубликован!', 'success');
        renderSales();
    });

    const btnUpdate = document.getElementById('btn-update-product');
    btnUpdate.addEventListener('click', async (e) => {
        e.preventDefault();
        const productId = productForm.querySelector('input[name="product_id"]')?.value;

        const fd = new FormData(productForm);
        await updateProduct(productId, fd);
        renderNotification('Изменения сохранены', 'success');
        closeAddProductModal();
        renderSales();
    });

    const phoneInput = document.getElementById('seller_contact');
    phoneInput.addEventListener('input', function (e) {
        let x = e.target.value.replace(/\D/g, '');

        if (!x) {
            e.target.value = '';
            return;
        }

        if (['7', '8', '9'].indexOf(x[0]) > -1) {
            if (x[0] === '9') x = '7' + x;
            let firstSymbols = '+7';
            if (x[0] === '8') firstSymbols = '8';

            let formattedValue = firstSymbols + ' ';

            if (x.length > 1) {
                formattedValue += '(' + x.substring(1, 4);
            }
            if (x.length >= 5) {
                formattedValue += ') ' + x.substring(4, 7);
            }
            if (x.length >= 8) {
                formattedValue += '-' + x.substring(7, 9);
            }
            if (x.length >= 10) {
                formattedValue += '-' + x.substring(9, 11);
            }

            e.target.value = formattedValue;
        } else {
            e.target.value = '+' + x.substring(0, 15);
        }
    });

    phoneInput.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace') {
            const val = e.target.value;
            if (val === '+7 ' || val === '+7' || val === '8 ' || val === '8') {
                e.target.value = '';
                e.preventDefault();
            }
        }
    });

    const telegramInput = document.getElementById('seller_contact_telegram');
    telegramInput.addEventListener('input', function () {
        let val = this.value.trim();
        if (val.length > 0 && !val.startsWith('@')) {
            this.value = '@' + val;
        }
    });
}

function renderSaleCard(p) {
    const isOwner = String(p.seller_id) === String(window.currentUser.id);
    let actionButtons = '';
    if (isOwner) {
        actionButtons = `
            <div class="sales-btn-wrapper">
                <button class="sales-btn" data-action="edit" data-id="${escapeHtml(p.id)}">Изменить</button>
                <button class="sales-btn red" data-action="delete" data-id="${escapeHtml(p.id)}">Удалить</button>
            </div>
        `;
    }

    return `
        <article class="sales-card" data-id="${escapeHtml(p.id)}">
            <div class="sales-card-body">
                <h3 class="sales-card-title">${escapeHtml(p.title)}</h3>
                <img class="sales-card-media" alt="${escapeHtml(p.title)}" src="${p.image || 'pupupu.png'}">
                <p class="sales-card-description">${escapeHtml(p.description)}</p>
                <p class="sales-price">${escapeHtml(p.price)} ₽</p>
                <p class="sales-stock">${escapeHtml(p.stock)} шт</p>
                ${p.seller_contact ? `<p class="sales-seller-contact">${escapeHtml(p.seller_contact)}</p>` : ''}
                ${p.seller_contact_telegram ? `<p class="sales-seller-contact-telegram">${escapeHtml(p.seller_contact_telegram)}</p>` : ''}
                ${actionButtons}
            </div>
        </article>
    `;
}

export async function renderSales() {
    const panel = document.querySelector('.sales-container');
    document.getElementById('products-grid')?.remove();

    const products = await getProducts();
    const currentUserId = window.currentUser.id;
    products.sort((a, b) => {
        const aIsOwner = String(a.seller_id) === String(currentUserId);
        const bIsOwner = String(b.seller_id) === String(currentUserId);
        if (aIsOwner && !bIsOwner) return -1;
        if (!aIsOwner && bIsOwner) return 1;
        return 0;
    });

    panel.innerHTML += `
        <div id="products-grid" class="sales-grid">
            ${products.map((p) => renderSaleCard(p)).join('')}
        </div>
    `;

    initEventListeners(panel, products);
}
