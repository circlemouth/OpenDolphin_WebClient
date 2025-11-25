--
-- PostgreSQL database dump
--


-- Dumped from database version 14.19 (Debian 14.19-1.pgdg13+1)
-- Dumped by pg_dump version 14.19 (Debian 14.19-1.pgdg13+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: d_health_insurance; Type: TABLE; Schema: public; Owner: opendolphin
--

CREATE TABLE public.d_health_insurance (
    id bigint NOT NULL,
    beanbytes oid NOT NULL,
    patient_id bigint NOT NULL
);


ALTER TABLE public.d_health_insurance OWNER TO opendolphin;

--
-- Name: d_health_insurance d_health_insurance_pkey; Type: CONSTRAINT; Schema: public; Owner: opendolphin
--

ALTER TABLE ONLY public.d_health_insurance
    ADD CONSTRAINT d_health_insurance_pkey PRIMARY KEY (id);


--
-- Name: d_health_insurance fkn8o5fcr59bnq4en7cbfp2src6; Type: FK CONSTRAINT; Schema: public; Owner: opendolphin
--

ALTER TABLE ONLY public.d_health_insurance
    ADD CONSTRAINT fkn8o5fcr59bnq4en7cbfp2src6 FOREIGN KEY (patient_id) REFERENCES public.d_patient(id);


--
-- PostgreSQL database dump complete
--


