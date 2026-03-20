async function renderFeed() {
    const panel = document.getElementById('feed');
    panel.innerHTML = `
    <h3>Лента новостей</h3>
    <div class="feed-card"><strong>Новая стирка!</strong> Машина №2 доступна 16 марта, 19:00. Запись открыта.</div>
    <div class="feed-card"><strong>Плановое собрание</strong> 17 марта в 18:00, заездной холл. Каждый студент может предложить тему.</div>
    <div class="feed-card"><strong>Ремонт</strong> Плотник Иван добавил слот 18 марта, 10:00-12:00.</div>
  `;
}

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
                    await apiRequest(`/laundry/${btn.dataset.id}/book`, { method: 'POST' });
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
                    await apiRequest(`/laundry/${btn.dataset.id}/cancel`, { method: 'DELETE' });
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

async function renderShifts() {
    const panel = document.getElementById('shifts');
    const shifts = await getShifts();
    const real = shifts.length > 0;
    const data = real ? shifts : [{ worker_name: 'Иванов', date: '2026-03-18', from: '10:00', to: '12:00', status: 'open' }];

    panel.innerHTML = `<h3>Расписание мастеров</h3><table class="simple-table"><thead><tr><th>Мастер</th><th>Дата</th><th>Время</th><th>Статус</th></tr></thead><tbody>${data
        .map((shift) => `
      <tr>
        <td>${shift.worker_name}</td>
        <td>${shift.date}</td>
        <td>${shift.from} - ${shift.to}</td>
        <td>${shift.status}</td>
      </tr>
    `)
        .join('')}</tbody></table>`;

    if (!real) {
        panel.insertAdjacentHTML('beforeend', '<p class="muted">Пример данных: создать новые слоты может администратор или работник.</p>');
    }
}

async function renderEvents() {
    const panel = document.getElementById('events');
    const events = await getEvents();
    const real = events.length > 0;
    const data = real ? events : [
        { id: 0, title: 'Субботник во дворе', date_start: '2026-03-20 14:00', author_name: 'Студент', max_participants: 25 },
        { id: 1, title: 'Квиз вечеринка', date_start: '2026-03-22 19:00', author_name: 'Администрация', max_participants: 40 },
    ];

    let html = '<h3>Мероприятия</h3>';

    if (window.currentUser?.role === 'admin') {
        html += `
      <div class="panel-card">
        <h4>Создать мероприятие</h4>
        <form id="eventCreateForm" class="simple-form">
          <label>Название:<input name="title" required></label>
          <label>Описание:<textarea name="description" required></textarea></label>
          <label>Дата и время начала:<input name="date_start" type="datetime-local" required></label>
          <label>Дата и время окончания:<input name="date_end" type="datetime-local"></label>
          <label>Максимум участников:<input name="max_participants" type="number" min="1"></label>
          <button type="submit" class="btn">Опубликовать событие</button>
        </form>
      </div>
    `;
    }

    html += `<ul>${data
        .map((evt) => `<li><b>${evt.title}</b> — ${evt.date_start} (${evt.author_name}) <button data-id="${evt.id}" class="btn joinEvent">Записаться</button></li>`)
        .join('')}</ul>`;

    if (!real) {
        html += '<p class="muted">Пример мероприятий, созданных автоматически.</p>';
    }

    panel.innerHTML = html;

    if (window.currentUser?.role === 'admin') {
        const form = document.getElementById('eventCreateForm');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const fd = new FormData(form);
            try {
                await createEvent({
                    title: fd.get('title'),
                    description: fd.get('description'),
                    date_start: fd.get('date_start'),
                    date_end: fd.get('date_end') || null,
                    max_participants: fd.get('max_participants') ? Number(fd.get('max_participants')) : null,
                });
                renderNotification('Событие создано успешно', 'success');
                form.reset();
                await renderEvents();
            } catch (error) {
                renderNotification('Ошибка создания события: ' + error.message);
            }
        });
    }

    panel.querySelectorAll('.joinEvent').forEach((btn) => {
        btn.addEventListener('click', async () => {
            try {
                if (real) await joinEvent(btn.dataset.id);
                renderNotification('Вы записаны на мероприятие', 'success');
            } catch (error) {
                renderNotification('Ошибка записи: ' + error.message);
            }
        });
    });
}

async function renderNotices() {
    const panel = document.getElementById('notices');
    const notices = await getNotices();

    let html = '<h3>Объявления</h3>';

    if (window.currentUser?.role === 'admin') {
        html += `
      <div class="panel-card">
        <h4>Создать объявление</h4>
        <form id="noticeCreateForm" class="simple-form">
          <label>Заголовок:<input name="title" required></label>
          <label>Текст:<textarea name="body" required></textarea></label>
          <label>Показать всем:<input name="is_public" type="checkbox" checked></label>
          <button type="submit" class="btn">Опубликовать объявление</button>
        </form>
      </div>
    `;
    }

    if (notices.length === 0) {
        html += `
      <ul>
        <li><b>Внимание!</b> С 25 марта отключают горячую воду с 10:00 до 16:00.</li>
        <li><b>Комната для самообразования</b> теперь доступна 24/7.</li>
      </ul>
    `;
    } else {
        html += `<ul>${notices
            .map((n) => `<li><b>${n.title}</b> – ${n.body} <span class="muted">(${n.published_at})</span></li>`)
            .join('')}</ul>`;
    }

    panel.innerHTML = html;

    if (window.currentUser?.role === 'admin') {
        const form = document.getElementById('noticeCreateForm');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const fd = new FormData(form);
            try {
                await createNotice({
                    title: fd.get('title'),
                    body: fd.get('body'),
                    is_public: fd.get('is_public') === 'on',
                });
                renderNotification('Объявление опубликовано', 'success');
                form.reset();
                await renderNotices();
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

        await renderFeed();
        await renderLaundry();
        await renderShifts();
        await renderEvents();
        await renderNotices();
    } catch (error) {
        renderNotification('Ошибка загрузки дашборда: ' + error.message);
        if (error.message.includes('401')) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }
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
