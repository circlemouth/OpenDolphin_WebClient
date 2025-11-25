# Karte Update API Verification (KRT-01)

**Date**: 2025-11-19
**Worker**: A
**RUN_ID**: 20251119T133000Z

## Objective
Verify the implementation of the Karte Update API (`PUT /document`) in the modernized server, ensuring it supports full document updates and meets Web Client requirements. Compare with Legacy implementation.

## Findings

### 1. Endpoint Verification
- **Target**: `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java`
- **Status**: Implemented.
- **Details**:
  - `PUT /karte/document` endpoint exists (Line 158).
  - Accepts `DocumentModel` JSON.
  - Calls `karteServiceBean.updateDocument(document)`.

### 2. Update Logic Verification
- **Target**: `server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java`
- **Status**: Implemented and Correct.
- **Details**:
  - `updateDocument(DocumentModel document)` method exists (Line 575).
  - Performs `em.merge(document)` for in-place updates.
  - Correctly handles removal of missing child items (Modules, Schemas, Attachments) via `removeMissingModules`, `removeMissingSchemas`, `removeMissingAttachments` helpers.
  - This ensures that items deleted in the client are removed from the database, supporting "Full Update" semantics.

### 3. Legacy Comparison
- **Target**: `server/src/main/java/open/dolphin/session/KarteServiceBean.java` (Legacy)
- **Findings**:
  - Legacy `KarteServiceBean` **lacks** `updateDocument(DocumentModel)`.
  - It only supports:
    - `addDocument`: Creating a new document (or new version with `parentPk`).
    - `updateTitle`: Updating only the title of an existing document.
  - The `PUT /document` endpoint (without ID) is missing in Legacy `KarteResource`.
- **Conclusion**: The Modernized server extends the Legacy functionality by adding support for in-place full document updates, which is required by the Web Client's `document-api.ts`.

### 4. Web Client Compatibility
- **Target**: `web-client/src/features/charts/api/document-api.ts`
- **Findings**:
  - Client uses `PUT /karte/document` with `DocumentModelPayload`.
  - The server implementation matches this expectation.

## Conclusion
The Karte Update API (KRT-01) is fully implemented and verified. No further implementation is required.
