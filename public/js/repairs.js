import { getRepairCalendar, bookRepair, cancelBooking, updateRepairStatus } from './api.js';
import {
    generateCalendarDays,
    renderNotification,
    renderCalendarGrid,
    setupCalendarClicks,
    DAY_STATUS,
    MAX_REPAIR_BOOKINGS,
    REPAIR_TIME_BLOCKS,
    REPAIR_SPECIALISTS,
} from './utils.js';

const CALENDAR_CONTAINER_ID = 'calendar-content-repair';
const PANEL_ID = 'panel-repair';

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function getSpecialistLabel(specialist) {
    return {
        plumber: 'Сантехник',
        electrician: 'Электрик',
        carpenter: 'Плотник',
    }[specialist];
}

function getStatusLabel(status) {
    return {
        pending: '⏳ Ожидает',
        accepted: '✅ Принято',
        rejected: '❌ Отклонено',
        completed: '🎉 Выполнено',
        cancelled: '🚫 Отменено',
    }[status];
}

function getTimeLabel(block) {
    return {
        '09-12': '🌅 Утро (09:00–12:00)',
        '12-15': '☀️ День (12:00–15:00)',
        '15-18': '🌤️ Вечер (15:00–18:00)',
        '18-21': '🌙 Поздний вечер (18:00–21:00)',
    }[block];
}

function getRepairDayStatus(dateStr, specialistBookings) {
    const dayBookings = specialistBookings[dateStr] || {};

    const hasUserBooking = REPAIR_TIME_BLOCKS.some((time) =>
        dayBookings[time]?.some((b) => b.user_id === window.currentUser.id),
    );

    if (hasUserBooking) {
        return DAY_STATUS.MY_BOOKING;
    }

    let totalFree = 0;
    REPAIR_TIME_BLOCKS.forEach((time) => {
        const slots = dayBookings[time] || [];
        totalFree += MAX_REPAIR_BOOKINGS - slots.length;
    });

    if (totalFree <= 0) {
        return DAY_STATUS.FULL;
    }

    return DAY_STATUS.DEFAULT;
}

function renderTimeSlot(day, time, slotBookings) {
    const freeSpots = MAX_REPAIR_BOOKINGS - slotBookings.length;
    const myBooking = slotBookings.find((b) => b.user_id === window.currentUser.id);

    if (myBooking) {
        return `
            <div class="slot-detail-card booked">
                <div class="slot-info">
                    <strong>${getTimeLabel(time)}</strong>
                    <span class="status-badge status-${myBooking.status}">${getStatusLabel(myBooking.status)}</span>
                </div>
                <p class="problem-text">${myBooking.problem_description}</p>
                <div class="booking-info">
                    <p>Номер комнаты:</p>
                    <span class="room-number">${myBooking.room_number}</span>
                </div>
                ${
                    myBooking.status === 'pending'
                        ? `<button class="btn btn-sm btn-cancel" data-booking-id="${myBooking.id}">Отменить запись</button>`
                        : ''
                }
            </div>
        `;
    }

    if (freeSpots <= 0) {
        return `
            <div class="slot-detail-card full">
                <div class="slot-info">
                    <strong>${getTimeLabel(time)}</strong>
                    <span class="text-muted">Мест нет</span>
                </div>
            </div>
        `;
    }

    return `
        <div class="slot-detail-card available">
            <div class="slot-info">
                <strong>${getTimeLabel(time)}</strong>
                <span class="text-success">Свободно: ${freeSpots}</span>
            </div>
            <button class="btn btn-sm btn-primary" data-date="${day}" data-block="${time}">
                Записаться
            </button>
        </div>
    `;
}

function openBookingModal(date, block) {
    const specialist = document.getElementById('specialist-select').value;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h4>📝 Запись на ремонт: ${getSpecialistLabel(specialist)}</h4>
            <p><b>Дата:</b> ${formatDisplayDate(date)}</p>
            <p><b>Время:</b> ${getTimeLabel(block)}</p>
            <form id="bookForm" class="simple-form">
                <label>Проблема:
                    <textarea name="problem_description" required placeholder="Опишите проблему..."></textarea>
                </label>
                <label>Номер комнаты:
                    <input type="number" name="room_number" required placeholder="100" min="0" max="999"></input>
                </label>
                <div class="modal-actions">
                    <button type="button" class="btn btn-cancel modal-close">Отмена</button>
                    <button type="submit" class="btn btn-primary">Записаться</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('.modal-close').onclick = close;
    modal.onclick = (e) => {
        if (e.target === modal) close();
    };

    const submitBtn = modal.querySelector('.btn.btn-primary');
    modal.querySelector('#bookForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            submitBtn.disabled = true;
            await bookRepair({
                slot_date: date,
                time_block: block,
                specialization: specialist,
                problem_description: fd.get('problem_description'),
                room_number: fd.get('room_number'),
            });
            submitBtn.disabled = false;
            renderNotification('Заявка отправлена!', 'success');
            close();
            const currentSpecialist = document.getElementById('specialist-select').value;
            renderStudentRepairCalendar(currentSpecialist);
        } catch (error) {
            console.log(error);
            renderNotification('❌ ' + error.message);
        }
    };
}

function initStudentRepairSlotActions() {
    const panel = document.getElementById(PANEL_ID);

    panel.querySelectorAll('.btn-primary').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openBookingModal(btn.dataset.date, btn.dataset.block);
        });
    });

    panel.querySelectorAll('.btn-cancel').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('Отменить запись?')) return;
            await cancelBooking(btn.dataset.bookingId);
            renderNotification('Запись отменена', 'success');

            const specialist = document.getElementById('specialist-select').value;
            renderStudentRepairCalendar(specialist);
        });
    });
}

function renderStudentDayDetails(date, dayBookings) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    panel.classList.remove('hidden');

    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    let slotsHtml = '';

    REPAIR_TIME_BLOCKS.forEach((time) => {
        const slotBookings = dayBookings[time] || [];
        slotsHtml += renderTimeSlot(date, time, slotBookings);
    });

    panel.innerHTML = `
        <div class="details-header">
            <h3>📅 ${formattedDate}</h3>
            <button class="btn btn-sm btn-text close-details" aria-label="Закрыть">✕</button>
        </div>
        <div class="slots-list">
            ${slotsHtml}
        </div>
    `;

    panel.querySelector('.close-details').addEventListener('click', () => {
        panel.classList.add('hidden');
        const calendarContainer = panel.parentElement;
        if (calendarContainer) {
            calendarContainer.querySelectorAll('.calendar-day').forEach((c) => {
                c.classList.remove('active');
            });
        }
    });

    initStudentRepairSlotActions();
}

export async function renderStudentRepairCalendar(specialist) {
    const container = document.getElementById(CALENDAR_CONTAINER_ID);

    const allBookings = await getRepairCalendar();
    const specialistBookings = allBookings[specialist];

    const rawDays = generateCalendarDays();

    const getStatusCallback = (dateStr) => getRepairDayStatus(dateStr, specialistBookings);

    container.innerHTML = `
            ${renderCalendarGrid(rawDays, getStatusCallback)}
            <div id="${PANEL_ID}" class="day-details-panel hidden"></div>
        `;

    setupCalendarClicks(CALENDAR_CONTAINER_ID, (dateStr) => {
        renderStudentDayDetails(dateStr, specialistBookings[dateStr]);
    });
}

async function renderWorkerRepairCalendar(specialist) {
    const container = document.getElementById(CALENDAR_CONTAINER_ID);
    const allBookings = await getRepairCalendar();
    const specialistBookings = allBookings[specialist];

    const getStatusCallback = (dateStr) => {
        const dayData = specialistBookings[dateStr] || {};
        let hasPending = false;
        Object.values(dayData).forEach((slots) => {
            if (slots.some((b) => b.status === 'pending')) hasPending = true;
        });
        return hasPending ? DAY_STATUS.MY_BOOKING : DAY_STATUS.DEFAULT;
    };

    container.innerHTML = `
                ${renderCalendarGrid(generateCalendarDays(), getStatusCallback)}
                <div id="${PANEL_ID}" class="day-details-panel hidden"></div>`;

    setupCalendarClicks(CALENDAR_CONTAINER_ID, (dateStr) => {
        renderWorkerDayDetails(dateStr, specialistBookings[dateStr]);
    });
}

function isWorker(user) {
    return user && ['plumber', 'electrician', 'carpenter'].includes(user.role);
}

function renderRequestSlot(req) {
    return `<div class="request-card status-${req.status}"><div class="req-header">
                <span class="req-time"><strong>${getTimeLabel(req.time_block)}</strong></span>
                <span class="req-status">${getStatusLabel(req.status)}</span>
                </div>
                    <div class="req-body">
                        <p><strong>Студент ID:</strong> ${req.user_id}</p>
                        <p class="problem-text">"${req.problem_description}"</p>
                    </div>
                    <div class="booking-info">
                        <p>Номер комнаты:</p>
                        <span class="room-number">${req.room_number}</span>
                    </div>
                    <div class="req-actions">
                        ${renderWorkerActionButtons(req)}
                    </div>
                </div>`;
}

function renderWorkerDayDetails(date, dayBookings) {
    const panel = document.getElementById(PANEL_ID);

    panel.classList.remove('hidden');

    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    let allRequests = [];
    REPAIR_TIME_BLOCKS.forEach((time) => {
        const bookings = dayBookings[time] || [];
        bookings.forEach((b) => {
            allRequests.push({ ...b, time_block: time });
        });
    });

    allRequests.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
    });

    let contentHtml = '';

    if (allRequests.length === 0) {
        contentHtml = `<div class="empty-state" style="padding: 20px; text-align: center; color: #777;">На ${formattedDate} заявок нет 🎉</div>`;
    } else {
        contentHtml = `<div class="worker-requests-list">`;
        allRequests.forEach((req) => {
            contentHtml += renderRequestSlot(req);
        });
        contentHtml += `</div>`;
    }

    panel.innerHTML = `
        <div class="details-header">
            <h3>📅 ${formattedDate}</h3>
            <button class="btn btn-sm btn-text close-details" aria-label="Закрыть">✕</button>
        </div>
        ${contentHtml}
    `;

    panel.querySelector('.close-details').addEventListener('click', () => {
        panel.classList.add('hidden');
        const calendarContainer = panel.parentElement;
        if (calendarContainer) {
            calendarContainer.querySelectorAll('.calendar-day').forEach((c) => {
                c.classList.remove('active');
            });
        }
    });
    initWorkerActions();
}

function initWorkerActions() {
    const panel = document.getElementById(PANEL_ID);

    panel.querySelectorAll('.req-actions button').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const newStatus = btn.dataset.status;

            await updateRepairStatus(id, newStatus);
            renderNotification('Статус обновлен', 'success');

            await renderShifts();
        });
    });
}

function renderWorkerActionButtons(req) {
    if (req.status === 'pending') {
        return `
            <button class="btn btn-sm btn-accept" data-id="${req.id}" data-status="accepted">Принять</button>
            <button class="btn btn-sm btn-reject" data-id="${req.id}" data-status="rejected">Отклонить</button>
        `;
    }
    if (req.status === 'accepted') {
        return `
            <button class="btn btn-sm btn-complete" data-id="${req.id}" data-status="completed">Выполнено</button>
            <button class="btn btn-sm btn-reset" data-id="${req.id}" data-status="pending">Вернуть</button>
        `;
    }
    if (req.status === 'completed' || req.status === 'rejected' || req.status === 'cancelled') {
        return `<button class="btn btn-sm btn-reset" data-id="${req.id}" data-status="pending">Вернуть в ожидание</button>`;
    }
    return '';
}

function initSpecialistFilter() {
    const container = document.getElementById('shifts');
    const filterDiv = document.createElement('div');
    filterDiv.className = 'filter';

    const label = document.createElement('label');
    label.htmlFor = 'specialist-select';
    label.textContent = '🔧 Специалист:';

    const select = document.createElement('select');
    select.id = 'specialist-select';
    select.className = 'form-select';

    REPAIR_SPECIALISTS.forEach((specialist) => {
        const option = document.createElement('option');
        option.value = specialist.id;
        option.textContent = specialist.name;
        select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
        const specialistId = e.target.value;
        renderStudentRepairCalendar(specialistId);
    });

    filterDiv.appendChild(label);
    filterDiv.appendChild(select);
    container.prepend(filterDiv);
}

export async function renderShifts() {
    if (isWorker(window.currentUser)) {
        const specialist = window.currentUser.role;
        await renderWorkerRepairCalendar(specialist);
    } else {
        initSpecialistFilter();
        const specialist = document.getElementById('specialist-select').value;
        await renderStudentRepairCalendar(specialist);
    }
}
