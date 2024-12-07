--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6 (Ubuntu 16.6-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.6 (Ubuntu 16.6-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_depth_on_insert_or_update(); Type: FUNCTION; Schema: public; Owner: qr_user
--

CREATE FUNCTION public.update_depth_on_insert_or_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.depth := COALESCE((SELECT depth + 1 FROM spaces WHERE id = NEW.parent_id), 0);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_depth_on_insert_or_update() OWNER TO qr_user;

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: qr_user
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO qr_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    space_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_id_seq OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: spaces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.spaces (
    id integer NOT NULL,
    name text NOT NULL,
    parent_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    depth integer DEFAULT 0
);


ALTER TABLE public.spaces OWNER TO postgres;

--
-- Name: spaces_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.spaces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.spaces_id_seq OWNER TO postgres;

--
-- Name: spaces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.spaces_id_seq OWNED BY public.spaces.id;


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: spaces id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spaces ALTER COLUMN id SET DEFAULT nextval('public.spaces_id_seq'::regclass);


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, name, description, space_id, created_at, updated_at) FROM stdin;
1	Hammer	A basic tool	2	2024-12-05 13:36:18.601317	2024-12-05 13:36:18.601317
2	Drill	Cordless drill	2	2024-12-05 13:36:18.601317	2024-12-05 13:36:18.601317
3	Sweater	Winter sweater	3	2024-12-05 13:36:18.601317	2024-12-05 13:36:18.601317
19	Hammer	A tool	3	2024-12-05 13:39:22.750067	2024-12-05 13:39:22.750067
20	Wrench	A useful tool	3	2024-12-05 13:43:28.497016	2024-12-05 13:43:28.497016
24	Building Blocks Toy	Wooden building blocks	38	2024-12-06 07:08:45.727053	2024-12-06 07:54:59.173341
5	Laptop	Work laptop	38	2024-12-05 13:36:18.601317	2024-12-06 21:02:24.638781
23	Elmo	Addie's Elmo	41	2024-12-05 14:14:30.197067	2024-12-06 21:02:30.74123
9	Welding Supplies	Lots of welding stuff	30	2024-12-05 13:36:18.601317	2024-12-06 21:03:07.47109
4	Books	Stack of novels	1	2024-12-05 13:36:18.601317	2024-12-06 21:03:25.143517
25	Blankie	An Elmo blanket	1	2024-12-06 08:06:41.435445	2024-12-06 22:23:52.301925
26	Beer Goggles	Some beer goggles	44	2024-12-06 22:25:36.640806	2024-12-06 22:26:39.781496
27	Test 1	Test 1	\N	2024-12-06 22:43:50.888327	2024-12-06 22:43:50.888327
28	Test 2	Test 2	\N	2024-12-06 22:43:55.480876	2024-12-06 22:43:55.480876
29	Test 3	Test 3	\N	2024-12-06 22:44:01.337772	2024-12-06 22:44:01.337772
30	Test 4	Test 4	\N	2024-12-06 22:44:08.394879	2024-12-06 22:44:08.394879
31	Test Item 1	This is a test	\N	2024-12-07 07:57:21.734624	2024-12-07 07:57:21.734624
\.


--
-- Data for Name: spaces; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spaces (id, name, parent_id, created_at, updated_at, depth) FROM stdin;
1	Home	2	2024-12-05 13:36:06.717691	2024-12-06 22:59:36.376716	2
30	Addie's Toy Box	38	2024-12-05 14:14:14.732193	2024-12-06 23:37:35.799396	1
44	Goggles Case	20	2024-12-06 22:26:30.210825	2024-12-06 23:43:01.162785	1
38	Rob's Toy Box	44	2024-12-06 07:09:58.386935	2024-12-06 23:43:04.797788	2
46	Attic	\N	2024-12-06 23:44:50.515449	2024-12-06 23:44:50.515449	0
47	Space Test 1	\N	2024-12-07 07:57:30.121708	2024-12-07 07:57:30.121708	0
3	Closet	1	2024-12-05 13:36:06.717691	2024-12-05 13:45:28.553381	1
2	Garage	1	2024-12-05 13:36:06.717691	2024-12-05 13:45:28.553381	1
20	Unassigned	\N	2024-12-05 13:50:18.98548	2024-12-05 13:50:18.98548	0
37	Silas' Toy Box	20	2024-12-06 07:09:35.969208	2024-12-06 07:09:35.969208	1
40	Blanket Basket	1	2024-12-06 08:07:07.794195	2024-12-06 08:07:07.794195	1
42	Goggles holder	41	2024-12-06 22:25:52.537987	2024-12-06 22:25:52.537987	1
43	Goggles Case	1	2024-12-06 22:26:19.007419	2024-12-06 22:26:19.007419	1
45	Basement	\N	2024-12-06 22:43:43.26685	2024-12-06 22:43:43.26685	0
41	Blanket Basket	30	2024-12-06 08:07:27.614117	2024-12-06 22:47:37.739428	1
\.


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_id_seq', 31, true);


--
-- Name: spaces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.spaces_id_seq', 47, true);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: spaces spaces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_pkey PRIMARY KEY (id);


--
-- Name: spaces unique_space_name_within_parent; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT unique_space_name_within_parent UNIQUE (name, parent_id);


--
-- Name: idx_items_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_items_name ON public.items USING btree (name);


--
-- Name: idx_items_space_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_items_space_id ON public.items USING btree (space_id);


--
-- Name: idx_spaces_depth; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spaces_depth ON public.spaces USING btree (depth);


--
-- Name: idx_spaces_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spaces_name ON public.spaces USING btree (name);


--
-- Name: idx_spaces_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spaces_parent_id ON public.spaces USING btree (parent_id);


--
-- Name: unique_root_space_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_root_space_name ON public.spaces USING btree (name) WHERE (parent_id IS NULL);


--
-- Name: items items_update_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER items_update_timestamp BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: spaces spaces_depth_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER spaces_depth_trigger BEFORE INSERT OR UPDATE OF parent_id ON public.spaces FOR EACH ROW EXECUTE FUNCTION public.update_depth_on_insert_or_update();


--
-- Name: spaces spaces_update_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER spaces_update_timestamp BEFORE UPDATE ON public.spaces FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: items items_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE;


--
-- Name: spaces spaces_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.spaces(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

