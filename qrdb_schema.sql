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

