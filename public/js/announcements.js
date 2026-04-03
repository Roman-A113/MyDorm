import { getAnnouncements, createAnnouncement } from './api.js';
import { renderNotification } from './utils.js';


export async function renderAnnouncements() {
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
                console.log(error);
                renderNotification('Ошибка публикации объявления: ' + error.message);
            }
        });
    }
}