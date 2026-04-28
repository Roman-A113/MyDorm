import { getEvents, createEvent, joinEvent, leaveEvent, deleteEvent } from './api.js';
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

    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('evt-title').value;
        const description = form.querySelector('[name="description"]').value;
        const event_date = document.getElementById('evt-date').value;
        const location = document.getElementById('evt-loc').value;

        const { id } = await createEvent({ title, description, event_date, location });
        await joinEvent(id);
        renderNotification('Мероприятие создано', 'success');
        closeEventModal();
        renderEvents();
    });
    isModalInitialized = true;
}

function setupCardEventListeners() {
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
    createBtn.addEventListener('click', showCreateEventModal);
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
            isCreator
                ? `
            <button class="delete-event-btn" data-id="${event.id}" title="Удалить мероприятие">
                <img src="${'/images/delete-193.png'}" alt="Удалить" />
            </button>`
                : ''
        }

        <h3>${escapeHtml(event.title)}</h3>
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
            <h2> Мероприятия</h2 >
            <button id="create-event-btn" class="toggle-form-btn">+ Создать мероприятие</button>
        </div>
        <div id="events-list"></div>`;

    document.getElementById('create-event-btn').addEventListener('click', showCreateEventModal);

    const listContainer = document.getElementById('events-list');

    const events = await getEvents();
    const currentUserId = window.currentUser.id;

    if (events.length === 0) {
        listContainer.innerHTML = '<p>Пока нет запланированных мероприятий.</p>';
    }

    events.forEach((event) => {
        const isParticipant = event.participants.some((p) => p.id === currentUserId);
        const isCreator = event.creator_id === currentUserId;
        renderEventCard(event, listContainer, isParticipant, isCreator);
    });

    setupCardEventListeners();
}
