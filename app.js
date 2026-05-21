require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.json({ limit: '100mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('trust proxy', 1);

function generateToken(user) {
    return jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, {
        expiresIn: '8h',
    });
}

const ACTION_TYPES = {
    REGISTER: 'REGISTER',
    LOGIN: 'LOGIN',
    REPAIR_BOOK: 'REPAIR_BOOK',
    REPAIR_CANCEL: 'REPAIR_CANCEL',
    REPAIR_STATUS_CHANGE: 'REPAIR_STATUS_CHANGE',
    LAUNDRY_BOOK: 'LAUNDRY_BOOK',
    LAUNDRY_CANCEL: 'LAUNDRY_CANCEL',
    PRODUCT_ADD: 'PRODUCT_ADD',
    PRODUCT_DELETE: 'PRODUCT_DELETE',
    PRODUCT_EDIT: 'PRODUCT_EDIT',
    EVENT_CREATE: 'EVENT_CREATE',
    EVENT_DELETE: 'EVENT_DELETE',
    EVENT_JOIN: 'EVENT_JOIN',
    EVENT_LEAVE: 'EVENT_LEAVE',
};

async function addLog(userId, name, email, action, details = null) {
    await db.query(
        'INSERT INTO activity_logs(user_id, name, email, action, details, created_at) VALUES($1, $2, $3, $4, $5, NOW())',
        [userId, name, email, action, details],
    );
}

app.post('/auth/register', async (req, res) => {
    const { name, email, password, role, room } = req.body;
    if (!name || !email || !password || !role) return res.status(400).send('Некорректные данные');

    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(409).send('Данный пользователь уже существует');

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
        'INSERT INTO users (name, email, password_hash, role, room) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role',
        [name, email, hash, role, room || null],
    );
    const token = generateToken(result.rows[0]);

    await addLog(result.rows[0].id, name, email, ACTION_TYPES.REGISTER);
    res.json({ token, user: result.rows[0] });
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const { rows } = await db.query(`SELECT id, name, email, role, password_hash FROM users WHERE email = $1`, [email]);
    const user = rows[0];
    if (!user) return res.status(401).send('Такого пользователя не существует');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).send('Неверный пароль');

    const token = generateToken(user);

    await addLog(user.id, user.name, user.email, ACTION_TYPES.LOGIN);

    res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
});

async function getUserById(id) {
    const { rows } = await db.query(
        `SELECT id, name, email, role, room 
         FROM users
         WHERE id = $1`,
        [id],
    );

    if (rows.length === 0) {
        throw new Error(`Пользователь c id ${id} не найден`);
    }
    return rows[0];
}

function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).send('Unauthorized');
    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).send('Invalid token');
    }
}

app.get('/user/me', authMiddleware, async (req, res) => {
    const user = await getUserById(req.user.id);
    res.json(user);
});

app.get('/announcements', authMiddleware, async (req, res) => {
    const { rows } = await db.query(
        'SELECT id, title, body, published_at FROM announcements ORDER BY published_at DESC',
    );
    res.json(rows);
});

app.post('/announcements', authMiddleware, async (req, res) => {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).send('Заполните поля');

    const role = req.user.role;
    if (role !== 'admin') {
        return res.status(400).send('У вас нет прав администратора для создания мероприятий');
    }

    const { rows } = await db.query(
        'INSERT INTO announcements (title, body, author_id, published_at) VALUES ($1,$2,$3,NOW()) RETURNING *',
        [title, body, req.user.id],
    );
    res.json(rows[0]);
});

app.put('/announcements/update/:id', authMiddleware, async (req, res) => {
    const id = req.params.id;
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).send('Заполните поля');

    const role = req.user.role;
    if (role !== 'admin') {
        return res.status(400).send('У вас нет прав администратора для редактирования мероприятий');
    }

    await db.query('UPDATE announcements SET title = $1, body = $2 WHERE id = $3', [title, body, id]);
    res.json({ status: 'ok' });
});

app.delete('/announcements/delete/:id', authMiddleware, async (req, res) => {
    const id = req.params.id;
    await db.query('DELETE FROM announcements WHERE id = $1', [id]);
    res.json({ status: 'ok' });
});

const {
    generateCalendarDays,
    LAUNDRY_TIME_SLOTS,
    LAUNDRY_MACHINES,
    REPAIR_TIME_BLOCKS,
    REPAIR_SPECIALISTS,
} = require('./public/js/utils');

app.get('/repair-calendar', authMiddleware, async (req, res) => {
    const days = generateCalendarDays();

    const bookings = {};
    REPAIR_SPECIALISTS.forEach((spec) => {
        bookings[spec.id] = {};
        days.forEach((day) => {
            bookings[spec.id][day] = {};
            REPAIR_TIME_BLOCKS.forEach((block) => {
                bookings[spec.id][day][block] = [];
            });
        });
    });

    const query = `
        SELECT specialization, 
            slot_date::TEXT as slot_date_text, 
            time_block, 
            JSON_AGG(JSON_BUILD_OBJECT('id', id, 'user_id', student_id, 'status', status, 'problem_description', problem_description, 'room_number', room, 'name', name)) AS slot_bookings
        FROM repair_bookings
        WHERE slot_date >= (CURRENT_DATE AT TIME ZONE 'Asia/Yekaterinburg')::DATE
        GROUP BY specialization, slot_date_text, time_block
    `;
    const rows = await db.query(query);

    rows.rows.forEach((row) => {
        const { specialization, slot_date_text, time_block, slot_bookings } = row;
        bookings[specialization][slot_date_text][time_block] = slot_bookings;
    });

    res.json(bookings);
});

app.post('/repairs/book', authMiddleware, async (req, res) => {
    const { slot_date, time_block, specialization, problem_description, room_number } = req.body;

    await db.query(
        `
            INSERT INTO repair_bookings (
                slot_date,
                time_block,
                student_id,
                specialization,
                problem_description,
                status,
                room,
                name
            ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
        `,
        [slot_date, time_block, req.user.id, specialization, problem_description, room_number, req.user.name],
    );

    await addLog(
        req.user.id,
        req.user.name,
        req.user.email,
        ACTION_TYPES.REPAIR_BOOK,
        `${slot_date}, ${time_block}, ${specialization}, ${problem_description}`,
    );
    res.json(null);
});

app.delete('/repairs/bookings/:id', authMiddleware, async (req, res) => {
    const bookingId = Number(req.params.id);

    await db.query(
        `
            DELETE FROM repair_bookings 
            WHERE id = $1
        `,
        [bookingId],
    );

    await addLog(req.user.id, req.user.name, req.user.email, ACTION_TYPES.REPAIR_CANCEL);

    res.json({ status: 'ok' });
});

app.post('/laundry/book', authMiddleware, async (req, res) => {
    const { machine_id, date, slots } = req.body;

    const userId = req.user.id;
    const insertedBookings = [];

    for (const timeSlot of slots) {
        const insertQuery = `
                INSERT INTO laundry_bookings (machine_id, booking_date, time_slot, user_id, name)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, time_slot
            `;
        const result = await db.query(insertQuery, [machine_id, date, timeSlot, userId, req.user.name]);
        await addLog(
            req.user.id,
            req.user.name,
            req.user.email,
            ACTION_TYPES.LAUNDRY_BOOK,
            `${machine_id}, ${date}, ${timeSlot}`,
        );
        insertedBookings.push(result.rows[0]);
    }

    res.json(null);
});

app.delete('/laundry/cancel/:id', authMiddleware, async (req, res) => {
    const bookingId = req.params.id;
    await db.query('DELETE FROM laundry_bookings WHERE id = $1', [bookingId]);
    await addLog(req.user.id, req.user.name, req.user.email, ACTION_TYPES.LAUNDRY_CANCEL);
    res.json(null);
});

app.get('/laundry/all-data', authMiddleware, async (req, res) => {
    const query = `
            SELECT machine_id, 
                   booking_date::TEXT as date, 
                   time_slot, 
                   user_id,
                   name, 
                   id as booking_id
            FROM laundry_bookings
            WHERE booking_date >= (CURRENT_DATE AT TIME ZONE 'Asia/Yekaterinburg')::DATE
        `;
    const { rows } = await db.query(query);

    const days = generateCalendarDays();

    const allBookings = {};

    LAUNDRY_MACHINES.forEach((machine) => {
        allBookings[machine.id] = {};
        days.forEach((day) => {
            allBookings[machine.id][day] = {};
            LAUNDRY_TIME_SLOTS.forEach((slot) => {
                allBookings[machine.id][day][slot] = {};
            });
        });
    });

    rows.forEach((row) => {
        const { machine_id, date, time_slot, user_id, booking_id, name } = row;

        allBookings[machine_id][date][time_slot] = {
            userId: user_id,
            bookingId: booking_id,
            name: name,
        };
    });

    res.json(allBookings);
});

app.patch('/repairs/status/:id', authMiddleware, async (req, res) => {
    const bookingId = req.params.id;
    const { status } = req.body;

    const bookingRes = await db.query('SELECT specialization FROM repair_bookings WHERE id = $1', [bookingId]);

    if (bookingRes.rows.length === 0) {
        return res.status(404).json('Заявка не найдена');
    }

    const validStatuses = ['pending', 'accepted', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json('Неверный статус');
    }

    await db.query('UPDATE repair_bookings SET status = $1 WHERE id = $2', [status, bookingId]);
    await addLog(
        req.user.id,
        req.user.name,
        req.user.email,
        ACTION_TYPES.REPAIR_STATUS_CHANGE,
        `${status}, bookingId=${bookingId}`,
    );
    res.json(null);
});

app.get('/products', authMiddleware, async (req, res) => {
    const { rows } = await db.query(`
        SELECT id, title, description, price, stock, 
               image_url AS image, seller_contact, seller_contact_telegram, seller_id, status
        FROM sales
        WHERE status = 'active'
        ORDER BY created_at DESC
    `);
    res.json(rows);
});

app.post('/products/add', authMiddleware, upload.single('image'), async (req, res) => {
    const { title, description, price, stock, seller_contact, seller_contact_telegram } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const query = `
            INSERT INTO sales (
                title, description, price, stock, image_url, 
                seller_contact, seller_contact_telegram, seller_id, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
            RETURNING id, title, description, price, stock, image_url AS image, seller_contact, seller_contact_telegram, status;
        `;

    const values = [
        title,
        description || null,
        parseFloat(price),
        parseInt(stock, 10),
        imagePath,
        seller_contact,
        seller_contact_telegram,
        req.user.id,
    ];

    const { rows } = await db.query(query, values);

    await addLog(
        req.user.id,
        req.user.name,
        req.user.email,
        ACTION_TYPES.PRODUCT_ADD,
        `title=${title}, description=${description}, price=${price}, stock=${stock}, imagePath=${imagePath}, seller_contact=${seller_contact} ${seller_contact_telegram}`,
    );
    res.status(201).json(rows[0]);
});

app.delete('/products/delete/:productId', authMiddleware, async (req, res) => {
    const productId = req.params.productId;
    await db.query(`DELETE FROM sales WHERE id = $1;`, [productId]);
    await addLog(req.user.id, req.user.name, req.user.email, ACTION_TYPES.PRODUCT_DELETE);
    res.json({ status: 'ok' });
});

app.put('/product/update/:productId', authMiddleware, upload.single('image'), async (req, res) => {
    const productId = req.params.productId;
    const { title, description, price, stock, seller_contact, seller_contact_telegram } = req.body;
    const newImagePath = req.file ? req.file.path : null;

    const oldProductRes = await db.query('SELECT * FROM sales WHERE id = $1', [productId]);
    const oldProduct = oldProductRes.rows[0];

    const oldImagePath = oldProductRes.rows[0].image_url;

    let finalImagePath = oldImagePath;
    if (newImagePath) {
        if (oldImagePath) fs.unlinkSync(oldImagePath);
        finalImagePath = newImagePath;
    }

    await db.query(
        `UPDATE sales 
             SET title = $1, 
                 description = $2, 
                 price = $3, 
                 stock = $4, 
                 seller_contact = $5, 
                 seller_contact_telegram = $6, 
                 image_url = $7 
             WHERE id = $8`,
        [title, description, price, stock, seller_contact, seller_contact_telegram, finalImagePath, productId],
    );

    await addLog(
        req.user.id,
        req.user.name,
        req.user.email,
        ACTION_TYPES.PRODUCT_EDIT,
        `title=${title}, description=${description}, price=${price}, stock=${stock}, imagePath=${finalImagePath}, seller_contact=${seller_contact} ${seller_contact_telegram}`,
    );

    res.json({ status: 'ok' });
});

app.get('/events', authMiddleware, async (req, res) => {
    const query = `
            SELECT 
                e.id, 
                e.title, 
                e.description, 
                e.event_date, 
                e.location,
                e.creator_id,
                e.image_url,
                COALESCE(
                    json_agg(
                        json_build_object('id', u.id, 'name', u.name) 
                        ORDER BY u.name
                    ) FILTER (WHERE u.id IS NOT NULL), 
                    '[]'::json
                ) as participants
            FROM events e
            LEFT JOIN event_participants ep ON e.id = ep.event_id
            LEFT JOIN users u ON ep.user_id = u.id
            GROUP BY e.id
            ORDER BY e.event_date ASC
        `;

    const { rows } = await db.query(query);

    res.json(rows);
});

app.post('/events', authMiddleware, upload.single('image'), async (req, res) => {
    const { title, description, event_date, location } = req.body;
    const creator_id = req.user.id;
    const image_url = req.file ? req.file.path : null;

    const query = `
            INSERT INTO events (title, description, event_date, location, creator_id, image_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
    const values = [title, description, event_date, location, creator_id, image_url];
    const { rows } = await db.query(query, values);

    await addLog(
        req.user.id,
        req.user.name,
        req.user.email,
        ACTION_TYPES.EVENT_CREATE,
        `title=${title}, description=${description}, event_date=${event_date}, location=${location}, imagePath=${image_url}`,
    );

    const event = rows[0];
    res.json({ id: event.id });
});

app.delete('/events/delete/:id', authMiddleware, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;
    await db.query(`DELETE FROM event_participants WHERE event_id = $1`, [eventId]);
    await db.query(`DELETE FROM events WHERE id = $1`, [eventId]);

    await addLog(req.user.id, req.user.name, req.user.email, ACTION_TYPES.EVENT_DELETE);
    res.json({ status: 'ok' });
});

app.put('/events/update/:id', authMiddleware, upload.single('image'), async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;
    const { title, description, event_date, location } = req.body;
    const image_url = req.file ? req.file.path : null;

    if (!image_url) {
        await db.query(`UPDATE events SET title = $1, description = $2, event_date = $3, location = $4 WHERE id = $5`, [
            title,
            description,
            event_date,
            location,
            eventId,
        ]);
    } else {
        await db.query(
            `UPDATE events SET title = $1, description = $2, event_date = $3, location = $4, image_url = $5 WHERE id = $6`,
            [title, description, event_date, location, image_url, eventId],
        );
    }

    res.json({ status: 'ok' });
});

app.post('/events/:id/join', authMiddleware, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;
    const query = `
            INSERT INTO event_participants (event_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (event_id, user_id) DO NOTHING
            RETURNING *
        `;
    const { rows } = await db.query(query, [eventId, userId]);

    await addLog(req.user.id, req.user.name, req.user.email, ACTION_TYPES.EVENT_JOIN, `${eventId}`);

    res.json({ status: 'ok' });
});

app.delete('/events/:id/leave', authMiddleware, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;

    const query = `
            DELETE FROM event_participants
            WHERE event_id = $1 AND user_id = $2
            RETURNING *
        `;
    const { rows } = await db.query(query, [eventId, userId]);

    await addLog(req.user.id, req.user.name, req.user.email, ACTION_TYPES.EVENT_LEAVE, `${eventId}`);

    res.json({ status: 'ok' });
});

app.post('/logs', authMiddleware, async (req, res) => {
    const { name, action, details } = req.body;
    const userId = req.user.id;

    await db.query('INSERT INTO activity_logs VALUES($1, $2, $3, $4, NOW())', userId, name, action, details);

    res.json({ status: 'ok' });
});

const port = process.env.PORT || 3857;
app.listen(port, '127.0.0.1', () => {
    console.log(`Server listening at http://localhost:${port}`);
});
