# Modular Home BIM/IFC Integration Strategy

Date: 2026-06-05
Status: Round 70 strategy, no product code

## Decision Summary

Use `glb/glTF` as the primary Web3D preview/runtime format and treat `IFC` as the BIM data exchange format for structured building information, not as the default live-render format for every visitor.

The safe import path is:

1. Manual review first for `PDF`, `DWG`, `IFC`, `GLB/GLTF`.
2. Local/dev `GLB` preview remains the first browser-safe visual proof path.
3. Production upload comes later behind auth, private storage, file validation, virus scanning, consent and admin review.
4. IFC import comes after dependency/performance audit and should be lazy-loaded or processed server-side/worker-side.
5. AI-assisted plan conversion is a later assistive workflow only. It must not claim engineering correctness or automatic permit-ready output.

## Why This Direction

The current Modular Home product already has:

- `?homeDemo=1` preview vertical;
- local GLB preview via `?homeUploadPreview=1`;
- manual conversion placeholder with PDF/DWG/IFC/GLB/GLTF messaging;
- quote/config/estimate flow;
- local/mock quote review and disabled-by-default backend quote submission path.

The next import step should not jump straight to AI conversion or full IFC parsing in the live city. That would add legal, performance and trust risk before the manual review pipeline is mature.

## Format Roles

### GLB / glTF

Role: web preview, optimized runtime delivery, client presentation.

Use for:

- visitor-facing 3D walkthrough previews;
- lightweight model upload previews;
- generated/cached project previews after manual conversion;
- mobile-safe visual assets.

Rules:

- prefer `.glb` for single-file delivery;
- optimize before public runtime: geometry cleanup, texture size caps, material cleanup, origin/scale normalization;
- lazy-load only in `homeDemo` or project preview routes;
- never load arbitrary user GLB in default `/expo-3d`;
- set hard file size and polygon/texture budgets;
- isolate local object URLs and revoke them when cleared.

Current project alignment:

- `ModularHomeUploadedModelPreview.tsx` already uses the existing Three/R3F path for local GLB preview.
- This should remain local/dev-only until production upload storage and review gates exist.

### IFC

Role: BIM exchange and structured building data review.

Use for:

- extracting product/building metadata;
- checking spaces, storeys, elements, quantities and materials;
- identifying engineering review requirements;
- generating manual review notes;
- future optional BIM-to-preview conversion pipeline.

Rules:

- do not parse IFC by default in the main Expo city bundle;
- evaluate lazy client worker or backend processing first;
- keep IFC as source/reference data, then publish optimized GLB for public preview;
- preserve original IFC file privately for audit/review;
- attach explicit warnings that IFC import is not automatic engineering approval.

Risk:

- IFC files can be large and semantically complex;
- IFC support varies by authoring software/export settings;
- geometry conversion can be slow and memory-heavy on mobile;
- property extraction may be useful before visual conversion is reliable.

### PDF

Role: manual plan review and client intake.

Use for:

- floor plans, elevations, site notes and client attachments;
- first commercial intake flow;
- human review before quote or model conversion.

Rules:

- do not promise automatic measurement extraction in early production;
- allow manual review status and admin notes;
- require client confirmation that uploaded drawings are current and authorized.

### DWG

Role: manual CAD review first, automated conversion later only through an approved CAD toolchain.

Use for:

- architect/designer source drawings;
- manual conversion request intake;
- later external CAD processing if approved.

Rules:

- do not attempt ad-hoc browser DWG parsing in the main product;
- DWG is proprietary and should be handled through approved desktop/manual workflow or approved service integration;
- convert/review manually first, then publish controlled outputs such as PDF, DXF summary, IFC or GLB.

## Proposed Architecture

### Phase 1: Manual Intake, No Production Upload Yet

Current/near-term behavior:

- panel explains supported future formats;
- user can choose service intent;
- no upload, no backend storage, no conversion;
- local quote/config remains separate.

Deliverables:

- keep Round 69 UI honest;
- add backend schema for file intake only after privacy/storage decisions;
- add admin statuses before real upload.

### Phase 2: Protected File Intake

Required before real files:

- authenticated user or explicit lead token;
- private storage bucket;
- signed upload URL;
- MIME sniffing and extension allowlist;
- file size limits by format;
- virus/malware scanning;
- rate limit and quota;
- consent and ownership confirmation;
- project ID and audit log;
- admin-only file listing.

Suggested accepted formats:

- `.pdf`
- `.dwg`
- `.ifc`
- `.glb`
- `.gltf` plus associated `.bin` and texture archive only if packaging is controlled.

Do not expose raw uploads publicly. Public preview should use a reviewed/optimized derivative.

### Phase 3: GLB Preview Pipeline

Input:

- uploaded GLB/GLTF or manually converted model.

Processing:

- validate file;
- normalize scale and origin;
- cap materials/textures;
- generate preview thumbnail;
- optionally run optimization step;
- store reviewed derivative separately from original.

Output:

- public or signed reviewed GLB derivative;
- metadata: dimensions, area, status, source, disclaimers.

Runtime:

- lazy-load reviewed GLB only when project preview is opened;
- never load unreviewed files in the default city.

### Phase 4: IFC Review Pipeline

Input:

- uploaded IFC.

Processing options:

- Option A: backend/worker extraction for metadata and quantities;
- Option B: local/admin IFC viewer for manual review;
- Option C: conversion to optimized GLB derivative for Web3D preview.

Recommended first IFC milestone:

- extract metadata and element counts;
- show admin review summary;
- do not promise perfect geometry conversion.

Later milestone:

- generate simplified GLB preview from IFC after manual review.

### Phase 5: PDF/DWG Manual Review

Input:

- uploaded PDF/DWG.

Workflow:

- admin reviews drawing completeness;
- status becomes `needs_clarification`, `manual_conversion_ready`, `quote_review_ready` or `rejected`;
- manual modeler/architect prepares Web3D preview or quote notes;
- approved derivative is published to preview.

This is the safest commercial path because many clients will submit incomplete or inconsistent drawings.

### Phase 6: AI-Assisted Plan Conversion

Only after:

- manual workflow works;
- enough examples exist;
- legal copy is approved;
- architect/engineer review gate exists.

Allowed AI wording:

- "AI-assisted draft extraction"
- "concept preview"
- "requires human review"

Forbidden AI wording:

- "automatic permit-ready design"
- "engineering-approved"
- "final quote"
- "guaranteed structural validation"

AI outputs should be draft-only:

- room labels;
- rough dimensions;
- missing information checklist;
- first-pass module mapping;
- quote assumptions.

## Legal / Engineering Boundaries

Every upload/import flow must include:

- client confirms they have rights to submit files;
- model preview is not construction documentation;
- estimate is not a final quote;
- all dimensions and quantities require verification;
- architect/engineer approval is required before production, permits or construction;
- local building codes, site conditions, foundations, utilities, transport and municipality requirements are outside automated preview scope.

Recommended status label:

`Preview for discussion only - requires architect/engineer review before construction or permit use.`

## Architect Approval Requirements

Before any project is marked production-ready:

- architect/designer reviews source drawings;
- structural engineer reviews load-bearing concept;
- MEP/service core assumptions are checked;
- local permit requirements are identified;
- site/foundation/transport constraints are confirmed;
- final product scope is signed off by responsible professional.

The platform should store:

- who approved;
- approval date;
- source file version;
- reviewed derivative version;
- notes and exclusions.

## Export Possibilities

Near term:

- browser-print project summary;
- JSON configuration export;
- CSV/admin lead export;
- reviewed GLB preview link;
- PDF summary generated by browser print.

Mid term:

- signed project package download;
- quote PDF generated server-side;
- reviewed GLB derivative export;
- IFC metadata report;
- issue/clarification checklist.

Long term:

- IFC export only after a proper BIM authoring/conversion workflow exists;
- BCF-style issue exchange for architect review;
- DXF/PDF drawing package by approved designer;
- manufacturing handoff package only after professional approval.

## Data Model Additions Needed Later

Project upload entity:

- `id`
- `projectId`
- `ownerUserId` or lead token
- `serviceType`
- `sourceFormat`
- `originalFileName`
- `storagePath`
- `fileSize`
- `mimeType`
- `checksum`
- `uploadStatus`
- `reviewStatus`
- `conversionStatus`
- `derivedPreviewAssetId`
- `consentVersion`
- `createdAt`
- `updatedAt`

Review statuses:

- `draft`
- `uploaded`
- `awaiting_manual_review`
- `needs_clarification`
- `manual_conversion_ready`
- `conversion_in_progress`
- `preview_ready`
- `quote_review_ready`
- `architect_review_required`
- `rejected`
- `archived`

Derivative asset entity:

- `id`
- `sourceUploadId`
- `assetType`
- `storagePath`
- `publicAccessMode`
- `optimizationProfile`
- `reviewedBy`
- `createdAt`

## Security Requirements

- private bucket by default;
- signed URLs with short expiry;
- no direct public raw upload URLs;
- server-side size/type validation;
- client-side validation is informational only;
- virus scan before admin preview/download;
- audit log all downloads and status changes;
- rate limit upload attempts;
- separate quote PII from file derivatives where practical;
- do not allow arbitrary model scripts, external texture URLs or remote fetches from uploaded files.

## Performance Requirements

- no IFC parser in default Expo city bundle;
- no upload/import dependencies in default `/expo-3d`;
- lazy-load project upload/viewer code only in home demo/admin routes;
- cap texture sizes and mesh counts;
- generate lightweight thumbnails;
- prefer derivative GLB for public viewing instead of parsing raw IFC for every user;
- keep mobile target: stable 30 FPS.

## Recommended Next Rounds

Round 71:

- Add docs/config for project upload statuses and service types.
- No backend upload yet.

Round 72:

- Add protected backend schema/stub for project file metadata only.
- No file storage yet.

Round 73:

- Add private storage upload proof behind feature flag.
- PDF/GLB only first.
- No IFC parser yet.

Round 74:

- Add admin manual review queue for uploaded plan packages.
- Status updates and notes.

Round 75:

- Add reviewed GLB derivative preview workflow.
- Public preview only after admin approval.

Round 76:

- IFC dependency audit/prototype in isolated route/worker.
- Measure bundle size, memory, parse time and mobile impact.

## External References Checked

- Khronos glTF overview: https://www.khronos.org/gltf/
- three.js GLTFLoader docs: https://threejs.org/docs/pages/GLTFLoader.html
- buildingSMART IFC standard overview: https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/
- buildingSMART IFC 4.3 scope: https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/content/scope.htm
- That Open IfcLoader docs: https://thatopen.github.io/engine_past-docs/3.0.x/api/%40thatopen/components/classes/IfcLoader/
- Autodesk Design Automation overview for DWG processing context: https://aps.autodesk.com/en/docs/design-automation/v2/developers_guide/overview/

## Round 70 Acceptance

- No product code added.
- No upload enabled.
- No AI conversion implemented.
- Clear path separates web preview, BIM exchange, manual review and future AI-assisted workflows.
- Legal and engineering approval boundaries are explicit.
