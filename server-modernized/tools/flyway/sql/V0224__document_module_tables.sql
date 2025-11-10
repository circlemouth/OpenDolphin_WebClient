-- Document/Module/Attachment/Image tables required by DocumentModel
-- These tables back the embedded DocInfoModel fields that exist in the DocumentModel entity.
CREATE SEQUENCE IF NOT EXISTS hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS d_document (
    id BIGINT NOT NULL DEFAULT nextval('hibernate_sequence'),
    confirmed TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    started TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ended TIMESTAMP WITHOUT TIME ZONE,
    recorded TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    linkId BIGINT,
    linkRelation VARCHAR(255),
    status VARCHAR(1) NOT NULL DEFAULT 'F',
    creator_id BIGINT NOT NULL,
    karte_id BIGINT NOT NULL,
    docId VARCHAR(32) NOT NULL,
    docType VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    departmentDesc VARCHAR(255),
    healthInsurance VARCHAR(255),
    healthInsuranceDesc VARCHAR(255),
    healthInsuranceGUID VARCHAR(255),
    hasMark BOOLEAN NOT NULL DEFAULT FALSE,
    hasImage BOOLEAN NOT NULL DEFAULT FALSE,
    hasRp BOOLEAN NOT NULL DEFAULT FALSE,
    hasTreatment BOOLEAN NOT NULL DEFAULT FALSE,
    hasLaboTest BOOLEAN NOT NULL DEFAULT FALSE,
    versionNumber VARCHAR(255),
    parentId VARCHAR(255),
    parentIdRelation VARCHAR(255),
    labtestOrderNumber VARCHAR(255),
    claimDate TIMESTAMP WITHOUT TIME ZONE,
    admFlag VARCHAR(1),
    CONSTRAINT d_document_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_document_creator FOREIGN KEY (creator_id) REFERENCES d_users(id),
    CONSTRAINT fk_d_document_karte FOREIGN KEY (karte_id) REFERENCES d_karte(id)
);

CREATE INDEX IF NOT EXISTS d_document_idx
    ON d_document (karte_id);

CREATE TABLE IF NOT EXISTS d_module (
    id BIGINT NOT NULL DEFAULT nextval('hibernate_sequence'),
    confirmed TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    started TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ended TIMESTAMP WITHOUT TIME ZONE,
    recorded TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    linkId BIGINT,
    linkRelation VARCHAR(255),
    status VARCHAR(1) NOT NULL DEFAULT 'F',
    creator_id BIGINT NOT NULL,
    karte_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    stampNumber INTEGER NOT NULL,
    entity VARCHAR(255) NOT NULL,
    performFlag VARCHAR(1),
    beanBytes BYTEA NOT NULL,
    doc_id BIGINT NOT NULL,
    CONSTRAINT d_module_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_module_creator FOREIGN KEY (creator_id) REFERENCES d_users(id),
    CONSTRAINT fk_d_module_karte FOREIGN KEY (karte_id) REFERENCES d_karte(id),
    CONSTRAINT fk_d_module_document FOREIGN KEY (doc_id) REFERENCES d_document(id)
);

CREATE INDEX IF NOT EXISTS d_module_doc_idx
    ON d_module (doc_id);

CREATE TABLE IF NOT EXISTS d_image (
    id BIGINT NOT NULL DEFAULT nextval('hibernate_sequence'),
    confirmed TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    started TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ended TIMESTAMP WITHOUT TIME ZONE,
    recorded TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    linkId BIGINT,
    linkRelation VARCHAR(255),
    status VARCHAR(1) NOT NULL DEFAULT 'F',
    creator_id BIGINT NOT NULL,
    karte_id BIGINT NOT NULL,
    contentType VARCHAR(255) NOT NULL,
    medicalRole VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    href VARCHAR(255) NOT NULL,
    bucket VARCHAR(255),
    sop VARCHAR(255),
    url VARCHAR(255),
    facilityId VARCHAR(255),
    imageTime VARCHAR(255),
    bodyPart VARCHAR(255),
    shutterNum VARCHAR(255),
    seqNum VARCHAR(255),
    extension VARCHAR(255),
    jpegByte BYTEA NOT NULL,
    doc_id BIGINT NOT NULL,
    CONSTRAINT d_image_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_image_creator FOREIGN KEY (creator_id) REFERENCES d_users(id),
    CONSTRAINT fk_d_image_karte FOREIGN KEY (karte_id) REFERENCES d_karte(id),
    CONSTRAINT fk_d_image_document FOREIGN KEY (doc_id) REFERENCES d_document(id)
);

CREATE INDEX IF NOT EXISTS d_image_doc_idx
    ON d_image (doc_id);

CREATE TABLE IF NOT EXISTS d_attachment (
    id BIGINT NOT NULL DEFAULT nextval('hibernate_sequence'),
    confirmed TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    started TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ended TIMESTAMP WITHOUT TIME ZONE,
    recorded TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    linkId BIGINT,
    linkRelation VARCHAR(255),
    status VARCHAR(1) NOT NULL DEFAULT 'F',
    creator_id BIGINT NOT NULL,
    karte_id BIGINT NOT NULL,
    fileName VARCHAR(255),
    contentType VARCHAR(255),
    contentSize BIGINT,
    lastModified BIGINT,
    digest VARCHAR(255),
    title VARCHAR(255),
    uri VARCHAR(255),
    extension VARCHAR(255),
    memo TEXT,
    bytes BYTEA NOT NULL,
    doc_id BIGINT NOT NULL,
    CONSTRAINT d_attachment_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_attachment_creator FOREIGN KEY (creator_id) REFERENCES d_users(id),
    CONSTRAINT fk_d_attachment_karte FOREIGN KEY (karte_id) REFERENCES d_karte(id),
    CONSTRAINT fk_d_attachment_document FOREIGN KEY (doc_id) REFERENCES d_document(id)
);

CREATE INDEX IF NOT EXISTS d_attachment_doc_idx
    ON d_attachment (doc_id);
