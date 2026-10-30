# Store Management System (SMS) & Worker App — Master Project Documentation & Feature Review

> **Version**: 3.1 (Refined Implementation Status, Canonical Backlog, Architecture Review & Operational Standards)  
> **Last Updated**: 2026-10-30  
> **Architecture**: Modular Monolith (Spring Boot 4.1 + PostgreSQL + Redis) • Modern Web SPA (React 19 + TypeScript + MUI) • Cross-Platform Mobile App (Flutter 3.44 + Riverpod 3)

---

## Document Status & Verification Framework

To avoid ambiguity regarding project completion, this document formally distinguishes between three distinct maturity dimensions across all modules:

1. **Feature Implementation (% Code Written)**:
   - Measures whether the core business logic, domain entities, database migrations, REST endpoints, UI screens, forms, and state management have been written and integrated into the repository codebases.
2. **Integration Verification (% Test & Integration Coverage)**:
   - Measures whether code has been verified through automated unit tests, component tests, local mock interceptors, and local builds.
   - *Current Status*: Local unit and component test suites pass (e.g., 33/33 Vitest tests on Web, Spring Boot domain unit tests, Flutter component tests). **End-to-end multi-service integration against live cloud infrastructure (Backlog `[F.1]`, `[F.2]`) remains outstanding.**
3. **Production Readiness (% Operational & Deployment Readiness)**:
   - Measures whether live cloud databases, managed Redis clusters, S3 storage buckets, automated backup/recovery runbooks, CI/CD deployment pipelines, SRE monitoring/alerting, and statutory legal sign-offs are active in production.
   - *Current Status*: **In Progress / Staged.** The system currently runs in local development/test configurations. Domains marked as "100% Implemented" refer strictly to **Feature Code & Local Verification**, not 100% production deployment readiness.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                SYSTEM MATURITY CLASSIFICATION                                    │
├──────────────────────────┬─────────────────────────────────────┬─────────────────────────────────┤
│ MATURITY TIER            │ SCOPE & EVIDENCE                    │ PRODUCTION PREREQUISITES        │
├──────────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│ Feature Implementation   │ 100% of core application code       │ None (Code complete in Git repo)│
│                          │ written across Backend, Web, Mobile │                                 │
├──────────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│ Integration Verification │ Local unit tests passing (Vitest,   │ Multi-service E2E tests         │
│                          │ JUnit), local UI and mock APIs      │ (Playwright [F.1], Mobile [F.2])│
├──────────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│ Production Readiness     │ Dockerized build ready; local       │ Live Supabase/PostgreSQL [A.1], │
│                          │ configurations verified             │ Redis [A.2], CI/CD [F.3],       │
│                          │                                     │ Backups [F.4], SRE [N.6],       │
│                          │                                     │ Legal/PDP Validation [N.4]      │
└──────────────────────────┴─────────────────────────────────────┴─────────────────────────────────┘
```

---

## 1. Executive Overview & System Purpose

The **Store Management System (SMS)** is an enterprise retail operations and credit financing platform engineered for a multi-store chain specializing in electronics, home appliances, and furniture. 

The retailer operates on an end-to-end operational lifecycle:
1. **Procurement & Inbound Logistics**: Sourcing branded products and spare parts from national distributors, managing purchase orders, inspection receiving, and auto-ingesting serialized inventory.
2. **Showroom & Omnichannel Sales**: Selling via direct cash, cash-on-delivery (COD), or in-house installment credit financing (3, 6, 10, 12, 15 months) with store-specific terms.
3. **Credit Verification & Field Appraisal**: Conducting in-person field surveys evaluating customer creditworthiness, dwelling stability, proof photos, and income verifications.
4. **Fulfillment, Route Logistics & Surat Jalan**: Managing multi-drop delivery trips with formal Delivery Notes (*Surat Jalan*), pre-dispatch quality checks, customer digital signature sign-off, and photo proof.
5. **Debt Servicing, Field Collections & Cash Custody**: Monthly field installment collections, customer promise-to-pay tracking, two-stage cash custody handover, and cashier drawer reconciliation.
6. **After-Sales, Repossessions, Warranty & Repairs**: Managing customer warranty claims, internal/external repair work orders, or executing asset recovery on defaulted credit accounts for grading, showroom re-sale, or scrap write-off.
7. **Workforce, Attendance & Non-Calendar Payroll**: Managing employee attendance with Haversine GPS geofencing, leave rosters, and non-calendar sales/collection cutoff cycles (e.g., 26th–25th) calculating attendance-prorated salaries, sales commissions, and collection bonuses.
8. **Financial Accounting & General Ledger (Proposed - Backlog `[H.1–H.10]`)**: Double-entry general ledger, chart of accounts, bank reconciliation, COGS calculation, landed cost attribution, balance sheet, and P&L financial reporting.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     END-TO-END BUSINESS FLOW                                     │
├─────────────────┬───────────────────┬──────────────────┬───────────────────┬─────────────────────┤
│ 1. INBOUND      │ 2. SALES & CREDIT │ 3. LOGISTICS     │ 4. SERVICING      │ 5. RECOVERY & AFTER │
│  Purchase PO    │  Sales Order      │  Delivery Trip   │  Installment Debt │  Default Event      │
│  Receiving      │  Price Approval   │  Surat Jalan     │  Collector Visit  │  Repossession       │
│  Serial Unit    │  Credit Survey    │  Driver Mobile   │  Cash Custody     │  Grading & Triage   │
│  Stock Movement │  Down Payment DP  │  Recipient Sign  │  Cashier Reconcil │  Resell or Scrap    │
│  Landed Cost*   │  CRM 360 History* │  Failed Resched* │  Promise-to-Pay*  │  Warranty Repair    │
│  (Backlog I.1)  │  (Backlog J.1)    │  (Backlog M.3)   │  (Backlog J.3)    │  (Backlog K.1)      │
└─────────────────┴───────────────────┴──────────────────┴───────────────────┴─────────────────────┘
(* Indicates Proposed Enhancements cross-referenced to Canonical Backlog IDs)
```

---

## 2. Technology Stack & Architectural Topology

The system uses a **single authoritative backend and shared relational database** to guarantee ACID compliance and avoid data synchronization drift.

```
STORE MANAGEMENT SYSTEM
├── sms-backend/ (Java 21 • Spring Boot 4.1.x)
│   ├── Architecture: Modular Monolith with bounded domains
│   ├── Persistence: Spring Data JPA + Hibernate 6.x
│   ├── Database: PostgreSQL 16 (Flyway migrations V1–V20)
│   ├── Security: Spring Security + Supabase OAuth2 JWT validation
│   ├── High-Concurrency: Redis (Atomic sequence numbering & short-lived cache)
│   ├── Document Vault: Supabase Storage S3-compatible Buckets
│   ├── API Spec: Springdoc OpenAPI 3.0 (Swagger UI)
│   └── Testing: JUnit 5, Mockito
│
├── sms-web/ (React 19 • TypeScript • Vite)
│   ├── Framework: React 19 SPA with route-level code splitting (React.lazy)
│   ├── UI Framework: Material UI v9 (Deep Navy & Emerald Light/Dark themes)
│   ├── Data Grid: MUI X DataGrid with virtualized scrolling
│   ├── Workflow Engine: React Flow (@xyflow/react v12) visual DAG builder
│   ├── Data Fetching: TanStack Query v5 with optimistic mutations
│   ├── Forms & Validation: React Hook Form + Zod
│   ├── State: Zustand (Authentication, persistent theme mode)
│   ├── Analytics & Visuals: Recharts v3 (Comparative trend overlays & aging charts)
│   ├── Export Engines: UTF-8 BOM CSV exporter & SheetJS (.xlsx) multi-sheet engine
│   └── Testing: Vitest + React Testing Library (33/33 tests passing)
│
└── sms-mobile/ (Flutter 3.44 • Dart 3.12)
    ├── Architecture: Feature-first role-adaptive mobile client
    ├── State Management: Riverpod 3.x (Reactive asynchronous notifiers)
    ├── Routing: GoRouter with auth and permission guards
    ├── Networking: Dio client with JWT interceptors & live/mock fallback
    ├── Hardware Hooks: Camera viewfinder barcode/QR scanner, touch signature pad
    ├── Anti-Fraud: Pure-Dart Haversine 200m GPS geofencing & photo watermarking
    ├── Offline Engine: Persistent action queue & background auto-sync replay
    └── Security: Local biometric authentication (Fingerprint / Face ID unlock)
```

---

### 2.1 Architectural Recommendations & Technical Standards

#### A. Reliability & Transaction Integrity
- **Transactional Outbox Pattern (Backlog `[N.1]`)**:
  - Operational business transactions (Sales Order confirmation, purchase receiving, delivery handover, cash custody verification) commit application state changes alongside outbound event records into an `outbox_events` table within a single ACID database transaction.
  - A dedicated Change Data Capture (CDC) worker or reliable background polling dispatcher reads unpublished events from `outbox_events` and dispatches notifications, mobile push messages, and external integration webhooks asynchronously.
  - *Standard*: Guarantees at-least-once message delivery without distributed two-phase commit (2PC) bottlenecks. Event consumers must be idempotent.
- **Idempotency Standards (Backlog `[N.2]`)**:
  - Critical mutation endpoints accept an `Idempotency-Key` HTTP header (UUIDv4).
  - *Role of Redis vs Database*: Redis is used for fast, short-lived coordination and rapid request deduplication (e.g., preventing duplicate submissions from double-clicking within a short time window). However, **a Redis key alone does NOT guarantee durable, transactional exactly-once business processing**.
  - *Durable Requirement*: Financial and inventory-critical mutations (down payments, cash collections, cashier custody handovers, delivery confirmations, stock movements) must commit an idempotency record into a durable database table (`idempotency_keys`) inside the same ACID database transaction as the business mutation itself. Subsequent retries with the same key return the stored result without re-executing business side-effects.
- **Financial Document Integrity & Non-Destructive Adjustments**:
  - Finalized accounting vouchers, installment schedules, cash receipts, and sales invoices are strictly immutable. They must never be silently overwritten, edited in place, or hard-deleted.
  - Adjustments must be recorded exclusively through paired compensating transactions, credit notes, or explicit adjustment journal entries referencing the original document UID.
- **Backend Inventory Concurrency**:
  - Stock reservation and unit allocation decisions must be strictly protected by backend transactional concurrency controls (`PESSIMISTIC_WRITE` locks on `StockUnit` or atomic SQL conditional updates: `UPDATE stock_unit SET status = 'RESERVED' WHERE id = ? AND status = 'AVAILABLE'`).
  - Optimistic UI updates on web/mobile clients serve solely for perceived latency reduction and must automatically revert upon backend rejection.

#### B. Mobile Offline Architecture (Backlog `[N.3]`)
- **Intended Role of SQLite with Drift**:
  - The Flutter mobile application currently implements a client-side persistent FIFO queue and auto-sync replay engine using `SharedPreferences` (`OfflineSyncQueueNotifier` - Implemented).
  - To support complex relational persistence, offline querying, and structured draft storage, the proposed architectural direction is migrating to SQLite via Drift (strongly-typed Dart SQL engine).
- **Explicit Separation of Offline Concerns**:
  1. *Local Persistence*: Secure local disk storage of active user drafts, assigned task rosters, and read-only catalog caches.
  2. *Queued Synchronization*: Reliable capture of outbound user actions during network absence into a persistent local outbox queue.
  3. *Retry Handling*: Network state monitoring, exponential backoff, jitter, and automatic replay upon connectivity restoration.
  4. *Conflict Resolution*: Deterministic reconciliation when server-side state has diverged while the client was offline.
- **Deterministic 5-State Sync Lifecycle**:
  Every offline-queued mutation transitions through:
  `PENDING` (stored locally on disk) → `SYNCING` (dispatched to server) → `SUCCESS` (acknowledged by server, local record reconciled) → `RETRY` (transient network failure, backoff scheduled) → `CONFLICT` (server rejected due to state divergence).
- **Conflict Resolution Rules & Server Authority**:
  - **"Latest Timestamp Wins" (LWW) is NOT a universal conflict-resolution strategy.** LWW is strictly acceptable only for non-destructive descriptive text (e.g., field survey observations or residence notes).
  - **Financial transactions (payments, cash collections, custody handovers), inventory allocations (stock unit reservation/dispatch), and contractual approvals require Server Authority and explicit conflict handling.**
  - If a field collector records a cash collection offline against an installment that was concurrently settled via bank transfer, or if an inventory unit was allocated elsewhere, the client must flag a hard `CONFLICT`, halt automatic replay, preserve the local audit trail, and prompt managerial review. The client never silently overwrites server state.

#### C. Observability, Telemetry & SRE (Backlog `[N.6]`)
- **Structured JSON Logging**: Standardized log format containing `trace_id`, `span_id`, `user_id`, `store_id`, and `action_code`.
- **Metrics & Health Probes**: Spring Boot Actuator exposing `/actuator/health` (liveness/readiness) and `/actuator/prometheus` scraping endpoints.
- **APM & Tracing**: OpenTelemetry instrumentation integrated with Prometheus and Grafana dashboards for latency, JVM heap, DB connection pool saturation, and Redis command throughput.
- **Error Tracking & Alerting**: Sentry integration on Web, Mobile, and Backend for real-time unhandled exception capture and operational alerts.

#### D. API Standards & Compatibility
- **Versioning Strategy**: URI prefix versioning (`/api/v1/`) with strict semantic versioning.
- **OpenAPI & Code Generation**: Springdoc OpenAPI 3.0 generating OpenAPI schema used to auto-generate TypeScript API client types for `sms-web` and Dart models for `sms-mobile`.
- **Contract Testing**: Consumer-driven contract tests to verify that mobile app versions remain backwards-compatible during rolling backend deployments.

#### E. Security, Privacy & Indonesian Regulatory Governance (Backlog `[N.4]`, `[N.5]`, `[N.7]`)
- **Separation of Security Concerns**:
  - *Sensitive Data Protection*: Field-level encryption at rest (AES-256) for Indonesian National ID (`NIK`) and bank accounts in PostgreSQL; TLS 1.3 in transit.
  - *Access Control*: Role-Based Access Control (RBAC) governing 10 baseline roles combined with query-level Data-Scope Authorization.
  - *Auditability*: Immutable logging of business exceptions and sensitive operational actions in `SecurityAuditLog`.
  - *Data Retention & Lifecycle*: Automated data archival and right-to-erasure workflows upon contract completion and statutory retention expiration.
  - *Regulatory Compliance*: Adherence to statutory data protection frameworks.
- **Statutory Validation Caveat**:
  - References in this document to Indonesian legal statutes (e.g., UU No. 27 Tahun 2022 / UU PDP, UU Dokumen Perusahaan No. 8/1997, UU ITE No. 11/2008, PP 35/2021) and specific retention durations (such as 10-year financial record retention) **represent working architectural assumptions and design baselines**.
  - **These assumptions must be formally validated by qualified Indonesian legal and tax counsel prior to production sign-off.** Unverified legal interpretations must not be treated as confirmed statutory mandates.
- **Role-Based PII Masking**:
  - Mask NIK (e.g., `3171************`) on standard web/mobile views.
  - Revealing full digits requires explicit `CUSTOMER_PII_VIEW` authorization and generates a persistent audit log entry.
- **Data-Scope Authorization Hierarchy (Backlog `[N.5]`)**:
  - Queries enforce four hierarchical boundaries:
    - *Store Scope*: User can access data only for their assigned store branch.
    - *Department Scope*: Access constrained to specific functional domains.
    - *Territory Scope*: Surveyors and collectors access only postal codes / sub-districts within their assigned zone.
    - *Ownership Scope*: Salespersons and collectors view only records where they are the assigned agent.
- **Authentication & Access Security (Backlog `[N.7]`)**:
  - Multi-Factor Authentication (MFA) via TOTP / SMS OTP for managerial and finance roles.
  - Device session management with remote session revocation from Web Admin.
  - Expiring signed URLs (15-minute TTL) for document storage downloads from Supabase Storage buckets.

#### F. Workflow Engine & System Resilience (Backlog `[O.2]`, `[O.3]`)
- **Workflow Schema Versioning**: In-flight approval requests remain bound to the workflow schema snapshot established at request creation time. Schema modifications apply only to new requests.
- **Timeout & Escalation**: Configurable approval expiration timeouts automatically escalate inactive requests to the next managerial tier or designate a secondary proxy approver.
- **Recovery of Abandoned Requests**: Administrative tools to reassign or cancel orphaned approval requests when approvers leave the organization.

#### G. Reporting & Analytics Scaling (Backlog `[G.4]`)
- Real-time operational queries (JPA/Hibernate) are appropriate for transactional screens.
- High-volume comparative analytics, debt aging, and predictive models must utilize database read-replicas, materialized views, or pre-aggregated rollup tables to prevent contention on primary transactional tables.

#### H. GPS & Geofencing Operational Limitations
- Mobile GPS geofencing via Haversine formula is subject to physical limitations: indoor signal attenuation, urban canyon reflections, and operating system mock-location injection.
- GPS verification serves as **operational decision support and anomaly detection**, not infallible physical proof. It must be combined with network cell-tower checks, camera timestamp verification, and supervisory review.

---

## 3. Core Business Invariants & Guiding Principles

1. **Historical Immutability**:
   - Finalized financial transactions, customer addresses at order time, credit amortization schedules, price negotiation notes, approval audit logs, and payroll snapshots are **never mutated or hard-deleted**.
   - Configuration adjustments only apply to future records.
2. **Why vs. What Separation**:
   - *Business Documents* (`sales_order`, `purchase_order`, `delivery_order`, `stock_return`) record **why** an operational event occurred.
   - *Stock Movement Ledger* (`stock_movement`) is the immutable ledger recording **what physically changed** (timestamp, serialized unit, from-location, to-location, actor).
3. **Reservation vs. Allocation vs. Ledger Transition**:
   - *Reservation*: Logical hold against inventory availability when a sales order is submitted or released. Physical location is untouched.
   - *Allocation*: Specific assignment of a serialized `StockUnit` identifier to a line item.
   - *Movement*: Physical status/location transition executed only upon dispatch, receiving, return, or scrap.
4. **Human Judgment in Decision Support**:
   - Automated algorithms score and flag data, but **never** unilaterally execute credit decisions, repossession triggers, price overrides, scrap write-offs, or return approvals.
5. **Company-Wide Customer Identity**:
   - Customer identity is deduplicated company-wide by Indonesian National ID (`NIK`). Addresses are historical snapshots on transaction records.
6. **Document Numbering Architecture (Redis vs Database)**:
   - Sequential document numbers formatted as `{TYPE}/{STORE_CODE}/{MM}/{YYYY}/{SEQ:04d}`.
   - *Role of Redis*: Redis provides high-concurrency atomic increment counters (`INCR`) with date-keyed prefixes, enabling sub-millisecond sequence generation under heavy load.
   - *Technical Limitation of Volatile Redis Counters*: Redis counters with TTL or in-memory volatile configurations are **not by themselves a durable solution for financial document numbering**. Server restarts, cluster failovers, or eviction can compromise counter continuity.
   - *PostgreSQL Sequence Nuance*: PostgreSQL sequences (`nextval`) are also **not inherently gapless**; transaction rollbacks or server crashes leave unconsumed sequence gaps.
   - *Distinction*:
     - *Ordinary Unique Numbering*: Gaps are operationally acceptable (e.g., draft sales orders, delivery trips, internal repair tickets). Fast Redis counters or PostgreSQL sequences are fully suitable.
     - *Legally / Operationally Gap-Sensitive Numbering*: Statutory tax invoices (*Faktur Pajak*) or official financial vouchers where tax audits prohibit missing sequence numbers. These require a durable database-backed sequence allocator running inside an ACID commit or a post-commit sequence assignment service with a gap-audit reconciliation ledger. (See ADR-05).
7. **Signatures & Legal Standing**:
   - Digital canvas signature pad captures recipient touch signatures for operational receipt proof (Surat Jalan delivery notes).
   - Formal statutory contracts (multi-year credit agreements) require integration with Kominfo-certified Digital Certificate Authorities (e.g., PrivyID / Peruri) with e-Meterai for full evidentiary legal validity under Indonesian ITE Law. (See ADR-07).
8. **Anti-Fraud & Field GPS Verification**:
   - GPS coordinate logging with Haversine distance verification provides proximity validation.
   - Must be augmented with mock-location / spoofing detection, cell-tower triangulation, and photo timestamps to prevent attendance or delivery falsification.

---

## 4. Comprehensive Feature Breakdown & Status Review

Below is the complete inventory of all system features across Backend, Web, and Mobile, detailing **what is done**, **source files**, and **proposed future extensions** with cross-references to the Canonical Backlog.

```
Status Legend:
[DONE]        - Feature code implemented, integrated, and verified via unit/component tests and local mock data.
                (Note: Live production infrastructure and end-to-end cloud deployment remain tracked in Backlog A & F).
[PARTIAL]     - Core code implemented; requires additional UI/API wiring or live service connection.
[PROPOSED]    - New capability under architectural review and backlog prioritization.
```

---

### Group 1: Organization, Master Foundation & Security

#### Feature 1.1: Multi-Store Hierarchy & Branch Configurations
- **Purpose**: Manage central company entity and autonomous branch stores with localized pricing, warehouses, and tax details.
- **Backend**: `Store.java`, `StoreRepository.java`, `StoreController.java`, Flyway `V1__init_foundation.sql`.
- **Web UI**: `StoreListPage.tsx`, `StoreFormDialog.tsx`, `features/stores/`.
- **Status**: `[DONE]`
- **What Is Done**: Full CRUD for branch stores, warehouse codes, address metadata, and active store toggling.
- **Proposed Enhancements**: Store geofence polygon configuration UI; multi-store data scoping by territory; store operating hours schedule. (Backlog: `[N.5]`).

#### Feature 1.2: Employee Master & Multi-Role RBAC (10 Baseline Roles)
- **Purpose**: Unified employee registry linked to Supabase Auth UUID, governing 10 discrete roles: *Owner, Manager, Admin, SPV, Salesperson, Surveyor, Driver, Collector, AR, Helper/OB*.
- **Backend**: `Employee.java`, `EmployeeRole.java`, `EmployeeRepository.java`, `MeController.java`, `EmployeeController.java`.
- **Web UI**: `EmployeeListPage.tsx`, `RolePermissionsPage.tsx`.
- **Mobile**: `auth_provider.dart`, `/api/me` profile bootstrap.
- **Status**: `[DONE]`
- **What Is Done**: Role mapping, department assignment, store linkage, and JWT claims validation via `@PreAuthorize`.
- **Proposed Enhancements**: Custom permission builder with fine-grained override toggles per employee; employee offboarding checklist with one-click access revocation across web and mobile tokens. (Backlog: `[N.5]`, `[N.7]`).

#### Feature 1.3: Approval Workflow Engine & Visual Builder
- **Purpose**: Configurable multi-step approval chains (Discount overrides, budget overruns, credit decisions, scrap disposal) with immutable historical snapshotting.
- **Backend**: `Workflow.java`, `WorkflowStep.java`, `ApprovalRequest.java`, `ApprovalStepHistory.java`, `ApprovalService.java`.
- **Web UI**: `ApprovalWorkflowsPage.tsx`, `ApprovalStepNode.tsx` (React Flow v12 DAG canvas, minimap, controls, threshold simulation dialog).
- **Status**: `[DONE]`
- **What Is Done**: Drag-and-drop workflow canvas, step snapshotting on request creation, multi-role approval execution.
- **Proposed Enhancements**: Workflow schema versioning; M-of-N quorum voting (`[G.8]`); approval expiration timeouts with automated escalation (`[O.3]`); temporary approval delegation during manager absence (`[O.2]`).

#### Feature 1.4: Universal Document Storage Vault
- **Purpose**: Centralized storage for ID cards, proof photos, contracts, and delivery receipts in Supabase Storage.
- **Backend**: `DocumentRecord.java`, `DocumentRepository.java`, `DocumentService.java`.
- **Web / Mobile**: Document upload widgets, file previewers.
- **Status**: `[DONE]`
- **What Is Done**: Metadata indexing, file size validation, bucket key referencing.
- **Proposed Enhancements**: Universal modal attachment previewer supporting PDFs, images, and Word docs (`[O.5]`); expiring signed URL generation (`[N.7]`); document expiration monitoring and renewal alerts (`[O.1]`).

#### Feature 1.5: Security Audit Log Engine
- **Purpose**: Dedicated audit trail capturing sensitive operational anomalies: price overrides, cash discrepancies, and inventory scrap write-offs.
- **Backend**: `V20__security_audit_log.sql`, `SecurityAuditLog.java`, `SecurityAuditLogRepository.java`, `SecurityAuditLogService.java`, `SecurityAuditLogController.java`.
- **Web UI**: Operations Exception Center in `DashboardPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Immutable event logging, REST querying, and executive alert rendering.
- **Clarification**: Implements an operational exception logging service. Comprehensive statutory PDP compliance, external penetration testing, and enterprise-wide data masking are tracked separately in Backlog `[N.4]`.
- **Proposed Enhancements**: Automated email/webhook dispatch upon critical anomalies; field-level change history capturing before/after JSON diffs (`[O.7]`).

#### Feature 1.6: Platform Internal Announcements & Operational Bulletin `[PROPOSED]` (Backlog `[L.3]`)
- **Purpose**: Broadcast organizational announcements, store SOP updates, commission tier changes, and regulatory notices across web and mobile work centers.
- **Scope**: Broadcast scheduling, target audience filtering (by role or store), acknowledgment tracking ("Mark as Read / Acknowledged").

#### Feature 1.7: Employee-to-Employee Task Assignment & Collaboration Hub `[PROPOSED]` (Backlog `[L.4]`)
- **Purpose**: Internal ad-hoc task assignment between managers, supervisors, and floor staff (e.g., "Prepare display unit for Customer X", "Investigate discrepancy in Bay 4").
- **Scope**: Task creation with due dates, priority levels, document attachments, comment threads, and push notification triggers.

---

### Group 2: Customer Domain & Identity

#### Feature 2.1: Customer Directory & NIK Deduplication
- **Purpose**: Company-wide deduplicated customer directory indexed by 16-digit Indonesian National ID (`NIK`).
- **Backend**: `Customer.java`, `CustomerRepository.java`, `CustomerService.java`, Flyway `V2__customer_schema.sql`.
- **Web UI**: `CustomerListPage.tsx`, `CustomerDetailPage.tsx`, `CustomerFormDialog.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: NIK format validation, unique constraint handling, phone/email contact directory.
- **Proposed Enhancements**: Fuzzy duplicate detection matching phone numbers and phonetic name spelling (`[J.4]`); Indonesian UU PDP compliance with PII field masking and field encryption (`[N.4]`); mobile OCR camera scan for automatic KTP NIK extraction (`[G.7]`).

#### Feature 2.2: Address Snapshots & Primary Delivery Index
- **Purpose**: Maintain multiple addresses (KTP residence, current dwelling, office) with partial unique indexing for primary shipping, frozen into order records upon release.
- **Backend**: `CustomerAddress.java`, `CustomerAddressRepository.java`.
- **Web UI**: Address manager inside `CustomerDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Primary address constraint enforcement, full text snapshot copy on order release.
- **Proposed Enhancements**: Interactive Google Maps pin-drop widget; capture delivery destination coordinates, access constraints (narrow street, stairs, vehicle height limit), and gate access notes (`[M.1]`).

#### Feature 2.3: Strict Context-Gated Customer Creation
- **Purpose**: Prevent orphaned customer entries by enforcing customer creation only during active Sales Order drafting or via explicit Admin override.
- **Backend**: `CustomerRequest.java` validation enforcing `salesOrderId` or admin context.
- **Web UI**: `CustomerFormDialog.tsx` context parameters.
- **Status**: `[DONE]`
- **What Is Done**: Request validation rejects free-floating unlinked customer creation by standard staff.

#### Feature 2.4: Customer Relationship Management (CRM) / Customer 360 `[PROPOSED]` (Backlog `[J.1–J.7]`)
- **Purpose**: Unified 360-degree customer profile consolidating commercial, credit, delivery, and service interactions.
- **Scope**:
  - Consolidated activity timeline: Sales orders, credit surveys, monthly payment track record, delivery attempts, warranty tickets, and repossession records (`[J.1]`).
  - Customer segmentation & tags (e.g., "VIP Cash Buyer", "Repeat Credit Customer - Star Tier", "High Delinquency Risk") (`[J.2]`).
  - Customer Lifetime Value (CLV) calculation and historical repayment reliability score (`[J.2]`).
  - Customer gift vouchers, promotional coupons, and store credit ledger management (`[J.5]`).
  - Customer omnichannel communication and interaction history log (calls, SMS, WhatsApp, in-person visits) (`[J.6]`).
  - Customer follow-up scheduler and automated reminder engine (`[J.7]`).

---

### Group 3: Product Catalog, BOM & Store Pricing

#### Feature 3.1: Hierarchical Product Catalog
- **Purpose**: Multi-level product structure: Product Type → Category → Product → Variant (SKU) with serial tracking flags.
- **Backend**: `Product.java`, `ProductCategory.java`, `ProductVariant.java`, Flyway `V3__product_catalog.sql`.
- **Web UI**: `ProductListPage.tsx`, `ProductDetailPage.tsx`, `ProductFormDialog.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Category grouping, SKU code generation, dimensions/warranty specifications.
- **Proposed Enhancements**: Bulk Excel/CSV product onboarding import with schema validation; master data revision audit log tracking catalog edits (`[O.7]`); product bundling and combo sales (`[I.7]`); barcode label and label-template management (`[I.6]`).

#### Feature 3.2: Store-Specific Cash & Installment Pricing Matrices
- **Purpose**: Configure independent cash pricing and installment terms (3, 6, 10, 12, 15 months) per store branch without global fixed interest rates.
- **Backend**: `StorePrice.java`, `StorePriceRepository.java`, `StorePriceService.java`.
- **Web UI**: Price management tab in `ProductDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Store-by-store pricing matrix, monthly installment terms, active effective dates.
- **Proposed Enhancements**: Promotional campaign time-bound price scheduler; price change revision history log (`[O.7]`).

#### Feature 3.3: Bill of Materials (BOM) & Spare Component Master
- **Purpose**: Manage sub-assembly spare parts (compressors, panels, power supplies) used for warranty repairs.
- **Backend**: `Component.java`, `ProductComponent.java`, `ComponentStock.java`.
- **Web UI**: Components tab in `ProductDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: BOM association, component serial tracking, and stock balance recording.
- **Proposed Enhancements**: Low-stock replenishment alerts for critical repair components; component cost roll-up reporting.

#### Feature 3.4: Inventory Valuation & Cost of Goods Sold (COGS) Engine `[PROPOSED]` (Backlog `[I.1–I.4]`)
- **Purpose**: Track product acquisition cost, landed costs, and calculate accurate Cost of Goods Sold for gross margin reporting.
- **Scope**:
  - Base acquisition cost recording per purchase batch (`[I.1]`).
  - Landed cost attribution: Allocate freight shipping, import handling, customs duties, and transit insurance across received units (`[I.1]`).
  - Inventory costing methodology: Support FIFO (First-In, First-Out) or Periodic Weighted Average costing (`[I.2]`, ADR-02).
  - Inventory write-down / impairment accounting for aged, obsolete, or damaged showroom display units (`[I.3]`).
  - Costing of repossessed and refurbished products (appraised recovery value + refurbishing repair component costs) (`[I.4]`).

---

### Group 4: Sales Orders & Credit Contracting

#### Feature 4.1: Sales Order Lifecycle & Item Reservation
- **Purpose**: Draft, calculate, reserve stock, and release sales orders for cash, COD, or credit terms.
- **Backend**: `SalesOrder.java`, `SalesOrderItem.java`, `SalesOrderService.java`, Flyway `V4__sales_orders.sql`.
- **Web UI**: `SalesOrderListPage.tsx`, `SalesOrderDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: State machine (`DRAFT → PENDING_APPROVAL → RELEASED → CONFIRMED → CANCELLED`), logical inventory reservation.
- **Proposed Enhancements**: Quotation management with validity expiration dates (e.g., 7 days) and one-click quotation-to-order conversion (`[O.1]`); audit history tracking line-item changes and quantity edits on drafts (`[O.7]`).

#### Feature 4.2: Automated Price Negotiation & Discount Approval
- **Purpose**: Automatically intercept orders where `finalPrice < referencePrice`, generating approval requests with justification notes.
- **Backend**: `SalesOrderService.java` integrating with `ApprovalService.java`.
- **Web UI**: Discount alert banners and approval status chips in `SalesOrderDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Automatic workflow trigger, discount amount calculation, multi-level SPV/Manager review.
- **Proposed Enhancements**: Margin threshold warning indicator showing gross profit impact to approvers; salesperson monthly quota target and tiered commission tracking.

#### Feature 4.3: Down Payment (DP) Cash Custody Recording
- **Purpose**: Require upfront down payment confirmation before credit order confirmation, automatically posting cash vouchers to Finance.
- **Backend**: `ConfirmSalesOrderRequest.java`, `SalesOrderService.confirm(...)` auto-creating `CustomerPayment` and `PaymentCustody`.
- **Web UI**: Down payment confirmation modal in `SalesOrderDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Direct integration between Sales Order confirmation and Finance custody ledger.
- **Proposed Enhancements**: Split DP payment methods (e.g., partial cash + partial bank transfer); digital payment gateway / QRIS dynamic barcode generation.

#### Feature 4.4: Official Credit Agreement Document Generator
- **Purpose**: Generate official legally binding credit agreement contracts with statutory clauses, payment schedules, and signature blocks.
- **Backend**: `PrintableDocumentService.generateCreditAgreementHtml(...)`, `PrintableDocumentController.java`.
- **Web UI**: One-click print button in `SalesOrderDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Clean HTML print template, browser print trigger, Terbilang Indonesian currency formatting.
- **Proposed Enhancements**: Digital certificate e-signature integration (Privy / Peruri) with e-Meterai statutory stamp duty embedding (ADR-07).

#### Feature 4.5: Sales Returns, Customer Refunds & Order Cancellations `[PROPOSED]` (Backlog `[K.1]`, `[K.2]`)
- **Purpose**: Structured handling of post-delivery product returns, customer remorse cancellations, and commercial refunds.
- **Scope**:
  - Dedicated return authorization workflow linked to original Sales Order and Delivery Order (`[K.1]`).
  - Multi-point post-return inspection recording product physical condition and accessories completeness (`[K.1]`).
  - Disposition triage: Return to available stock, quarantine for technician testing, dispatch to warranty repair, or write-off to scrap (`[K.1]`).
  - Financial refund settlement: Cash refund voucher, bank transfer reversal, or credit balance voucher (`[K.2]`).
  - Non-destructive document reversal: Finalized sales records remain immutable; cancellation creates compensating credit note records (`[K.2]`, ADR-03).

---

### Group 5: Credit Assessment & Field Survey

#### Feature 5.1: Automated Survey Task Generation & Assignment
- **Purpose**: Automatically generate field survey tasks upon release of credit orders (`paymentTermMonths > 0`), assigning them to area surveyors.
- **Backend**: `Survey.java`, `SurveyRepository.java`, `SurveyService.java`, `SurveyListController.java`, Flyway `V5__credit_surveys.sql`.
- **Web UI**: Surveyor assignments in Sales Order details.
- **Mobile**: `survey_provider.dart`, `SurveyorTaskScreen.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Trigger on order release, surveyor assignment, live task list API.
- **Proposed Enhancements**: Guarantor information capture with statutory consent sign-off; geographic territory routing assigning surveys by sub-district workload.

#### Feature 5.2: Mobile Surveyor Field Appraisal & Customer Location Survey
- **Purpose**: Enable mobile field surveyors to inspect residences, verify income, take GPS-stamped photos, record delivery access logistics, and make decisive credit determinations.
- **Mobile**: `SurveyorTaskScreen.dart`, `photo_proof_grid_widget.dart`, `geo_location_service.dart`.
- **Backend**: `POST /api/surveys/{id}/decide`.
- **Status**: `[DONE]`
- **What Is Done**: House photos with timestamp/GPS watermarks, guarantor check, decisive approve/reject action.
- **Proposed Enhancements**:
  - Capture delivery destination coordinates and access notes (narrow alley, floor number, stair width, door clearance) to share directly with the delivery dispatch team (`[M.1]`).
  - Offline image compression optimization for low-bandwidth 3G coverage.
  - Mock-location spoofing detection preventing fake GPS injection.

---

### Group 6: Inventory, Stock Units & Movement Ledger

#### Feature 6.1: Three-Dimensional Stock Unit State & Physical Allocation
- **Purpose**: Manage physical inventory across 3 orthogonal dimensions: Store, Location (`WAREHOUSE`, `SHOWROOM`, `REPAIR_AREA`, `IN_TRANSIT`, `AT_CUSTOMER`, `DISPOSED`), and Availability (`AVAILABLE`, `RESERVED`, `UNAVAILABLE`).
- **Backend**: `StockUnit.java`, `StockUnitRepository.java`, `StockService.java`, Flyway `V6__inventory_stock.sql`.
- **Web UI**: `StockUnitListPage.tsx` with high-performance virtualized MUI X DataGrid.
- **Status**: `[DONE]`
- **What Is Done**: Serial number indexing, state transitions, optimistic TanStack Query availability mutations.
- **Proposed Enhancements**: Minimum and maximum safety stock thresholds; slow-moving inventory aging buckets; automatic reservation expiration releasing units if order remains unreleased; serialized unit condition grading history; warehouse spatial location management (warehouse, zone, aisle, rack, shelf, bin/bay) (`[I.8]`).

#### Feature 6.2: Immutable Stock Movement Ledger
- **Purpose**: Maintain a permanent, append-only ledger (`stock_movement`) recording every physical unit relocation with actor and source document references.
- **Backend**: `StockMovement.java`, `StockMovementRepository.java`.
- **Web UI**: `StockMovementHistoryDrawer.tsx` rendering chronological movement audits.
- **Status**: `[DONE]`
- **What Is Done**: Append-only invariant enforced; unit movement drawer displaying historical chain of custody.
- **Proposed Enhancements**: Movement anomaly detection flagging impossible spatial hops or rapid location reversals.

#### Feature 6.3: Inter-Store Stock Transfers
- **Purpose**: Coordinate stock relocation between branch stores with in-transit tracking and destination receipt sign-off.
- **Backend**: `StockTransfer.java`, `StockTransferItem.java`.
- **Web UI**: Transfer creation dialog in `StockUnitListPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Dispatched units marked `IN_TRANSIT`, destination receipt moves units to target warehouse.
- **Proposed Enhancements**: Vehicle license plate and driver assignment for inter-store transfer manifests; QR transfer pass.

#### Feature 6.4: Physical Stocktaking (Stock Opname) & Reconciliation `[PROPOSED]` (Backlog `[I.5]`)
- **Purpose**: Conduct scheduled and periodic physical inventory counts to verify book stock against physical floor units.
- **Scope**:
  - Stocktaking session scheduling per store, warehouse zone, or product category.
  - Blind counting mode: Hide system book quantities from counter to prevent counting bias.
  - Mobile barcode scanning count input with recount escalation workflow for count mismatches (`[M.5]`).
  - Root cause investigation tools for discrepancies (theft, damaged unrecorded, misplacement).
  - Supervisory sign-off and automatic generation of balancing stock movement adjustment ledger entries.

---

### Group 7: Procurement & Supplier Management

#### Feature 7.1: Purchase Order Lifecycle & Supplier Directory
- **Purpose**: Manage distributor catalogs, lead times, bank accounts, and multi-line purchase orders.
- **Backend**: `Supplier.java`, `PurchaseOrder.java`, `PurchaseOrderItem.java`, `ProcurementService.java`, Flyway `V7__procurement.sql`.
- **Web UI**: `SupplierListPage.tsx`, `SupplierDetailPage.tsx`, `PurchaseOrderListPage.tsx`, `PurchaseOrderDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Full PO lifecycle (`DRAFT → PENDING_APPROVAL → ISSUED → RECEIVED → CANCELLED`).
- **Proposed Enhancements**: Internal Purchase Requisition (PR) workflow (`[K.3]`); automated reorder point alerts when warehouse stock drops below minimum safety threshold; supplier quotation comparison matrix.

#### Feature 7.2: Physical Receiving & Serialized Unit Auto-Ingestion
- **Purpose**: Inspect inbound distributor deliveries, record accepted/rejected quantities, and automatically generate serialized `StockUnit` rows and movement ledger entries.
- **Backend**: `PurchaseReceipt.java`, `PurchaseReceiptItem.java`, `ProcurementService.receivePurchaseOrder(...)`.
- **Web UI**: Receiving dialog inside `PurchaseOrderDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Accepted items ingest serials and post `PURCHASE_RECEIVING` ledger movements.
- **Proposed Enhancements**: Barcode thermal sticker batch printer for newly ingested serialized units (`[I.6]`); defect quarantine staging for rejected units.

#### Feature 7.3: Supplier Performance Management & Balance Settlement
- **Purpose**: Record bank transfers and cash payments against outstanding supplier PO debt and track supplier reliability.
- **Backend**: `SupplierPayment.java`, `SupplierPaymentRepository.java`.
- **Web UI**: `SupplierPaymentPanel.tsx` inside `SupplierDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Payment ledger, remaining balance calculation, and payment history display.
- **Proposed Enhancements**:
  - Supplier price change history tracking price fluctuations over time (`[K.4]`).
  - Supplier lead-time analytics (Promised ETA vs Actual delivery date) (`[K.4]`).
  - Delivery accuracy rate (PO ordered vs received quantities) and defect rejection tracking (`[K.4]`).
  - Warranty reimbursement claim recovery tracking against suppliers for defective parts (`[K.5]`).

---

### Group 8: Delivery Logistics, Routing & Surat Jalan

#### Feature 8.1: Multi-Drop Delivery Trip Planning
- **Purpose**: Group confirmed sales orders into optimized delivery trips, assigning vehicle, driver, and helper staff.
- **Backend**: `DeliveryTrip.java`, `DeliveryOrder.java`, `DeliveryService.java`, Flyway `V8__delivery_logistics.sql`.
- **Web UI**: `DeliveryTripListPage.tsx`, `DeliveryTripDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Trip scheduling, vehicle assignment, stop sequence ordering.
- **Proposed Enhancements**: Vehicle maintenance tracking (mileage, service intervals, oil changes) (`[L.5]`); vehicle fuel log tracking (`[L.5]`); operational expense tracking per trip (toll, parking, fuel allowance) (`[L.5]`).

#### Feature 8.2: Interactive Delivery Route Map
- **Purpose**: Visual route timeline showing delivery progress, drop waypoints, status badges, and official print triggers.
- **Web UI**: `DeliveryRouteMap.tsx` integrated into `DeliveryTripDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Sequential stop progression, status metrics, Surat Jalan direct print buttons.
- **Proposed Enhancements**: Real-time driver GPS tracking beacon; delivery failure reporting with root cause tagging (`[M.3]`); automated rescheduling workflow (`[M.3]`); customer delivery rating and feedback capture.

#### Feature 8.3: Official Delivery Note (*Surat Jalan*) Generation
- **Purpose**: Standardized delivery note with QR verification codes, item manifests, and triple signature blocks (Warehouse, Driver, Customer).
- **Backend**: `PrintableDocumentService.generateSuratJalanHtml(...)`, `PrintableDocumentController.java`.
- **Web UI**: One-click print button in `DeliveryTripDetailPage.tsx` and `DeliveryOrderPanel.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Clean print layout, barcode header, customer address snapshot display.
- **Proposed Enhancements**: Digital PDF archive auto-upload to Supabase Storage upon print; QR code scan verification for warehouse security gate-pass checkout.

#### Feature 8.4: Mobile Driver Delivery Execution, Touch Signature & COD
- **Purpose**: Driver mobile app for delivery confirmation, recipient touch signature, proof photo upload, and COD cash collection.
- **Mobile**: `driver_trip_screen.dart`, `signature_pad_widget.dart`, `photo_proof_grid_widget.dart`, `delivery_provider.dart`.
- **Backend**: `POST /api/delivery-orders/{id}/deliver`.
- **Status**: `[DONE]`
- **What Is Done**: Mobile stop list, recipient signature capture, COD payment handover, proof upload.
- **Proposed Enhancements**: Warehouse picking & packing mobile verification (barcode scan against manifest before loading truck) (`[M.2]`); turn-by-turn navigation deep linking to Google Maps / Waze using survey-verified destination coordinates.

---

### Group 9: Accounts Receivable, Installments & Cash Custody

#### Feature 9.1: Amortization Schedule & FIFO Payment Allocation
- **Purpose**: Generate monthly credit payment schedules with last-cent rounding absorption, allocating cash receipts to the oldest outstanding installments (`dueDate ASC`).
- **Backend**: `ReceivableAccount.java`, `InstallmentSchedule.java`, `CustomerPayment.java`, `FinanceService.java`, Flyway `V9__finance_receivables.sql`.
- **Web UI**: `FinancePage.tsx`, amortization viewer dialog.
- **Status**: `[DONE]`
- **What Is Done**: Automatic schedule creation, FIFO allocation logic, excess payments held as customer credit balance.
- **Proposed Enhancements**: Early settlement & full payoff calculator with interest rebate incentive; payment loan restructuring / term rescheduling with schedule re-amortization; late payment penalty configuration.

#### Feature 9.2: Two-Stage Cash Custody Handover & Reconciliation
- **Purpose**: Field collections are held under collector custody (`HELD_BY_COLLECTOR`) and formally transferred to branch cashiers (`HANDED_OVER` → `VERIFIED_BY_CASHIER` or `DISCREPANCY` with short/over audit notes).
- **Backend**: `PaymentCustody.java`, `FinanceService.handoverCustody(...)`, `FinanceService.verifyCustody(...)`.
- **Web UI**: Cash Custody Ledger tab in `FinancePage.tsx`.
- **Mobile**: `collector_visit_screen.dart` cashier handover trigger.
- **Status**: `[DONE]`
- **What Is Done**: Custody status lifecycle, discrepancy amount tracking, automated audit logging in `SecurityAuditLog`.
- **Proposed Enhancements**: End-of-day cashier physical drawer balance reconciliation sheet with currency denomination breakdown (bilyet kas).

#### Feature 9.3: Official Customer Payment Receipt Generator
- **Purpose**: Produce official payment vouchers with Indonesian word spelling (*Terbilang*) and cashier stamp blocks.
- **Backend**: `PrintableDocumentService.generatePaymentReceiptHtml(...)`, `TerbilangHelper.java`.
- **Web UI**: Print voucher button in `FinancePage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Formatted currency, exact Indonesian words conversion (e.g., "Satu Juta Lima Ratus Ribu Rupiah"), print styling.
- **Proposed Enhancements**: Thermal Bluetooth ESC/POS printer driver support (58mm/80mm) for immediate on-the-spot mobile printout.

#### Feature 9.4: Mobile Collector Field Visit Tracker
- **Purpose**: Enable field collectors to look up delinquent customers, log visit outcomes (`PAID`, `PROMISED_TO_PAY`, `REFUSED`, `UNREACHABLE`), and collect installment cash.
- **Mobile**: `collector_visit_screen.dart`, `collection_provider.dart`.
- **Backend**: `GET /api/finance/receivables`, `POST /api/finance/collections`.
- **Status**: `[DONE]`
- **What Is Done**: Mobile customer search, visit outcome logging, immediate receipt generation.
- **Proposed Enhancements**: Daily collector route optimization sorting delinquent visits by geographic proximity; partial payment recording with auto-calculated remaining installment balance.

#### Feature 9.5: Customer Promise-to-Pay (PTP) Management `[PROPOSED]` (Backlog `[J.3]`)
- **Purpose**: Formal tracking of customer payment promises made during field collection visits or phone follow-ups.
- **Scope**:
  - Structured record of promised payment date, expected amount, and payment channel.
  - Automated status tracking: `PENDING`, `KEPT` (payment received on or before date), `BROKEN` (date elapsed with no payment).
  - Proactive reminders sent to customer and alert pinned on collector's mobile morning work queue.
  - Collector PTP fulfillment rate metric and delinquency risk scoring impact.

---

### Group 10: Repossessions, Warranty, Repairs & Scrap

#### Feature 10.1: Default Recovery & Formal Repossession Notice
- **Purpose**: Handle defaulting accounts, produce official legal handover notices, and execute asset recovery.
- **Backend**: `StockReturn.java`, `StockReturnItem.java`, `PrintableDocumentService.generateRepossessionNoticeHtml(...)`, Flyway `V10__repossession_warranty.sql`.
- **Web UI**: `RepossessionWarrantyPage.tsx` with print triggers.
- **Status**: `[DONE]`
- **What Is Done**: Formal legal recovery letter template, asset serial linking, return receipt recording.
- **Proposed Enhancements**: Multi-stage pre-repossession warning notices (Surat Peringatan 1, 2, 3); legal handover repossession dossier.

#### Feature 10.2: Financial Repossession Forgiveness Invariant
- **Purpose**: Upon confirmed asset repossession, mark receivable account as `SETTLED_REPOSSESSION`, forgive remaining debt balance, and permanently retain previously collected installments.
- **Backend**: `FinanceService.settleRepossession(...)`.
- **Web UI**: Account status indicator in `FinancePage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Automatic debt forgiveness posting and schedule cancellation.
- **Proposed Enhancements**: Bad debt write-off accounting journal integration and tax deduction reporting.

#### Feature 10.3: Unit Triage, Grading & Scrap Write-Off
- **Purpose**: Technicians inspect recovered units, assigning grade and disposition: `SELL_AS_IS` (showroom floor), `REPAIR_THEN_SELL` (work order), or `SCRAP_DISPOSAL` (permanent write-off).
- **Backend**: `RepossessionService.gradeReturn(...)`, `SecurityAuditLogService` logging scrap write-offs.
- **Web UI**: Triage inspection dialog in `RepossessionWarrantyPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Disposition routing, stock unit status updating, security audit logging on scrap.
- **Proposed Enhancements**: Cosmetic grading calculator (Grade A/B/C) with suggested resale price markdown rules based on original cost.

#### Feature 10.4: Warranty Claims & Repair Work Orders
- **Purpose**: Manage customer repair complaints, track spare component consumption, and log manufacturer warranty reimbursement.
- **Backend**: `WarrantyClaim.java`, `RepairTicket.java`, `RepairTicketComponent.java`.
- **Web UI**: Repair tickets tab in `RepossessionWarrantyPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Ticket lifecycle, technician assignment, spare component deduction from `ComponentStock`.
- **Proposed Enhancements**: Repair cost profitability analysis (labor + components vs claim recovery); manufacturer warranty expiration tracker; automated customer repair status updates via WhatsApp.

---

### Group 11: Expense Tracking & Budget Ceilings

#### Feature 11.1: Store Operational Budget Requests
- **Purpose**: Set monthly expense limits per store and operational category (Utilities, Vehicle Fuel, Marketing, Office Supplies).
- **Backend**: `BudgetLimit.java`, `ExpenseRequest.java`, `ExpenseService.java`, Flyway `V11__expense_management.sql`.
- **Web UI**: `ExpenseBudgetPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Monthly category ceiling configuration, store expense ledger.
- **Proposed Enhancements**: Recurring operational expense templates (store lease, internet subscription, municipal security fees) auto-generated monthly; annual budget planning projections based on prior year trends.

#### Feature 11.2: Real-Time Spend Checking & Automatic Overrun Gating
- **Purpose**: Intercept expense vouchers in real time; if an expense exceeds remaining category budget, flag `is_overrun=true` and route to Store Manager approval.
- **Backend**: `ExpenseService.submitExpense(...)` overrun detection.
- **Web UI**: Overrun warning badges and approval triggers in `ExpenseBudgetPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Automated threshold interception and workflow approval routing.
- **Proposed Enhancements**: Inter-category budget reallocation tool allowing managers to shift budget surplus between categories within approved limits.

---

### Group 12: HR, Field Attendance & Non-Calendar Payroll

#### Feature 12.1: Mobile Field Attendance with Haversine GPS Geofence
- **Purpose**: Mobile clock-in/out with presence deduplication and anti-fraud 200m Haversine distance verification against store coordinates.
- **Mobile**: `attendance_screen.dart`, `geo_location_service.dart`, `attendance_provider.dart`.
- **Backend**: `Attendance.java`, `PayrollService.clockIn(...)`, Flyway `V12__payroll_hr.sql`.
- **Status**: `[DONE]`
- **What Is Done**: GPS calculation, store distance validation, remote clock-in blocking.
- **Proposed Enhancements**: Multi-shift scheduling (Morning, Middle, Evening rosters); selfie facial photo capture upon clock-in; mock GPS spoofing detection.

#### Feature 12.2: Leave Request Management & Roster Integration
- **Purpose**: Employees apply for paid/sick leave; approved leave automatically seeds `ON_LEAVE` attendance records to maintain roster integrity.
- **Backend**: `LeaveRequest.java`, `PayrollService.approveLeave(...)`.
- **Web UI**: Leave approval tab in `PayrollPage.tsx`.
- **Mobile**: Leave application dialog in `attendance_screen.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Leave submission, supervisor approval, auto-generation of attendance entries.
- **Proposed Enhancements**: Annual leave balance tracking (12 days statutory quota) with balance deduction and carry-over policy.

#### Feature 12.3: Non-Calendar Sales & Collection Cutoff Engine
- **Purpose**: Support flexible payroll cutoffs (e.g., 26th of previous month to 25th of current month) calculating prorated base salary, sales commissions, and collection bonuses.
- **Backend**: `PayrollPeriod.java`, `PayrollSlip.java`, `PayrollService.calculatePayroll(...)`.
- **Web UI**: `PayrollPage.tsx`.
- **Mobile**: `my_payroll_screen.dart` (personal slip viewer).
- **Status**: `[DONE]`
- **What Is Done**: Cutoff calculation, sales/collection attribution, strict immutable freeze invariant upon finalization.
- **Proposed Enhancements**: Overtime and shift incentive calculations; statutory Indonesian income tax withholding (PPh 21 TER rates) and BPJS Ketenagakerjaan / Kesehatan deduction tables; annual performance evaluation scoring. (ADR-09).

#### Feature 12.4: Official Employee Payroll Slip Generator
- **Purpose**: Printable formal monthly pay slip showing gross earnings, commission breakdowns, deductions, and net take-home pay.
- **Backend**: `PrintableDocumentService.generatePayrollSlipHtml(...)`.
- **Web UI**: One-click slip print button in `PayrollPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Clean HTML layout, itemized earnings/deductions, printable PDF layout.
- **Proposed Enhancements**: Bulk PDF slip generation; password-protected PDF export (using employee DOB) for automated email delivery.

---

### Group 13: Executive Analytics, Dashboards & Export Center

#### Feature 13.1: Executive KPI Dashboard & Salesperson Leaderboard
- **Purpose**: High-level store health metrics: Gross sales, cash collections, active installment debt, and salesperson rankings.
- **Backend**: `ReportingService.java`, `ReportingController.java`, Flyway `V13__reporting_views.sql`.
- **Web UI**: `DashboardPage.tsx` (Financial Overview, Leaderboard, Exception Center tabs).
- **Status**: `[DONE]`
- **What Is Done**: Real-time KPI summaries, top salesperson rankings, cash discrepancy alerts.
- **Proposed Enhancements**: Store and branch performance benchmarking heatmap (`[G.5]`); product-level gross profitability reporting; salesperson lead conversion funnel analytics.

#### Feature 13.2: Receivables Aging Analysis Buckets
- **Purpose**: Classify active credit accounts into 4 aging buckets: Current, Past Due (1–30d), Delinquent (31–60d), and Default Risk (60+d).
- **Backend**: `ReportingService.getAgingReport(...)`.
- **Web UI**: Aging charts and data tables in `DashboardPage.tsx` and `FinancePage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Bucket segmentation, outstanding balance tallying, collector assignment display.
- **Proposed Enhancements**: Credit portfolio advanced analytics: Portfolio at Risk (PAR 30, PAR 60, PAR 90), delinquency roll rates, vintage default curves, and recovery percentage on repossessed collateral.

#### Feature 13.3: Period-over-Period Comparative Analytics & Custom Date Picker (Task G.3)
- **Purpose**: Executive comparative analytics comparing two customizable date windows for revenue, cash collections, orders count, AOV, daily trajectory overlay, and debt aging shifts.
- **Backend**: `PeriodComparisonResponse.java`, `ReportingController.getPeriodComparison(...)`, `ReportingService.java`.
- **Web UI**: `DateRangeComparisonPicker.tsx` (presets & dual date inputs), `PeriodComparisonPanel.tsx` (4 delta KPI cards, Recharts trajectory overlay, aging shift comparison, CSV export), `DashboardPage.tsx` tab.
- **Status**: `[DONE]`
- **What Is Done**: Full backend calculation, frontend delta cards, trajectory overlay, debt shifts, CSV export, verified by 28/28 tests.
- **Proposed Enhancements**: Year-over-year same-day holiday calendar adjustment (Ramadan / Lebaran seasonal retail alignment).

#### Feature 13.4: Universal CSV Export Utility
- **Purpose**: Client-side CSV export utility with UTF-8 BOM encoding for seamless Microsoft Excel compatibility.
- **Web**: `exportCsv.ts`, `exportCsv.test.ts`.
- **Status**: `[DONE]`
- **What Is Done**: Universal export helper integrated across Customers, Finance, and Comparative Analytics.

#### Feature 13.5: Client-Side Excel (.xlsx) Multi-Sheet Export Engine (Task G.2)
- **Purpose**: High-performance multi-sheet Excel (.xlsx) workbook generator with metadata titles, delinquency buckets, inventory distributions, and column auto-sizing for financial aging and stock balance audits.
- **Web**: `exportExcel.ts`, `exportExcel.test.ts` (SheetJS `xlsx`), `FinancePage.tsx`, `DashboardPage.tsx`, `StockUnitListPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Multi-sheet export engine, auto-width computation, date/currency cell formatting, `exportFinancialAgingToExcel` (Summary & Buckets + Customer Accounts Ledger), and `exportStockBalanceToExcel` (Physical Location & Availability distribution + Serialized Unit Ledger). Code-split into its own 286 kB chunk. Verified with 5 unit tests (33/33 Vitest suite).
- **Proposed Enhancements**: Scheduled automated email export dispatch (`[G.9]`); configurable RGB corporate header color presets.

#### Feature 13.6: Advanced Business Intelligence & Predictive Analytics `[PROPOSED]` (Backlog `[G.4]`)
- **Purpose**: Strategic executive decision support utilizing statistical projections and historical payment velocity models.
- **Scope**:
  - What-if financial simulation engine (simulating gross revenue under different interest terms or down payment requirements).
  - Cash-flow forecasting engine predicting net monthly cash inflows based on active installment payment velocity (`[G.4]`).
  - Inventory turnover velocity metrics identifying fast-moving vs dead stock.
  - AI-assisted demand forecasting and replenishment recommendations.
  - Collector route optimization engine.
  - Fleet predictive maintenance alerts.

---

### Group 14: Mobile Worker App Capabilities & Field Tooling

#### Feature 14.1: Role-Adaptive Dynamic Navigation & Work Center
- **Purpose**: Single mobile app binary that dynamically adapts its home dashboard, quick actions, and route guards based on active employee roles.
- **Mobile**: `worker_home_screen.dart`, `my_work_screen.dart`, `app_router.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Role-specific task cards, unified work center queue, quick status indicators.
- **Proposed Enhancements**: Actionable Notification Center with direct deep-links into target documents and one-tap supervisory approvals/rejections (`[M.6]`).

#### Feature 14.2: Barcode & QR Viewfinder Scanner Modal
- **Purpose**: Mobile camera scanner for serialized stock units and Surat Jalan DO codes.
- **Mobile**: `barcode_scanner_modal.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Live camera viewfinder overlay, laser reticle animation, manual serial fallback.
- **Proposed Enhancements**: Continuous multi-barcode batch scanning mode for rapid warehouse inventory audits (`[M.5]`).

#### Feature 14.3: Digital Touch/Stylus Signature Pad
- **Purpose**: Canvas signature capture for recipient delivery sign-off and credit contracts.
- **Mobile**: `signature_pad_widget.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Smooth bezier curve painting, clear/save actions, base64 PNG export.
- **Proposed Enhancements**: Legal signatory consent checkbox overlay; biometric authentication challenge before signing high-value cash transactions.

#### Feature 14.4: GPS Photo Proof Capture Grid with Automatic Watermark
- **Purpose**: Capture field photos (surveys, deliveries, repossessions) with automatic GPS latitude/longitude, date, and time watermarking.
- **Mobile**: `photo_proof_grid_widget.dart`, `geo_location_service.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Multi-photo grid, thumbnail previews, automated metadata stamping.
- **Proposed Enhancements**: Anti-spoofing camera integrity verification (blocking gallery file injection); background cloud upload queue.

#### Feature 14.5: Persistent Offline Action Queue & Auto-Sync Engine
- **Purpose**: Allow field workers to complete surveys, deliveries, and collections in zero-connectivity areas, queuing actions to disk and replaying them when connectivity returns.
- **Mobile**: `offline_sync_queue_notifier.dart`, `SharedPreferences` persistence.
- **Status**: `[DONE]`
- **What Is Done**: Queue storage, network state listener, sequential FIFO replay, failure retry.
- **Clarification**: Implements a client-side persistent FIFO queue and auto-sync replay engine. A fully relational, multi-table offline database with structured conflict resolution is tracked as proposed Backlog `[N.3]`.
- **Proposed Enhancements**: SQLite with Drift migration for robust local relational storage (`[N.3]`); explicit sync state tracking (`PENDING`, `SYNCING`, `SUCCESS`, `RETRY`, `CONFLICT`); server-authoritative conflict resolution policies (`[N.3]`).

#### Feature 14.6: Biometric Authentication (Fingerprint / Face ID)
- **Purpose**: Fast, secure mobile unlocking using device biometrics without re-entering passwords on the road.
- **Mobile**: `biometric_service.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Biometric availability check, prompt simulation, session unlock.

#### Feature 14.7: Salesperson Mobile Work Center `[PROPOSED]` (Backlog `[M.4]`)
- **Purpose**: Empower showroom and field sales staff with customer lookup, lead tracking, quotation generation, and sales quota progress.
- **Scope**: Customer interaction logging, instant price matrix calculator, draft quotation access, personal target vs achievement metrics.

#### Feature 14.8: Warehouse Picking & Packing Verification `[PROPOSED]` (Backlog `[M.2]`, `[I.9]`)
- **Purpose**: Guided mobile warehouse operations for staging and loading items onto delivery trucks.
- **Scope**: Digital picking lists sorted by warehouse bin/bay, barcode scan verification ensuring correct serialized unit is pulled, packing confirmation, and item mismatch warnings.

#### Feature 14.9: Mobile Physical Stocktaking (Stock Opname) Scanner `[PROPOSED]` (Backlog `[M.5]`)
- **Purpose**: Floor staff scan serialized items and loose spare parts directly into active stocktaking audit sessions.
- **Scope**: Continuous scan-and-beep counter, offline counting buffer, real-time variance alert against active session book balance.

---

### Group 15: Web App UI/UX & Performance Infrastructure

#### Feature 15.1: Global Command Palette (`Ctrl+K` / `Cmd+K`)
- **Purpose**: Quick search modal enabling instant keyboard navigation across all 16 modules, customer searches, SO lookups, and quick actions.
- **Web UI**: `CommandPalette.tsx`, `AppLayout.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Global keyboard shortcut, fuzzy category filtering, keyboard navigation, breadcrumbs.
- **Proposed Enhancements**: Recently viewed documents list; favorites and bookmarks drawer; global keyboard shortcut cheatsheet modal (`?`).

#### Feature 15.2: Deep Navy / Emerald Dark & Light Mode Theme System
- **Purpose**: High-contrast, executive theme system matching the mobile app's brand language, persistent across user sessions.
- **Web UI**: `themeStore.ts`, `theme.ts`, `themeStore.test.ts`.
- **Status**: `[DONE]`
- **What Is Done**: Dark/Light mode switching, custom palette tokens, persistent storage.
- **Proposed Enhancements**: Automatic OS color scheme preference detection (`prefers-color-scheme`).

#### Feature 15.3: Route-Level Code Splitting & Performance Chunking
- **Purpose**: Eliminate monolithic bundle loading, reducing initial bundle size and improving Time-to-Interactive.
- **Web UI**: `App.tsx` (`React.lazy` on all 16 routes), `PageSkeleton.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Reduced main entry bundle by 75% (from 1.92 MB down to 470 kB), standalone chunks for heavy libraries.
- **Proposed Enhancements**: Route prefetching on navigation hover; Service Worker with Workbox for showroom offline app shell caching (`[G.1]`).

#### Feature 15.4: Enterprise Usability & Productivity Suite `[PROPOSED]` (Backlog `[O.4–O.7]`)
- **Purpose**: Administrative conveniences for high-volume daily desktop operations.
- **Scope**:
  - Saved custom table filters and persistent column visibility preferences stored per user (`[O.4]`).
  - Universal document attachment previewer modal supporting inline rendering of PDFs, images, and documents (`[O.5]`).
  - Bulk actions across DataGrids (bulk status updates, bulk document print, bulk CSV/Excel export) (`[O.6]`).
  - Master data change history modal showing chronological diffs of edits (`[O.7]`).

---

### Group 16: Accounting & Financial General Ledger `[PROPOSED]` (Backlog `[H.1–H.10]`)

> **Strategic Consideration (ADR-01)**: The technical leadership and executive stakeholders must determine whether the accounting capabilities outlined below should be built as a custom, bespoke double-entry module internal to SMS, or integrated via REST APIs/Webhooks with an established specialized commercial accounting platform (such as Jurnal.id, Accurate Online, SAP Business One, or Xero). The items below represent **architectural considerations and design specifications under review, not automatic implementation commitments.**

#### Feature 16.1: Chart of Accounts (COA) & General Ledger Engine `[PROPOSED]` (Backlog `[H.1]`, `[H.2]`)
- **Purpose**: Authoritative double-entry accounting foundation governing multi-store commercial and credit financing operations.
- **Scope**:
  - Hierarchical Chart of Accounts categorized into Assets, Liabilities, Equity, Revenue, Cost of Goods Sold, and Operating Expenses (`[H.1]`).
  - Store-level segmentation allowing branch-specific P&L while rolling up into company-wide financial consolidations (`[H.1]`).
  - Automated operational journal voucher posting engine mapping debit/credit entries for Purchases, Deliveries, Payments, Discrepancies, and Repossessions (`[H.2]`).

#### Feature 16.2: Accounts Payable & Accounts Receivable Sub-Ledger Integration `[PROPOSED]` (Backlog `[H.3]`)
- **Purpose**: Seamless synchronization between operational procurement/sales sub-ledgers and the general ledger control accounts.
- **Scope**:
  - Automatic posting of supplier PO debt to Accounts Payable upon physical receiving (`[H.3]`).
  - Automatic posting of customer financed credit to Accounts Receivable control accounts upon order release (`[H.3]`).
  - Aging synchronization between sub-ledger schedules and balance sheet control totals (`[H.3]`).

#### Feature 16.3: Cash & Bank Management with Statement Reconciliation `[PROPOSED]` (Backlog `[H.4]`)
- **Purpose**: Reconcile internal cash registers and bank ledgers against external commercial bank account statements.
- **Scope**:
  - Multiple store petty cash and corporate bank account registers.
  - Electronic bank statement import (CSV, MT940, OFX).
  - Automated rule-based reconciliation matching payment references, customer names, and exact transfer amounts.
  - Unreconciled transaction investigation ledger and bank reconciliation discrepancy reporting.

#### Feature 16.4: Financial Statements, Period Closing & Fixed Assets `[PROPOSED]` (Backlog `[H.5–H.10]`)
- **Purpose**: Authoritative financial reporting, period governance, and asset depreciation.
- **Scope**:
  - Real-time Trial Balance verification (`[H.5]`).
  - Profit and Loss Statement (Income Statement) with store-by-store comparison and gross margin analysis (`[H.5]`).
  - Balance Sheet reflecting current assets, receivables portfolio, fixed assets, debt, and retained earnings (`[H.5]`).
  - Direct and Indirect Cash Flow Statements (`[H.5]`).
  - Opening balances ledger setup and historical data conversion support (`[H.6]`).
  - Monthly and annual financial period-end closing lock mechanism with adjusting journal entries (`[H.7]`).
  - Fixed assets register, depreciation schedules, and asset disposal accounting (`[H.8]`).
  - Indonesian tax-related accounting requirements (VAT/PPN input/output tracking, withholding taxes PPh 21/23) (`[H.9]`).
  - Comprehensive financial audit trail and immutable journal modification tracking (`[H.10]`).

---

## 5. Master Implementation Review Table (Comprehensive)

> **Important Note on Completion Percentages**: The completion percentages in the table below strictly reflect **Feature Implementation (% Code Written)** and **Local/Unit-Level Integration Verification**. A 100% rating indicates that the domain's business logic, database migrations, controllers, UI screens, and local tests are complete and verified. It **does NOT mean the domain is 100% production-ready for live cloud deployment**, as live cloud infrastructure provisioning (Backlog `[A.1–A.5]`), end-to-end integration testing (Backlog `[F.1–F.4]`), and external legal/compliance sign-offs (Backlog `[N.4]`) remain separate ongoing workstreams.

| # | Feature Domain | Backend API | Web UI | Mobile App | Verification Status | Feature Code Completion | Canonical Backlog Ref |
|---|---|---|---|---|---|:---:|:---:|
| **1** | Multi-Store & Foundation | `StoreController`, `V1` | `StoreListPage` | Auth Bootstrap | Unit Tests Passed | **100%** | Built-in Foundation |
| **2** | Employee & RBAC (10 Roles) | `MeController`, `EmployeeController` | `RolePermissionsPage` | Dynamic Role Router | Auth Guards Verified | **100%** | Built-in Foundation |
| **3** | Approval Workflow DAG | `ApprovalService`, `ApprovalRequest` | `ApprovalWorkflowsPage` | In-App Queue | Canvas & Simulation | **100%** | Built-in Foundation |
| **4** | Security Audit Log (Exception Trail)| `SecurityAuditLogController`, `V20` | `DashboardPage` Alerts | Event Logging | REST Verified | **100%** | `[D.5]` |
| **5** | Customer Master & NIK | `CustomerController`, `V2` | `CustomerListPage` | Customer Search | Zod & Validation | **100%** | Built-in Foundation |
| **6** | Gated Customer Creation | `CustomerRequest` SO Gating | `CustomerFormDialog` | SO Linked Creation | Validation Blocks | **100%** | `[D.3]` |
| **7** | Product Catalog & BOM | `ProductController`, `V3` | `ProductListPage` | Catalog Browser | JPA Entities Verified | **100%** | Built-in Foundation |
| **8** | Store-Specific Pricing | `StorePriceController` | `ProductDetailPage` | Pricing Matrix | Multi-Store Gating | **100%** | Built-in Foundation |
| **9** | Sales Orders & DP Custody | `SalesOrderController`, `V4` | `SalesOrderDetailPage` | SO Creation | Flow & DP Posting | **100%** | `[D.2]` |
| **10** | Printable Contracts & Receipts| `PrintableDocumentController` | Print Buttons (SO, DO, Fin, HR) | Webview View | 5 Documents HTML/PDF | **100%** | `[D.1]` |
| **11** | Credit Survey Field Workflow | `SurveyListController`, `V5` | Order Detail Gating | `SurveyorTaskScreen` | Photos & GPS Verified | **100%** | `[B.3]`, `[C.2]` |
| **12** | Stock Units & Movement Ledger| `StockService`, `V6` | `StockUnitListPage` | Serial Lookup | Vitest & Movement Log | **100%** | `[E.3]` |
| **13** | Procurement & Auto-Ingest | `ProcurementService`, `V7` | `PurchaseOrderDetailPage` | N/A | Receipt Ingestion | **100%** | Built-in Foundation |
| **14** | Delivery Logistics & Map | `DeliveryService`, `V8` | `DeliveryRouteMap.tsx` | `DriverTripScreen` | Waypoints & Signatures| **100%** | `[B.4]`, `[E.2]` |
| **15** | Installment FIFO & Cash Custody| `FinanceService`, `V9` | `FinancePage.tsx` | `CollectorVisitScreen`| Custody Discrepancies | **100%** | `[B.5]` |
| **16** | Repossessions & Bad Debt | `RepossessionService`, `V10` | `RepossessionWarrantyPage`| Recovery Logging | Debt Forgiveness Rule | **100%** | Built-in Foundation |
| **17** | Expenses & Overrun Ceilings | `ExpenseService`, `V11` | `ExpenseBudgetPage.tsx` | Expense Claim | Overrun Interception | **100%** | Built-in Foundation |
| **18** | Attendance & GPS Geofence | `PayrollService`, `V12` | `PayrollPage.tsx` | `AttendanceScreen` | Haversine 200m Rule | **100%** | `[B.2]`, `[C.4]` |
| **19** | Non-Calendar Payroll Engine | `PayrollService.calculate` | Slip Print & Approval | `MyPayrollScreen` | Cutoff Calculation | **100%** | `[B.6]` |
| **20** | Comparative Period Analytics | `ReportingController`, `V13` | `PeriodComparisonPanel` | N/A | 28/28 Vitest Passed | **100%** | `[G.3]` |
| **21** | Mobile Offline Sync (FIFO Replay)| N/A (Client Engine) | N/A | `OfflineSyncQueueNotifier` | Local Disk Replay | **100%** | `[C.5]` |
| **22** | Mobile Hardware & Biometrics | N/A (Client Engine) | N/A | Signature, Scanner, Biometrics | Component Verified | **100%** | `[C.1–C.3]`, `[C.6]` |
| **23** | Global Search Command Palette | N/A (Client Engine) | `CommandPalette.tsx` | N/A | Keyboard Shortcuts | **100%** | `[E.1]` |
| **24** | Dark/Light Mode Theme System | N/A (Client Engine) | `themeStore.ts` | Theme Engine | Vitest Verified | **100%** | `[E.5]` |
| **25** | Code Splitting & Performance | Vite Production Build | `App.tsx` (Lazy Routes) | Native Compilation | Bundle -75% (470 kB) | **100%** | `[E.7]` |
| **26** | Client-Side Excel (.xlsx) Export | N/A (Client Engine) | `exportExcel.ts`, Finance & Dashboard | N/A | 33/33 Vitest Passed | **100%** | `[G.2]` |
| **27** | *General Ledger & Accounting* | *Proposed* | *Proposed* | *N/A* | *Under Architectural Review*| **0% (Proposed)** | `[H.1–H.10]` |
| **28** | *Physical Stocktaking (Opname)* | *Proposed* | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[I.5]`, `[M.5]` |
| **29** | *Customer 360 & CRM* | *Proposed* | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[J.1–J.7]` |
| **30** | *Promise-to-Pay (PTP) Engine* | *Proposed* | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[J.3]` |
| **31** | *Sales Returns & Refunds* | *Proposed* | *Proposed* | *N/A* | *Under Architectural Review*| **0% (Proposed)** | `[K.1]`, `[K.2]` |
| **32** | *Inventory Costing (COGS/FIFO)*| *Proposed* | *Proposed* | *N/A* | *Under Architectural Review*| **0% (Proposed)** | `[I.1–I.4]` |
| **33** | *Warehouse Location & Picking* | *Proposed* | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[I.8]`, `[I.9]`, `[M.2]` |
| **34** | *Store Checklists & Fleet* | *Proposed* | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[L.1]`, `[L.2]`, `[L.5–L.7]` |
| **35** | *Internal Bulletins & Tasks* | *Proposed* | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[L.3]`, `[L.4]` |
| **36** | *Mobile Work Centers (Sales/Pick)*| *Proposed* | *N/A* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[M.1–M.6]` |
| **37** | *Architecture, SRE & Security* | *Proposed* | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[N.1–N.7]` |
| **38** | *Workflow Governance & Usability*| *Proposed* | *Proposed* | *N/A* | *Under Architectural Review*| **0% (Proposed)** | `[O.1–O.7]` |

---

## 6. What Hasn't Been Done Yet (Detailed Gap Analysis & Review)

While the full operational feature code across backend, web, and mobile is written, integrated, and verified by local unit/component tests, the following infrastructure, integration, and newly proposed domains represent outstanding work required to achieve full enterprise production maturity:

### 1. Live Environment & Infrastructure Deployment (Backlog `[A.1–A.5]`)
- The backend currently runs using local development profiles and placeholder credentials.
- Migrations `V1` through `V20` must be executed and validated against a live PostgreSQL 16 database (`[A.3]`).
- A production Supabase project with JWKS URI validation and S3-compatible storage buckets (`sms-documents`, `sms-photos`, `sms-signatures`) must be provisioned with row-level security policies (`[A.1]`).
- A production Redis cluster must be provisioned for high-concurrency atomic document sequence counters and query caching (`[A.2]`).

### 2. Quality Assurance, DevOps & Multi-Service Integration Testing (Backlog `[F.1–F.4]`)
- **End-to-End Browser Testing (`[F.1]`)**: Automated browser test suite using Playwright covering the primary business pipeline: *Sales Order Draft → Price Approval → Survey → Confirm + DP → Delivery Trip + Surat Jalan → Installment Payment*.
- **Mobile Integration Tests (`[F.2]`)**: Flutter integration tests validating offline action queue persistence across app restarts, biometric unlock simulation, and sync replay.
- **Continuous Integration Pipeline (`[F.3]`)**: GitHub Actions workflow running Maven build/tests, Web lint/build/Vitest, and Flutter analyze/tests on every pull request.
- **Automated Database Backup & Disaster Recovery (`[F.4]`)**: Scheduled `pg_dump` snapshot script with offsite cloud storage replication.

### 3. Advanced Mobile Offline Architecture & Conflict Handling (Backlog `[N.3]`)
- Transition from plain `SharedPreferences` to SQLite via Drift to support multi-table relational persistence, complex offline queries, and ACID local transactions.
- Implement explicit 5-state sync tracking (`PENDING`, `SYNCING`, `SUCCESS`, `RETRY`, `CONFLICT`) with server-authoritative conflict escalation UI for financial and inventory divergence.

### 4. Proposed Business & Architectural Domains (Backlog `[H.1–H.10]`, `[I.1–I.9]`, `[J.1–J.7]`, `[K.1–K.5]`, `[L.1–L.7]`, `[M.1–M.6]`, `[N.1–N.7]`, `[O.1–O.7]`)
- Detailed design and stakeholder review of ADR-01 through ADR-09 prior to scheduling implementation for Accounting, Inventory Costing, Stocktaking, CRM 360, Returns/Refunds, Fleet/Checklists, and Workflow Governance.

---

## 7. Master Action Backlog & Todo List (Canonical Source of Truth)

> **Important**: This section is the **canonical single source of truth** for all completed tasks, outstanding operational setup, and proposed feature enhancements across the entire SMS project. Every item has a unique, stable identifier (`[Category.Number]`) referenced throughout this document.

### A. Environment & Infrastructure Setup
- [ ] **A.1**: Configure live Supabase project (JWKS URI, Postgres DB connection, Service Role Key, Storage Bucket `sms-documents`).
- [ ] **A.2**: Provision production Redis instance for atomic document numbering and short-lived caching.
- [ ] **A.3**: Execute Flyway migrations V1–V20 on live PostgreSQL and verify constraints, sequences, and foreign keys.
- [ ] **A.4**: Run full integration test suite using Docker / Testcontainers.
- [ ] **A.5**: Set up environment configuration files (`.env` template documentation for web and mobile).

### B. Mobile App — Backend Wiring & Live Data Integration
- [x] **B.1**: Wire `AuthNotifier` to Supabase Auth login and `/api/me` profile bootstrap.
- [x] **B.2**: Wire `AttendanceScreen` to `POST /api/v1/payroll/attendance/clock-in`, `clock-out`, and `leave-requests`.
- [x] **B.3**: Wire `SurveyorTaskScreen` to `GET /api/surveys` and `POST /api/surveys/{id}/decide`.
- [x] **B.4**: Wire `DriverTripScreen` to `GET /api/delivery-trips` and `POST /api/delivery-orders/{id}/deliver`.
- [x] **B.5**: Wire `CollectorVisitScreen` to `GET /api/finance/receivables` and `POST /api/finance/collections`, `payments`, and `custodies/{id}/handover`.
- [x] **B.6**: Wire `MyPayrollScreen` to `GET /api/v1/payroll/employees/{id}/slips`.

### C. Mobile App — Hardware, Field Operations & Offline Capabilities
- [x] **C.1 (Hardware)**: Integrate barcode/QR scanning for serial numbers and Surat Jalan DO codes.
- [x] **C.2 (Hardware)**: Integrate field photo proof capture with GPS watermarking (surveys, deliveries, collections).
- [x] **C.3 (UI/UX)**: Add digital signature pad component on mobile for customer sign-off on delivery orders and credit contracts.
- [x] **C.4 (Security & Anti-Fraud)**: Add GPS location tagging and store geofence validation for attendance clock-ins.
- [x] **C.5 (Offline & Sync)**: Implement offline-first persistent caching and upload queue with background auto-sync replay engine.
- [x] **C.6 (Biometrics)**: Add biometric authentication (Fingerprint / Face ID) simulation and session unlock.

### D. Backend Enhancements & Business Refinements
- [x] **D.1**: Build printable document generation service (`PrintableDocumentService` & `PrintableDocumentController`):
  - Official Delivery Note / Surat Jalan with barcodes and triple signature blocks.
  - Official Credit Sales Order Agreement contract with statutory clauses.
  - Customer Payment Receipt voucher with Indonesian number-to-words spelling (Terbilang).
  - Employee Monthly Payroll Slip with gross/deductions/net breakdown.
  - Formal Repossession Notice and asset recovery handover letter.
- [x] **D.2**: Tie Sales Order Down Payment (DP) confirmation directly into Finance module (`customer_payment` + `payment_custody`).
- [x] **D.3**: Enforce strict customer creation gating: require SO creation context or explicit administrative permission.
- [x] **D.4**: Real-time push notifications via `PushNotificationDispatcher` integrated into `NotificationService`.
- [x] **D.5**: Comprehensive security audit log (`V20__security_audit_log.sql`, `SecurityAuditLogService`, `SecurityAuditLogController`) capturing price overrides, cash discrepancies, and scrap write-offs.

### E. Web App UI/UX & Performance Improvements
- [x] **E.1 (UI/UX)**: Implement Global Search Command Palette (`Ctrl+K` / `Cmd+K`) to jump directly to customers, products, SO numbers, stock unit serials, and delivery orders (`CommandPalette.tsx`).
- [x] **E.2 (UI/UX)**: Interactive route map view for delivery trips showing route order, progress metrics, drop pins, and Surat Jalan print shortcuts (`DeliveryRouteMap.tsx`).
- [x] **E.3 (Performance)**: High-performance virtualized scrolling for large stock unit data grid, search/filter presets, and immutable Stock Movement Ledger drawer (`StockMovementHistoryDrawer.tsx`).
- [x] **E.4 (UI/UX)**: Interactive React Flow visual workflow builder with custom step nodes (`ApprovalStepNode.tsx`), minimap, controls, and interactive threshold simulation dialog.
- [x] **E.5 (UI/UX)**: Complete Dark/Light mode theme system (`themeStore.ts`, `theme.ts`) with deep navy/emerald palette and responsive navigation drawer for floor tablet devices.
- [x] **E.6 (Performance)**: Optimistic updates in TanStack Query for stock availability adjustments (`hooks.ts`).
- [x] **E.7 (Performance)**: Route-level code splitting using `React.lazy()` and `Suspense` fallback (`PageSkeleton.tsx`), reducing main bundle size from 1.9MB to 470kB (-75%).
- [x] **E.8 (UI/UX)**: Integrated one-click official printable document triggers across Web UI (Credit Agreement on Sales Order, Official Receipt on Finance, Payroll Slip on HR, Surat Jalan on Deliveries, Repossession Notice on Returns).
- [x] **E.9 (UI/UX)**: Universal CSV export utility (`exportCsv.ts`) added to Customers Directory, Accounts Receivable, and Reporting.

### F. Testing, Quality Assurance & DevOps
- [ ] **F.1**: Build end-to-end (E2E) testing suite with Playwright covering critical paths:
  - Sales Order Draft → Price Approval → Survey → Confirm → Deliver → Finance Installment.
- [ ] **F.2**: Mobile integration tests (`integration_test`) verifying offline-to-online sync queue.
- [ ] **F.3**: GitHub Actions CI/CD pipeline running backend Maven build & tests, web lint/build/tests, and mobile analyze/tests on every pull request.
- [ ] **F.4**: Automated database backup script and disaster recovery procedure.

### G. Advanced Analytics, Reporting & PWA Backlog
- [ ] **G.1 (Offline & PWA)**: Add Service Worker with Workbox to cache web app shell and provide offline fallback for desktop and showroom tablets.
- [x] **G.2 (Export)**: Add client-side Excel (.xlsx) export utility for financial aging and stock balance reports.
- [x] **G.3 (Analytics)**: Add custom date range comparison picker for revenue and collection aging analytics.
- [ ] **G.4 (Forecasting & AI)**: Cash flow forecasting and delinquency projection engine based on historical payment velocity.
- [ ] **G.5 (Store Benchmarking)**: Multi-store performance benchmarking heatmap and quota achievement radar charts.
- [ ] **G.6 (Mobile Field Analytics)**: Mobile collector performance dashboard showing daily collection quota vs actual recovery rate.
- [ ] **G.7 (Document Scanning OCR)**: Mobile camera OCR scanning for automatic Indonesian KTP (National ID) data entry.
- [ ] **G.8 (Multi-Approver Voting)**: Configurable M-of-N quorum voting for high-value price override workflows.
- [ ] **G.9 (Scheduled Reports)**: Automated daily/weekly email digest dispatching Excel (.xlsx) financial aging and stock balance reports to store managers.
- [ ] **G.10 (Batch Statement)**: Customer account billing statement PDF batch export with installment ledger.

### H. Accounting, General Ledger & Financial Management (Proposed)
> *Strategic Decision*: Under review per ADR-01 (In-house bespoke build vs External accounting integration).
- [ ] **H.1**: Hierarchical Chart of Accounts (COA) master categorized into Assets, Liabilities, Equity, Revenue, COGS, and Expenses with store-level segmentation.
- [ ] **H.2**: Automated double-entry operational journal voucher posting engine for purchases, sales deliveries, payments, discrepancies, and repossessions.
- [ ] **H.3**: Accounts Payable (AP) and Accounts Receivable (AR) sub-ledger integration into general ledger control accounts.
- [ ] **H.4**: Multi-account Cash & Bank registers with electronic statement import (CSV, MT940, OFX) and rule-based auto-reconciliation engine.
- [ ] **H.5**: Financial statements generation engine: Trial Balance, Profit & Loss (Income Statement), Balance Sheet, and Cash Flow Statements (Direct and Indirect).
- [ ] **H.6**: Opening balances ledger setup and historical data conversion support.
- [ ] **H.7**: Monthly and annual financial period-end closing lock mechanism with adjusting journal entries.
- [ ] **H.8**: Fixed assets register, depreciation schedules (straight-line, declining balance), and asset disposal accounting.
- [ ] **H.9**: Statutory tax accounting requirements (VAT/PPN input/output tracking, withholding taxes PPh 21/23).
- [ ] **H.10**: Financial audit trail and immutable journal modification tracking with adjustment voucher linking.

### I. Inventory Valuation, Costing & Warehouse Operations (Proposed)
- [ ] **I.1**: Landed cost calculation engine allocating freight shipping, handling, duties, and transit insurance across received purchase units.
- [ ] **I.2**: Inventory valuation engine supporting FIFO and Periodic Weighted Average cost models (ADR-02).
- [ ] **I.3**: Inventory write-down / impairment accounting ledger for damaged, obsolete, or aged showroom display units.
- [ ] **I.4**: Valuation model for repossessed and refurbished stock units (appraised recovery value + refurbishing repair component costs).
- [ ] **I.5**: Physical Stocktaking (Stock Opname) management module with scheduled sessions, blind counting mode, recount workflows, and balancing stock movement adjustments.
- [ ] **I.6**: Barcode label generation and printable label-template management (shelf edge tags, unit serial stickers, custom template designer).
- [ ] **I.7**: Product bundling and combo sales engine (commercial kits, multi-item bundles with auto-deduction of component stock upon order release).
- [ ] **I.8**: Warehouse spatial location management (hierarchical warehouse, zone, aisle, rack, shelf, bin/bay).
- [ ] **I.9**: Advanced warehouse picking and put-away workflows (wave picking, directed put-away routing, item mismatch validation).

### J. Customer 360, CRM & Omnichannel Experience (Proposed)
- [ ] **J.1**: Unified Customer 360 profile consolidating sales orders, credit surveys, payment histories, delivery attempts, warranties, and interaction notes.
- [ ] **J.2**: Customer demographic tags, behavioral segmentation, Customer Lifetime Value (CLV), and historical credit reliability scoring.
- [ ] **J.3**: Customer Promise-to-Pay (PTP) tracking engine recording promised payment dates and amounts, tracking Kept vs Broken status, and triggering reminders.
- [ ] **J.4**: Fuzzy duplicate customer detection matching phone numbers, name phonetics, and mother's maiden name.
- [ ] **J.5**: Customer gift vouchers, promotional coupons, and store credit ledger management.
- [ ] **J.6**: Customer omnichannel communication and interaction history log (in-person visits, phone calls, SMS, WhatsApp interactions).
- [ ] **J.7**: Customer follow-up scheduler and automated reminder engine (sales lead follow-up, payment reminders, service check-ins).

### K. Supply Chain, Procurement & Returns Refinements (Proposed)
- [ ] **K.1**: Dedicated Sales Return, Product Inspection, and Multi-Disposition triage workflow (Restock to Available, Quarantine for Testing, Repair Work Order, Scrap Write-Off).
- [ ] **K.2**: Customer Refund and financial settlement voucher engine with non-destructive sales reversals and credit note generation (ADR-03).
- [ ] **K.3**: Internal Purchase Requisitions (PR) workflow with department budget approval prior to Purchase Order generation.
- [ ] **K.4**: Supplier Performance Scorecard tracking price change history, promised vs actual lead times, delivery accuracy, and defect rejection rates.
- [ ] **K.5**: Supplier warranty reimbursement recovery tracking for defective components and labor claims.

### L. Store Operations, Checklists & Operational Rigor (Proposed)
- [ ] **L.1**: Store Opening and Closing daily operational verification checklists with manager sign-off.
- [ ] **L.2**: Shift handover notes and cash register changeover logs.
- [ ] **L.3**: Platform-wide internal announcements and policy memo broadcasting with employee acknowledgment tracking.
- [ ] **L.4**: Employee-to-employee operational task assignment, due-date tracking, and collaboration hub.
- [ ] **L.5**: Delivery fleet vehicle maintenance scheduler, fuel consumption log tracking, and incident damage reporting.
- [ ] **L.6**: Business continuity procedures and operational disaster recovery runbooks (manual offline sales slips, power outage failover protocol).
- [ ] **L.7**: Shift operational issue tracking and resolution log.

### M. Mobile Work Center Enhancements (Proposed)
- [ ] **M.1**: Surveyor Customer Location Profiling capturing delivery destination GPS coordinates, alley width, stair clearance, and gate access notes.
- [ ] **M.2**: Warehouse mobile guided picking and packing verification with barcode scanning against delivery packing manifests.
- [ ] **M.3**: Delivery Issue Reporting for failed deliveries with photographic proof, failure reason tagging, and auto-rescheduling triggers.
- [ ] **M.4**: Salesperson Mobile Work Center with customer lookup, quotation generator, and personal quota progress tracking.
- [ ] **M.5**: Mobile Physical Stocktaking (Stock Opname) continuous barcode scanning tool with offline buffer and instant variance alert against active session book balances.
- [ ] **M.6**: Mobile Actionable Notification Center with document deep-links and one-tap supervisory approvals/rejections.

### N. Platform Architecture, Reliability & Security Hardening (Proposed)
- [ ] **N.1**: Transactional Outbox Pattern implementation with CDC worker/polling dispatcher for reliable asynchronous event publishing.
- [ ] **N.2**: Durable database-backed idempotency table (`idempotency_keys`) protecting critical financial, payment, and inventory mutation endpoints.
- [ ] **N.3**: Mobile local storage migration to SQLite with Drift supporting deterministic 5-state sync lifecycle (`PENDING`, `SYNCING`, `SUCCESS`, `RETRY`, `CONFLICT`) and server-authoritative conflict escalation.
- [ ] **N.4**: Indonesian UU No. 27/2022 PDP data protection compliance: NIK field-level encryption (AES-256), role-based PII masking, statutory retention policies, and formal legal review (ADR-08).
- [ ] **N.5**: Data-scope authorization hierarchy enforcing Store, Department, Territory, and Record Ownership boundaries across backend queries.
- [ ] **N.6**: SRE observability stack: Structured JSON logging with trace IDs, Prometheus metrics, and OpenTelemetry distributed tracing.
- [ ] **N.7**: Multi-Factor Authentication (MFA via TOTP/SMS) and remote device session revocation for administrative and financial roles.

### O. Workflow, Document Governance & Enterprise Usability (Proposed)
- [ ] **O.1**: Document expiry monitoring and automated reminders (quotations, contracts, warranties, supplier agreements).
- [ ] **O.2**: Approval delegation when assigned approver is unavailable (temporary proxy assignment).
- [ ] **O.3**: Approval escalation, timeout rules, and automatic reassignment upon inactivity.
- [ ] **O.4**: Saved custom table filters and persistent column preferences stored per user.
- [ ] **O.5**: Universal document attachment previewer modal supporting inline rendering of PDFs, images, and Word documents.
- [ ] **O.6**: Bulk operations across data grids (bulk document print, status updates, exports).
- [ ] **O.7**: Master data change history audit log capturing field-level diffs.

---

## 8. Chronological Task Execution History

- **2026-10-30**:
  - **Full Architectural Audit**: Cross-repository audit across all database schemas, backend services, web components, and mobile interfaces.
  - **Mobile REST API Wiring (Section B)**:
    - Wired `ApiClient` with Dio bearer token interceptors and mock/live fallback.
    - Implemented Riverpod notifiers and models for Attendance (`/api/v1/attendance`), Surveys (`/api/surveys`), Delivery Trips (`/api/delivery-trips`), Collections & Custody (`/api/finance/*`), and Payroll (`/api/v1/payroll/employees/*`).
    - Added `/api/me`, `/api/surveys`, and `/api/v1/payroll/employees/{id}/slips` backend endpoints to support mobile and web client bootstrapping.
  - **Mobile Hardware, Field Operations & Offline (Section C)**:
    - Built smooth digital touch/stylus signature pad (`SignaturePadWidget`).
    - Integrated camera viewfinder laser barcode/QR scanner modal (`BarcodeScannerModal`).
    - Built field photo proof capture grid with GPS and timestamp watermarking (`PhotoProofGridWidget`).
    - Created pure-Dart Haversine 200m GPS geofence calculator preventing remote clock-ins (`GeoLocationService`).
    - Implemented persistent offline action queue with background auto-sync replay (`OfflineSyncQueueNotifier`).
    - Built biometric authentication layer (`BiometricService`) for Fingerprint / Face ID unlock.
  - **Backend Enhancements & Business Refinements (Section D)**:
    - Built `PrintableDocumentService` and `PrintableDocumentController` generating clean HTML/PDF documents for Surat Jalan, Credit Agreement, Payment Receipt (with Terbilang words helper), Payroll Slip, and Repossession Handover Notice.
    - Integrated Down Payment (DP) recording from Sales Order confirmation directly into Finance module (`customer_payment` + `payment_custody`).
    - Enforced strict customer creation gating with SO linkage in `CustomerRequest`.
    - Added `PushNotificationDispatcher` for real-time mobile push and desktop event broadcast.
    - Created migration `V20__security_audit_log.sql`, `SecurityAuditLog` entity, repository, service, and controller for auditing price overrides, cash discrepancies, and scrap write-offs.
  - **Web App UI/UX & Performance Improvements (Section E)**:
    - Created Global Search Command Palette (`CommandPalette.tsx`) with `Ctrl+K` / `Cmd+K` shortcut, instant filtering across all 16 modules, and keyboard navigation.
    - Built Interactive Delivery Route Map (`DeliveryRouteMap.tsx`) integrated into `DeliveryTripDetailPage.tsx` featuring visual waypoint timeline, metrics, and Surat Jalan print shortcuts.
    - Optimized Stock Unit & Inventory list (`StockUnitListPage.tsx`) with high-performance virtualized DataGrid and dedicated Stock Movement Ledger audit drawer (`StockMovementHistoryDrawer.tsx`).
    - Upgraded Approval Workflow Engine (`ApprovalWorkflowsPage.tsx`) using modern React Flow (`@xyflow/react` v12), custom step nodes with approver role badges (`ApprovalStepNode.tsx`), and simulation dialog.
    - Built Dark/Light mode theme architecture (`themeStore.ts`, `theme.ts`) matching Deep Navy & Emerald mobile design language.
    - Implemented TanStack Query optimistic UI updates in `features/inventory/hooks.ts` with error rollback.
    - Implemented route-level code splitting using `React.lazy()` and `PageSkeleton.tsx` in `App.tsx`, reducing main bundle size from 1.9MB down to 470kB (-75%).
    - Wired one-click official printable document triggers into Sales Order, Finance, Payroll, Deliveries, and Returns.
    - Added universal CSV export utility (`exportCsv.ts`) with automated UTF-8 BOM encoding.
  - **Comparative Analytics Engine & Custom Date Range Picker (Task G.3)**:
    - Backend: Added `GET /api/v1/reporting/period-comparison` in `ReportingController` & `ReportingService` with `PeriodComparisonResponse` DTO calculating gross revenue, cash collections, order count, AOV, daily trajectory overlay, and debt aging shifts.
    - Frontend: Created `DateRangeComparisonPicker.tsx` (preset chips: This Month vs Last Month, Last 30 Days vs Prior 30 Days, This Quarter vs Last Quarter, Custom Range) and `PeriodComparisonPanel.tsx` (4 delta KPI cards, Recharts Day-by-Day Trajectory bar overlay, debt aging shift cards, CSV export).
    - Integrated into `DashboardPage.tsx` under "Comparative Analytics" tab.
    - Verified: Clean TypeScript compilation (`tsc -b`), 28/28 Vitest unit and integration tests passing, and clean Vite production build.
  - **Client-Side Excel (.xlsx) Multi-Sheet Export Utility (Task G.2)**:
    - Created `exportExcel.ts` powered by SheetJS (`xlsx`) supporting single-sheet and multi-sheet workbook generation, metadata headers, custom column widths, and cell formatting.
    - Implemented `exportFinancialAgingToExcel` generating a 2-sheet workbook (Aging Summary + Receivable Accounts).
    - Implemented `exportStockBalanceToExcel` generating a 2-sheet workbook (Inventory Summary + Stock Units Ledger).
    - Wired Excel export triggers into `FinancePage.tsx`, `DashboardPage.tsx`, and `StockUnitListPage.tsx`.
    - Added comprehensive unit tests in `exportExcel.test.ts` (5 tests). Total Vitest test suite passing: 33/33 tests across 14 test files.
    - Verified Vite production build: clean code-splitting into standalone `exportExcel` chunk (286 kB) without bloating initial entry bundle (470 kB).
  - **Documentation Restructure & Master Specification Expansion (Version 3.0)**:
    - Restructured documentation incorporating 35+ proposed enterprise capabilities across Accounting & General Ledger, Costing & COGS, Sales Returns & Refunds, Physical Stocktaking, Customer 360 CRM, Promise-to-Pay, Mobile Work Centers, and Enterprise SRE/Security Architecture.
    - Established Section 9 "New Suggestions – Pending Review" and "Architectural Decisions to Revisit" for executive review without altering existing implemented statuses.
  - **Documentation Refinement & Specification Hardening (Version 3.1)**:
    - Refined implementation status framework: strictly distinguished Feature Implementation (% Code Written), Integration Verification (Test Coverage), and Production Readiness (Infrastructure & Deployment).
    - Consolidated canonical backlog in Section 7 as single source of truth with unique identifiers (`[A.1]` through `[O.7]`); cross-referenced all proposed features and review sections.
    - Refined technical recommendations on Redis document numbering (ADR-05), durable database idempotency, SQLite/Drift mobile offline sync with server authority, and Indonesian legal/regulatory validation caveats (ADR-08).
    - Added 12 new backlog specifications across warehouse operations, labeling, customer interaction logging, approval delegation, operational checklists, and business continuity.
    - Fixed backlog category ordering and updated comprehensive review table (Section 5).

---

## 9. New Suggestions – Pending Review

> **Important**: All items in this section represent proposed feature enhancements, business capabilities, and architectural suggestions gathered for future development phases. **None of the items in this section are currently implemented or scheduled as committed scope.** They are consolidated here for architectural review, business stakeholder alignment, and phased prioritization, and reference the canonical Backlog IDs in Section 7.

### 9.1 Consolidated Overview of New Suggestions by Domain

#### A. Business & Financial Management
- **Accounting & General Ledger Engine (`[H.1–H.10]`)**: Complete double-entry accounting foundation with Chart of Accounts, Journal Entries, Accounts Payable, AR integration, Cash/Bank registers, Bank Reconciliation, Trial Balance, P&L, Balance Sheet, Cash Flow, Opening Balances, Period Closing, Fixed Assets, and Tax Accounting. (Under review per ADR-01).
- **Inventory Valuation & Cost of Goods Sold (`[I.1–I.4]`)**: Product acquisition cost tracking, landed cost allocations (freight, duties, insurance), FIFO vs. Weighted Average valuation models (ADR-02), inventory write-downs, and repossessed/refurbished unit cost valuation.
- **Sales Returns, Refunds & Cancellations (`[K.1]`, `[K.2]`)**: Return authorization workflow, multi-point post-return inspection, inventory disposition triage (restock, repair, scrap), refund voucher processing, and non-destructive credit notes (ADR-03).
- **Supplier Performance Management (`[K.4]`, `[K.5]`)**: Supplier catalog tracking, price change history, lead-time analytics, delivery completeness and defect rates, supplier quotation comparison, and warranty reimbursement recovery tracking.

#### B. Improvements to Existing Core Modules
- **Sales & Financing (`[O.1]`, `[J.3]`, `[J.5]`)**: Quotation expiration dates, quotation-to-order conversion, early settlement payoff calculator with interest rebates, loan restructuring/rescheduling, gift vouchers/store credit, and promise-to-pay tracking.
- **Inventory & Warehouse Operations (`[I.6–I.9]`)**: Min/max safety stock levels, aging buckets, reservation expiration, serialized condition grading, barcode label generation, product bundling/kits, warehouse bin/bay location tracking, and directed put-away workflows.
- **Procurement & Logistics (`[K.3]`, `[L.5]`, `[M.3]`)**: Internal Purchase Requisitions (PR), vehicle maintenance schedules, fuel logs, failed delivery incident reporting, and automated rescheduling.
- **Warranty, HR & Expenses (`[K.5]`, `[L.1–L.2]`, `[O.2–O.3]`)**: Repair profitability analysis, multi-shift rosters, leave quotas, recurring operational expense templates, and approval delegation during manager absence.

#### C. New Operational & Customer Management Modules
- **Physical Stocktaking / Stock Opname (`[I.5]`, `[M.5]`)**: Scheduled audit sessions, blind counting mode, mobile barcode scanner counting, recount escalation workflows, discrepancy threshold investigations, supervisory sign-off, and balancing stock adjustments.
- **Customer Relationship Management / Customer 360 (`[J.1–J.7]`)**: Unified interaction timeline, consolidated multi-module history, demographic tags and segmentation, Customer Lifetime Value (CLV) calculation, omnichannel communication logs, follow-up scheduler, and fuzzy duplicate detection.
- **Customer Promise-to-Pay Management (`[J.3]`)**: Structured logging of payment promises, automated tracking of Kept vs Broken promises, proactive reminders, and collector morning queue integration.

#### D. Mobile Application Enhancements (Worker App)
- **Field & Logistics Operations (`[M.1–M.3]`)**: Customer delivery location survey (GPS coordinates, access notes), warehouse mobile guided picking and packing with barcode verification, and delivery issue reporting.
- **Field Sales & Auditing (`[M.4–M.6]`)**: Salesperson mobile work center, mobile continuous barcode stocktaking scanner, and actionable notification center with deep-links and one-tap approvals.

#### E. Operational Rigor, Checklists & Collaboration
- **Operational Procedures (`[L.1]`, `[L.2]`, `[L.6]`, `[L.7]`)**: Store opening and closing daily verification checklists; shift handover notes and cash register changeover logs; business continuity procedures and disaster recovery runbooks; shift issue tracking.
- **Internal Communications (`[L.3]`, `[L.4]`)**: Store-wide internal announcements and policy memos with employee acknowledgment tracking; employee-to-employee task assignment hub.
- **Fleet Management (`[L.5]`)**: Delivery vehicle maintenance schedules, fuel consumption tracking, and incident damage logs.

#### F. Usability & Quality-of-Life (Web SPA)
- **Productivity Tools (`[O.4–O.7]`)**: Saved custom table filters; persistent column visibility preferences; bulk multi-select actions; universal document attachment previewer modal; master data change history diffs.

#### G. Business Intelligence & Predictive Analytics
- **Executive Dashboards & Predictive Analytics (`[G.4]`, `[G.5]`, `[G.9]`)**: Store benchmarking heatmaps, credit default transition roll rates (PAR 30/60/90), vintage default curves, what-if financial simulations, cash-flow forecasting engine, and AI-assisted demand forecasting.

#### H. Technical & Architectural Hardening
- **Reliability & Offline Architecture (`[N.1–N.3]`)**: Transactional Outbox Pattern; durable database idempotency table; migration to SQLite with Drift; deterministic 5-state sync lifecycle (`PENDING`, `SYNCING`, `SUCCESS`, `RETRY`, `CONFLICT`); server-authoritative conflict resolution rules.
- **Observability & Security (`[N.4–N.7]`)**: Structured JSON logging with trace IDs, Prometheus metrics, OpenTelemetry distributed tracing, Sentry tracking; Indonesian UU No. 27/2022 PDP data protection compliance (NIK encryption, PII masking); MFA; data-scope authorization hierarchy.

---

### 9.2 Architectural Decisions to Revisit

Before any implementation begins on the proposed enhancements, the technical leadership and business stakeholders must align on the following core architectural decisions:

| # | Architectural Decision | Key Questions & Trade-offs | Recommendations / Options for Review |
|---|---|---|---|
| **ADR-01** | **Internal General Ledger vs. External Accounting Integration** | Should SMS build a custom double-entry General Ledger engine internally, or integrate with an established external accounting system (e.g., Jurnal.id, Accurate Online, SAP Business One, Xero)? | **Option A**: Build internal GL tailored specifically to retail credit financing invariants and unified reporting.<br>**Option B**: Keep SMS as operational sub-ledger (AR, Inventory, Expenses) and push summarized daily journals via REST API / Webhooks to external accounting software.<br>*Trade-off*: Option B reduces development complexity and tax audit compliance burden; Option A provides zero-sync latency and unified ACID data. |
| **ADR-02** | **Inventory Costing Methodology: FIFO vs. Periodic Weighted Average** | Which inventory valuation method best reflects the chain's gross margin and complies with Indonesian tax regulations (Undang-Undang PPh Pasal 10 ayat 6)? | **Option A**: FIFO (First-In, First-Out) matching specific purchase batches.<br>**Option B**: Periodic Weighted Average Cost calculated monthly.<br>*Note*: Indonesian tax law recognizes both FIFO and Average methods, but prohibits LIFO. For serialized goods (electronics), specific identification / FIFO is natural; for loose spare parts, weighted average is standard. |
| **ADR-03** | **Sales Returns, Refunds & Non-Destructive Accounting Policies** | How should returns and customer refunds be treated financially without violating the core invariant that finalized sales documents are immutable? | **Policy**: Finalized Sales Orders and Invoices are never rewritten. Returns must generate a distinct `SalesReturn` business document and a balanced `CreditNote` voucher.<br>*Decision Needed*: Are restocking fees charged? Does customer receive cash refund, bank transfer, or credit balance voucher? How is returned product graded before restock? |
| **ADR-04** | **Mobile Offline Permitted Actions & Conflict Resolution Strategy** | Which operations are permitted in zero-connectivity environments, and how should concurrent conflicts be resolved when the server rejects a change? | **Policy**: Non-financial data (survey notes, GPS coordinates, inspection photos) permit optimistic offline capture with Latest Timestamp Wins (LWW).<br>*Critical Decision*: Financial cash collections and stock allocations must NEVER use LWW. Cash custody handover must remain locked until collection record successfully syncs. Inventory stock allocation must be strictly server-authoritative. Conflicts halt replay and require managerial intervention. |
| **ADR-05** | **Document Numbering: Gapless Sequences vs. High-Concurrency Performance** | Does legal or tax compliance strictly require gapless consecutive document numbering for invoices and Surat Jalan, or are Redis atomic sequences sufficient? | **Analysis**: High-concurrency Redis atomic counters (`INCR`) can produce gaps if an operational database transaction rolls back after the counter was incremented. Volatile Redis TTLs can also lose sequence states upon restart. PostgreSQL sequences (`nextval`) also produce gaps on rollback.<br>*Decision Needed*: Ordinary unique documents (drafts, delivery trips) use fast Redis/Postgres sequences where gaps are harmless. Statutory tax invoices (*Faktur Pajak*) requiring zero-gap continuity must use a dedicated database sequence committed synchronously inside the financial transaction, with a gap-audit reconciliation monitor. |
| **ADR-06** | **Auditability, Archival & Data Retention Policies** | What level of audit trail granularity is required, and what is the statutory data retention period for transaction history? | **Policy**: Financial records and contracts must be retained for at least 10 years pursuant to Indonesian Law No. 8 of 1997 on Company Documents (UU Dokumen Perusahaan).<br>*Decision Needed*: Implement automated database table partitioning for `stock_movement`, `security_audit_log`, and `outbox_events`, archiving historical records older than 5 years to cold cloud storage. *Requires formal legal counsel validation.* |
| **ADR-07** | **Digital Signatures Legal Validity under Indonesian Law** | Is mobile touch signature capture sufficient for statutory credit financing enforcement, or is certified digital signature integration required? | **Analysis**: Under Indonesian ITE Law (UU ITE No. 11/2008 & PP No. 71/2019), a simple canvas touch signature has evidentiary weight but can be contested in court. Certified electronic signatures issued by a licensed Certificate Authority (e.g., PrivyID, Vida, Peruri) have non-repudiation status.<br>*Decision Needed*: Use canvas touch signatures for daily logistics (Surat Jalan DO receipt); integrate licensed CA e-signatures with e-Meterai for formal multi-year credit agreement financing contracts. |
| **ADR-08** | **Indonesian Personal Data Protection (UU No. 27 Tahun 2022 / PDP) Compliance** | What technical and organizational security measures must be enforced for customer NIK, family cards (KK), and location tracking data? | **Requirements**: Implement field-level encryption for NIK and bank accounts; enforce strict role-based PII masking; record audit logs on every PII unmask event; establish customer data retention and deletion policies upon contract termination.<br>*Caveat*: All statutory interpretations must be formally reviewed and signed off by qualified Indonesian legal counsel. |
| **ADR-09** | **Statutory Payroll, Overtime & Labor Regulations** | What calculation rules apply to employee payroll, tax withholding, and social security? | **Requirements**: Comply with Indonesian PPh 21 TER (Tarif Efektif Rata-rata) progressive tax regulations (PP No. 58/2023 & PMK 168/2023), BPJS Ketenagakerjaan (JKK, JKM, JHT, JP), BPJS Kesehatan (4% employer / 1% employee), and statutory overtime multipliers under Government Regulation No. 35 of 2021 (PP 35/2021).<br>*Caveat*: All statutory tax tables and social security withholding formulas must be reviewed and certified by a licensed Indonesian tax consultant. |
