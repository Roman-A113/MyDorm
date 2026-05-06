import { getAllLaundryBookings, getRepairCalendar } from './api.js';
import { LAUNDRY_MACHINES, REPAIR_SPECIALISTS, REPAIR_TIME_BLOCKS } from './utils.js';
import { renderNotification } from './utils.js';

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function getMachineName(machineId) {
    const machine = LAUNDRY_MACHINES.find((item) => item.id === Number(machineId));
    return machine ? machine.name : `Машина ${machineId}`;
}

function getSpecialistName(specialistId) {
    const specialist = REPAIR_SPECIALISTS.find((item) => item.id === specialistId);
    return specialist ? specialist.name : specialistId;
}

function getRepairStatusLabel(status) {
    return (
        {
            pending: 'Ожидает',
            accepted: 'Принято',
            rejected: 'Отклонено',
            completed: 'Выполнено',
            cancelled: 'Отменено',
        }[status] || status
    );
}

function renderLaundrySection(laundryData) {
    const machines = Object.entries(laundryData || {});
    if (machines.length === 0) {
        return `<div class="section-card"><h3>Прачечная</h3><div class="empty-state">Нет данных о записях.</div></div>`;
    }

    let html = `<div class="section-card"><div class="section-header"><h3>Прачечная</h3></div>`;
    machines.forEach(([machineId, days]) => {
        const slots = [];
        Object.keys(days)
            .sort()
            .forEach((date) => {
                const daySlots = days[date];
                Object.keys(daySlots)
                    .sort()
                    .forEach((time) => {
                        const booking = daySlots[time];
                        if (booking && Object.keys(booking).length > 0) {
                            slots.push({
                                date,
                                time,
                                machineId,
                                userId: booking.userId,
                                bookingId: booking.bookingId,
                                name: booking.name,
                            });
                        }
                    });
            });

        if (slots.length > 0) {
            html += `
                <details class="admin-details" open>
                    <summary>${getMachineName(machineId)} (${slots.length})</summary>
                    <div class="admin-table-wrapper">
                        <table class="simple-table">
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Слот</th>
                                    <th>Id</th>
                                    <th>Имя</th>
                                    <th>Номер брони</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${slots
                                    .map(
                                        (row) =>
                                            `<tr><td data-label="Дата">${formatDate(row.date)}</td><td data-label="Слот">${row.time}</td><td data-label="Id">${row.userId}</td><td data-label="Имя">${row.name}</td><td data-label="Номер брони">${row.bookingId}</td></tr>`,
                                    )
                                    .join('')}
                            </tbody>
                        </table>
                    </div>
                </details>
            `;
        }
    });

    html += `</div>`;
    return html;
}

function renderRepairSection(repairData) {
    const entries = [];

    Object.entries(repairData || {}).forEach(([specialist, days]) => {
        Object.keys(days)
            .sort()
            .forEach((date) => {
                const blocks = days[date];
                Object.keys(blocks)
                    .sort((a, b) => REPAIR_TIME_BLOCKS.indexOf(a) - REPAIR_TIME_BLOCKS.indexOf(b))
                    .forEach((timeBlock) => {
                        const bookings = blocks[timeBlock] || [];
                        bookings.forEach((booking) => {
                            entries.push({
                                date,
                                specialist,
                                timeBlock,
                                studentName: booking.name,
                                room: booking.room_number || booking.room,
                                status: booking.status,
                                problem: booking.problem_description,
                                id: booking.id,
                            });
                        });
                    });
            });
    });

    if (entries.length === 0) {
        return `<div class="section-card"><h3>Ремонт</h3><div class="empty-state">Нет записей на ремонт.</div></div>`;
    }

    entries.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.specialist !== b.specialist) return a.specialist.localeCompare(b.specialist);
        return REPAIR_TIME_BLOCKS.indexOf(a.timeBlock) - REPAIR_TIME_BLOCKS.indexOf(b.timeBlock);
    });

    return `
        <div class="section-card">
            <div class="section-header"><h3>Ремонт</h3></div>
            <div class="admin-table-wrapper">
                <table class="simple-table">
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Специалист</th>
                            <th>Время</th>
                            <th>Студент</th>
                            <th>Комната</th>
                            <th>Статус</th>
                            <th>Проблема</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entries
                            .map(
                                (item) =>
                                    `<tr><td data-label="Дата">${formatDate(item.date)}</td><td data-label="Специалист">${getSpecialistName(item.specialist)}</td><td data-label="Время">${item.timeBlock}</td><td data-label="Студент">${item.studentName}</td><td data-label="Комната">${item.room || '-'}</td><td data-label="Статус">${getRepairStatusLabel(item.status)}</td><td data-label="Проблема">${item.problem || '-'}</td></tr>`,
                            )
                            .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

export async function renderAdminOverview() {
    const container = document.getElementById('admin-overview');
    if (!container) return;

    const [laundryData, repairData] = await Promise.all([getAllLaundryBookings(), getRepairCalendar()]);
    container.innerHTML = `
                <div class="admin-actions-bar">
                    <h3>Панель администрации</h3>
                </div>
                ${renderLaundrySection(laundryData)}
                ${renderRepairSection(repairData)}
            `;
}
