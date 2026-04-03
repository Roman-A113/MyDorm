import { renderAnnouncements } from './announcements.js';
import { renderLaundry } from './laundry.js';
import { renderShifts } from './repairs.js';
import { renderNotification } from './utils.js';
import { getCurrentUser } from './api.js';

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

        await renderAnnouncements();
        await renderLaundry();
        await renderShifts();
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
