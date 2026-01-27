-- Letter/Lab/Stamp schema required for parity with legacy services

CREATE SEQUENCE IF NOT EXISTS d_letter_module_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS d_letter_module (
    id BIGINT NOT NULL DEFAULT nextval('d_letter_module_seq'),
    confirmed TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    started TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ended TIMESTAMP WITHOUT TIME ZONE,
    recorded TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    linkId BIGINT,
    linkRelation VARCHAR(255),
    status VARCHAR(1) NOT NULL DEFAULT 'F',
    creator_id BIGINT NOT NULL,
    karte_id BIGINT NOT NULL,
    title VARCHAR(255),
    letterType VARCHAR(255),
    handleClass VARCHAR(255),
    clientHospital VARCHAR(255),
    clientDept VARCHAR(255),
    clientDoctor VARCHAR(255),
    clientZipCode VARCHAR(32),
    clientAddress VARCHAR(255),
    clientTelephone VARCHAR(64),
    clientFax VARCHAR(64),
    consultantHospital VARCHAR(255),
    consultantDept VARCHAR(255),
    consultantDoctor VARCHAR(255),
    consultantZipCode VARCHAR(32),
    consultantAddress VARCHAR(255),
    consultantTelephone VARCHAR(64),
    consultantFax VARCHAR(64),
    patientId VARCHAR(64),
    patientName VARCHAR(255),
    patientKana VARCHAR(255),
    patientGender VARCHAR(16),
    patientBirthday VARCHAR(32),
    patientAge VARCHAR(32),
    patientOccupation VARCHAR(255),
    patientZipCode VARCHAR(32),
    patientAddress VARCHAR(255),
    patientTelephone VARCHAR(64),
    patientMobilePhone VARCHAR(64),
    patientFaxNumber VARCHAR(64),
    CONSTRAINT d_letter_module_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_letter_module_creator FOREIGN KEY (creator_id) REFERENCES d_users(id),
    CONSTRAINT fk_d_letter_module_karte FOREIGN KEY (karte_id) REFERENCES d_karte(id)
);

CREATE INDEX IF NOT EXISTS d_letter_module_idx
    ON d_letter_module (karte_id);


CREATE SEQUENCE IF NOT EXISTS d_nlabo_module_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS d_nlabo_module (
    id BIGINT NOT NULL DEFAULT nextval('d_nlabo_module_seq'),
    patientId VARCHAR(64) NOT NULL,
    laboCenterCode VARCHAR(64),
    patientName VARCHAR(255),
    patientSex VARCHAR(16),
    sampleDate VARCHAR(64),
    numOfItems VARCHAR(32),
    moduleKey VARCHAR(255),
    reportFormat VARCHAR(255),
    CONSTRAINT d_nlabo_module_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS d_nlabo_module_pid_idx
    ON d_nlabo_module (patientId, sampleDate DESC);


CREATE SEQUENCE IF NOT EXISTS d_nlabo_item_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS d_nlabo_item (
    id BIGINT NOT NULL DEFAULT nextval('d_nlabo_item_seq'),
    patientId VARCHAR(64) NOT NULL,
    sampleDate VARCHAR(64) NOT NULL,
    laboCode VARCHAR(64),
    lipemia VARCHAR(32),
    hemolysis VARCHAR(32),
    dialysis VARCHAR(32),
    reportStatus VARCHAR(32),
    groupCode VARCHAR(64) NOT NULL,
    groupName VARCHAR(255),
    parentCode VARCHAR(64) NOT NULL,
    itemCode VARCHAR(64) NOT NULL,
    medisCode VARCHAR(64),
    itemName VARCHAR(255) NOT NULL,
    abnormalFlg VARCHAR(32),
    normalValue VARCHAR(255),
    c_value VARCHAR(255),
    unit VARCHAR(32),
    specimenCode VARCHAR(64),
    specimenName VARCHAR(255),
    commentCode1 VARCHAR(64),
    comment1 VARCHAR(255),
    commentCode2 VARCHAR(64),
    comment2 VARCHAR(255),
    sortKey VARCHAR(64),
    laboModule_id BIGINT NOT NULL,
    CONSTRAINT d_nlabo_item_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_nlabo_item_module FOREIGN KEY (laboModule_id) REFERENCES d_nlabo_module(id)
);

CREATE INDEX IF NOT EXISTS d_nlabo_item_module_idx
    ON d_nlabo_item (laboModule_id);

CREATE INDEX IF NOT EXISTS d_nlabo_item_patient_idx
    ON d_nlabo_item (patientId, sampleDate DESC);


CREATE SEQUENCE IF NOT EXISTS d_stamp_tree_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS d_stamp_tree (
    id BIGINT NOT NULL DEFAULT nextval('d_stamp_tree_seq'),
    user_id BIGINT NOT NULL,
    tree_name VARCHAR(255) NOT NULL,
    publishType VARCHAR(64),
    category VARCHAR(64),
    partyName VARCHAR(255),
    url VARCHAR(255),
    description TEXT,
    publishedDate DATE,
    lastUpdated DATE,
    published VARCHAR(255),
    treeBytes BYTEA NOT NULL,
    versionNumber VARCHAR(64),
    CONSTRAINT d_stamp_tree_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_stamp_tree_user FOREIGN KEY (user_id) REFERENCES d_users(id)
);

CREATE INDEX IF NOT EXISTS d_stamp_tree_user_idx
    ON d_stamp_tree (user_id);
