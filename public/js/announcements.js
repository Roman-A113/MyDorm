import { getAnnouncements, createAnnouncement, deleteAnnouncement } from './api.js';
import { renderNotification } from './utils.js';

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

function setupAnnouncementEventListeners() {
    document.querySelectorAll('.delete-announcement-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            if (confirm()) {
                let announcementId = btn.dataset.id;
                await deleteAnnouncement(announcementId);
                renderNotification('объявление удалено', 'success');
                renderAnnouncements();
            }
        });
    });
}

let isInitialized = false;

export async function renderAnnouncements() {
    const panel = document.getElementById('announcements');
    const panelCard = document.querySelector('.panel-card');
    const wrapper = document.querySelector('.announcements-wrapper');
    wrapper.innerHTML = '';
    const announcements = await getAnnouncements();

    if (window.currentUser?.role === 'admin') {
        panelCard.style.display = 'block';
    }

    wrapper.innerHTML = `<ul>${announcements
        .map(
            (a) =>
                `<li class="announcement">
                    ${`${
                        window.currentUser?.role === 'admin'
                            ? `<button class="delete-announcement-btn" data-id="${a.id}" title="Удалить объявление">
                            <img src="/images/delete-193.png" alt="Удалить">
                        </button>`
                            : ''
                    }`}
                    <b>${a.title}</b> – ${a.body} 
                    <span class="muted">${formatDate(a.published_at)}</span>
                </li>`,
        )
        .join('')}</ul>`;

    setupAnnouncementEventListeners();

    if (window.currentUser?.role === 'admin' && !isInitialized) {
        isInitialized = true;
        const form = document.getElementById('noticeCreateForm');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const fd = new FormData(form);
            try {
                await createAnnouncement({
                    title: fd.get('title'),
                    body: fd.get('body'),
                });
                renderNotification('Объявление опубликовано', 'success');
                form.reset();
                await renderAnnouncements();
            } catch (error) {
                console.log(error);
                renderNotification('Ошибка публикации объявления: ' + error.message);
            }
        });
    }
}
