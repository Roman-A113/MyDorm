async function renderLaundry() {
    const panel = document.getElementById('laundry');
    try {
        const slots = await getLaundrySlots();
        const tableRows = slots.map((slot) => {
            const actionCell = slot.is_booked_by_user
                ? `<button data-id="${slot.id}" class="btn btn-cancel cancelLaundry">Отменить</button>`
                : `<button data-id="${slot.id}" class="btn bookLaundry">Записаться</button>`;

            return `<tr>
                <td>${slot.slot_time}</td>
                <td>${slot.free_spots}</td>
                <td>${actionCell}</td>
            </tr>`;
        }).join('');

        panel.innerHTML = `<h3>Стирка</h3>
                <table class="simple-table">
                    <thead>
                        <tr>
                            <th>Время</th>
                            <th>Свободно мест</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>`;

        panel.querySelectorAll('.bookLaundry').forEach((btn) => {
            btn.addEventListener('click', async () => {
                try {
                    await bookLaundry(btn.dataset.id);
                    renderNotification('Вы успешно записались на стирку', 'success');
                    await renderLaundry();
                } catch (error) {
                    renderNotification(error.message);
                }
            });
        });

        panel.querySelectorAll('.cancelLaundry').forEach((btn) => {
            btn.addEventListener('click', async () => {
                try {
                    await cancelLaundry(btn.dataset.id);
                    renderNotification('Запись отменена', 'success');
                    await renderLaundry();
                } catch (error) {
                    renderNotification(error.message);
                }
            });
        });

    } catch (error) {
        renderNotification('Не удалось получить слоты стирки: ' + error.message);
    }
}

async function renderAnnouncements() {
    const panel = document.getElementById('announcements');
    const announcements = await getAnnouncements();

    let html = '<h3>Объявления</h3>';

    if (window.currentUser?.role === 'admin') {
        html += `
      <div class="panel-card">
        <h4>Создать объявление</h4>
        <form id="noticeCreateForm" class="simple-form">
          <label>Заголовок:<input name="title" required></label>
          <label>Текст:<textarea name="body" required></textarea></label>
          <button type="submit" class="btn">Опубликовать объявление</button>
        </form>
      </div>
    `;
    }

    html += `<ul>${announcements
        .map((a) => `<li><b>${a.title}</b> – ${a.body} <span class="muted">(${a.published_at})</span></li>`)
        .join('')}</ul>`;

    panel.innerHTML = html;

    if (window.currentUser?.role === 'admin') {
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
                renderNotification('Ошибка публикации объявления: ' + error.message);
            }
        });
    }
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
        renderNotification('Ошибка загрузки дашборда: ' + error.mesage);
        if (error.message.includes('401')) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }
}

const TIME_BLOCKS = ['09-12', '12-15', '15-18', '18-21'];
const MAX_BOOKINGS = 4;
const SPECIALIZATION_LABELS = {
    plumber: '🔧 Сантехник',
    electrician: '⚡ Электрик',
    carpenter: '🪚 Плотник',
};

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        weekday: 'short', day: 'numeric', month: 'short'
    });
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


function renderTimeSlot(day, time, slotBookings) {
    const freeSpots = MAX_BOOKINGS - slotBookings.length;
    const myBooking = slotBookings.find(b => b.user_id === window.currentUser.id);
    if (myBooking) {
        return `
            <div class="slot-card booked" data-booking-id="${myBooking.id}">
                <div class="slot-header">
                    <span class="slot-time">${getTimeLabel(time)}</span>
                    <span class="status-badge status-${getStatusLabel(myBooking.status)}">
                        ${getStatusLabel(myBooking.status)}
                    </span>
                </div>
                <p class="slot-problem">${myBooking.problem_description}</p>
                <button class="btn btn-sm btn-cancel" data-booking-id="${myBooking.id}">
                    Отменить
                </button>
            </div>
        `;
    }

    if (freeSpots == 0) {
        return `
            <div class="slot-card full">
                <div class="slot-header">
                    <span class="slot-time">${getTimeLabel(time)}</span>
                    <span class="status-full">🔴 Мест нет</span>
                </div>
            </div>
        `;
    }

    return `
        <div class="slot-card available" data-date="${day}" data-block="${time}">
            <div class="slot-header">
                <span class="slot-time">${getTimeLabel(time)}</span>
                <span class="free-spots">🟢 ${freeSpots} мест</span>
            </div>
            <button class="btn btn-sm btn-primary" data-date="${day}" data-block="${time}">
                Записаться
            </button>
        </div>
    `;
}

function renderDaySlotsRow(day, dayBookings) {
    let slotsHtml = '';

    TIME_BLOCKS.forEach(time => {
        const slotBookings = dayBookings[time];
        slotsHtml += renderTimeSlot(day, time, slotBookings);
    });

    return `
        <tr class="calendar-row-slots hidden" data-date="${day}">
            <td colspan="2">
                <div class="slots-container">${slotsHtml}</div>
            </td>
        </tr>
    `;
}


function createMyBookingsMap(myBookings) {
    const map = {};
    myBookings?.forEach(b => {
        map[`${b.slot_date}|${b.time_block}`] = b;
    });
    return map;
}

function renderDayHeaderRow(date) {
    return `
        <tr class="calendar-row" data-date="${date}">
            <td class="col-date">
                <button class="btn-toggle-day" data-date="${date}">
                    <span class="toggle-icon">▶</span>
                    <span class="date-text">${formatDisplayDate(date)}</span>
                </button>
            </td>
        </tr>
    `;
}

async function renderStudentCalendar(specialist) {
    const container = document.getElementById('calendar-content');

    container.innerHTML = '<div class="loading">Загрузка календаря...</div>';

    const bookings = await getRepairCalendar();
    const days = generateCalendarDays();

    let html = `
            <div class="calendar-wrapper">
                <table class="calendar-table">
                    <thead>
                        <tr>
                            <th class="col-date">Дата</th>
                            <th class="col-action">Действие</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    specialistBookings = bookings[specialist];

    days.forEach(day => {
        html += renderDayHeaderRow(day);

        const dayBookings = specialistBookings[day];
        html += renderDaySlotsRow(day, dayBookings);
    });

    html += `</tbody></table></div>`;

    container.innerHTML = html;

    initSpecialistFilter();
    initCalendarEvents();
}

async function renderShifts() {
    initSpecialistFilter();

    const specialist = document.getElementById('specialist-select').value;
    await renderStudentCalendar(specialist);
}


function initSpecialistFilter() {
    const select = document.getElementById('specialist-select');

    select.addEventListener('change', (e) => {
        const specialistId = e.target.value;
        renderStudentCalendar(specialistId);
    });
}


function initCalendarEvents() {
    // === Раскрыть/скрыть день ===
    document.querySelectorAll('.btn-toggle-day').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const date = btn.dataset.date;
            const row = document.querySelector(`.calendar-row[data-date="${date}"]`);
            const slotsRow = document.querySelector(`.calendar-row-slots[data-date="${date}"]`);

            row.classList.toggle('expanded');
            slotsRow.classList.toggle('hidden');

            // Поворот иконки
            const icon = btn.querySelector('.toggle-icon');
            icon.style.transform = row.classList.contains('expanded') ? 'rotate(90deg)' : 'rotate(0deg)';
        });
    });

    // === Записаться ===
    document.querySelectorAll('.slot-card.available .btn-primary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openBookingModal(btn.dataset.date, btn.dataset.block);
        });
    });

    // === Отменить запись ===
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('Отменить запись?'))
                return;
            try {
                await cancelBooking(btn.dataset.bookingId);
                renderNotification('Запись отменена', 'success');
                renderStudentCalendar();
            } catch (error) {
                renderNotification('Ошибка: ' + error.message);
            }
        });
    });
}

function openBookingModal(date, block) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h4>📝 Запись на ремонт</h4>
            <p><b>Дата:</b> ${formatDisplayDate(date)}</p>
            <p><b>Время:</b> ${getTimeLabel(block)}</p>
            <form id="bookForm" class="simple-form">
                <label>Специалист:
                    <select name="specialization" required>
                        <option value="plumber">🔧 Сантехник</option>
                        <option value="electrician">⚡ Электрик</option>
                        <option value="carpenter">🪚 Плотник</option>
                    </select>
                </label>
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
                specialization: fd.get('specialization'),
                problem_description: fd.get('problem_description')
            });
            renderNotification('✅ Заявка отправлена!', 'success');
            close();
            renderStudentCalendar();
        } catch (error) {
            renderNotification('❌ ' + error.message);
        }
    };
}

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

window.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initLogout();
    loadMainMenu();
});
