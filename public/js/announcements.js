import { getAnnouncements, createAnnouncement, deleteAnnouncement, updateAnnouncement } from './api.js';
import { renderNotification } from './utils.js';

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

function openCreateAnnouncementModal() {
    const modal = document.getElementById('announcementsModal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

function closeCreateAnnouncementModal() {
    const modal = document.getElementById('announcementsModal');
    modal.classList.remove('active');
    document.getElementById('noticeCreateForm').reset();

    document.getElementById('create-announcement-btn').style.display = 'block';
    document.getElementById('update-announcement-btn').style.display = 'none';
}

function fillFormWithProductData(announcement) {
    const form = document.getElementById('noticeCreateForm');
    form.querySelector('[name="title"]').value = announcement.title;
    form.querySelector('[name="body"]').value = announcement.body;

    document.getElementById('create-announcement-btn').style.display = 'none';
    document.getElementById('update-announcement-btn').style.display = 'block';

    let hiddenId = form.querySelector('input[name="announcement_id"]');
    hiddenId.value = announcement.id;
}

function setupModalEventListeners() {
    document.getElementById('toggleAddAnnouncement').addEventListener('click', openCreateAnnouncementModal);
    document.querySelector('.close-modal-announcements').addEventListener('click', closeCreateAnnouncementModal);

    const form = document.getElementById('noticeCreateForm');
    const btnCreate = document.getElementById('create-announcement-btn');
    btnCreate.addEventListener('click', async (event) => {
        event.preventDefault();
        const fd = new FormData(form);
        try {
            await createAnnouncement({
                title: fd.get('title'),
                body: fd.get('body'),
            });
            renderNotification('Объявление опубликовано', 'success');
            closeCreateAnnouncementModal();
            await renderAnnouncements();
        } catch (error) {
            console.log(error);
            renderNotification('Ошибка публикации объявления: ' + error.message);
        }
    });

    const btnUpdate = document.getElementById('update-announcement-btn');
    btnUpdate.addEventListener('click', async (e) => {
        e.preventDefault();
        const announcementId = form.querySelector('input[name="announcement_id"]')?.value;
        const fd = new FormData(form);

        btnUpdate.disabled = true;
        try {
            await updateAnnouncement(announcementId, {
                title: fd.get('title'),
                body: fd.get('body'),
            });
            renderNotification('Изменения сохранены', 'success');
            closeCreateAnnouncementModal();
            renderAnnouncements();
        } catch (error) {
            console.log(error);
            renderNotification('Ошибка изменения объявления: ' + error.message);
        }
        btnUpdate.disabled = false;
    });
}

function setupAnnouncementsEventListeners(announcements) {
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

    document.querySelectorAll('.edit-announcement-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            let announcementId = btn.dataset.id;
            const announcement = announcements.find((a) => a.id == announcementId);
            fillFormWithProductData(announcement);
            openCreateAnnouncementModal();
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

    wrapper.innerHTML = `<ul>${announcements
        .map(
            (a) =>
                `<li class="announcement">
            ${`${
                window.currentUser?.role === 'admin'
                    ? `<button class="delete-announcement-btn" data-id="${a.id}" title="Удалить объявление">
                <img src="/images/delete-193.png" alt="Удалить">
                </button>
                <button class="edit-announcement-btn" data-id="${a.id}" title="Редактировать мероприятие">
                <img src="${'/images/edit_4218.webp'}" alt="Редактировать" />
                </button>`
                    : ''
            }`}
            <b>${a.title}</b> – ${a.body} 
            <span class="muted">${formatDate(a.published_at)}</span>
            </li>`,
        )
        .join('')}</ul>`;

    if (window.currentUser.role === 'admin') {
        document.getElementById('toggleAddAnnouncement').style.display = 'block';
        setupAnnouncementsEventListeners(announcements);

        if (!isInitialized) {
            isInitialized = true;
            setupModalEventListeners();
        }
    }
}
