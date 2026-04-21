--
-- PostgreSQL database dump
--

\restrict 8pmn5AB5RypeuBLJMwxAecbxynKUZMvr8nbmLUxWiO619hszSi1lh2dDbhofYWv

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: laundry_time_slot; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.laundry_time_slot AS ENUM (
    '08:00-08:30',
    '08:30-09:00',
    '09:00-09:30',
    '09:30-10:00',
    '10:00-10:30',
    '10:30-11:00',
    '11:00-11:30',
    '11:30-12:00',
    '12:00-12:30',
    '12:30-13:00',
    '13:00-13:30',
    '13:30-14:00',
    '14:00-14:30',
    '14:30-15:00',
    '15:00-15:30',
    '15:30-16:00',
    '16:00-16:30',
    '16:30-17:00',
    '17:00-17:30',
    '17:30-18:00',
    '18:00-18:30',
    '18:30-19:00',
    '19:00-19:30',
    '19:30-20:00',
    '20:00-20:30',
    '20:30-21:00'
);


ALTER TYPE public.laundry_time_slot OWNER TO postgres;

--
-- Name: specialization_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.specialization_type AS ENUM (
    'plumber',
    'carpenter',
    'electrician'
);


ALTER TYPE public.specialization_type OWNER TO postgres;

--
-- Name: time_block_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.time_block_type AS ENUM (
    '09-12',
    '12-15',
    '15-18',
    '18-21'
);


ALTER TYPE public.time_block_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    author_id integer NOT NULL,
    published_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: laundry_bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laundry_bookings (
    id integer NOT NULL,
    user_id integer,
    machine_id integer NOT NULL,
    booking_date date NOT NULL,
    time_slot public.laundry_time_slot
);


ALTER TABLE public.laundry_bookings OWNER TO postgres;

--
-- Name: laundry_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laundry_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laundry_bookings_id_seq OWNER TO postgres;

--
-- Name: laundry_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laundry_bookings_id_seq OWNED BY public.laundry_bookings.id;


--
-- Name: repair_bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.repair_bookings (
    id integer NOT NULL,
    slot_date date NOT NULL,
    time_block public.time_block_type NOT NULL,
    student_id integer,
    specialization public.specialization_type NOT NULL,
    problem_description text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    rejection_reason text,
    CONSTRAINT repair_bookings_slot_date_check CHECK ((slot_date >= CURRENT_DATE))
);


ALTER TABLE public.repair_bookings OWNER TO postgres;

--
-- Name: repair_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.repair_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.repair_bookings_id_seq OWNER TO postgres;

--
-- Name: repair_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.repair_bookings_id_seq OWNED BY public.repair_bookings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    room integer,
    CONSTRAINT users_room_check CHECK ((room > 0))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: laundry_bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laundry_bookings ALTER COLUMN id SET DEFAULT nextval('public.laundry_bookings_id_seq'::regclass);


--
-- Name: repair_bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repair_bookings ALTER COLUMN id SET DEFAULT nextval('public.repair_bookings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, body, author_id, published_at) FROM stdin;
\.


--
-- Data for Name: laundry_bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laundry_bookings (id, user_id, machine_id, booking_date, time_slot) FROM stdin;
113	15	1	2026-04-16	13:00-13:30
114	15	1	2026-04-16	13:30-14:00
\.


--
-- Data for Name: repair_bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.repair_bookings (id, slot_date, time_block, student_id, specialization, problem_description, status, rejection_reason) FROM stdin;
62	2026-04-17	12-15	15	plumber	fsdfdsfsdfsd	completed	\N
64	2026-04-17	15-18	15	plumber	аываываывавы	accepted	\N
65	2026-04-25	18-21	15	plumber	jghjhgjghjgh	pending	\N
61	2026-04-22	15-18	15	plumber	fsdfsdfds	pending	\N
63	2026-04-22	12-15	15	plumber	выаываываыаыв	pending	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, role, created_at, room) FROM stdin;
15	Колесниченко Роман Александрович	student@bk.ru	$2b$10$Ao1KBFWYpfpQVN/gxSnt6O3TXv17mPhk8bE/w.L1uggyUxrs5jyJW	student	2026-04-12 23:43:13.700761	\N
16	Иванов Иван Иванович	plumber@bk.ru	$2b$10$q7PsV6d/30kEPIXaHj7pJO5fPgbcme8kzJ.dZvuMyvuLNXAONoUd.	plumber	2026-04-12 23:47:04.645243	\N
\.


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcements_id_seq', 9, true);


--
-- Name: laundry_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laundry_bookings_id_seq', 115, true);


--
-- Name: repair_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.repair_bookings_id_seq', 65, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 16, true);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: laundry_bookings laundry_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laundry_bookings
    ADD CONSTRAINT laundry_bookings_pkey PRIMARY KEY (id);


--
-- Name: repair_bookings repair_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repair_bookings
    ADD CONSTRAINT repair_bookings_pkey PRIMARY KEY (id);


--
-- Name: repair_bookings repair_bookings_slot_date_time_block_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repair_bookings
    ADD CONSTRAINT repair_bookings_slot_date_time_block_student_id_key UNIQUE (slot_date, time_block, student_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: laundry_bookings laundry_bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laundry_bookings
    ADD CONSTRAINT laundry_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: repair_bookings repair_bookings_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repair_bookings
    ADD CONSTRAINT repair_bookings_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 8pmn5AB5RypeuBLJMwxAecbxynKUZMvr8nbmLUxWiO619hszSi1lh2dDbhofYWv


-- SALES --
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
    image_url VARCHAR(500),
    seller_contact VARCHAR(255), -- Telegram, телефон, email
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'sold', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрых выборок
CREATE INDEX idx_sales_seller ON sales(seller_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_date ON sales(created_at DESC);

