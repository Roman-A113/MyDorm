--
-- PostgreSQL database dump
--

\restrict 3ZCJWV1IW9Ub9lBVhxIitvve4WAESWc2CMmw1qd0qig5tqHdbPHCL7nZF9HfTNt

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
-- Name: event_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_participants (
    id integer NOT NULL,
    event_id integer,
    user_id integer NOT NULL,
    joined_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.event_participants OWNER TO postgres;

--
-- Name: event_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_participants_id_seq OWNER TO postgres;

--
-- Name: event_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_participants_id_seq OWNED BY public.event_participants.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    event_date timestamp with time zone NOT NULL,
    location character varying(255),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


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
-- Name: sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    stock integer DEFAULT 1 NOT NULL,
    image_url character varying(500),
    seller_contact character varying(255),
    seller_id integer NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    seller_contact_telegram text,
    CONSTRAINT sales_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT sales_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'reserved'::character varying, 'sold'::character varying, 'archived'::character varying])::text[]))),
    CONSTRAINT sales_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.sales OWNER TO postgres;

--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_id_seq OWNER TO postgres;

--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


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
-- Name: event_participants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_participants ALTER COLUMN id SET DEFAULT nextval('public.event_participants_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: laundry_bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laundry_bookings ALTER COLUMN id SET DEFAULT nextval('public.laundry_bookings_id_seq'::regclass);


--
-- Name: repair_bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repair_bookings ALTER COLUMN id SET DEFAULT nextval('public.repair_bookings_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, body, author_id, published_at) FROM stdin;
10	Отключение горячей воды 15–17 мая	Уважаемые студенты! В связи с плановыми работами на теплосети, горячее водоснабжение в корпусах №3 и №4 будет отключено с 09:00 15 мая до 18:00 17 мая. Пожалуйста, сделайте запасы воды заранее. Приносим извинения за неудобства.	20	2026-04-27 18:39:57.255961+05
11	Проверка противопожарной безопасности	20 апреля с 10:00 до 14:00 состоится плановая проверка пожарных шкафов и эвакуационных выходов. Просьба не загромождать коридоры личными вещами (велосипеды, коробки, обувь). Вещи, оставленные в проходах, будут перемещены в комнату коменданта.	20	2026-04-27 18:40:10.99934+05
12	Изменение режима работы прачечной	Текст: С 1 мая прачечная переходит на летний график работы: с 08:00 до 23:00. В ночное время (23:00–08:00) доступ к стиральным машинам будет ограничен ключом-брелоком (получить у вахтера).	20	2026-04-27 18:40:28.9382+05
\.


--
-- Data for Name: event_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_participants (id, event_id, user_id, joined_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, description, event_date, location, created_at) FROM stdin;
28	4535345	sdfsdfsd	2026-04-21 06:17:00+05		2026-04-28 02:12:41.590446+05
\.


--
-- Data for Name: laundry_bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laundry_bookings (id, user_id, machine_id, booking_date, time_slot) FROM stdin;
122	18	1	2026-05-05	12:00-12:30
123	18	1	2026-05-05	12:30-13:00
125	19	1	2026-04-30	12:30-13:00
\.


--
-- Data for Name: repair_bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.repair_bookings (id, slot_date, time_block, student_id, specialization, problem_description, status, rejection_reason) FROM stdin;
67	2026-04-30	15-18	18	plumber	dsfdsfsdfs	pending	\N
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales (id, title, description, price, stock, image_url, seller_contact, seller_id, status, created_at, updated_at, seller_contact_telegram) FROM stdin;
47	Микроволновка	sdofijsdfoisjfdoisjfsodijfsoid	1500.00	1	uploads\\1777296317892-15374548.webp		18	active	2026-04-27 18:25:17.936788+05	2026-04-27 18:25:17.936788+05	@ivan2005
49	Кофта	удобная, мягкая	800.00	1	uploads\\1777296593697-111271145.jpeg	8 (567) 567-56-66	19	active	2026-04-27 18:29:53.839516+05	2026-04-27 18:29:53.839516+05	
50	Кроссовки	оригинальные	5000.00	1	uploads\\1777296738774-841116403.jpg	+7 (964) 182-30-40	19	active	2026-04-27 18:32:18.916009+05	2026-04-27 18:32:18.916009+05	@vasya2010
46	Компьютер	тут какое то описание товара	1.00	1	uploads\\1777296192494-109313471.webp	+7 (964) 182-30-40	18	active	2026-04-27 18:23:12.531156+05	2026-04-27 18:23:12.531156+05	@roma_kolesn
52	4324	32234	234.00	1423	\N	+7 (456) 456-45-64	19	active	2026-04-28 01:28:06.11043+05	2026-04-28 01:28:06.11043+05	
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, role, created_at, room) FROM stdin;
18	Колесниченко Роман Александрович	student@bk.ru	$2b$10$6sis2nI97ogK7Y8dF1EA7eXyyCiGxWzkLy0VmugiF3MKyum86S2Da	student	2026-04-26 15:10:41.734676	\N
19	Иванов Иван Иванович	student2@bk.ru	$2b$10$VpzSz.bssOZ1JCVNeuClhODYa2d/wYGBmHHiDJuzO92gig2cwnTV6	student	2026-04-27 18:26:41.654917	\N
20	Админ Админов Админович	admin@bk.ru	$2b$10$UWAz1m0ci4TvG04l2dVZA.YgiDwlVTaXXq5EOAj/GsTrFXgpqfS12	admin	2026-04-27 18:37:09.972459	\N
\.


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcements_id_seq', 12, true);


--
-- Name: event_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_participants_id_seq', 34, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 28, true);


--
-- Name: laundry_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laundry_bookings_id_seq', 125, true);


--
-- Name: repair_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.repair_bookings_id_seq', 67, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_id_seq', 52, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 20, true);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: event_participants event_participants_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_participants event_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


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
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


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
-- Name: event_participants event_participants_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


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
-- Name: sales sales_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 3ZCJWV1IW9Ub9lBVhxIitvve4WAESWc2CMmw1qd0qig5tqHdbPHCL7nZF9HfTNt

