import { getRepairCalendar, bookRepair, cancelBooking } from "./api.js";
import {
    generateCalendarDays,
    renderNotification,
    renderCalendarGrid,
    setupCalendarClicks,
    DAY_STATUS,
    MAX_REPAIR_BOOKINGS,
    REPAIR_TIME_BLOCKS,
    REPAIR_SPECIALISTS,
} from "./utils.js";

const CALENDAR_CONTAINER_ID = "calendar-content-repair";
const PANEL_ID = "panel-repair";

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

function getSpecialistLabel(specialist) {
    return {
        plumber: "Сантехник",
        electrician: "Электрик",
        carpenter: "Плотник",
    }[specialist];
}

function getStatusLabel(status) {
    return {
        pending: "⏳ Ожидает",
        accepted: "✅ Принято",
        rejected: "❌ Отклонено",
        completed: "🎉 Выполнено",
        cancelled: "🚫 Отменено",
    }[status];
}

function getTimeLabel(block) {
    return {
        "09-12": "🌅 Утро (09:00–12:00)",
        "12-15": "☀️ День (12:00–15:00)",
        "15-18": "🌤️ Вечер (15:00–18:00)",
        "18-21": "🌙 Поздний вечер (18:00–21:00)",
    }[block];
}

function renderTimeSlot(day, time, slotBookings) {
    const freeSpots = MAX_REPAIR_BOOKINGS - slotBookings.length;
    const myBooking = slotBookings.find(
        (b) => b.user_id === window.currentUser.id,
    );

    if (myBooking) {
        return `
            <div class="slot-detail-card booked">
                <div class="slot-info">
                    <strong>${getTimeLabel(time)}</strong>
                    <span class="status-badge status-${myBooking.status}">${getStatusLabel(myBooking.status)}</span>
                </div>
                <p class="problem-text">${myBooking.problem_description}</p>
                ${
                    myBooking.status === "pending"
                        ? `<button class="btn btn-sm btn-cancel" data-booking-id="${myBooking.id}">Отменить запись</button>`
                        : ""
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
    const specialist = document.getElementById("specialist-select").value;
    const modal = document.createElement("div");
    modal.className = "modal";
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
    modal.querySelector(".modal-close").onclick = close;
    modal.onclick = (e) => {
        if (e.target === modal) close();
    };

    modal.querySelector("#bookForm").onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            await bookRepair({
                slot_date: date,
                time_block: block,
                specialization: specialist,
                problem_description: fd.get("problem_description"),
            });
            renderNotification("✅ Заявка отправлена!", "success");
            close();
            const currentSpecialist =
                document.getElementById("specialist-select").value;
            renderRepairCalendar(currentSpecialist);
        } catch (error) {
            console.log(error);
            renderNotification("❌ " + error.message);
        }
    };
}

function initRepairSlotActions() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    panel.querySelectorAll(".btn-primary").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            openBookingModal(btn.dataset.date, btn.dataset.block);
        });
    });

    panel.querySelectorAll(".btn-cancel").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!confirm("Отменить запись?")) return;
            try {
                await cancelBooking(btn.dataset.bookingId);
                renderNotification("Запись отменена", "success");

                const specialist =
                    document.getElementById("specialist-select").value;
                renderRepairCalendar(specialist);
            } catch (error) {
                renderNotification("Ошибка: " + error.message);
            }
        });
    });
}

function renderRepairDayDetails(date, dayBookings) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    panel.classList.remove("hidden");

    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    let slotsHtml = "";

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

    panel.querySelector(".close-details").addEventListener("click", () => {
        panel.classList.add("hidden");
        const calendarContainer = panel.parentElement;
        if (calendarContainer) {
            calendarContainer.querySelectorAll(".calendar-day").forEach((c) => {
                c.classList.remove("active");
            });
        }
    });

    initRepairSlotActions();
}

function initSpecialistFilter() {
    const select = document.getElementById("specialist-select");

    REPAIR_SPECIALISTS.forEach((specialist) => {
        const option = document.createElement("option");
        option.value = specialist.id;
        option.textContent = specialist.name;
        select.appendChild(option);
    });

    select.addEventListener("change", (e) => {
        const specialistId = e.target.value;
        renderRepairCalendar(specialistId);
    });
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

export async function renderRepairCalendar(specialist) {
    const container = document.getElementById(CALENDAR_CONTAINER_ID);
    if (!container) return;

    container.innerHTML = '<div class="loading">Загрузка календаря...</div>';

    try {
        const allBookings = await getRepairCalendar();
        const specialistBookings = allBookings[specialist];

        const rawDays = generateCalendarDays();

        const getStatusCallback = (dateStr) =>
            getRepairDayStatus(dateStr, specialistBookings);

        container.innerHTML = `
            ${renderCalendarGrid(rawDays, getStatusCallback)}
            <div id="${PANEL_ID}" class="day-details-panel hidden"></div>
        `;

        setupCalendarClicks(CALENDAR_CONTAINER_ID, (dateStr) => {
            renderRepairDayDetails(dateStr, specialistBookings[dateStr]);
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

export async function renderShifts() {
    initSpecialistFilter();
    const specialist = document.getElementById("specialist-select").value;
    await renderRepairCalendar(specialist);
}
