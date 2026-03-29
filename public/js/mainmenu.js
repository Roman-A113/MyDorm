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
