-- Инициализация схемы для проекта общежития №6

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'worker', 'admin')),
  profession TEXT,
  room TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  worker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  from_time TIME NOT NULL,
  to_time TIME NOT NULL,
  capacity INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'closed'))
);

CREATE TABLE IF NOT EXISTS shift_bookings (
  id SERIAL PRIMARY KEY,
  shift_id INTEGER REFERENCES shifts(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done', 'cancelled')),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  date_start TIMESTAMP NOT NULL,
  date_end TIMESTAMP,
  max_participants INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_participants (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'organizer')),
  signed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laundry_slots (
  id SERIAL PRIMARY KEY,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  machine_number INTEGER NOT NULL,
  max_students INTEGER DEFAULT 1,
  created_by INTEGER REFERENCES users(id),
  note TEXT
);

CREATE TABLE IF NOT EXISTS laundry_bookings (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER REFERENCES laundry_slots(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'done', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notices (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  for_role TEXT CHECK (for_role IN ('student','worker','admin', 'all')),
  is_public BOOLEAN DEFAULT true,
  published_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','in_progress','resolved')),
  created_at TIMESTAMP DEFAULT NOW()
);
