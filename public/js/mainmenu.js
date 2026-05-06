import { renderAnnouncements } from './announcements.js';
import { renderLaundry } from './laundry.js';
import { renderShifts } from './repairs.js';
import { renderNotification } from './utils.js';
import { getCurrentUser } from './api.js';
import { renderSales } from './sales.js';
import { renderEvents } from './events.js';

function initLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
}

function switchTab(tabKey) {
    document.querySelectorAll('.tabBtn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === tabKey);
    });
    document.querySelectorAll('.tab').forEach((tab) => {
        tab.classList.toggle('active', tab.id === tabKey);
        tab.classList.toggle('hidden', tab.id !== tabKey);
    });
}

function initTabs() {
    document.querySelectorAll('.tabBtn').forEach((btn) => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

async function loadMainMenu() {
    try {
        const profile = await getCurrentUser();
        window.currentUser = profile;
        document.querySelector('.topbar h1').textContent = `${profile.name} (${profile.role})`;

        if (window.currentUser.role !== 'student' && window.currentUser.role !== 'admin') {
            document.querySelector(`.tabBtn[data-tab="laundry"]`).style.display = 'none';
            document.querySelector(`.tabBtn[data-tab="events"]`).style.display = 'none';
            document.querySelector(`.tabBtn[data-tab="sales"]`).style.display = 'none';
        }
        await renderAnnouncements();
        await renderLaundry();
        await renderShifts();
        await renderSales();
        await renderEvents();
    } catch (error) {
        console.log(error);
        renderNotification('Ошибка загрузки дашборда: ' + error.message);
        if (error.message.includes('401')) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initLogout();
    loadMainMenu();
});
