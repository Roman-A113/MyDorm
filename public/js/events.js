import { getEvents, createEvent, joinEvent, leaveEvent, deleteEvent, updateEvent } from './api.js';
import { renderNotification } from './utils.js';

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

function showCreateEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('event-form');

    document.getElementById('event-create-btn').style.display = 'block';
    document.getElementById('event-update-btn').style.display = 'none';

    modal.classList.add('hidden');
    form.reset();
}

function fillFormWithEventData(event) {
    const form = document.getElementById('event-form');
    document.getElementById('eventModal').querySelector('h4').textContent = 'Редактировать мероприятие';
    form.querySelector('[name="title"]').value = event.title;
    form.querySelector('[name="description"]').value = event.description;

    const d = new Date(new Date(event.event_date).getTime() + 18000000);
    form.querySelector('[name="event_date"]').value = d.toISOString().slice(0, 16);

    form.querySelector('[name="location"]').value = event.location;

    document.getElementById('event-create-btn').style.display = 'none';
    document.getElementById('event-update-btn').style.display = 'block';

    let hiddenId = form.querySelector('input[name="event_id"]');
    hiddenId.value = event.id;
}

let isModalInitialized = false;
function setupModalEventListeners() {
    if (isModalInitialized) return;

    const closeBtn = document.querySelector('#eventModal .close-modal');
    closeBtn.addEventListener('click', closeEventModal);

    const modal = document.getElementById('eventModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEventModal();
        }
    });

    const form = document.getElementById('event-form');

    const createBtn = document.getElementById('event-create-btn');
    createBtn.addEventListener('click', async (e) => {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        e.preventDefault();
        const fd = new FormData(form);

        createBtn.disabled = true;
        const { id } = await createEvent(fd);
        await joinEvent(id);
        createBtn.disabled = false;
        renderNotification('Мероприятие создано', 'success');
        closeEventModal();
        renderEvents();
    });

    const updateBtn = document.getElementById('event-update-btn');
    updateBtn.addEventListener('click', async (e) => {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        e.preventDefault();
        const eventId = form.querySelector('input[name="event_id"]')?.value;
        const fd = new FormData(form);

        updateBtn.disabled = true;
        await updateEvent(eventId, fd);
        updateBtn.disabled = false;
        renderNotification('Мероприятие изменено', 'success');
        closeEventModal();
        renderEvents();
    });
    isModalInitialized = true;
}

function setupCardEventListeners(events) {
    document.querySelectorAll('.delete-event-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            if (confirm('Вы действительно хотите удалить мероприятие?')) {
                const button = e.target.closest('.delete-event-btn');
                const eventId = parseInt(button.dataset.id);
                await deleteEvent(eventId);
                renderNotification('Мероприятие удалено', 'success');
                renderEvents();
            }
        });
    });

    document.querySelectorAll('.edit-event-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            const button = e.target.closest('.edit-event-btn');
            const eventId = parseInt(button.dataset.id);

            let event = events.find((e) => e.id === eventId);
            fillFormWithEventData(event);
            showCreateEventModal();
        });
    });

    document.querySelectorAll('.join-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            const eventId = parseInt(e.target.dataset.id);
            await joinEvent(eventId);
            renderNotification('Вы успешно записались!', 'success');
            renderEvents();
        });
    });

    document.querySelectorAll('.leave-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            const eventId = parseInt(e.target.dataset.id);
            await leaveEvent(eventId);
            renderNotification('Запись отменена', 'success');
            renderEvents();
        });
    });

    document.querySelectorAll('.toggle-participants-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const eventId = e.target.dataset.id;
            const listDiv = document.getElementById(`participants-list-${eventId}`);

            if (listDiv.style.display === 'none') {
                listDiv.style.display = 'block';
                e.target.textContent = e.target.textContent.replace('Показать', 'Скрыть');
            } else {
                listDiv.style.display = 'none';
                e.target.textContent = e.target.textContent.replace('Скрыть', 'Показать');
            }
        });
    });

    const createBtn = document.getElementById('create-event-btn');
    createBtn.addEventListener('click', () => {
        document.getElementById('event-form').querySelector('h4').textContent = 'Создать мероприятие';
        showCreateEventModal();
    });
}

function renderEventCard(event, listContainer, isParticipant, isCreator) {
    const card = document.createElement('div');
    card.className = 'event-card';

    const participantsListHtml =
        event.participants.length > 0
            ? '<ul>' + event.participants.map((p) => `<li>${escapeHtml(p.name)}</li>`).join('') + '</ul>'
            : '<p>Пока никто не записался.</p>';

    const btnText = isParticipant ? 'Отменить запись' : 'Участвовать';
    const btnClass = isParticipant ? 'leave-btn' : 'join-btn';

    card.innerHTML = `
        ${
            isCreator || window.currentUser.role === 'admin'
                ? `
            <button class="delete-event-btn" data-id="${event.id}" title="Удалить мероприятие">
                <img src="${'/images/delete-193.png'}" alt="Удалить" />
            </button>`
                : ''
        }
        ${
            isCreator
                ? `<button class="edit-event-btn" data-id="${event.id}" title="Редактировать мероприятие">
                <img src="${'/images/edit_4218.webp'}" alt="Редактировать" />
        </button>`
                : ''
        }
        

        <h5>${escapeHtml(event.title)}</h5>
        <img class="event-image" alt="" src="${event.image_url}">
        <p><strong>Дата:</strong> ${formatDate(event.event_date)}</p>
        ${event.location ? `<p><strong>Место проведения:</strong> ${escapeHtml(event.location)}</p>` : ''}
        <p>${escapeHtml(event.description || '')}</p>
        
        <div class="event-actions">
            ${isCreator ? '' : `<button class="${btnClass}" data-id="${event.id}">${btnText}</button>`}
            <button class="toggle-participants-btn" data-id="${event.id}">
                Показать участников (${event.participants.length})
            </button>
        </div>
        
        <div id="participants-list-${event.id}" class="participants-list" style="display:none;">
            ${participantsListHtml}
        </div>
    `;

    listContainer.appendChild(card);
}

export async function renderEvents() {
    setupModalEventListeners();

    const panel = document.getElementById('events');
    panel.innerHTML = `
    <div class="header">
        <h3>Мероприятия</h3>
        <button id="create-event-btn" class="toggle-form-btn">+ Создать мероприятие</button>
    </div>
    <h4>Мои мероприятия:</h4>
    <div id="my-events-list" class="events-list"></div>
    <h4>Другие мероприятия:</h4>
    <div id="other-events-list" class="events-list"></div>`;

    document.getElementById('create-event-btn').addEventListener('click', showCreateEventModal);
    const myListContainer = document.getElementById('my-events-list');
    const otherlistContainer = document.getElementById('other-events-list');

    if (window.currentUser.role === 'admin') {
        myListContainer.style.display = 'none';
        document
            .getElementById('events')
            .querySelectorAll('h4')
            .forEach((el) => {
                el.style.display = 'none';
            });
        document.querySelector('#create-event-btn').style.display = 'none';
    }

    const events = await getEvents();
    const currentUserId = window.currentUser.id;
    const myEvents = events.filter((e) => e.creator_id === currentUserId);
    const otherEvents = events.filter((e) => e.creator_id !== window.currentUser.id);

    if (myEvents.length === 0) {
        myListContainer.innerHTML = '<div class="empty-message">Вы пока не создали мероприятий</div>';
    }

    if (otherEvents.length === 0) {
        otherlistContainer.innerHTML = '<div class="empty-message">Пока нет запланированных мероприятий</div>';
    }

    myEvents.forEach((event) => {
        const isParticipant = event.participants.some((p) => p.id === currentUserId);
        const isCreator = event.creator_id === currentUserId;
        renderEventCard(event, myListContainer, true, true);
    });

    otherEvents.forEach((event) => {
        const isParticipant = event.participants.some((p) => p.id === currentUserId);
        renderEventCard(event, otherlistContainer, isParticipant, false);
    });

    setupCardEventListeners(events);
}
