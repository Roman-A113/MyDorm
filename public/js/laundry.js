import { getLaundrySlots, bookLaundry, cancelLaundry } from './api.js';
import { renderNotification } from './utils.js';

export async function renderLaundry() {
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
                    console.log(error);
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
                    console.log(error);
                    renderNotification(error.message);
                }
            });
        });

    } catch (error) {
        console.log(error);
        renderNotification('Не удалось получить слоты стирки: ' + error.message);
    }
}