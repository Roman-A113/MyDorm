import { getAllLaundryBookings, bookLaundry, cancelLaundry } from './api.js';
import { generateCalendarDays, renderCalendarGrid, setupCalendarClicks, DAY_STATUS, LAUNDRY_TIME_SLOTS, LAUNDRY_MACHINES } from './utils.js';

const CALENDAR_CONTAINER_ID = 'calendar-content-laundry';
const SLOTS_CONTAINER_ID = 'laundry-slots-list';

let allLaundryBookings = {};
let selectedSlots = new Set();

const SLOTS_PER_MACHINE = LAUNDRY_TIME_SLOTS.length;

function getLaundryDayStatus(machineId, dateStr, allLaundryBookings) {
    const bookingsForDay = allLaundryBookings[machineId][dateStr];

    let bookedCount = 0;
    let hasMyBooking = false;

    for (const slotTime in bookingsForDay) {
        const bookingInfo = bookingsForDay[slotTime];
        if (Object.keys(bookingInfo).length > 0) {
            bookedCount++;
            if (bookingInfo.userId === window.currentUser.id) {
                hasMyBooking = true;
            }
        }
    }
    const freeSlots = SLOTS_PER_MACHINE - bookedCount;

    if (hasMyBooking) {
        return DAY_STATUS.MY_BOOKING;
    }
    if (freeSlots <= 0) {
        return DAY_STATUS.FULL;
    }
    return DAY_STATUS.DEFAULT;
}

function toggleSlotSelection(btn, slot) {
    btn.classList.toggle('selected');

    if (btn.classList.contains('selected')) {
        selectedSlots.add(slot);
    } else {
        selectedSlots.delete(slot);
    }

    updateBookingButton();
}

function updateBookingButton() {
    const btn = document.getElementById('book-btn');
    if (!btn) return;

    if (selectedSlots.size > 0) {
        btn.style.display = 'block';
        btn.textContent = `Забронировать (${selectedSlots.size})`;
    } else {
        btn.style.display = 'none';
    }
}

async function handleCancelBooking(selectedMachineId, selectedDate, bookingId, time) {
    if (!confirm(`Отменить бронь на ${time}?`))
        return;

    await cancelLaundry(bookingId);
    allLaundryBookings = await getAllLaundryBookings();
    renderLaundryCalendar(selectedMachineId);
    renderSlotsList(selectedMachineId, selectedDate);
}

async function handleBookingSubmit(selectedMachineId, selectedDate) {
    const slotsArray = Array.from(selectedSlots).sort();

    await bookLaundry(selectedMachineId, selectedDate, slotsArray);
    alert('Успешно забронировано!');

    allLaundryBookings = await getAllLaundryBookings();
    selectedSlots.clear();
    renderLaundryCalendar(selectedMachineId);
    renderSlotsList(selectedMachineId, selectedDate);
}

function renderSlotsList(selectedMachineId, dateStr) {
    selectedSlots.clear();
    const container = document.getElementById(CALENDAR_CONTAINER_ID);

    const oldList = document.getElementById(SLOTS_CONTAINER_ID);
    if (oldList) oldList.remove();
    const oldBtn = document.getElementById('book-btn');
    if (oldBtn) oldBtn.remove();

    if (!selectedMachineId) {
        container.insertAdjacentHTML('beforeend', '<p style="margin-top:10px; color:#666;">Выберите машинку сверху, чтобы увидеть расписание.</p>');
        return;
    }

    const listContainer = document.createElement('div');
    listContainer.id = SLOTS_CONTAINER_ID;
    listContainer.className = 'slots-list-container';

    const bookingsForDay = allLaundryBookings[selectedMachineId][dateStr];

    LAUNDRY_TIME_SLOTS.forEach(slot => {
        const btn = document.createElement('button');
        btn.className = 'slot-item';
        btn.innerHTML = `<span>${slot}</span>`;

        const bookingInfo = bookingsForDay[slot];

        if (Object.keys(bookingInfo).length === 0) {
            btn.onclick = () => toggleSlotSelection(btn, slot);
        } else {
            if (bookingInfo.userId === window.currentUser.id) {
                btn.classList.add('my-booking');
                btn.onclick = () => handleCancelBooking(selectedMachineId, dateStr, bookingInfo.bookingId, slot);
            } else {
                btn.disabled = true;
            }
        }

        listContainer.appendChild(btn);
    });

    container.appendChild(listContainer);
    const btn = document.createElement('button');
    btn.id = 'book-btn';
    btn.textContent = 'Забронировать выбранные слоты';
    btn.style.display = 'none';
    btn.onclick = () => handleBookingSubmit(selectedMachineId, dateStr);
    container.appendChild(btn);
}

function renderLaundryCalendar(selectedMachineId) {
    const container = document.getElementById(CALENDAR_CONTAINER_ID);
    container.innerHTML = renderCalendarGrid(generateCalendarDays(), (dateStr) => getLaundryDayStatus(selectedMachineId, dateStr, allLaundryBookings));
    setupCalendarClicks(CALENDAR_CONTAINER_ID, (dateStr) => renderSlotsList(selectedMachineId, dateStr));
}

function initMachineFilter() {
    const container = document.getElementById('laundry-select');

    LAUNDRY_MACHINES.forEach(machine => {
        const option = document.createElement('option');
        option.value = machine.id;
        option.textContent = machine.name;
        container.appendChild(option);
    });

    container.addEventListener('change', (e) => {
        let selectedMachineId = +e.target.value;
        renderLaundryCalendar(selectedMachineId);
    });
}

export async function renderLaundry() {
    initMachineFilter();
    allLaundryBookings = await getAllLaundryBookings();
    const selectedMachineId = document.getElementById('laundry-select').value;
    renderLaundryCalendar(selectedMachineId);
}