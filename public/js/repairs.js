import { getRepairCalendar, bookRepair, cancelBooking } from './api.js';
import { generateCalendarDays, renderNotification } from './utils.js';

const TIME_BLOCKS = ['09-12', '12-15', '15-18', '18-21'];
const MAX_BOOKINGS = 4;

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        weekday: 'short', day: 'numeric', month: 'short'
    });
}

function getSpecialistLabel(specialist) {
    return {
        plumber: 'Сантехник',
        electrician: 'Электрик',
        carpenter: 'Плотник'
    }[specialist];
}

function getStatusLabel(status) {
    return {
        pending: '⏳ Ожидает',
        accepted: '✅ Принято',
        rejected: '❌ Отклонено',
        completed: '🎉 Выполнено',
        cancelled: '🚫 Отменено'
    }[status];
}

function getTimeLabel(block) {
    return {
        '09-12': '🌅 Утро (09:00–12:00)',
        '12-15': '☀️ День (12:00–15:00)',
        '15-18': '🌤️ Вечер (15:00–18:00)',
        '18-21': '🌙 Поздний вечер (18:00–21:00)'
    }[block];
}

async function renderStudentCalendar(specialist) {
    const container = document.getElementById('calendar-content');
    container.innerHTML = '<div class="loading">Загрузка календаря...</div>';

    try {
        const bookings = await getRepairCalendar();
        const days = generateCalendarDays();

        const specialistBookings = bookings[specialist];

        let html = `<div class="calendar-grid-wrapper">`;


        html += `<div class="calendar-weekdays">
            <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
        </div>`;

        html += `<div class="calendar-grid">`;

        days.forEach(day => {
            const dateObj = new Date(day);
            const dayBookings = specialistBookings[day] || {};

            const hasUserBooking = TIME_BLOCKS.some(time =>
                dayBookings[time]?.some(b => b.user_id === window.currentUser.id)
            );

            let totalFree = 0;
            TIME_BLOCKS.forEach(time => {
                const slots = dayBookings[time] || [];
                totalFree += (MAX_BOOKINGS - slots.length);
            });

            let dayClass = 'calendar-day';
            if (hasUserBooking) dayClass += ' has-booking';
            else if (totalFree === 0) dayClass += ' is-full';
            else if (totalFree < MAX_BOOKINGS * TIME_BLOCKS.length) dayClass += ' is-partial';

            html += `
                <div class="${dayClass}" data-date="${day}">
                    <div class="day-number">${dateObj.getDate()}</div>
                    <div class="day-name">${dateObj.toLocaleDateString('ru-RU', { weekday: 'short' })}</div>
                    ${hasUserBooking ? '<div class="booking-indicator">●</div>' : ''}
                </div>
            `;
        });

        html += `</div></div>`;

        html += `<div id="day-details-panel" class="day-details-panel hidden"></div>`;

        container.innerHTML = html;

        initCalendarGridEvents(specialistBookings);

    } catch (error) {
        console.log(error);
    }
}

function initCalendarGridEvents(specialistBookings) {
    const dayCells = document.querySelectorAll('.calendar-day');

    dayCells.forEach(cell => {
        cell.addEventListener('click', () => {
            const date = cell.dataset.date;

            dayCells.forEach(c => c.classList.remove('active'));
            cell.classList.add('active');

            renderDayDetails(date, specialistBookings[date] || {});
        });
    });
}

function renderDayDetails(date, dayBookings) {
    const panel = document.getElementById('day-details-panel');
    panel.classList.remove('hidden');

    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

    let slotsHtml = '';

    TIME_BLOCKS.forEach(time => {
        const slotBookings = dayBookings[time] || [];
        slotsHtml += renderTimeSlotDetail(date, time, slotBookings);
    });

    panel.innerHTML = `
        <div class="details-header">
            <h3>📅 ${formattedDate}</h3>
            <button class="btn btn-sm btn-text close-details">✕</button>
        </div>
        <div class="slots-list">
            ${slotsHtml}
        </div>
    `;

    panel.querySelector('.close-details').addEventListener('click', () => {
        panel.classList.add('hidden');
        document.querySelectorAll('.calendar-day').forEach(c => c.classList.remove('active'));
    });

    initSlotActions();
}

function renderTimeSlotDetail(day, time, slotBookings) {
    const freeSpots = MAX_BOOKINGS - slotBookings.length;
    const myBooking = slotBookings.find(b => b.user_id === window.currentUser.id);

    if (myBooking) {
        return `
            <div class="slot-detail-card booked">
                <div class="slot-info">
                    <strong>${getTimeLabel(time)}</strong>
                    <span class="status-badge status-${myBooking.status}">${getStatusLabel(myBooking.status)}</span>
                </div>
                <p class="problem-text">${myBooking.problem_description}</p>
                ${myBooking.status === 'pending' ?
                `<button class="btn btn-sm btn-cancel" data-booking-id="${myBooking.id}">Отменить запись</button>`
                : ''}
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

function initSlotActions() {
    document.querySelectorAll('#day-details-panel .btn-primary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openBookingModal(btn.dataset.date, btn.dataset.block);
        });
    });

    document.querySelectorAll('#day-details-panel .btn-cancel').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('Отменить запись?')) return;
            try {
                await cancelBooking(btn.dataset.bookingId);
                renderNotification('Запись отменена', 'success');
                const specialist = document.getElementById('specialist-select').value;
                renderStudentCalendar(specialist);
            } catch (error) {
                renderNotification('Ошибка: ' + error.message);
            }
        });
    });
}

function initSpecialistFilter() {
    const select = document.getElementById('specialist-select');

    select.addEventListener('change', (e) => {
        const specialistId = e.target.value;
        renderStudentCalendar(specialistId);
    });
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
    modal.onclick = (e) => { if (e.target === modal) close(); };

    modal.querySelector('#bookForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            await bookRepair({
                slot_date: date,
                time_block: block,
                specialization: specialist,
                problem_description: fd.get('problem_description')
            });
            renderNotification('✅ Заявка отправлена!', 'success');
            close();
            renderShifts();
        } catch (error) {
            console.log(error);
            renderNotification('❌ ' + error.message);
        }
    };
}

export async function renderShifts() {
    initSpecialistFilter();

    const specialist = document.getElementById('specialist-select').value;
    await renderStudentCalendar(specialist);
}

