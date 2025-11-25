--
-- PostgreSQL database dump
--

\restrict Ufl4FaecKA2RxjdTE9dHxE0GtyDmQpmO3OkedwQujeeQsUCBTzFsCjgXJzZLtsH

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

--
-- Name: opendolphin; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA opendolphin;


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA opendolphin;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: bytea_to_oid(bytea); Type: FUNCTION; Schema: opendolphin; Owner: -
--

CREATE FUNCTION opendolphin.bytea_to_oid(bytea) RETURNS oid
    LANGUAGE sql STRICT
    AS $_$
  SELECT lo_from_bytea(0, $1);
$_$;


--
-- Name: CAST (bytea AS oid); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (bytea AS oid) WITH FUNCTION opendolphin.bytea_to_oid(bytea) AS IMPLICIT;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointment_model; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.appointment_model (
    id bigint NOT NULL,
    karte_id bigint,
    date date
);


--
-- Name: hibernate_sequence; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_appo; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_appo (
    id bigint DEFAULT nextval('opendolphin.hibernate_sequence'::regclass) NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    recorded timestamp without time zone NOT NULL,
    linkid bigint,
    linkrelation character varying(255),
    status character(1) DEFAULT 'F'::bpchar NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL,
    patientid character varying(255),
    c_name character varying(255) NOT NULL,
    memo text,
    c_date date NOT NULL
);


--
-- Name: d_attachment; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_attachment (
    id bigint DEFAULT nextval('opendolphin.hibernate_sequence'::regclass) NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    recorded timestamp without time zone NOT NULL,
    linkid bigint,
    linkrelation character varying(255),
    status character varying(1) DEFAULT 'F'::character varying NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL,
    filename character varying(255),
    contenttype character varying(255),
    contentsize bigint,
    lastmodified bigint,
    digest character varying(255),
    title character varying(255),
    uri character varying(255),
    extension character varying(255),
    memo text,
    bytes bytea NOT NULL,
    doc_id bigint NOT NULL
);


--
-- Name: d_attachment_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_attachment_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_audit_event; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_audit_event (
    id bigint NOT NULL,
    event_time timestamp with time zone NOT NULL,
    actor_id character varying(128),
    actor_display_name character varying(255),
    actor_role character varying(128),
    action character varying(64) NOT NULL,
    resource character varying(255),
    patient_id character varying(64),
    request_id character varying(64),
    ip_address character varying(64),
    user_agent character varying(512),
    payload_hash character varying(128) NOT NULL,
    previous_hash character varying(128),
    event_hash character varying(128) NOT NULL,
    payload text,
    trace_id character varying(64)
);


--
-- Name: d_audit_event_id_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_audit_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_audit_event_id_seq; Type: SEQUENCE OWNED BY; Schema: opendolphin; Owner: -
--

ALTER SEQUENCE opendolphin.d_audit_event_id_seq OWNED BY opendolphin.d_audit_event.id;


--
-- Name: d_diagnosis; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_diagnosis (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    department character varying(255),
    departmentdesc character varying(255),
    diagnosis character varying(255) NOT NULL,
    diagnosiscategory character varying(255),
    diagnosiscategorycodesys character varying(255),
    diagnosiscategorydesc character varying(255),
    diagnosiscode character varying(255),
    diagnosiscodesystem character varying(255),
    outcome character varying(255),
    outcomecodesys character varying(255),
    outcomedesc character varying(255),
    firstencounterdate character varying(255),
    relatedhealthinsurance character varying(255),
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_diagnosis_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_diagnosis_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_diagnosis_seq; Type: SEQUENCE OWNED BY; Schema: opendolphin; Owner: -
--

ALTER SEQUENCE opendolphin.d_diagnosis_seq OWNED BY opendolphin.d_diagnosis.id;


--
-- Name: d_document; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_document (
    id bigint DEFAULT nextval('opendolphin.hibernate_sequence'::regclass) NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    recorded timestamp without time zone NOT NULL,
    linkid bigint,
    linkrelation character varying(255),
    status character varying(1) DEFAULT 'F'::character varying NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL,
    docid character varying(32) NOT NULL,
    doctype character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    purpose character varying(255) NOT NULL,
    department character varying(255),
    departmentdesc character varying(255),
    healthinsurance character varying(255),
    healthinsurancedesc character varying(255),
    healthinsuranceguid character varying(255),
    hasmark boolean DEFAULT false NOT NULL,
    hasimage boolean DEFAULT false NOT NULL,
    hasrp boolean DEFAULT false NOT NULL,
    hastreatment boolean DEFAULT false NOT NULL,
    haslabotest boolean DEFAULT false NOT NULL,
    versionnumber character varying(255),
    parentid character varying(255),
    parentidrelation character varying(255),
    labtestordernumber character varying(255),
    claimdate timestamp without time zone,
    admflag character varying(1)
);


--
-- Name: d_document_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_document_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_factor2_backupkey; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_factor2_backupkey (
    id bigint NOT NULL,
    user_pk bigint,
    backup_code character varying(255),
    backupkey character varying(255),
    created_at timestamp without time zone,
    hash_algorithm character varying(32),
    userpk bigint NOT NULL
);


--
-- Name: d_factor2_challenge; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_factor2_challenge (
    id bigint NOT NULL,
    user_pk bigint NOT NULL,
    challenge_type character varying(64) NOT NULL,
    request_id character varying(64) NOT NULL,
    challenge_payload text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    rp_id character varying(255),
    origin character varying(512)
);


--
-- Name: d_factor2_challenge_id_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_factor2_challenge_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_factor2_challenge_id_seq; Type: SEQUENCE OWNED BY; Schema: opendolphin; Owner: -
--

ALTER SEQUENCE opendolphin.d_factor2_challenge_id_seq OWNED BY opendolphin.d_factor2_challenge.id;


--
-- Name: d_factor2_credential; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_factor2_credential (
    id bigint NOT NULL,
    user_pk bigint NOT NULL,
    credential_type character varying(32) NOT NULL,
    label character varying(255),
    credential_id character varying(512),
    public_key text,
    secret text,
    sign_count bigint DEFAULT 0,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    last_used_at timestamp with time zone,
    verified boolean DEFAULT false NOT NULL,
    transports text,
    metadata text
);


--
-- Name: d_factor2_credential_id_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_factor2_credential_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_factor2_credential_id_seq; Type: SEQUENCE OWNED BY; Schema: opendolphin; Owner: -
--

ALTER SEQUENCE opendolphin.d_factor2_credential_id_seq OWNED BY opendolphin.d_factor2_credential.id;


--
-- Name: d_image; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_image (
    id bigint DEFAULT nextval('opendolphin.hibernate_sequence'::regclass) NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    recorded timestamp without time zone NOT NULL,
    linkid bigint,
    linkrelation character varying(255),
    status character varying(1) DEFAULT 'F'::character varying NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL,
    contenttype character varying(255) NOT NULL,
    medicalrole character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    href character varying(255) NOT NULL,
    bucket character varying(255),
    sop character varying(255),
    url character varying(255),
    facilityid character varying(255),
    imagetime character varying(255),
    bodypart character varying(255),
    shutternum character varying(255),
    seqnum character varying(255),
    extension character varying(255),
    jpegbyte bytea NOT NULL,
    doc_id bigint NOT NULL
);


--
-- Name: d_image_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_image_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_letter_module_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_letter_module_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_letter_module; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_letter_module (
    id bigint DEFAULT nextval('opendolphin.d_letter_module_seq'::regclass) NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    recorded timestamp without time zone NOT NULL,
    linkid bigint,
    linkrelation character varying(255),
    status character varying(1) DEFAULT 'F'::character varying NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL,
    title character varying(255),
    lettertype character varying(255),
    handleclass character varying(255),
    clienthospital character varying(255),
    clientdept character varying(255),
    clientdoctor character varying(255),
    clientzipcode character varying(32),
    clientaddress character varying(255),
    clienttelephone character varying(64),
    clientfax character varying(64),
    consultanthospital character varying(255),
    consultantdept character varying(255),
    consultantdoctor character varying(255),
    consultantzipcode character varying(32),
    consultantaddress character varying(255),
    consultanttelephone character varying(64),
    consultantfax character varying(64),
    patientid character varying(64),
    patientname character varying(255),
    patientkana character varying(255),
    patientgender character varying(16),
    patientbirthday character varying(32),
    patientage character varying(32),
    patientoccupation character varying(255),
    patientzipcode character varying(32),
    patientaddress character varying(255),
    patienttelephone character varying(64),
    patientmobilephone character varying(64),
    patientfaxnumber character varying(64)
);


--
-- Name: d_module; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_module (
    id bigint DEFAULT nextval('opendolphin.hibernate_sequence'::regclass) NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    recorded timestamp without time zone NOT NULL,
    linkid bigint,
    linkrelation character varying(255),
    status character varying(1) DEFAULT 'F'::character varying NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    stampnumber integer NOT NULL,
    entity character varying(255) NOT NULL,
    performflag character varying(1),
    beanbytes oid NOT NULL,
    doc_id bigint NOT NULL
);


--
-- Name: d_module_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_module_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_nlabo_item_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_nlabo_item_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_nlabo_item; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_nlabo_item (
    id bigint DEFAULT nextval('opendolphin.d_nlabo_item_seq'::regclass) NOT NULL,
    patientid character varying(64) NOT NULL,
    sampledate character varying(64) NOT NULL,
    labocode character varying(64),
    lipemia character varying(32),
    hemolysis character varying(32),
    dialysis character varying(32),
    reportstatus character varying(32),
    groupcode character varying(64) NOT NULL,
    groupname character varying(255),
    parentcode character varying(64) NOT NULL,
    itemcode character varying(64) NOT NULL,
    mediscode character varying(64),
    itemname character varying(255) NOT NULL,
    abnormalflg character varying(32),
    normalvalue character varying(255),
    c_value character varying(255),
    unit character varying(32),
    specimencode character varying(64),
    specimenname character varying(255),
    commentcode1 character varying(64),
    comment1 character varying(255),
    commentcode2 character varying(64),
    comment2 character varying(255),
    sortkey character varying(64),
    labomodule_id bigint NOT NULL
);


--
-- Name: d_nlabo_module_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_nlabo_module_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_nlabo_module; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_nlabo_module (
    id bigint DEFAULT nextval('opendolphin.d_nlabo_module_seq'::regclass) NOT NULL,
    patientid character varying(64) NOT NULL,
    labocentercode character varying(64),
    patientname character varying(255),
    patientsex character varying(16),
    sampledate character varying(64),
    numofitems character varying(32),
    modulekey character varying(255),
    reportformat character varying(255)
);


--
-- Name: d_patient_visit; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_patient_visit (
    id bigint DEFAULT nextval('opendolphin.hibernate_sequence'::regclass) NOT NULL,
    patient_id bigint NOT NULL,
    facilityid character varying(255) NOT NULL,
    number integer,
    pvtdate character varying(32) NOT NULL,
    appointment character varying(255),
    department character varying(255),
    status integer DEFAULT 0 NOT NULL,
    insuranceuid character varying(64),
    deptcode character varying(64),
    deptname character varying(255),
    doctorid character varying(64),
    doctorname character varying(255),
    jmarinumber character varying(64),
    firstinsurance character varying(255),
    memo text,
    watingtime character varying(32)
);


--
-- Name: d_roles; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_roles (
    id bigint NOT NULL,
    user_id character varying(255) NOT NULL,
    c_role character varying(255) NOT NULL,
    c_user bigint NOT NULL
);


--
-- Name: d_stamp_tree_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_stamp_tree_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_stamp_tree; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_stamp_tree (
    id bigint DEFAULT nextval('opendolphin.d_stamp_tree_seq'::regclass) NOT NULL,
    user_id bigint NOT NULL,
    tree_name character varying(255) NOT NULL,
    publishtype character varying(64),
    category character varying(64),
    partyname character varying(255),
    url character varying(255),
    description text,
    publisheddate date,
    lastupdated date,
    published character varying(255),
    treebytes oid NOT NULL,
    versionnumber character varying(64)
);


--
-- Name: d_third_party_disclosure; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.d_third_party_disclosure (
    id bigint NOT NULL,
    patient_id character varying(64) NOT NULL,
    actor_id character varying(128),
    actor_role character varying(128),
    recipient character varying(255) NOT NULL,
    purpose character varying(512),
    description text,
    legal_basis character varying(255),
    disclosed_at timestamp with time zone NOT NULL,
    reference_id character varying(128)
);


--
-- Name: d_third_party_disclosure_id_seq; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.d_third_party_disclosure_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: d_third_party_disclosure_id_seq; Type: SEQUENCE OWNED BY; Schema: opendolphin; Owner: -
--

ALTER SEQUENCE opendolphin.d_third_party_disclosure_id_seq OWNED BY opendolphin.d_third_party_disclosure.id;


--
-- Name: document_model; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.document_model (
    id bigint NOT NULL,
    karte_id bigint,
    started timestamp without time zone,
    status character varying(32),
    link_id bigint
);


--
-- Name: facility_num; Type: SEQUENCE; Schema: opendolphin; Owner: -
--

CREATE SEQUENCE opendolphin.facility_num
    START WITH 200
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: flyway_schema_history; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


--
-- Name: nlabo_module; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.nlabo_module (
    id bigint NOT NULL,
    patient_id bigint,
    sample_date timestamp without time zone
);


--
-- Name: patient_model; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.patient_model (
    id bigint NOT NULL,
    facility_id bigint,
    kana_name character varying(255)
);


--
-- Name: patient_visit_model; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.patient_visit_model (
    id bigint NOT NULL,
    facility_id bigint,
    pvt_date timestamp without time zone,
    status character varying(32)
);


--
-- Name: phr_async_job; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.phr_async_job (
    job_id uuid NOT NULL,
    job_type character varying(64) NOT NULL,
    facility_id character varying(32) NOT NULL,
    patient_scope jsonb NOT NULL,
    state character varying(16) NOT NULL,
    progress smallint DEFAULT 0 NOT NULL,
    result_uri text,
    error_code character varying(32),
    error_message text,
    queued_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    retry_count smallint DEFAULT 0 NOT NULL,
    locked_by character varying(64),
    heartbeat_at timestamp with time zone
);


--
-- Name: registered_diagnosis_model; Type: TABLE; Schema: opendolphin; Owner: -
--

CREATE TABLE opendolphin.registered_diagnosis_model (
    id bigint NOT NULL,
    karte_id bigint,
    started timestamp without time zone
);


--
-- Name: appointment_model; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_model (
    id bigint NOT NULL,
    karte_id bigint,
    date date
);


--
-- Name: d_appo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_appo (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    c_date date NOT NULL,
    memo character varying(255),
    c_name character varying(255) NOT NULL,
    patientid character varying(255),
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_attachment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_attachment (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    bytes oid NOT NULL,
    contentsize bigint NOT NULL,
    contenttype character varying(255),
    digest character varying(255),
    extension character varying(255),
    filename character varying(255),
    lastmodified bigint NOT NULL,
    memo character varying(255),
    title character varying(255),
    uri character varying(255),
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL,
    doc_id bigint NOT NULL
);


--
-- Name: d_audit_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_audit_event (
    id bigint NOT NULL,
    action character varying(64) NOT NULL,
    actor_display_name character varying(255),
    actor_id character varying(128),
    actor_role character varying(128),
    event_hash character varying(128) NOT NULL,
    event_time timestamp without time zone NOT NULL,
    ip_address character varying(64),
    patient_id character varying(64),
    payload text,
    payload_hash character varying(128) NOT NULL,
    previous_hash character varying(128),
    request_id character varying(64),
    resource character varying(255),
    user_agent character varying(512)
);


--
-- Name: d_byte_module; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_byte_module (
    id bigint NOT NULL,
    beanbytes oid
);


--
-- Name: d_care_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_care_plan (
    id bigint NOT NULL,
    admincode character varying(255),
    admincodesystem character varying(255),
    adminmemo character varying(255),
    administration character varying(255),
    bundlenumber character varying(255),
    classcode character varying(255),
    classcodesystem character varying(255),
    classname character varying(255),
    commonname character varying(255),
    created timestamp without time zone,
    enddate date,
    entity character varying(255),
    frequency integer,
    insurance character varying(255),
    karteid bigint NOT NULL,
    memo character varying(255),
    ordername character varying(255),
    stampname character varying(255),
    startdate date,
    status character varying(255),
    updated timestamp without time zone,
    userid character varying(255)
);


--
-- Name: d_care_plan_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_care_plan_item (
    id bigint NOT NULL,
    classcode character varying(255),
    classcodesystem character varying(255),
    code character varying(255),
    codesystem character varying(255),
    memo character varying(255),
    name character varying(255),
    number character varying(255),
    numbercode character varying(255),
    numbercodesystem character varying(255),
    unit character varying(255),
    ykzkbn character varying(255),
    careplan_id bigint NOT NULL
);


--
-- Name: d_composite_image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_composite_image (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    compositor bigint NOT NULL,
    contenttype character varying(255) NOT NULL,
    href character varying(255) NOT NULL,
    jpegbyte oid NOT NULL,
    medicalrole character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_diagnosis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_diagnosis (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    department character varying(255),
    departmentdesc character varying(255),
    diagnosis character varying(255) NOT NULL,
    diagnosiscategory character varying(255),
    diagnosiscategorycodesys character varying(255),
    diagnosiscategorydesc character varying(255),
    diagnosiscode character varying(255),
    diagnosiscodesystem character varying(255),
    outcome character varying(255),
    outcomecodesys character varying(255),
    outcomedesc character varying(255),
    firstencounterdate character varying(255),
    relatedhealthinsurance character varying(255),
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_document (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    admflag character varying(1),
    claimdate timestamp without time zone,
    department character varying(255),
    departmentdesc character varying(255),
    docid character varying(32) NOT NULL,
    doctype character varying(255) NOT NULL,
    hasimage boolean NOT NULL,
    haslabotest boolean NOT NULL,
    hasmark boolean NOT NULL,
    hasrp boolean NOT NULL,
    hastreatment boolean NOT NULL,
    healthinsurance character varying(255),
    healthinsurancedesc character varying(255),
    healthinsuranceguid character varying(255),
    labtestordernumber character varying(255),
    parentid character varying(255),
    parentidrelation character varying(255),
    purpose character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    versionnumber character varying(255),
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_facility; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_facility (
    id bigint NOT NULL,
    address character varying(255) NOT NULL,
    facilityid character varying(255) NOT NULL,
    facilityname character varying(255) NOT NULL,
    facsimile character varying(255),
    membertype character varying(255) NOT NULL,
    registereddate date NOT NULL,
    s3accesskey character varying(255),
    s3secretkey character varying(255),
    s3url character varying(255),
    telephone character varying(255) NOT NULL,
    url character varying(255),
    zipcode character varying(255) NOT NULL
);


--
-- Name: d_factor2_backupkey; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_factor2_backupkey (
    id bigint NOT NULL,
    backupkey character varying(255),
    created_at timestamp without time zone,
    hash_algorithm character varying(32),
    userpk bigint NOT NULL
);


--
-- Name: d_factor2_challenge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_factor2_challenge (
    id bigint NOT NULL,
    challenge_payload text NOT NULL,
    challenge_type character varying(64) NOT NULL,
    created_at timestamp without time zone NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    origin character varying(512),
    request_id character varying(64) NOT NULL,
    rp_id character varying(255),
    user_pk bigint NOT NULL
);


--
-- Name: d_factor2_code; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_factor2_code (
    id bigint NOT NULL,
    code character varying(255),
    mobilenumber character varying(255),
    userpk bigint NOT NULL
);


--
-- Name: d_factor2_credential; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_factor2_credential (
    id bigint NOT NULL,
    created_at timestamp without time zone,
    credential_id character varying(512),
    credential_type character varying(32) NOT NULL,
    label character varying(255),
    last_used_at timestamp without time zone,
    metadata text,
    public_key text,
    secret text,
    sign_count bigint,
    transports text,
    updated_at timestamp without time zone,
    user_pk bigint NOT NULL,
    verified boolean NOT NULL
);


--
-- Name: d_factor2_device; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_factor2_device (
    id bigint NOT NULL,
    devicename character varying(255),
    entrydate character varying(255),
    macaddress character varying(255),
    userpk bigint NOT NULL
);


--
-- Name: d_first_encounter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_first_encounter (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    beanbytes bytea NOT NULL,
    doctype character varying(255),
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_health_insurance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_health_insurance (
    id bigint NOT NULL,
    beanbytes oid NOT NULL,
    patient_id bigint NOT NULL
);


--
-- Name: d_image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_image (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    bodypart character varying(255),
    bucket character varying(255),
    contenttype character varying(255) NOT NULL,
    extension character varying(255),
    facilityid character varying(255),
    href character varying(255) NOT NULL,
    imagetime character varying(255),
    medicalrole character varying(255) NOT NULL,
    seqnum character varying(255),
    shutternum character varying(255),
    sop character varying(255),
    title character varying(255) NOT NULL,
    url character varying(255),
    jpegbyte oid NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL,
    doc_id bigint NOT NULL
);


--
-- Name: d_karte; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_karte (
    id bigint NOT NULL,
    created date NOT NULL,
    patient_id bigint NOT NULL
);


--
-- Name: d_labo_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_labo_item (
    id bigint NOT NULL,
    acode character varying(255),
    icode character varying(255),
    itemcode character varying(255),
    itemcodeid character varying(255),
    itemname character varying(255),
    itemvalue character varying(255),
    low character varying(255),
    mcode character varying(255),
    normal character varying(255),
    nout character varying(255),
    rcode character varying(255),
    scode character varying(255),
    unit character varying(255),
    unitcode character varying(255),
    unitcodeid character varying(255),
    up character varying(255),
    specimen_id bigint NOT NULL
);


--
-- Name: d_labo_module; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_labo_module (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    clientfacility character varying(255),
    clientfacilitycode character varying(255),
    clientfacilitycodeid character varying(255),
    docid character varying(32) NOT NULL,
    laboratorycenter character varying(255),
    laboratorycentercode character varying(255),
    laboratorycentercodeid character varying(255),
    registid character varying(255),
    registtime character varying(255),
    reportstatus character varying(255),
    reportstatuscode character varying(255),
    reportstatuscodeid character varying(255),
    reporttime character varying(255),
    sampletime character varying(255),
    setcode character varying(255),
    setcodeid character varying(255),
    setname character varying(255),
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_labo_specimen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_labo_specimen (
    id bigint NOT NULL,
    specimencode character varying(255),
    specimencodeid character varying(255),
    specimenname character varying(255),
    module_id bigint NOT NULL
);


--
-- Name: d_letter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_letter (
    doctype character varying(31) NOT NULL,
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    beanbytes bytea NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_letter_date; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_letter_date (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    c_value date,
    module_id bigint NOT NULL
);


--
-- Name: d_letter_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_letter_item (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    c_value character varying(255),
    module_id bigint NOT NULL
);


--
-- Name: d_letter_module; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_letter_module (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    clientaddress character varying(255),
    clientdept character varying(255),
    clientdoctor character varying(255),
    clientfax character varying(255),
    clienthospital character varying(255),
    clienttelephone character varying(255),
    clientzipcode character varying(255),
    consultantaddress character varying(255),
    consultantdept character varying(255),
    consultantdoctor character varying(255),
    consultantfax character varying(255),
    consultanthospital character varying(255),
    consultanttelephone character varying(255),
    consultantzipcode character varying(255),
    handleclass character varying(255),
    lettertype character varying(255),
    patientaddress character varying(255),
    patientage character varying(255),
    patientbirthday character varying(255),
    patientfaxnumber character varying(255),
    patientgender character varying(255),
    patientid character varying(255),
    patientkana character varying(255),
    patientmobilephone character varying(255),
    patientname character varying(255),
    patientoccupation character varying(255),
    patienttelephone character varying(255),
    patientzipcode character varying(255),
    title character varying(255),
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_letter_text; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_letter_text (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    textvalue text,
    module_id bigint NOT NULL
);


--
-- Name: d_module; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_module (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    beanbytes oid NOT NULL,
    entity character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    performflag character varying(1),
    role character varying(255) NOT NULL,
    stampnumber integer NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL,
    doc_id bigint NOT NULL
);


--
-- Name: d_nlabo_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_nlabo_item (
    id bigint NOT NULL,
    abnormalflg character varying(255),
    comment1 character varying(255),
    comment2 character varying(255),
    commentcode1 character varying(255),
    commentcode2 character varying(255),
    dialysis character varying(255),
    groupcode character varying(255) NOT NULL,
    groupname character varying(255),
    hemolysis character varying(255),
    itemcode character varying(255) NOT NULL,
    itemname character varying(255) NOT NULL,
    labocode character varying(255),
    lipemia character varying(255),
    mediscode character varying(255),
    normalvalue character varying(255),
    parentcode character varying(255) NOT NULL,
    patientid character varying(255) NOT NULL,
    reportstatus character varying(255),
    sampledate character varying(255) NOT NULL,
    sortkey character varying(255),
    specimencode character varying(255),
    specimenname character varying(255),
    unit character varying(255),
    c_value character varying(255),
    labomodule_id bigint NOT NULL
);


--
-- Name: d_nlabo_module; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_nlabo_module (
    id bigint NOT NULL,
    labocentercode character varying(255),
    modulekey character varying(255),
    numofitems character varying(255),
    patientid character varying(255) NOT NULL,
    patientname character varying(255),
    patientsex character varying(255),
    reportformat character varying(255),
    sampledate character varying(255)
);


--
-- Name: d_nurse_progress_course; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_nurse_progress_course (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    progresstext text,
    textlength integer NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_observation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_observation (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    categoryvalue character varying(255),
    memo character varying(255),
    observation character varying(255) NOT NULL,
    phenomenon character varying(255) NOT NULL,
    unit character varying(255),
    c_value character varying(255),
    valuedesc character varying(255),
    valuesys character varying(255),
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_oid; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_oid (
    id bigint NOT NULL,
    baseoid character varying(255) NOT NULL,
    nextnumber integer NOT NULL
);


--
-- Name: d_ondoban; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_ondoban (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    dayindex integer NOT NULL,
    memo character varying(255),
    seriesindex integer NOT NULL,
    seriesname character varying(255) NOT NULL,
    unit character varying(255),
    c_value real NOT NULL,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_patient; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_patient (
    id bigint NOT NULL,
    address character varying(255),
    zipcode character varying(255),
    appmemo character varying(255),
    birthday character varying(255),
    email character varying(255),
    facilityid character varying(255) NOT NULL,
    familyname character varying(255),
    fullname character varying(255) NOT NULL,
    gender character varying(255) NOT NULL,
    genderdesc character varying(255),
    givenname character varying(255),
    jpegphoto oid,
    kanafamilyname character varying(255),
    kanagivenname character varying(255),
    kananame character varying(255),
    maritalstatus character varying(255),
    memo character varying(255),
    mobilephone character varying(255),
    nationality character varying(255),
    owneruuid character varying(255),
    patientid character varying(255) NOT NULL,
    relations character varying(255),
    reserve1 character varying(255),
    reserve2 character varying(255),
    reserve3 character varying(255),
    reserve4 character varying(255),
    reserve5 character varying(255),
    reserve6 character varying(255),
    romanfamilyname character varying(255),
    romangivenname character varying(255),
    romanname character varying(255),
    telephone character varying(255)
);


--
-- Name: d_patient_freedocument; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_patient_freedocument (
    id bigint NOT NULL,
    comment text,
    confirmed timestamp without time zone NOT NULL,
    facilitypatid character varying(255) NOT NULL
);


--
-- Name: d_patient_memo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_patient_memo (
    id bigint NOT NULL,
    confirmed timestamp without time zone NOT NULL,
    ended timestamp without time zone,
    linkid bigint NOT NULL,
    linkrelation character varying(255),
    recorded timestamp without time zone NOT NULL,
    started timestamp without time zone NOT NULL,
    status character varying(1) NOT NULL,
    memo character varying(255),
    memo2 text,
    creator_id bigint NOT NULL,
    karte_id bigint NOT NULL
);


--
-- Name: d_patient_visit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_patient_visit (
    id bigint NOT NULL,
    department character varying(255),
    deptcode character varying(255),
    deptname character varying(255),
    doctorid character varying(255),
    doctorname character varying(255),
    facilityid character varying(255) NOT NULL,
    firstinsurance character varying(255),
    insuranceuid character varying(255),
    jmarinumber character varying(255),
    memo character varying(255),
    pvtdate character varying(255) NOT NULL,
    status integer NOT NULL,
    patient_id bigint NOT NULL
);


--
-- Name: d_phr_key; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_phr_key (
    id bigint NOT NULL,
    accesskey character varying(255),
    facilityid character varying(255),
    patientid character varying(255),
    registered timestamp without time zone,
    secretkey character varying(255)
);


--
-- Name: d_published_tree; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_published_tree (
    id bigint NOT NULL,
    category character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    lastupdated date NOT NULL,
    name character varying(255) NOT NULL,
    partyname character varying(255) NOT NULL,
    publishtype character varying(255) NOT NULL,
    publisheddate date NOT NULL,
    treebytes oid NOT NULL,
    url character varying(255) NOT NULL,
    user_id bigint NOT NULL
);


--
-- Name: d_radiology_method; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_radiology_method (
    id integer NOT NULL,
    hierarchycode1 character varying(255),
    hierarchycode2 character varying(255),
    methodname character varying(255)
);


--
-- Name: d_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_roles (
    id bigint NOT NULL,
    c_role character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    c_user bigint NOT NULL
);


--
-- Name: d_stamp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_stamp (
    id character varying(255) NOT NULL,
    entity character varying(255) NOT NULL,
    stampbytes oid NOT NULL,
    userid bigint NOT NULL
);


--
-- Name: d_stamp_tree; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_stamp_tree (
    id bigint NOT NULL,
    category character varying(255),
    description character varying(255),
    lastupdated date,
    tree_name character varying(255) NOT NULL,
    partyname character varying(255),
    publishtype character varying(255),
    published character varying(255),
    publisheddate date,
    treebytes oid NOT NULL,
    url character varying(255),
    versionnumber character varying(255),
    user_id bigint NOT NULL
);


--
-- Name: d_subscribed_tree; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_subscribed_tree (
    id bigint NOT NULL,
    treeid bigint NOT NULL,
    user_id bigint NOT NULL
);


--
-- Name: d_third_party_disclosure; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_third_party_disclosure (
    id bigint NOT NULL,
    actor_id character varying(128),
    actor_role character varying(128),
    description text,
    disclosed_at timestamp without time zone NOT NULL,
    legal_basis character varying(255),
    patient_id character varying(64) NOT NULL,
    purpose character varying(512),
    recipient character varying(255) NOT NULL,
    reference_id character varying(128)
);


--
-- Name: d_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_users (
    id bigint NOT NULL,
    commonname character varying(255) NOT NULL,
    department character varying(255),
    departmentcodesys character varying(255),
    departmentdesc character varying(255),
    email character varying(255) NOT NULL,
    factor2auth character varying(255),
    givenname character varying(255),
    license character varying(255),
    licensecodesys character varying(255),
    licensedesc character varying(255),
    mainmobile character varying(255),
    membertype character varying(255) NOT NULL,
    memo character varying(255),
    orcaid character varying(255),
    password character varying(255) NOT NULL,
    registereddate date NOT NULL,
    sirname character varying(255),
    submobile character varying(255),
    usedrugid character varying(255),
    userid character varying(255) NOT NULL,
    facility_id bigint NOT NULL
);


--
-- Name: d_vital; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d_vital (
    id bigint NOT NULL,
    algia character varying(255),
    bloodpressurediastolic character varying(255),
    bloodpressuresystolic character varying(255),
    bodytemperature character varying(255),
    egestion character varying(255),
    facilitypatid character varying(255) NOT NULL,
    feel character varying(255),
    height character varying(255),
    karteid character varying(255),
    meal character varying(255),
    ps character varying(255),
    pulserate character varying(255),
    respirationrate character varying(255),
    savedate character varying(255),
    sleep character varying(255),
    spo2 character varying(255),
    vitaldate character varying(255),
    vitaltime character varying(255),
    weight character varying(255)
);


--
-- Name: demo_disease; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demo_disease (
    id bigint NOT NULL,
    disease character varying(255) NOT NULL
);


--
-- Name: demo_patient; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demo_patient (
    id bigint NOT NULL,
    address character varying(255),
    addresscode character varying(255),
    age character varying(255),
    birthday character varying(255),
    carrier character varying(255),
    email character varying(255),
    kana character varying(255) NOT NULL,
    marital character varying(255),
    mobile character varying(255),
    name character varying(255) NOT NULL,
    sex character varying(255),
    telephone character varying(255)
);


--
-- Name: demo_rp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demo_rp (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    quantity character varying(255),
    unit character varying(255)
);


--
-- Name: document_model; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_model (
    id bigint NOT NULL,
    karte_id bigint,
    started timestamp without time zone,
    status character varying(32),
    link_id bigint
);


--
-- Name: facility_num; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.facility_num
    START WITH 200
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hibernate_sequence; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nlabo_module; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nlabo_module (
    id bigint NOT NULL,
    patient_id bigint,
    sample_date timestamp without time zone
);


--
-- Name: patient_model; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_model (
    id bigint NOT NULL,
    facility_id bigint,
    kana_name character varying(255)
);


--
-- Name: patient_visit_model; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_visit_model (
    id bigint NOT NULL,
    facility_id bigint,
    pvt_date timestamp without time zone,
    status character varying(32)
);


--
-- Name: phr_async_job; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phr_async_job (
    job_id uuid NOT NULL,
    error_code character varying(32),
    error_message character varying(255),
    facility_id character varying(32) NOT NULL,
    finished_at timestamp without time zone,
    heartbeat_at timestamp without time zone,
    job_type character varying(64) NOT NULL,
    locked_by character varying(64),
    patient_scope jsonb NOT NULL,
    progress integer NOT NULL,
    queued_at timestamp without time zone NOT NULL,
    result_uri character varying(255),
    retry_count integer NOT NULL,
    started_at timestamp without time zone,
    state character varying(16) NOT NULL
);


--
-- Name: registered_diagnosis_model; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registered_diagnosis_model (
    id bigint NOT NULL,
    karte_id bigint,
    started timestamp without time zone
);


--
-- Name: d_audit_event id; Type: DEFAULT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_audit_event ALTER COLUMN id SET DEFAULT nextval('opendolphin.d_audit_event_id_seq'::regclass);


--
-- Name: d_diagnosis id; Type: DEFAULT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_diagnosis ALTER COLUMN id SET DEFAULT nextval('opendolphin.d_diagnosis_seq'::regclass);


--
-- Name: d_factor2_challenge id; Type: DEFAULT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_factor2_challenge ALTER COLUMN id SET DEFAULT nextval('opendolphin.d_factor2_challenge_id_seq'::regclass);


--
-- Name: d_factor2_credential id; Type: DEFAULT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_factor2_credential ALTER COLUMN id SET DEFAULT nextval('opendolphin.d_factor2_credential_id_seq'::regclass);


--
-- Name: d_third_party_disclosure id; Type: DEFAULT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_third_party_disclosure ALTER COLUMN id SET DEFAULT nextval('opendolphin.d_third_party_disclosure_id_seq'::regclass);


--
-- Name: appointment_model appointment_model_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.appointment_model
    ADD CONSTRAINT appointment_model_pkey PRIMARY KEY (id);


--
-- Name: d_appo d_appo_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_appo
    ADD CONSTRAINT d_appo_pkey PRIMARY KEY (id);


--
-- Name: d_attachment d_attachment_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_attachment
    ADD CONSTRAINT d_attachment_pkey PRIMARY KEY (id);


--
-- Name: d_audit_event d_audit_event_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_audit_event
    ADD CONSTRAINT d_audit_event_pkey PRIMARY KEY (id);


--
-- Name: d_diagnosis d_diagnosis_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_diagnosis
    ADD CONSTRAINT d_diagnosis_pkey PRIMARY KEY (id);


--
-- Name: d_document d_document_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_document
    ADD CONSTRAINT d_document_pkey PRIMARY KEY (id);


--
-- Name: d_factor2_backupkey d_factor2_backupkey_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_factor2_backupkey
    ADD CONSTRAINT d_factor2_backupkey_pkey PRIMARY KEY (id);


--
-- Name: d_factor2_challenge d_factor2_challenge_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_factor2_challenge
    ADD CONSTRAINT d_factor2_challenge_pkey PRIMARY KEY (id);


--
-- Name: d_factor2_challenge d_factor2_challenge_request_id_key; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_factor2_challenge
    ADD CONSTRAINT d_factor2_challenge_request_id_key UNIQUE (request_id);


--
-- Name: d_factor2_credential d_factor2_credential_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_factor2_credential
    ADD CONSTRAINT d_factor2_credential_pkey PRIMARY KEY (id);


--
-- Name: d_image d_image_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_image
    ADD CONSTRAINT d_image_pkey PRIMARY KEY (id);


--
-- Name: d_letter_module d_letter_module_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_letter_module
    ADD CONSTRAINT d_letter_module_pkey PRIMARY KEY (id);


--
-- Name: d_module d_module_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_module
    ADD CONSTRAINT d_module_pkey PRIMARY KEY (id);


--
-- Name: d_nlabo_item d_nlabo_item_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_nlabo_item
    ADD CONSTRAINT d_nlabo_item_pkey PRIMARY KEY (id);


--
-- Name: d_nlabo_module d_nlabo_module_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_nlabo_module
    ADD CONSTRAINT d_nlabo_module_pkey PRIMARY KEY (id);


--
-- Name: d_patient_visit d_patient_visit_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_patient_visit
    ADD CONSTRAINT d_patient_visit_pkey PRIMARY KEY (id);


--
-- Name: d_roles d_roles_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_roles
    ADD CONSTRAINT d_roles_pkey PRIMARY KEY (id);


--
-- Name: d_stamp_tree d_stamp_tree_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_stamp_tree
    ADD CONSTRAINT d_stamp_tree_pkey PRIMARY KEY (id);


--
-- Name: d_third_party_disclosure d_third_party_disclosure_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_third_party_disclosure
    ADD CONSTRAINT d_third_party_disclosure_pkey PRIMARY KEY (id);


--
-- Name: document_model document_model_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.document_model
    ADD CONSTRAINT document_model_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: nlabo_module nlabo_module_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.nlabo_module
    ADD CONSTRAINT nlabo_module_pkey PRIMARY KEY (id);


--
-- Name: patient_model patient_model_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.patient_model
    ADD CONSTRAINT patient_model_pkey PRIMARY KEY (id);


--
-- Name: patient_visit_model patient_visit_model_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.patient_visit_model
    ADD CONSTRAINT patient_visit_model_pkey PRIMARY KEY (id);


--
-- Name: phr_async_job phr_async_job_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.phr_async_job
    ADD CONSTRAINT phr_async_job_pkey PRIMARY KEY (job_id);


--
-- Name: registered_diagnosis_model registered_diagnosis_model_pkey; Type: CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.registered_diagnosis_model
    ADD CONSTRAINT registered_diagnosis_model_pkey PRIMARY KEY (id);


--
-- Name: appointment_model appointment_model_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_model
    ADD CONSTRAINT appointment_model_pkey PRIMARY KEY (id);


--
-- Name: d_appo d_appo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_appo
    ADD CONSTRAINT d_appo_pkey PRIMARY KEY (id);


--
-- Name: d_attachment d_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_attachment
    ADD CONSTRAINT d_attachment_pkey PRIMARY KEY (id);


--
-- Name: d_audit_event d_audit_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_audit_event
    ADD CONSTRAINT d_audit_event_pkey PRIMARY KEY (id);


--
-- Name: d_byte_module d_byte_module_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_byte_module
    ADD CONSTRAINT d_byte_module_pkey PRIMARY KEY (id);


--
-- Name: d_care_plan_item d_care_plan_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_care_plan_item
    ADD CONSTRAINT d_care_plan_item_pkey PRIMARY KEY (id);


--
-- Name: d_care_plan d_care_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_care_plan
    ADD CONSTRAINT d_care_plan_pkey PRIMARY KEY (id);


--
-- Name: d_composite_image d_composite_image_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_composite_image
    ADD CONSTRAINT d_composite_image_pkey PRIMARY KEY (id);


--
-- Name: d_diagnosis d_diagnosis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_diagnosis
    ADD CONSTRAINT d_diagnosis_pkey PRIMARY KEY (id);


--
-- Name: d_document d_document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_document
    ADD CONSTRAINT d_document_pkey PRIMARY KEY (id);


--
-- Name: d_facility d_facility_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_facility
    ADD CONSTRAINT d_facility_pkey PRIMARY KEY (id);


--
-- Name: d_factor2_backupkey d_factor2_backupkey_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_factor2_backupkey
    ADD CONSTRAINT d_factor2_backupkey_pkey PRIMARY KEY (id);


--
-- Name: d_factor2_challenge d_factor2_challenge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_factor2_challenge
    ADD CONSTRAINT d_factor2_challenge_pkey PRIMARY KEY (id);


--
-- Name: d_factor2_code d_factor2_code_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_factor2_code
    ADD CONSTRAINT d_factor2_code_pkey PRIMARY KEY (id);


--
-- Name: d_factor2_credential d_factor2_credential_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_factor2_credential
    ADD CONSTRAINT d_factor2_credential_pkey PRIMARY KEY (id);


--
-- Name: d_factor2_device d_factor2_device_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_factor2_device
    ADD CONSTRAINT d_factor2_device_pkey PRIMARY KEY (id);


--
-- Name: d_first_encounter d_first_encounter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_first_encounter
    ADD CONSTRAINT d_first_encounter_pkey PRIMARY KEY (id);


--
-- Name: d_health_insurance d_health_insurance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_health_insurance
    ADD CONSTRAINT d_health_insurance_pkey PRIMARY KEY (id);


--
-- Name: d_image d_image_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_image
    ADD CONSTRAINT d_image_pkey PRIMARY KEY (id);


--
-- Name: d_karte d_karte_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_karte
    ADD CONSTRAINT d_karte_pkey PRIMARY KEY (id);


--
-- Name: d_labo_item d_labo_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_labo_item
    ADD CONSTRAINT d_labo_item_pkey PRIMARY KEY (id);


--
-- Name: d_labo_module d_labo_module_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_labo_module
    ADD CONSTRAINT d_labo_module_pkey PRIMARY KEY (id);


--
-- Name: d_labo_specimen d_labo_specimen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_labo_specimen
    ADD CONSTRAINT d_labo_specimen_pkey PRIMARY KEY (id);


--
-- Name: d_letter_date d_letter_date_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter_date
    ADD CONSTRAINT d_letter_date_pkey PRIMARY KEY (id);


--
-- Name: d_letter_item d_letter_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter_item
    ADD CONSTRAINT d_letter_item_pkey PRIMARY KEY (id);


--
-- Name: d_letter_module d_letter_module_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter_module
    ADD CONSTRAINT d_letter_module_pkey PRIMARY KEY (id);


--
-- Name: d_letter d_letter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter
    ADD CONSTRAINT d_letter_pkey PRIMARY KEY (id);


--
-- Name: d_letter_text d_letter_text_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter_text
    ADD CONSTRAINT d_letter_text_pkey PRIMARY KEY (id);


--
-- Name: d_module d_module_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_module
    ADD CONSTRAINT d_module_pkey PRIMARY KEY (id);


--
-- Name: d_nlabo_item d_nlabo_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_nlabo_item
    ADD CONSTRAINT d_nlabo_item_pkey PRIMARY KEY (id);


--
-- Name: d_nlabo_module d_nlabo_module_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_nlabo_module
    ADD CONSTRAINT d_nlabo_module_pkey PRIMARY KEY (id);


--
-- Name: d_nurse_progress_course d_nurse_progress_course_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_nurse_progress_course
    ADD CONSTRAINT d_nurse_progress_course_pkey PRIMARY KEY (id);


--
-- Name: d_observation d_observation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_observation
    ADD CONSTRAINT d_observation_pkey PRIMARY KEY (id);


--
-- Name: d_oid d_oid_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_oid
    ADD CONSTRAINT d_oid_pkey PRIMARY KEY (id);


--
-- Name: d_ondoban d_ondoban_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_ondoban
    ADD CONSTRAINT d_ondoban_pkey PRIMARY KEY (id);


--
-- Name: d_patient_freedocument d_patient_freedocument_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_patient_freedocument
    ADD CONSTRAINT d_patient_freedocument_pkey PRIMARY KEY (id);


--
-- Name: d_patient_memo d_patient_memo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_patient_memo
    ADD CONSTRAINT d_patient_memo_pkey PRIMARY KEY (id);


--
-- Name: d_patient d_patient_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_patient
    ADD CONSTRAINT d_patient_pkey PRIMARY KEY (id);


--
-- Name: d_patient_visit d_patient_visit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_patient_visit
    ADD CONSTRAINT d_patient_visit_pkey PRIMARY KEY (id);


--
-- Name: d_phr_key d_phr_key_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_phr_key
    ADD CONSTRAINT d_phr_key_pkey PRIMARY KEY (id);


--
-- Name: d_published_tree d_published_tree_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_published_tree
    ADD CONSTRAINT d_published_tree_pkey PRIMARY KEY (id);


--
-- Name: d_radiology_method d_radiology_method_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_radiology_method
    ADD CONSTRAINT d_radiology_method_pkey PRIMARY KEY (id);


--
-- Name: d_roles d_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_roles
    ADD CONSTRAINT d_roles_pkey PRIMARY KEY (id);


--
-- Name: d_stamp d_stamp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_stamp
    ADD CONSTRAINT d_stamp_pkey PRIMARY KEY (id);


--
-- Name: d_stamp_tree d_stamp_tree_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_stamp_tree
    ADD CONSTRAINT d_stamp_tree_pkey PRIMARY KEY (id);


--
-- Name: d_subscribed_tree d_subscribed_tree_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_subscribed_tree
    ADD CONSTRAINT d_subscribed_tree_pkey PRIMARY KEY (id);


--
-- Name: d_third_party_disclosure d_third_party_disclosure_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_third_party_disclosure
    ADD CONSTRAINT d_third_party_disclosure_pkey PRIMARY KEY (id);


--
-- Name: d_users d_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_users
    ADD CONSTRAINT d_users_pkey PRIMARY KEY (id);


--
-- Name: d_vital d_vital_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_vital
    ADD CONSTRAINT d_vital_pkey PRIMARY KEY (id);


--
-- Name: demo_disease demo_disease_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demo_disease
    ADD CONSTRAINT demo_disease_pkey PRIMARY KEY (id);


--
-- Name: demo_patient demo_patient_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demo_patient
    ADD CONSTRAINT demo_patient_pkey PRIMARY KEY (id);


--
-- Name: demo_rp demo_rp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demo_rp
    ADD CONSTRAINT demo_rp_pkey PRIMARY KEY (id);


--
-- Name: document_model document_model_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_model
    ADD CONSTRAINT document_model_pkey PRIMARY KEY (id);


--
-- Name: nlabo_module nlabo_module_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nlabo_module
    ADD CONSTRAINT nlabo_module_pkey PRIMARY KEY (id);


--
-- Name: patient_model patient_model_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_model
    ADD CONSTRAINT patient_model_pkey PRIMARY KEY (id);


--
-- Name: patient_visit_model patient_visit_model_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_visit_model
    ADD CONSTRAINT patient_visit_model_pkey PRIMARY KEY (id);


--
-- Name: phr_async_job phr_async_job_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phr_async_job
    ADD CONSTRAINT phr_async_job_pkey PRIMARY KEY (job_id);


--
-- Name: registered_diagnosis_model registered_diagnosis_model_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registered_diagnosis_model
    ADD CONSTRAINT registered_diagnosis_model_pkey PRIMARY KEY (id);


--
-- Name: d_labo_module uk_1mfynfu6kmq3lipa0sypbr7nn; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_labo_module
    ADD CONSTRAINT uk_1mfynfu6kmq3lipa0sypbr7nn UNIQUE (docid);


--
-- Name: d_facility uk_derkxe19l1dvtpaeohurt4u5l; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_facility
    ADD CONSTRAINT uk_derkxe19l1dvtpaeohurt4u5l UNIQUE (facilityid);


--
-- Name: d_users uk_ftpl2xvmgv4mf4dt4qxbnh8c7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_users
    ADD CONSTRAINT uk_ftpl2xvmgv4mf4dt4qxbnh8c7 UNIQUE (userid);


--
-- Name: d_factor2_challenge uk_is64txmb47d62fnueewxwr4vu; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_factor2_challenge
    ADD CONSTRAINT uk_is64txmb47d62fnueewxwr4vu UNIQUE (request_id);


--
-- Name: d_appo_karte_date_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_appo_karte_date_idx ON opendolphin.d_appo USING btree (karte_id, c_date);


--
-- Name: d_appo_patient_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_appo_patient_idx ON opendolphin.d_appo USING btree (patientid);


--
-- Name: d_attachment_doc_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_attachment_doc_idx ON opendolphin.d_attachment USING btree (doc_id);


--
-- Name: d_diagnosis_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_diagnosis_idx ON opendolphin.d_diagnosis USING btree (karte_id);


--
-- Name: d_document_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_document_idx ON opendolphin.d_document USING btree (karte_id);


--
-- Name: d_image_doc_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_image_doc_idx ON opendolphin.d_image USING btree (doc_id);


--
-- Name: d_letter_module_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_letter_module_idx ON opendolphin.d_letter_module USING btree (karte_id);


--
-- Name: d_module_doc_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_module_doc_idx ON opendolphin.d_module USING btree (doc_id);


--
-- Name: d_nlabo_item_module_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_nlabo_item_module_idx ON opendolphin.d_nlabo_item USING btree (labomodule_id);


--
-- Name: d_nlabo_item_patient_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_nlabo_item_patient_idx ON opendolphin.d_nlabo_item USING btree (patientid, sampledate DESC);


--
-- Name: d_nlabo_module_pid_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_nlabo_module_pid_idx ON opendolphin.d_nlabo_module USING btree (patientid, sampledate DESC);


--
-- Name: d_patient_visit_doctor_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_patient_visit_doctor_idx ON opendolphin.d_patient_visit USING btree (doctorid);


--
-- Name: d_patient_visit_facility_date_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_patient_visit_facility_date_idx ON opendolphin.d_patient_visit USING btree (facilityid, pvtdate);


--
-- Name: d_stamp_tree_user_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX d_stamp_tree_user_idx ON opendolphin.d_stamp_tree USING btree (user_id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON opendolphin.flyway_schema_history USING btree (success);


--
-- Name: idx_appointment_karte_date; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_appointment_karte_date ON opendolphin.appointment_model USING btree (karte_id, date);


--
-- Name: idx_audit_event_action; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_audit_event_action ON opendolphin.d_audit_event USING btree (action);


--
-- Name: idx_audit_event_time; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_audit_event_time ON opendolphin.d_audit_event USING btree (event_time);


--
-- Name: idx_audit_event_trace_id; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_audit_event_trace_id ON opendolphin.d_audit_event USING btree (trace_id);


--
-- Name: idx_document_karte_started_status; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_document_karte_started_status ON opendolphin.document_model USING btree (karte_id, started, status);


--
-- Name: idx_document_link; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_document_link ON opendolphin.document_model USING btree (link_id);


--
-- Name: idx_factor2_challenge_type; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_factor2_challenge_type ON opendolphin.d_factor2_challenge USING btree (challenge_type);


--
-- Name: idx_factor2_challenge_user; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_factor2_challenge_user ON opendolphin.d_factor2_challenge USING btree (user_pk);


--
-- Name: idx_factor2_credential_id; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_factor2_credential_id ON opendolphin.d_factor2_credential USING btree (credential_id);


--
-- Name: idx_factor2_credential_user; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_factor2_credential_user ON opendolphin.d_factor2_credential USING btree (user_pk);


--
-- Name: idx_nlabo_module_patient_date; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_nlabo_module_patient_date ON opendolphin.nlabo_module USING btree (patient_id, sample_date DESC);


--
-- Name: idx_patient_facility_kana_trgm; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_patient_facility_kana_trgm ON opendolphin.patient_model USING gin (kana_name opendolphin.gin_trgm_ops) WHERE (facility_id IS NOT NULL);


--
-- Name: idx_patient_visit_facility_date; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_patient_visit_facility_date ON opendolphin.patient_visit_model USING btree (facility_id, pvt_date, status);


--
-- Name: idx_phr_async_job_facility; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_phr_async_job_facility ON opendolphin.phr_async_job USING btree (facility_id, queued_at DESC);


--
-- Name: idx_phr_async_job_state; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_phr_async_job_state ON opendolphin.phr_async_job USING btree (state);


--
-- Name: idx_registered_diagnosis_karte_started; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_registered_diagnosis_karte_started ON opendolphin.registered_diagnosis_model USING btree (karte_id, started);


--
-- Name: idx_third_party_disclosure_patient; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_third_party_disclosure_patient ON opendolphin.d_third_party_disclosure USING btree (patient_id);


--
-- Name: idx_third_party_disclosure_time; Type: INDEX; Schema: opendolphin; Owner: -
--

CREATE INDEX idx_third_party_disclosure_time ON opendolphin.d_third_party_disclosure USING btree (disclosed_at);


--
-- Name: d_attachment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX d_attachment_idx ON public.d_attachment USING btree (doc_id);


--
-- Name: d_diagnosis_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX d_diagnosis_idx ON public.d_diagnosis USING btree (karte_id);


--
-- Name: d_document_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX d_document_idx ON public.d_document USING btree (karte_id);


--
-- Name: d_image_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX d_image_idx ON public.d_image USING btree (doc_id);


--
-- Name: d_karte_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX d_karte_idx ON public.d_karte USING btree (patient_id);


--
-- Name: d_letter_module_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX d_letter_module_idx ON public.d_letter_module USING btree (karte_id);


--
-- Name: d_module_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX d_module_idx ON public.d_module USING btree (doc_id);


--
-- Name: d_nlabo_item_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX d_nlabo_item_idx ON public.d_nlabo_item USING btree (labomodule_id);


--
-- Name: d_nlabo_module_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX d_nlabo_module_idx ON public.d_nlabo_module USING btree (patientid);


--
-- Name: d_observation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX d_observation_idx ON public.d_observation USING btree (karte_id);


--
-- Name: d_patient_memo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX d_patient_memo_idx ON public.d_patient_memo USING btree (karte_id);


--
-- Name: fid_pid_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX fid_pid_idx ON public.d_patient USING btree (facilityid, patientid);


--
-- Name: idx_appointment_karte_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_karte_date ON public.appointment_model USING btree (karte_id, date);


--
-- Name: idx_document_karte_started_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_karte_started_status ON public.document_model USING btree (karte_id, started, status);


--
-- Name: idx_document_link; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_link ON public.document_model USING btree (link_id);


--
-- Name: idx_nlabo_module_patient_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nlabo_module_patient_date ON public.nlabo_module USING btree (patient_id, sample_date DESC);


--
-- Name: idx_patient_facility_kana_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_facility_kana_trgm ON public.patient_model USING gin (kana_name opendolphin.gin_trgm_ops) WHERE (facility_id IS NOT NULL);


--
-- Name: idx_patient_visit_facility_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_visit_facility_date ON public.patient_visit_model USING btree (facility_id, pvt_date, status);


--
-- Name: idx_registered_diagnosis_karte_started; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registered_diagnosis_karte_started ON public.registered_diagnosis_model USING btree (karte_id, started);


--
-- Name: pub_tree_idx1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pub_tree_idx1 ON public.d_published_tree USING btree (publishtype);


--
-- Name: pvt_idx1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pvt_idx1 ON public.d_patient_visit USING btree (facilityid, pvtdate);


--
-- Name: pvt_idx3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pvt_idx3 ON public.d_patient_visit USING btree (patient_id);


--
-- Name: d_attachment fk2jvohkqkb07x106vyuvd22gia; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_attachment
    ADD CONSTRAINT fk2jvohkqkb07x106vyuvd22gia FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_module fk3w3kq3lxllafrm1d2ww0vp60l; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_module
    ADD CONSTRAINT fk3w3kq3lxllafrm1d2ww0vp60l FOREIGN KEY (doc_id) REFERENCES opendolphin.d_document(id);


--
-- Name: d_letter_module fk59aj87rxss55wwlr6jy4s1iic; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_letter_module
    ADD CONSTRAINT fk59aj87rxss55wwlr6jy4s1iic FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_nlabo_item fk5y0n7l5llj4ha3jo7jgo6g0vw; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_nlabo_item
    ADD CONSTRAINT fk5y0n7l5llj4ha3jo7jgo6g0vw FOREIGN KEY (labomodule_id) REFERENCES opendolphin.d_nlabo_module(id);


--
-- Name: d_diagnosis fk6kbkvrf86efmhlkiwepce8efm; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_diagnosis
    ADD CONSTRAINT fk6kbkvrf86efmhlkiwepce8efm FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_document fk6s9ifrm58t6jr9qamv7ey83lm; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_document
    ADD CONSTRAINT fk6s9ifrm58t6jr9qamv7ey83lm FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_letter_module fk8keiu0djxo52mtvpf3rkbb1at; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_letter_module
    ADD CONSTRAINT fk8keiu0djxo52mtvpf3rkbb1at FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_module fk8snks9qh1q0itl4l2mpmnp06y; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_module
    ADD CONSTRAINT fk8snks9qh1q0itl4l2mpmnp06y FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_diagnosis fk8sywwsuk1cr98yihrvicr5wqh; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_diagnosis
    ADD CONSTRAINT fk8sywwsuk1cr98yihrvicr5wqh FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_appo fk_d_appo_creator; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_appo
    ADD CONSTRAINT fk_d_appo_creator FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_appo fk_d_appo_karte; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_appo
    ADD CONSTRAINT fk_d_appo_karte FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_attachment fk_d_attachment_creator; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_attachment
    ADD CONSTRAINT fk_d_attachment_creator FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_attachment fk_d_attachment_document; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_attachment
    ADD CONSTRAINT fk_d_attachment_document FOREIGN KEY (doc_id) REFERENCES opendolphin.d_document(id);


--
-- Name: d_attachment fk_d_attachment_karte; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_attachment
    ADD CONSTRAINT fk_d_attachment_karte FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_diagnosis fk_d_diagnosis_creator; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_diagnosis
    ADD CONSTRAINT fk_d_diagnosis_creator FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_diagnosis fk_d_diagnosis_karte; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_diagnosis
    ADD CONSTRAINT fk_d_diagnosis_karte FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_document fk_d_document_creator; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_document
    ADD CONSTRAINT fk_d_document_creator FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_document fk_d_document_karte; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_document
    ADD CONSTRAINT fk_d_document_karte FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_image fk_d_image_creator; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_image
    ADD CONSTRAINT fk_d_image_creator FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_image fk_d_image_document; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_image
    ADD CONSTRAINT fk_d_image_document FOREIGN KEY (doc_id) REFERENCES opendolphin.d_document(id);


--
-- Name: d_image fk_d_image_karte; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_image
    ADD CONSTRAINT fk_d_image_karte FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_letter_module fk_d_letter_module_creator; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_letter_module
    ADD CONSTRAINT fk_d_letter_module_creator FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_letter_module fk_d_letter_module_karte; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_letter_module
    ADD CONSTRAINT fk_d_letter_module_karte FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_module fk_d_module_creator; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_module
    ADD CONSTRAINT fk_d_module_creator FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_module fk_d_module_document; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_module
    ADD CONSTRAINT fk_d_module_document FOREIGN KEY (doc_id) REFERENCES opendolphin.d_document(id);


--
-- Name: d_module fk_d_module_karte; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_module
    ADD CONSTRAINT fk_d_module_karte FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_nlabo_item fk_d_nlabo_item_module; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_nlabo_item
    ADD CONSTRAINT fk_d_nlabo_item_module FOREIGN KEY (labomodule_id) REFERENCES opendolphin.d_nlabo_module(id);


--
-- Name: d_patient_visit fk_d_patient_visit_patient; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_patient_visit
    ADD CONSTRAINT fk_d_patient_visit_patient FOREIGN KEY (patient_id) REFERENCES public.d_patient(id);


--
-- Name: d_stamp_tree fk_d_stamp_tree_user; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_stamp_tree
    ADD CONSTRAINT fk_d_stamp_tree_user FOREIGN KEY (user_id) REFERENCES public.d_users(id);


--
-- Name: d_roles fk_roles_user; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_roles
    ADD CONSTRAINT fk_roles_user FOREIGN KEY (c_user) REFERENCES public.d_users(id);


--
-- Name: d_appo fkb8sldxs84iyblth866lnnrpbe; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_appo
    ADD CONSTRAINT fkb8sldxs84iyblth866lnnrpbe FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_module fke7g6rg8pl0jaw2h0df9jymei5; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_module
    ADD CONSTRAINT fke7g6rg8pl0jaw2h0df9jymei5 FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_image fketbxays6dx6qwu2iycm4hstif; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_image
    ADD CONSTRAINT fketbxays6dx6qwu2iycm4hstif FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_document fkf9jkp9t07q15ubahu0lgt7kpk; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_document
    ADD CONSTRAINT fkf9jkp9t07q15ubahu0lgt7kpk FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_image fkh76c49gpqxrdrn0g6qjnx21kk; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_image
    ADD CONSTRAINT fkh76c49gpqxrdrn0g6qjnx21kk FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_image fkjfd325abbxhu4exexqv79v26t; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_image
    ADD CONSTRAINT fkjfd325abbxhu4exexqv79v26t FOREIGN KEY (doc_id) REFERENCES opendolphin.d_document(id);


--
-- Name: d_attachment fkn9p6g0w13cs9wrra1o2wvf71y; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_attachment
    ADD CONSTRAINT fkn9p6g0w13cs9wrra1o2wvf71y FOREIGN KEY (doc_id) REFERENCES opendolphin.d_document(id);


--
-- Name: d_stamp_tree fkocdijxk2fuap7hckensplxg62; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_stamp_tree
    ADD CONSTRAINT fkocdijxk2fuap7hckensplxg62 FOREIGN KEY (user_id) REFERENCES public.d_users(id);


--
-- Name: d_roles fkp137ou1mxuxr6dnir081lx7h3; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_roles
    ADD CONSTRAINT fkp137ou1mxuxr6dnir081lx7h3 FOREIGN KEY (c_user) REFERENCES public.d_users(id);


--
-- Name: d_patient_visit fkq7ugewq1raqu1fxgka04ribdb; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_patient_visit
    ADD CONSTRAINT fkq7ugewq1raqu1fxgka04ribdb FOREIGN KEY (patient_id) REFERENCES public.d_patient(id);


--
-- Name: d_appo fkqlbcs9j88sp7bl9wpi6f5h8gy; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_appo
    ADD CONSTRAINT fkqlbcs9j88sp7bl9wpi6f5h8gy FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_attachment fkqnesbghmyvrc9ey1hekr6w4fe; Type: FK CONSTRAINT; Schema: opendolphin; Owner: -
--

ALTER TABLE ONLY opendolphin.d_attachment
    ADD CONSTRAINT fkqnesbghmyvrc9ey1hekr6w4fe FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_attachment fk2jvohkqkb07x106vyuvd22gia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_attachment
    ADD CONSTRAINT fk2jvohkqkb07x106vyuvd22gia FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_patient_memo fk2u48ojwg4151fvryvix2ob5uy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_patient_memo
    ADD CONSTRAINT fk2u48ojwg4151fvryvix2ob5uy FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_composite_image fk3duwf7gwg30am3w161jisri9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_composite_image
    ADD CONSTRAINT fk3duwf7gwg30am3w161jisri9 FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_module fk3w3kq3lxllafrm1d2ww0vp60l; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_module
    ADD CONSTRAINT fk3w3kq3lxllafrm1d2ww0vp60l FOREIGN KEY (doc_id) REFERENCES public.d_document(id);


--
-- Name: d_subscribed_tree fk4dqejqur0x06us7xqkrtiuos2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_subscribed_tree
    ADD CONSTRAINT fk4dqejqur0x06us7xqkrtiuos2 FOREIGN KEY (user_id) REFERENCES public.d_users(id);


--
-- Name: d_ondoban fk4rwv7jjd2m70c7sf7unabaqie; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_ondoban
    ADD CONSTRAINT fk4rwv7jjd2m70c7sf7unabaqie FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_labo_specimen fk4utx7lpvh2m8tivwgk68b9seo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_labo_specimen
    ADD CONSTRAINT fk4utx7lpvh2m8tivwgk68b9seo FOREIGN KEY (module_id) REFERENCES public.d_labo_module(id);


--
-- Name: d_letter_module fk59aj87rxss55wwlr6jy4s1iic; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter_module
    ADD CONSTRAINT fk59aj87rxss55wwlr6jy4s1iic FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_labo_item fk5gghbpe7jq38sv9bggkfge9k8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_labo_item
    ADD CONSTRAINT fk5gghbpe7jq38sv9bggkfge9k8 FOREIGN KEY (specimen_id) REFERENCES public.d_labo_specimen(id);


--
-- Name: d_ondoban fk5ijv1l2v9130cev1ical0wpu5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_ondoban
    ADD CONSTRAINT fk5ijv1l2v9130cev1ical0wpu5 FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_nlabo_item fk5y0n7l5llj4ha3jo7jgo6g0vw; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_nlabo_item
    ADD CONSTRAINT fk5y0n7l5llj4ha3jo7jgo6g0vw FOREIGN KEY (labomodule_id) REFERENCES public.d_nlabo_module(id);


--
-- Name: d_diagnosis fk6kbkvrf86efmhlkiwepce8efm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_diagnosis
    ADD CONSTRAINT fk6kbkvrf86efmhlkiwepce8efm FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_document fk6s9ifrm58t6jr9qamv7ey83lm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_document
    ADD CONSTRAINT fk6s9ifrm58t6jr9qamv7ey83lm FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_letter_module fk8keiu0djxo52mtvpf3rkbb1at; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter_module
    ADD CONSTRAINT fk8keiu0djxo52mtvpf3rkbb1at FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_module fk8snks9qh1q0itl4l2mpmnp06y; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_module
    ADD CONSTRAINT fk8snks9qh1q0itl4l2mpmnp06y FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_diagnosis fk8sywwsuk1cr98yihrvicr5wqh; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_diagnosis
    ADD CONSTRAINT fk8sywwsuk1cr98yihrvicr5wqh FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_letter fk906ivt71c3fojo4yqeqb6xbdq; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter
    ADD CONSTRAINT fk906ivt71c3fojo4yqeqb6xbdq FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_users fk9pq74vp4xidvxlmky4msko04r; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_users
    ADD CONSTRAINT fk9pq74vp4xidvxlmky4msko04r FOREIGN KEY (facility_id) REFERENCES public.d_facility(id);


--
-- Name: d_published_tree fka4uutv50x4ok9on9fhuwds0ma; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_published_tree
    ADD CONSTRAINT fka4uutv50x4ok9on9fhuwds0ma FOREIGN KEY (user_id) REFERENCES public.d_users(id);


--
-- Name: d_patient_memo fkaxrwnfdjs4ec7eyf85lf6h867; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_patient_memo
    ADD CONSTRAINT fkaxrwnfdjs4ec7eyf85lf6h867 FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_appo fkb8sldxs84iyblth866lnnrpbe; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_appo
    ADD CONSTRAINT fkb8sldxs84iyblth866lnnrpbe FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_first_encounter fkbwcip09cavdwg4y2f97e9l06n; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_first_encounter
    ADD CONSTRAINT fkbwcip09cavdwg4y2f97e9l06n FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_care_plan_item fkc1u6k53v6r431k718dpefgjyh; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_care_plan_item
    ADD CONSTRAINT fkc1u6k53v6r431k718dpefgjyh FOREIGN KEY (careplan_id) REFERENCES public.d_care_plan(id);


--
-- Name: d_karte fkcwbvpaedx2yg6mvxllp8egnhd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_karte
    ADD CONSTRAINT fkcwbvpaedx2yg6mvxllp8egnhd FOREIGN KEY (patient_id) REFERENCES public.d_patient(id);


--
-- Name: d_module fke7g6rg8pl0jaw2h0df9jymei5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_module
    ADD CONSTRAINT fke7g6rg8pl0jaw2h0df9jymei5 FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_image fketbxays6dx6qwu2iycm4hstif; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_image
    ADD CONSTRAINT fketbxays6dx6qwu2iycm4hstif FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_document fkf9jkp9t07q15ubahu0lgt7kpk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_document
    ADD CONSTRAINT fkf9jkp9t07q15ubahu0lgt7kpk FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_first_encounter fkg5ebrked86uqlgdb6ppphjqmp; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_first_encounter
    ADD CONSTRAINT fkg5ebrked86uqlgdb6ppphjqmp FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_observation fkgyrpp2twmr9m5scm6wkwtli48; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_observation
    ADD CONSTRAINT fkgyrpp2twmr9m5scm6wkwtli48 FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_image fkh76c49gpqxrdrn0g6qjnx21kk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_image
    ADD CONSTRAINT fkh76c49gpqxrdrn0g6qjnx21kk FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_letter_item fki64ua1d3j27kkgt54fm7gavce; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter_item
    ADD CONSTRAINT fki64ua1d3j27kkgt54fm7gavce FOREIGN KEY (module_id) REFERENCES public.d_letter_module(id);


--
-- Name: d_image fkjfd325abbxhu4exexqv79v26t; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_image
    ADD CONSTRAINT fkjfd325abbxhu4exexqv79v26t FOREIGN KEY (doc_id) REFERENCES public.d_document(id);


--
-- Name: d_letter fklb0r9fmmr85k78hkdpc3emmgk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter
    ADD CONSTRAINT fklb0r9fmmr85k78hkdpc3emmgk FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_nurse_progress_course fklql4mp7oiio9k6wul5m74yso7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_nurse_progress_course
    ADD CONSTRAINT fklql4mp7oiio9k6wul5m74yso7 FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_health_insurance fkn8o5fcr59bnq4en7cbfp2src6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_health_insurance
    ADD CONSTRAINT fkn8o5fcr59bnq4en7cbfp2src6 FOREIGN KEY (patient_id) REFERENCES public.d_patient(id);


--
-- Name: d_attachment fkn9p6g0w13cs9wrra1o2wvf71y; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_attachment
    ADD CONSTRAINT fkn9p6g0w13cs9wrra1o2wvf71y FOREIGN KEY (doc_id) REFERENCES public.d_document(id);


--
-- Name: d_nurse_progress_course fko5oiamdynbxqk03lv35ilejw7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_nurse_progress_course
    ADD CONSTRAINT fko5oiamdynbxqk03lv35ilejw7 FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_stamp_tree fkocdijxk2fuap7hckensplxg62; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_stamp_tree
    ADD CONSTRAINT fkocdijxk2fuap7hckensplxg62 FOREIGN KEY (user_id) REFERENCES public.d_users(id);


--
-- Name: d_roles fkp137ou1mxuxr6dnir081lx7h3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_roles
    ADD CONSTRAINT fkp137ou1mxuxr6dnir081lx7h3 FOREIGN KEY (c_user) REFERENCES public.d_users(id);


--
-- Name: d_labo_module fkpl3dcaw15hl6r1c60sbx155g5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_labo_module
    ADD CONSTRAINT fkpl3dcaw15hl6r1c60sbx155g5 FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_patient_visit fkq7ugewq1raqu1fxgka04ribdb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_patient_visit
    ADD CONSTRAINT fkq7ugewq1raqu1fxgka04ribdb FOREIGN KEY (patient_id) REFERENCES public.d_patient(id);


--
-- Name: d_appo fkqlbcs9j88sp7bl9wpi6f5h8gy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_appo
    ADD CONSTRAINT fkqlbcs9j88sp7bl9wpi6f5h8gy FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_attachment fkqnesbghmyvrc9ey1hekr6w4fe; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_attachment
    ADD CONSTRAINT fkqnesbghmyvrc9ey1hekr6w4fe FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_composite_image fks3jvtai7r9q6jddau5pvck7h5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_composite_image
    ADD CONSTRAINT fks3jvtai7r9q6jddau5pvck7h5 FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_letter_text fks7lv2tbtfarfsdtsolhg2fj7x; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter_text
    ADD CONSTRAINT fks7lv2tbtfarfsdtsolhg2fj7x FOREIGN KEY (module_id) REFERENCES public.d_letter_module(id);


--
-- Name: d_observation fksiggi7rk3j67ud1l3fylud00c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_observation
    ADD CONSTRAINT fksiggi7rk3j67ud1l3fylud00c FOREIGN KEY (creator_id) REFERENCES public.d_users(id);


--
-- Name: d_labo_module fksv62tqsesnem1t9f23st2i5pw; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_labo_module
    ADD CONSTRAINT fksv62tqsesnem1t9f23st2i5pw FOREIGN KEY (karte_id) REFERENCES public.d_karte(id);


--
-- Name: d_letter_date fksxt2yn15eax2ifu3sx4ms3unf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d_letter_date
    ADD CONSTRAINT fksxt2yn15eax2ifu3sx4ms3unf FOREIGN KEY (module_id) REFERENCES public.d_letter_module(id);


--
-- PostgreSQL database dump complete
--

\unrestrict Ufl4FaecKA2RxjdTE9dHxE0GtyDmQpmO3OkedwQujeeQsUCBTzFsCjgXJzZLtsH

