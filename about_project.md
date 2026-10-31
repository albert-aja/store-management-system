# Store Management System (SMS) — Integrated Retail Ecosystem Architecture & Master Project Documentation

> **Version**: 3.22 (Server-Side Price List Document Versioning & Stored Snapshot Engine `[G.18]`; Physical Valid-From Date Stamping; Document Versioning Archive Menu; Canonical Todo List Strictly Open Items Only)
> **Last Updated**: 2026-10-31  
> **Architecture**: Modular Monolith (Spring Boot 4.1 + PostgreSQL 16 / PostGIS + Redis + WebSocket) • Integrated 4-Application Ecosystem: Management Web SPA (React 19) • E-commerce Web (Next.js 15 / React 19) • E-commerce Mobile App (Flutter 3.44) • Worker Mobile App (Flutter 3.44)

---

## Document Status & Verification Framework

To avoid ambiguity regarding project completion, this document formally distinguishes between three distinct maturity dimensions across all modules:

1. **Feature Implementation (% Code Written)**:
   - Measures whether the core business logic, domain entities, database migrations, REST endpoints, UI screens, forms, and state management have been written and integrated into the repository codebases.
2. **Integration Verification (% Test & Integration Coverage)**:
   - Measures whether code has been verified through automated unit tests, component tests, local mock interceptors, and local builds.
   - _Current Status_: Local unit and component test suites pass (e.g., 33/33 Vitest tests on Web, Spring Boot domain unit tests, Flutter component tests). **End-to-end multi-service integration against live cloud infrastructure and cross-application workflows (Backlog `[F.1]`, `[F.2]`, `[P.9]`) remains outstanding.**
3. **Production Readiness (% Operational & Deployment Readiness)**:
   - Measures whether live cloud databases, managed Redis clusters, S3 storage buckets, automated backup/recovery runbooks, CI/CD deployment pipelines, SRE monitoring/alerting, and statutory legal sign-offs are active in production.
   - _Current Status_: **In Progress / Staged.** The system currently runs in local development/test configurations. Domains marked as "100% Implemented" refer strictly to **Feature Code & Local Verification**, not 100% production deployment readiness.

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

The **Store Management System (SMS)** is an integrated enterprise retail operations, omnichannel commerce, and money management platform engineered for a multi-store chain specializing in electronics, home appliances, and furniture.

> [!IMPORTANT]
> **System Scope & Boundary Clarification**: SMS is **not a banking application** that handles monetary creation, demand deposit accounts, interbank clearing, or regulated banking activities. The platform is purely an enterprise retail operations, omnichannel commerce, and money management system designed to track store sales, supplier procurement, multi-fulfillment logistics, customer receivables, cash custody, and in-house installment credit arrangements.

The SMS platform operates as an **integrated ecosystem consisting of four applications**, all communicating through defined APIs with a single shared backend:

1. **Management System (Web)**:
   - Primary desktop/tablet web application for business administration, inventory control, pricing matrices, procurement, logistics dispatch, fleet and vehicle management, real-time GPS monitoring dashboard, and operational governance.
   - Also functions as the point of sale for **employee-assisted walk-in purchases** in showroom branches.
2. **E-commerce Website**:
   - Customer-facing online shopping platform accessible via desktop and mobile web browsers.
   - Responsibilities: Product browsing and faceted search; categories, brands, and filters; detailed specifications, images, and variants; shopping cart and checkout; customer self-service registration and authentication; address management; online payments; order history and tracking; promotions and vouchers; fulfillment selection (own-driver delivery or customer pickup); and fulfillment grouping preferences.
3. **E-commerce Mobile Application**:
   - Customer-facing native mobile shopping experience providing essentially the same business capabilities as the e-commerce website.
   - The website and mobile app are two interfaces to the same unified e-commerce platform, not independent commerce systems.
4. **Worker Mobile Application**:
   - Employee-facing mobile application for field and operational activities.
   - Responsibilities: Customer credit surveys; multi-drop delivery operations (_Surat Jalan_ execution); product inspections; store pickup verification and handover; delivery destination location marking; task management; and shared task-based GPS location tracking for Drivers, Surveyors, and Collectors strictly during active authorized operational tasks (with Salespersons explicitly excluded), featuring automated pause during scheduled breaks, background tracking resilience, and local offline coordinate buffering.

### 1.1 Core Omnichannel Principles & Multi-Channel Sales Rules

The retail ecosystem operates under fundamental business and architectural principles:

1. **Unified Sales Logic Across All Channels**:
   - The system supports sales through:
     - Management System / employee-assisted walk-in showroom purchases.
     - Customer-facing e-commerce website.
     - Customer-facing e-commerce mobile app.
   - **These are different sales channels, not separate business systems.**
   - All purchases must follow the **exact same underlying business logic** regardless of originating channel: sales order creation/validation, product pricing, discount approvals, payment/deposits, procurement authorization, fulfillment/delivery, customer pickup, order cancellations, and refunds.
   - The originating channel is recorded for reporting, auditing, and operational analysis, but does not alter business logic unless an explicitly approved rule requires it.
2. **Configurable Payment Methods**:
   - The intended system scope supports 9 distinct payment methods:
     1. Bank transfer / Virtual Account
     2. QRIS
     3. E-wallet
     4. Credit and debit cards
     5. Cash at store
     6. Bank transfer directly to the store
     7. Cash on delivery (COD), collected by our own delivery driver
     8. In-house customer credit
     9. Third-party installment financing
   - Administrators can enable or disable supported payment methods through the Management System without code changes.
   - Payment methods have specific eligibility conditions and workflows; credit is **never automatically granted** upon customer registration and requires formal approval and credit limit management.
3. **Decoupled Payment & Sales Order Relationship**:
   - Payment is maintained as a separate business module associated with the overall sales order.
   - A sales order supports multiple payments, initial deposits, balance payments, split payment methods, and item/fulfillment-level refunds without order fragmentation.
4. **Deposit-First Procurement Authorization**:
   - A supplier purchase order for customer-demanded products **cannot proceed until the required customer deposit has been received and verified**.
   - The system supports configurable deposit rules (full payment, deposit percentage or amount, or other arrangements).
5. **Dual-Axis Fulfillment Decision Orthogonality**:
   - The system formally distinguishes between two independent decisions:
     - **Decision A — Fulfillment Completeness**: Complete fulfillment (deliver together when all ready) vs. Partial fulfillment (dispatch available items first). _Decided by the customer._
     - **Decision B — Fulfillment Method**: Home delivery (own-driver) vs. Customer store pickup.
   - Orders can combine delivery and pickup across fulfillment groups. Employees may propose operational adjustments, but must never silently override the customer's approved arrangement; customer approval and audit history must be retained.

The retailer operates on an end-to-end operational lifecycle:

1. **Procurement & Inbound Logistics**: Sourcing branded products and spare parts from national distributors, managing purchase orders, inspection receiving, demand consolidation, deposit-first procurement authorization, and auto-ingesting serialized inventory.
2. **Showroom & Omnichannel Sales**: Selling via showroom floor (walk-in), e-commerce website, or e-commerce mobile app through direct cash, digital payment gateways, cash-on-delivery (COD), or in-house installment credit financing (3, 6, 10, 12, 15 months) with store-specific terms.
3. **Credit Verification & Field Appraisal**: Conducting in-person field surveys evaluating customer creditworthiness, dwelling stability, proof photos, delivery access logistics, and income verifications.
4. **Fulfillment, Multi-Group Logistics, Fleet & Surat Jalan**: Managing flexible customer fulfillments (own-driver multi-drop delivery trips with formal Delivery Notes / _Surat Jalan_, or customer store pickup), vehicle assignments, shared task-bounded GPS tracking, pre-dispatch picking/packing checks, recipient digital signatures, and photo proof.
5. **Debt Servicing, Field Collections & Cash Custody**: Monthly field installment collections, customer promise-to-pay tracking, two-stage cash custody handover, and cashier drawer reconciliation.
6. **After-Sales, Repossessions, Warranty & Repairs**: Managing customer warranty claims, internal/external repair work orders, or executing asset recovery on defaulted credit accounts for grading, showroom re-sale, or scrap write-off.
7. **Workforce, Attendance & Non-Calendar Payroll**: Managing employee attendance with Haversine GPS geofencing, leave rosters, and non-calendar sales/collection cutoff cycles (e.g., 26th–25th) calculating attendance-prorated salaries, sales commissions, and collection bonuses.
8. **Financial Accounting & General Ledger (Proposed - Backlog `[H.1–H.10]`)**: Double-entry general ledger, chart of accounts, bank reconciliation, COGS calculation, landed cost attribution, balance sheet, and P&L financial reporting.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          END-TO-END BUSINESS FLOW                                                 │
├──────────────────┬──────────────────────────┬──────────────────────────┬───────────────────┬─────────────────────┤
│ 1. INBOUND       │ 2. OMNICHANNEL SALES     │ 3. FULFILLMENT LOGISTICS │ 4. SERVICING      │ 5. RECOVERY & AFTER │
│  Purchase PO     │  Showroom / Web / App    │  Fulfillment Groups      │  Installment Debt │  Default Event      │
│  Receiving       │  Price Approval          │  Surat Jalan / Pickup    │  Collector Visit  │  Repossession       │
│  Serial Unit     │  Credit Survey           │  Driver / Store Handover │  Cash Custody     │  Grading & Triage   │
│  Stock Movement  │  Down Payment / Gateway  │  Fleet GPS Tracking*     │  Cashier Reconcil │  Resell or Scrap    │
│  Landed Cost*    │  CRM 360 History*        │  Recipient Sign / Proof  │  Promise-to-Pay*  │  Warranty Repair    │
│  (Backlog I.1)   │  (Backlog J.1, P.1-P.8)  │  Failed Resched*         │  (Backlog J.3)    │  (Backlog K.1)      │
│                  │                          │  (Backlog M.3, P.4, Q.1) │                   │                     │
└──────────────────┴──────────────────────────┴──────────────────────────┴───────────────────┴─────────────────────┘
(* Indicates Proposed Enhancements cross-referenced to Canonical Backlog IDs)
```

---

## 2. Technology Stack & Architectural Topology

The SMS platform operates as a unified distributed enterprise system anchored by a **single authoritative backend and shared relational database** to guarantee ACID compliance, prevent split-brain inventory decisions, and eliminate data synchronization drift across channels.

```
STORE MANAGEMENT SYSTEM — INTEGRATED APPLICATION ECOSYSTEM
├── core-backend/ (Java 21 • Spring Boot 4.1.x) [CENTRAL AUTHORITATIVE BACKEND]
│   ├── Architecture: Modular Monolith with strictly bounded domain contexts
│   ├── Persistence: Spring Data JPA + Hibernate 6.x
│   ├── Database: PostgreSQL 16 (Flyway migrations V1–V20+) + PostGIS Spatial Engine
│   ├── Security: Spring Security + Supabase OAuth2 JWT validation (RBAC / PBAC)
│   ├── High-Concurrency: Redis (Atomic sequence numbering, short-lived cache & latest GPS positions)
│   ├── Real-Time Feed: Spring WebSocket (STOMP) + Redis Pub/Sub for live location broadcasting
│   ├── Document Vault: Supabase Storage S3-compatible Buckets
│   ├── Event Engine: Transactional Outbox Pattern (`outbox_events`) + Internal Spring Application Events
│   ├── API Spec: Springdoc OpenAPI 3.0 (Contract generation for Web & Mobile)
│   └── Testing: JUnit 5, Mockito, Testcontainers
│
├── sms-web/ (React 19 • TypeScript • Vite) [APPLICATION A: MANAGEMENT SYSTEM WEB]
│   ├── Purpose: Business administration, operations, pricing, procurement, delivery trips, fleet & HR
│   ├── Framework: React 19 SPA with route-level code splitting (React.lazy)
│   ├── UI Framework: Material UI v9 (Deep Navy & Emerald Light/Dark themes)
│   ├── Data Grid: MUI X DataGrid with virtualized scrolling
│   ├── Workflow Engine: React Flow (@xyflow/react v12) visual DAG builder
│   ├── Fleet Monitoring: Real-time GPS Fleet Dashboard (Live Map, Employee Sidebar, Route Playback)
│   ├── Data Fetching: TanStack Query v5 with optimistic mutations
│   └── Testing: Vitest + React Testing Library (33/33 tests passing)
│
├── e-commerce-web/ (Next.js / React 19 • TypeScript) [APPLICATION B: E-COMMERCE WEBSITE]
│   ├── Purpose: Customer-facing online shopping portal, catalog discovery, cart & checkout, order tracking
│   ├── Architecture: Responsive Web Storefront (SSR / ISR / Client SPA)
│   ├── Integration: REST API consuming shared backend (`/api/v1/storefront/*`)
│   └── Capabilities: Catalog, Faceted Filters, Cart, Checkout, Online Payments, Multi-Fulfillment Preferences
│
├── e-commerce-mobile/ (Flutter / Native) [APPLICATION C: E-COMMERCE MOBILE APPLICATION]
│   ├── Purpose: Native mobile customer shopping experience (twin interface to e-commerce web)
│   ├── Integration: REST API consuming shared backend (`/api/v1/storefront/*`)
│   └── Capabilities: Identical commerce capabilities to web storefront, push notifications for order progress
│
└── workerapp-mobile/ (Flutter 3.44 • Dart 3.12) [APPLICATION D: WORKER MOBILE APPLICATION]
    ├── Purpose: Field-force mobile tool for credit surveys, delivery trips, inspections, pickups, and tasks
    ├── Architecture: Feature-first role-adaptive mobile client
    ├── State Management: Riverpod 3.x (Reactive asynchronous notifiers)
    ├── Networking: Dio client with JWT interceptors & live/mock fallback
    ├── Hardware Hooks: Camera viewfinder barcode/QR scanner, touch signature pad
    ├── Anti-Fraud: Pure-Dart Haversine 200m GPS geofencing & photo watermarking
    ├── Task Tracking: Shared task-bounded GPS tracking (Driver, Surveyor, Collector; Sales excluded)
    ├── Break Engine: Automated tracking cessation on scheduled breaks & OS background handling
    └── Offline Engine: Persistent action queue & encrypted local GPS buffering (SQLite/Drift target)
```

---

### 2.1 The Four Applications in the Integrated Ecosystem

The SMS ecosystem is composed of four front-end applications serving distinct user groups, all interacting with the unified backend:

1. **Application A: Management System (Web)**:
   - Primary desktop and tablet platform for back-office business administration, store operations, and managerial oversight.
   - Core Responsibilities:
     - Master product, catalog, SKU, and variant management.
     - Multi-store inventory, warehouse zones, and stock movements.
     - Branch-specific pricing matrices, promotional campaigns, and discount approvals.
     - Customer master directory, credit profile, and NIK deduplication.
     - Sales order processing, price negotiation approvals, and credit contracting.
     - Supplier management, purchase orders, receiving, and demand consolidation.
     - Payment management, cash custody verification, and installment schedules.
     - Multi-drop delivery trip planning, vehicle routing, and Surat Jalan generation.
     - Vehicle master registry, employee vehicle assignments, and fleet maintenance records.
     - Real-time GPS Fleet Monitoring Dashboard: live map tracking, employee category markers, active task status, and historical route playback.
     - Break schedule management, manual tracking pause auditing, and location access governance.
     - Credit survey task management and field inspection reviews.
     - Employee master, 10-role RBAC, and data-scope access control.
     - Non-calendar payroll, attendance geofence logs, and executive analytics.
2. **Application B: E-commerce Website**:
   - Customer-facing responsive online storefront accessible via modern desktop and mobile web browsers.
   - Core Responsibilities:
     - Product catalog browsing, real-time keyword search, and faceted filtering (by brand, category, price, specifications).
     - Product detail presentations: high-resolution images, technical specifications, variant selectors, and real-time availability states.
     - Shopping cart management, price quote calculation, and checkout workflows.
     - Customer self-service account registration, profile management, and multi-address management (residence, shipping address, access notes).
     - Secure online payment integration (QRIS, Virtual Accounts, Credit Cards) with real-time status updates.
     - Order history, milestone tracking, and shipment delivery progress.
     - Promotional voucher application, store credit redemption, and seasonal discounts.
     - Fulfillment preference selection: Own-driver delivery or Customer store pickup.
     - Multi-fulfillment grouping preferences (Complete fulfillment vs. Partial fulfillment).
3. **Application C: E-commerce Mobile Application**:
   - Customer-facing native mobile shopping experience providing essentially the same business capabilities as the E-commerce Website.
   - Core Architectural Relationship:
     - The E-commerce Website and Mobile Application are **two distinct interfaces to the exact same e-commerce platform**, not separate commerce systems.
     - They share identical API contracts (`/api/v1/storefront/*`), product catalogs, pricing rules, customer account databases, order state machines, and payment gateway infrastructure.
     - Native mobile enhancements include push notifications for order milestone updates (order confirmed, driver dispatched, pickup ready) and device biometric quick-login.
4. **Application D: Worker Mobile Application**:
   - Employee-facing operational field tool engineered for on-the-road and in-store staff (Surveyors, Drivers, Technicians, Store Assistants).
   - Core Responsibilities:
     - In-person customer credit survey execution (residence verification, income appraisal, proof photos with GPS watermarks).
     - Multi-drop delivery trip execution: turn-by-turn navigation, pre-dispatch loading check, recipient touch signatures, and COD cash collection.
     - Store customer pickup verification: scanning pickup QR codes, verifying recipient identity, and executing handover sign-off.
     - Product triage and technical inspections (warranty evaluations, repossessed unit grading).
     - Delivery destination location profiling: marking exact GPS coordinates, narrow street constraints, stair widths, and gate access notes.
     - Operational task management and daily field assignments.
     - Shared task-based GPS location tracking for Drivers (1 delivery trip = 1 tracking session spanning multi-drop DOs), Surveyors (survey task tracking and property coordinate capture), and Collectors (collection task tracking), with Salespersons explicitly excluded.
     - Strict automated pause during scheduled breaks, background tracking execution handling, local offline coordinate buffering, and transparent UI tracking state communication.

---

### 2.2 Unified Backend and Single Source of Truth

All four applications operate as client interfaces to a **single authoritative backend**. The system strictly avoids maintaining duplicate databases, siloed micro-backends for individual frontends, or disparate business rules.

#### Architectural Principles:

1. **One Shared Backend**: A unified Spring Boot modular monolith serves as the central engine for all business logic, data persistence, and inter-service coordination.
2. **One Authoritative Source of Business Data**: All transactional and master data resides in a single relational PostgreSQL database.
3. **Centralized Business Logic**: All validation, state transitions, calculation algorithms, and business rules are implemented exclusively in the backend.
4. **Consistent Business Rules**: Operations behave identically regardless of whether they are initiated from the Management System, E-commerce Website, E-commerce Mobile App, or Worker Mobile App.
5. **API-Based Communication**: All client applications interact with the backend exclusively via standardized REST APIs with zero direct database manipulation.
6. **Clearly Defined Domain Ownership**: Every piece of business data has a single backend module acting as its authoritative custodian.
7. **No Independent Frontend Data**: Frontend applications are presentation layers; they never maintain independent business data stores or shadow databases.

### 2.3 E-commerce Storefront Technology Stack & API Gateway Boundary Pattern (ADR-12)

The customer-facing e-commerce tier (Applications B and C) operates on a formally locked technology stack and edge API Gateway pattern:

1. **Application B — E-commerce Website (`ecommerce-web` • Next.js 15 / React 19 / TypeScript)**:
   - Built with Next.js 15 App Router (`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/StorefrontClientShell.tsx`) alongside Vite dual-bundler compatibility (`next.config.ts`).
   - Supports Search Engine Optimization (SEO), Server-Side Rendering (SSR), Incremental Static Regeneration (ISR), and critical above-the-fold `<link rel="preload" as="image" fetchpriority="high">` LCP optimization.
   - Routes all API requests through `/api/v1/storefront/:path*` edge rewrites with `X-Client-Platform: NEXTJS_WEB` and SSR-safe client storage guards.
2. **Application C — E-commerce Mobile App (`ecommerce-mobile` • Flutter 3.44 / Dart 3.12 / Riverpod 3)**:
   - Native mobile client sharing design tokens, currency formatters, image optimization presets, and architectural conventions with the Worker Mobile App (`workerapp-mobile`).
   - Communicates via Dio HTTP client (`api_client.dart`) stamped with `X-Client-Platform: FLUTTER_MOBILE` and `X-App-Client: SMS-Ecommerce-Flutter/3.44`.
3. **Storefront API Gateway Boundary & Security Isolation (`StorefrontApiGatewayFilter` & `StorefrontGatewayController`)**:
   - **Strict Zone Segregation**: Enforces architectural separation between `PUBLIC_STOREFRONT_GATEWAY` (`/api/v1/storefront/**`) and `INTERNAL_ADMIN_BACKOFFICE` (`/api/**`). Any storefront client attempting to call internal back-office APIs without an employee Bearer JWT is blocked with HTTP `403 Forbidden` (`GATEWAY_ZONE_VIOLATION`).
   - **Channel Attribution & Tracing**: Inspects `X-Client-Platform` or Dart `User-Agent` and stamps responses with `X-Storefront-Channel`, `X-API-Gateway-Zone`, and `X-Gateway-Request-Id`.
   - **Token-Bucket Rate Limiting**: Protects public catalog, cart, and checkout endpoints against scraping and DDoS bursts (`240 req/min` per session/IP, returning `X-RateLimit-Remaining` and HTTP `429 Too Many Requests`).
   - **ISR Edge Caching**: Attaches `Cache-Control: public, max-age=60, stale-while-revalidate=300` on `/categories` & `/banners` and `max-age=15, stale-while-revalidate=60` on `/products`.
   - **Gateway Topology Discovery (`GET /api/v1/storefront/gateway/status`)**: Exposes live gateway diagnostics, registered client stacks, and strict non-banking merchant ledger compliance metadata.

#### Authoritative Data Ownership Matrix:

| Business Data Domain                  | Responsible Backend Module   | Authoritative Responsibilities                                                                                                                                                                                   |
| ------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product Catalog, SKU, Variants**    | Product Management           | Master product definitions, specifications, BOM associations, category taxonomies, and variant SKUs.                                                                                                             |
| **Physical Inventory & Reservations** | Inventory Management         | Physical warehouse stock, serialized `StockUnit` tracking, movement ledgers, and logical order reservations.                                                                                                     |
| **Selling Prices & Promotions**       | Pricing Management           | Store-specific price matrices, promotional campaigns, discount thresholds, and installment terms.                                                                                                                |
| **Customer Records & Profiles**       | Customer Management          | Customer master records, NIK deduplication, address directories, and CRM interaction history.                                                                                                                    |
| **Sales Orders & Order Lifecycle**    | Sales Management             | Sales order creation, order state machines, fulfillment grouping, and order source attribution.                                                                                                                  |
| **Purchase Orders & Procurement**     | Purchasing Management        | Supplier directory, purchase orders, demand consolidation, and inbound receipt tracking.                                                                                                                         |
| **Payments & Cash Custody**           | Payment Management           | Digital payment gateway transactions, installment schedules, cash custody handovers, and reconciliation.                                                                                                         |
| **Delivery & Fulfillment**            | Delivery Management          | Fulfillment group orchestration, delivery trip planning, vehicle routing, and customer pickup tracking.                                                                                                          |
| **Fleet, Vehicles & GPS Tracking**    | Logistics & Fleet Management | Vehicle master registry, driver/vehicle assignments, tracking sessions, GPS coordinates ingestion, PostGIS spatial trajectories, break schedules, manual pause audit trail, and tracking interruption detection. |
| **Employee Records & Permissions**    | Identity & Access Management | Employee profiles, store assignments, role definitions (RBAC), and data-scope permissions.                                                                                                                       |
| **Surveys & Credit Appraisals**       | Survey Management            | Credit survey scheduling, surveyor dispatch, field appraisal dossiers, and decisive credit determinations.                                                                                                       |
| **Inspections & Warranty**            | Inspection Management        | Product return triage, cosmetic/functional grading, warranty claim tracking, and repair work orders.                                                                                                             |
| **Notifications & Outbox**            | Notification Management      | Push notification dispatch, SMS/WhatsApp delivery, and transactional outbox event publishing.                                                                                                                    |
| **Reporting & Executive Analytics**   | Reporting Management         | KPI aggregations, aging buckets, period comparisons, sales leaderboards, and financial exports.                                                                                                                  |

> [!IMPORTANT]
> **E-commerce Consumption Rule**: E-commerce frontends (Web and Mobile) consume product catalogs, inventory availability, pricing matrices, and order states directly from the shared backend via dedicated storefront endpoints (`/api/v1/storefront/*`). They **never maintain separate product catalogs or decoupled inventory databases**.

---

### 2.3 Centralized Business Logic & Unified Multi-Channel Sales Rules

A fundamental architectural and business rule governs the Store Management System: **All purchases must follow the same underlying business logic, regardless of their originating channel.**

The system supports sales through three distinct channels:

1. **Management System / Employee-Assisted Walk-in Purchases** (Showroom floor).
2. **Customer-Facing E-commerce Website**.
3. **Customer-Facing E-commerce Mobile Application**.

**These are different sales channels, not separate business systems.**

The exact same business rules, validation logic, state transitions, and operational workflows apply across all channels to:

- **Sales Order Creation and Validation**: Structural validity, line item specifications, customer address snapshots, contact validation.
- **Product Pricing and Discounts**: Channel-consistent store price matrices, promotional voucher qualification, supervisor price override workflow policies.
- **Payment, Deposits & Split Tenders**: Supported payment methods, initial deposit requirements, balance settlements, and payment record association.
- **Procurement Authorization**: Enforcing deposit-first procurement gating before supplier PO generation.
- **Fulfillment and Delivery Execution**: Multi-fulfillment grouping, stock reservation vs. procurement demand, route planning.
- **Customer Pickup**: Store branch readiness staging, QR code generation, and physical handover verification.
- **Order Cancellation**: Lifecycle-based cancellation eligibility (e.g. unfulfilled vs in-transit).
- **Refunds and Financial Adjustments**: Item-level or fulfillment-level non-destructive refund vouchers and credit notes.
- **Other Relevant Sales Operations**: Quotation expiry, return merchandise authorizations, warranty activations.

The system **must not implement separate business logic for online purchases and walk-in purchases**.

**Channel Attribution & Operational Analysis**:
The system records the originating sales channel on each sales order (`order_source`: `ONLINE_WEB`, `ONLINE_APP`, `EMPLOYEE`) for auditing, commission attribution, and operational analysis. However, **the channel must not cause the same business operation to behave differently** unless an explicitly approved, documented business rule requires it (e.g., immediate physical cashier cash drawer custody for walk-ins vs. automated payment gateway webhooks for online purchases).

Frontend applications are responsible strictly for user experience, data entry ergonomics, responsive rendering, and client-side form validation. Authoritative business decisions belong exclusively to the backend.

---

### 2.4 API and Integration Architecture

The interaction between all four frontend applications and the backend is strictly governed by structured API standards:

1. **Consistent API Contracts**:
   - RESTful endpoints documented via OpenAPI 3.0 / Swagger.
   - Strongly-typed DTOs shared via automated TypeScript client generation for web and Dart models for mobile.
2. **Centralized Authentication & Authorization**:
   - Supabase Auth OAuth2 JWT tokens validated by Spring Security.
   - Unified token parsing extracting `user_id`, `role`, and assigned `store_id`.
   - Administrative and employee endpoints protected by Role-Based Access Control (RBAC) and Data-Scope Authorization.
   - Customer storefront endpoints protected by Customer Session Guards.
3. **API Versioning Strategy**:
   - Predictable URI prefix versioning (`/api/v1/`) with backwards-compatibility guarantees to support staged mobile app releases.
4. **Consistent Error Handling**:
   - RFC 7807 Problem Details for HTTP APIs (standardized error code, localized error message, field-level validation error maps, timestamp, and trace ID).
5. **Secure Communication & Transport**:
   - Strict HTTPS with TLS 1.3 encryption across all public network traffic.
   - Payload size limits and rate limiting to prevent denial-of-service abuse.
6. **Robust Validation**:
   - Server-side Jakarta Bean Validation on all incoming requests regardless of prior client-side Zod/form checks.
7. **Comprehensive Audit Logging**:
   - Sensitive business mutations (price overrides, cash custody transfers, credit decisions, scrap write-offs) generate immutable entries in `SecurityAuditLog`.
8. **Internal Module Decoupling**:
   - Within the backend, bounded domains interact through clean Java service interfaces and Spring application events.
   - No frontend application ever executes direct database queries, stored procedures, or table mutations.

---

### 2.5 Cross-Application Event Propagation & Synchronization

A change initiated in any application must propagate reliably and consistently across all other relevant applications in the ecosystem.

#### Exemplary Cross-Application Event Workflows:

| Initiating Action                 | Triggering Application          | Propagation Mechanism                                 | Resulting State & Downstream Impact                                                                                             |
| --------------------------------- | ------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Product Price Updated**         | Management System (Admin)       | Transactional Outbox → Storefront Cache Invalidation  | E-commerce Website and Mobile App immediately display the updated price across catalog and cart views.                          |
| **Inbound Inventory Received**    | Management System (Warehouse)   | DB Commit → Outbox Event → Availability Recalculation | Commercial availability transitions from "Procurement Required" to "In Stock" across E-commerce channels.                       |
| **Customer Places Order**         | E-commerce Web / Mobile         | API Request → Sales Order Created → Outbox Event      | Management System displays the new Sales Order with source badge (`ONLINE_WEB` or `ONLINE_APP`); inventory reserved.            |
| **Supplier PO Received**          | Management System (Procurement) | Receiving Transaction → Outbox Event                  | Outstanding procurement requirements linked to customer sales orders are resolved; fulfillment groups ready for dispatch.       |
| **Delivery Assigned & Scheduled** | Management System (Logistics)   | Trip Confirmed → Outbox Event → Push Dispatch         | Worker Mobile App receives delivery stop in driver queue; E-commerce customer sees "Scheduled for Delivery".                    |
| **Delivery Completed**            | Worker Mobile App (Driver)      | Signature Upload → Delivery Confirmed → Outbox Event  | E-commerce Web and Mobile display "Delivered"; Management System releases driver and reconciles Surat Jalan.                    |
| **Eligible Order Cancelled**      | E-commerce Web / Mobile         | Customer Request → Backend Cancellation Rules         | Management System flags order as `CANCELLED`; reserved stock units released to available pool; procurement requirement revoked. |

#### Reliable Event Propagation Architecture:

- **Transactional Outbox Pattern (Backlog `[N.1]`)**:
  - The system rejects the naive assumption that a successful database transaction automatically guarantees successful message delivery to external systems, search indices, or mobile push services.
  - Every business event is written to an `outbox_events` table inside the **exact same ACID database transaction** as the underlying business mutation.
  - A reliable background polling dispatcher or Change Data Capture (CDC) worker reads unpublished outbox rows and dispatches them with guaranteed at-least-once delivery.
- **Idempotent Event Processing (Backlog `[N.2]`)**:
  - Downstream consumers track processed `event_id` keys in dedicated idempotency tables, ensuring that repeated event deliveries cause zero side-effects.
- **Retry & Dead-Letter Handling**:
  - Failed event dispatches undergo exponential backoff with randomized jitter. Unrecoverable failures route to a dead-letter queue for administrative inspection.
- **Audit Trails**:
  - Full traceability from initiating user action through event dispatch, consumer receipt, and final state transition.

---

### 2.6 Unified Sales Order and Multi-Fulfillment Architecture

The e-commerce platform is **not a disconnected, external sales silo**; it is a direct extension of the existing SMS sales management engine. All orders—whether placed online by a retail customer or created in a showroom by an employee—share the identical underlying sales order foundation.

#### 1. Unified Order Model with Order Source Tagging:

Every sales order records its initiating origin via an explicit `order_source` attribute:

- `ONLINE_WEB`: Order created through customer self-service on the E-commerce Website.
- `ONLINE_APP`: Order created through customer self-service on the E-commerce Mobile Application.
- `EMPLOYEE`: Order drafted and confirmed by store staff or salespersons via the Management System.

#### 2. Clear Conceptual Separation: Order vs. Fulfillment vs. Shipment:

The system strictly distinguishes three distinct operational concepts:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. SALES ORDER (What was purchased)                                                    │
│    SO-00001: 1x Samsung TV, 1x LG Refrigerator, 1x Custom Sofa (Customer: Budi)       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. FULFILLMENT GROUPS (How and when items are prepared)                                 │
│    ├── Fulfillment Group 1: Samsung TV [In Stock • Warehouse Central]                  │
│    └── Fulfillment Group 2: LG Refrigerator & Sofa [Procurement Required • Supplier]   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. SHIPMENT / DELIVERY (Physical movement and handover of goods)                       │
│    ├── Shipment 1 (Trip TR-101): Delivers Fulfillment Group 1 (Delivery Note SJ-001)   │
│    └── Shipment 2 (Trip TR-108): Delivers Fulfillment Group 2 (Delivery Note SJ-008)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Sales Order**: The commercial agreement and legal transaction specifying what products the customer purchased, agreed pricing, discounts, and customer details.
2. **Fulfillment (Fulfillment Group)**: The operational grouping defining how, from where, and when specific items within the order will be prepared and fulfilled.
3. **Shipment / Delivery**: The physical movement, transport trip, or customer pickup handover of the fulfilled items.

#### 3. Single Sales Order Invariant:

> [!CAUTION]
> **No Artificial Order Splitting**: The system must **NEVER create separate sales orders merely because an order contains multiple fulfillment groups or staggered shipments**. Doing so corrupts commercial invoices, breaks payment tracking, duplicates customer contracts, and prevents accurate financial reporting. One customer checkout produces exactly one Sales Order containing one or more Fulfillment Groups.

#### 4. Dual-Axis Fulfillment Decisions Clarification (Completeness vs. Method):

The system strictly distinguishes between two independent, orthogonal fulfillment decisions:

- **Decision A — Fulfillment Completeness (Staging & Timing)**:
  - **Complete Fulfillment**: The customer elects to have the entire order fulfilled together once all required products are ready and available.
  - **Partial Fulfillment**: The customer elects to allow immediately available products to be fulfilled while other backordered or procurement-required products are still pending.
  - **Decision Authority**: **The customer decides whether complete or partial fulfillment is acceptable** during checkout (or sales consultation for walk-in purchases).

- **Decision B — Fulfillment Method (Handover Channel)**:
  - **Home Delivery**: Physical transport to the customer's dwelling or business address (initial scope: own-driver delivery fleet).
  - **Customer Pickup**: Direct collection by the customer at an eligible store branch.

- **Orthogonality & Combined Arrangements**:
  - Decision A and Decision B are completely independent. A single sales order may contain multiple fulfillment groups combining both methods. For example:
    - _Fulfillment Group 1_: In-stock microwave picked up by the customer at Store Branch A today.
    - _Fulfillment Group 2_: Large refrigerator requiring supplier procurement, delivered to the customer's residence via own-driver fleet next week.
- **Employee Operational Adjustment Governance**:
  - Store staff and logistics dispatchers may propose operational adjustments to fulfillment arrangements (e.g., suggesting customer pickup for an urgent item, or re-routing delivery stops).
  - However, **employees must never silently override the customer's approved fulfillment arrangement**.
  - Any modification requires explicit customer consent, and the system must retain a complete change history and audit trail of who requested the change, when it was approved, and the operational rationale.
- **Initial Delivery Scope**:
  - The agreed initial delivery scope covers **Own-driver delivery** and **Customer store pickup**.
  - Third-party courier integration (e.g., JNE, SiCepat, Lalamove) is a possible future extension, not an initial requirement.

#### 5. Payment and Sales Order Relationship:

Payment is modeled as a **dedicated, separate business module** rather than being embedded directly into the sales order implementation:

- **Order-Level Association**: Payments are associated with the overall sales order, establishing a clear commercial ledger.
- **Multi-Transaction Support**: A sales order reliably supports:
  - Multiple payment transactions across its lifecycle.
  - An initial deposit (down payment or prepayment).
  - Subsequent balance payments.
  - Payments made through different supported methods, where permitted (split tenders: e.g., partial cash + partial bank transfer).
  - Item-level or fulfillment-level refunds and payment adjustments.
- **Reliable Financial Status**: The payment module maintains complete transaction history, allowing the financial status of an order (`UNPAID`, `PARTIALLY_PAID`, `DEPOSIT_RECEIVED`, `FULLY_PAID`, `REFUNDED`) to be determined reliably without mutating finalized order records.
- **Financial Handling for Split Fulfillment**:
  - The sales order remains the overall commercial and legal transaction.
  - Individual fulfillment groups may have their own operational and financial requirements (e.g., dispatch gating based on paid balance or installment approval).
  - Order cancellations and refunds are handled at the appropriate line-item or fulfillment group level when necessary, generating balanced compensating credit vouchers without invalidating delivered portions of the parent order.
  - **Invariant**: The system must **never create separate sales orders merely because an order has multiple payments or fulfillment groups**.

---

### 2.7 Product Availability, Procurement Integration & Deposit-First Authorization

Products that are not physically present in store or warehouse inventory may still be made purchasable across all channels if the business permits on-demand supplier procurement.

#### Physical Stock vs. Commercial Sales Availability:

The system formally decouples physical inventory counts from commercial sales availability:

- **Physical Inventory**: Exact counts of serialized units currently sitting in warehouses or showroom floors (`StockUnit` with status `AVAILABLE`).
- **Commercial Sales Availability**: Calculated status governing customer purchasing rules on e-commerce channels.

#### The Four Commercial Availability States:

1. `IN_STOCK`: Product units are physically present in the warehouse/store. Ready for immediate packing and dispatch.
2. `AVAILABLE_PROCUREMENT_REQUIRED`: Physical inventory is zero, but the product is designated as procurable from suppliers. Customers may place orders with disclosed lead times.
3. `PREORDER`: Advance purchase of upcoming product models before official general distributor release.
4. `UNAVAILABLE`: Physical inventory is zero and procurement is not permitted. Customers cannot add the item to their cart.

#### Procurement-Required Operational Protocol:

- **Customer Transparency**:
  - The E-commerce Website, Mobile App, and showroom sales dialogs explicitly badge products as "Available (Procurement Required)" with estimated dispatch lead times (e.g., "Ships within 5–7 business days").
  - Shopping cart, checkout, and sales draft summaries reiterate procurement lead times before payment commitment.
- **Procurement Requirement Recording**:
  - When an order containing procurement-required items is confirmed, the backend automatically logs an outstanding `ProcurementRequirement` linked to the sales order item.
- **Demand Consolidation (No 1:1 Auto-PO)**:
  - The system **does NOT automatically generate a separate supplier Purchase Order for every customer order**. Automatic 1:1 PO generation creates unmanageable supplier logistics and prohibitive freight overheads.
  - Instead, the Management System provides purchasing staff with a **Demand Consolidation Work Center**, allowing procurement officers to aggregate requirements from dozens of online and showroom orders into optimized bulk Purchase Orders to distributors.
- **Inbound Receiving Linkage**:
  - When goods are physically received and serialized by warehouse staff (Group 7), the inventory module matches ingested serials to pending procurement requirements, transitioning the associated fulfillment group to ready-for-dispatch.

#### Deposit-First Procurement Authorization:

> [!IMPORTANT]
> **Procurement Payment Gating Rule**: A supplier purchase order for products required by customer sales orders **cannot proceed until the required customer deposit has been received and verified**.

- **Configurable Deposit Requirements**:
  The system supports configurable deposit rules managed by store administrators, including:
  1. _Full Payment Before Procurement_: 100% payment required prior to supplier PO creation (standard for custom non-standard orders or cash customers).
  2. _Required Deposit Percentage or Fixed Amount_: A mandatory upfront deposit (e.g., 20%, 30%, 50%, or a fixed Rupiah amount) required to lock the order and authorize procurement.
  3. _Other Configurable Deposit Arrangements_: Tiered deposit rules based on customer loyalty tiers, institutional purchasing contracts, or promotional campaign rules.
- **Policy Refinement & Operational Invariant**:
  - While specific deposit configuration percentages and detailed payment policies can be refined later by management, **the fundamental architectural invariant is that the procurement engine must strictly respect the payment authorization requirement**.
  - The Demand Consolidation Work Center will not allow procurement staff to release or commit a supplier PO line linked to a customer sales order unless the required deposit has been confirmed in the payment ledger.

---

### 2.8 Configurable Payment Methods & Fulfillment Architecture

The SMS platform establishes a comprehensive, configurable payment infrastructure alongside flexible physical fulfillment methods:

#### 2.8.1 Configurable Payment Methods (Scope & Administration)

The system supports the following **9 distinct payment methods**:

1. **Bank Transfer / Virtual Account**: Automated virtual accounts (BCA, Mandiri, BRI, BNI) with real-time payment reconciliation.
2. **QRIS**: Static showroom QR codes or dynamic e-commerce checkout QR codes compatible with all Indonesian banks and e-wallets.
3. **E-Wallet**: Direct digital wallet checkout (GoPay, OVO, ShopeePay, DANA).
4. **Credit and Debit Cards**: Visa/Mastercard processing via certified online payment gateways or physical showroom EDC terminals.
5. **Cash at Store**: Over-the-counter physical cash tender at showroom checkout, strictly bound to cashier cash drawer custody handovers.
6. **Bank Transfer Directly to the Store**: Direct manual transfer to company bank accounts, verified by finance staff.
7. **Cash on Delivery (COD)**: Cash collected physically by our own delivery drivers at the customer's delivery destination.
8. **In-House Customer Credit**: Store credit financing over 3, 6, 10, 12, or 15 months governed by field survey credit appraisal and manager approval.
9. **Third-Party Installment Financing**: External consumer financing platforms (e.g., Kredivo, Akulaku, Home Credit), subject to provider API integration.

> [!NOTE]
> **Intended Scope & Administrative Configuration**:
>
> - **All these 9 payment methods are part of the intended system scope.**
> - Payment methods must be **configurable through the Management System**. Authorized administrators must be able to enable or disable supported payment methods per store branch or sales channel without requiring application code changes or server redeployments.

**Core Payment & Credit Rules**:

1. **No Automatic Credit on Registration**: Customer credit is **never automatically granted** merely because a customer has registered an account.
2. **Formal In-House Credit Management**: In-house credit requires an appropriate approval process, credit assessment (including mobile surveyor field verification where applicable), and active credit facility management. Credit facilities must strictly account for customer credit limits, outstanding balances, and repayment track records.
3. **Third-Party Financing Integration**: Third-party installment financing is supported as an independent payment method, subject to external provider integration and callback reconciliation.
4. **Eligibility Gating & Operational Workflows**: Payment methods carry specific eligibility conditions (e.g., COD may be restricted by geographic radius or maximum transaction amount; in-house credit requires approved credit limits; cash at store is restricted to walk-in showroom purchases or store pickups). The system must never assume every payment method is available to every customer or transaction.

#### 2.8.2 Fulfillment Execution Methods (Decision B Scope)

The initial supported fulfillment methods are:

- **Method A: Own-Driver Delivery (Home Delivery)**:
  - Customer provides delivery destination address and access constraints.
  - Delivery fees calculated dynamically based on store-to-destination distance.
  - Logistics dispatchers group fulfillment groups into multi-drop `DeliveryTrip` routes in the Management System.
  - Assigned drivers execute tasks via the Worker Mobile App: manifest picking check, vehicle loading, GPS tracking, recipient touch signature, photo proof, and Surat Jalan generation.
- **Method B: Customer Store Pickup**:
  - Customer selects an eligible branch store from the store directory.
  - Store warehouse staff stage reserved items and mark the fulfillment group as `READY_FOR_PICKUP`.
  - Customer receives automated notification with a unique Pickup Verification Code and QR barcode.
  - Store staff verify customer ID and scan QR code via Worker Mobile App or Management System web portal, executing digital handover sign-off.

**Extensibility for Third-Party Couriers**:
Third-party courier integration (e.g., JNE, SiCepat, Lalamove) is a recognized possible future extension, not an initial requirement. The fulfillment engine models fulfillment providers through a polymorphic interface (`FulfillmentProvider`), preventing courier-specific logic from being hardcoded into sales order entities.

---

### 2.9 Backend Architecture Direction

To maximize development velocity, maintain ACID data guarantees, and avoid the operational complexity of distributed networks, the SMS backend will **continue as a Modular Monolith** rather than prematurely decomposing into microservices.

#### Principles of the Modular Monolith:

- **Single Deployable Unit**: The entire backend compiles and deploys as a single Spring Boot executable artifact.
- **Strict Domain Boundaries**: Code is partitioned into bounded domain modules with well-defined package boundaries and visibility rules:
  1. `identity`: Employee records, customer auth, RBAC permissions, and data-scope security.
  2. `product`: Product catalog, categories, specifications, BOM components, and SKUs.
  3. `inventory`: Physical `StockUnit` tracking, serialized units, locations, and immutable movement ledger.
  4. `pricing`: Multi-store cash/installment price matrices, promotional campaigns, and discount rules.
  5. `customer`: Customer master directory, NIK deduplication, addresses, and CRM 360 profile.
  6. `sales`: Unified sales orders, fulfillment groups, discount negotiations, and contracts.
  7. `procurement`: Supplier directory, purchase orders, receiving auto-ingestion, and demand consolidation.
  8. `payment`: Digital gateway webhooks, cash custody ledgers, installment schedules, and receipts.
  9. `delivery`: Fulfillment orchestration, delivery trips, route maps, and Surat Jalan notes.
  10. `survey`: Credit survey scheduling, field appraisals, residence photo dossiers, and determinations.
  11. `inspection`: Warranty repair tickets, repossessed unit grading, triage, and scrap write-offs.
  12. `notification`: Outbox dispatch, mobile push notifications, and customer messaging.
  13. `reporting`: KPI dashboards, period comparisons, receivables aging, and Excel multi-sheet exports.
  14. `fleet`: Vehicle registry, driver-vehicle assignments, tracking sessions, GPS point ingestion, break schedules, route playback, and tracking anomaly detection.
- **Reuse and Extension**: New capabilities leverage and extend existing mature modules rather than creating duplicative parallel codebases.

---

### 2.10 Cross-Application Testing Requirements

Integration across four applications and a unified backend cannot be verified through isolated unit tests alone. Quality assurance must evaluate features across the entire application lifecycle.

#### Mandatory Test Suites:

1. **API Integration Tests**: Verify request/response schemas, Bean Validation rules, and OpenAPI contracts for both back-office and customer storefront endpoints.
2. **Backend Domain Integration Tests**: Test cross-module service interactions (e.g., Sales Order confirming and triggering Inventory reservation and Finance custody) using Spring Boot test slices and Testcontainers PostgreSQL.
3. **Cross-Application Workflow Tests**: Automated multi-client test scenarios validating end-to-end user journeys spanning Management Web, E-commerce Web, and Worker Mobile App.
4. **Authorization & Security Tests**: Verify RBAC role boundaries, data-scope restrictions (Store, Territory, Ownership), and customer session isolation.
5. **Event Propagation & Outbox Tests**: Test transactional outbox publishing, event polling dispatch, and idempotent consumer execution under failure simulation.
6. **Order Lifecycle State Machine Tests**: Verify valid state transitions and invalid state rejections from draft through fulfillment, partial delivery, and cancellation.
7. **Concurrency & Inventory Consistency Tests**: Multi-threaded tests verifying that concurrent orders cannot double-reserve the same serialized `StockUnit`.
8. **Payment Callback Idempotency Tests**: Simulate duplicate, delayed, and out-of-order payment gateway webhook notifications.

#### Canonical End-to-End Test Scenario:

The benchmark integration test scenario spanning all four applications:

```
[E-commerce Customer Web/App]
  1. Customer browses catalog, selects in-stock item + procurement-required item.
  2. Selects "Partial Fulfillment" and "Own-Driver Delivery".
  3. Completes online payment via simulated payment gateway.
        ↓ (API POST /api/v1/storefront/orders/checkout)
[Shared Backend]
  4. Single Sales Order created (`order_source = ONLINE_WEB`), 2 fulfillment groups established.
  5. In-stock item unit reserved; procurement requirement recorded for backordered item.
  6. Payment confirmed via webhook, customer receipt issued.
  7. Outbox events dispatched.
        ↓ (Outbox Dispatch)
[Management System Web]
  8. Sales Order appears in operations dashboard.
  9. Purchasing officer consolidates procurement requirement into supplier Purchase Order.
 10. Inbound goods received at warehouse; serialized unit auto-ingested and linked to fulfillment group 2.
 11. Logistics dispatcher schedules Delivery Trip for Fulfillment Group 1.
        ↓ (Trip Dispatched)
[Worker Mobile Application]
 12. Driver views assigned trip, verifies loaded items with barcode scanner.
 13. Driver executes delivery at customer address, collects touch signature and photo proof.
        ↓ (Mobile Sync)
[E-commerce Customer Web/App & Management System]
 14. Customer sees Fulfillment Group 1 "Delivered"; Group 2 "Preparing".
 15. Surat Jalan marked complete in Management System; sales order records partial fulfillment.
```

---

### 2.11 Future Feature Design Principle

To ensure that the four applications remain harmoniously integrated as the platform expands, all future feature proposals, RFCs, and engineering implementations must adhere to the **7-Question Mandatory Evaluation Framework**:

> [!IMPORTANT]
> **The 7-Question Integration Standard**:
> Whenever a new feature is proposed, designed, or implemented, the engineering team must formally answer:
>
> 1. **Initiating Application**: Which application initiates the action (Management System Web, E-commerce Website, E-commerce Mobile App, or Worker Mobile App)?
> 2. **Authoritative Module**: Which backend domain module owns the authoritative business logic, validation, and state machine?
> 3. **Data Impact**: What database tables, ledger entries, or document records are created, mutated, or logically locked?
> 4. **Downstream Applications**: Which other applications consume, display, or react to the resulting information?
> 5. **Events & Notifications**: What outbox events, push notifications, customer messages, or UI cache invalidations must be dispatched?
> 6. **Security & Permissions**: What RBAC roles, data scopes, or customer authentication guards are required?
> 7. **Consistency & Idempotency**: How is cross-application consistency guaranteed under network partition, client retry, or concurrent execution?

Integration must be designed into every feature from inception, not patched on as an operational afterthought.

---

### 2.12 Architectural Recommendations & Technical Standards

#### A. Reliability & Transaction Integrity

- **Transactional Outbox Pattern (Backlog `[N.1]`)**:
  - Operational business transactions (Sales Order confirmation, purchase receiving, delivery handover, cash custody verification) commit application state changes alongside outbound event records into an `outbox_events` table within a single ACID database transaction.
  - A dedicated Change Data Capture (CDC) worker or reliable background polling dispatcher reads unpublished events from `outbox_events` and dispatches notifications, mobile push messages, and external integration webhooks asynchronously.
  - _Standard_: Guarantees at-least-once message delivery without distributed two-phase commit (2PC) bottlenecks. Event consumers must be idempotent.
- **Idempotency Standards (Backlog `[N.2]`)**:
  - Critical mutation endpoints accept an `Idempotency-Key` HTTP header (UUIDv4).
  - _Role of Redis vs Database_: Redis is used for fast, short-lived coordination and rapid request deduplication (e.g., preventing duplicate submissions from double-clicking within a short time window). However, **a Redis key alone does NOT guarantee durable, transactional exactly-once business processing**.
  - _Durable Requirement_: Financial and inventory-critical mutations (down payments, cash collections, cashier custody handovers, delivery confirmations, stock movements) must commit an idempotency record into a durable database table (`idempotency_keys`) inside the same ACID database transaction as the business mutation itself. Subsequent retries with the same key return the stored result without re-executing business side-effects.
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
  1. _Local Persistence_: Secure local disk storage of active user drafts, assigned task rosters, and read-only catalog caches.
  2. _Queued Synchronization_: Reliable capture of outbound user actions during network absence into a persistent local outbox queue.
  3. _Retry Handling_: Network state monitoring, exponential backoff, jitter, and automatic replay upon connectivity restoration.
  4. _Conflict Resolution_: Deterministic reconciliation when server-side state has diverged while the client was offline.
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
- **OpenAPI & Code Generation**: Springdoc OpenAPI 3.0 generating OpenAPI schema used to auto-generate TypeScript API client types for `sms-web` and Dart models for `workerapp-mobile`.
- **Contract Testing**: Consumer-driven contract tests to verify that mobile app versions remain backwards-compatible during rolling backend deployments.

#### E. Security, Privacy & Indonesian Regulatory Governance (Backlog `[N.4]`, `[N.5]`, `[N.7]`)

- **Separation of Security Concerns**:
  - _Sensitive Data Protection_: Field-level encryption at rest (AES-256) for Indonesian National ID (`NIK`) and bank accounts in PostgreSQL; TLS 1.3 in transit.
  - _Access Control_: Role-Based Access Control (RBAC) governing 10 baseline roles combined with query-level Data-Scope Authorization.
  - _Auditability_: Immutable logging of business exceptions and sensitive operational actions in `SecurityAuditLog`.
  - _Data Retention & Lifecycle_: Automated data archival and right-to-erasure workflows upon contract completion and statutory retention expiration.
  - _Regulatory Compliance_: Adherence to statutory data protection frameworks.
- **Statutory Validation Caveat**:
  - References in this document to Indonesian legal statutes (e.g., UU No. 27 Tahun 2022 / UU PDP, UU Dokumen Perusahaan No. 8/1997, UU ITE No. 11/2008, PP 35/2021) and specific retention durations (such as 10-year financial record retention) **represent working architectural assumptions and design baselines**.
  - **These assumptions must be formally validated by qualified Indonesian legal and tax counsel prior to production sign-off.** Unverified legal interpretations must not be treated as confirmed statutory mandates.
- **Role-Based PII Masking**:
  - Mask NIK (e.g., `3171************`) on standard web/mobile views.
  - Revealing full digits requires explicit `CUSTOMER_PII_VIEW` authorization and generates a persistent audit log entry.
- **Data-Scope Authorization Hierarchy (Backlog `[N.5]`)**:
  - Queries enforce four hierarchical boundaries:
    - _Store Scope_: User can access data only for their assigned store branch.
    - _Department Scope_: Access constrained to specific functional domains.
    - _Territory Scope_: Surveyors and collectors access only postal codes / sub-districts within their assigned zone.
    - _Ownership Scope_: Salespersons and collectors view only records where they are the assigned agent.
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

#### I. Logistics, PostGIS Spatial Engine & Task-Bounded Location Tracking Standards (Backlog `[Q.1–Q.11]`)

- **Shared GPS Infrastructure Across Field Roles**: A single shared GPS tracking engine services Drivers, Surveyors, and Collectors, eliminating role-siloed tracking code. Salespersons are explicitly excluded from GPS tracking.
- **Task-Bounded Lifecycle Principle**: GPS tracking is activated strictly upon manual task/trip initiation in the Flutter mobile application and ceases immediately upon task/trip completion. All-day continuous employee tracking is strictly prohibited.
- **Strict Break Enforcement & Zero-Coordinate Capture**: Configured break schedules (e.g., lunch breaks) trigger an automated tracking pause. No GPS coordinates may be collected, transmitted, or stored during scheduled breaks. Tracking resumes automatically when the break ends if the operational session remains active.
- **PostGIS Spatial Storage & Indexing**: PostgreSQL with the PostGIS extension stores GPS trajectory points using `GEOMETRY(Point, 4326)` with spatial GiST indexes, enabling sub-millisecond proximity queries, spatial distance computations, and historical route polyline reconstruction via `ST_MakeLine`.
- **Redis Caching & Real-Time WebSocket Streaming**: The latest known position of each actively tracked employee is maintained in high-speed Redis key-value structures (`fleet:employee:{id}`) and broadcast to the Management Web SPA via Spring WebSocket (STOMP), eliminating polling overhead.
- **Mobile Background Execution & Resilient Offline Buffering**: The mobile app runs a persistent foreground service with a visible ongoing notification. When connectivity is interrupted, GPS records are buffered locally with hardware timestamps and synchronized upon network restoration.
- **Indonesian UU PDP Data Governance**: Location history is classified as sensitive personal data under UU No. 27/2022 (UU PDP). Granular permissions restrict access, every managerial view generates an immutable audit record, and historical tracking tables are partitioned monthly with a defined retention and archival lifecycle.

---

## 3. Core Business Invariants & Guiding Principles

1. **Historical Immutability**:
   - Finalized financial transactions, customer addresses at order time, credit amortization schedules, price negotiation notes, approval audit logs, and payroll snapshots are **never mutated or hard-deleted**.
   - Configuration adjustments only apply to future records.
2. **Why vs. What Separation**:
   - _Business Documents_ (`sales_order`, `purchase_order`, `delivery_order`, `stock_return`) record **why** an operational event occurred.
   - _Stock Movement Ledger_ (`stock_movement`) is the immutable ledger recording **what physically changed** (timestamp, serialized unit, from-location, to-location, actor).
3. **Reservation vs. Allocation vs. Ledger Transition**:
   - _Reservation_: Logical hold against inventory availability when a sales order is submitted or released. Physical location is untouched.
   - _Allocation_: Specific assignment of a serialized `StockUnit` identifier to a line item.
   - _Movement_: Physical status/location transition executed only upon dispatch, receiving, return, or scrap.
4. **Human Judgment in Decision Support**:
   - Automated algorithms score and flag data, but **never** unilaterally execute credit decisions, repossession triggers, price overrides, scrap write-offs, or return approvals.
5. **Company-Wide Customer Identity**:
   - Customer identity is deduplicated company-wide by Indonesian National ID (`NIK`). Addresses are historical snapshots on transaction records.
6. **Document Numbering Architecture (Redis vs Database)**:
   - Sequential document numbers formatted as `{TYPE}/{STORE_CODE}/{MM}/{YYYY}/{SEQ:04d}`.
   - _Role of Redis_: Redis provides high-concurrency atomic increment counters (`INCR`) with date-keyed prefixes, enabling sub-millisecond sequence generation under heavy load.
   - _Technical Limitation of Volatile Redis Counters_: Redis counters with TTL or in-memory volatile configurations are **not by themselves a durable solution for financial document numbering**. Server restarts, cluster failovers, or eviction can compromise counter continuity.
   - _PostgreSQL Sequence Nuance_: PostgreSQL sequences (`nextval`) are also **not inherently gapless**; transaction rollbacks or server crashes leave unconsumed sequence gaps.
   - _Distinction_:
     - _Ordinary Unique Numbering_: Gaps are operationally acceptable (e.g., draft sales orders, delivery trips, internal repair tickets). Fast Redis counters or PostgreSQL sequences are fully suitable.
     - _Legally / Operationally Gap-Sensitive Numbering_: Statutory tax invoices (_Faktur Pajak_) or official financial vouchers where tax audits prohibit missing sequence numbers. These require a durable database-backed sequence allocator running inside an ACID commit or a post-commit sequence assignment service with a gap-audit reconciliation ledger. (See ADR-05).
7. **Signatures & Legal Standing**:
   - Digital canvas signature pad captures recipient touch signatures for operational receipt proof (Surat Jalan delivery notes).
   - Formal statutory contracts (multi-year credit agreements) require integration with Kominfo-certified Digital Certificate Authorities (e.g., PrivyID / Peruri) with e-Meterai for full evidentiary legal validity under Indonesian ITE Law. (See ADR-07).
8. **Anti-Fraud & Field GPS Verification**:
   - GPS coordinate logging with Haversine distance verification provides proximity validation.
   - Must be augmented with mock-location / spoofing detection, cell-tower triangulation, and photo timestamps to prevent attendance or delivery falsification.
9. **Single Backend Authority & Zero Frontend Business Logic**:
   - Business calculations, price validation, inventory allocation, and order state machines reside solely within backend domain services.
   - Frontend applications (Management Web, E-commerce Web, E-commerce Mobile, Worker Mobile) are strictly presentation, data capture, and user ergonomics layers.
   - No frontend application ever makes authoritative business decisions, bypasses validation rules, or interacts directly with the database.
10. **Unified Sales Order & Multi-Fulfillment Invariant (1 SO : N Fulfillment Groups)**:

- A single customer purchase transaction yields exactly one immutable `SalesOrder` record regardless of channel (`ONLINE_WEB`, `ONLINE_APP`, `EMPLOYEE`).
- One sales order may be split into multiple `FulfillmentGroup` records (e.g., in-stock delivery vs. procurement-required delivery vs. store pickup).
- The system strictly prohibits splitting a single checkout into multiple independent sales orders merely because items have different delivery schedules or fulfillment methods.

11. **Physical Inventory Decoupled from Commercial Sales Availability**:

- Physical serialized stock units (`StockUnit` rows with status `AVAILABLE`) represent ground-truth warehouse/store inventory.
- Commercial sales availability (`IN_STOCK`, `AVAILABLE_PROCUREMENT_REQUIRED`, `PREORDER`, `UNAVAILABLE`) represents customer purchasing rules.
- Items not physically in stock can be sold if procurement rules permit, generating a linked procurement requirement rather than failing order creation.

12. **Reliable Event Synchronization via Transactional Outbox**:

- Committing a database mutation does not by itself guarantee delivery to other modules or applications.
- All cross-application events (price changes, order creation, delivery assignments, cancellations) must be committed to the `outbox_events` table inside the same transaction as the state change, ensuring at-least-once delivery and idempotent consumption.

13. **Flexible Fulfillment Provider Modeling**:

- Fulfillment methods (Own-driver delivery, Customer store pickup, and future 3rd-party logistics) are modeled via extensible provider abstractions.
- Fulfillment execution details must never be hardcoded into core sales order accounting or receivable entities.

14. **System-Wide 4-Application Feature Evaluation Standard**:

- Every architectural proposal, feature design, and implementation must evaluate its lifecycle and impact across all four applications and the shared backend using the 7-Question Integration Standard.

15. **Task-Bounded GPS Tracking, Strict Break Pauses & Employee Privacy Invariant**:

- GPS tracking occurs **strictly and exclusively while an employee is actively executing an authorized operational task or delivery trip**. Continuous all-day employee surveillance is prohibited by architectural design.
- **Salespersons are explicitly excluded from GPS tracking.**
- Tracking sessions are bound to operations: 1 delivery trip = 1 tracking session (covering multi-drop delivery orders); 1 survey = 1 tracking session; 1 collection visit = 1 tracking session.
- GPS tracking **automatically ceases during configured scheduled break windows**. No location coordinates may be collected or stored during breaks; tracking auto-resumes when the break concludes if the operational task remains active.
- Intentional manual pauses, scheduled breaks, GPS hardware loss, network disconnection, and task completion are strictly distinct lifecycle events and must never be conflated.
- Primary tracking relies on the employee's mobile phone GPS; independent in-vehicle hardware tracking is deferred to future fleet telematics phases.

16. **Unified Multi-Channel Sales Logic Invariant**:

- All purchases follow identical underlying business logic, price calculations, promotion validations, deposit rules, and fulfillment workflows regardless of originating sales channel (Management System walk-in, E-commerce Website, E-commerce Mobile App).
- Originating channel is recorded strictly for reporting, auditing, and operational analysis, never to bifurcate core business logic.

17. **Configurable Payment Methods & Credit Facility Governance Invariant**:

- All 9 supported payment methods (Bank transfer/VA, QRIS, E-wallet, Credit/Debit cards, Cash at store, Direct store bank transfer, Driver COD, In-house customer credit, Third-party installment financing) are part of platform scope and configurable in the Management System without code changes.
- Customer registration must never automatically grant customer credit. In-house credit strictly requires an approval workflow and credit limit management.

18. **Decoupled Payment and Sales Order Relationship (1 SO : N Payments)**:

- Payment is a separate business module associated with the overall sales order.
- A sales order supports multiple payments, initial deposits, balance settlements, split tender methods, and partial refunds without splitting the sales order.

19. **Deposit-First Procurement Authorization Invariant**:

- Supplier purchase orders for customer-demanded products cannot proceed until the required customer deposit (full payment, percentage, or fixed threshold) has been received and confirmed.

20. **Dual-Axis Fulfillment Orthogonality Invariant**:

- Decision A (Fulfillment completeness: complete vs. partial, decided by customer) and Decision B (Fulfillment method: home delivery via own-driver vs. customer store pickup) are strictly independent orthogonal axes.
- Fulfillment groups execute independently without splitting the sales order. Employee modifications strictly require customer consent and audit logging.

21. **Project Documentation & AI Collaboration Rules**:

- Use the Caveman skill for assistant responses; keep technical meaning intact.
- Update this document when completing project tasks; add backlog items when useful.
- For feature work, restate relevant requirements, identify affected domains and invariants, flag unresolved decisions, and include authorization, validation, audit/history, transaction, failure/retry, edge-case, and acceptance-test considerations.
- Never invent unresolved business rules or change semantics while refactoring. The business is a multi-store retailer selling electronics and furniture.

---

### 3.1 Consolidated Business Operating Baseline

The following durable requirements were retained from the consolidated business README and revised requirements specification. If an older source statement conflicts with a later implementation decision or the resolved conflict register, the later decision controls.

#### Organization and record lifecycle

- One company operates multiple stores. Store staff are store-scoped; authorized management can view multiple stores. A separate multi-organization layer is not currently required.
- Customers are company-wide; there is no separate Prospect entity or permanent salesperson ownership. Search/link existing customers before creation. NIK is unique when available/required; customer records are not physically deleted. Customer and order delivery addresses retain transaction-time snapshots.
- Employees have permanent identifiers independent of role/store. Person, employment, and login-account records are distinct; an employee may lack an application login. Employees are deactivated, not deleted. Freelance salespeople are commission-only external workers and do not use the Worker App under the current baseline.
- Historical transactions retain event-time attribution (store, employee/role, salesperson, approver, price, address, and other relevant context); current assignments must not rewrite past records.

#### Inventory, fulfillment, and after-sales

- Product, sellable variant, individual physical Stock Unit, and loose Component Stock are distinct concepts. Every physical unit remains searchable through sale, loss, repair, recovery, replacement, or disposal; manufacturer serial/IMEI is separate from the internal Stock Unit ID.
- Reservation, exact-unit allocation, delivery, and physical Stock Movement are separate. Receiving enters inventory only after inspection and acceptance. A discrepancy prompts investigation and authorized resolution; there is no silent stock-quantity overwrite.
- Delivery is complete only after the customer receives, inspects, and accepts the correct product and signs confirmation. Applicable setup/installation and basic-function checks are part of delivery; unrelated installation services are not. Delivery problems before acceptance remain delivery issues, and delivery-caused damage is the store's responsibility. Failed attempts are recorded and rescheduled.
- Store coordinates warranty claims, while manufacturer/distributor determines technical coverage. Repair retains the Stock Unit ID; a physically different replacement receives a new ID linked to the replaced unit. Change-of-mind return is not standard; pre-acceptance rejection, warranty, repossession, and management-approved exceptions remain distinct flows.
- Repossession is a manager decision after collection/contact efforts, never an automatic consequence of elapsed days. Successful recovery retains the unit's identity and history, forgives remaining customer debt without refunding prior payments, and keeps the unit unavailable until inspection/disposition. No automatic resale, depreciation, or repair-viability formula is assumed.

#### Money, expenses, and compensation

- Sales value, actual cash received, customer receivables, supplier payables, expenses, and custody are reported separately. Current finance scope is operational money management, not a full general ledger or statutory accounting system.
- A customer payment, collection visit, and custody handover are separate facts. Payments may be partial; promises do not change contractual due dates. Collector-held money remains distinguishable from cashier-received money. Cash discrepancies require investigation; original transactions are not rewritten to force a match.
- Supplier receiving and supplier payment progress independently. Supplier payment method/clearing workflow must match confirmed business practice; if giro/check is used, payable is settled only after successful clearing. Payment allocation and treatment of excess remain subject to the latest finance rules and open decisions.
- Product/component/equipment procurement uses PO and receiving, not operating expense. Expenses and later-paid bills are distinct. Expense evidence (receipt/photo) is required where applicable. Budget overrun must not block recording a real expense; it triggers the applicable additional-budget approval, including owner escalation where required.
- Payroll is prepared and verified from source records, approved under the configured authority, then frozen when finalized. Worker App displays the employee's own results; historical payroll does not change when later rules or assignments change. Exact cutoff, commission, target, allowance, and statutory calculation rules are configurable/open where not finalized.
- Store cash may be physically held or temporarily held by authorized staff; account holder does not determine business ownership. The business does not currently require dedicated store bank accounts or a general inter-store money-transfer workflow.

#### Decision boundaries and records

- The system provides context, history, warnings, and approvals; managers retain judgment for credit, default, repossession, inspection, repair, resale, and exceptional customer resolution. Previous default/recovery is a warning, not an automatic permanent credit ban.
- A finalized business record is corrected through an auditable domain workflow or compensating record, not silent deletion. Generated/attached files support their source business record; they do not replace it.
- Operational visits/tasks may be completed without payment. Customer payment history and allocation remain in Finance; field attempt outcomes, promises, reasons, and follow-up history remain operational records.
- Store opname has no fixed calendar schedule in the latest baseline. It compares expected inventory with physical findings and flags discrepancies; only the investigated and authorized outcome changes inventory records.

#### Source conflicts resolved elsewhere

- Reservation starts at the latest documented SO boundary, not older verbal-confirmation rules; drafts alone do not lock inventory. See the conflict register.
- Survey result authority, configurable installment terms, payment allocation, supplier payment method, employee history, and pricing rules have changed across source revisions. Use the latest resolved rules in this document and record any remaining uncertainty in Section 7/9; do not revive the raw specification's older alternatives.

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

- **Purpose**: Unified employee registry linked to Supabase Auth UUID, governing 10 discrete roles: _Owner, Manager, Admin, SPV, Salesperson, Surveyor, Driver, Collector, AR, Helper/OB_.
- **Backend**: `Employee.java`, `EmployeeRole.java`, `EmployeeRepository.java`, `MeController.java`, `EmployeeController.java`.
- **Web UI**: `EmployeeListPage.tsx`, `RolePermissionsPage.tsx`.
- **Mobile**: `auth_provider.dart`, `/api/me` profile bootstrap.
- **Status**: `[DONE]`
- **What Is Done**: Role mapping, department assignment, store linkage, and JWT claims validation via `@PreAuthorize`.
- **Detailed Role Capabilities Matrix & Included Implementation**:
  1. **Owner (OWNER)**:
     - _Web Management_: Full multi-store enterprise visibility, executive reporting & BI analytics, final approval tier for high-value discounts, credit exceptions, scrap write-offs, and procurement POs (APPROVAL_DECIDE). Full governance over stores, employees, roles, and approval DAGs.
     - _Mobile Worker App_: Role badge display, personal portal (geofence attendance, company bulletin, payroll slips), executive task notifications.
  2. **Manager (MANAGER)**:
     - _Web Management_: Daily branch operations. Review and release sales orders, configure store-level pricing and installment plans (PRICING_MANAGE), manage inventory allocations and transfers (INVENTORY_MANAGE), issue purchase orders (PROCUREMENT_MANAGE), schedule delivery trips and monitor live driver GPS (DELIVERY_MANAGE), assign and decide credit surveys (SURVEY_MANAGE, SURVEY_DECIDE), approve branch expenses and budgets (EXPENSE_MANAGE, BUDGET_MANAGE), manage branch staff attendance and payroll (HR_MANAGE, PAYROLL_MANAGE).
     - _Mobile Worker App_: Store branch attendance check-in/out with geofencing, mobile stocktake auditing, operational task list.
  3. **Admin (ADMIN)**:
     - _Web Management_: Front-office paperwork and walk-in counter sales. Customer profile master creation (CUSTOMER_MANAGE), sales order entry and releasing (SALES_ORDER_MANAGE), inbound PO receipt and stock adjustment (INVENTORY_MANAGE), official delivery note (Surat Jalan) and invoice document generation, operational petty cash expense vouchers (EXPENSE_CREATE), survey registration.
     - _Mobile Worker App_: Attendance check-in/out, task queue, company bulletin, personal payroll slips, mobile stocktake scanning assistance.
  4. **Supervisor (SPV)**:
     - _Web & Backend_: Supervise assigned sales team, monitor team order pipeline, customer CRM interactions, and lead follow-ups (CUSTOMER_CRM_VIEW, CUSTOMER_CRM_MANAGE). Restricted from altering core product pricing, payroll, or company financial accounts.
     - _Mobile Worker App_: Sales Work Center access, team task tracking, salesperson follow-up schedules, attendance check-in/out, personal payroll slips.
  5. **Salesperson / SF (SALESPERSON)**:
     - _Web Management_: Customer creation gated strictly by active Sales Order draft context (CUSTOMER_MANAGE), draft SO creation and discount negotiation submission (SALES_ORDER_MANAGE).
     - _Mobile Worker App_: Dedicated Sales & Customer Follow-Ups work card (/sales-work-center), customer 360-degree timeline view, product stock availability check, personal sales targets and estimated commission tracker, attendance clock-in. _Explicitly excluded from background GPS tracking_.
  6. **Surveyor (SURVEYOR)**:
     - _Web Management_: View assigned survey lists and inspection history (SURVEY_MANAGE).
     - _Mobile Worker App_: Primary field tool. Dedicated Credit Surveys Queue (/survey/:id), structured credit assessment checklist (housing, neighborhood, income verification), GPS photo proof grid with automatic coordinate and timestamp watermark (photo_proof_grid_widget.dart), customer digital signature capture (signature_pad_widget.dart), survey approval/rejection recommendation (SURVEY_DECIDE), shared background GPS tracking engine, offline survey queue with auto-sync (offline_sync_queue_notifier.dart).
  7. **Driver (DRIVER)**:
     - _Web Management_: View assigned delivery trips and trip manifests (DELIVERY_EXECUTE).
     - _Mobile Worker App_: Primary delivery client. Dedicated Active Delivery Trip card (/delivery/:tripId), sequential drop navigation, barcode/QR scanner for Surat Jalan and product serials (arcode_scanner_modal.dart), recipient digital signature, photo POD capture with GPS watermark, item-level delivery outcome handling (Delivered, Partial, Failed), cash-on-delivery (COD) custody counter, repossession execution (REPOSSESSION_EXECUTE), shared background GPS tracking engine, offline queue sync.
  8. **Collector (COLLECTOR)**:
     - _Web Management_: View customer installment payment histories and overdue accounts (FINANCE_COLLECT).
     - _Mobile Worker App_: Primary field collection client. Dedicated Field Collection Visits Queue (/collection/:visitId), overdue days and penalty calculation, customer contact history, outcome recording (Full, Partial, No Payment, Promise-to-Pay / PTP), cash custody handover tracker, repossession pickup execution (REPOSSESSION_EXECUTE), customer CRM notes, shared background GPS tracking engine, offline payment queuing.
  9. **Accounts Receivable (AR)**:
     - _Web Management_: Primary financial credit desk. Receivables monitoring, overdue aging ledger (1-30, 31-60, 61-90, 90+ days), installment repayment schedule review (FINANCE_MANAGE, REPORTING_VIEW), bank transfer verification, cash custody reconciliation and settlement for Drivers (COD) and Collectors (Field collections), discrepancy resolution. Does not manage field delivery routes.
     - _Mobile Worker App_: Attendance check-in/out, company bulletin, personal payroll slips.
  10. **Helper / OB (HELPER)**:
      - _Web Management_: Restricted access. No access to financial data, pricing formulas, customer credit reports, or payroll of others.
      - _Mobile Worker App_: Minimal task-focused interface. Dedicated Assigned Helper Tasks card (/my-work), delivery truck loading/unloading assistance, warehouse picking and staging verification (DELIVERY_PACK), mobile stocktake barcode scanning (STOCKTAKE_COUNT), attendance clock-in, personal payroll slips.
  11. **External Scope: Customer (CUSTOMER)**:
      - _E-Commerce Web & Mobile Storefronts_: Customer self-service account registration (/api/v1/storefront/auth/register), catalog browsing with faceted filters, shopping cart and checkout, multi-address book with map pin-drops, order tracking milestones, online installment repayment schedule view and payment gateway integration (QRIS, VA), automated push notifications. Isolated customer authentication scope decoupled from employee RBAC.
- **Proposed Enhancements**: Custom permission builder with fine-grained override toggles per employee; employee offboarding checklist with one-click access revocation across web and mobile tokens. (Backlog: `[N.5]`, `[N.7]`).

#### Feature 1.3: Approval Workflow Engine & Visual Builder

- **Purpose**: Configurable multi-step approval chains (Discount overrides, budget overruns, credit decisions, scrap disposal) with immutable historical snapshotting.
- **Backend**: `Workflow.java`, `WorkflowStep.java`, `ApprovalRequest.java`, `ApprovalStepHistory.java`, `ApprovalService.java`.
- **Web UI**: `ApprovalWorkflowsPage.tsx`, `ApprovalStepNode.tsx` (React Flow v12 DAG canvas, minimap, controls, threshold simulation dialog).
- **Status**: `[DONE]`
- **What Is Done**: Drag-and-drop workflow canvas, step snapshotting on request creation, multi-role approval execution.
- **Proposed Enhancements**: Workflow schema versioning; M-of-N quorum voting (`[G.8]`); approval expiration timeouts with automated escalation (`[O.3]`); temporary approval delegation during manager absence (`[O.2]`).

#### Feature 1.4: Universal Document Storage Vault & Universal Attachment Previewer Modal (`[O.5]`, `[N.7]`)

- **Purpose**: Centralized storage and secure universal inline previewing for customer identification (KTP/KK), employment contracts, supplier agreements, furniture assembly diagrams, electronics warranty cards, and signed delivery receipts (_Surat Jalan_).
- **Backend**: `DocumentRecord.java`, `DocumentRepository.java`, `DocumentService.java`, `DocumentController.java`, `DocumentDownloadTicketResponse.java`, `SupabaseStorageClient.java`.
  - Added expiring signed download URL ticket generation (`GET /api/documents/{id}/download-ticket`, `GET /api/documents/{id}/download`) with 15-minute TTL (`[N.7]`).
  - Added graceful fallback direct download streaming route for offline development environments.
  - Comprehensive unit testing: `DocumentServiceTest.java` (6 unit tests covering ticket creation, metadata retrieval, exception handling, and storage fallback).
- **Web UI**: `DocumentPreviewModal.tsx`, `DocumentsPanel.tsx`, `docxParser.ts`, `types.ts`, `api.ts`, `hooks.ts`.
  - Universal modal attachment previewer (`[O.5]`) supporting inline rendering of:
    - **PDF Documents**: Embedded view with responsive canvas, zoom scale (25% to 400%), 90-degree step rotation, fullscreen toggle, and fallback download button.
    - **Images (PNG, JPG, WEBP, SVG, GIF)**: High-resolution zoom, rotate, fit-to-window, dark/neutral contrast backdrop.
    - **Word Documents (.docx)**: Client-side binary parsing via `mammoth` into structured, stylized A4 paper layout (headings, tables with borders, lists, bold/italic, embedded graphics) with format warning banners for legacy formats.
    - **Text / Code / CSV**: Monospace styled syntax box with auto word-wrapping.
    - **Unsupported Formats**: Clean fallback card with file icon, MIME badge, size info, and 1-click Download.
  - **Multi-Document Gallery Carousel**: Previous/Next navigation (`<` / `>`), pagination counter ("X of Y"), keyboard navigation (Escape to close, Left/Right arrows to flip, +/- to zoom, R to rotate).
  - **Universal Top Toolbar**: Quick actions for Print, Download Original, Fullscreen Toggle, Rotate, Zoom In/Out/Reset, and Open in New Tab.
  - **DocumentsPanel Integration**: Reusable attachment management component with category badges, inline preview button, direct download button, and file upload progress states.
- **Status**: `[DONE]`
- **What Is Done**: Metadata indexing, file size validation, bucket key referencing, expiring signed download URLs, client-side docx parsing, inline PDF/image/Word rendering modal, and full Vitest + JUnit test suite.
- **Proposed Enhancements**: Watermark injection with employee ID and timestamp for sensitive KTP attachments (`[O.8]`); multi-page thumbnail navigation drawer sidebar (`[O.9]`); client-side image compression and cropping before upload (`[O.10]`).

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

- **Purpose**: Prevent orphaned customer entries by enforcing customer creation only during active Sales Order drafting or via explicit Admin override within back-office operations.
- **Backend**: `CustomerRequest.java` validation enforcing `salesOrderId` or admin context.
- **Web UI**: `CustomerFormDialog.tsx` context parameters.
- **Status**: `[DONE]`
- **What Is Done**: Request validation rejects free-floating unlinked customer creation by standard back-office staff.
- **Channel Architectural Distinction**: Back-office staff creation of customer records remains strictly gated by active Sales Order draft context or Admin role. Customer-facing E-commerce (Web and Mobile) provides self-service customer registration through dedicated storefront endpoints (`/api/v1/storefront/auth/register`), creating customer records within a dedicated customer security scope (see Feature 17.4 and Section 9.3 Conflict Analysis).

#### Feature 2.4: Customer Relationship Management (CRM) / Customer 360 `[DONE]` (Backlog `[J.1–J.7]`)

- **Purpose**: Unified 360-degree customer profile consolidating commercial sales orders, credit surveys, installment repayment records, field delivery attempts, service warranties, repossession history, and omnichannel CRM touchpoints into a unified customer command center.
- **Backend Architecture**:
  - **Database Migration**: Flyway `V22__customer_360_crm.sql` adding demographic and profiling columns to `customer` (`mother_maiden_name`, `birth_date`, `birth_place`, `segment`, `credit_score_grade`, `credit_score_points`, `clv_amount`, `total_orders_count`), creating tables `customer_tag`, `customer_interaction`, `customer_follow_up`, `customer_promise_to_pay`, `customer_store_credit_entry`, `store_voucher`, and establishing RBAC permissions (`CUSTOMER_TAG_MANAGE`, `CUSTOMER_INTERACTION_MANAGE`, `CUSTOMER_FOLLOW_UP_MANAGE`, `CUSTOMER_PTP_MANAGE`, `CUSTOMER_STORE_CREDIT_MANAGE`, `VOUCHER_MANAGE`).
  - **Entities & Repositories**: `CustomerTag`, `CustomerInteraction`, `CustomerFollowUp`, `CustomerPromiseToPay`, `StoreCreditEntry`, `StoreVoucher`, and repositories under `com.sms.customer.crm`.
  - **Services & Controllers**: `Customer360Service`, `VoucherService`, `Customer360Controller` (`/api/customers/...`), `VoucherController` (`/api/vouchers/...`).
  - **Key Business Engines & Algorithms**:
    - **Chronological 360 Timeline Feed**: Streams and unifies cross-module events (sales orders, payments, surveys, delivery attempts, warranty repairs, and CRM logs) with unified filtering.
    - **Customer Lifetime Value (CLV)**: Dynamic summation of historical revenue across all fulfilled commercial sales orders.
    - **Credit Score & Behavioral Segmentation**: Algorithmic scoring evaluating installment repayment promptness (0–100 points, mapped to Letter Grades A/B/C/D) and auto-classification into segments (`VIP_CASH`, `STAR_CREDIT`, `HIGH_DELINQUENCY_RISK`, `STANDARD`).
    - **Promise-to-Pay (PTP / Janji Bayar) Engine**: Complete lifecycle tracking (`PENDING`, `KEPT`, `BROKEN`, `CANCELLED`), recording payment amounts, promised dates, collector notes, and failure attribution.
    - **Fuzzy Duplicate Customer Detection**: Multi-factor matching engine utilizing Bigram Dice Coefficient for phonetic name similarity, combined with exact NIK match, phone suffix normalization, and mother's maiden name comparison (`[J.4]`).
    - **Retail Store Credit & Voucher Engine**: Merchant store credit balance ledger (strictly retail discount and refund credit balance management, not banking deposits or money transmission) and voucher promotion management (`PERCENTAGE` / `FIXED_AMOUNT`, minimum spending thresholds, validity periods, and usage caps) (`[J.5]`).
    - **Omnichannel Communication Logger**: Audit logging of customer touchpoints across in-person store visits, field visits, phone calls, WhatsApp chats, and SMS (`[J.6]`).
    - **Follow-up Scheduler**: Scheduled reminder engine for sales leads, installment follow-ups, and post-delivery check-ins with completion tracking (`[J.7]`).
- **Web SPA UI (`sms-web`)**:
  - `CustomerDetailPage.tsx`: Transformed into the Customer 360 Command Center featuring a PDP-protected demographic profile header (mother's maiden name, date of birth, place of birth), Segment chip, Credit rating badge with score progress indicator, 4 high-level KPI cards (CLV, Store Credit balance, Active PTPs, Pending Follow-ups), Demographic Tag management, and a 7-tab interface:
    - Tab 0: Unified Chronological Timeline with multi-source filtering (Orders, Payments, CRM, All).
    - Tab 1: Omnichannel Interaction Log with quick interaction dialog.
    - Tab 2: Janji Bayar (PTP) Ledger with status chips and resolution dialog (Kept / Broken).
    - Tab 3: Follow-Up Scheduler with completion modal.
    - Tab 4: Store Credit Ledger & Voucher Codes with Grant/Redeem modals.
    - Tab 5: Contacts & Addresses.
    - Tab 6: Documents Repository.
  - `CustomerListPage.tsx`: Segment filter chips (`ALL`, `VIP_CASH`, `STAR_CREDIT`, `HIGH_DELINQUENCY_RISK`, `STANDARD`), credit grade column, and enriched CSV export.
  - `CustomerFormDialog.tsx`: New demographic inputs and inline Fuzzy Duplicate Detection widget showing potential matches with percentage similarity and matched reasons.
- **Mobile Worker App UI (`workerapp-mobile`)**:
  - `Customer360Screen` (`/customer-360/:id`): Mobile CRM dashboard showing customer segment, credit grade, CLV, active Janji Bayar (PTP), and interaction timeline.
  - Integrated quick action dialogs for recording PTP and logging visits directly from mobile field operations.
  - Offline sync integration via `offlineSyncProvider` (`RECORD_PROMISE_TO_PAY`, `RECORD_CUSTOMER_INTERACTION`).
  - Seamless entry points from `CollectorVisitScreen` and `WorkerHomeScreen`.
- **Status**: `[DONE]`
- **Testing & Verification**:
  - Backend: `Customer360ServiceTest.java` (5 unit tests passing).
  - Web: `CustomerDetailPage.test.tsx` (2/2 tests passing), `CustomerFormDialog.test.tsx` (2/2 tests passing). Full web suite: 15/15 test files passing (35/35 tests passing).
  - Mobile: Flutter analyze 0 errors.

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
- **Official Retail Installment Formula (VBA Standard Verified)**:
  - Input Parameters:
    - `HD`: Harga Dasar (Buying / Cost Price in thousands, e.g. Rp 2.878.000 -> 2.878).
    - `DP`: Down Payment / Uang Muka (in thousands). Tiered thresholds:
      - `HD < 5.000` -> `DP = 0` (No DP required)
      - `5.000 <= HD < 6.000` -> `DP = 1.000` (Rp 1.000.000)
      - `6.000 <= HD < 7.000` -> `DP = 1.500` (Rp 1.500.000)
      - `7.000 <= HD < 8.000` -> `DP = 2.000` (Rp 2.000.000)
      - `HD >= 8.000` -> `DP = 2.500` (Rp 2.500.000)
  - Calculation Steps for Tenor $T \in \{10, 12, 15\}$:
    1. **Net Financed Base**: $h1 = (\text{HD} - \text{DP}) + 30$ _(flat Rp 30.000 handling/admin fee)_.
    2. **Credit Markup**: $h2 = h1 \times (1 + 0.04 \times T)$ _(flat interest rate of 4% per month: 10 bln = +40%, 12 bln = +48%, 15 bln = +60%)_.
    3. **Gross Monthly Due**: $h3 = h2 / T$.
    4. **Incentive Discount**: $h4 = h3 \times (1 - 0.15) = h3 \times 0.85$ _(15% prompt payment / commercial installment discount)_.
    5. **Rounding to 5k**: $\text{Angsuran} = \text{Round}(h4 / 5, 0) \times 5 + 5$ _(rounded to nearest 5k increment + Rp 5.000)_.
- **Proposed Enhancements**: Price List Generator and Catalog export (HTML/PDF & Excel) grouped by product category/distributor (`[G.13]`); automatic installment matrix generator based on this formula (`[G.14]`); promotional campaign time-bound price scheduler; price change revision history log (`[O.7]`).

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

#### Feature 3.6: Showroom Credit Price Calculator & Custom DP Negotiation Engine `[IMPLEMENTED]` (Backlog `[G.14]`)

- **Purpose**: Salespersons on showroom floors frequently encounter walk-in customers negotiating payment conditions beyond static catalog price lists (e.g., buyer asks "What if I put down a 10% DP, or Rp 750.000 cash DP?", "How much will the installment be for 6, 10, 12, 15, 18, or 24 months?"). This engine provides real-time client-side and server-side installment calculation using the chain's official verified retail formula, with transparent step-by-step breakdown (h1 to h5), multi-tenor comparison, one-tap WhatsApp quotation sharing, and quotation draft integration.
- **Official Retail Installment Formula (VBA Standard Verified)**:
  1. **Net Financed Base**: $h1 = (HD - DP) + 30$ _(in thousands; adds flat Rp 30.000 administrative and handling charge)_.
  2. **Credit Markup**: $h2 = h1 \times (1 + 0.04 \times T)$ _(flat interest rate of 4% per month: 6 bln = +24%, 10 bln = +40%, 12 bln = +48%, 15 bln = +60%, 18 bln = +72%, 24 bln = +96%)_.
  3. **Gross Monthly Due**: $h3 = h2 / T$.
  4. **Commercial Incentive Discount**: $h4 = h3 \times (1 - 0.15) = h3 \times 0.85$ _(15% prompt payment / discipline rebate deducted upfront)_.
  5. **Rounding Rule**: $\text{Angsuran} = \text{Round}(h4 / 5, 0) \times 5 + 5$ _(rounded to nearest Rp 5.000 increment + Rp 5.000)_.
- **Backend Architecture & API Endpoints (`core-backend`)**:
  - Service: `PriceCalculationService.java` provides bracket-based suggested DP thresholds (<5M = Rp 0, 5-6M = Rp 1M, 6-7M = Rp 1.5M, 7-8M = Rp 2M, >=8M = Rp 2.5M), single-term installment calculation, multi-tenor simulation, and batch plan auto-generation.
  - REST API: `PricingController.java` exposes:
    - `POST /api/stores/{storeId}/pricing/calculate`: Preview calculation for arbitrary $HD$, custom $DP$, and custom tenor lists without database mutation.
    - `POST /api/stores/{storeId}/pricing/auto-apply`: Calculates and persists `StoreProductPrice` base/down payment along with `StoreProductPaymentPlan` records (10, 12, 15 months).
    - `POST /api/stores/{storeId}/pricing/auto-apply-all`: Batch auto-generates payment plans for all priced items in a store branch.
  - Verification: `PriceCalculationServiceTest.java` verifies suggested DP brackets, standard zero-DP pricing, custom 10% DP scenarios, and multi-tenor outputs (4/4 passing).
- **Worker Mobile Application Integration (`workerapp-mobile`)**:
  - Pure-Dart Engine: `CreditCalculatorService.dart` provides offline-capable calculation matching exact enterprise retail rules, formatting Rupiah currency and generating structured WhatsApp quote templates.
  - Interactive Screen: `CreditCalculatorScreen.dart` features:
    - _Product Source Switcher_: Toggle between Store Catalog Search (with auto-lookup of variant cash prices) and Manual Input (custom furniture sets/bundles).
    - _Harga Dasar (HD) Formatter_: Currency input with quick-increment chips (+500rb, +1jt, +2jt, +5jt).
    - _3-Mode Down Payment Selector_: Standard Tier Auto-DP, Percentage (%) ChoiceChips (0% to 40%), and Custom Nominal (Rp) for negotiated buyer deposits.
    - _Real-Time Metric Bar_: Net Financed Base $h1$ display and 15% prompt payment savings badge.
    - _Multi-Tenor Cards_: Interactive cards for tenors 6, 10, 12, 15, 18, and 24 months, highlighting standard 10, 12, 15 months, monthly dues, total customer cost, and monthly discount saved.
    - _Formula Inspector_: Expandable accordion detailing steps 1 to 5 with live numbers for full customer transparency.
    - _Sharing & Action Toolbar_: One-tap "Salin Simulasi untuk WhatsApp" copying formatted quotation to clipboard and "Gunakan Tenor" callback for draft quote assembly.
  - Work Center Integration: `SalesWorkCenterScreen.dart` features a prominent "Kalkulator & Simulasi Kredit" hero banner and individual product item simulation shortcuts.
  - Fast Access: Dedicated route `/sales-calculator` in `app_router.dart` and 1-tap quick action launcher in `worker_home_screen.dart`.
- **Status**: `[DONE]`
- **Verification**: 4/4 JUnit tests (`PriceCalculationServiceTest`), 6/6 Flutter tests (`credit_calculator_test.dart`), clean `flutter analyze` (0 issues).

---

#### Feature 3.5: Omnichannel Promotional Price Discounts & Campaign Engine `[IMPLEMENTED]` (Backlog `[P.28]`)

- **Purpose**: Time-bound promotional pricing and campaign management for multi-store retail chain selling electronics, home appliances, and furniture. Enables store managers and executives to schedule marketing discounts without altering base product prices or violating accounting invariants.
- **Backend Architecture & Migration**:
  - Flyway migration `V30__promotional_price_discounts.sql`: Created `price_discount` table with columns `store_id` (nullable for chain-wide promotions), `product_id`, `product_variant_id`, `discount_name`, `discount_type` (`PERCENTAGE` vs `FIXED_AMOUNT`), `discount_value`, `min_order_amount`, `max_discount_amount` (cap for percentage discounts), `min_quantity`, `valid_from`, `valid_until`, `active`, `priority`, and `notes`.
  - Indexed on `store_id`, `product_id`, `product_variant_id`, and `(active, valid_from, valid_until)`.
  - Entities & Enums: `PriceDiscount.java`, `DiscountType.java`, `PriceDiscountRepository.java`.
  - DTOs: `PriceDiscountRequest.java`, `PriceDiscountResponse.java`, `DiscountCalculationRequest.java`, `DiscountCalculationResult.java`.
  - Core Service (`PriceDiscountService.java`): Evaluates active candidate discounts matching store branch, variant, product, and minimum order requirements; applies percentage or fixed nominal deductions; clamps percentage savings to maximum caps; and resolves the single discount configuration that maximizes customer savings (best-savings invariant).
  - REST API (`PriceDiscountController.java`): Protected under `PRICING_MANAGE` RBAC for administrative mutations (`POST`, `PUT`, `DELETE`, `/toggle-active`) and open calculation endpoint (`POST /api/pricing/discounts/calculate`).
- **Omnichannel E-commerce Integration**:
  - `StorefrontCatalogService.java`: Evaluates active promotional price discounts on product summaries and variant details, injecting `originalMinPrice`, `hasDiscount`, `maxDiscountPercent`, and `discountLabel`.
  - `StorefrontCartService.java`: Calculates line-item promotional savings, returning `subtotalAmount` (base price), `totalDiscountAmount`, and net `totalAmount`.
  - `StorefrontCheckoutService.java`: Applies verified discount prices to `SalesOrderItem` (`referencePrice` = original base price, `finalPrice` = discounted price), annotating item notes with applied campaign name and percentage.
- **Web Applications**:
  - Management System (`sms-web`): Enhanced `PricingPanel.tsx` with a dual-tab layout ("Harga Tunai & Tenor" vs "Diskon Promo Toko"), created `PriceDiscountDialog.tsx` for creating and editing promotional campaigns with date range pickers (`validFrom` / `validUntil`), added one-tap active status toggles, deletion, and real-time campaign schedule badges (`Aktif`, `Terjadwal`, `Kedaluwarsa`, `Nonaktif`).
  - Date Range Validity Scheduling:
    - _Database Level_: `valid_from` and `valid_until` (`TIMESTAMPTZ`) in `price_discount` indexed on `(active, valid_from, valid_until)`.
    - _Backend Validation_: `PriceDiscountService.java` strictly checks `validUntil.isBefore(validFrom)` rejecting invalid date windows, and evaluates `d.validFrom <= now && d.validUntil >= now` across catalog and cart pricing.
    - _Frontend Management_: Date inputs prefilled with today and +30 days window, supporting full reschedule/edit capabilities via `useUpdatePriceDiscount`.
  - E-commerce Storefront (`ecommerce-web`): Updated `ProductCard.tsx` with `-X%` promotional badges and strikethrough original prices, upgraded `ProductDetailPage.tsx` with high-contrast price savings box ("Hemat Rp X"), and enhanced `CartPage.tsx` with promotional discount summary deductions.
- **Mobile Storefront (`ecommerce-mobile`)**:
  - Enhanced `product_model.dart` and `cart_model.dart` to deserialize promotional discount fields (`originalMinPrice`, `hasDiscount`, `maxDiscountPercent`, `discountLabel`, `totalDiscountAmount`).
- **Verification**:
  - 8/8 `PriceDiscountServiceTest` JUnit tests passed (percentage calculation, max cap clamping, fixed amount, minimum spend thresholds, date validity, best-savings selection, active toggle).
  - 2/2 `FlywayMigrationValidationTest` verified contiguous V1–V30 schema.
  - 4/4 `StorefrontServiceTest` passed.
  - 1/1 `PricingPanel.test.tsx` Vitest test passed.
  - Clean production builds verified across `core-backend` (`mvnw test-compile`), `ecommerce-web` (`npm run build`), and `sms-web` (`npm run build`). `flutter analyze` 0 issues.

---

#### Feature 3.7: Retail Price List Report & Catalog Export Engine `[IMPLEMENTED]` (Backlog `[G.13]`)

- **Purpose**: Generates official retail catalog price sheets for showroom floor sales representatives, customer consultations, and distributor distribution. Features real-time grouping by product category (e.g. Lemari Pakaian, Lemari Hias Cristal, Meja Rias, Dispenser, Pompa Air, Mesin Cuci, Kulkas, AC Split, Showcase, LED TV) and brand/distributor (Olympic, Polytron, Sharp, Samsung, LG), displaying Harga Dasar (HD), Down Payment (DP), and installment terms (10x, 12x, 15x). Includes instant reactive formula calculation on price component changes, 1-click A4 PDF print view with store headers, and formatted multi-sheet Excel (`.xlsx`) catalog export.
- **Backend Architecture & Migration (`core-backend`)**:
  - Flyway Migration `V31__price_list_and_calculator.sql`: Adds `base_price` (Harga Dasar / HD) and `down_payment` (DP) to `store_product_price`, and `monthly_installment` to `store_product_payment_plan`. Backfills existing rows.
  - Services:
    - `PriceCalculationService.java`: Computes exact retail installments, suggested DP brackets (<5M = 0, 5-6M = 1M, 6-7M = 1.5M, 7-8M = 2M, >=8M = 2.5M), and batch auto-generation for store catalog items.
    - `PriceListService.java`: Compiles structured multi-group price list reports, sorts items, calculates missing plans on-the-fly, and renders official print-ready HTML matching store paper catalogs with `@media print` page breaks.
  - Controllers:
    - `PricingController.java`: `GET /api/stores/{storeId}/pricing/price-list`, `POST /api/stores/{storeId}/pricing/calculate`, `POST /api/stores/{storeId}/pricing/auto-apply`, `POST /api/stores/{storeId}/pricing/auto-apply-all`.
    - `PrintableDocumentController.java`: `GET /api/documents/print/price-list` generating A4 print-ready HTML with browser PDF trigger.
- **Web Management Application (`sms-web`)**:
  - Pure-TS Utility: `priceCalculator.ts` providing instant zero-latency client calculation matching the exact retail formula.
  - Interactive Page: `PriceListPage.tsx` with Store Selector, Category vs Brand grouping toggle, real-time product search, one-click "Cetak PDF / Print", "Ekspor Excel (.xlsx)", and "Auto-Hitung Semua" store batch generator.
  - Auto-Calculation on Price Component Edit: `PricingPanel.tsx` updated with Harga Dasar (HD) & Down Payment (DP) inputs, real-time suggested DP chip, live 10x/12x/15x calculation preview cards, and one-click "Terapkan Rumus (10x, 12x, 15x)" save button.
  - Navigation & Discovery: Dedicated route `/price-list` in `App.tsx`, sidebar navigation tab in `AppLayout.tsx`, and quick-jump shortcut in `CommandPalette.tsx` (`Ctrl+K`).
- **Status**: `[DONE]`
- **Verification**: 6/6 JUnit tests passing (`PriceCalculationServiceTest`), 8/8 Vitest tests passing (`priceCalculator.test.ts`, `PriceListPage.test.tsx`), 1/1 Vitest test passing (`PricingPanel.test.tsx`), clean production build.

---

#### Feature 3.8: Server-Side Price List Document Versioning, Stored Snapshots & Physical Date Stamping Engine `[IMPLEMENTED]` (Backlog `[G.18]`)

- **Purpose**: Persistently stores frozen document snapshots of price lists directly in the database server to eliminate redundant recalculation on repeated download triggers. When users click "Generate & Simpan ke Server", the system renders the official retail price list, stamps the "Berlaku mulai tanggal [DD MMMM YYYY]" at the bottom right of each category section, assigns a structured immutable version code (`PL-YYYYMMDD-XXX`), and stores the frozen HTML snapshot with metadata in `price_list_version`. For seamless UX, generation immediately initiates automatic download. Subsequent downloads ("Unduh Versi Tersimpan") fetch the stored snapshot in sub-milliseconds without triggering server recalculation. Older versions are never overwritten; instead, a dedicated "Riwayat Versi Dokumen (Document Versioning)" tab allows managers to inspect historical versions, preview/print, download, or selectively delete obsolete versions.
- **Backend Architecture & Migration (`core-backend`)**:
  - Flyway Migration `V34__price_list_versioning.sql`: Creates `price_list_version` table with `id`, `store_id`, `version_code` (unique per store), `title`, `valid_from`, `group_by`, `file_name`, `mime_type`, `file_size_bytes`, `item_count`, `content_html`, `notes`, `created_at`, `created_by`.
  - Service: `PriceListVersionService.java` providing `generateAndStoreVersion`, `listVersions`, `getLatestStoredVersion`, `getVersionEntity`, and `deleteVersion`.
  - Template & Validity Stamping: `PriceListService.java` updated to accept `LocalDate validFrom` parameter, rendering `<div class="section-footer-valid-date">Berlaku mulai tanggal ${effectiveDateStr}</div>` at the bottom of each category table section with `.group-section { page-break-inside: avoid; }`.
  - Endpoints (`PricingController.java` & `PrintableDocumentController.java`):
    - `POST /api/stores/{storeId}/pricing/price-list/generate-and-store`: Generates frozen HTML snapshot and stores entity, returns `PriceListVersionDto`.
    - `GET /api/stores/{storeId}/pricing/price-list/latest`: Fetches metadata for latest stored version.
    - `GET /api/stores/{storeId}/pricing/price-list/versions`: Lists all stored document versions for branch.
    - `GET /api/stores/{storeId}/pricing/price-list/versions/{versionId}/view`: Returns HTML (`text/html`) for browser print view.
    - `GET /api/stores/{storeId}/pricing/price-list/versions/{versionId}/download`: Returns HTML as attachment (`Content-Disposition: attachment; filename=...`).
    - `DELETE /api/stores/{storeId}/pricing/price-list/versions/{versionId}`: Deletes a specific stored version.
    - `GET /api/documents/print/price-list` & `/price-list/html`: Updated to accept optional `validFrom` date parameter.
- **Web Management Application (`sms-web`)**:
  - Pure-TS API & Hooks: `pricingApi.generateAndStorePriceListVersion`, `listPriceListVersions`, `getLatestPriceListVersion`, `deletePriceListVersion`; hooks `usePriceListVersions`, `useLatestPriceListVersion`, `useGenerateAndStorePriceListVersion`, `useDeletePriceListVersion`.
  - Interactive Tabbed Navigation in `PriceListPage.tsx`:
    - Tab 1: **Daftar Harga Aktif (Live Catalog)**: Features Valid From (`validFrom`) date input, action buttons "Generate & Simpan ke Server" (with auto-download), "Unduh Versi Tersimpan" (instant fetch of latest stored snapshot), "Cetak PDF / Print", "Ekspor Excel (.xlsx)", and "Auto-Hitung Semua". Group tables display "Berlaku mulai tanggal [DD MMMM YYYY]" at the bottom right.
    - Tab 2: **Riwayat Versi Dokumen (Document Versioning)**: Full management archive table showing Version Code badge, Document Title, Valid From date, Grouping type, Total items, File size, Creation timestamp, and Action buttons (View/Print, Download, Delete with confirmation dialog).
- **Status**: `[DONE]`
- **Verification**: 3/3 JUnit tests passing (`PriceListVersionServiceTest`), 6/6 Vitest tests passing (`PriceListPage.test.tsx`), 1/1 Vitest test passing (`PricingPanel.test.tsx`), contiguous V1–V34 migration verified.

---

### Group 4: Sales Orders & Credit Contracting

#### Feature 4.1: Sales Order Lifecycle, Source Tracking & Multi-Fulfillment Grouping

- **Purpose**: Draft, calculate, reserve stock, and release sales orders for cash, online digital payments, COD, or credit terms across all channels (Management System, E-commerce Web, E-commerce Mobile).
- **Backend**: `SalesOrder.java`, `SalesOrderItem.java`, `SalesOrderService.java`, Flyway `V4__sales_orders.sql`.
- **Web UI**: `SalesOrderListPage.tsx`, `SalesOrderDetailPage.tsx`.
- **Status**: `[DONE]` (Core Lifecycle & In-Store SO) / `[PROPOSED]` (Omnichannel Source Tagging & Multi-Fulfillment Groups: `[P.1]`, `[P.4]`)
- **What Is Done**: State machine (`DRAFT → PENDING_APPROVAL → RELEASED → CONFIRMED → CANCELLED`), logical inventory reservation, discount calculation.
- **Integrated Omnichannel Enhancements**:
  - `order_source` tracking: Differentiating orders originated via `ONLINE_WEB`, `ONLINE_APP`, or `EMPLOYEE` (`[P.1]`) while guaranteeing identical business rules across all channels.
  - Multi-Fulfillment Grouping: Modeling one Sales Order containing multiple `FulfillmentGroup` instances (e.g. partial warehouse dispatch + supplier procurement) without artificial order splitting (`[P.1]`).
  - Dual-Axis Fulfillment Decisions: Supporting Decision A (Fulfillment completeness: Complete vs. Partial, decided by customer) orthogonal to Decision B (Fulfillment method: Home Delivery vs. Store Pickup) (`[P.4]`).
  - Multi-Payment Association: Supporting multiple payment transactions, initial deposits, subsequent balance payments, split payment methods, and line-item/fulfillment-level refunds (`[P.8]`, `[P.11]`).
- **Proposed Enhancements**: Quotation management with validity expiration dates (e.g., 7 days) and one-click quotation-to-order conversion (`[O.1]`); audit history tracking line-item changes and quantity edits on drafts (`[O.7]`).

#### Feature 4.2: Automated Price Negotiation & Discount Approval

- **Purpose**: Automatically intercept orders where `finalPrice < referencePrice`, generating approval requests with justification notes.
- **Backend**: `SalesOrderService.java` integrating with `ApprovalService.java`.
- **Web UI**: Discount alert banners and approval status chips in `SalesOrderDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Automatic workflow trigger, discount amount calculation, multi-level SPV/Manager review.
- **Proposed Enhancements**: Margin threshold warning indicator showing gross profit impact to approvers; salesperson monthly quota target and tiered commission tracking.

#### Feature 4.3: Configurable Multi-Channel Payments, Deposit Recording & Split Tenders

- **Purpose**: Require upfront payment confirmation (Down Payment for credit orders, deposit for procurement-required orders, or full payment for cash orders) before order confirmation, automatically reconciling transactions in Finance.
- **Backend**: `ConfirmSalesOrderRequest.java`, `SalesOrderService.confirm(...)` auto-creating `CustomerPayment` and `PaymentCustody`.
- **Web UI**: Down payment confirmation modal in `SalesOrderDetailPage.tsx`.
- **Status**: `[DONE]` (Cash Custody Confirmation) / `[PROPOSED]` (Configurable Payment Methods & Webhooks: `[P.8]`, `[P.11]`)
- **What Is Done**: Direct integration between in-store Sales Order confirmation and Finance cash custody ledger (`HELD_BY_CASHIER`).
- **Omnichannel Payment Integration & Configurable Scope**:
  - Supports 9 configurable payment methods: Bank Transfer/VA, QRIS, E-wallet, Credit/Debit cards, Cash at store, Direct store bank transfer, Driver COD, In-house customer credit, and Third-party installment financing (`[P.11]`).
  - Configurable through the Management System without code changes.
  - Supports split payment tenders (e.g., partial cash + partial bank transfer) associated with a single sales order.
  - Enforces deposit-first procurement gating before linked supplier POs can proceed.
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

#### Feature 7.1: Purchase Order Lifecycle, Supplier Directory & Deposit-First Procurement

- **Purpose**: Manage distributor catalogs, lead times, bank accounts, multi-line purchase orders, and demand consolidation.
- **Backend**: `Supplier.java`, `PurchaseOrder.java`, `PurchaseOrderItem.java`, `ProcurementService.java`, Flyway `V7__procurement.sql`.
- **Web UI**: `SupplierListPage.tsx`, `SupplierDetailPage.tsx`, `PurchaseOrderListPage.tsx`, `PurchaseOrderDetailPage.tsx`.
- **Status**: `[DONE]` (Core PO Lifecycle) / `[PROPOSED]` (Demand Consolidation & Deposit-First Gating: `[P.3]`, `[P.12]`)
- **What Is Done**: Full PO lifecycle (`DRAFT → PENDING_APPROVAL → ISSUED → RECEIVED → CANCELLED`).
- **Omnichannel Demand Consolidation Engine `[PROPOSED]` (Backlog `[P.3]`)**:
  - Consolidation dashboard aggregating backordered line items from sales orders (`AVAILABLE_PROCUREMENT_REQUIRED`) into optimized bulk supplier POs.
  - Strictly avoids generating 1:1 automated POs per sales order, preserving bulk procurement economies of scale.
- **Deposit-First Procurement Authorization Rule `[PROPOSED]` (Backlog `[P.12]`)**:
  - Gating invariant: A supplier Purchase Order for customer-demanded products **cannot proceed until the required customer deposit has been received and verified**.
  - Supports configurable deposit policies: full prepayment (100%), required deposit percentage (e.g. 20%, 50%), or fixed amount before procurement staff can commit the supplier PO.
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

#### Feature 8.1: Multi-Drop Delivery Trip Planning (Home Delivery / Own-Driver Scope)

- **Purpose**: Group confirmed sales order fulfillment groups into optimized delivery trips, assigning vehicle, driver, and helper staff for home delivery execution (Decision B).
- **Backend**: `DeliveryTrip.java`, `DeliveryOrder.java`, `DeliveryService.java`, Flyway `V8__delivery_logistics.sql`.
- **Web UI**: `DeliveryTripListPage.tsx`, `DeliveryTripDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Trip scheduling, vehicle assignment, stop sequence ordering for own-driver delivery method.
- **Multi-Fulfillment & Decision Orthogonality**: Binds specific `FulfillmentGroup` instances to delivery stops, supporting partial order deliveries (Decision A) without splitting parent sales orders.
- **Employee Operational Adjustment Governance**: Dispatchers may suggest re-routing or adjustments, but must never silently override the customer's approved arrangement; customer consent and change history are audited.
- **Proposed Enhancements**: Vehicle maintenance tracking (mileage, service intervals, oil changes) (`[L.5]`); vehicle fuel log tracking (`[L.5]`); operational expense tracking per trip (toll, parking, fuel allowance) (`[L.5]`).

#### Feature 8.2: Interactive Delivery Route Map

- **Purpose**: Visual route timeline showing delivery progress, drop waypoints, status badges, and official print triggers.
- **Web UI**: `DeliveryRouteMap.tsx` integrated into `DeliveryTripDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Sequential stop progression, status metrics, Surat Jalan direct print buttons.
- **Proposed Enhancements**: Real-time driver GPS tracking beacon; delivery failure reporting with root cause tagging (`[M.3]`); automated rescheduling workflow (`[M.3]`); customer delivery rating and feedback capture.

#### Feature 8.3: Official Delivery Note (_Surat Jalan_) Generation

- **Purpose**: Standardized delivery note with QR verification codes, item manifests, and triple signature blocks (Warehouse, Driver, Customer).
- **Backend**: `PrintableDocumentService.generateSuratJalanHtml(...)`, `PrintableDocumentController.java`.
- **Web UI**: One-click print button in `DeliveryTripDetailPage.tsx` and `DeliveryOrderPanel.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Clean print layout, barcode header, customer address snapshot display.
- **Proposed Enhancements**: Digital PDF archive auto-upload to Supabase Storage upon print; QR code scan verification for warehouse security gate-pass checkout.

#### Feature 8.4: Mobile Driver Delivery Execution, Touch Signature & COD (`[DONE]`, Backlog `[M.3]`)

- **Purpose**: Driver mobile app for delivery confirmation, recipient touch signature, proof photo upload, COD cash collection, and failed delivery incident reporting.
- **Mobile**: `driver_trip_screen.dart`, `signature_pad_widget.dart`, `photo_proof_grid_widget.dart`, `delivery_provider.dart`.
- **Backend**: `POST /api/delivery-orders/{id}/deliver`, `POST /api/delivery-orders/{id}/fail`, `FailDeliveryOrderRequest.java`, `DeliveryService.java`.
- **Status**: `[DONE]`
- **What Is Done**: Mobile stop list, recipient touch signature capture, COD payment collection, delivery completion with GPS watermark, and structured delivery issue reporting (`failDelivery`) capturing failure reason tags, proof photos (`proofPhotoUrl`), device geocoordinates, and triggering automated alerts to branch dispatchers (`DELIVERY_MANAGE`) to reschedule to a new trip.
- **Architectural Policy**: Manual dispatcher reassignment is intentionally enforced instead of automatic re-dispatch to ensure vehicle payload balancing and driver route optimization.
- **Proposed Enhancements**: Turn-by-turn navigation deep linking to Google Maps / Waze using survey-verified destination coordinates (`[M.7]`).

#### Feature 8.5: Customer Store Pickup Fulfillment & Handover `[PROPOSED]` (Backlog `[P.5]`)

- **Purpose**: Facilitate customer in-store pickup orders from checkout to item handover (Decision B).
- **Scope**:
  - Eligible branch store selection during checkout based on product availability.
  - In-store preparation and staging tracking in Management System (`READY_FOR_PICKUP`).
  - Automated customer notification via WhatsApp, Push, and Email containing unique Pickup Verification Code and QR barcode.
  - Store staff QR code verification and recipient ID validation via Management System Web or Worker Mobile App.
  - Digital pickup confirmation and automatic synchronization with parent sales order fulfillment group.
  - Seamless combination with home delivery fulfillment groups under the same parent sales order.

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

- **Purpose**: Produce official payment vouchers with Indonesian word spelling (_Terbilang_) and cashier stamp blocks.
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

#### Feature 9.6: Configurable Multi-Channel Payment Methods & Credit Facility Management `[PROPOSED]` (Backlog `[P.8]`, `[P.11]`)

- **Purpose**: Centralized administrative control of 9 supported payment methods, eligibility rules, and credit facility governance.
- **Scope**:
  - Management System administration console allowing authorized staff to enable or disable any of the 9 supported payment methods (Bank Transfer/VA, QRIS, E-wallet, Cards, Cash at store, Direct store transfer, Driver COD, In-house credit, Third-party financing) per store branch or channel without code changes.
  - Eligibility gating rules per transaction (minimum/maximum order value, geographic delivery restrictions for COD, customer credit tier).
  - In-house credit facility management: credit limit ceiling, active debt balance, repayment track record, approval workflows (customer credit is never automatically granted upon registration).
  - Third-party installment financing provider integration (Kredivo, Akulaku, Home Credit) with callback reconciliation.
  - Decoupled payment module architecture maintaining full multi-transaction history (deposits, subsequent balance payments, split tender, item/fulfillment-level refunds).

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

#### Feature 14.1: Role-Adaptive Dynamic Navigation & Work Center (Application D Overview)

- **Purpose**: Unified field-force mobile application (Application D of the integrated ecosystem) dynamically adapting home dashboard, task queues, and route guards based on active employee roles (Surveyor, Driver, Technician, Store Assistant).
- **Mobile**: `worker_home_screen.dart`, `my_work_screen.dart`, `app_router.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Role-specific task cards, unified work center queue, quick status indicators, profile bootstrapping.
- **Ecosystem Role**: Serves as the primary operational edge client for all physical field activities, store fulfillments, surveys, deliveries, inspections, and task tracking.
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

#### Feature 14.7: Salesperson Mobile Work Center (`[DONE]`, Backlog `[M.4]`)

- **Purpose**: Empower showroom and field sales staff with customer lookup, lead tracking, quotation generation, and sales quota progress tracking.
- **Mobile**: `sales_work_center_screen.dart`, `sales_order_detail_screen.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Real-time sales actuals integration with `/api/v1/reporting/sales-performance`, monthly sales quota target configuration (default Rp 50.000.000 benchmark), visual linear progress indicator with percentage achievement and tier color coding, customer search, product catalog browser, and draft quotation generation.
- **Proposed Enhancements**: Audio chime upon reaching monthly quota milestones; offline draft quote creation queue.

#### Feature 14.8: Warehouse Picking & Packing Verification (`[DONE]`, Backlog `[M.2]`, `[I.9]`)

- **Purpose**: Guided mobile warehouse operations for staging and loading items onto delivery trucks with barcode manifest verification.
- **Backend**: `DeliveryService.verifyPacking(...)`, `DeliveryOrderController.java`, `VerifyPackingRequest.java`.
- **Mobile**: `warehouse_picking_screen.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Delivery packing manifest retrieval (`/api/delivery-orders/picking-manifest`), camera barcode scanning matching unit serials or manufacturer barcodes, duplicate and mismatch rejection, and atomic manifest verification marking `preInspectionPassed = true`.
- **Proposed Enhancements**: Haptic feedback on barcode match; Bluetooth ring scanner support for hands-free warehouse fulfillment.

#### Feature 14.9: Mobile Physical Stocktaking (Stock Opname) Scanner (`[DONE]`, Backlog `[M.5]`)

- **Purpose**: Floor staff scan serialized items into active stocktaking audit sessions with offline buffering and blind-count segregation of duties.
- **Backend**: `StocktakeService.java`, `StocktakeController.java`, `V21__mobile_stocktake.sql`.
- **Mobile**: `stocktake_screen.dart`, `stocktake_review_screen.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Continuous barcode scanning buffering serials into persistent `SharedPreferences` cache for resilient offline counting; blind-count mode strictly hides system book balances from counters to prevent counting bias; batch count submission triggers server-side variance computation (`MISSING`, `SURPLUS`, `MATCHED`) reviewed and signed off by supervisors with auto-balancing stock adjustments.
- **Proposed Enhancements**: Multi-counter zone partitioning; recount escalation alerts when variance exceeds configured threshold.

#### Feature 14.10: Customer Store Pickup Mobile Verification & Handover `[PROPOSED]` (Backlog `[P.5]`)

- **Purpose**: Enable branch floor employees to process customer store pickups via mobile device.
- **Scope**: View ready pickup orders, scan customer pickup QR code via mobile camera, verify recipient ID card photo, execute touch signature sign-off, and synchronize status with sales order fulfillment group.

#### Feature 14.11: Delivery Destination Logistics & Access Profiling (`[DONE]`, Backlog `[M.1]`, `[P.10]`)

- **Purpose**: Enable surveyors and drivers to profile destination delivery logistics directly from the mobile app with structured database persistence.
- **Backend**: `Survey.java`, `SurveyService.java`, `AssessmentRequest.java`, `SurveyResponse.java`, `V23__survey_location_profiling.sql`.
- **Mobile**: `surveyor_task_screen.dart`, `survey_provider.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Structured entity fields and database schema for `destination_latitude`, `destination_longitude`, `alley_width_meters`, `stair_clearance_meters`, and `gate_access_notes`; mobile surveyor UI captures GPS geocoordinates and physical dimension constraints, dispatching structured payloads during credit survey assessment updates.
- **Proposed Enhancements**: Turn-by-turn navigation launch to Google Maps / Waze using survey-captured coordinates (`[M.7]`).

#### Feature 14.12: Shared Task-Bounded Mobile Worker Location Tracking `[PROPOSED]` (Backlog `[Q.1]`, `[Q.2]`, `[Q.3]`, `[Q.9]`)

- **Purpose**: Mobile client implementation of the Logistics & Fleet Management System (Group 18), tracking field staff location strictly during active delivery trips, credit surveys, or collection tasks.
- **Scope**:
  - Tracking is strictly bounded to the lifecycle of active tasks manually initiated by workers in the Flutter app (Drivers: `TRIP_ACTIVE`; Surveyors: `SURVEY_ACTIVE`; Collectors: `COLLECTION_ACTIVE`). Salespersons are explicitly excluded.
  - Zero background location tracking occurs outside active operational tasks, protecting employee privacy and device battery life.
  - Automated pause during scheduled break windows (e.g., lunch), ceasing all GPS collection with no deferral allowed; auto-resumption when break concludes.
  - Local SQLite/Drift coordinate buffering with original hardware timestamps during network outages, synchronized upon reconnection.
  - Transparent mobile status banners communicating active, paused, interrupted, or completed states.
  - Cross-Reference: Fully detailed functional and architectural specifications documented in Group 18.

#### Feature 14.13: Actionable Notification Center (`[DONE]`, Backlog `[M.6]`)

- **Purpose**: Unified mobile notification center with direct document deep-links and one-tap supervisory approvals/rejections.
- **Backend**: `NotificationService.java`, `NotificationController.java`.
- **Mobile**: `notification_center_screen.dart`, `app_router.dart`.
- **Status**: `[DONE]`
- **What Is Done**: Notification feed querying `/api/notifications`, automatic unread/read state transitions (`PATCH /api/notifications/:id/read`), deep-link routing for `SURVEY` (`/survey/:id`), `DELIVERY` (`/delivery-order/:id`), `SALES_ORDER` (`/sales-order/:id`), and `STOCKTAKE` (`/stocktake-review/:id`), plus one-tap approval / rejection for multi-step approval workflows.

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

#### Feature 15.4: Enterprise Usability & Productivity Suite

- **Purpose**: Administrative conveniences for high-volume daily desktop operations across multi-branch retail network.
- **Scope & Components**:
  - Saved custom table filters and persistent column visibility preferences stored per user (`[O.4]`).
  - Universal document attachment previewer modal supporting inline rendering of PDFs, images, and Word documents (`[O.5]`, see Feature 1.4).
  - Bulk actions across DataGrids (bulk status updates, continuous multi-document print, Excel/CSV exports) (`[O.6]`, see Feature 15.5).
  - Master data change history modal showing chronological diffs of edits (`[O.7]`).

#### Feature 15.5: DataGrid Bulk Operations, Continuous Multi-Document Printing & Universal Exports (`[DONE]`, Backlog `[O.6]`)

- **Purpose**: Eliminate repetitive single-record operations for high-volume store, warehouse, and procurement workflows (updating serial statuses, issuing POs, bulk printing Surat Jalan and Tax Invoices, exporting filtered catalogs/customers).
- **Backend Architecture & APIs**:
  - `BulkOperationResult.java` (`com.sms.common.dto.BulkOperationResult`): Standardized transactional batch result record capturing `totalProcessed`, `successCount`, `failureCount`, and structured `errors` map.
  - Multi-Document Batch HTML Print Engine (`PrintableDocumentService.java` & `PrintableDocumentController.java`):
    - `POST /api/documents/print/bulk` and `GET /api/documents/print/bulk?type={type}&ids={id1,id2}`: Combines multiple documents into a single continuous HTML stream with CSS `@media print { .page-break { page-break-after: always; } }` rules for seamless single-job batch printing.
    - Added dedicated Sales Order Tax Invoice & Nota Penjualan HTML generator (`/api/documents/print/invoice/{salesOrderId}`) rendering customer profile, installment schedule details, down payment, total items, and authorized signatures.
    - Supports Surat Jalan, Official Credit Agreements, Nota Penjualan / Invoices, Repossession Notices, Payment Receipts, and Payroll Slips.
  - Operational Bulk Status Endpoints:
    - `POST /api/sales-orders/bulk-status`: Batch transitions sales orders with optional audit cancellation reasons.
    - `POST /api/stock-units/bulk-availability`: Batch updates serialized stock units (`AVAILABLE`, `RESERVED`, `UNAVAILABLE`) with mandatory audit log reason.
    - `POST /api/purchase-orders/bulk-status`: Batch issues (`ISSUE`) or cancels (`CANCEL`) supplier procurement purchase orders.
  - Backend Unit Testing: `BulkOperationsServiceTest.java` (3 unit tests verifying multi-document HTML generation with page breaks, bulk stock availability mutation, and bulk SO status transitions).
- **Web UI & Components**:
  - `BulkActionBar.tsx` (`sms-web/src/components/BulkActionBar.tsx`): Persistent floating bottom toolbar appearing when rows are checked in DataGrid. Displays selection count, Clear Selection button, Print Documents dropdown, Status Update action button, and Export menu.
  - `BulkStatusUpdateDialog.tsx` (`sms-web/src/components/BulkStatusUpdateDialog.tsx`): Reusable confirmation dialog with customizable status options, helper descriptions, and optional/required audit reason textfields.
  - `exportDataGrid.ts` (`sms-web/src/lib/exportDataGrid.ts`): Universal export utility supporting:
    - Dynamic column header extraction and value formatting.
    - Multi-format download: Excel (.xlsx with auto-styled column widths via SheetJS) and CSV (.csv with UTF-8 BOM).
    - Intelligent row scope: Exports currently selected rows if checkboxes are active; exports all filtered rows if no rows are checked.
    - MUI X DataGrid v9 compatibility helper functions: `extractSelectedRowIds` and `getSelectedRowCount` handling `{ type: 'include' | 'exclude', ids: Set<GridRowId> }`.
  - DataGrid Integrations Across Operational List Pages:
    - `SalesOrderListPage.tsx`: Bulk status transitions (`CONFIRMED`, `CANCELLED`) and bulk printing (Nota Penjualan / Invoices).
    - `StockUnitListPage.tsx`: Bulk availability adjustment (`AVAILABLE`, `RESERVED`, `UNAVAILABLE`) with audit reason dialog and Excel export.
    - `PurchaseOrderListPage.tsx`: Bulk PO issue/cancel and procurement order export.
    - `CustomerListPage.tsx`: Master Customer 360 database export (.xlsx/.csv).
    - `ProductListPage.tsx`: Electronics and furniture catalog export.
    - `DeliveryTripListPage.tsx`: Fleet delivery trips and dispatch manifests export.
- **Status**: `[DONE]`
- **Proposed Enhancements**:
  - Asynchronous background export queue for large datasets (> 5,000 rows) with progress notifications (`[O.11]`).
  - Bulk barcode & QR code sticker generator formatted for Zebra / thermal label printers (`[O.12]`).

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

### Group 17: E-commerce Platform (Web & Mobile Customer Experience) `[PROPOSED]` (Backlog `[P.1–P.10]`)

> **Architectural Status**: Customer-facing online shopping platform operating as two unified front-ends (Application B: E-commerce Website, Application C: E-commerce Mobile Application) connected to the shared backend modular monolith via `/api/v1/storefront/*`. All business rules, product data, inventory availability, and order fulfillment remain centralized in the backend.

#### Feature 17.1: Omnichannel Product Catalog, Faceted Search & Discovery `[PROPOSED]` (Backlog `[P.6]`, `[P.7]`)

- **Purpose**: Enable retail customers to discover products across web and native mobile touchpoints.
- **Scope**:
  - Direct consumption of master product definitions (`Product`, `ProductCategory`, `ProductVariant`).
  - Real-time keyword search, brand filtering, category navigation, and technical attribute facets.
  - Multi-image gallery with pinch-to-zoom, warranty badges, and rich product specifications.
  - Variant selector (color, capacity, screen size) with instantaneous price and availability updates.

#### Feature 17.2: Commercial Availability Engine & Lead-Time Transparency `[PROPOSED]` (Backlog `[P.2]`)

- **Purpose**: Provide clear customer visibility into stock availability and procurement lead times before checkout.
- **Scope**:
  - Real-time calculation of commercial status: `IN_STOCK`, `AVAILABLE_PROCUREMENT_REQUIRED`, `PREORDER`, or `UNAVAILABLE`.
  - Prominent badge indicators on product listing pages and product detail screens.
  - Estimated dispatch lead times communicated explicitly (e.g., "Ready for same-day dispatch" vs "Procurement required: Estimated dispatch in 5–7 business days").
  - Clear itemized badge flags inside shopping cart and checkout order summaries.

#### Feature 17.3: Shopping Cart, Checkout & Dual-Axis Fulfillment Preference Selection `[PROPOSED]` (Backlog `[P.1]`, `[P.4]`)

- **Purpose**: Streamlined self-service cart management, dual-axis fulfillment preference selection, and checkout.
- **Scope**:
  - Persistent shopping cart across web and mobile sessions linked to customer account.
  - Price quote calculation including itemized tax (PPN), applied promo vouchers, and dynamic delivery fees.
  - **Decision A — Fulfillment Completeness Selection**:
    - _Complete Fulfillment_: Hold all items and deliver together in one consolidated trip once everything is ready.
    - _Partial Fulfillment_: Dispatch immediately available items first; deliver remaining backordered items upon receiving.
    - Customer retains exclusive decision authority over completeness during checkout.
  - **Decision B — Fulfillment Method Assignment**:
    - Customer assigns fulfillment method (Own-driver home delivery with address selection, or Customer store pickup with branch selection) per line item or fulfillment group.
    - An order may combine home delivery and store pickup across different fulfillment groups.
  - Employee adjustment governance: Store staff cannot silently override the customer's chosen fulfillment arrangement; customer consent and change history are audited.

#### Feature 17.4: Customer Self-Service Registration, Authentication & Address Management `[PROPOSED]` (Backlog `[P.6]`, `[P.7]`)

- **Purpose**: Secure customer onboarding and profile management decoupled from back-office employee creation gating.
- **Scope**:
  - Public customer registration via email/phone OTP and passwordless magic links.
  - NIK validation for credit installment applications (optional for simple cash/gateway purchases).
  - Multi-address book (Home, Office, Alternate) with interactive map pin-drop coordinates and delivery access notes.
  - Customer profile settings, communication preferences, and data privacy management (UU PDP consent).

#### Feature 17.5: Online Payment Integration, Configurable Methods & Deposit Reconciliation `[PROPOSED]` (Backlog `[P.8]`, `[P.11]`)

- **Purpose**: Frictionless online payment processing supporting 9 configurable methods with automated backend ledger reconciliation and deposit-first procurement gating.
- **Scope**:
  - Direct integration with certified Indonesian payment gateways (e.g., Midtrans, Xendit) and bank Virtual Account networks.
  - Configurable payment methods: Bank Transfer/VA, QRIS, E-wallet, Credit/Debit cards, Cash at store (for pickup), Direct store bank transfer, Driver COD, In-house customer credit (subject to credit approval and limits), and Third-party installment financing (Kredivo, Akulaku, Home Credit).
  - Centralized administrative toggle in Management System to enable or disable methods without code redeployment.
  - Upfront deposit and balance payment tracking: Enforces deposit-first procurement authorization rule before linked supplier POs are created.
  - Secure cryptographic signature validation and idempotent webhook callback processing (`POST /api/v1/storefront/payments/webhook`).
  - Automatic creation of confirmed `CustomerPayment` records upon successful authorization, bypassing physical cash custody.
  - Automated timeout expiration and stock reservation release for unpaid checkout sessions.

#### Feature 17.6: Self-Service Order History, Milestone Tracking & Pickup Alerts `[PROPOSED]` (Backlog `[P.6]`, `[P.7]`)

- **Purpose**: Real-time customer transparency into order status, shipment tracking, and pickup readiness.
- **Scope**:
  - Visual order progression timeline: `ORDER_PLACED` → `PAYMENT_CONFIRMED` → `PROCESSING` → `DISPATCHED / READY_FOR_PICKUP` → `COMPLETED`.
  - Staggered milestone tracking displaying individual status per fulfillment group for partial delivery orders.
  - Real-time driver trip progress alerts for own-driver deliveries.
  - Unique Pickup Verification Code and QR barcode display for store pickup orders.
  - Downloadable printable sales receipt and invoice vouchers.

#### Feature 17.7: Omnichannel Promotions, Discount Vouchers & Store Credit `[PROPOSED]` (Backlog `[J.5]`, `[P.6]`)

- **Purpose**: Promotional marketing engine driving customer conversion and brand loyalty across online and showroom channels.
- **Scope**:
  - Single-use and multi-use coupon code validation with minimum spend requirements and brand/category restrictions.
  - Store credit and gift voucher redemption applied directly to cart totals.
  - Seasonal marketing banner integration on e-commerce homepage and category headers.

---

### Group 18: Logistics & Fleet Management System `[IMPLEMENTED & INTEGRATED]` (Backlog `[Q.1–Q.11, Q.16, Q.17, Q.19 Completed]`, `[Q.12–Q.25 Roadmap]`)

> **Architectural Status**: Fully implemented backend infrastructure (Flyway V24 migration, entities, repositories, FleetService, FleetController) and Web Management frontend (FleetMonitoringPage with 4 operational tabs, FleetLiveMap interactive SVG canvas, VehicleFormDialog, navigation integration in AppLayout, CommandPalette, and App.tsx route /fleet). Unified GPS tracking infrastructure supports Drivers, Surveyors, and Collectors, while explicitly excluding Salespersons. Implements task-bounded tracking, strict break pauses, vehicle fleet registry, historical route scrubber playback (1x-10x), and Indonesian Personal Data Protection (UU PDP No. 27/2022) statutory audit logging.

#### Feature 18.1: Shared Task-Based GPS Tracking Infrastructure & Mobile Task Workflow `[IMPLEMENTED]` (Backlog `[Q.1]`)

- **Purpose**: Unified GPS tracking infrastructure shared across Driver, Surveyor, and Collector roles, replacing fragmented tracking code with a single robust lifecycle engine.
- **Exclusion Invariant**: **Salespersons are explicitly excluded from GPS tracking** across all web and mobile platforms.
- **Fundamental Business Principle**:
  - **GPS tracking only happens while an employee is actively performing an assigned operational task.**
  - The system must **never continuously track employees throughout their working day**.
  - Off-duty, standby, or untasked staff are never subject to background geolocation tracking.
- **Manual Task Initiation & Execution Lifecycle (Flutter Mobile App)**:
  1. Employee logs into the Worker Mobile Application (`workerapp-mobile`).
  2. Employee navigates to their role-specific work center and opens an assigned task or delivery trip.
  3. Employee reviews destination, items, customer notes, and operational instructions.
  4. Employee manually presses **Start Task** (or **Start Trip** for drivers).
  5. The application validates GPS availability, location services status, and runtime permissions (`ACCESS_FINE_LOCATION`, `ACCESS_BACKGROUND_LOCATION` on Android; `locationAlways` on iOS).
  6. GPS tracking officially begins, starting a foreground service with a persistent ongoing notification.
  7. The application periodically collects GPS coordinates and transmits them in batches to the backend REST/WebSocket ingestion endpoint.
  8. Employee performs their field work (driving, surveying dwelling, collecting payment).
  9. Employee completes the task or completes the entire delivery trip.
  10. GPS tracking stops immediately, foreground service terminates, and the operational tracking session is formally closed.
- **Scope & Boundaries**: Tracking is strictly authorized and bound to the operational session. No silent or covert location tracking is permitted under any circumstances.

#### Feature 18.2: Role-Specific Tracking Scope & Operational Workflows `[IMPLEMENTED]` (Backlog `[Q.2]`)

- **Purpose**: Model operational tracking lifecycles tailored to each supported employee category while sharing underlying GPS collection plumbing:
  1. **Driver — Delivery Trip Tracking**:
     - **Decisive Invariant**: **One Delivery Trip = One Tracking Session.**
     - A delivery trip regularly contains multiple delivery orders (e.g., Delivery Trip `DT-000001` containing `DO-000001`, `DO-000002`, `DO-000003`).
     - _Workflow_:
       - Driver opens assigned `DeliveryTrip` in `workerapp-mobile`.
       - Driver taps "Start Trip" at the store warehouse. Tracking session opens (`ACTIVE`).
       - Driver performs sequential customer deliveries.
       - **Completing an individual Delivery Order (capturing recipient signature, photo proof, or COD payment) does NOT stop GPS tracking.**
       - Tracking continues seamlessly while the driver travels from stop 1 to stop 2, and onward.
       - Only when all deliveries in the trip are concluded (or remaining stops marked failed/rescheduled) does the driver explicitly tap "End Trip".
       - GPS tracking ceases, foreground service shuts down, and the tracking session transitions to `COMPLETED`.
     - _Session Associations_: Driver employee ID, `delivery_trip_id`, and assigned vehicle ID (`vehicle_id`, if applicable).
     - _Anti-Pattern Prohibited_: The system strictly forbids opening and closing independent GPS tracking sessions per individual delivery order stop within the same trip.
  2. **Surveyor — Credit Survey Tracking**:
     - _Workflow_:
       - Surveyor opens an assigned credit survey task.
       - Surveyor manually taps "Start Survey" upon departure or arrival at customer property.
       - GPS tracking activates and records the journey/on-site assessment.
       - Surveyor appraises property dwelling, uploads watermarked photos, and submits appraisal determination (`POST /api/surveys/{id}/decide`).
       - GPS tracking ends immediately upon survey task submission, closing the tracking session.
     - _Session Associations_: Surveyor employee ID, `survey_id`, and customer account / property address ID.
     - _Cross-Module Integration_: Geocoordinates captured during the survey (`destination_latitude`, `destination_longitude`) and access constraints (alley width, stair clearance, gate access notes) are stored in `survey` and automatically shared with `Delivery Management` (`delivery_order`) for turn-by-turn driver navigation on future deliveries (`[M.1]`, `[M.7]`).
  3. **Collector — Delinquent Installment Collection Tracking**:
     - _Workflow_:
       - Collector opens assigned field collection task for a delinquent credit customer.
       - Collector taps "Start Collection Visit".
       - GPS tracking activates for the duration of the visit.
       - Collector records visit outcome (`PAID`, `PROMISED_TO_PAY`, `REFUSED`, `UNREACHABLE`), receives cash custody, or logs promise-to-pay (`POST /api/finance/collections`).
       - Collector taps "End Visit"; GPS tracking halts and tracking session completes.
     - _Session Associations_: Collector employee ID, `collection_task_id`, and customer receivable account ID.
     - _Cross-Module Integration_: Synchronizes visit destination coordinates with Customer 360 CRM interaction timeline (`[J.6]`, `[J.10]`).

#### Feature 18.3: Strict Configurable Break Management & Tracking Pause `[PROPOSED]` (Backlog `[Q.3]`)

- **Purpose**: Enforce non-negotiable pause of GPS location collection during employee break windows, upholding employee personal privacy and statutory labor compliance.
- **Strict Scheduled Break Policy**:
  - GPS tracking **must automatically stop during scheduled break periods**, regardless of whether an operational task is in progress.
  - _Illustrative Daily Timeline_:
    | Time Window | Operational Event | GPS Tracking State | Mobile UI Status |
    |---|---|---|---|
    | **08:00** | Employee manually starts Delivery Trip / Task | `ACTIVE` | Green Banner: "Tracking Active" |
    | **12:00** | Configured Lunch Break begins | `PAUSED_BREAK` | Amber Banner: "Break Time — GPS Paused" |
    | **13:00** | Configured Lunch Break ends | `ACTIVE` (Auto-Resumed) | Green Banner: "Tracking Resumed" |
    | **14:00** | Employee taps "Complete Task / End Trip" | `COMPLETED` | Gray Banner: "Tracking Closed" |
- **Ten Fundamental Business Rules for Break Management**:
  1. Break schedules are dynamic and configurable in the database, never hardcoded in application logic.
  2. The system supports multiple scheduled break windows per day (e.g., morning tea 10:00–10:15, lunch 12:00–13:00, afternoon prayer/break 15:30–15:45).
  3. When a scheduled break begins, GPS tracking automatically pauses immediately.
  4. Employees cannot override, dismiss, or defer scheduled breaks to continue location tracking.
  5. **Zero Coordinate Capture**: Absolutely no GPS coordinates, speed, or heading metadata may be collected, buffered, or transmitted during break windows.
  6. When a scheduled break window ends, GPS tracking automatically resumes if and only if the associated operational tracking session is still active (`status == PAUSED`).
  7. If the employee completed the task during the break window, tracking remains permanently stopped.
  8. Break pause and resumption events are logged as distinct immutable entries in `tracking_session_event`.
  9. The mobile application delivers local audible/visual push notifications 5 minutes prior to break start and upon break conclusion.
  10. Break schedules support hierarchical configuration: corporate default, store branch override, or employee category override.
- **Mobile Background Execution & OS Restriction Handling**:
  - Modern Android (Doze mode, background location limits) and iOS (suspended background execution) enforce stringent background restrictions.
  - The mobile app runs a persistent Foreground Service with a sticky Notification Bar item while tracking is active.
  - If the mobile operating system suppresses automatic background resumption when a break ends (e.g., process killed by OS memory manager), the app triggers an immediate high-priority local push notification instructing the employee: _"Break time ended. Tap here to verify task resumption"_.
  - **Truthful Status Invariant**: The mobile application and management dashboard must **never falsely indicate that GPS tracking is active** when location collection has not physically resumed.
- **Manual Pause Capability (Exceptional Circumstances)**:
  - In addition to scheduled breaks, workers may trigger a manual pause for unforeseen emergencies (vehicle breakdown, flat tire, sudden medical issue, severe road hazard).
  - _Governance_: Configurable via RBAC permissions (`FLEET_MANUAL_PAUSE`).
  - _Audit Trail_: Mandatory selection of a pause reason from a predefined enum (`VEHICLE_BREAKDOWN`, `TRAFFIC_ACCIDENT`, `POLICE_CHECK`, `PERSONAL_EMERGENCY`, `OTHER`), mandatory text explanation, pause timestamp, and resume timestamp recorded in `tracking_session_event`.
  - _Policy Guardrail_: Manual pause cannot be abused to circumvent or replace the strict scheduled break policy.

#### Feature 18.4: Tracking Session State Machine & Event Reconstruction `[PROPOSED]` (Backlog `[Q.4]`)

- **Purpose**: Complete lifecycle modeling of tracking sessions and granular event auditing to accurately reconstruct operational timelines.
- **Tracking Session Entity Schema (`tracking_session`)**:
  - `id`: UUID primary key.
  - `employee_id`: References `employee.id` (Driver, Surveyor, Collector).
  - `task_type`: Enum (`DELIVERY_TRIP`, `SURVEY_TASK`, `COLLECTION_TASK`).
  - `task_id`: Logical reference ID (maps to `delivery_trip.id`, `survey.id`, or collection task ID).
  - `vehicle_id`: Optional reference to `vehicle.id` (if vehicle was assigned).
  - `status`: Enum (`NOT_STARTED`, `ACTIVE`, `PAUSED`, `INTERRUPTED`, `COMPLETED`).
  - `start_time`: Timestamp of manual task start.
  - `end_time`: Timestamp of task completion / trip closure.
  - `total_distance_meters`: PostGIS-aggregated spatial distance.
  - `active_duration_seconds`: Total active moving/working duration excluding pauses.
  - `paused_duration_seconds`: Total duration spent in scheduled breaks and manual pauses.
- **Session Event Ledger Schema (`tracking_session_event`)**:
  - `id`: Bigint / UUID primary key.
  - `tracking_session_id`: References `tracking_session.id`.
  - `event_type`: Enum (`SESSION_STARTED`, `SCHEDULED_BREAK_PAUSE`, `SCHEDULED_BREAK_RESUME`, `MANUAL_PAUSE`, `MANUAL_RESUME`, `GPS_LOST`, `GPS_RESTORED`, `NETWORK_OFFLINE`, `NETWORK_RESTORED`, `OS_TERMINATION_DETECTED`, `SESSION_COMPLETED`).
  - `event_timestamp`: UTC timestamp of event occurrence.
  - `reason_code`: Optional reason string (e.g. `LUNCH_BREAK`, `PUNCTURED_TIRE`).
  - `notes`: Optional textual notes or error payload.
  - `location_latitude` / `location_longitude`: Optional GPS coordinate snapshot at the instant of event transition.
- **Strict Distinction Principle**:
  - An intentional manual pause, a scheduled break, a GPS hardware loss, and a cellular network disconnection are **fundamentally different operational events**.
  - They must **never be treated as interchangeable statuses or collapsed into a single generic 'paused' flag**.
  - Preserving distinct event codes guarantees that dispatchers and auditors can reconstruct the exact, indisputable timeline of field operations.

#### Feature 18.5: GPS Location Collection, Ingestion & PostGIS History Engine `[PROPOSED]` (Backlog `[Q.5]`)

- **Purpose**: High-throughput ingestion, spatial persistence, and trajectory querying of field GPS coordinates.
- **Location Record Schema (`tracking_location`)**:
  - `id`: Bigserial / UUID primary key.
  - `tracking_session_id`: Foreign key to `tracking_session.id` (indexed).
  - `employee_id`: Foreign key to `employee.id` (indexed).
  - `coordinate`: PostGIS geometry point `GEOMETRY(Point, 4326)` with spatial GiST index (`gist_tracking_location_coord`).
  - `latitude`: High-precision numeric decimal (WGS 84).
  - `longitude`: High-precision numeric decimal (WGS 84).
  - `accuracy_meters`: Float representing GPS horizontal accuracy radius (e.g., 5.2m).
  - `speed_mps`: Float representing instantaneous velocity in meters per second (if provided by device).
  - `heading_degrees`: Float representing compass bearing 0–360° (if provided by device).
  - `altitude_meters`: Float representing altitude above sea level (if provided by device).
  - `battery_level_pct`: Smallint representing phone battery percentage (0–100) for telematics diagnostics.
  - `is_mock_provider`: Boolean anti-fraud flag detecting mock GPS injection apps.
  - `recorded_at`: Hardware device timestamp when coordinate was sampled.
  - `ingested_at`: Server timestamp when record was persisted into PostgreSQL.
- **Sampling & Battery Optimization Strategy**:
  - Dynamic sampling interval:
    - _In Motion_ (speed > 5 km/h): Sample every 10–15 seconds; upload batch every 30 seconds.
    - _Stationary / Traffic Delay_ (speed <= 5 km/h): Relax sampling to 30–60 seconds to conserve battery.
    - _Scheduled Break_: Exactly 0 samples (hardware GPS listener completely deactivated).
  - Target battery consumption: < 3.5% battery drain per hour of active tracking on modern Android/iOS hardware.
- **Backend Ingestion Architecture**:
  - High-performance REST batch endpoint (`POST /api/v1/fleet/tracking-sessions/{id}/locations`) accepting JSON arrays of up to 50 buffered coordinates.
  - Asynchronous Redis Pipeline: Upon ingestion, write current position to Redis Hash (`fleet:employee:{id}`) with 5-minute TTL, compute Haversine delta against previous point, and publish payload to Redis Pub/Sub topic `fleet:live-updates`.
  - Spring WebSocket STOMP broker dispatches live coordinates to subscribed management dashboard clients (`/topic/fleet/live`).
- **Database Partitioning & PostGIS Queries**:
  - PostgreSQL table `tracking_location` is partitioned monthly by `recorded_at` (`tracking_location_y2026m10`, `m11`, etc.) to prevent table bloat and index degradation over multi-million row trajectories.
  - Route reconstruction query leverages PostGIS `ST_MakeLine(coordinate ORDER BY recorded_at ASC)` to generate compressed GeoJSON LineStrings for web map rendering.

#### Feature 18.6: Web Management System — Real-Time GPS Fleet Monitoring Dashboard `[PROPOSED]` (Backlog `[Q.6]`)

- **Purpose**: Centralized operational map interface enabling authorized dispatchers, branch managers, and logistics coordinators to monitor active field personnel in real time.
- **Web SPA Component Architecture (`sms-web`)**:
  - `FleetMonitoringDashboardPage.tsx`: Dedicated management view accessible via sidebar under Logistics & Fleet.
  - Subscribed to WebSocket STOMP endpoint (`/topic/fleet/live`) using TanStack Query and reactive state.
- **Core Dashboard Capabilities**:
  1. **Interactive Live Map Canvas**:
     - Leaflet / Mapbox GL interactive map container with smooth vector pan and zoom.
     - Real-time animated markers representing actively moving employees.
     - Role-specific color-coded avatar markers:
       - 🚚 **Driver** (Emerald Green marker with truck glyph).
       - 📋 **Surveyor** (Sapphire Blue marker with clipboard glyph).
       - 💼 **Collector** (Deep Navy / Amber marker with wallet glyph).
     - Pulsing accuracy halo illustrating GPS horizontal accuracy radius (`accuracy_meters`).
     - Marker popup displaying: Employee Name, Role, Current Speed, Last Update Timestamp, Assigned Task/Trip Code, and Assigned Vehicle License Plate.
  2. **Live Employee Roster Sidebar**:
     - Collapsible drawer listing all currently on-duty or active field employees.
     - Search bar and quick category tabs: `ALL`, `DRIVERS`, `SURVEYORS`, `COLLECTORS`.
     - Employee card showing:
       - Status badge (`ACTIVE`, `PAUSED_BREAK`, `PAUSED_MANUAL`, `INTERRUPTED`).
       - Current assigned task (e.g. `Delivery Trip DT-000001` or `Survey SV-000042`).
       - Heartbeat freshness timer (e.g. "Updated 12s ago" with green dot, or "No signal 4m" with amber warning).
       - Assigned vehicle registration number.
       - One-click "Locate on Map" action centering map viewport on employee position.
  3. **Multi-Dimensional Dashboard Filters**:
     - Filter by Employee Category (Driver, Surveyor, Collector).
     - Filter by Store Branch (assigned branch territory).
     - Filter by Tracking Status (`ACTIVE`, `PAUSED`, `INTERRUPTED`).
     - Filter by Specific Individual (typeahead search).
  4. **Connection Health Indicator**:
     - Visual badge showing WebSocket connection status (Connected, Reconnecting, Offline) with auto-fallback to HTTP long-polling every 15s if WebSocket disconnects.

#### Feature 18.7: Historical Route Reconstruction, Playback & Session Auditing `[PROPOSED]` (Backlog `[Q.7]`)

- **Purpose**: Review completed or past tracking sessions, verify delivery routes, investigate customer delivery disputes, and audit employee travel timelines.
- **Historical Route Playback Interface (`RoutePlaybackDrawer.tsx`)**:
  - Date and Employee search filters with calendar range picker.
  - Search results display completed tracking sessions with start time, end time, total distance traveled (km), and stop count.
  - Selecting a session renders the complete historical route polyline on the map.
  - **Interactive Playback Controls**:
    - Play / Pause / Rewind buttons.
    - Adjustable playback speed slider (1x, 2x, 5x, 10x).
    - Timeline scrubber bar scrubbing through the entire session duration.
    - Animated vehicle/avatar icon traveling along the recorded polyline as time advances.
  - **Chronological Event Timeline Panel**:
    - Displays paired event pins along the route map:
      - 🟢 `SESSION_STARTED` at warehouse or branch.
      - 📦 `DELIVERY_COMPLETED` stops with DO number and timestamp.
      - ☕ `SCHEDULED_BREAK_PAUSE` and `SCHEDULED_BREAK_RESUME` pins showing exact stationary break location.
      - ⚠️ `MANUAL_PAUSE` pins showing mandatory recorded reason.
      - 🔴 `GPS_LOST` / `GPS_RESTORED` segments highlighted in dashed red lines.
      - 🏁 `SESSION_COMPLETED` final destination pin.
    - Clicking any event pin jumps the playback scrubber directly to that exact moment in time.

#### Feature 18.8: Vehicle Master Registry & Employee Assignment Engine `[PROPOSED]` (Backlog `[Q.8]`)

- **Purpose**: Maintain comprehensive fleet asset records and link vehicles to delivery operations.
- **Vehicle Master Schema (`vehicle`)**:
  - `id`: UUID primary key.
  - `store_id`: Assigned branch store branch ID (foreign key to `store`).
  - `registration_number`: Indonesian vehicle license plate (e.g., `B 1234 ABC`), unique index.
  - `vehicle_type`: Enum (`MOTORCYCLE`, `BLIND_VAN`, `PICKUP_TRUCK`, `LIGHT_TRUCK_4W`, `MEDIUM_TRUCK_6W`).
  - `brand_model`: String (e.g., "Daihatsu Gran Max 1.5", "Isuzu Traga", "Honda Beat").
  - `chassis_number` / `engine_number`: Vehicle identification numbers.
  - `status`: Enum (`AVAILABLE`, `IN_USE`, `MAINTENANCE`, `DECOMMISSIONED`).
  - `max_payload_kg`: Maximum carrying capacity in kilograms.
  - `max_volume_cbm`: Cargo box capacity in cubic meters.
  - `fuel_type`: Enum (`GASOLINE_RON90`, `GASOLINE_RON92`, `DIESEL_CN48`, `ELECTRIC`).
  - `odometer_km`: Current recorded odometer reading.
  - `stnk_expiry_date` / `kir_expiry_date`: Statutory registration and roadworthiness inspection expiration dates with automated renewal alert notifications (`[O.1]`).
- **Employee-to-Vehicle Assignment Mechanism**:
  - Logistics dispatchers assign a specific vehicle to a `DeliveryTrip` during trip planning in `sms-web`.
  - When the driver starts the trip in `workerapp-mobile`, the active tracking session automatically inherits `vehicle_id`.
  - The vehicle's status atomically transitions to `IN_USE` and reverts to `AVAILABLE` upon trip completion.
- **Primary Location Source Invariant**:
  - **The primary GPS location source for fleet tracking is the employee's mobile smartphone.**
  - Dedicated hardware GPS trackers permanently installed inside company vehicles are **NOT required for the initial implementation phase**.
  - _Distinction_: Mobile GPS tracks the employee's phone during authorized tasks; it does not track the vehicle independently when parked or when employees are off-duty.
  - _Future Transition_: Dedicated telematics hardware (OBD-II / hardwired GPS beacons) can be evaluated in subsequent fleet phases for independent vehicle tracking, fuel monitoring, and engine telemetry (`[Q.12]`).

#### Feature 18.9: Tracking Interruption Detection & Resilient Offline Buffering `[IMPLEMENTED]` (Backlog `[Q.9]`)

- **Purpose**: Detect unexpected tracking anomalies, distinguish hardware/network failures from intentional breaks, and guarantee zero data loss during cellular dropouts.
- **Interruption Classification Matrix**:
  | Failure Condition | Detection Mechanism | System Reaction | Session Event Logged |
  |---|---|---|---|
  | **GPS Hardware Disabled** | Android LocationManager / iOS CLLocationManager error callback | Mobile UI displays high-priority warning dialog: "GPS is turned off. Please re-enable location to continue task" | `GPS_LOST` |
  | **Location Permission Revoked** | Permission check callback (`denied` / `deniedForever`) | Mobile UI locks task execution screen; prompts worker to grant permissions in device Settings | `PERMISSION_REVOKED` |
  | **Mobile App Force-Closed / Crashed** | Process lifecycle death / unhandled exception hook | Next app launch checks for unclosed active session in local SQLite; prompts worker to resume | `OS_TERMINATION_DETECTED` |
  | **Phone Battery Depletion / Power Off** | Backend heartbeat watchdog (no pings received within 5 minutes outside break window) | Web dashboard marks worker status as `INTERRUPTED`; alert flagged in exception center | `HEARTBEAT_TIMEOUT` |
  | **Cellular Network Disconnected** | ConnectivityManager listener (`none`) | Background GPS collection continues uninterrupted; records buffered locally on disk | `NETWORK_OFFLINE` |
  | **OS Background Execution Restraint** | Battery optimization killing background service | Foreground service with persistent sticky notification bar prevents standard Android OS kills | `BACKGROUND_RESTRICTED` |
- **Resilient Offline Coordinate Buffering**:
  - When field staff traverse cellular dead zones (rural villages, underground parking basements, heavy rain attenuation), coordinates are buffered locally in encrypted SQLite/Drift tables on the mobile device.
  - Each buffered record retains its original hardware GPS sampling timestamp (`recorded_at`), accuracy, and velocity.
  - When network connectivity returns, the background sync engine transmits buffered arrays in FIFO sequence using the batch ingestion API.
  - The backend commits ingested points with original timestamps, preserving chronological route fidelity.
- **No False Claims Standard**: The mobile app and management dashboard must **never silently pretend tracking is active** when location collection has halted. If tracking fails, the UI must explicitly reflect the interrupted state.

#### Feature 18.10: Granular Permission-Based Access Control, Auditing & UU PDP Privacy Framework `[PROPOSED]` (Backlog `[Q.10]`)

- **Purpose**: Enforce rigorous data access security and strict compliance with the Indonesian Personal Data Protection Act (Undang-Undang No. 27 Tahun 2022 / UU PDP).
- **Granular RBAC / PBAC Permissions**:
  - Location visibility is **never hardcoded to static roles** (such as Manager or Owner). It is strictly governed by granular permission nodes integrated into the project's Spring Security architecture:
    - `FLEET_LIVE_VIEW`: Permission to view real-time live map locations of field employees.
    - `FLEET_HISTORY_VIEW`: Permission to search historical tracking sessions and replay recorded routes.
    - `FLEET_INDIVIDUAL_VIEW`: Permission to inspect granular breadcrumb timestamps and device telemetry of specific employees.
    - `FLEET_REPORT_VIEW`: Permission to view aggregated fleet mileage, transit times, and productivity reports.
    - `FLEET_CONFIG_MANAGE`: Permission to configure GPS collection intervals, distance thresholds, and accuracy tolerances.
    - `FLEET_BREAK_SCHEDULE_MANAGE`: Permission to configure, edit, or adjust company break schedules.
    - `VEHICLE_MANAGE`: Full CRUD permissions over vehicle registry, license plates, and maintenance records.
- **Sensitive Location Access Audit Trail (`location_access_audit_log`)**:
  - Employee real-time and historical geolocation constitutes sensitive personal data.
  - Every time an administrative user queries live employee locations, opens a historical route playback, or exports trajectory reports, an immutable record is posted to `location_access_audit_log`:
    - `id`: Bigserial.
    - `actor_employee_id`: The manager or supervisor executing the query.
    - `target_employee_id`: The field worker whose location data was accessed (or `NULL` if multi-employee map).
    - `query_type`: Enum (`LIVE_MONITOR_VIEW`, `HISTORICAL_ROUTE_PLAYBACK`, `REPORT_EXPORT`, `RAW_COORDINATE_INSPECT`).
    - `timestamp`: UTC audit timestamp.
    - `ip_address` / `user_agent`: Client session network provenance.
- **Ten Fundamental Privacy & Data Protection Principles (UU PDP Standards)**:
  1. **Strictly Purpose-Bound**: Tracking is authorized solely for operational logistics coordination, delivery verification, and field personnel safety.
  2. **No Continuous All-Day Surveillance**: Tracking is mechanically locked to active task execution and strictly prohibited off-duty.
  3. **Mandatory Break Cease**: Zero coordinates may be collected during scheduled break windows.
  4. **Worker Transparency**: Workers are always alerted via clear UI indicators and ongoing notifications when tracking is active.
  5. **Role-Restricted Visibility**: Only personnel with explicit PBAC permissions can access location feeds.
  6. **Defined Data Retention**: Active location points are retained for 90 days in primary storage, compressed into daily route polyline summaries, and purged after statutory limits.
  7. **Comprehensive Auditability**: All administrative views of location records are permanently audited.
  8. **Cryptographic Integrity**: Location payloads transmitted over TLS 1.3 with cryptographic JWT authentication and anti-spoofing checks.
  9. **Automatic Termination**: Immediate deactivation upon task completion.
  10. **Statutory Alignment**: System architecture designed to align with Indonesian UU PDP requirements, pending final legal counsel certification (ADR-13).

#### Feature 18.11: Fleet Logistics Operational Analytics & Productivity Reporting `[IMPLEMENTED & INTEGRATED]` (Backlog `[Q.11]`)

- **Purpose**: Deliver centralized operational intelligence regarding delivery efficiency, field route coverage, visit timeliness, vehicle asset utilization, and worker performance benchmarking while strictly upholding statutory ethical standards.
- **Data Architecture & DTO Specifications**:
  - `FleetAnalyticsDto`: Central analytical aggregation payload providing `startDate`, `endDate`, `totalDistanceKm`, `totalActiveHours`, `totalPausedHours`, `completedTripsCount`, `completedDeliveriesCount`, `completedSurveysCount`, `completedCollectionsCount`, `avgVisitDurationMinutes`, `avgTransitDurationMinutes`, `overallVehicleUtilizationPct`, `List<VehicleUtilizationDto> vehicleUtilization`, `List<RoleProductivityDto> roleProductivity`, `Map<String, Integer> interruptionCounts`, and `ethicalDecisionNotice`.
  - `VehicleUtilizationDto`: Individual asset utilization tracking `registrationNumber`, `brandModel`, `vehicleType`, `totalTrips`, `totalDistanceKm`, `activeHours`, `utilizationPct`, and `status`.
  - `RoleProductivityDto`: Field role productivity telemetry tracking `role` (`DRIVER`, `SURVEYOR`, `COLLECTOR`), `activeStaffCount`, `tasksCompleted`, `totalDistanceKm`, `avgTaskDurationMinutes`, `avgTransitDurationMinutes`, and `efficiencyRating`.
- **Backend API & Service Implementation (`core-backend`)**:
  - Endpoint: `GET /api/v1/fleet/analytics` with optional query parameters `storeId`, `startDate`, and `endDate` (`@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)`).
  - Service Engine (`FleetService.java`): Computes aggregated mileage from `tracking_session.total_distance_meters`, active runtimes from `active_duration_seconds`, task completions across delivery trips, credit surveys, and collection visits, along with realistic operational seed fallbacks when historical session telemetry is sparse.
  - Verified with automated tests in `FleetServiceTest.java` (`getFleetAnalytics_returnsMetricsAndEthicalNotice`).
- **Web Management Dashboard (`sms-web` / `FleetMonitoringPage.tsx`)**:
  - Dedicated **Tab 4: 📊 Fleet Analytics & Productivity** equipped with responsive date range controls (Start Date, End Date), quick preset filters (_Today_, _Last 7 Days_, _Month-to-Date_), and telemetry refresh.
  - **Export Center Action**: "Export CSV Report" generating and downloading structured operational audit reports containing metric summaries, role breakdown, vehicle utilization table, and statutory ethical notice.
  - **KPI Metric Cards**: 4 summary cards tracking Total Fleet Distance (km), Field Task Completions (Trips, Deliveries, Surveys, Collections), Average Visit & Transit Duration (minutes), and Fleet Vehicle Utilization Rate (%).
  - **Role Productivity Breakdown Table**: Visual table itemizing active staff, completed units, total mileage, average task duration, transit duration, and efficiency percentage per operational category (Driver, Surveyor, Collector).
  - **Vehicle Utilization Telematics Table**: Asset-level matrix itemizing license plate, vehicle model, type, total dispatches, cumulative distance, active operational hours, utilization %, and operational readiness status.
  - **Telematics Interruption Audit**: Visual status chips tallying scheduled break pauses, exceptional manual pauses, adaptive low-battery throttles (60s), and cellular signal loss/reconnection events.
- **Mandatory Ethical Decision Support Standard**:
  > [!CAUTION]
  > **Statutory Ethical Safeguard Notice**: GPS-derived telemetry reflects automated machine observations only and must **NEVER be used as the sole or definitive basis for punitive employee action, wage deductions, or disciplinary sanctions**. Field performance evaluations must holistically account for external operational realities, including severe weather conditions (e.g., tropical storms and flash floods), urban traffic gridlock, multi-flight heavy furniture stair climbs, cellular blind spots, and customer-side delays.
- **Test & Verification Coverage**:
  - Backend: `FleetServiceTest.java` asserting analytics aggregation, role productivity, vehicle utilization, and ethical notice presence.
  - Frontend: `FleetMonitoringPage.test.tsx` asserting Tab 4 navigation, KPI cards rendering, CSV report export button, and ethical notice presence (all 5 tests passing).
  - Production build: `tsc -b && vite build` passing cleanly with zero errors.

#### Feature 18.13: Low-Battery Adaptive GPS Throttling Engine `[IMPLEMENTED]` (Backlog `[Q.17]`)

- **Purpose**: Prevent premature shutdown of employee mobile devices during operational field tasks by dynamically scaling location collection frequency based on battery charge.
- **Behavioral Specification**:
  - **Normal Battery (>= 15%)**: Default high-fidelity collection interval of 15 seconds.
  - **Low Battery Threshold (< 15%)**: When battery level drops below 15%, `FleetTrackingNotifier` automatically reschedules collection timer to 60 seconds interval.
  - **Session Event Auditing**: Records `BATTERY_LOW_THROTTLE` event with battery level and throttled interval to backend session timeline.
  - **Battery Recovery**: When device is connected to motorcycle charger or vehicle power bank and battery reaches >= 15%, automatically restores 15s collection interval and logs `BATTERY_RECOVERED`.
  - **Transparent UI Status**: `ActiveTrackingBanner` displays a high-visibility amber warning tag: `"Low Battery (X%) • Throttled 60s"`.
  - **Verification**: Verified via unit tests in `workerapp-mobile/test/features/fleet_tracking_test.dart` (battery drop, timer reschedule, battery recovery, and banner rendering).

#### Feature 18.14: Quick Manual Pause from Ongoing System Notification `[IMPLEMENTED]` (Backlog `[Q.16]`)

- **Purpose**: Empower drivers and field workers to immediately halt GPS telemetry directly from the mobile system notification tray with a single tap during exceptional road stops or emergencies, without unlocking the phone or navigating between application screens.
- **Operational Field Problem Solved**:
  - Drivers navigating heavy traffic on motorbikes or delivery trucks with dashboard-mounted devices face extreme safety risks if forced to unlock their phones, switch apps, open task screens, and type lengthy pause justifications into modal dialogs.
  - Exceptional circumstances (police checkpoints, sudden vehicle puncture/tire blowouts, road accidents, urgent roadside repairs, family emergencies) require an instantaneous 1-tap pause mechanism.
- **Mobile Architecture & Service Implementation (`workerapp-mobile`)**:
  - **State Machine Integration (`fleet_tracking_service.dart`)**:
    - `quickNotificationPause([String? reason])`: Transitions state directly from `active` to `pausedManual`, populates default reason `"Quick Pause from System Notification (Emergency / Road Stop)"`, records `MANUAL_PAUSE` event to backend session timeline, updates notification state to paused, and dispatches `QUICK_RESUME` action button.
    - `quickNotificationResume()`: Evaluates scheduled break window (`_isWithinBreakWindow`). If current time falls within mandatory break hours (12:00–13:00), automatically enforces break pause (`pausedBreak`) with zero coordinate collection; otherwise restores `active` tracking state, clears pause reason (`clearPauseReason: true`), logs `MANUAL_RESUME` event, and restarts periodic GPS timer.
    - `handleSystemNotificationAction(String actionCode)`: Universal intent routing for system notification callbacks (`QUICK_PAUSE` and `QUICK_RESUME`).
    - Extended `FleetTrackingState`: Added `ongoingNotificationTitle`, `ongoingNotificationBody`, `ongoingNotificationActions`, and `lastNotificationActionTriggered`.
  - **UI Integration & Notification Tray Simulation (`active_tracking_banner.dart`)**:
    - Embedded dedicated high-visibility **Quick Pause** button (`ElevatedButton.icon`, Amber 800) directly beside modal pause trigger, enabling 1-tap pause without keyboard input.
    - Built **System Notification Bar Simulation Tray**: Miniature persistent dark drawer widget representing Android foreground service notification with live telematics summary and interactive action buttons (`[NOTIF PAUSE]`, `[NOTIF RESUME]`).
    - Integrated `ActiveTrackingBanner` across all field worker views: Driver Delivery Trip (`driver_trip_screen.dart`), Surveyor Task (`surveyor_task_screen.dart`), and Collector Visit (`collector_visit_screen.dart`).
- **Test & Verification Coverage**:
  - `fleet_tracking_test.dart`: 5 comprehensive tests validating immediate notification pause, break window protection upon resumption, universal intent action handling, and banner widget rendering.
  - Overall Mobile Suite: 10/10 Flutter tests passing with zero errors; `flutter analyze` clean (0 warnings).

#### Feature 18.15: Battery Temperature Safety Cutoff Engine `[IMPLEMENTED]` (Backlog `[Q.19]`)

- **Purpose**: Prevent lithium-ion battery thermal runaway, cell swelling, screen failure, and hardware destruction by automatically suspending continuous high-draw GPS hardware collection when device battery temperature exceeds 45.0°C under direct motorcycle dashboard sunlight.
- **Tropical Operational Field Context**:
  - Motorcycle couriers and delivery drivers in Jakarta and provincial retail branches routinely clamp smartphones into handlebar brackets under direct equatorial midday sunlight (ambient temps >35°C).
  - Simultaneous fast-charging from motorcycle 12V USB adapters combined with continuous high-precision GPS polling and high-frequency 4G cellular radio transmission drives phone battery temperatures rapidly past 45°C.
  - Operating lithium-polymer smartphone batteries above 45°C degrades battery chemistry exponentially, causes pouch ballooning, triggers thermal shutdowns, and poses severe burn/fire hazards for field workers.
- **Thermal Safety State Machine (`fleet_tracking_service.dart`)**:
  - **Thresholds & Hysteresis**:
    - `maxSafeBatteryTemperatureCelsius = 45.0°C`: Immediate cutoff threshold.
    - `safeRecoveryTemperatureCelsius = 40.0°C`: Recovery threshold with a 5.0°C hysteresis buffer preventing rapid oscillation.
  - **Cutoff Workflow (`updateBatteryTemperature`)**:
    1. Phone battery thermistor reports temperature > 45.0°C.
    2. `FleetTrackingNotifier` immediately cancels `_locationTimer` (stops continuous GPS chip pinging).
    3. `isThermalCutoffActive` is set to `true` in `FleetTrackingState`.
    4. Guard check in `_collectAndSendLocation()` strictly rejects any coordinate ingestion while thermal cutoff is engaged.
    5. Dispatches session audit event `BATTERY_THERMAL_CUTOFF`: `"Device battery temperature reached X°C (>45.0°C under sunlight). GPS collection suspended for hardware thermal safety."`
    6. Updates ongoing foreground service notification to: `"SMS Telematics Suspended (Overheating) • Battery X°C (>45°C). GPS suspended for device safety."`
  - **Recovery Workflow**:
    1. Driver moves into shaded stop or attaches sunshade, battery temperature cools to <= 40.0°C.
    2. `isThermalCutoffActive` clears to `false`.
    3. Checks scheduled break and manual pause constraints: if within lunch break window, prioritizes break pause; otherwise restarts adaptive location timer (`15s` or `60s`).
    4. Dispatches session audit event `BATTERY_THERMAL_RECOVERED` and restores live notification tray to active.
- **UI Safety Alert & Notification Tray (`active_tracking_banner.dart`)**:
  - Renders a high-visibility crimson alert banner (`#FEF2F2` / red text `#DC2626` with `Icons.whatshot`) alerting the worker:
    `"Thermal Cutoff Active (X°C > 45°C) • Continuous GPS pinging suspended to prevent device battery overheating under direct sunlight. Auto-resumes when cooled <=40°C."`
  - Live temperature readout (`${tracking.batteryTemperatureCelsius.toStringAsFixed(0)}°C`) displayed alongside battery % and speed in active banner subtitle.
- **Verification & Test Coverage**:
  - `fleet_tracking_test.dart`: Automated test verifying thermal cutoff trigger at 46.2°C, timer cancellation, notification body update, and safe recovery at 38.5°C.
  - Widget test verifying crimson thermal cutoff alert banner rendering.
  - Overall mobile suite: 11/11 Flutter tests passing with zero errors; `flutter analyze` 100% clean.

#### Feature 18.16: Automated Fleet Asset Servicing & KIR/STNK Expiry Alert Engine `[IMPLEMENTED]` (Backlog `[Q.21]`)

- **Purpose**: Prevent legal impoundment, statutory road violations, commercial operating suspensions, and catastrophic mechanical breakdowns by automatically monitoring fleet vehicle registration (STNK), commercial roadworthiness inspection (KIR), and routine odometer maintenance milestones.
- **Indonesian Regulatory & Operational Context**:
  - `STNK (Surat Tanda Nomor Kendaraan)`: Samsat annual vehicle road tax and 5-year registration validity. Operating delivery trucks or blind vans with expired STNK risks police impoundment and delivery seizure under Indonesian traffic laws.
  - `KIR (Uji Berkala Kendaraan Bermotor)`: Mandatory semi-annual commercial vehicle roadworthiness inspection conducted by Dinas Perhubungan (Dishub). Operating commercial logistics trucks without valid KIR subjects company to administrative fines and operating license revocation.
  - `Periodic Preventative Maintenance`: Commercial delivery vans and flatbed trucks undergo heavy stop-and-go urban duty cycles. Routine engine oil changes, air/oil filter replacements, and brake pad inspections are mandated every 10,000 km (`service_interval_km`) or 6 months.
- **Database Schema Migration (`V27__fleet_maintenance_reminders.sql`)**:
  - Added maintenance columns to `vehicle` table:
    - `last_service_odometer_km INT DEFAULT 0`: Odometer reading recorded at last preventative servicing.
    - `last_service_date DATE`: Date when last routine maintenance was conducted.
    - `service_interval_km INT DEFAULT 10000`: Milestone interval threshold (default 10,000 km).
  - Seeded realistic regulatory test data across sample Jakarta fleet vehicles:
    - `B 9283 TXT` (Daihatsu Gran Max): STNK expiring in 15 days, KIR expiring in 6 days, odometer 34,200 km (last serviced 22,000 km -> service due!).
    - `B 1042 SXZ` (Isuzu Traga): STNK expiring in 5 days (Critical), KIR expiring in 45 days.
    - `B 3821 PQR` (Mitsubishi L300): STNK expired 3 days ago (Expired), KIR expiring in 20 days.
- **Backend Architecture & Scheduled Scanning (`FleetService.java`)**:
  - **Scheduled Daily Cron Scanner**:
    - `@Scheduled(cron = "0 0 7 * * *")` running automatically at 07:00 AM WIB every morning to evaluate all active fleet vehicles.
    - Generates structured alerts for branch logistics coordinators:
      - `STNK_EXPIRING`: If days remaining < 0 (`EXPIRED`), <= 7 (`CRITICAL`), <= 30 (`WARNING`).
      - `KIR_EXPIRING`: If days remaining < 0 (`EXPIRED`), <= 7 (`CRITICAL`), <= 30 (`WARNING`).
      - `SERVICE_DUE`: If `odometer_km - last_service_odometer_km >= service_interval_km`.
  - **REST Endpoints**:
    - `GET /api/v1/fleet/maintenance-alerts`: Returns active array of `FleetMaintenanceAlertDto` filtered by optional store/branch.
    - `POST /api/v1/fleet/vehicles/{id}/service-log`: Logs routine servicing, updates `last_service_odometer_km`, `last_service_date`, `service_interval_km`, and resets service due flag.
  - **DTO Enhancements (`VehicleDto`)**:
    - Dynamically computes `stnkDaysRemaining`, `kirDaysRemaining`, and boolean `isServiceDue`.
- **Management Web SPA (`FleetMonitoringPage.tsx`)**:
  - **Maintenance & Expiry Alert Banner**:
    - Rendered prominently in Tab 2 (Vehicle Fleet Registry) when alerts exist.
    - Visual indicators for Critical, Warning, and Expired severities.
    - Quick-filter chips: `All Fleet | Expiring Soon (<30d) | Service Due`.
  - **Vehicle Registry Table Badges**:
    - Odometer column: Odometer value + `Service Due` chip with wrench icon or last serviced mileage caption.
    - STNK column: Expiry date + badge showing days remaining (`Critical (6d)`, `Expiring (15d)`, or `Expired`).
    - KIR column: Expiry date + badge showing days remaining.
  - **Record Vehicle Service Dialog**:
    - Allows branch coordinators to log periodic maintenance with service date, odometer reading, custom service interval, and workshop notes, resetting the service milestone timer.
- **Verification & Test Coverage**:
  - Backend: 9/9 unit tests passing in `FleetServiceTest.java`.
  - Web: 5/5 Vitest component tests passing in `FleetMonitoringPage.test.tsx`.
  - Production build: `npm run build` passing with zero errors.

#### Feature 18.17: Dynamic Geofence Proximity Alert Engine `[IMPLEMENTED]` (Backlog `[Q.18]`)

- **Purpose**: Automatically alert field delivery drivers and collectors when they arrive within 300 meters of an assigned customer destination, prompting advance handover preparation, reducing doorstep turnaround transit delay, and logging arrival timestamps for transparent SLA auditing.
- **Dynamic Multi-Target Geofencing Architecture (`fleet_tracking_service.dart`)**:
  - `GeofenceTarget`: Models destination stop coordinates (`targetLatitude`, `targetLongitude`), customer title, delivery address, proximity radius (`300.0m`), and trigger state (`isTriggered`, `triggeredAt`).
  - Supports multi-drop delivery trips (sequentially monitoring pending delivery orders), single-point field collection visits, and customer property survey addresses.
  - Haversine Distance Calculation: Automatically evaluates real-time GPS coordinates against untriggered geofence targets on every location update cycle.
  - Proximity Trigger Logic:
    - Distance <= 300.0m threshold: Fires `GeofenceProximityAlert`.
    - Updates ongoing notification: `"🎯 SMS Proximity Alert (Within Xm)"` + `"Approaching Customer: [Name] - [Address]. Prepare delivery handover."`.
    - Actions tray includes 1-tap `DISMISS_PROXIMITY_ALERT`.
    - Dispatches session audit event to backend: `GEOFENCE_PROXIMITY_ENTERED` with distance, coordinates, and destination identifier.
    - Idempotency & Hysteresis: Sets `isTriggered = true` on the destination target to prevent repeated alert spamming while dwelling in the geofence zone.
- **Visual Arrival UI Card (`active_tracking_banner.dart`)**:
  - High-visibility Emerald Arrival Card (`#ECFDF5` / green `#059669` / border `#10B981`) rendered at the top of the driver / field worker screen upon entering the 300m perimeter.
  - Displays dynamic distance readout (`Xm away`), customer name, destination address, and 1-tap `Dismiss` button.
- **Integration across Field Tasks**:
  - Delivery Trips (`driver_trip_screen.dart`): Seeds all pending delivery stops as active geofence targets upon trip load.
  - Collection Visits (`collector_visit_screen.dart`): Seeds debtor customer address and coordinates.
  - Survey Tasks (`surveyor_task_screen.dart`): Seeds survey verification location.
- **Backend & Telematics Integration**:
  - Added `GEOFENCE_PROXIMITY_ENTERED`, `BATTERY_THERMAL_CUTOFF`, `BATTERY_THERMAL_RECOVERED` to `TrackingEventType` enum in `core-backend` and `sms-web`.
- **Verification & Test Coverage**:
  - 8/8 tests in `fleet_tracking_test.dart` passing (including distance verification, alert triggering, dismissal, and widget rendering).
  - 13/13 tests across full mobile test suite passing.
  - `flutter analyze` 100% clean (0 issues).
  - Backend and web builds passing cleanly.

#### Feature 18.18: Master Data Truck with 1-to-1 Driver Assignment, STNK 1-Month Tax Due Alert & License Plate Change History `[IMPLEMENTED]` (Backlog `[Q.32]`)

- **Purpose**: Provide a dedicated operational truck master data management screen, enforce strict one-to-one truck-driver custody relationships, monitor annual vehicle tax due dates (Pajak STNK 1 Tahunan) with prominent 1-month advance warnings, and record an immutable audit history of all license plate changes (e.g. 5-year Samsat plate renewals).
- **Domain Invariant & Architecture**:
  - Purely money management and operational asset governance (strictly non-banking).
  - Single Source of Truth: Built directly on top of `core-backend` with Flyway database migration `V38__truck_master_and_driver_assignment.sql`.
- **Key Features Implemented**:
  1. **Dedicated Master Data Truck Menu (`/trucks`)**:
     - Accessible from navigation under Operations and Ctrl+K Quick Command Palette.
     - Overview KPI cards displaying Total Trucks, 1-to-1 Assigned vs Unassigned Drivers, Tax Due in 1 Month (Urgent), Tax Overdue, and 5-Year Plate Expirations.
     - Quick filter chips: `All`, `Tax Due in 1 Month`, `Tax Overdue`, `Plate Renewal Due`, and `Driver Unassigned`.
     - Text search across plate numbers, brand/models, and driver names, with store/branch filtering.
  2. **Strict 1-to-1 Driver Linking (`@OneToOne`)**:
     - Enforced at database level via `UNIQUE` constraint on `vehicle.driver_employee_id REFERENCES employee(id)`.
     - Validated in `FleetService`: checks that driver exists, is active, and is not already assigned to any other truck.
     - Dedicated assign/unassign actions and dialog displaying active drivers with current allocation status.
  3. **STNK Annual Tax Due Date Monitoring (1-Month Due Warning)**:
     - `tax_due_date` tracked for annual motor vehicle tax (PKB).
     - Automated calculation of `taxDaysRemaining` and `taxDueStatus` (`OVERDUE`, `DUE_IN_ONE_MONTH`, `UP_TO_DATE`).
     - Distinct amber warning badges when tax is due within 30 days (1-month window), allowing logistics managers to settle Samsat renewals without late fee penalties.
     - Nightly automated cron scanner generates `TAX_EXPIRING` (Warning) and `TAX_EXPIRED` (Critical) fleet maintenance alerts.
  4. **License Plate Change & Audit Trail (`vehicle_plate_history`)**:
     - Interactive `Change License Plate` dialog supporting 5-Year STNK Renewal (Ganti Kaleng), damaged/lost plates, and regional mutations.
     - Option to auto-extend 5-year STNK validity (+5 years) and annual tax due date (+1 year) upon renewal.
     - Immutable historical ledger tracking `old_registration_number`, `new_registration_number`, `change_date`, `reason`, `notes`, and employee who authorized the change.
     - Full audit timeline accessible via `Plate History` modal.
- **Verification & Test Coverage**:
  - Backend: 13/13 JUnit tests passing in `FleetServiceTest.java`.
  - Frontend: 4/4 Vitest tests passing in `TruckListPage.test.tsx`.
  - Production build: `npm run build` passing cleanly with zero errors.

#### Feature 18.19: Truck Service Logs, GPS Delivery Distance Analytics & Monthly Health Inspection Checklists `[IMPLEMENTED]` (Backlog `[Q.36]`)

- **Purpose**: Empower logistics dispatchers, workshop mechanics, and fleet managers with complete operational lifecycle intelligence directly inside the Master Data Truck menu (`/trucks`): tracking maintenance costs & workshop invoices, computing delivery travel mileage from actual delivery GPS tracking sessions, and executing structured monthly multi-point roadworthiness inspections.
- **Domain Invariants & Non-Banking Money Management**:
  - Strictly non-banking: Captures operational vehicle maintenance costs (`cost_amount` numeric 15,2) for fleet expense budgeting and ledger reconciliation; handles no consumer payment processing or banking rails.
  - Odometer Synchronization: Recording a routine service automatically updates the vehicle's `last_service_odometer_km`, `last_service_date`, and advances the current vehicle odometer.
  - Automatic Maintenance Flagging: Submitting a monthly health check with rating `UNFIT_FOR_ROAD` automatically updates vehicle status to `MAINTENANCE`, preventing unroadworthy trucks from being dispatched on customer delivery routes.
  - GPS Telematics Aggregation: Distance travelled is calculated exclusively from completed delivery trips (`tracking_session` with `total_distance_meters` linked to the vehicle), providing verified operational delivery mileage independent of manual odometer discrepancies.
- **Database Architecture (`V39__truck_service_logs_and_health_checks.sql`)**:
  - `vehicle_service_log`: Stores historical workshop maintenance logs (`vehicle_id`, `service_date`, `service_type`, `odometer_km`, `service_center`, `cost_amount`, `invoice_number`, `parts_replaced`, `description`, `performed_by_employee_id`).
  - `vehicle_monthly_health_check`: Stores monthly multi-point inspections (`vehicle_id`, `check_date`, `check_month`, `inspector_employee_id`, `inspector_name`, `overall_rating`, `engine_oil_status`, `radiator_coolant_status`, `brake_fluid_status`, `brake_condition`, `front_tire_condition`, `rear_tire_condition`, `tire_pressure_psi`, `battery_condition`, `headlamps_and_signals_status`, `horn_and_wipers_status`, `safety_equipment_present`, `apar_expiry_date`, `cargo_box_condition`, `odometer_reading_km`, `notes`, `action_required`).
- **REST Endpoints (`FleetController.java`)**:
  - `GET /api/v1/fleet/vehicles/{id}/service-logs`: List maintenance history ordered by service date descending.
  - `POST /api/v1/fleet/vehicles/{id}/service-logs`: Record new service log and synchronize vehicle odometer.
  - `GET /api/v1/fleet/vehicles/{id}/monthly-health-checks`: Retrieve all monthly roadworthiness inspections.
  - `POST /api/v1/fleet/vehicles/{id}/monthly-health-checks`: Record monthly inspection; auto-grounds vehicle to `MAINTENANCE` if `UNFIT_FOR_ROAD`.
  - `GET /api/v1/fleet/vehicles/{id}/travel-distance`: Compute cumulative delivery distance (km), current month delivery distance (km), completed delivery trips count, odometer since last service, service due status, and recent delivery trips log.
- **Frontend User Experience (`TruckDetailsDialog.tsx` & `TruckListPage.tsx`)**:
  - Integrated "Service Logs, Distance & Monthly Inspections" action button on every truck table row.
  - **Tab 1: Service Logs**: Summary KPI cards (Total Maintenance Cost in IDR, Last Service Date & Odometer, Service Interval status), interactive service history table, and modal dialog to record new service log with cost amount, invoice number, bengkel workshop name, and parts replaced.
  - **Tab 2: Travelled Distance (GPS)**: Metric KPI cards (All-time delivery distance km, current month distance km, completed delivery trips count, KM since last service), and breakdown table of recent delivery trips with task codes, drivers, duration, distance, and timestamps.
  - **Tab 3: Monthly Health Check**: Color-coded rating badges (`HEALTHY` green, `ATTENTION_NEEDED` yellow, `UNFIT_FOR_ROAD` red), multi-point physical checklist overview (engine oil, radiator coolant, brake pads, tire tread/PSI, battery health, headlamps, APAR expiry, cargo box condition, corrective action notes), and modal dialog to submit standard monthly inspection checklist.
- **Verification & Test Coverage**:
  - Backend: 16/16 JUnit tests passing in `FleetServiceTest.java`.
  - Frontend: 5/5 Vitest tests passing in `TruckListPage.test.tsx`.
  - Production build: `npm run build` passing cleanly with zero errors.

#### Feature 18.20: Driver License (SIM) Registration, 30-Day Expiry Monitoring & Automated Renewal Notifications `[IMPLEMENTED]` (Backlog `[Q.40]`)

- **Purpose**: Enable delivery and fleet truck drivers to record and maintain their official driving licenses (Surat Izin Mengemudi / SIM: SIM A, SIM B1, SIM B1 Umum, SIM B2, SIM B2 Umum, SIM C) within the SMS operations registry. System monitors license expiry dates and dispatches automated proactive notifications (in-app and mobile push) when a driver's license enters the 30-day (1-month) expiration window or expires, guaranteeing legal road compliance during Samsat traffic police checks.
- **Domain Invariants & Non-Banking Operational Governance**:
  - Strictly non-banking: Operational asset and personnel compliance governance tracking license validity periods and renewal notifications; handles zero payment transactions or banking rails.
  - Multi-License Support: A driver can register multiple driving licenses (e.g. SIM B1 Umum for commercial delivery trucks and SIM C for express motorcycle dispatches) with a unique constraint on `(employee_id, license_type)`.
  - Proactive Daily Scan & Spam Prevention: Daily scheduled cron job (`0 0 7 * * *`) scans all licenses expiring within 30 days. To prevent spamming the driver, notifications are throttled to at most once every 24 hours per license, updating `last_notification_sent_at`.
  - Realtime Multi-Channel Dispatch: Leverages `NotificationService.create(...)` which writes persistent in-app notifications (`notification` and `notification_recipient`) and dispatches realtime Web Push / Mobile alerts via `PushNotificationDispatcher`.
- **Database Architecture (`V40__driver_license_and_expiry_notifications.sql`)**:
  - `driver_license` table:
    - `id`: UUID PRIMARY KEY
    - `employee_id`: UUID NOT NULL REFERENCES `employee(id)` ON DELETE CASCADE
    - `license_number`: VARCHAR(50) NOT NULL
    - `license_type`: VARCHAR(30) NOT NULL (`SIM_A`, `SIM_B1`, `SIM_B1_UMUM`, `SIM_B2`, `SIM_B2_UMUM`, `SIM_C`)
    - `issue_date`: DATE
    - `expiry_date`: DATE NOT NULL
    - `issuing_police_office`: VARCHAR(150) (e.g. Satpas Daan Mogot)
    - `photo_url`: VARCHAR(500)
    - `notes`: VARCHAR(500)
    - `last_notification_sent_at`: TIMESTAMPTZ
    - Indexes on `employee_id`, `expiry_date`, and `license_type`.
- **Backend Services & REST Endpoints (`FleetService.java` & `FleetController.java`)**:
  - `GET /api/v1/fleet/drivers/{employeeId}/licenses`: Retrieve all SIM permits for a driver with days remaining and validity status.
  - `POST /api/v1/fleet/drivers/{employeeId}/licenses`: Register new license; automatically triggers immediate reminder if license already expires within 30 days.
  - `PUT /api/v1/fleet/driver-licenses/{licenseId}`: Update license details (e.g., renewed expiry date after 5-year Samsat extension).
  - `DELETE /api/v1/fleet/driver-licenses/{licenseId}`: Remove license entry.
  - `POST /api/v1/fleet/driver-licenses/{licenseId}/send-reminder`: Manual one-click trigger for fleet managers to ping driver with renewal reminder.
  - `GET /api/v1/fleet/driver-licenses/expiring`: List all fleet licenses expiring within 30 days across all active drivers.
  - `POST /api/v1/fleet/driver-licenses/scan-expirations`: On-demand scan & dispatch endpoint.
  - Enriched `getAvailableDrivers`: Includes primary license number, type, expiry date, days remaining, and status (`VALID`, `EXPIRING_SOON`, `EXPIRED`, `NOT_RECORDED`).
- **Frontend Management UI (`DriverLicenseDialog.tsx` & `TruckListPage.tsx`)**:
  - Dedicated "Driver License (SIM)" badge button on every assigned driver cell in `TruckListPage.tsx`.
  - Comprehensive `DriverLicenseDialog.tsx` modal:
    - Permits table displaying SIM number, type chip, expiry date, validity status badge (`VALID` green, `EXPIRING_SOON` amber with remaining days, `EXPIRED` red), issuing Satpas office, and timestamp of last notification sent.
    - One-click "Send Expiry Reminder" notification button with instant snackbar confirmation.
    - Form dialog to register or edit SIM cards with full Golongan SIM options and date pickers.
  - Enhanced driver assignment dropdowns showing license validity alongside driver availability, preventing dispatchers from assigning drivers with expired licenses.
- **Verification & Test Coverage**:
  - Backend: 19/19 JUnit tests passing in `FleetServiceTest.java`.
  - Frontend: 6/6 Vitest tests passing in `TruckListPage.test.tsx`.
  - Production build: `npm run build` passing cleanly with zero errors.

#### Feature 18.12: Integration Matrix With Existing Modules `[IMPLEMENTED]` (Backlog `[Q.1]`, `[Q.8]`)

- **Cross-Module Integration & Data Flow Architecture**:
  The Logistics & Fleet Management System is designed to integrate cleanly with existing SMS business modules without duplicating master data or workflows:

  | Existing SMS Module                    | Integration Mechanism & Shared Data Boundaries                                                                                                                                                                                                                                                                             |
  | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | **Employee Management** (`identity`)   | Consumes employee master ID, assigned branch store, active status, and employee category (`DRIVER`, `SURVEYOR`, `COLLECTOR`). Enforces strict exclusion of `SALESPERSON` from tracking.                                                                                                                                    |
  | **Customer Management** (`customer`)   | Consumes customer delivery address snapshots, geocodes, and visit destinations for route planning and proximity calculation.                                                                                                                                                                                               |
  | **Survey Management** (`survey`)       | Binds survey tracking session to `survey.id`. Coordinates and access profiles (`destination_latitude`, `destination_longitude`, `alley_width_meters`, `stair_clearance_meters`, `gate_access_notes`) collected during credit surveys are stored in `survey` and reused by Delivery Management for turn-by-turn navigation. |
  | **Sales Order Management** (`sales`)   | Orders requiring delivery provide destination addresses, item quantities, and customer fulfillment grouping preferences (`COMPLETE` vs `PARTIAL`).                                                                                                                                                                         |
  | **Delivery Management** (`delivery`)   | Delivery dispatchers group fulfillment orders into multi-drop `DeliveryTrip` routes. A delivery trip links 1:1 to a `TrackingSession` and references assigned `vehicle_id`. Individual DO deliveries do not split tracking.                                                                                                |
  | **Collection Management** (`finance`)  | Field collection tasks link to collection tracking sessions. Visit destinations are verified against customer billing address. Cash custody handover triggers follow standard two-stage custody protocol (`HELD_BY_COLLECTOR` → `VERIFIED_BY_CASHIER`).                                                                    |
  | **Inventory Management** (`inventory`) | Product dimensions, weight, and serialized `StockUnit` allocations determine vehicle payload capacity constraints (`max_payload_kg`, `max_volume_cbm`).                                                                                                                                                                    |

---

---

---

### Feature 19: Integrated E-Commerce Platform & Omnichannel Storefront `[IMPLEMENTED]` (Backlog `[P.1]`, `[P.2]`, `[P.4]`, `[P.6]`, `[P.7]`, `[P.11]`, `[P.12]`)

#### Feature 19.1: Consolidated Backend Architecture in `core-backend`

- **Architectural Topology & Single Source of Truth**:
  - In accordance with the Single Backend Invariant, all e-commerce storefront operations are consolidated directly inside `core-backend` (Spring Boot Java 21) under `com.sms.storefront`. No separate backend microservice or duplicate database is deployed.
  - Database schema evolution via Flyway migration `V25__storefront_ecommerce.sql`:
    - `storefront_customer`: Self-registered e-commerce customer identity records with phone number uniqueness, bcrypt hashed credentials, and verification status.
    - `storefront_address`: Multi-address customer delivery directory with geocodes (`latitude`, `longitude`), recipient names, and delivery access notes.
    - `storefront_payment_method`: Master registry of 9 configurable payment methods (`QRIS`, `BANK_TRANSFER_VA`, `COD_DRIVER`, `CASH_STORE`, `IN_HOUSE_CREDIT`, `THIRD_PARTY_FINANCING`, `E_WALLET`, `CREDIT_CARD`, `BANK_TRANSFER_DIRECT`) with activation switches and credit approval flags.
    - `customer_cart` & `customer_cart_item`: Server-side persistent customer shopping cart instances with quantity tracking, variant references, and auto-cleanup.
    - `fulfillment_group` & `fulfillment_group_item`: Decoupled multi-group delivery entity (1 Sales Order : N Fulfillment Groups) supporting split fulfillment and mixed fulfillment methods.
    - `sales_order` schema expansion: Added `order_source` (`ONLINE_WEB`, `ONLINE_APP`, `EMPLOYEE`), `fulfillment_preference` (`COMPLETE`, `PARTIAL`), `required_deposit_amount`, `deposit_paid`, and `payment_method`. Made `salesperson_id` optional to support self-service digital orders.

#### Feature 19.2: Unified Sales Logic & Commercial Availability Engine

- **Strict Omnichannel Business Invariant**:
  - Online self-service orders created via `ecommerce-web` or `ecommerce-mobile` execute through the identical sales order validation rules, pricing engines, and inventory reservation logic as employee-assisted showroom transactions.
  - **Decoupled Commercial Availability (`StorefrontCatalogService`)**: Commercial availability is decoupled from raw physical warehouse stock. Products with zero on-hand `StockUnit` records are automatically presented as `AVAILABLE_PROCUREMENT_REQUIRED` (Indent) with clear estimated supplier lead times (e.g. 3–5 working days), preventing artificial out-of-stock drop-offs while maintaining absolute inventory truth.

#### Feature 19.3: Dual-Axis Fulfillment Choice Engine

- **Orthogonal Fulfillment Decisions**:
  - The checkout workflow cleanly separates two fundamentally independent customer choices:
    - **Decision A — Fulfillment Completeness**:
      - `PARTIAL` (Kirim Bertahap): If the order contains both ready-stock and indent items, the system automatically partitions the order into two distinct `FulfillmentGroup` entities: Group #1 (Ready stock items immediately queued for packing/delivery) and Group #2 (Indent items queued for supplier PO procurement).
      - `COMPLETE` (Kirim Sekaligus): All order items are held in a single `FulfillmentGroup` until backordered goods arrive at the central showroom/warehouse.
    - **Decision B — Fulfillment Method**:
      - `DELIVERY`: Dedicated store fleet dispatch with destination address verification and access notes.
      - `PICKUP`: Direct customer collection at a specified branch showroom without delivery fees.

#### Feature 19.4: Deposit-First Procurement Authorization Gate

- **PO Generation Lockout**:
  - Supplier purchase orders for customer-driven backorders cannot be issued until customer payment confirmation is recorded.
  - When an order containing indent items is submitted, `StorefrontCheckoutService` automatically calculates a configurable 30% down payment (`required_deposit_amount`).
  - Line items in Group #2 are assigned `procurement_status = 'AWAITING_DEPOSIT'`. Once customer payment verification is received, procurement status transitions to `READY_FOR_PO`, legally and operationally unblocking procurement staff.

#### Feature 19.5: Configurable Payment Methods & Idempotent Reconciliation

- **9 Supported Payment Methods**:
  - Digital self-service methods: QRIS dynamic string generation with countdown timer, Virtual Account (BCA/Mandiri/BRI) with one-click copy, and E-Wallets.
  - Physical & cash methods: Store delivery driver cash on delivery (`COD_DRIVER`), cash payment at showroom pickup (`CASH_STORE`), and direct bank transfer.
  - Financing methods: In-house store credit facility (strictly gated by physical field survey approval and assigned credit limit; never auto-granted) and third-party installment financing (Kredivo/Akulaku).
  - Admin toggleable via database config without code re-deployment.
  - Simulated payment webhook endpoint (`POST /api/v1/storefront/orders/{number}/simulate-payment`) allowing instant verification, DP confirmation, and procurement unblocking during testing and demo sessions.

#### Feature 19.6: Customer E-Commerce Web Application (`ecommerce-web`)

- **Technology Stack & Architecture**:
  - Modern single-page application built with React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, and Axios.
  - Fully featured customer journey:
    - `HomePage`: Hero banner, trust assurance chips, featured showroom goods, responsive category navigation.
    - `CatalogPage`: Dynamic keyword search, category filters, and commercial availability filter pills (`Semua`, `Ready Stock`, `Indent / PO`).
    - `ProductDetailPage`: High-resolution gallery, commercial availability indicator with lead time guarantee, variant price resolution, and dual-action buttons (Tambah Keranjang / Beli Sekarang).
    - `CartPage`: Real-time item quantity steppers, subtotal, 11% PPN calculation, and empty cart state.
    - `CheckoutPage`: Customer contact form, interactive Dual-Axis fulfillment selectors (Decision A & Decision B), 9 configurable payment methods selector, and deposit-first procurement warning card.
    - `OrderSuccessPage`: Order number, copyable VA number, QRIS national barcode visualizer, fulfillment groups breakdown, and instant payment simulation trigger.
    - `OrderTrackingPage`: Public self-service order tracking with milestone progress timeline and fulfillment group status badges.
  - Offline-resilient API client with mock fallbacks for network disconnect scenarios. Verified by `npm run build` production compilation.

#### Feature 19.7: Customer E-Commerce Mobile Application (`ecommerce-mobile`)

- **Technology Stack & Architecture**:
  - Cross-platform native mobile application built with Flutter 3.44, Dart 3.12, Riverpod 3 (using modern `Notifier` and `NotifierProvider`), Dio HTTP client, and Material 3 design.
  - Application screens:
    - `MainNavScreen`: Fixed 5-tab bottom navigation (Beranda, Katalog, Keranjang, Lacak, Akun) with real-time cart badge counter.
    - `HomeScreen`: Showroom hero banner, value proposition badges (100% Asli, Kurir Toko, Ambil Cabang), and 2-column product grid with quick-buy buttons.
    - `CatalogScreen`: Search bar, availability choice chips, and product cards with stock status badges.
    - `ProductDetailScreen`: Hero imagery, Indent vs Ready pill, warranty and fleet assurances, quantity counter, and bottom action bar.
    - `CartScreen`: Multi-item shopping list with quantity steppers, delete actions, PPN 11% tax calculation, and checkout navigation.
    - `CheckoutScreen`: Recipient inputs, Decision B cards (Kirim Armada vs Ambil Cabang), Decision A cards (Kirim Bertahap vs Kirim Sekaligus), Deposit-First policy alert, and 9 payment methods.
    - `OrderSuccessScreen`: Animated checkmark, QRIS code canvas, VA account copy helper, group breakdown, and "Simulasikan Pembayaran Lunas" button.
    - `OrderTrackingScreen`: Sales Order lookup field, 4-stage visual milestone tracker, and group line item inspection.
    - `ProfileScreen`: Customer profile, transparent In-House Credit limit facility overview (Rp 15.000.000 limit, Rp 0 used), address book link, and customer care shortcuts.
  - Verified by `flutter analyze` (0 warnings/issues) and `flutter test` (all smoke widget tests passed).

---

#### Feature 19.8: Mobile Push Notification Engine (FCM / APNs Milestones) `[IMPLEMENTED]` (Backlog `[P.13]`)

- **Push Notification Engine Architecture & Device Registry**:
  - Implemented high-reliability push notification pipeline across backend (`core-backend`) and customer mobile app (`ecommerce-mobile`) via Flyway migration `V26__storefront_push_notifications.sql`.
  - Database schema:
    - `customer_device_token`: Maps customer UUID to unique hardware device push tokens (`device_token`), platform target (`ANDROID`, `IOS`, `WEB`), device model metadata, and active heartbeat timestamps. Supports multi-device customer households.
    - `storefront_push_notification_log`: Authoritative persistence log of all dispatched milestone notifications with delivery status (`SENT`, `DELIVERED`, `FAILED`), read status (`is_read`, `read_at`), structured JSON metadata (`payload_data`), and order linkage.
  - Core service: `StorefrontPushNotificationService` dispatches targeted or multi-device push notifications and aggregates customer notification inbox history.
- **Four Real-Time Order Lifecycle Milestones**:
  1. **`DEPOSIT_CONFIRMED` (Pembayaran Terkonfirmasi)**: Triggered immediately when customer down payment (30% DP) or full payment is verified. Notifies the customer that financial gating has passed, their order is committed, and inventory reservation/supplier procurement is initiated.
  2. **`PO_PLACED` (Pengadaan Dimulai)**: Triggered when procurement staff or automated demand consolidation officially issues a Purchase Order to the distributor for backordered indent items. Provides reassurance that the estimated delivery window is active.
  3. **`DRIVER_EN_ROUTE` (Armada Toko Dalam Pengantaran)**: Triggered when the store fleet delivery driver departs with the customer's fulfillment group, providing real-time transit awareness.
  4. **`STORE_PICKUP_READY` (Pesanan Siap Diambil di Cabang)**: Triggered when items for a store pickup fulfillment group have arrived and are staged at the selected showroom branch, prompting the customer to visit with their order number.
- **Mobile Frontend UI & In-App Notification Hub**:
  - `NotificationScreen`: Interactive inbox displaying timestamped milestone cards with milestone-colored avatars (Emerald for Payment, Sky Blue for PO, Amber for Delivery Driver, Purple for Store Pickup).
  - Categorized filter chips: _Semua_, _Belum Dibaca_, _Pembayaran_, and _Pengiriman / Ambil_.
  - Seamless deep-linking: Each card features a one-tap "Lacak Pesanan" shortcut that immediately opens `OrderTrackingScreen` pre-populated with the target order number.
  - Real-time unread counter badge: Integrated into `HomeScreen` top navigation AppBar with live badge listener.
  - Simulation webhook integration: Simulated payment confirmation in `OrderSuccessScreen` automatically dispatches `DEPOSIT_CONFIRMED` push notification into the customer's live notification feed.

#### Feature 19.9: Multi-Resolution Image CDN & WebP Optimization Pipeline `[IMPLEMENTED]` (Backlog `[P.14]`)

- **Optimization Architecture & Preset Standardization**:
  - Implemented end-to-end multi-resolution image delivery and next-gen WebP compression pipeline across backend (`core-backend`), web storefront (`ecommerce-web`), and mobile app (`ecommerce-mobile`).
  - Standardized image presets:
    - `THUMBNAIL` (150x150, q=80): Cart drawer items, checkout breakdown, tabular order history previews.
    - `CARD` (400x400, q=82): 2-column mobile catalog grids, category browsing, and search results.
    - `HERO` (1000x1000, q=88): High-resolution product detail galleries and zoom inspections.
  - Generates ~70% byte payload reduction over raw unoptimized JPEGs/PNGs, significantly reducing mobile cellular data consumption and speeding up First Contentful Paint (FCP).
- **Backend Optimization Gateway (`core-backend`)**:
  - `ImageOptimizationService`: Resolves dynamic edge CDN transformation URLs compatible with Cloudflare Images, Imgix, Unsplash, Supabase Storage transforms, and SMS transform gateway.
  - `ImageOptimizationController`:
    - `GET /api/v1/storefront/images/responsive-set`: Returns structured JSON metadata with URLs for all 3 presets and formatted `srcSetWebp`.
    - `GET /api/v1/storefront/images/transform`: Proxy endpoint redirecting client requests to optimized edge assets with HTTP 302 and immutable 30-day cache headers (`Cache-Control: public, max-age=2592000, immutable`).
- **Web Frontend Responsive Image Engine (`ecommerce-web`)**:
  - `imageOptimizer.ts`: Preset resolver and HTML5 `srcSet` generator (`150w`, `400w`, `1000w`).
  - `ResponsiveImage.tsx`: Native `<picture>` component delivering modern WebP with automatic fallback, lazy loading (`loading="lazy"`), asynchronous decoding (`decoding="async"`), and graceful SVG error placeholders to prevent Cumulative Layout Shifts (CLS).
  - Integrated across `ProductCard.tsx`, `ProductDetailPage.tsx`, `CartPage.tsx`, and `CartDrawer.tsx`.
- **Mobile Frontend Dimension Adapter (`ecommerce-mobile`)**:
  - `ImageOptimizer` (`lib/core/image_optimizer.dart`): Dart image resolver binding URLs to exact preset dimensions and WebP encoding.
  - Used in `HomeScreen` product cards, `CatalogScreen` search results, `ProductDetailScreen` hero gallery, and `CartScreen` items, preventing mobile GPU memory exhaustion and low-bandwidth stalling.

#### Feature 19.10: BlurHash & Low-Quality Image Placeholders (LQIP) `[IMPLEMENTED]` (Backlog `[P.20]`)

- **Zero-Latency Perceived Performance & CLS Elimination**:
  - Implemented instant, zero-latency Low-Quality Image Placeholders (LQIP) generating compact base64-encoded SVG shimmers with Gaussian blur filters across backend (`core-backend`), web storefront (`ecommerce-web`), and mobile app (`ecommerce-mobile`).
  - Completely eliminates Cumulative Layout Shift (CLS) and empty blank boxes while high-resolution WebP images download over constrained mobile cellular connections.
- **Ambient Color Palette Hashing**:
  - Employs deterministic polynomial string hashing over image URLs to select harmonious ambient background palettes (Slate Neutral, Sky Modern, Warm Furniture, Tech Minimal, Fresh Emerald).
  - Produces an instant, aesthetic blurred backdrop matching the natural tone of the upcoming product asset at 0ms latency without waiting for network transfers.
- **Backend LQIP Generation (`core-backend`)**:
  - `ImageOptimizationService.generateLqip(String rawUrl)`: Generates compact base64 data URIs (`data:image/svg+xml;base64,...`) containing an embedded `<feGaussianBlur stdDeviation="5"/>` filter and linear gradient.
  - `ImageOptimizationController`: Added `GET /api/v1/storefront/images/lqip` endpoint returning direct base64 data URIs for client caching.
  - Extended `ResponsiveImageSet` DTO with `lqipDataUri` property, allowing storefront clients to receive placeholder data upfront with catalog queries.
- **Web Frontend Smooth Cross-Fade (`ecommerce-web`)**:
  - `imageOptimizer.ts`: Client-side `generateLqip(rawUrl)` utility generating base64 SVG shimmers instantly in memory.
  - `ResponsiveImage.tsx`: Dual-layer rendering architecture. The instant base64 LQIP shimmer renders immediately as a backdrop (`filter blur-sm scale-105`). When high-res WebP completes decoding (`onLoad`), it smoothly cross-fades into view with `transition-opacity duration-300`, while the placeholder fades to opacity 0.
- **Mobile Storefront Tinted Shimmers (`ecommerce-mobile`)**:
  - `ImageOptimizer` (`lib/core/image_optimizer.dart`): Added `getLqipGradient(String? rawUrl)` and `buildLqipPlaceholder(BuildContext context, String? rawUrl)`.
  - Integrated into `loadingBuilder` across `HomeScreen`, `CatalogScreen`, `ProductDetailScreen`, and `CartScreen`, presenting instant color-matched gradient shimmers before network frames arrive.

#### Feature 19.11: Customer Store Pickup Fulfillment & In-Store Staging Module `[IMPLEMENTED]` (Backlog `[P.5]`)

- **End-to-End Self-Service Showroom Pickup Lifecycle**:
  - Implemented end-to-end customer store pickup module across backend (`core-backend`), web storefront (`ecommerce-web`), and mobile storefront (`ecommerce-mobile`).
  - Enables customers to choose their preferred showroom branch during checkout, tracks in-store staging preparations, generates secure claim QR codes / PINs, and coordinates physical handover verification with store cashiers.
- **Database Schema Expansion (`V28__storefront_pickup_staging.sql`)**:
  - `fulfillment_group` table extended with in-store staging tracking and handover columns:
    - `staging_rack_location VARCHAR(100)`: specific physical showroom staging rack/shelf (e.g., `Rak Display B-02 (Showroom Utama)`).
    - `pickup_pass_code VARCHAR(50)`: human-readable unique pickup PIN (e.g., `PKP-8921-9988`).
    - `pickup_qr_payload TEXT`: cryptographic verification string (`SMS-PICKUP:{orderNumber}:{groupNumber}:{pickupPassCode}`).
    - `staged_at TIMESTAMPTZ` & `staged_by_staff_name VARCHAR(150)`: tracks employee completing staging preparation.
    - `handed_over_at TIMESTAMPTZ`, `handed_over_by_staff_name VARCHAR(150)`, `handover_recipient_name VARCHAR(150)`, `handover_recipient_phone VARCHAR(50)`, `handover_notes TEXT`.
    - Added GiST/B-tree index on `pickup_pass_code` for millisecond counter lookup.
- **Backend Service & REST Endpoints (`core-backend`)**:
  - `StorefrontPickupService`:
    - `getPickupPass(orderNumber)`: Retrieves pass details, validates store operating hours (`09:00 - 21:00 WIB`), ensures QR payload generation, and computes remaining balance if only down payment was received. Pure money management invariant strictly maintained!
    - `stagePickupGroup(request)`: Staging staff action updating group status to `READY_FOR_PICKUP`, records rack location, and dispatches automated FCM push notification milestone `STORE_PICKUP_READY` to customer.
    - `verifyHandover(request)`: Cashier counter handover verification. Validates code, settles any outstanding balance if paid at pickup counter, logs recipient identity verification, marks group `COMPLETED`, and cascades to `SalesOrder.status = COMPLETED` once all groups complete.
  - `StorefrontPickupController`: Exposed `GET /api/v1/storefront/pickup/pass/{orderNumber}`, `POST /api/v1/storefront/pickup/stage`, and `POST /api/v1/storefront/pickup/verify-handover`.
- **Web Frontend Pickup Pass & Handover Modal (`ecommerce-web`)**:
  - `PickupPassModal.tsx`: High-contrast modal displaying pickup store address, operating hours, telephone shortcut, high-contrast QR matrix canvas, copyable PIN pill (`PKP-XXXX-XXXX`), live staging status banner, and financial balance breakdown.
  - Integrated interactive staff staging simulation and counter handover verification directly inside customer tracking and order success pages (`OrderTrackingPage.tsx`, `OrderSuccessPage.tsx`).
- **Mobile Frontend Native Pickup Pass (`ecommerce-mobile`)**:
  - `pickup_pass_screen.dart`: Native Flutter screen rendering QR canvas simulation, showroom branch details, live staging rack badge, and counter handover tools.
  - Deep-linked from `OrderTrackingScreen` and `OrderSuccessScreen` for 1-tap customer access at showroom pickup desks.

#### Feature 19.12: Cross-Platform Persistent Wishlist & Saved Items with Price Drop Indicators `[IMPLEMENTED]` (Backlog `[P.16]`)

- **Seamless Cross-Platform Wishlist Persistence & Unified State**:
  - Implemented end-to-end persistent customer wishlist and saved items architecture across backend (`core-backend`), web storefront (`ecommerce-web`), and mobile storefront (`ecommerce-mobile`).
  - Seamlessly bridges unauthenticated guest sessions (`X-Session-ID`) and authenticated customer profiles (`X-Customer-ID`). Guest wishlists automatically merge upon login via `/api/v1/storefront/wishlist/sync` without duplicate products.
- **Dynamic Price Drop Detection & Savings Analytics**:
  - Snapshot price persistence: captures exact unit price at moment item is saved to wishlist (`added_price`).
  - Real-time price comparison: dynamically queries current active store pricing. When `currentPrice < addedPrice`, item automatically triggers price drop indicators (`hasPriceDrop = true`), computing exact savings amount (`priceDropAmount`) and percentage discount (`priceDropPercentage`).
  - Aggregated analytics: `WishlistSummaryDto` calculates cumulative wishlist valuation, total price-drop savings, and item counts in real time.
- **Database Schema Expansion (`V29__storefront_persistent_wishlist.sql`)**:
  - Created `customer_wishlist_item` table with columns: `id`, `customer_id`, `session_id`, `product_id`, `variant_id`, `added_price`, `notes`, `created_at`, `updated_at`.
  - Added multi-column composite unique index ensuring idempotency (`customer_id + product_id + variant_id` and `session_id + product_id + variant_id`).
  - Indexed foreign keys linking to `storefront_customer`, `product`, and `product_variant`.
- **Backend Service & REST Endpoints (`core-backend`)**:
  - `StorefrontWishlistService`:
    - `getWishlist(customerId, sessionId)`: Aggregates items, queries current pricing, computes price drop metrics, and returns summary.
    - `addToWishlist(customerId, sessionId, request)`: Idempotently adds or updates product/variant in wishlist.
    - `removeFromWishlist(customerId, sessionId, itemId)`: Removes wishlist item with customer/session ownership verification.
    - `moveToCart(customerId, sessionId, itemId)`: Atomically transfers item into customer shopping cart via `StorefrontCartService` and removes from wishlist.
    - `syncWishlist(customerId, request)`: Merges temporary guest session items into authenticated customer account on login.
    - `simulatePriceDrop(customerId, sessionId, request)`: Interactive testing and demonstration endpoint allowing simulated price adjustments to verify UI price drop alerts.
  - `StorefrontWishlistController`: REST endpoints exposed at `/api/v1/storefront/wishlist` (`GET`, `POST`, `DELETE /{id}`, `POST /{id}/move-to-cart`, `POST /sync`, `POST /simulate-price-drop`).
  - Verified with 5/5 JUnit tests passing in `StorefrontWishlistServiceTest.java`.
- **Web Storefront Wishlist Experience (`ecommerce-web`)**:
  - `WishlistContext.tsx`: Full React context managing wishlist state, guest-to-customer auto-sync on auth change, item counters, price drop counts, move-to-cart, and price drop simulations.
  - `WishlistPage.tsx`: Dedicated wishlist view featuring emerald price drop savings banner, total portfolio savings counter, responsive grid of saved items with strikethrough original prices, red discount percentage badges (`-X%`), "Move to Cart" button, and interactive price drop simulator.
  - `Navbar.tsx`: Wishlist heart icon with dynamic item badge and price-drop pulsing dot indicator on desktop and mobile navigation bars.
  - `ProductCard.tsx` & `ProductDetailPage.tsx`: 1-tap heart toggle buttons for adding/removing items directly from catalog grids and product detail views.
  - Verified with production build passing cleanly (`npm run build`).
- **Mobile Storefront Native Wishlist Experience (`ecommerce-mobile`)**:
  - `wishlist_model.dart`: Canonical Dart data models for `WishlistItem` and `WishlistSummary` with currency formatting and serialization.
  - `wishlist_provider.dart`: Riverpod state management (`wishlistProvider`, `wishlistCountProvider`, `priceDropCountProvider`) handling cross-screen state reactivity.
  - `wishlist_screen.dart`: Native Flutter screen rendering gradient price drop hero card, total savings banner, WebP product images with LQIP fallback, price drop tags, move-to-cart action, and price drop simulation dialog.
  - Integrated wishlist heart icons with live count badges in `HomeScreen` and `CatalogScreen` AppBars, heart toggle buttons on catalog product cards and `ProductDetailScreen`, and profile menu entry in `ProfileScreen`.
  - Verified with 4/4 passing unit tests in `wishlist_test.dart` and 0 static analysis issues (`flutter analyze`).

#### Feature 19.13: ADR-12 Storefront Technology Stack & API Gateway Boundary Pattern `[IMPLEMENTED & FORMALIZED]` (Backlog `[P.29]`)

- **Formalized Technology Stack Decision (ADR-12)**:
  - **Application B — E-commerce Website (`ecommerce-web`)**: Built on **Next.js 15 + React 19 + TypeScript**. Configured with Next.js App Router (`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/StorefrontClientShell.tsx`), `next.config.ts` with edge API rewrites (`/api/v1/storefront/:path*`), SSR-safe client storage guards, and dual-compatible build support alongside Vite for rapid local iteration.
  - **Application C — E-commerce Mobile App (`ecommerce-mobile`)**: Built on **Flutter 3.44 + Dart 3.12 + Riverpod 3** (`Notifier` & `NotifierProvider`), sharing the exact same design system tokens and Flutter workspace architecture as the Worker Mobile App (`workerapp-mobile`).
- **Storefront API Gateway Boundary & Security Isolation (`StorefrontApiGatewayFilter.java` & `StorefrontGatewayController.java`)**:
  - **Strict Zone Segregation**: Enforces architectural separation between `PUBLIC_STOREFRONT_GATEWAY` (`/api/v1/storefront/**`) and `INTERNAL_ADMIN_BACKOFFICE` (`/api/**`). Any storefront client (`X-Client-Platform: NEXTJS_WEB` or `FLUTTER_ECOMMERCE`) attempting to call internal back-office endpoints without an authenticated employee RBAC Bearer JWT is immediately rejected with HTTP `403 Forbidden` (`GATEWAY_ZONE_VIOLATION`).
  - **Channel & Platform Attribution**: Inspects `X-Client-Platform` header or auto-detects `Dart` User-Agent (`FLUTTER_MOBILE` vs `NEXTJS_WEB`), stamping responses with `X-Storefront-Channel`, `X-API-Gateway-Zone`, and unique `X-Gateway-Request-Id` tracing tokens.
  - **Token-Bucket Rate Limiting**: Protects public catalog, cart, and checkout endpoints against scraping and DDoS bursts using an in-memory per-session/per-IP token bucket (`240 req/min`), returning HTTP `429 Too Many Requests` and `X-RateLimit-Remaining` headers when exceeded.
  - **Edge Caching & ISR Headers**: Automatically attaches `Cache-Control: public, max-age=60, stale-while-revalidate=300` on `/categories` and `/banners`, and `max-age=15, stale-while-revalidate=60` on `/products` GET requests to accelerate Next.js Incremental Static Regeneration (ISR) and mobile performance.
  - **Topology Discovery Endpoint (`GET /api/v1/storefront/gateway/status`)**: Returns live ADR-12 gateway status, registered client stacks (Next.js 15 & Flutter 3.44), rate limit rules, and strict non-banking money management compliance metadata.
  - **Verification**: 5/5 JUnit tests passing in `StorefrontApiGatewayTest.java`; `ecommerce-web` TypeScript & production build clean; `ecommerce-mobile` Flutter analyze & unit tests passing.

#### Feature 19.14: Flash Sale Countdown & Live Stock Scarcity `[IMPLEMENTED]` (Backlog `[P.30]`)

- Promo managers can mark time-bounded unit discounts as Flash Sales in the Management SPA.
- Storefront catalog responses expose the active sale expiry and current available physical stock. Web and Flutter storefronts show a live countdown and remaining-stock meter; product stock refreshes every 15 seconds.
- Checkout continues to recalculate active promotions on the backend; displayed stock is actual available inventory, not fabricated demand or a guaranteed reservation.
- Verification: Pricing/storefront JUnit suite, storefront production builds, and Flutter analysis.

#### Feature 19.15: Tiered Quantity & Multi-Product Bundle Discounts `[IMPLEMENTED]` (Backlog `[P.31]`)

- Promotion scopes support per-unit quantity tiers, one-time order-total discounts, and multi-variant bundle requirements (variant plus required quantity), persisted through Flyway `V32__tiered_bundle_and_flash_promotions.sql`.
- Backend evaluates qualifying bundles across cart lines and applies best qualifying cart promotion to cart and checkout totals; `order_discount_amount` preserves the order-level amount for audit/display.
- Management UI configures bundle members across products. Example supported: one dining table plus four chairs for a percentage reduction; quantity-tier order promo supports a single Rp 300,000 reduction after buying two AC units.
- Verification: 10 pricing service tests, 4 storefront tests, migration-chain validation, both web production builds, and Flutter analysis.

#### Feature 19.16: Preload Critical Above-The-Fold Hero Assets for LCP Optimization `[IMPLEMENTED]` (Backlog `[P.22]`)

- **Purpose**: Minimize Largest Contentful Paint (LCP) and eliminate first-frame image discovery delay across E-commerce Web (`ecommerce-web`) and E-commerce Mobile (`ecommerce-mobile`) by injecting responsive `<link rel="preload" as="image" type="image/webp" imagesrcset="..." imagesizes="..." fetchpriority="high">` hints for top catalog banners and product hero images.
- **Backend Preload Link Header & Tag Generator (`core-backend`)**:
  - Extended `ImageOptimizationService.ResponsiveImageSet` with `preloadLinkHeader` and `preloadHtmlTag`.
  - Added `generatePreloadLinkHeader(heroUrl, srcSetWebp, sizes)` generating W3C HTTP `Link: <url>; rel=preload; as=image; type="image/webp"; imagesrcset="..."; imagesizes="..."; fetchpriority="high"` headers.
  - Added `generatePreloadHtmlTag(heroUrl, srcSetWebp, sizes)` generating SSR/CSR `<link rel="preload" as="image" ...>` markup.
  - Updated `ImageOptimizationController` (`GET /api/v1/storefront/images/responsive-set` and new `GET /api/v1/storefront/images/preload-hint`) to attach HTTP `Link` preload headers directly on API responses.
  - Verified with 6/6 JUnit tests passing in `ImageOptimizationServiceTest.java`.
- **Web Storefront Head Preload Injection & Priority Rendering (`ecommerce-web`)**:
  - `imageOptimizer.ts`: Implemented idempotent `preloadCriticalImage(rawUrl, options)` and `preloadCriticalImages(rawUrls, options, maxCount)` utilities that deduplicate via an in-memory `Set` and DOM `document.head.querySelector` before appending `<link rel="preload" as="image" type="image/webp" imagesrcset="..." imagesizes="..." fetchpriority="high" data-lcp-preload="true">`.
  - `ResponsiveImage.tsx`: Added `priority?: boolean` prop. When `priority={true}`, automatically triggers `preloadCriticalImage` in `useEffect` and switches the underlying `<img>` from `loading="lazy"` / `decoding="async"` to `loading="eager"`, `decoding="sync"`, and `fetchPriority="high"`.
  - `ProductCard.tsx`: Added `priority?: boolean` prop forwarded to `ResponsiveImage`.
  - `HomePage.tsx`: Preloads the active hero banner (`sizes="100vw"`, `priority={true}`) and top 4 above-the-fold product cards (`priority={idx < 2}`).
  - `CatalogPage.tsx`: Preloads the first 4 above-the-fold catalog grid product cards (`priority={idx < 4}`).
  - `ProductDetailPage.tsx`: Preloads the main product hero gallery image (`preset="hero"`, `sizes="(max-width: 1024px) 100vw, 50vw"`, `priority={true}`).
  - Static SSR/Shell Preconnect & Preload: Added `<link rel="preconnect" href="https://images.unsplash.com" crossorigin>` and initial hero banner `<link rel="preload" as="image" ... fetchpriority="high">` in both `index.html` and Next.js `src/app/layout.tsx`.
  - Verified with clean TypeScript and production bundle build (`npm run build`).
- **Mobile Storefront ImageCache Pre-Warming (`ecommerce-mobile`)**:
  - `ImageOptimizer` (`lib/core/image_optimizer.dart`): Added `preloadCriticalAsset(context, rawUrl, preset)`, `isPreloaded`, and `registerPreloadedUrl` backed by Flutter's `precacheImage(NetworkImage(optimizedUrl), context)` to warm the GPU image cache for hero banners and product detail views.
  - Verified with 6/6 Flutter tests passing (`wishlist_test.dart` & `widget_test.dart`) and 0 `flutter analyze` issues.

#### Feature 20: Enterprise Infrastructure & Cloud Environment Orchestration `[IMPLEMENTED & VERIFIED]` (Backlog `[A.1–A.5]`)

- **Live Supabase Project Provisioning & Storage Security (`[A.1]`)**:
  - Provisioned production-ready database connectivity targeting Supabase Transaction Pooler (PgBouncer/Supavisor, Port 6543) with `sslmode=require` and `prepareThreshold=0` to eliminate connection starvation on high-concurrency Spring Boot Hikari pools.
  - Configured Supabase Auth OAuth2 Resource Server validating JWT tokens via ``.
  - Authored `supabase_storage_and_rls_setup.sql` establishing S3-compatible storage buckets:
    - `sms-documents` (50 MB limit, private): POs, Surat Jalan Delivery Notes, sales invoices, installment agreements.
    - `sms-photos` (20 MB limit, private): Field surveyor dwelling photos, GPS-watermarked delivery proof photos, repossession condition photos.
    - `sms-signatures` (5 MB limit, private): Customer delivery touch signatures and contract sign-offs.
  - Configured Storage Row-Level Security (RLS) policies on `storage.objects` granting full operational access to the backend `service_role` and restricted read/upload access for authenticated field workers and customers.
- **High-Concurrency Production Redis Persistence Engine (`[A.2]`)**:
  - Created production-ready `redis.conf` with password authentication (`requirepass`), RAM cap (`512MB`), and `volatile-lru` eviction policy.
  - Configured Append-Only File (AOF) persistence (`appendonly yes`, `appendfsync everysec`) alongside RDB snapshot cycles, guaranteeing that monotonically increasing atomic document sequences (`DOC_SEQ:SO:*`, `DOC_SEQ:PO:*`, `DOC_SEQ:SJ:*`, `DOC_SEQ:PY:*`) and active GPS buffers are never lost across container restarts or power loss events.
- **Flyway Database Migration Verification (`[A.3]`)**:
  - V1–V28 were applied and verified on the live database at the infrastructure checkpoint. V29–V32 were added later; `FlywayMigrationValidationTest` confirms filename contiguity through V32, but the newer migrations still need live database application/DDL verification.
  - Authored automated verification script `verify_migrations.ps1` and unit validation suite `FlywayMigrationValidationTest.java` validating sequential integrity, table definitions, foreign keys, and indexes without destructive operations.
- **Multi-Service Docker Compose Orchestration & Multi-Stage Dockerfiles (`[A.4]`)**:
  - Implemented root `docker-compose.yml` orchestrating the full SMS enterprise stack:
    - `postgres`: `postgis/postgis:16-3.4-alpine` with healthcheck (`pg_isready -U postgres -d sms`).
    - `redis`: `redis:7-alpine` with password auth, AOF persistence, and healthcheck (`redis-cli -a <password> ping`).
    - `core-backend`: Multi-stage Java 21 build with `eclipse-temurin:21-jre-alpine` runtime and unprivileged user.
    - `sms-web`: Multi-stage Node 20 build with `nginx:alpine` runtime and SPA route-fallback.
    - `ecommerce-web`: Multi-stage Node 20 build with `nginx:alpine` runtime and SPA route-fallback.
  - Implemented Spring Boot Testcontainers integration (`InfrastructureIntegrationTest.java`) dynamically launching PostgreSQL 16 and Redis 7 containers with `@DynamicPropertySource`, featuring graceful fallback (`@Testcontainers(disabledWithoutDocker = true)`) for hosts where Docker Desktop is not actively running.
  - 108/108 backend tests passing cleanly.
- **Universal `.env.example` Templates & Operations Runbook (`[A.5]`)**:
  - Standardized `.env.example` template files across all applications in the SMS ecosystem:
    - Root `.env.example`: Centralized Docker Compose orchestration variables.
    - `core-backend/.env.example`: Spring Boot Hikari connection pool, Supabase JWKS, and Redis credentials.
    - `core-backend/src/main/resources/application-prod.yml`: Production Spring profile with JDBC batching and compression.
    - `sms-web/.env.example`: Management Web Vite API and WebSocket endpoints.
    - `ecommerce-web/.env.example`: Storefront Vite API and Supabase client keys.
    - `workerapp-mobile/.env.example`: Worker Mobile Dio client base URL (auto-resolving `10.0.2.2:8080`) and GPS parameters.
    - `ecommerce-mobile/.env.example`: Customer Mobile Storefront API and push notification configuration.
  - Published comprehensive operations and deployment runbook `docs/infrastructure_setup_guide.md`.

---

## 5. Master Implementation Review Table (Comprehensive)

> **Important Note on Completion Percentages**: The completion percentages in the table below strictly reflect **Feature Implementation (% Code Written)** and **Local/Unit-Level Integration Verification**. A 100% rating indicates that the domain's business logic, database migrations, controllers, UI screens, and local tests are complete and verified. It **does NOT mean the domain is 100% production-ready for live cloud deployment**, as live cloud infrastructure provisioning (Backlog `[A.1–A.5]`), end-to-end integration testing (Backlog `[F.1–F.4]`), and external legal/compliance sign-offs (Backlog `[N.4]`) remain separate ongoing workstreams.

| #      | Feature Domain                                                  | Backend API                                                                                            | Web UI                                                                                                            | Mobile App                                                                                         | Verification Status                                          | Feature Code Completion |     Canonical Backlog Ref     |
| ------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | :---------------------: | :---------------------------: |
| **1**  | Multi-Store & Foundation                                        | `StoreController`, `V1`                                                                                | `StoreListPage`                                                                                                   | Auth Bootstrap                                                                                     | Unit Tests Passed                                            |        **100%**         |      Built-in Foundation      |
| **2**  | Employee & RBAC (10 Roles)                                      | `MeController`, `EmployeeController`                                                                   | `RolePermissionsPage`                                                                                             | Dynamic Role Router                                                                                | Auth Guards Verified                                         |        **100%**         |      Built-in Foundation      |
| **3**  | Approval Workflow DAG                                           | `ApprovalService`, `ApprovalRequest`                                                                   | `ApprovalWorkflowsPage`                                                                                           | In-App Queue                                                                                       | Canvas & Simulation                                          |        **100%**         |      Built-in Foundation      |
| **4**  | Security Audit Log (Exception Trail)                            | `SecurityAuditLogController`, `V20`                                                                    | `DashboardPage` Alerts                                                                                            | Event Logging                                                                                      | REST Verified                                                |        **100%**         |            `[D.5]`            |
| **5**  | Customer Master & NIK                                           | `CustomerController`, `V2`                                                                             | `CustomerListPage`                                                                                                | Customer Search                                                                                    | Zod & Validation                                             |        **100%**         |      Built-in Foundation      |
| **6**  | Gated Customer Creation                                         | `CustomerRequest` SO Gating                                                                            | `CustomerFormDialog`                                                                                              | SO Linked Creation                                                                                 | Validation Blocks                                            |        **100%**         |            `[D.3]`            |
| **7**  | Product Catalog & BOM                                           | `ProductController`, `V3`                                                                              | `ProductListPage`                                                                                                 | Catalog Browser                                                                                    | JPA Entities Verified                                        |        **100%**         |      Built-in Foundation      |
| **8**  | Store-Specific Pricing                                          | `StorePriceController`                                                                                 | `ProductDetailPage`                                                                                               | Pricing Matrix                                                                                     | Multi-Store Gating                                           |        **100%**         |      Built-in Foundation      |
| **9**  | Sales Orders & DP Custody                                       | `SalesOrderController`, `V4`                                                                           | `SalesOrderDetailPage`                                                                                            | SO Creation                                                                                        | Flow & DP Posting                                            |        **100%**         |            `[D.2]`            |
| **10** | Printable Contracts & Receipts                                  | `PrintableDocumentController`                                                                          | Print Buttons (SO, DO, Fin, HR)                                                                                   | Webview View                                                                                       | 5 Documents HTML/PDF                                         |        **100%**         |            `[D.1]`            |
| **11** | Credit Survey Field Workflow                                    | `SurveyListController`, `V5`                                                                           | Order Detail Gating                                                                                               | `SurveyorTaskScreen`                                                                               | Photos & GPS Verified                                        |        **100%**         |       `[B.3]`, `[C.2]`        |
| **12** | Stock Units & Movement Ledger                                   | `StockService`, `V6`                                                                                   | `StockUnitListPage`                                                                                               | Serial Lookup                                                                                      | Vitest & Movement Log                                        |        **100%**         |            `[E.3]`            |
| **13** | Procurement & Auto-Ingest                                       | `ProcurementService`, `V7`                                                                             | `PurchaseOrderDetailPage`                                                                                         | N/A                                                                                                | Receipt Ingestion                                            |        **100%**         |      Built-in Foundation      |
| **14** | Delivery Logistics & Map                                        | `DeliveryService`, `V8`                                                                                | `DeliveryRouteMap.tsx`                                                                                            | `DriverTripScreen`                                                                                 | Waypoints & Signatures                                       |        **100%**         |       `[B.4]`, `[E.2]`        |
| **15** | Installment FIFO & Cash Custody                                 | `FinanceService`, `V9`                                                                                 | `FinancePage.tsx`                                                                                                 | `CollectorVisitScreen`                                                                             | Custody Discrepancies                                        |        **100%**         |            `[B.5]`            |
| **16** | Repossessions & Bad Debt                                        | `RepossessionService`, `V10`                                                                           | `RepossessionWarrantyPage`                                                                                        | Recovery Logging                                                                                   | Debt Forgiveness Rule                                        |        **100%**         |      Built-in Foundation      |
| **17** | Expenses & Overrun Ceilings                                     | `ExpenseService`, `V11`                                                                                | `ExpenseBudgetPage.tsx`                                                                                           | Expense Claim                                                                                      | Overrun Interception                                         |        **100%**         |      Built-in Foundation      |
| **18** | Attendance & GPS Geofence                                       | `PayrollService`, `V12`                                                                                | `PayrollPage.tsx`                                                                                                 | `AttendanceScreen`                                                                                 | Haversine 200m Rule                                          |        **100%**         |       `[B.2]`, `[C.4]`        |
| **19** | Non-Calendar Payroll Engine                                     | `PayrollService.calculate`                                                                             | Slip Print & Approval                                                                                             | `MyPayrollScreen`                                                                                  | Cutoff Calculation                                           |        **100%**         |            `[B.6]`            |
| **20** | Comparative Period Analytics                                    | `ReportingController`, `V13`                                                                           | `PeriodComparisonPanel`                                                                                           | N/A                                                                                                | 28/28 Vitest Passed                                          |        **100%**         |            `[G.3]`            |
| **21** | Mobile Offline Sync (FIFO Replay)                               | N/A (Client Engine)                                                                                    | N/A                                                                                                               | `OfflineSyncQueueNotifier`                                                                         | Local Disk Replay                                            |        **100%**         |            `[C.5]`            |
| **22** | Mobile Hardware & Biometrics                                    | N/A (Client Engine)                                                                                    | N/A                                                                                                               | Signature, Scanner, Biometrics                                                                     | Component Verified                                           |        **100%**         |     `[C.1–C.3]`, `[C.6]`      |
| **23** | Global Search Command Palette                                   | N/A (Client Engine)                                                                                    | `CommandPalette.tsx`                                                                                              | N/A                                                                                                | Keyboard Shortcuts                                           |        **100%**         |            `[E.1]`            |
| **24** | Dark/Light Mode Theme System                                    | N/A (Client Engine)                                                                                    | `themeStore.ts`                                                                                                   | Theme Engine                                                                                       | Vitest Verified                                              |        **100%**         |            `[E.5]`            |
| **25** | Code Splitting & Performance                                    | Vite Production Build                                                                                  | `App.tsx` (Lazy Routes)                                                                                           | Native Compilation                                                                                 | Bundle -75% (470 kB)                                         |        **100%**         |            `[E.7]`            |
| **26** | Client-Side Excel (.xlsx) Export                                | N/A (Client Engine)                                                                                    | `exportExcel.ts`, Finance & Dashboard                                                                             | N/A                                                                                                | 33/33 Vitest Passed                                          |        **100%**         |            `[G.2]`            |
| **27** | _General Ledger & Accounting_                                   | _Proposed_                                                                                             | _Proposed_                                                                                                        | _N/A_                                                                                              | _Under Architectural Review_                                 |    **0% (Proposed)**    |         `[H.1–H.10]`          |
| **28** | _Physical Stocktaking (Opname)_                                 | _Proposed_                                                                                             | _Proposed_                                                                                                        | _Proposed_                                                                                         | _Under Architectural Review_                                 |    **0% (Proposed)**    |       `[I.5]`, `[M.5]`        |
| **29** | Customer 360 & CRM                                              | `Customer360Controller`, `V22`                                                                         | `CustomerDetailPage.tsx` (Tabs 0-4)                                                                               | `Customer360Screen.dart`                                                                           | 5 JUnit + 4 Vitest Passed                                    |        **100%**         |          `[J.1–J.7]`          |
| **30** | Promise-to-Pay (PTP) Engine                                     | `CustomerPromiseToPay`, Lifecycle                                                                      | `CustomerDetailPage` (Tab 2)                                                                                      | PTP Quick Dialog & Offline                                                                         | 5 JUnit + 2 Vitest Passed                                    |        **100%**         |            `[J.3]`            |
| **31** | _Sales Returns & Refunds_                                       | _Proposed_                                                                                             | _Proposed_                                                                                                        | _N/A_                                                                                              | _Under Architectural Review_                                 |    **0% (Proposed)**    |       `[K.1]`, `[K.2]`        |
| **32** | _Inventory Costing (COGS/FIFO)_                                 | _Proposed_                                                                                             | _Proposed_                                                                                                        | _N/A_                                                                                              | _Under Architectural Review_                                 |    **0% (Proposed)**    |          `[I.1–I.4]`          |
| **33** | _Warehouse Location & Picking_                                  | _Proposed_                                                                                             | _Proposed_                                                                                                        | _Proposed_                                                                                         | _Under Architectural Review_                                 |    **0% (Proposed)**    |   `[I.8]`, `[I.9]`, `[M.2]`   |
| **34** | _Store Checklists & Fleet_                                      | _Proposed_                                                                                             | _Proposed_                                                                                                        | _Proposed_                                                                                         | _Under Architectural Review_                                 |    **0% (Proposed)**    | `[L.1]`, `[L.2]`, `[L.5–L.7]` |
| **35** | _Internal Bulletins & Tasks_                                    | _Proposed_                                                                                             | _Proposed_                                                                                                        | _Proposed_                                                                                         | _Under Architectural Review_                                 |    **0% (Proposed)**    |       `[L.3]`, `[L.4]`        |
| **36** | Mobile Work Centers & Auditing                                  | Survey, DO, Stocktake, Notif                                                                           | N/A                                                                                                               | Screens (Sales, Pick, Audit, Hub)                                                                  | 77 JUnit + 5 Flutter Passed                                  |        **100%**         |          `[M.1–M.6]`          |
| **37** | _Architecture, SRE & Security_                                  | _Proposed_                                                                                             | _Proposed_                                                                                                        | _Proposed_                                                                                         | _Under Architectural Review_                                 |    **0% (Proposed)**    |          `[N.1–N.7]`          |
| **38** | Universal Attachment Previewer & Usability                      | `DocumentService` & Download Ticket                                                                    | `DocumentPreviewModal`, `DocumentsPanel`                                                                          | _N/A_                                                                                              | 6 JUnit + 16 Vitest Passed                                   | **100% (Partial O.5)**  |          `[O.1-O.7]`          |
| **39** | E-commerce Web Application                                      | `StorefrontProductController`, `StorefrontCartController`, `StorefrontCheckoutController`              | `ecommerce-web` (React 19 + Vite)                                                                                 | N/A                                                                                                | `npm run build` Passed                                       |        **100%**         |            `[P.6]`            |
| **40** | E-commerce Mobile Application                                   | `/api/v1/storefront/**`                                                                                | N/A                                                                                                               | `ecommerce-mobile` (Flutter + Riverpod)                                                            | `flutter analyze` & `flutter test` Passed                    |        **100%**         |            `[P.7]`            |
| **41** | Multi-Fulfillment Groups & Dual-Axis Engine                     | `V25`, `FulfillmentGroup`, `StorefrontCheckoutService`                                                 | Checkout Dual-Axis UI                                                                                             | Checkout Dual-Axis UI                                                                              | Multi-Fulfillment Partitioned                                |        **100%**         |       `[P.1]`, `[P.4]`        |
| **42** | Commercial Availability & Lead Times                            | `StorefrontCatalogService`                                                                             | ProductDetailPage & Catalog                                                                                       | ProductDetailScreen & Catalog                                                                      | Lead Time & Gating Verified                                  |        **100%**         |            `[P.2]`            |
| **43** | _Procurement Demand Consolidation & Gate_                       | `ProcurementService`                                                                                   | Demand Center                                                                                                     | _N/A_                                                                                              | _Under Architectural Review_                                 |    **0% (Proposed)**    |       `[P.3]`, `[P.12]`       |
| **44** | Customer Store Pickup & Handover                                | `StorefrontPickupController`, `StorefrontPickupService`, `V28`                                         | `PickupPassModal.tsx`, `OrderTrackingPage`, `OrderSuccessPage`                                                    | `PickupPassScreen.dart`, `ApiClient`                                                               | 5 JUnit Tests + Web Build + Flutter Pass                     |        **100%**         |            `[P.5]`            |
| **45** | Configurable Payment Methods & Gateways                         | `V25` `storefront_payment_method` (9 methods)                                                          | Checkout Payment Selector                                                                                         | Checkout Payment Selector                                                                          | Dynamic Payment & Simulation                                 |        **100%**         |       `[P.8]`, `[P.11]`       |
| **46** | _Cross-Application Outbox Sync_                                 | `OutboxEventDispatcher`                                                                                | Push Events                                                                                                       | Push Receiver                                                                                      | _Under Architectural Review_                                 |    **0% (Proposed)**    |       `[N.1]`, `[P.9]`        |
| **47** | _Worker Active-Task GPS Tracking_                               | `GeoLocationService`                                                                                   | Route Map Live                                                                                                    | Active Task Daemon                                                                                 | _Under Architectural Review_                                 |    **0% (Proposed)**    |       `[P.10]`, `[Q.1]`       |
| **48** | Shared Task-Based GPS Infrastructure                            | `FleetService`, `V24`                                                                                  | `FleetMonitoringPage`                                                                                             | `FleetTrackingService.dart`                                                                        | 5 Vitest + 9 Flutter Passed                                  |        **100%**         |       `[Q.1]`, `[Q.2]`        |
| **49** | Strict Break Management & Pauses                                | `BreakScheduleRepository`                                                                              | `FleetMonitoringPage` (Tab 3)                                                                                     | Auto Pause / Resume Timer                                                                          | 5 Vitest + 9 Flutter Passed                                  |        **100%**         |            `[Q.3]`            |
| **50** | Tracking Session State Machine                                  | `TrackingSessionRepository`                                                                            | Session Life Cycle                                                                                                | Session State Machine                                                                              | 5 Vitest + 9 Flutter Passed                                  |        **100%**         |            `[Q.4]`            |
| **51** | GPS Ingestion & Spatial Telematics                              | `FleetController.ingestLocations`                                                                      | Route Rendering                                                                                                   | Batch Telemetry Buffer                                                                             | 5 Vitest + 9 Flutter Passed                                  |        **100%**         |            `[Q.5]`            |
| **52** | Web Live GPS Monitoring Dashboard                               | `FleetController.getLiveFleet`                                                                         | `FleetLiveMap` SVG Canvas                                                                                         | Active Telemetry Broadcast                                                                         | 5 Vitest Passed                                              |        **100%**         |            `[Q.6]`            |
| **53** | Historical Route Playback & Events                              | `FleetService.getHistoricalRoute`                                                                      | Route Scrubber (1x-10x)                                                                                           | N/A                                                                                                | 5 Vitest Passed                                              |        **100%**         |            `[Q.7]`            |
| **54** | Vehicle Master & Assignments                                    | `VehicleRepository`, `VehicleDto`                                                                      | `VehicleFormDialog`                                                                                               | Active Vehicle Binding                                                                             | 5 Vitest Passed                                              |        **100%**         |            `[Q.8]`            |
| **55** | Interruption Detection & Buffering                              | `TrackingEventType`                                                                                    | Interruption Alerts                                                                                               | `ActiveTrackingBanner.dart`                                                                        | 9/9 Flutter Tests Passed                                     |        **100%**         |       `[Q.9]`, `[Q.17]`       |
| **56** | Fleet PBAC & UU PDP Privacy Audit                               | `LocationAccessAuditLog`                                                                               | Privacy Audit Log Table                                                                                           | Consent & Transparency Banner                                                                      | 5 Vitest Passed                                              |        **100%**         |           `[Q.10]`            |
| **57** | Fleet Operational Analytics & Productivity                      | `FleetService` (`/analytics`)                                                                          | `FleetMonitoringPage` (Tab 4)                                                                                     | N/A                                                                                                | 5 Vitest + JUnit Passed                                      |        **100%**         |           `[Q.11]`            |
| **58** | _Future Telematics Roadmap_                                     | _Proposed_                                                                                             | _Proposed_                                                                                                        | _Proposed_                                                                                         | _Under Architectural Review_                                 |    **0% (Proposed)**    |           `[Q.12]`            |
| **59** | Deposit-First Procurement Policy Engine                         | `StorefrontCheckoutService` (30% DP calculation & PO lock)                                             | Deposit Alert & Receipt                                                                                           | Deposit Alert & Instruction                                                                        | 4 JUnit Tests Passed                                         |        **100%**         |           `[P.12]`            |
| **60** | In-House Credit Governance & Approval                           | `storefront_payment_method.requires_approval`                                                          | Credit Application Dialog                                                                                         | Profile In-House Facility                                                                          | Survey Gating Verified                                       |        **100%**         |           `[P.11]`            |
| **61** | Mobile Push Notification Engine (FCM / APNs)                    | `StorefrontNotificationController`, `V26`                                                              | N/A                                                                                                               | `NotificationScreen`, `notificationProvider`                                                       | 8/8 JUnit + Flutter Tests Passed                             |        **100%**         |           `[P.13]`            |
| **62** | Multi-Resolution Image CDN & WebP Pipeline                      | `ImageOptimizationController`, `ImageOptimizationService`                                              | `ResponsiveImage.tsx`, `imageOptimizer.ts`                                                                        | `ImageOptimizer`, Presets (Thumb/Card/Hero)                                                        | 12/12 JUnit + Web Build + Flutter Pass                       |        **100%**         |           `[P.14]`            |
| **63** | Quick Manual Pause from Ongoing System Notification             | `FleetTrackingNotifier`                                                                                | Notification Event Log                                                                                            | `ActiveTrackingBanner`, Notification Tray Action                                                   | 10 Flutter Tests Passed                                      |        **100%**         |           `[Q.16]`            |
| **64** | Battery Temperature Safety Cutoff Engine                        | `FleetTrackingNotifier`                                                                                | Thermal Telemetry Log                                                                                             | `ActiveTrackingBanner` Thermal Alert                                                               | 11 Flutter Tests Passed                                      |        **100%**         |           `[Q.19]`            |
| **65** | BlurHash & Low-Quality Image Placeholders (LQIP)                | `ImageOptimizationController` (`/lqip`), `ImageOptimizationService`                                    | `ResponsiveImage.tsx` (Inline base64 SVG shimmer), `imageOptimizer.ts`                                            | `ImageOptimizer.buildLqipPlaceholder`, `getLqipGradient`                                           | 5 JUnit Tests + Web Build + Flutter Pass                     |        **100%**         |           `[P.20]`            |
| **66** | Automated Fleet Asset Servicing & KIR/STNK Expiry Alert Engine  | `FleetService`, `@Scheduled` Daily Scanner, `V27`                                                      | `FleetMonitoringPage.tsx` (Maintenance Alert Banners, Expiry Badges, Log Service Dialog)                          | N/A                                                                                                | 9 JUnit Tests + 5 Vitest Tests + Web Build Pass              |        **100%**         |           `[Q.21]`            |
| **67** | Dynamic Geofence Proximity Alert Engine                         | `FleetTrackingService`, `GeofenceTarget`, Haversine Evaluation                                         | `ActiveTrackingBanner` (Emerald Arrival Card), Notification Tray Action                                           | `DriverTripScreen`, `CollectorVisitScreen`, `SurveyorTaskScreen`                                   | 8 Flutter Tests + 13 Suite Tests Pass                        |        **100%**         |           `[Q.18]`            |
| **68** | Enterprise Infrastructure & Cloud Environment Orchestration     | `application-prod.yml`, `supabase_storage_and_rls_setup.sql`, `redis.conf`, V1–V32 filename contiguity | `sms-web/Dockerfile`, `.env.example`                                                                              | `workerapp-mobile/.env.example`, `ecommerce-mobile/.env.example`                                   | 108/108 checkpoint tests; current V32 chain validation       |        **100%**         |          `[A.1–A.5]`          |
| **69** | Cross-Platform Persistent Wishlist & Price Drop Engine          | `CustomerWishlistItemRepository`, `StorefrontWishlistService`, `V29`                                   | `WishlistPage.tsx`, `WishlistContext.tsx`, Navbar Badge, Heart Toggles                                            | `wishlist_model.dart`, `wishlist_provider.dart`, `WishlistScreen.dart`                             | 5/5 JUnit Tests + 4/4 Flutter Tests + Web Build Pass         |        **100%**         |           `[P.16]`            |
| **70** | DataGrid Bulk Operations, Multi-Document Printing & Exports     | `PrintableDocumentService`, `BulkOperationResult`, Bulk Status Services                                | `BulkActionBar`, `BulkStatusUpdateDialog`, `exportDataGrid` (XLSX/CSV), 6 DataGrids                               | _N/A_                                                                                              | 3 JUnit Tests + 2 Vitest Tests + Full Web Build Pass         |        **100%**         |            `[O.6]`            |
| **71** | Omnichannel Promotional Price Discounts & Campaign Engine       | `PriceDiscountService`, `PriceDiscountController`, `V30`                                               | `PricingPanel.tsx` (Promos Tab), `PriceDiscountDialog.tsx`, `ProductCard.tsx`, `ProductDetailPage.tsx`            | `product_model.dart`, `cart_model.dart`                                                            | 14/14 JUnit + 1 Vitest + Vite Web Build Pass                 |        **100%**         |           `[P.28]`            |
| **72** | Showroom Credit Price Calculator & Custom DP Negotiation Engine | `PriceCalculationService`, `PricingController` (`/calculate`, `/auto-apply`), `V31`                    | _N/A (Web uses PricingPanel)_                                                                                     | `CreditCalculatorScreen`, `CreditCalculatorService`, `SalesWorkCenterScreen`, `worker_home_screen` | 4/4 JUnit Tests + 6/6 Flutter Tests Pass                     |        **100%**         |           `[G.14]`            |
| **73** | ADR-12 Storefront Tech Stack (Next.js + Flutter) & API Gateway  | `StorefrontApiGatewayFilter`, `StorefrontGatewayController` (`/gateway/status`)                        | `ecommerce-web` (`next.config.ts`, `src/app/*`, `X-Client-Platform: NEXTJS_WEB`)                                  | `ecommerce-mobile` (`api_client.dart`, `X-Client-Platform: FLUTTER_MOBILE`)                        | 5/5 JUnit + Web Build + 5/5 Flutter Tests Pass               |        **100%**         |           `[P.29]`            |
| **74** | Flash Sales, Tiered Discounts & Product Bundles                 | `PriceDiscountService`, `V32`, cart/checkout pricing                                                   | Countdown + stock meter, promo management UI                                                                      | Countdown + stock meter                                                                            | 10 pricing + 4 storefront JUnit; web builds; Flutter analyze |        **100%**         |      `[P.30]`, `[P.31]`       |
| **75** | Preload Critical Above-The-Fold Hero Assets (LCP Optimization)  | `ImageOptimizationService` (`preloadLinkHeader`, `preloadHtmlTag`), `/preload-hint`                    | `preloadCriticalImage`, `ResponsiveImage` (`priority`), `HomePage`, `CatalogPage`, `ProductDetailPage`            | `ImageOptimizer.preloadCriticalAsset`, `precacheImage`                                             | 6/6 JUnit + Web Build + 6/6 Flutter Tests Pass               |        **100%**         |           `[P.22]`            |
| **76** | Server-Side Price List Document Versioning & Validity Stamping  | `PriceListVersionService`, `PriceListService`, `PricingController`, Flyway `V34`                       | `PriceListPage.tsx` (Tabs, Generate Modal, Version Archive Table, Valid-From Date Stamping), `api.ts`, `hooks.ts` | _N/A_                                                                                              | 3 JUnit Tests + 7 Vitest Tests Pass                          |        **100%**         |           `[G.18]`            |
| **77** | Master Data Truck with 1-to-1 Driver Link & STNK 1-Mo Tax Alert | `FleetService`, `VehiclePlateHistoryRepository`, Flyway `V38`                                          | `TruckListPage.tsx` (KPI Cards, 1:1 Driver Modal, Plate Change Dialog, History Modal), `hooks.ts`                 | _N/A_                                                                                              | 13/13 JUnit + 4/4 Vitest Tests Pass + Web Build Pass         |        **100%**         |           `[Q.32]`            |

---

## 6. What Hasn't Been Done Yet (Detailed Gap Analysis & Review)

This section summarizes remaining work only. The detailed feature inventory, verification evidence, ADRs, and canonical task statuses are maintained in Sections 4, 5, 7, 8, and 9. Older standalone status snapshots and source specifications were consolidated here; their earlier checkpoint claims do not override newer entries in this document.

### Completed Baselines

- Core management web, worker mobile, and customer storefront applications are implemented; completed work and local verification are listed in Sections 4 and 5.
- Infrastructure setup items `[A.1–A.5]`, core e-commerce and pickup flows, and fleet tracking/dashboard features have later completion entries. Do not treat the older `PROJECT-STATUS.md` checkpoint at V19 or older `[P.*]`/`[Q.*]` proposals as current status.
- Flash-sale countdown/stock indicators and tiered/bundle discounts are implemented under `[P.30]`/`[P.31]`; promo stock figures represent current available inventory and do not reserve stock.
- Feature-code completion and local tests do not establish production readiness, legal compliance, or full cross-application E2E verification.

### Outstanding Delivery & Operations Work

- Browser E2E coverage, mobile integration tests, CI/CD, and automated database backup/recovery remain tracked by `[F.1–F.4]` and `[A.8]`.
- Transactional outbox delivery, durable endpoint idempotency, and full offline conflict handling remain tracked by `[N.1–N.3]` and `[P.9]`.
- Live payment-gateway integrations and callback verification remain distinct from the implemented payment-method configuration and demo/simulation flows (`[P.8]`).
- Procurement demand consolidation remains open (`[P.3]`); current deposit gating does not imply the complete consolidated purchasing work center is done.
- Legal review and production-grade privacy/security controls remain open (`[N.4]`, `[N.5]`, `[N.7]`, ADR-08, ADR-13), even where supporting infrastructure or audit features exist.

### Proposed Business Domains

- Full accounting/general ledger and statutory reporting (`[H.1–H.10]`), inventory valuation/COGS (`[I.1–I.4]`), expanded warehouse operations (`[I.6–I.9]`), and structured sales returns/refunds (`[K.1–K.2]`) remain proposed.
- Remaining customer, store operations, workflow, and experience enhancements are tracked in the canonical backlog. CRM, mobile stocktaking, pickup, and fleet capabilities already implemented must not be described as wholly unbuilt.

### Consolidated Business Decisions Still Open

- Customer-payment allocation tie-breaking and excess-payment treatment; installment schedule/rounding behavior for partial deliveries.
- Exact down-payment eligibility and thresholds by product/category, beyond the implemented calculator rules.
- Supplier payment method in actual operations (cash/transfer versus giro/check), plus supplier returns after accepted receiving.
- Payroll-period calendar remains inconsistent across source versions: one specifies a Sunday-ending weekly cutoff, while current implementation notes use explicit configurable dates and cite a 26th–25th example. Keep periods date-explicit until business confirms the governing calendar.
- Accounting treatment for repossession forgiveness, recovered-unit cost basis, repair cost, scrap proceeds, and exceptional customer-service cases.
- Final payroll/commission/target/allowance rules, complete role/approval hierarchy, discrepancy approval thresholds, and any future loaner-product workflow.
- Remaining operational document fields and exact warranty logistics where manufacturer and store processes vary.

These are decision items, not permission to invent business policy. Use the relevant ADR and canonical backlog item as the source of next steps.

---

---

## 7. Architectural Decisions & Design Tensions (ADR-01 to ADR-15)

> **Architectural Governance**: Before executing complex enterprise capabilities, architectural trade-offs must be evaluated against core domain invariants. Below is the formal register of Architectural Decision Records (ADRs) and detailed reconciliation analyses for multi-store retail operations and omnichannel commerce. The **Canonical Todo Backlog** is located at the bottom of this document in **Section 9**.

### 7.1 Architectural Decision Records (ADRs)

Before any implementation begins on the proposed enhancements, the technical leadership and business stakeholders must align on the following core architectural decisions:

| #          | Architectural Decision                                                                                           | Key Questions & Trade-offs                                                                                                                                                                                        | Recommendations / Options for Review                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ADR-01** | **Internal General Ledger vs. External Accounting Integration**                                                  | Should SMS build a custom double-entry General Ledger engine internally, or integrate with an established external accounting system (e.g., Jurnal.id, Accurate Online, SAP Business One, Xero)?                  | **Option A**: Build internal GL tailored specifically to retail credit financing invariants and unified reporting.<br>**Option B**: Keep SMS as operational sub-ledger (AR, Inventory, Expenses) and push summarized daily journals via REST API / Webhooks to external accounting software.<br>_Trade-off_: Option B reduces development complexity and tax audit compliance burden; Option A provides zero-sync latency and unified ACID data.                                                                                                                                                                                                                                                                                                                 |
| **ADR-02** | **Inventory Costing Methodology: FIFO vs. Periodic Weighted Average**                                            | Which inventory valuation method best reflects the chain's gross margin and complies with Indonesian tax regulations (Undang-Undang PPh Pasal 10 ayat 6)?                                                         | **Option A**: FIFO (First-In, First-Out) matching specific purchase batches.<br>**Option B**: Periodic Weighted Average Cost calculated monthly.<br>_Note_: Indonesian tax law recognizes both FIFO and Average methods, but prohibits LIFO. For serialized goods (electronics), specific identification / FIFO is natural; for loose spare parts, weighted average is standard.                                                                                                                                                                                                                                                                                                                                                                                 |
| **ADR-03** | **Sales Returns, Refunds & Non-Destructive Accounting Policies**                                                 | How should returns and customer refunds be treated financially without violating the core invariant that finalized sales documents are immutable?                                                                 | **Policy**: Finalized Sales Orders and Invoices are never rewritten. Returns must generate a distinct `SalesReturn` business document and a balanced `CreditNote` voucher.<br>_Decision Needed_: Are restocking fees charged? Does customer receive cash refund, bank transfer, or credit balance voucher? How is returned product graded before restock?                                                                                                                                                                                                                                                                                                                                                                                                        |
| **ADR-04** | **Mobile Offline Permitted Actions & Conflict Resolution Strategy**                                              | Which operations are permitted in zero-connectivity environments, and how should concurrent conflicts be resolved when the server rejects a change?                                                               | **Policy**: Non-financial data (survey notes, GPS coordinates, inspection photos) permit optimistic offline capture with Latest Timestamp Wins (LWW).<br>_Critical Decision_: Financial cash collections and stock allocations must NEVER use LWW. Cash custody handover must remain locked until collection record successfully syncs. Inventory stock allocation must be strictly server-authoritative. Conflicts halt replay and require managerial intervention.                                                                                                                                                                                                                                                                                             |
| **ADR-05** | **Document Numbering: Gapless Sequences vs. High-Concurrency Performance**                                       | Does legal or tax compliance strictly require gapless consecutive document numbering for invoices and Surat Jalan, or are Redis atomic sequences sufficient?                                                      | **Analysis**: High-concurrency Redis atomic counters (`INCR`) can produce gaps if an operational database transaction rolls back after the counter was incremented. Volatile Redis TTLs can also lose sequence states upon restart. PostgreSQL sequences (`nextval`) also produce gaps on rollback.<br>_Decision Needed_: Ordinary unique documents (drafts, delivery trips) use fast Redis/Postgres sequences where gaps are harmless. Statutory tax invoices (_Faktur Pajak_) requiring zero-gap continuity must use a dedicated database sequence committed synchronously inside the financial transaction, with a gap-audit reconciliation monitor.                                                                                                          |
| **ADR-06** | **Auditability, Archival & Data Retention Policies**                                                             | What level of audit trail granularity is required, and what is the statutory data retention period for transaction history?                                                                                       | **Policy**: Financial records and contracts must be retained for at least 10 years pursuant to Indonesian Law No. 8 of 1997 on Company Documents (UU Dokumen Perusahaan).<br>_Decision Needed_: Implement automated database table partitioning for `stock_movement`, `security_audit_log`, and `outbox_events`, archiving historical records older than 5 years to cold cloud storage. _Requires formal legal counsel validation._                                                                                                                                                                                                                                                                                                                              |
| **ADR-07** | **Digital Signatures Legal Validity under Indonesian Law**                                                       | Is mobile touch signature capture sufficient for statutory credit financing enforcement, or is certified digital signature integration required?                                                                  | **Analysis**: Under Indonesian ITE Law (UU ITE No. 11/2008 & PP No. 71/2019), a simple canvas touch signature has evidentiary weight but can be contested in court. Certified electronic signatures issued by a licensed Certificate Authority (e.g., PrivyID, Vida, Peruri) have non-repudiation status.<br>_Decision Needed_: Use canvas touch signatures for daily logistics (Surat Jalan DO receipt); integrate licensed CA e-signatures with e-Meterai for formal multi-year credit agreement financing contracts.                                                                                                                                                                                                                                          |
| **ADR-08** | **Indonesian Personal Data Protection (UU No. 27 Tahun 2022 / PDP) Compliance**                                  | What technical and organizational security measures must be enforced for customer NIK, family cards (KK), and location tracking data?                                                                             | **Requirements**: Implement field-level encryption for NIK and bank accounts; enforce strict role-based PII masking; record audit logs on every PII unmask event; establish customer data retention and deletion policies upon contract termination.<br>_Caveat_: All statutory interpretations must be formally reviewed and signed off by qualified Indonesian legal counsel.                                                                                                                                                                                                                                                                                                                                                                                  |
| **ADR-09** | **Statutory Payroll, Overtime & Labor Regulations**                                                              | What calculation rules apply to employee payroll, tax withholding, and social security?                                                                                                                           | **Requirements**: Comply with Indonesian PPh 21 TER (Tarif Efektif Rata-rata) progressive tax regulations (PP No. 58/2023 & PMK 168/2023), BPJS Ketenagakerjaan (JKK, JKM, JHT, JP), BPJS Kesehatan (4% employer / 1% employee), and statutory overtime multipliers under Government Regulation No. 35 of 2021 (PP 35/2021).<br>_Caveat_: All statutory tax tables and social security withholding formulas must be reviewed and certified by a licensed Indonesian tax consultant.                                                                                                                                                                                                                                                                              |
| **ADR-10** | **Multi-Fulfillment Grouping, Partial Delivery & Financial Treatment**                                           | How should sales orders with multiple fulfillment groups be billed, invoiced, and accounted for when dispatches are staggered?                                                                                    | **Policy**: A single Sales Order must never be split into multiple sales orders. The order maintains overall commercial agreement totals.<br>_Decision Needed_: Are partial delivery notes (_Surat Jalan_) treated as interim shipments with pro-rata invoicing, or is a single final commercial invoice generated upon complete delivery? How are partial delivery cancellation refunds disbursed when part of the order has already been physically delivered?                                                                                                                                                                                                                                                                                                 |
| **ADR-11** | **Customer Identity, Self-Registration vs Gated Creation, and Guest Checkout**                                   | How should customer identity be reconciled between back-office staff creation (strictly context-gated to SO drafts) and online e-commerce self-registration?                                                      | **Policy**: Back-office staff creation remains context-gated. E-commerce platforms permit self-service customer registration with email/phone OTP verification.<br>_Decision Needed_: Should guest checkout be supported without registration? If a guest later registers or an online buyer visits a physical showroom, how should NIK and phone number deduplication link the accounts without violating UU PDP data protection consent?                                                                                                                                                                                                                                                                                                                       |
| **ADR-13** | **GPS Location Tracking Architecture, PostGIS Spatial Persistence & Employee Privacy (UU PDP)**                  | How should field employee location data be collected, stored, and governed without violating Indonesian personal data protection regulations (UU No. 27 Tahun 2022 / UU PDP) or draining mobile device batteries? | **Policy**: GPS collection is strictly task-bounded and automatically ceases during scheduled break periods. Salespersons are explicitly excluded. Mobile smartphone GPS is the primary location source; in-vehicle telematics hardware is deferred to future phases.<br>_Database Architecture_: Use PostgreSQL with PostGIS extension (`GEOMETRY(Point, 4326)`) with monthly table partitioning. Cache latest known positions in Redis with WebSocket STOMP broadcasting to Web Admin.<br>_Legal & Privacy_: Enforce granular PBAC permissions; log all administrative location views in an immutable `location_access_audit_log`; establish a 90-day active retention policy with cold archival; and obtain formal Indonesian legal counsel certification.    |
| **ADR-14** | **Deposit-First Procurement Authorization Policies & Commercial Down Payment Thresholds**                        | A supplier PO for customer backorders cannot proceed until the required customer deposit is confirmed. What specific deposit rules should apply?                                                                  | **Policy**: Demand consolidation strictly filters out sales order requirements that have not met their deposit threshold. Only deposit-cleared requirements can be committed to drafted supplier purchase orders.<br>_Decision Needed_: Should deposit requirements be a mandatory 100% full payment, a configurable percentage (e.g., 20%, 50%), or a fixed nominal amount per product category / customer credit tier? How are supplier purchase orders handled if multiple customer orders contribute to a consolidated supplier PO and some customers have paid deposits while others have not?                                                                                                                                                              |
| **ADR-15** | **Configurable Payment Methods Administration, In-House Credit Governance & Third-Party Financing Integrations** | How should the 9 supported payment methods be managed dynamically, and what governance applies to customer credit and driver COD?                                                                                 | **Policy**: All 9 payment methods (Bank transfer/VA, QRIS, E-wallet, Cards, Cash at store, Direct store bank transfer, Driver COD, In-house customer credit, Third-party installment financing) are part of the platform scope and must be dynamically configurable in the Management System without code changes.<br>_Credit Governance_: Customer credit is strictly prohibited from automatic grant upon registration; requires formal credit assessment, surveyor verification, approval workflow, and credit limit management.<br>_Decisions Needed_: Third-party financing (Kredivo, Akulaku, Home Credit) partner API integration standards. Driver COD cash limits, end-of-trip cashier handover verification, and theft/discrepancy insurance policies. |

---

### 7.2 Detailed Analysis of Architectural Conflicts, Questions & Reconciliations for Executive Discussion

To ensure complete transparency and prevent arbitrary decisions, the following five architectural tensions between existing system rules and the new four-application ecosystem are explicitly highlighted for technical leadership and executive review:

#### 1. Context-Gated Customer Creation vs. E-commerce Self-Registration

- **Existing Documented Decision**: Feature 2.3 enforces strict context-gating: store staff cannot create free-floating customer records without an active Sales Order draft or explicit administrative override. This prevents orphaned dummy records and CRM clutter.
- **New Ecosystem Requirement**: Section 1.B requires customer-facing self-service registration and authentication on the E-commerce Website and Mobile App.
- **Architectural Reconciliation**:
  - The two mechanisms operate in completely distinct security scopes. Back-office employee endpoints (`/api/customers`) remain strictly gated by sales order context and RBAC.
  - Public storefront endpoints (`/api/v1/storefront/auth/register`) allow self-service customer registration with phone/email verification.
  - _Open Question for Discussion_: When an online-registered customer walks into a brick-and-mortar showroom, how should the showroom salesperson look up their record? Searching by NIK or verified mobile phone number will link the existing online customer record without triggering the context-gated creation rule.

#### 2. Real-Time Stock Reservation vs. Procurement-Required Ordering

- **Existing Documented Decision**: The inventory module requires that confirmed sales orders acquire concurrency locks and reserve physical serialized units (`StockUnit` with status `AVAILABLE`).
- **New Ecosystem Requirement**: Section 7 permits customers to purchase products with status `AVAILABLE_PROCUREMENT_REQUIRED` where physical inventory is currently zero.
- **Architectural Reconciliation**:
  - The sales order item entity must support an explicit `is_procurement_required` flag and a linked `ProcurementRequirement` record.
  - In-stock line items trigger immediate `StockUnit` reservation locks; procurement-required line items skip physical unit locking and transition the fulfillment group to `AWAITING_PROCUREMENT`.
  - _Open Question for Discussion_: If a customer places an order with "Complete Fulfillment" (wait for all items) containing 1 in-stock item and 1 procurement-required item, should the in-stock item remain locked in warehouse inventory for 5–7 days while waiting for distributor procurement, or should reservation be deferred until supplier PO arrival? Locking inventory ties up working capital; deferring reservation risks stock depletion by showroom floor sales.

#### 3. Multi-Fulfillment Deliveries vs. Surat Jalan Document Numbering & Invoicing

- **Existing Documented Decision**: Invariant 6 and Feature 8.3 assume that a Sales Order corresponds to a delivery order trip generating a formal Delivery Note (_Surat Jalan_) with sequential numbering.
- **New Ecosystem Requirement**: Section 6 establishes that one Sales Order may have multiple Fulfillment Groups resulting in staggered physical deliveries.
- **Architectural Reconciliation**:
  - A single Sales Order must never be cloned or split into multiple sales orders.
  - Instead, the system must support 1-to-N relationships between `SalesOrder` and `DeliveryOrder` / `SuratJalan`. Each delivery note receives a distinct sequence number referencing the parent SO and fulfillment group (e.g., `SJ/{STORE}/10/2026/0042-01` for Fulfillment 1, and `-02` for Fulfillment 2).
  - _Open Question for Discussion_: For statutory Indonesian tax invoicing (_Faktur Pajak_), should tax invoices be generated upon full sales order payment or incrementally upon each Surat Jalan physical dispatch? Tax counsel alignment is required.

#### 4. Active Task-Bounded Worker Location Tracking vs. Employee Privacy & Statutory UU PDP Governance

- **Existing Documented Decision**: Group 12 and Feature 14.1 restrict GPS verification to attendance clock-in geofences (Haversine 200m) and field photo watermarks to protect employee privacy and battery life.
- **New Module Requirement (Logistics & Fleet Management)**: Live GPS tracking of Drivers, Surveyors, and Collectors during field operations.
- **Finalized Architectural Reconciliation**:
  - The system enforces **strict task lifecycle bounding**: GPS tracking is activated strictly upon manual task/trip initiation in the Flutter mobile application (`TRIP_ACTIVE`, `SURVEY_ACTIVE`, `COLLECTION_ACTIVE`) and terminates immediately upon task/trip completion. All-day continuous tracking is strictly prohibited.
  - **Salespersons are explicitly excluded from GPS tracking.**
  - **Strict Scheduled Breaks**: Tracking automatically ceases during configured break windows (e.g., lunch 12:00–13:00); no coordinates are collected or stored; employees cannot defer breaks. Auto-resumes when the break concludes if the task remains active.
  - **Mobile Phone GPS Primary Source**: Employee smartphone GPS serves as the primary location source; in-vehicle telematics hardware is deferred to future fleet phases.
  - **Granular PBAC & Auditability**: Access to location data is protected by granular permissions (`FLEET_LIVE_VIEW`, `FLEET_HISTORY_VIEW`) and every administrative view logs an immutable audit entry in `location_access_audit_log`.
  - _TBD / Open Questions for Technical Validation_:
    - Dynamic GPS sampling interval (10–30s in motion, 30–60s stationary): requires real-world road testing across low-end Android devices to evaluate battery impact.
    - Statutory Employee Consent Forms under Indonesian UU PDP (UU No. 27/2022) must be vetted and signed off by qualified legal counsel prior to rollout.
    - Mobile OS background execution resilience: testing auto-resumption reliability across custom Android OEM ROMs (MIUI, ColorOS, OneUI) after long scheduled break intervals.

#### 5. Enterprise Money Management Platform Scope vs. Payment Gateway Escrow

- **Existing Documented Decision**: Invariant 1 and Section 1 clarify that SMS is an enterprise money management platform, not a bank. Finance modules track cash custody, cashier handovers, and installment debt.
- **New Ecosystem Requirement**: Section 1.B and Section 4 require online payments via digital payment gateways (QRIS, Virtual Accounts, Credit Cards).
- **Architectural Reconciliation**:
  - SMS does not hold customer deposits or operate an escrow wallet.
  - Third-party licensed payment gateways (Midtrans, Xendit) handle fund processing, payment clearance, and statutory central bank compliance.
  - The SMS backend acts purely as the merchant ledger, receiving cryptographic webhook notifications and recording settled transactions into `CustomerPayment` registers.

#### 6. Deposit-First Procurement Authorization vs. Consolidated Bulk Supplier Purchasing

- **Existing Documented Decision**: Backlog `[P.3]` and Procurement Module consolidate demand across backordered sales orders to achieve supplier bulk volume pricing and minimal shipping costs.
- **New System Requirement**: A supplier purchase order for customer-demanded products cannot proceed until the required customer deposit has been received and confirmed.
- **Architectural Reconciliation**:
  - The demand consolidation engine must filter out sales order requirements that have not met their deposit threshold. Only deposit-cleared requirements can be attached to committed supplier purchase orders.
  - If a supplier requires minimum order quantities (MOQ) and remaining quantities are pending customer deposits, the purchasing manager may either hold the PO draft or authorize store buffer stock to fulfill the MOQ with administrative approval.
  - _Open Question for Discussion_: If a customer cancels their order before the supplier delivers the product, what cancellation penalty or refund deduction applies, and does the ordered item convert into unsold store inventory upon delivery?

#### 7. Dual-Axis Fulfillment Choice (Completeness vs. Method) vs. Logistics Route Optimization

- **Existing Documented Decision**: Traditional logistics dispatch assigns entire sales orders to delivery trips based on destination proximity and vehicle capacity.
- **New System Requirement**: Section 2.6.4 and Section 2.8.2 establish orthogonal fulfillment axes: Decision A (Fulfillment completeness: complete vs. partial, decided by customer) and Decision B (Fulfillment method: home delivery via own-driver vs. customer store pickup).
- **Architectural Reconciliation**:
  - Fulfillment groups serve as the operational unit for dispatch. If a customer chooses partial fulfillment with mixed methods (e.g., immediate store pickup for in-stock accessories, and home delivery next week for backordered furniture), the system creates two separate fulfillment groups with different fulfillment methods and delivery tracking lifecycles.
  - Employees may suggest method or grouping adjustments based on operational constraints, but adjustments strictly require explicit customer consent and an immutable audit log entry.
  - _Open Question for Discussion_: When a customer selects partial fulfillment resulting in multiple home delivery trips, should additional delivery fees be charged per split trip, or is delivery bundled into the overall sales order pricing?

---

## 8. Chronological Task Execution History

- **2026-10-31 (Update 24)**:
  - **Driver License (SIM) Registration, 30-Day Expiry Monitoring & Proactive Notifications (Version 3.23 / Backlog `[Q.40]`)**:
    - **Database Migration (`core-backend`)**: Created Flyway migration `V40__driver_license_and_expiry_notifications.sql` defining `driver_license` table with foreign key to `employee`, indexes, and unique constraint on `(employee_id, license_type)`.
    - **Backend Services & Cron Dispatch (`core-backend`)**:
      - Created `DriverLicenseType.java` enum supporting Indonesian SIM classes (`SIM_A`, `SIM_B1`, `SIM_B1_UMUM`, `SIM_B2`, `SIM_B2_UMUM`, `SIM_C`).
      - Created entity `DriverLicense.java`, `DriverLicenseRepository.java`, and DTOs.
      - Implemented `createDriverLicense`, `updateDriverLicense`, `deleteDriverLicense`, and `getDriverLicenses` in `FleetService.java`.
      - Implemented `scanAndNotifyExpiringLicenses`: daily cron job (`0 0 7 * * *`) scans licenses expiring within 30 days and dispatches multi-channel in-app and mobile push alerts to drivers via `NotificationService.create(...)`, throttled to at most once per 24 hours.
      - Implemented `sendLicenseRenewalReminder` manual dispatch trigger for fleet managers.
      - Enriched `getAvailableDrivers` in `FleetService.java` with driver license status and remaining days.
      - Added REST endpoints in `FleetController.java` (`/drivers/{employeeId}/licenses`, `/driver-licenses/{licenseId}`, `/driver-licenses/{licenseId}/send-reminder`, `/driver-licenses/expiring`, `/driver-licenses/scan-expirations`).
      - Verified backend with 19/19 JUnit tests passing in `FleetServiceTest.java`.
    - **Frontend Application (`sms-web`)**:
      - Added API types and queries/mutations in `fleetApi.ts` and `hooks.ts`.
      - Built `DriverLicenseDialog.tsx` component with permits registry table, status badges (`VALID`, `EXPIRING_SOON`, `EXPIRED`), manual reminder notification dispatch button, and license registration/edit modal.
      - Connected SIM badge button and driver license status into `TruckListPage.tsx` and `AssignDriverDialog`.
      - Verified with 6/6 Vitest tests passing in `TruckListPage.test.tsx` and successful `npm run build`.

- **2026-10-31 (Update 23)**:
  - **Master Data Truck Phase 2 — Service Logs, GPS Delivery Distance Analytics & Monthly Health Check Checklists (Version 3.22 / Backlog `[Q.36]`)**:
    - **Database Migration (`core-backend`)**: Added Flyway migration `V39__truck_service_logs_and_health_checks.sql` defining `vehicle_service_log` and `vehicle_monthly_health_check` tables with foreign keys and performance indexes.
    - **Backend Services & Controllers (`core-backend`)**:
      - Created JPA entities `VehicleServiceLog.java` and `VehicleMonthlyHealthCheck.java`, with repositories and DTOs.
      - Implemented `createServiceLog` in `FleetService.java`: records maintenance costs, service center, parts replaced, and automatically syncs vehicle `odometerKm`, `lastServiceOdometerKm`, and `lastServiceDate`.
      - Implemented `createMonthlyHealthCheck` in `FleetService.java`: records 10-point inspection checklist; automatically sets vehicle status to `MAINTENANCE` if rating is `UNFIT_FOR_ROAD`.
      - Implemented `getTruckTravelDistance` in `FleetService.java`: computes all-time delivery distance (km), current month delivery distance (km), completed delivery trip count, and odometer distance since last service from `tracking_session` delivery records.
      - Added REST endpoints in `FleetController.java` (`/vehicles/{id}/service-logs`, `/vehicles/{id}/monthly-health-checks`, `/vehicles/{id}/travel-distance`).
      - Verified backend with 16/16 JUnit tests passing in `FleetServiceTest.java`.
    - **Frontend Application (`sms-web`)**:
      - Added API types and queries/mutations in `fleetApi.ts` and `hooks.ts`.
      - Built `TruckDetailsDialog.tsx` with 3 comprehensive tabs: Service Logs (spend KPIs, workshop records, modal to record maintenance), Travelled Distance (GPS delivery analytics, recent trip table), and Monthly Health Checks (color-coded rating cards, 10-point checklist badges, modal to submit inspection).
      - Connected details dialog into `TruckListPage.tsx` with table action buttons.
      - Verified with 5/5 Vitest tests passing in `TruckListPage.test.tsx` and successful `npm run build`.

- **2026-10-31 (Update 22)**:
  - **Preload Critical Above-The-Fold Hero Assets (`[P.22]`) & Todo List Cleanup (Version 3.20)**:
    - **ADR-12 & Todo List Hygiene**: Removed `ADR-12` (`[P.29]`), `[P.22]`, and all completed `[x]` tasks from the bottom Todo List (Section 9) and consolidated their full architectural explanations at the top of the document (**Section 2.3** for ADR-12 and **Section 3 / Feature 19.16** for `[P.22]`), ensuring Section 9 strictly tracks active pending `[ ]` todo items.
    - **Backend (`core-backend`)**: Extended `ImageOptimizationService.java` (`ResponsiveImageSet` record) with `preloadLinkHeader` and `preloadHtmlTag` generators emitting W3C-compliant `Link: <...>; rel=preload; as=image; type="image/webp"; imagesrcset="..."; imagesizes="..."; fetchpriority="high"` headers and `<link rel="preload" as="image">` HTML tags. Updated `ImageOptimizationController.java` (`GET /api/v1/storefront/images/responsive-set` and new `GET /api/v1/storefront/images/preload-hint`). Verified with 6/6 JUnit tests passing in `ImageOptimizationServiceTest.java`.
    - **E-commerce Web (`ecommerce-web`)**: Added `preloadCriticalImage` and `preloadCriticalImages` in `src/utils/imageOptimizer.ts` for idempotent `<head>` `<link rel="preload" as="image" fetchpriority="high">` injection. Added `priority?: boolean` prop to `ResponsiveImage.tsx` (`loading="eager"`, `decoding="sync"`, `fetchPriority="high"`) and `ProductCard.tsx`. Preloaded above-the-fold hero banners and top catalog product cards in `HomePage.tsx`, `CatalogPage.tsx`, `ProductDetailPage.tsx`, `index.html`, and `src/app/layout.tsx`. Verified with clean TypeScript and production build (`npm run build`).
    - **E-commerce Mobile (`ecommerce-mobile`)**: Enhanced `lib/core/image_optimizer.dart` with `preloadCriticalAsset` (`precacheImage`), `isPreloaded`, and `registerPreloadedUrl`. Verified with `flutter analyze` (0 issues) and `flutter test` (6/6 tests passing).
    - **New Recommendations Added**: Added `[P.38]` (HTTP 103 Early Hints & Edge Preconnect Dispatcher) and `[P.39]` (Core Web Vitals LCP/CLS Real-User Monitoring Telemetry) to Section 9 Todo List.

- **2026-10-31 (Update 21)**:
  - **Flash Sale and Tiered/Bundle Promotions (`[P.30]`, `[P.31]`)**:
    - Added V32 promotion scopes, flash-sale metadata, multi-variant bundle requirements, and auditable sales-order discount totals.
    - Implemented countdown and live available-stock meters on web and Flutter storefronts, 15-second stock refresh, management controls, tiered/order-total/bundle calculations, and mobile cart/checkout API integration with network-only mock fallback.
    - Flash-sale checkout rejects requested quantity above current available stock. Current stock display does not reserve units; newer V29–V32 migrations still require application/DDL verification on the live database.
    - Verification: 10 pricing tests, 4 storefront tests, 2 migration-validation tests; both web production builds and Flutter analysis passed.

- **2026-10-31 (Update 20)**:
  - **ADR-12 Formalization & Implementation: Next.js 15 E-commerce Web + Flutter 3.44 Mobile + Storefront API Gateway Boundary (Version 3.19 / Backlog `[P.29]`)**:
    - **Architectural Decision Finalized (`ADR-12`)**: Locked in **Next.js 15 (React 19)** for the E-commerce Website (`ecommerce-web`) and **Flutter 3.44 (Dart 3.12 / Riverpod 3)** for the E-commerce Mobile App (`ecommerce-mobile`), communicating through an isolated `/api/v1/storefront/*` API Gateway pattern.
    - **Backend Storefront API Gateway (`core-backend`)**:
      - Implemented `StorefrontApiGatewayFilter.java` (`@Order(Ordered.HIGHEST_PRECEDENCE + 10)`) enforcing strict boundary isolation between `PUBLIC_STOREFRONT_GATEWAY` (`/api/v1/storefront/**`) and `INTERNAL_ADMIN_BACKOFFICE` (`/api/**`). Storefront clients attempting to call back-office endpoints without an administrative Bearer JWT are blocked with HTTP `403 Forbidden` (`GATEWAY_ZONE_VIOLATION`).
      - Added channel attribution (`X-Client-Platform: NEXTJS_WEB` vs `FLUTTER_MOBILE` or automatic Dart User-Agent detection), response tracing (`X-Gateway-Request-Id`, `X-Storefront-Channel`), per-session/per-IP token-bucket rate limiting (`240 req/min` with `X-RateLimit-Remaining` and HTTP `429`), and Next.js ISR `stale-while-revalidate` edge cache headers.
      - Implemented `StorefrontGatewayController.java` (`GET /api/v1/storefront/gateway/status`) exposing live ADR-12 gateway diagnostics, registered client stacks, and non-banking merchant ledger compliance metadata.
      - Verified with 5/5 JUnit tests passing in `StorefrontApiGatewayTest.java`.
    - **Next.js 15 Storefront Architecture (`ecommerce-web`)**:
      - Created `next.config.ts` with `/api/v1/storefront/:path*` edge rewrites, image remote patterns, and ADR-12 gateway security headers.
      - Created Next.js App Router structure (`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/StorefrontClientShell.tsx`, `src/next-env.d.ts`) and updated `.env.example` with `NEXT_PUBLIC_*` variables.
      - Hardened `src/services/api.ts` with SSR-safe `typeof window !== 'undefined'` storage guards, dual `NEXT_PUBLIC_API_BASE_URL` / `VITE_API_BASE_URL` resolution, and `X-Client-Platform: NEXTJS_WEB` gateway headers.
      - Verified with clean TypeScript compilation and production build (`npm run build`).
    - **Flutter 3.44 Storefront Mobile (`ecommerce-mobile`)**:
      - Updated `lib/core/api_client.dart` to attach `X-Client-Platform: FLUTTER_MOBILE` and `X-App-Client: SMS-Ecommerce-Flutter/3.44` headers on all Dio gateway requests.
      - Updated `test/widget_test.dart` with `MockWishlistNotifier` override so all 5/5 Flutter tests and `flutter analyze` pass cleanly with 0 warnings.
    - **Documentation**: Updated `about_project.md` to Version 3.19, documented Feature 19.13, updated Section 5 Master Review Table (Row 73), marked `ADR-12` as resolved, marked `[P.29]` as completed in Section 9, and added new recommendations `[P.36]` and `[P.37]`.

- **2026-10-31 (Update 19)**:
  - **Master Documentation Architecture Restructure & Canonical Todo Relocation (Version 3.18)**:
    - Executed comprehensive documentation reorganization and architectural revamping across `about_project.md`.
    - **Canonical Backlog Relocation**: Moved the Master Action Backlog & Todo List to the **very bottom of the document** (Section 9) as requested, establishing a unified single source of truth for all pending and completed tasks.
    - **Architectural Governance Elevation**: Promoted Architectural Decision Records (ADR-01 to ADR-15) and the 7 core architectural tensions into a dedicated Section 7 directly following the gap analysis.
    - **Fresh Task & Feature Additions**: Added 14 high-value task recommendations across performance, showroom money management, mobile field ergonomics, customer experience, and logistics optimization:
      - _Performance & Caching_: Virtualized table windowing (`[E.8]`), persistent table filter presets (`[E.9]`), multi-tier hybrid caching (`[N.8]`).
      - _Showroom Money Management_: Shift-level cash drawer balancing & petty cash float reconciliation (`[D.7]`), commission leaderboard & tier tracker (`[G.17]`), slow-moving furniture & aged electronics liquidation discount advisor (`[I.10]`).
      - _Mobile Ergonomics_: Haptic & audio barcode feedback (`[C.7]`), offline showroom bundle builder (`[M.7]`), high-contrast outdoor theme (`[M.8]`).
      - _E-commerce Storefront_: Self-service delivery rescheduling portal (`[P.33]`), showroom branch stock availability indicator (`[P.34]`), WebXR AR furniture room preview (`[P.35]`).
      - _Logistics & Fleet_: Turn-by-turn navigation handoff to Google Maps/Waze (`[Q.30]`), LIFO multi-drop truck loading optimizer (`[Q.31]`).
    - Maintained 100% domain compliance with enterprise retail operations and money management invariants (strictly non-banking).

- **2026-10-31 (Update 18)**:
  - **Showroom Credit Price Calculator & Custom DP Negotiation Engine (Version 3.17 / Backlog `[G.14]`)**:
    - Addressed salesperson requirement for calculating installment pricing on the showroom floor when buyers suggest conditions beyond standard price lists (e.g., custom 10% down payment or arbitrary cash DP, evaluating tenors across 6, 10, 12, 15, 18, and 24 months).
    - **Backend Engine (`core-backend`)**:
      - Implemented `PriceCalculationService.java` executing the chain's official verified retail formula (VBA verified standard):
        - $h1 = (HD - DP) + 30$ (Net Financed Base + Rp 30.000 handling fee)
        - $h2 = h1 \times (1 + 0.04 \times T)$ (flat 4% monthly interest markup)
        - $h3 = h2 / T$ (gross monthly installment)
        - $h4 = h3 \times 0.85$ (15% commercial prompt-payment incentive rebate)
        - $\text{Angsuran} = \text{Round}(h4 / 5) \times 5 + 5$ (rounded to nearest 5k increment + Rp 5.000)
      - Implemented automatic bracket-based suggested DP thresholds (<5M = Rp 0, 5-6M = Rp 1M, 6-7M = Rp 1.5M, 7-8M = Rp 2M, >=8M = Rp 2.5M).
      - Added preview calculation and auto-apply REST endpoints in `PricingController.java` (`POST /api/stores/{storeId}/pricing/calculate`, `POST /api/stores/{storeId}/pricing/auto-apply`, `POST /api/stores/{storeId}/pricing/auto-apply-all`).
      - Verified backend calculation logic with 4 dedicated unit tests in `PriceCalculationServiceTest.java`.
    - **Worker Mobile Application (`workerapp-mobile`)**:
      - Built pure-Dart offline-capable `CreditCalculatorService.dart` mirroring company retail credit rules and generating formatted WhatsApp sharing templates.
      - Developed interactive `CreditCalculatorScreen.dart`:
        - Product Source Switcher: Toggle between Store Catalog Search (with auto-fill of variant cash prices) and Manual Input (custom bundles/packages).
        - Base Price (HD) Formatter: Real-time currency input with quick-add increment chips (+500rb, +1jt, +2jt, +5jt).
        - 3-Mode Down Payment Selector: Standard Tier Auto-DP, Percentage (%) ChoiceChips (0% to 40%), and Custom Nominal (Rp) for negotiated buyer deposits.
        - Real-Time Financial Metric Summary: Displays net financed base $h1$ and 15% prompt payment savings.
        - Multi-Tenor Comparison: Grid of interactive tenor cards (6, 10, 12, 15, 18, 24 months) highlighting standard 10, 12, 15 months, monthly dues, total customer cost, and monthly discount saved.
        - Transparent Formula Inspector: Expandable accordion explaining the 5 exact calculation steps for complete customer transparency.
        - Quick Action Toolbar: One-tap "Salin Simulasi untuk WhatsApp" copying formatted quotation to clipboard and "Gunakan Tenor" callback for order integration.
      - Integrated with `SalesWorkCenterScreen.dart`: Added direct "Kalkulator & Simulasi Kredit" hero banner card and item simulation buttons in product search results.
      - Added direct route `/sales-calculator` in `app_router.dart` and 1-tap quick action launcher in `worker_home_screen.dart` for showroom salespersons.
    - **Verification**:
      - 12/12 backend pricing JUnit tests passed (`PriceCalculationServiceTest`, `PriceDiscountServiceTest`).
      - 19/19 mobile Flutter tests passed (`credit_calculator_test.dart` + full mobile suite).
      - `flutter analyze` clean with 0 warnings or issues.
    - **Documentation**: Updated `about_project.md` to Version 3.17, documented Feature 3.6, updated Section 5 Master Review Table (Row 72), marked `[G.14]` as completed in Section 7, and registered backlog recommendations `[G.15]` and `[G.16]`.
    - **Discount Date Validity Scheduling Hardening (`validFrom` / `validUntil`)**:
      - Verified end-to-end promotional validity scheduling across database (`V30__promotional_price_discounts.sql`), backend queries (`findActiveDiscountsForVariant`), and DTO contracts.
      - Enhanced `sms-web` (`PriceDiscountDialog.tsx` and `PricingPanel.tsx`): Added promo edit workflow (`useUpdatePriceDiscount`), prefilled date pickers, date interval formatting (`DD/MM/YYYY s/d DD/MM/YYYY`), and intelligent real-time schedule status badges (`Aktif`, `Terjadwal`, `Kedaluwarsa`, `Nonaktif`).
      - Verified: Vitest component tests and Vite production build passed cleanly.

- **2026-10-31 (Update 17)**:
  - **Implementation of Omnichannel Promotional Price Discounts & Campaign Engine (Version 3.16 / Backlog `[P.28]`)**:
    - Built comprehensive promotional price discount framework supporting multi-store retail chain operations for electronics, home appliances, and furniture.
    - **Database Migration (`V30__promotional_price_discounts.sql`)**: Created `price_discount` table supporting percentage & fixed amount discounts, store branch scoping (null = all stores), variant/product targeting, date validity periods, minimum order amounts, maximum percentage discount caps, and priority ranking.
    - **Backend Engine (`core-backend`)**:
      - Created entities, repositories, and DTOs (`PriceDiscount.java`, `PriceDiscountRepository.java`, `DiscountCalculationRequest.java`, `DiscountCalculationResult.java`).
      - Implemented `PriceDiscountService.java` with best-savings algorithm evaluating all applicable active campaigns and selecting the discount providing maximum customer benefit.
      - Exposed REST endpoints in `PriceDiscountController.java` (`GET /api/pricing/discounts`, `POST`, `PUT`, `DELETE`, `/toggle-active`, `/calculate`) protected under `PRICING_MANAGE` RBAC.
      - Integrated into `StorefrontCatalogService.java`, `StorefrontCartService.java`, and `StorefrontCheckoutService.java` ensuring consistent price calculation across online storefronts and physical sales orders.
    - **Web Management System (`sms-web`)**:
      - Upgraded `PricingPanel.tsx` with dual tabs ("Harga Tunai & Tenor" vs "Diskon Promo Toko").
      - Created `PriceDiscountDialog.tsx` allowing store managers to configure promotional discounts with time windows and caps.
      - Supported active/inactive toggles and promotional campaign deletions.
      - Verified with clean production build (`tsc -b && vite build`) and passing Vitest component test (`PricingPanel.test.tsx`).
    - **Customer E-commerce Web (`ecommerce-web`)**:
      - Enhanced `ProductCard.tsx` and `ProductDetailPage.tsx` with dynamic `-X%` discount badges, strikethrough original prices, and "Hemat Rp X" savings displays.
      - Updated `CartPage.tsx` with line-item promo labels and dedicated "Diskon Promo Toko" row in order breakdown.
      - Verified with clean production build (`tsc -b && vite build`).
    - **Customer E-commerce Mobile (`ecommerce-mobile`)**:
      - Updated `product_model.dart` and `cart_model.dart` with discount fields.
      - Verified with `flutter analyze` (0 issues).
    - **Verification**:
      - 14/14 JUnit tests passed (`PriceDiscountServiceTest`, `FlywayMigrationValidationTest`, `StorefrontServiceTest`).
      - All TypeScript and Flutter checks passed with 0 errors.
    - **Documentation**: Updated `about_project.md` to Version 3.16, detailed Feature 3.5, updated Section 5 Master Review Table (Row 71), marked `[P.28]` as completed in Section 7, and registered backlog recommendations `[P.30–P.32]`.

- **2026-10-31 (Update 16)**:
  - **Cross-Platform Persistent Wishlist & Saved Items with Price Drop Indicators (Version 3.15 / Backlog `[P.16]`)**:
    - Executed Backlog item `[P.16]` across Spring Boot backend (`core-backend`), React web storefront (`ecommerce-web`), and Flutter mobile storefront (`ecommerce-mobile`).
    - Database (`V29__storefront_persistent_wishlist.sql`): Created `customer_wishlist_item` table with `customer_id`, `session_id`, `product_id`, `variant_id`, `added_price`, and `notes`, with compound unique constraints for unauthenticated guest and authenticated customer scoping.
    - Backend Engine (`StorefrontWishlistService.java` & `StorefrontWishlistController.java`): Built wishlist retrieval (`GET /api/v1/storefront/wishlist`) with live price drop calculations (`hasPriceDrop`, `priceDropAmount`, `priceDropPercentage`), item addition and removal, guest-to-customer wishlist synchronization (`POST /sync`), direct cart migration (`POST /{id}/move-to-cart`), and interactive price drop simulation (`POST /simulate-price-drop`). Pure money management & retail catalog tracking maintained.
    - Web Storefront (`ecommerce-web`): Built `WishlistContext.tsx`, `WishlistPage.tsx` with savings hero banner and simulation trigger, updated `ProductCard.tsx` and `ProductDetailPage.tsx` with interactive heart toggles, and added dynamic wishlist badge with price-drop indicator to `Navbar.tsx`. Verified with `npm run build` production build passing cleanly.
    - Mobile Storefront (`ecommerce-mobile`): Created `wishlist_model.dart`, Riverpod `wishlist_provider.dart`, native `wishlist_screen.dart` with WebP and LQIP placeholders, added AppBar wishlist heart badge to `HomeScreen` and `CatalogScreen`, and toggle buttons in catalog cards and `ProductDetailScreen`. Verified with `flutter test` (4/4 tests passing) and `flutter analyze` (0 issues).
    - Verification: 5/5 Wishlist JUnit tests passed (100% pass rate); web and mobile builds 100% clean.
    - Documentation: Updated `about_project.md` to Version 3.15, detailed Feature 19.12, updated Section 5 Review Table Row 69 (`100%`), marked `[P.16]` as completed in Section 7, and registered backlog recommendations `[P.26]` and `[P.27]`.

- **2026-10-30 (Update 15)**:
  - **Implementation of Customer Store Pickup Fulfillment & In-Store Staging Module (Version 3.14 / Backlog `[P.5]`)**:
    - Executed Backlog item `[P.5]` across Spring Boot backend (`core-backend`), React web storefront (`ecommerce-web`), and Flutter mobile storefront (`ecommerce-mobile`).
    - Database (`V28__storefront_pickup_staging.sql`): Extended `fulfillment_group` with columns `staging_rack_location`, `pickup_pass_code`, `pickup_qr_payload`, `staged_at`, `staged_by_staff_name`, `handed_over_at`, `handed_over_by_staff_name`, `handover_recipient_name`, `handover_recipient_phone`, and `handover_notes` with GiST/B-tree index on `pickup_pass_code`.
    - Backend Engine (`StorefrontPickupService.java` & `StorefrontPickupController.java`): Built pickup pass retrieval (`/pickup/pass/{orderNumber}`), staff staging action (`POST /pickup/stage`) with automatic FCM push notification milestone `STORE_PICKUP_READY`, and counter cashier handover verification (`POST /pickup/verify-handover`) supporting remaining balance settlement at the showroom desk (money management invariant).
    - Web Storefront (`ecommerce-web`): Created `PickupPassModal.tsx` rendering high-contrast QR matrix simulation canvas, copyable PIN pill (`PKP-XXXX-XXXX`), store directions, and interactive staff demo controls for staging and handover. Integrated into `OrderTrackingPage.tsx` and `OrderSuccessPage.tsx`. Verified with `npm run build` passing cleanly.
    - Mobile Storefront (`ecommerce-mobile`): Created `pickup_model.dart`, added API client methods in `api_client.dart`, and built native `pickup_pass_screen.dart` with live staging badges and counter handover tools. Deep-linked from `OrderTrackingScreen` and `OrderSuccessScreen`. Verified with `flutter analyze` (0 issues) and `flutter test` (all tests passing).
    - Verification: 18/18 Storefront JUnit tests passed; web and mobile builds 100% clean.
    - Documentation: Updated `about_project.md` to Version 3.14, detailed Feature 19.11, updated Section 5 Review Table Row 44 (`100%`), marked `[P.5]` as completed in Section 7, and registered backlog recommendations `[P.24]` and `[P.25]`.

- **2026-10-30 (Update 14)**:
  - **Live Environment & Infrastructure Orchestration Provisioning (Version 3.13 / Backlog `[A.1–A.5]`)**:
    - Executed all 5 master infrastructure deployment tasks `[A.1–A.5]` establishing production readiness across cloud database, cache, schema contiguity, multi-service containers, and standardized environments.
    - **Live Supabase Provisioning (`[A.1]`)**: Configured connection pooler specifications targeting Supabase Transaction Pooler (Port 6543) with PgBouncer compatibility flags (`sslmode=require&prepareThreshold=0`). Configured Supabase Auth OAuth2 Resource Server via JWKS URI validation. Authored `supabase_storage_and_rls_setup.sql` creating buckets `sms-documents` (50MB private), `sms-photos` (20MB private), and `sms-signatures` (5MB private) with storage RLS policies.
    - **Redis 7 In-Memory Engine (`[A.2]`)**: Authored production-ready `redis.conf` with password authentication, 512MB RAM cap, `volatile-lru` eviction, and Append-Only File (AOF) persistence (`appendonly yes`, `appendfsync everysec`) ensuring zero-loss durability for atomic document sequence counters (`DOC_SEQ:SO:*`, `DOC_SEQ:PO:*`, etc.).
    - **Flyway Database Migrations V1-V28 Contiguity & Verification (`[A.3]`)**: Verified all 28 Flyway migration files provisioning 87 canonical domain tables. Created `verify_migrations.ps1` and `FlywayMigrationValidationTest.java` running contiguous integrity checks without gap errors.
    - **Docker Orchestration & Testcontainers (`[A.4]`)**: Authored root `docker-compose.yml` orchestrating PostgreSQL (PostGIS), Redis 7, backend, management web, and e-commerce web. Authored multi-stage Dockerfiles for `core-backend` (Java 21 Temurin), `sms-web` (React 19 / Nginx), and `ecommerce-web` (React 19 / Nginx). Implemented `InfrastructureIntegrationTest.java` with Testcontainers PostgreSQL and Redis, featuring graceful fallback (`@Testcontainers(disabledWithoutDocker = true)`).
    - **Universal Environment Templates & Deployment Guide (`[A.5]`)**: Published `.env.example` templates for root, backend, sms-web, ecommerce-web, workerapp-mobile, and ecommerce-mobile. Created `application-prod.yml` with Hikari connection pool tuning and batch optimizations. Published `docs/infrastructure_setup_guide.md` covering end-to-end setup and runbooks.
    - **Verification**: 108/108 backend tests passing cleanly.
    - **Documentation**: Updated `about_project.md` to Version 3.13, detailed Feature 20, marked `[A.1–A.5]` as completed, and added tasks `[A.6–A.8]`.

- **2026-10-30 (Update 13)**:
  - **Automated Fleet Asset Servicing & KIR/STNK Expiry Alert Engine (Version 3.12)**:
    - Executed Backlog item `[Q.21]` across Spring Boot backend and React management web SPA.
    - Database (`core-backend`): Created Flyway migration `V27__fleet_maintenance_reminders.sql` adding `last_service_odometer_km`, `last_service_date`, `service_interval_km` to `vehicle` entity with realistic Samsat STNK and Dishub KIR test seed data.
    - Backend (`core-backend`): Enabled scheduling (`@EnableScheduling` in `SmsBackendApplication`), implemented daily automated cron scan (`@Scheduled(cron = "0 0 7 * * *")` in `FleetService`), added `GET /api/v1/fleet/maintenance-alerts` and `POST /api/v1/fleet/vehicles/{id}/service-log` in `FleetController`, and verified with 9 unit tests passing in `FleetServiceTest`.
    - Web (`sms-web`): Added `FleetMaintenanceAlertDto` and `recordVehicleService` in `fleetApi.ts`. Updated `FleetMonitoringPage.tsx` with prominent maintenance alert warning banner, STNK/KIR expiry status badges, service milestone countdown badges, and interactive `Record Vehicle Service` dialog. Verified with 5/5 Vitest component tests passing and production build (`npm run build`) 100% clean.
    - Documentation: Updated `about_project.md` to Version 3.12, detailed `Feature 18.16`, updated Section 5 Review Table Row 66, moved `[Q.21]` to completed, and proposed backlog recommendations `[Q.26]` and `[Q.27]`.

- **2026-10-30 (Update 12)**:
  - **BlurHash & Low-Quality Image Placeholders (LQIP) Implementation (Version 3.11)**:
    - Executed Backlog item `[P.20]` across Spring Boot backend, React web storefront, and Flutter mobile application.
    - Backend (`core-backend`): Added `generateLqip` in `ImageOptimizationService` producing inline base64 SVG shimmers with Gaussian blur filter and ambient color palettes. Exposed `/api/v1/storefront/images/lqip` in `ImageOptimizationController` and updated `ResponsiveImageSet` record. Verified with JUnit tests in `ImageOptimizationServiceTest` (5/5 tests passing).
    - Web (`ecommerce-web`): Created client-side `generateLqip` in `imageOptimizer.ts` and updated `ResponsiveImage.tsx` with smooth cross-fade `opacity-0` -> `opacity-100` on image load without Cumulative Layout Shift (CLS). Verified with production build passing cleanly.
    - Mobile (`ecommerce-mobile`): Added `getLqipGradient` and `buildLqipPlaceholder` in `image_optimizer.dart` and integrated into `HomeScreen`, `CatalogScreen`, `ProductDetailScreen`, and `CartScreen` via `Image.network(..., loadingBuilder: ...)`. Verified with `flutter analyze` (0 issues) and `flutter test` (all tests passing).
    - Documentation: Updated `about_project.md` to Version 3.11, detailed Feature 19.10, updated Section 5 Review Table (Row 65), moved `[P.20]` to completed `[x]`, and added recommendations `[P.22]` and `[P.23]`.

- **2026-10-30 (Update 11)**:
  - **Implementation of Battery Temperature Safety Cutoff Engine (Version 3.10)**:
    - Executed **Battery Temperature Safety Cutoff** (Backlog `[Q.19]`) in Worker Mobile App (`workerapp-mobile`).
    - Safety State Machine (`fleet_tracking_service.dart`): Added `batteryTemperatureCelsius` (default 32.0°C) and `isThermalCutoffActive` to `FleetTrackingState`.
    - Safety Thresholds: Configured `maxSafeBatteryTemperatureCelsius = 45.0°C` and `safeRecoveryTemperatureCelsius = 40.0°C` (5°C hysteresis margin).
    - Protection Logic: When temperature > 45°C under direct tropical sunlight, `updateBatteryTemperature` immediately cancels continuous GPS timer, sets `isThermalCutoffActive: true`, records `BATTERY_THERMAL_CUTOFF` event, and updates notification tray to overheating alert. Resumes tracking automatically when battery cools to <= 40°C while honoring break window constraints.
    - Safety UI (`active_tracking_banner.dart`): Built crimson safety alert badge (`Icons.whatshot`) detailing thermal suspension reason and auto-recovery guidance. Embedded live temperature indicator into active tracking subtitle.
    - Verification: Verified via unit and widget tests in `fleet_tracking_test.dart` (cutoff at 46.2°C, recovery at 38.5°C, UI thermal banner rendering). All 11 Flutter tests passing; `flutter analyze` 100% clean.
    - Documentation: Updated `about_project.md` to Version 3.10, detailed `Feature 18.15`, updated Section 5 Review Table Row 64, marked `[Q.19]` as completed in Section 7, and registered backlog recommendations `[Q.24]` and `[Q.25]`.

- **2026-10-30 (Update 10)**:
  - **Implementation of Quick Manual Pause from Ongoing System Notification (Version 3.9)**:
    - Executed **Quick Manual Pause from Ongoing System Notification** (Backlog `[Q.16]`) in Worker Mobile App (`workerapp-mobile`).
    - Service Implementation (`fleet_tracking_service.dart`): Added `quickNotificationPause([reason])`, `quickNotificationResume()`, and `handleSystemNotificationAction(actionCode)` to `FleetTrackingNotifier`. Maintained state fields for ongoing foreground notification title, body, and action intents (`QUICK_PAUSE`, `QUICK_RESUME`).
    - Robust State Clearing: Added `clearPauseReason: true` flag in `FleetTrackingState.copyWith` ensuring clean resumption to `active` state and strict enforcement of scheduled break window (12:00-13:00) if resumption occurs during lunch hours.
    - User Interface (`active_tracking_banner.dart`): Added instant 1-tap "Quick Pause" button on active tracking banner alongside full reason dialog, and created simulated Android system notification drawer tray widget with interactive `[NOTIF PAUSE]` and `[NOTIF RESUME]` action triggers.
    - Integrated `ActiveTrackingBanner` into `DriverTripScreen` (`driver_trip_screen.dart`), `SurveyorTaskScreen`, and `CollectorVisitScreen`.
    - Verification: Verified via automated unit & widget tests in `sms_mobile/test/features/fleet_tracking_test.dart` (all 5 tests passing; full suite 10/10 tests passing; `flutter analyze` 0 issues).
    - Documentation: Updated `about_project.md` to Version 3.9, detailed `Feature 18.14`, updated Section 5 Review Table Row 63, marked `[Q.16]` as completed in Section 7, and registered backlog recommendations `[Q.22]` and `[Q.23]`.

- **2026-10-30 (Update 9)**:
  - **Implementation of Fleet Operational Analytics & Productivity Reporting Engine (Version 3.8)**:
    - Executed **Fleet Operational Analytics & Productivity Reporting** (Backlog `[Q.11]`) across backend (`core-backend`) and web management UI (`sms-web`).
    - DTO & Domain Design: Created `FleetAnalyticsDto`, `VehicleUtilizationDto`, and `RoleProductivityDto` tracking mileage, active/paused durations, multi-role completion volumes (driver delivery drops, credit surveys, collection visits), average visit and transit durations, vehicle capacity utilization rates, and operational interruption tallies.
    - Backend Engine (`FleetService.java` & `FleetController.java`): Implemented `GET /api/v1/fleet/analytics` with parameters `storeId`, `startDate`, and `endDate`. Aggregates live session telematics and vehicle assets, complemented with realistic operational benchmark seeds for seamless initial branch configuration.
    - Web Dashboard (`FleetMonitoringPage.tsx`): Introduced **Tab 4: 📊 Fleet Analytics & Productivity** featuring period filtering (Today, Last 7 Days, Month-to-Date), Refresh action, "Export CSV Report" downloader, 4 primary KPI cards, Role Productivity Breakdown table, Vehicle Utilization matrix, and Telematics Interruptions audit summary.
    - Statutory Ethical Safeguard Notice: Prominently delivered operational alert mandating that GPS-derived telemetry reflects machine observations only and must never be used as the sole or definitive basis for punitive employee action without human evaluation of field factors (weather, Jakarta traffic, heavy furniture stair climbs, cellular blind spots, customer delays).
    - Verification: Verified via unit test `FleetServiceTest.java` (backend analytics and notice validation) and 5 component tests in `FleetMonitoringPage.test.tsx` (all passing; production build `tsc -b && vite build` passing cleanly in 2.17s).
    - Documentation: Updated `about_project.md` to Version 3.8, marked `Feature 18.11` as `[IMPLEMENTED & INTEGRATED]`, moved `[Q.11]` from pending to completed, updated Section 5 Review Table Row 57, and registered roadmap tasks `[Q.20]` and `[Q.21]`.

- **2026-10-30 (Update 7)**:
  - **Implementation of Multi-Resolution Image CDN & WebP Optimization Pipeline (Version 3.8)**:
    - Executed **Multi-Resolution Image CDN & WebP Pipeline** (Backlog `[P.14]`) across backend, web storefront, and mobile app.
    - Presets: Standardized into `THUMBNAIL` (150x150, q=80), `CARD` (400x400, q=82), and `HERO` (1000x1000, q=88), producing ~70% payload size savings.
    - Backend (`core-backend`): Created `ImageOptimizationService` and `ImageOptimizationController` providing `/responsive-set` and `/transform` proxy with 30-day immutable cache headers. Verified with 4 unit tests in `ImageOptimizationServiceTest` (all 12 Storefront tests passing).
    - Web (`ecommerce-web`): Created `imageOptimizer.ts` and `ResponsiveImage.tsx` (`<picture>` with `srcSet` and lazy loading). Integrated into `ProductCard`, `ProductDetailPage`, `CartPage`, and `CartDrawer`. Verified with `npm run build` passing in 19.02s.
    - Mobile (`ecommerce-mobile`): Created `ImageOptimizer` in Dart and integrated into `HomeScreen`, `CatalogScreen`, `ProductDetailScreen`, and `CartScreen`. Verified with `flutter analyze` (0 issues found) and `flutter test` (all tests passed).
    - Documentation: Updated `about_project.md` to Version 3.8, moved `[P.14]` to completed features list with detailed explanation, updated Section 5 review table (Row 62), and added new backlog recommendations `[P.20]` and `[P.21]`.

- **2026-10-30 (Update 6)**:
  - **Implementation of Mobile Push Notification Engine (FCM / APNs) (Version 3.7)**:
    - Executed **Mobile Push Notification Engine** (Backlog `[P.13]`) across Spring Boot backend and Flutter mobile application.
    - Database: Created Flyway migration `V26__storefront_push_notifications.sql` defining `customer_device_token` and `storefront_push_notification_log` tables with indices.
    - Backend: Created entities, repositories, DTOs, `StorefrontPushNotificationService`, and `StorefrontNotificationController` (`POST /device-token`, `GET /notifications`, `PUT /{id}/read`, `POST /trigger-milestone`).
    - Milestones: Supported all 4 order lifecycle milestones: `DEPOSIT_CONFIRMED`, `PO_PLACED`, `DRIVER_EN_ROUTE`, and `STORE_PICKUP_READY`. Connected `StorefrontCheckoutService.simulatePayment` to automatically trigger `DEPOSIT_CONFIRMED` push notification.
    - Verification: Unit tests in `StorefrontPushNotificationServiceTest` and `StorefrontServiceTest` passed (8/8 tests passed).
    - Mobile Frontend (`ecommerce-mobile`): Created `NotificationItem` model, `NotificationNotifier`, interactive `NotificationScreen` with milestone category chips, deep-links to `OrderTrackingScreen`, unread count badge in `HomeScreen` AppBar, and instant notification receipt on payment simulation in `OrderSuccessScreen`.
    - Verification: `flutter analyze` (0 issues found) and `flutter test` (all tests passed).
    - Documentation: Updated `about_project.md` to Version 3.7, moved `[P.13]` to completed features list with detailed explanation, updated Section 5 review table (Row 61), and added new backlog recommendations `[P.18]` and `[P.19]`.

- **2026-10-30 (Update 6)**:
  - **Low-Battery Adaptive GPS Throttling Implementation (Version 3.7)**:
    - Executed Backlog item `[Q.17]` in Flutter Worker Mobile App (`workerapp-mobile`).
    - Enhanced `FleetTrackingService` with real-time battery level monitoring (`updateBatteryLevel`), adaptive collection intervals (15s normal -> 60s throttled when battery < 15%), and automatic recovery when recharging.
    - Dispatches `BATTERY_LOW_THROTTLE` and `BATTERY_RECOVERED` session lifecycle events to backend `/api/v1/fleet/sessions/{id}/events`.
    - Updated `ActiveTrackingBanner` with amber power conservation warning chip: `"Task bounded • Low Battery (X%) • Throttled 60s"`.
    - Added comprehensive test coverage in `workerapp-mobile/test/features/fleet_tracking_test.dart` (all 9 Flutter tests passing, clean `flutter analyze`).
    - Updated `about_project.md` to Version 3.7, moved `[Q.17]` from todo list to completed feature list, and added roadmap recommendations `[Q.18–Q.19]`.

- **2026-10-30 (Update 5)**:
  - **Full Implementation of E-Commerce Platform (Version 3.6)**:
    - Executed the proposed **Integrated E-Commerce Platform & Omnichannel Storefront** (Backlog `[P.1]`, `[P.2]`, `[P.4]`, `[P.6]`, `[P.7]`, `[P.11]`, `[P.12]`) across consolidated backend, web storefront, and mobile application.
    - Consolidated Backend in `core-backend`:
      - Created Flyway migration `V25__storefront_ecommerce.sql` establishing `storefront_customer`, `storefront_address`, `storefront_payment_method` (seeding 9 methods), `customer_cart`, `customer_cart_item`, `fulfillment_group`, and `fulfillment_group_item`, with expanded `sales_order` source tracking (`ONLINE_WEB`, `ONLINE_APP`, `EMPLOYEE`).
      - Created domain models, repositories, DTOs, and Spring Boot REST controllers (`StorefrontProductController`, `StorefrontCartController`, `StorefrontCheckoutController`, `StorefrontOrderController`, `StorefrontAuthController`).
      - Created `StorefrontCatalogService` (decoupling commercial availability and lead time from physical stock), `StorefrontCartService`, and `StorefrontCheckoutService` (enforcing Unified Sales Logic, Dual-Axis fulfillment partitioning, Deposit-First 30% DP procurement gating, dynamic QRIS/VA generation, and payment simulation webhook).
      - Verified via unit test suite `StorefrontServiceTest` (4/4 JUnit tests passing, build success in 40.8s).
    - Customer E-Commerce Web Application (`ecommerce-web`):
      - Built full-featured customer storefront with React 19, TypeScript, Vite, and Tailwind CSS.
      - Implemented `HomePage`, `CatalogPage` (faceted search & availability filters), `ProductDetailPage`, `CartPage` (quantity steppers), `CheckoutPage` (Dual-Axis fulfillment & 9 payment methods), `OrderSuccessPage` (QRIS & VA display), `OrderTrackingPage` (timeline tracker), and `AuthPage`.
      - Verified with `npm run build` production build passing in 5.76s.
    - Customer E-Commerce Mobile Application (`ecommerce-mobile`):
      - Built cross-platform mobile shopping app with Flutter 3.44, Dart 3.12, Riverpod 3 (modern `Notifier` & `NotifierProvider`), and Dio.
      - Implemented `MainNavScreen` (5-tab navigation with live cart badge), `HomeScreen`, `CatalogScreen`, `ProductDetailScreen`, `CartScreen`, `CheckoutScreen`, `OrderSuccessScreen`, `OrderTrackingScreen`, and `ProfileScreen` (transparent in-house credit limit facility overview).
      - Verified with `flutter analyze` (0 issues found) and `flutter test` (all tests passed).
    - Documentation: Updated `about_project.md` to Version 3.6, moved completed items from Backlog P to completed features, updated Section 5 review table, gap analysis, and added new backlog recommendations `[P.13–P.17]`.

- **2026-10-30 (Update 5)**:
  - **Worker Mobile App Logistics & Fleet Tracking Integration (Version 3.6)**:
    - Executed full client integration in Flutter Worker Mobile App (`workerapp-mobile`) for Backlog item `[Q.9]`, uniting mobile field operations with backend `/api/v1/fleet/*` endpoints and web monitoring dashboard.
    - Implemented `FleetTrackingService` (Riverpod `fleetTrackingProvider`) providing:
      - Task-bounded tracking lifecycle: explicit session start on Driver trip dispatch, Surveyor assessment start, or Collector visit start; automatic closure on completion.
      - **Salesperson Exclusion Invariant**: strictly blocks any location tracking attempt if user has the `SALESPERSON` role.
      - **Strict Scheduled Break Governance**: automated watchdog timer detects break windows (12:00–13:00) and switches state to `pausedBreak`, completely suspending coordinate transmission (zero GPS coords collected or sent during breaks, complying with Privacy Invariant 15 and Indonesian UU PDP No. 27/2022); automatically resumes when the break window ends.
      - Manual pause and resume with required justification reasons.
      - Resilient offline buffering: if cellular data drops, batches are safely enqueued in `OfflineSyncQueue` for deferred synchronization.
    - Implemented `ActiveTrackingBanner` widget showing real-time tracking status across all 3 worker categories: active pulse dot, task code, current speed, pings recorded count, break paused warning, or manual pause resume controls.
    - Integrated tracking controls and banners into `DriverTripScreen` (1 delivery trip = 1 session covering multi-drop orders), `SurveyorTaskScreen` (survey task session with customer property coordinate preservation for future delivery navigation), and `CollectorVisitScreen` (collection visit session).
    - Verified all 8 Flutter tests pass cleanly (`flutter test`) including new integration suite in `test/features/fleet_tracking_test.dart` and clean `flutter analyze`.
    - Updated `about_project.md` to Version 3.6, moved `[Q.9]` from todo list to completed feature list, updated Section 5 review table, gap analysis, and added roadmap recommendations `[Q.16–Q.17]`.

- **2026-10-30 (Update 4)**:
  - **Logistics & Fleet Management System Implementation (Version 3.5)**:
    - Executed the proposed **Logistics & Fleet Management System** (Backlog `[Q.1–Q.8]`, `[Q.10]`) across database migrations, Spring Boot backend services, and React 19 management web interface.
    - Database: Created Flyway migration `V24__logistics_and_fleet_management.sql` creating `vehicle`, `break_schedule`, `tracking_session`, `tracking_session_event`, `tracking_location`, and `location_access_audit_log` tables with spatial geometry coordinate support.
    - Backend: Created entities, enums (`VehicleType`, `VehicleStatus`, `TrackingTaskType`, `TrackingSessionStatus`, `TrackingEventType`, `LocationAccessQueryType`), Spring Data repositories, `FleetService`, and `FleetController`. Implemented vehicle management, task-bounded tracking lifecycle, strict break coordinate rejection (zero coords accepted when paused), Salesperson exclusion invariant, live fleet status aggregation, historical route playback, and Indonesian UU PDP No. 27/2022 statutory audit logging. Verified via unit tests in `FleetServiceTest` (7/7 tests passing).
    - Frontend (`sms-web`): Created `fleetApi.ts`, `FleetLiveMap.tsx` interactive SVG canvas with depot landmark, role-colored worker markers, pulsing radar halos, breadcrumbs, zoom/pan controls, and worker flyout; `VehicleFormDialog.tsx` with plate, category, brand/model, payload, volume, STNK/KIR expiry; `FleetMonitoringPage.tsx` with 4 operational tabs (Live Fleet Monitor & Active Roster, Historical Route Playback with scrubber slider and speeds 1x-10x, Vehicle Fleet Registry, Strict Break Schedules & Statutory Location Access Audit Log).
    - Navigation: Integrated into `AppLayout.tsx` top navbar / mobile drawer, `CommandPalette.tsx` navigation & search, and `App.tsx` `/fleet` route.
    - Verification: Frontend Vitest test suite (`FleetMonitoringPage.test.tsx` + entire suite: 16 files, 39/39 passing) and Vite production build passed cleanly.
    - Documentation: Updated `about_project.md` to Version 3.5, moved completed items from Backlog Q to completed features, updated Section 5 review table, gap analysis, and added new backlog recommendations `[Q.13–Q.15]`.

- **2026-10-30 (Update 3)**:
  - **Multi-Channel Sales Logic, Configurable Payment Rules, Deposit-First Procurement Authorization & Dual-Axis Fulfillment Architecture (Version 3.4)**:
    - Formalized **Unified Sales Logic Across All Channels**: walk-in purchases via Management System, customer e-commerce website, and customer e-commerce mobile app share identical underlying business logic, pricing, discounts, and order validation workflows. Channel attribution is captured strictly for reporting and auditability without bifurcating core sales operations.
    - Specified **Configurable Payment Methods Framework**: confirmed all 9 payment methods within platform scope (Bank transfer/Virtual Account, QRIS, E-wallet, Credit/Debit cards, Cash at store, Direct store bank transfer, Cash on delivery collected by own delivery driver, In-house customer credit, Third-party installment financing). Management System administration allows authorized administrators to enable or disable supported methods dynamically without code changes. In-house credit strictly requires an approval workflow and credit limit management (never auto-granted upon registration); third-party installment financing supported subject to partner API integration.
    - Formalized **Payment and Sales Order Decoupled Relationship**: Payment module remains separate from Sales Order; orders support multiple payment transactions, initial deposits, subsequent balance settlements, and split payment methods. Item/fulfillment cancellations and refunds are handled without splitting the sales order.
    - Enforced **Deposit-First Procurement Authorization Gate**: Supplier purchase orders for customer-demanded products cannot proceed until the required customer deposit (configurable: full payment, percentage, or nominal threshold) has been received and confirmed.
    - Clarified **Dual-Axis Fulfillment Decision Independence**: Formally separated Decision A (Fulfillment completeness: complete vs. partial, decided by customer) from Decision B (Fulfillment method: home delivery via own-driver vs. customer store pickup). Permitted orthogonal combinations across fulfillment groups. Governed employee-suggested fulfillment adjustments with mandatory customer consent and immutable audit logging.
    - Added Backlog items `[P.11]` (Configurable Payment Methods Management Console) and `[P.12]` (Deposit-First Procurement Authorization Validation Gate), updated Review Table, Gap Analysis, Backlog, and recorded ADR-14, ADR-15, and Section 9.3 Tensions 6 & 7.
- **2026-10-30 (Update 2)**:
  - **Logistics & Fleet Management System Architectural Specification (Version 3.3)**:
    - Formalized the comprehensive architecture and requirements for the **Logistics & Fleet Management System** as a major platform module (Group 18, Backlog `[Q.1–Q.12]`).
    - Specified the fundamental invariant of **Task-Based GPS Tracking**: GPS tracking is strictly bound to explicitly initiated operational tasks/trips, never tracking employees continuously throughout the working day.
    - Defined role-specific tracking lifecycles across Driver (1 Delivery Trip = 1 Tracking Session spanning multi-drop DOs), Surveyor (survey task tracking with property coordinates reused for future delivery navigation), and Collector (collection task tracking). Salespersons are explicitly excluded from GPS tracking.
    - Engineered **Strict Scheduled Break Governance**: automated tracking cessation during configurable break windows, zero coordinates recorded, no deferral permitted, automatic resumption, and background execution handling across Android/iOS.
    - Modeled Tracking Session state machine distinguishing intentional pauses, scheduled breaks, GPS loss, network loss, and completion.
    - Specified Vehicle Master registry with employee mobile phone GPS as the primary location source (no dedicated in-vehicle GPS hardware required initially).
    - Designed Web Management System GPS Fleet Monitoring Dashboard (Live Map, Employee Sidebar, Route Playback, Filters, WebSocket feed).
    - Established Granular Permission-Based Access Control, Location Access Audit Logging, and 10 non-negotiable Privacy & Data Protection Principles aligned with Indonesian UU PDP (UU No. 27/2022).
    - Updated module ownership matrix, backend architecture, invariants, comprehensive review table, gap analysis, canonical backlog, and recorded ADR-13.
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
  - **Ecosystem Architecture Expansion & Master Documentation Update (Version 3.2)**:
    - Formalized expansion of SMS into an integrated retail ecosystem consisting of 4 applications: Management System (Web), E-commerce Website, E-commerce Mobile Application, and Worker Mobile Application.
    - Documented Single Source of Truth architecture and authoritative domain ownership matrix across Product, Inventory, Pricing, Customer, Sales, Procurement, Payment, Delivery, Identity, Survey, Inspection, Notification, and Reporting modules.
    - Centralized business logic invariants ensuring identical rule enforcement across web storefront, mobile storefront, and back-office management.
    - Specified unified Sales Order infrastructure with `order_source` tagging (`ONLINE_WEB`, `ONLINE_APP`, `EMPLOYEE`) and multi-fulfillment grouping (`FulfillmentGroup`), establishing the core invariant that an order is never fragmented into separate sales orders due to multiple fulfillments or shipments.
    - Established commercial sales availability states (`IN_STOCK`, `AVAILABLE_PROCUREMENT_REQUIRED`, `PREORDER`, `UNAVAILABLE`) decoupled from physical inventory counts, and specified demand consolidation for supplier procurement without 1:1 auto-PO generation.
    - Formally modeled initial fulfillment methods: Own-Driver Delivery and Customer Store Pickup with extensible provider abstractions for future couriers.
    - Defined cross-application event propagation mechanisms using the Transactional Outbox pattern (`outbox_events`), idempotent processing, and auditability.
    - Established the 7-Question Future Feature Design Principle and comprehensive Cross-Application Testing standards.
    - Added Section P to Canonical Backlog (`[P.1–P.10]`), updated master review tables, and recorded ADR-10, ADR-11, and ADR-12 with detailed conflict and tension analysis.
  - **Customer 360, CRM & Omnichannel Experience Full-Stack Execution (`[J.1–J.7]`)**:
    - **Backend Architecture & Flyway Migration**:
      - Authored `V22__customer_360_crm.sql` adding demographic profiling columns to `customer` (`mother_maiden_name`, `birth_date`, `birth_place`, `segment`, `credit_score_grade`, `credit_score_points`, `clv_amount`, `total_orders_count`).
      - Created relational tables: `customer_tag`, `customer_interaction`, `customer_follow_up`, `customer_promise_to_pay`, `customer_store_credit_entry`, `store_voucher`.
      - Established granular RBAC permissions (`CUSTOMER_TAG_MANAGE`, `CUSTOMER_INTERACTION_MANAGE`, `CUSTOMER_FOLLOW_UP_MANAGE`, `CUSTOMER_PTP_MANAGE`, `CUSTOMER_STORE_CREDIT_MANAGE`, `VOUCHER_MANAGE`).
      - Created entities, enums, DTOs, repositories, services (`Customer360Service`, `VoucherService`), and REST controllers (`Customer360Controller`, `VoucherController`).
      - Implemented 360 Timeline Feed aggregation engine chronologically streaming commercial sales orders, payments, credit surveys, deliveries, CRM logs, and warranties.
      - Developed Customer Lifetime Value (CLV) calculation and historical repayment reliability scoring algorithm (0-100 score, A/B/C/D grade) with behavioral segmentation (`VIP_CASH`, `STAR_CREDIT`, `HIGH_DELINQUENCY_RISK`, `STANDARD`).
      - Engineered Janji Bayar (PTP) state machine (`PENDING`, `KEPT`, `BROKEN`, `CANCELLED`).
      - Implemented Bigram Dice Coefficient fuzzy duplicate detection matching NIK, phone suffix, phonetic name similarity, and mother's maiden name (`[J.4]`).
      - Built retail store credit balance ledger (strictly merchant discount and refund credit balance management, not banking deposits or money transmission) and voucher promotion engine (`[J.5]`).
    - **Web SPA (`sms-web`)**:
      - Transformed `CustomerDetailPage.tsx` into a 360 Command Center with demographic tags, KPI stats (CLV, Store credit balance, active PTPs, follow-ups), multi-source timeline filtering, omnichannel communication log modal, PTP ledger, follow-up scheduler, store credit & voucher ledger.
      - Enhanced `CustomerListPage.tsx` with segment filter chips, credit grade columns, and CRM CSV export.
      - Integrated inline fuzzy duplicate detection widget (`[J.4]`) and PDP-protected demographic fields into `CustomerFormDialog.tsx`.
      - Verified: 15/15 test files passing (35/35 tests passing) and clean production build with Vite code splitting.
    - **Mobile Worker App (`workerapp-mobile`)**:
      - Built `Customer360Screen` (`/customer-360/:id`) displaying customer credit tier, CLV, active PTPs, and interaction timeline.
      - Added quick dialogs for recording PTP and logging visits directly from mobile field operations.
      - Enqueued offline actions in `offlineSyncProvider` (`RECORD_PROMISE_TO_PAY`, `RECORD_CUSTOMER_INTERACTION`) for offline field reliability.
      - Integrated one-tap entry points from `CollectorVisitScreen` and shortcut tile in `WorkerHomeScreen`.
      - Verified: Flutter analyze 0 errors.
  - **Mobile Work Center Enhancements Integration & Verification (`[M.1–M.6]`)**:
    - **Backend Architecture, Migrations & Testing**:
      - Fixed syntax error in `SalesOrderService.java` and unblocked backend compilation.
      - Authored `V23__survey_location_profiling.sql` adding structured delivery logistics profiling columns to `survey` (`destination_latitude`, `destination_longitude`, `alley_width_meters`, `stair_clearance_meters`, `gate_access_notes`).
      - Updated `Survey.java`, `AssessmentRequest.java`, `SurveyResponse.java`, and `SurveyService.updateAssessment` to persist and return structured location coordinates and physical access constraints (`[M.1]`).
      - Updated `FailDeliveryOrderRequest.java` and `DeliveryService.failDeliveryOrder` to persist photographic proof URLs (`proofPhotoUrl`) on failed deliveries and dispatch instant reschedule alerts to store dispatchers (`DELIVERY_MANAGE`) (`[M.3]`).
      - Resolved `DeliveryServiceTest` JPA entity ID reflection mocking (`ReflectionTestUtils.setField`) and added unit test coverage for structured location fields and photographic failure proof.
      - Verified: 77/77 backend unit tests passing cleanly via `mvnw test`.
    - **Mobile Worker App (`workerapp-mobile`)**:
      - Enhanced `surveyor_task_screen.dart` and `survey_provider.dart` to dispatch structured GPS coordinates, alley width, stair clearance, and gate access constraints directly to backend endpoints (`[M.1]`).
      - Verified warehouse guided picking and packing verification with barcode scanning against active manifests (`warehouse_picking_screen.dart`, `[M.2]`).
      - Enforced architectural policy for delivery failure handling: captured failure root-cause tags, photo proof, and GPS coordinates while notifying dispatchers for manual load-balanced trip reassignment (`driver_trip_screen.dart`, `delivery_provider.dart`, `[M.3]`).
      - Enhanced `sales_work_center_screen.dart` with configurable monthly quota target (default Rp 50.000.000 benchmark) and visual progress bar (`LinearProgressIndicator`) with percentage calculation, tier color-coding, and estimated commission display (`[M.4]`).
      - Verified blind physical stocktaking mode (`stocktake_screen.dart`) with continuous barcode scanning, offline `SharedPreferences` buffering, and server-side variance reconciliation for supervisory sign-off (`[M.5]`).
      - Verified Actionable Notification Center (`notification_center_screen.dart`) with deep links (`/survey/:id`, `/delivery-order/:id`, `/sales-order/:id`, `/stocktake-review/:id`) and one-tap supervisory approvals/rejections (`[M.6]`).
      - Created automated Flutter test suite (`test/features/mobile_enhancements_test.dart`) mocking network adapters and testing all M features.
      - Verified: Flutter analyze 0 errors/warnings, 5/5 Flutter tests passing, and Android Gradle `compileDebugSources` build verified cleanly with Gradle 9.1.0 and Build-Tools 36.
  - **Server-Side Price List Document Versioning, Stored Snapshots & Validity Date Stamping (Version 3.22 / Backlog `[G.18]`)**:
    - **Backend Architecture & Flyway Migration (`core-backend`)**:
      - Authored migration `V34__price_list_versioning.sql` creating the `price_list_version` table with `id`, `store_id`, `version_code`, `title`, `valid_from`, `group_by`, `file_name`, `mime_type`, `file_size_bytes`, `item_count`, `content_html`, `notes`, `created_at`, `created_by`.
      - Built `PriceListVersion.java`, `PriceListVersionRepository.java`, and DTOs (`PriceListVersionDto`, `GeneratePriceListVersionRequest`).
      - Created `PriceListVersionService.java` with methods `generateAndStoreVersion`, `listVersions`, `getLatestStoredVersion`, `getVersionEntity`, and `deleteVersion`.
      - Updated `PriceListService.java` to accept `LocalDate validFrom` and stamp `<div class="section-footer-valid-date">Berlaku mulai tanggal ${effectiveDateStr}</div>` at the bottom of each category table section with `.group-section { page-break-inside: avoid; }`.
      - Added REST endpoints in `PricingController.java`: `POST /price-list/generate-and-store`, `GET /price-list/latest`, `GET /price-list/versions`, `GET /price-list/versions/{versionId}/view`, `GET /price-list/versions/{versionId}/download`, `DELETE /price-list/versions/{versionId}`, and updated `GET /price-list` / `GET /price-list/html` to accept `validFrom`.
      - Updated `PrintableDocumentController.java` to support optional `validFrom` date parameter.
      - Tested: 3/3 JUnit tests passing in `PriceListVersionServiceTest`.
    - **Web SPA (`sms-web`)**:
      - Created API methods in `pricingApi`: `generateAndStorePriceListVersion`, `listPriceListVersions`, `getLatestPriceListVersion`, `deletePriceListVersion`.
      - Added React Query hooks in `hooks.ts`: `usePriceListVersions`, `useLatestPriceListVersion`, `useGenerateAndStorePriceListVersion`, `useDeletePriceListVersion`.
      - Redesigned `PriceListPage.tsx` with top Navigation Tabs:
        - Tab 1: **Daftar Harga Aktif (Live Catalog)**: Valid From date picker, "Generate & Simpan ke Server" (saves version and automatically triggers download for smooth UX), "Unduh Versi Tersimpan" (instant zero-latency download from server without recalculation), "Cetak PDF / Print", "Ekspor Excel (.xlsx)", and "Auto-Hitung Semua". Stamped "Berlaku mulai tanggal [DD MMMM YYYY]" at the bottom right of each category table.
        - Tab 2: **Riwayat Versi Dokumen (Document Versioning)**: Full document archive table displaying Version Code chip (`PL-YYYYMMDD-XXX`), Title, Valid From date, Grouping type, Item count, File size, Creation timestamp, Notes, and Action buttons (View/Print, Download HTML, Delete with confirmation).
      - Tested: 6/6 Vitest tests passing in `PriceListPage.test.tsx` and 7/7 total tests passing across `src/features/pricing/`.
    - **Documentation**: Updated `about_project.md` to Version 3.22, documented Feature 3.8, updated Section 5 Master Review Table (Row 76), marked `[G.18]` as completed, and added task recommendations `[G.19]`, `[G.20]`, and `[G.21]` to Master Action Backlog.

---

---

## 9. Master Action Backlog & Todo List (Canonical Source of Truth)

> **Important**: This section is the **canonical single source of truth** for all **open/pending Todo tasks** (`[ ]`) across the entire SMS project. All completed tasks (`[A.1–A.5]`, `[B.1–B.6]`, `[C.1–C.6]`, `[D.1–D.5]`, `[E.1–E.9]`, `[G.2, G.3, G.13, G.14]`, `[J.1–J.7]`, `[M.1–M.6]`, `[O.5, O.6]`, `[P.1, P.2, P.4–P.7, P.11–P.14, P.16, P.20, P.22, P.28–P.31]`, `[Q.1–Q.11, Q.16–Q.19, Q.21]`, and `ADR-12`) have been removed from this Todo List upon completion and moved to the top Architecture & Feature Specifications (**Sections 2, 3, 4, and 5**).

| Metric                                           |  Count  | Status                                                                                    |
| ------------------------------------------------ | :-----: | ----------------------------------------------------------------------------------------- |
| - **Completed & Relocated to Top Feature Specs** | **86**  | Explained in detail in Sections 2–5 (`ADR-12`, `[G.18]`, and all implemented features)    |
| - **Pending / Open Todo Tasks (`[ ]`)**          | **112** | Active Todo items scheduled for future architectural, performance, and UI/UX enhancements |

### A. Environment & Infrastructure Setup

- [ ] **A.6**: Implement automated PostgreSQL connection health indicator with database latency metric exposition in Spring Boot Actuator (`/actuator/health`).
- [ ] **A.7**: Add automated Redis connection failover and Sentinel circuit breaker configuration in Spring Data Redis.
- [ ] **A.8**: Implement automated database backup cron script (`pg_dump` with gzip compression and S3 upload) for automated disaster recovery snapshots.

### C. Mobile App — Hardware, Field Operations & Offline Capabilities

- [ ] **C.7 (UI/UX)**: Distinct acoustic and haptic feedback patterns for mobile barcode scanner (success beep vs duplicate warning vs error vibration).

### D. Backend Enhancements & Showroom Money Management

- [ ] **D.7 (Money Management)**: Shift-level cash drawer balancing and petty cash float reconciliation ledger for showroom cashiers (strictly internal retail money management, non-banking).

### E. Web App UI/UX & Performance Improvements

- [ ] **E.10 (Performance)**: Windowed row virtualization and sticky multi-column pinning for 10,000+ row financial aging and inventory tables.
- [ ] **E.11 (UI/UX)**: Saved custom filter presets and shareable URL query state across Sales Order, Inventory, and Finance views.

### F. Testing, Quality Assurance & DevOps

- [ ] **F.1**: Build end-to-end (E2E) testing suite with Playwright covering critical paths:
  - Sales Order Draft → Price Approval → Survey → Confirm → Deliver → Finance Installment.
- [ ] **F.2**: Mobile integration tests (`integration_test`) verifying offline-to-online sync queue.
- [ ] **F.3**: GitHub Actions CI/CD pipeline running backend Maven build & tests, web lint/build/tests, and mobile analyze/tests on every pull request.
- [ ] **F.4**: Automated database backup script and disaster recovery procedure.

### G. Advanced Analytics, Reporting & PWA Backlog

- [ ] **G.1 (Offline & PWA)**: Add Service Worker with Workbox to cache web app shell and provide offline fallback for desktop and showroom tablets.
- [ ] **G.4 (Forecasting & AI)**: Cash flow forecasting and delinquency projection engine based on historical payment velocity.
- [ ] **G.5 (Store Benchmarking)**: Multi-store performance benchmarking heatmap and quota achievement radar charts.
- [ ] **G.6 (Mobile Field Analytics)**: Mobile collector performance dashboard showing daily collection quota vs actual recovery rate.
- [ ] **G.7 (Document Scanning OCR)**: Mobile camera OCR scanning for automatic Indonesian KTP (National ID) data entry.
- [ ] **G.8 (Multi-Approver Voting)**: Configurable M-of-N quorum voting for high-value price override workflows.
- [ ] **G.9 (Scheduled Reports)**: Automated daily/weekly email digest dispatching Excel (.xlsx) financial aging and stock balance reports to store managers.
- [ ] **G.10 (Batch Statement)**: Customer account billing statement PDF batch export with installment ledger.
- [ ] **G.11 (Thermal POS Slip)**: 58mm/80mm ESC/POS thermal receipt formatting for walk-in counter sales and cashier desk printers.
- [ ] **G.12 (Driver Trip Sheet)**: Printable delivery trip manifest and routing worksheet with stop checklist and COD collection summary.
- [ ] **G.15 (Multi-Product Credit Bundle Simulator)**: Interactive showroom bundling tool allowing salespersons to combine electronics (TV) and furniture (Sofa) into a single blended financed contract with aggregated DP and shared installment schedule.
- [ ] **G.16 (Trade-in / Tukar Tambah Deduction Engine)**: Showroom appraisal module deducting appraised value of customer's old electronic/furniture unit directly as down payment credit against new installment contract.
- [ ] **G.17 (Showroom Floor Sales Commission Leaderboard & Tier Tracker)**: Real-time ranking of showroom salespersons with gamified tier progress badges (Bronze, Silver, Gold, Platinum) and projected commission payout forecast.
- [ ] **G.19 (Price List Version Comparison / Diff Engine)**: Side-by-side visual diff tool highlighting price adjustments, new items, and removed models between two price list versions with percentage delta indicators.
- [ ] **G.20 (Scheduled Price List Snapshot Auto-Archiving)**: Automated background cron snapshot taking a frozen snapshot on monthly pricing cycle cutoffs or major catalog updates.
- [ ] **G.21 (Headless Chromium PDF Generation for Printables)**: Server-side rendering using Playwright/Puppeteer to convert HTML price lists and invoices into byte-perfect A4 PDF attachments.

### H. Accounting, General Ledger & Financial Management (Proposed)

> _Strategic Decision_: Under review per ADR-01 (In-house bespoke build vs External accounting integration).

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
- [ ] **I.10**: Slow-moving furniture & aged electronics liquidation discount advisor based on warehouse dwell-time aging buckets (> 90 / 180 days).

### J. Customer 360, CRM & Omnichannel Experience (Proposed Extensions)

- [ ] **J.8**: Automated WhatsApp Business API integration via webhook for interactive 2-way payment reminders, PTP confirmations, and post-delivery NPS feedback.
- [ ] **J.9**: Dynamic retail invoice payment links with QRIS generation for installment payments linked to PTP promises.
- [ ] **J.10**: Geofenced GPS check-in validation for field collector and sales visits with automatic proximity confirmation.
- [ ] **J.11**: Sentiment analysis and keyword flag extraction on customer interaction notes for proactive delinquency and churn mitigation.

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

### M. Mobile Work Center Enhancements (Proposed Extensions)

- [ ] **M.7**: Offline map tile caching and one-tap turn-by-turn navigation deep-linking to Google Maps / Waze using survey-captured GPS destination coordinates.
- [ ] **M.8**: Acoustic / haptic feedback engine for mobile barcode scanner (distinct audio-tactile signatures for successful scan, duplicate buffer scan, and manifest mismatch).
- [ ] **M.9**: Wireless Bluetooth ESC/POS thermal printer integration for printing serialized warehouse barcode labels and customer receipt slips directly from mobile worker app.

### N. Platform Architecture, Reliability & Security Hardening (Proposed)

- [ ] **N.1**: Transactional Outbox Pattern implementation with CDC worker/polling dispatcher for reliable asynchronous event publishing.
- [ ] **N.2**: Durable database-backed idempotency table (`idempotency_keys`) protecting critical financial, payment, and inventory mutation endpoints.
- [ ] **N.3**: Mobile local storage migration to SQLite with Drift supporting deterministic 5-state sync lifecycle (`PENDING`, `SYNCING`, `SUCCESS`, `RETRY`, `CONFLICT`) and server-authoritative conflict escalation.
- [ ] **N.4**: Indonesian UU No. 27/2022 PDP data protection compliance: NIK field-level encryption (AES-256), role-based PII masking, statutory retention policies, and formal legal review (ADR-08).
- [ ] **N.5**: Data-scope authorization hierarchy enforcing Store, Department, Territory, and Record Ownership boundaries across backend queries.
- [ ] **N.6**: SRE observability stack: Structured JSON logging with trace IDs, Prometheus metrics, and OpenTelemetry distributed tracing.
- [ ] **N.7**: Multi-Factor Authentication (MFA via TOTP/SMS) and remote device session revocation for administrative and financial roles.
- [ ] **N.8**: Multi-tier hybrid caching (Caffeine L1 in-memory + Redis L2) for high-read product catalog and store pricing matrices.

### O. Workflow, Document Governance & Enterprise Usability (Proposed)

- [ ] **O.1**: Document expiry monitoring and automated reminders (quotations, contracts, warranties, supplier agreements).
- [ ] **O.2**: Approval delegation when assigned approver is unavailable (temporary proxy assignment).
- [ ] **O.3**: Approval escalation, timeout rules, and automatic reassignment upon inactivity.
- [ ] **O.4**: Saved custom table filters and persistent column preferences stored per user.
- [ ] **O.7**: Master data change history audit log capturing field-level diffs.
- [ ] **O.8**: Dynamic watermarking for confidential customer ID attachments (NIK/KTP) embedding reviewer name and timestamp on preview canvas.
- [ ] **O.9**: Multi-page thumbnail navigation drawer sidebar in universal document previewer modal.
- [ ] **O.10**: Client-side image crop, auto-orientation, and WebP compression pipeline before uploading bulky camera attachments.
- [ ] **O.11**: Asynchronous bulk export job runner with WebSocket / SSE progress notifications for large datasets (> 5,000 rows).
- [ ] **O.12**: Bulk barcode and QR code sticker label generator formatted for Zebra thermal printers (A4 / 2-column continuous roll).
- [ ] **O.13**: Undo / Rollback window for accidental bulk status transitions within 30 seconds.

### P. Integrated E-commerce Ecosystem & Omnichannel Architecture (Proposed)

- [ ] **P.3**: Demand consolidation work center in Management System allowing purchasing staff to aggregate backordered sales order requirements into optimized bulk distributor Purchase Orders, strictly gated by customer deposit verification.
- [ ] **P.8**: Online digital payment gateway integration (QRIS dynamic barcodes, Virtual Accounts, Credit Cards) with cryptographic signature validation, idempotent webhook callback reconciliation, and decoupled sales order multi-tender payment recording.
- [ ] **P.9**: Cross-application event propagation test suite and transactional outbox dispatcher validating at-least-once message delivery and state machine coherence across all 4 applications.
- [ ] **P.10**: Worker Mobile App field logistics extensions: delivery destination access profiling (gang senggol, stairs, vehicle limits) and active task-bounded GPS tracking.
- [ ] **P.15**: Verified Customer Product Review & Rating System strictly gated by completed Sales Order delivery confirmation.
- [ ] **P.17**: Real-Time Storefront Inventory Polling / Server-Sent Events (SSE) notifying online shoppers when low-stock items are reserved by other concurrent shoppers.
- [ ] **P.18**: Push Notification Customization: in-app notification sound preferences, vibration haptic feedback toggles, and notification quiet hours.
- [ ] **P.19**: Geofence-Triggered Automated Arrival Alerts: customer mobile app proximity detection notifying store staging staff 5 minutes before customer arrives for store pickup.
- [ ] **P.21**: Next-Gen AVIF Image Codec delivery pipeline with automatic WebP/JPEG fallback for ultra-low bandwidth mobile networks.
- [ ] **P.23**: Offline Vector Asset Fallback: SVG icon and offline-cached fallback rendering when network drops entirely during customer storefront browsing.
- [ ] **P.24**: Self-Service Pickup Locker & Time-Limited OTP Handover: integration with smart electronic lockers at showroom entrances for after-hours contactless pickups.
- [ ] **P.25**: Customer Pickup Delay Expiry & Re-Stocking Automation: automatic staging reminder at Day 5 and restocking forfeiture rule at Day 14 if customer fails to claim staged goods.
- [ ] **P.26**: Automated Push & Email Alert on Wishlist Price Drop: Background scheduler scanning daily price movements to trigger FCM/APNs push notifications and email alerts when wishlisted items drop by >= 5%.
- [ ] **P.27**: Wishlist Shared Link & Social Export: Generate shareable public links (`/wishlist/share/:token`) allowing customers to share their furniture/electronics wishlist with family or wedding gift registries.
- [ ] **P.32**: Margin Impact & Gross Profit Warning Indicator: Real-time calculation of gross profit margin in Pricing Management alerting managers if promotional discounts erode margins below store threshold (e.g. < 12%).
- [x] **P.33**: Self-Service Delivery Rescheduling Portal on web and app. Account-owned pending deliveries can request date/window changes at least 24 hours before planned dispatch (exact boundary allowed), with dispatcher approval, morning 09:00-12:00 or afternoon 12:00-17:00 Asia/Jakarta windows, single-stop reassignment, request/decision history, and explicit errors. Apply V36 and configure actual departure times; legacy date-only trips remain ineligible.
- [ ] **P.34**: Real-Time Showroom Branch Stock Availability Indicator ("Tersedia di Showroom Cabang X") on product detail pages.
- [ ] **P.35**: Interactive 3D / WebXR Augmented Reality (AR) Furniture Room Preview ("Lihat di Ruangan Anda") for sofas, wardrobes, and dining sets.
- [ ] **P.36**: Next.js Dynamic XML Sitemap (`sitemap.xml`) & JSON-LD Rich Product Schema (`Product`, `Offer`, `AggregateOffer`) for automated Google Shopping & organic search indexing of furniture and electronics SKUs.
- [ ] **P.37**: Redis-Distributed Token-Bucket Storefront Rate Limiter: Upgrade `StorefrontApiGatewayFilter` from per-node in-memory buckets to a distributed Redis Lua atomic token bucket for multi-replica horizontal backend scaling.
- [ ] **P.38**: HTTP `103 Early Hints` & Edge Preconnect Dispatcher: Emit `103 Early Hints` with `Link: rel=preload` and `rel=preconnect` headers at the Next.js / reverse-proxy edge prior to full SSR response streaming.
- [ ] **P.39**: Core Web Vitals (LCP, CLS, INP) Real-User Monitoring (RUM) Beacon: Lightweight storefront telemetry collector reporting field LCP timings on Preloaded Hero Assets vs non-preloaded routes.

### Q. Logistics & Fleet Management System (Proposed)

- [ ] **Q.12**: Future Fleet Roadmap: Dedicated in-vehicle telematics hardware, automated customer arrival notifications (ETA), dynamic geofencing, route optimization algorithms, and predictive fleet maintenance.
- [ ] **Q.20**: Route Heatmapping & Transit Congestion Overlays: Density heatmaps visualizing high-traffic bottleneck zones on historical route playback maps.
- [ ] **Q.22**: Wearable / Smartwatch Companion Quick-Pause Trigger: Bluetooth Low Energy companion trigger for motorcycle drivers to toggle tracking pause from handlebar or smartwatch.
- [ ] **Q.23**: Accelerometer Crash & Hard Braking Automatic Pause Detection: Device accelerometer sensor spike detection initiating an emergency pause and safety dispatch alert.
- [ ] **Q.24**: Ambient Weather & Rain Mode GPS Dampening: Automatically relax GPS sampling frequency during torrential tropical downpours to prevent rapid battery drainage from signal attenuation.
- [ ] **Q.25**: Vehicle Vibration & Mount Dislodgement Detection: Accelerometer pattern analysis detecting phone detachment from motorcycle handlebar mount.
- [ ] **Q.26**: Automated Dishub KIR Online Booking Integration: Automatic pre-booking with local Dinas Perhubungan inspection centers when vehicles enter 30-day KIR expiration window.
- [ ] **Q.27**: Digital Samsat e-STNK Document Vault: Secure multi-resolution encrypted document upload and Samsat e-toll QR code retrieval for fleet driver mobile wallet.
- [ ] **Q.28**: Automated Customer Arrival SMS / WhatsApp Webhook: Automatically dispatch customer arrival notification ("Driver is 300m away, please prepare for delivery") via transactional webhook when geofence triggers.
- [ ] **Q.29**: Geofence Departure & Dwell Time Telematics: Automatically detect when vehicle exits customer 300m geofence perimeter and calculate total on-site dwell duration.
- [x] **Q.30**: One-Tap External Navigation Handover: Driver trip sheet action button passing validated GPS destination coordinates directly to Google Maps, Waze, or Apple Maps. Remembered app choice enables one-tap reuse; Google Maps iOS supports an explicit return deep link, while other apps use lifecycle resume callbacks. Return does not confirm delivery. Native device smoke testing remains required.
- [ ] **Q.31**: LIFO Multi-Drop Delivery Truck Loading Sequencer: Automated loading plan recommending reverse delivery order (Last-In, First-Out) when staging furniture into trucks.
- [x] **Q.32**: Master Data Truck Menu with 1-to-1 Driver Assignment, STNK 1-Month Tax Due Alert & License Plate Change History: Dedicated truck fleet registry menu in management web, strict 1-to-1 driver assignment enforced via database unique constraint and backend validation, 1-month advance tax due date (Pajak 1 Tahunan) warning status indicator & overdue alerts, and immutable license plate change audit history tracking (`vehicle_plate_history`).
- [ ] **Q.33**: Samsat Online Annual Tax Estimation & Fee Calculator: Estimate PKB, SWDKLLJ, and administrative fees based on vehicle engine capacity (CC), vehicle age, and regional tax bracket (DKI Jakarta / West Java / Banten) prior to tax due date.
- [ ] **Q.34**: Truck Driver Handover & Digital Pre-Trip Inspection Checklist: Mobile digital pre-trip inspection (tire pressure, engine oil, radiator coolant, lights, mirror condition, emergency triangle, fire extinguisher) signed off when driver takes custody of assigned truck.
- [ ] **Q.35**: Optical License Plate & Physical STNK Photo OCR Scanner: Mobile camera OCR recognition automatically extracting vehicle registration number, chassis number, engine number, and PKB tax due dates directly from physical STNK photo.
- [x] **Q.36**: Master Data Truck Phase 2 Service Logs, Delivery Distance Analytics & Monthly Health Check Inspection Checklists: Maintenance cost tracking, workshop invoices, delivery trip distance calculation from GPS tracking sessions, and monthly multi-point roadworthiness inspection checklist with automatic maintenance flagging.
- [ ] **Q.37**: Automated Monthly Vehicle Health Inspection Cron & Dispatch Notifications: Scheduled monthly reminder job alerting fleet managers and assigned drivers when a truck's monthly health inspection is due or overdue.
- [ ] **Q.38**: Workshop Maintenance Expense Budgeting & Bengkel Vendor Cost Comparison: Aggregated monthly fleet repair expense reporting and cost-per-kilometer comparison across authorized service centers and local workshops.
- [ ] **Q.39**: Digital Tire Tread Depth Gauge & PSI Bluetooth Sensor Telematics: Direct BLE telematics integration with digital tire calipers and pressure sensors to automatically log millimeter tread depths into monthly health checks.
- [x] **Q.40**: Driver License (SIM) Registration, 30-Day Expiry Monitoring & Automated Renewal Notifications: Driver driving license registry (SIM A, SIM B1, SIM B1 Umum, SIM B2, SIM B2 Umum, SIM C), daily automated 30-day expiration scanner, in-app and mobile push notification dispatch to drivers, and management renewal reminders.
- [ ] **Q.41**: Driver License Physical Photo Upload & Samsat Digital Verification: Mobile camera attachment upload of physical SIM cards with automated OCR validation of license number and expiry dates.
- [ ] **Q.42**: Commercial Driver Safety Score & License Penalty Points Tracker: Monitor driver traffic violations, ticket settlements, and internal safety incidents against driver profile.

---
