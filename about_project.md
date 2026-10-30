# Store Management System (SMS) — Integrated Retail Ecosystem Architecture & Master Project Documentation

> **Version**: 3.2 (Integrated 4-Application Ecosystem Architecture, Omnichannel E-commerce, Unified Backend, Multi-Fulfillment & Cross-App Event Propagation)  
> **Last Updated**: 2026-10-30  
> **Architecture**: Modular Monolith (Spring Boot 4.1 + PostgreSQL 16 + Redis) • Integrated 4-Application Ecosystem: Management Web SPA (React 19) • E-commerce Web • E-commerce Mobile App • Worker Mobile App (Flutter 3.44)

---

## Document Status & Verification Framework

To avoid ambiguity regarding project completion, this document formally distinguishes between three distinct maturity dimensions across all modules:

1. **Feature Implementation (% Code Written)**:
   - Measures whether the core business logic, domain entities, database migrations, REST endpoints, UI screens, forms, and state management have been written and integrated into the repository codebases.
2. **Integration Verification (% Test & Integration Coverage)**:
   - Measures whether code has been verified through automated unit tests, component tests, local mock interceptors, and local builds.
   - *Current Status*: Local unit and component test suites pass (e.g., 33/33 Vitest tests on Web, Spring Boot domain unit tests, Flutter component tests). **End-to-end multi-service integration against live cloud infrastructure and cross-application workflows (Backlog `[F.1]`, `[F.2]`, `[P.9]`) remains outstanding.**
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

The **Store Management System (SMS)** is an integrated enterprise retail operations, omnichannel commerce, and money management platform engineered for a multi-store chain specializing in electronics, home appliances, and furniture.

> [!IMPORTANT]
> **System Scope & Boundary Clarification**: SMS is **not a banking application** that handles monetary creation, demand deposit accounts, interbank clearing, or regulated banking activities. The platform is purely an enterprise retail operations, omnichannel commerce, and money management system designed to track store sales, supplier procurement, multi-fulfillment logistics, customer receivables, cash custody, and in-house installment credit arrangements.

The SMS platform operates as an **integrated ecosystem consisting of four applications**, all communicating through defined APIs with a single shared backend:

1. **Management System (Web)**:
   - Primary desktop/tablet web application for business administration, inventory control, pricing matrices, procurement, logistics dispatch, and operational governance.
   - Comprehensive administrative coverage across catalog, SKUs, inventory, pricing, customers, sales, purchasing, payments, delivery, surveys, inspections, employee access, finance, and reporting.
2. **E-commerce Website**:
   - Customer-facing online shopping platform.
   - Responsibilities: Product browsing and faceted search; categories, brands, and filters; detailed specifications, images, and variants; shopping cart and checkout; customer self-service registration and authentication; address management; online payments; order history and tracking; promotions and vouchers; fulfillment selection (own-driver delivery or customer pickup); and fulfillment grouping preferences.
3. **E-commerce Mobile Application**:
   - Customer-facing native mobile shopping experience providing essentially the same business capabilities as the e-commerce website.
   - The website and mobile app are two interfaces to the same unified e-commerce platform, not independent commerce systems.
4. **Worker Mobile Application**:
   - Employee-facing mobile application for field and operational activities.
   - Responsibilities: Customer credit surveys; multi-drop delivery operations (*Surat Jalan* execution); product inspections; store pickup verification and handover; delivery destination location marking; task management; and employee location tracking strictly during active tasks according to agreed tracking rules.

The retailer operates on an end-to-end operational lifecycle:
1. **Procurement & Inbound Logistics**: Sourcing branded products and spare parts from national distributors, managing purchase orders, inspection receiving, demand consolidation, and auto-ingesting serialized inventory.
2. **Showroom & Omnichannel Sales**: Selling via showroom floor, e-commerce website, or e-commerce mobile app through direct cash, digital payment gateways, cash-on-delivery (COD), or in-house installment credit financing (3, 6, 10, 12, 15 months) with store-specific terms.
3. **Credit Verification & Field Appraisal**: Conducting in-person field surveys evaluating customer creditworthiness, dwelling stability, proof photos, delivery access logistics, and income verifications.
4. **Fulfillment, Multi-Group Logistics & Surat Jalan**: Managing flexible customer fulfillments (own-driver multi-drop delivery trips with formal Delivery Notes / *Surat Jalan*, or customer store pickup), pre-dispatch picking/packing checks, recipient digital signatures, and photo proof.
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
│  Stock Movement  │  Down Payment / Gateway  │  Recipient Sign / Proof  │  Cashier Reconcil │  Resell or Scrap    │
│  Landed Cost*    │  CRM 360 History*        │  Failed Resched*         │  Promise-to-Pay*  │  Warranty Repair    │
│  (Backlog I.1)   │  (Backlog J.1, P.1-P.8)  │  (Backlog M.3, P.4-P.5)  │  (Backlog J.3)    │  (Backlog K.1)      │
└──────────────────┴──────────────────────────┴──────────────────────────┴───────────────────┴─────────────────────┘
(* Indicates Proposed Enhancements cross-referenced to Canonical Backlog IDs)
```

---

## 2. Technology Stack & Architectural Topology

The SMS platform operates as a unified distributed enterprise system anchored by a **single authoritative backend and shared relational database** to guarantee ACID compliance, prevent split-brain inventory decisions, and eliminate data synchronization drift across channels.

```
STORE MANAGEMENT SYSTEM — INTEGRATED APPLICATION ECOSYSTEM
├── sms-backend/ (Java 21 • Spring Boot 4.1.x) [CENTRAL AUTHORITATIVE BACKEND]
│   ├── Architecture: Modular Monolith with strictly bounded domain contexts
│   ├── Persistence: Spring Data JPA + Hibernate 6.x
│   ├── Database: PostgreSQL 16 (Flyway migrations V1–V20+)
│   ├── Security: Spring Security + Supabase OAuth2 JWT validation (RBAC / PBAC)
│   ├── High-Concurrency: Redis (Atomic sequence numbering & short-lived cache)
│   ├── Document Vault: Supabase Storage S3-compatible Buckets
│   ├── Event Engine: Transactional Outbox Pattern (`outbox_events`) + Internal Spring Application Events
│   ├── API Spec: Springdoc OpenAPI 3.0 (Contract generation for Web & Mobile)
│   └── Testing: JUnit 5, Mockito, Testcontainers
│
├── sms-web/ (React 19 • TypeScript • Vite) [APPLICATION A: MANAGEMENT SYSTEM WEB]
│   ├── Purpose: Business administration, operations, pricing, procurement, delivery trips, HR & finance
│   ├── Framework: React 19 SPA with route-level code splitting (React.lazy)
│   ├── UI Framework: Material UI v9 (Deep Navy & Emerald Light/Dark themes)
│   ├── Data Grid: MUI X DataGrid with virtualized scrolling
│   ├── Workflow Engine: React Flow (@xyflow/react v12) visual DAG builder
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
└── sms-mobile/ (Flutter 3.44 • Dart 3.12) [APPLICATION D: WORKER MOBILE APPLICATION]
    ├── Purpose: Field-force mobile tool for credit surveys, delivery trips, inspections, pickups, and tasks
    ├── Architecture: Feature-first role-adaptive mobile client
    ├── State Management: Riverpod 3.x (Reactive asynchronous notifiers)
    ├── Networking: Dio client with JWT interceptors & live/mock fallback
    ├── Hardware Hooks: Camera viewfinder barcode/QR scanner, touch signature pad
    ├── Anti-Fraud: Pure-Dart Haversine 200m GPS geofencing & photo watermarking
    ├── Task Tracking: Active task-bounded GPS tracking (strictly during deliveries/surveys)
    └── Offline Engine: Persistent action queue & auto-sync replay (SQLite/Drift target)
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
     - Employee location tracking strictly during active operational tasks (active delivery trips and active surveys), adhering to agreed privacy and power-management rules.

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

#### Authoritative Data Ownership Matrix:

| Business Data Domain | Responsible Backend Module | Authoritative Responsibilities |
|---|---|---|
| **Product Catalog, SKU, Variants** | Product Management | Master product definitions, specifications, BOM associations, category taxonomies, and variant SKUs. |
| **Physical Inventory & Reservations** | Inventory Management | Physical warehouse stock, serialized `StockUnit` tracking, movement ledgers, and logical order reservations. |
| **Selling Prices & Promotions** | Pricing Management | Store-specific price matrices, promotional campaigns, discount thresholds, and installment terms. |
| **Customer Records & Profiles** | Customer Management | Customer master records, NIK deduplication, address directories, and CRM interaction history. |
| **Sales Orders & Order Lifecycle** | Sales Management | Sales order creation, order state machines, fulfillment grouping, and order source attribution. |
| **Purchase Orders & Procurement** | Purchasing Management | Supplier directory, purchase orders, demand consolidation, and inbound receipt tracking. |
| **Payments & Cash Custody** | Payment Management | Digital payment gateway transactions, installment schedules, cash custody handovers, and reconciliation. |
| **Delivery & Fulfillment** | Delivery Management | Fulfillment group orchestration, delivery trip planning, vehicle routing, and customer pickup tracking. |
| **Employee Records & Permissions** | Identity & Access Management | Employee profiles, store assignments, role definitions (RBAC), and data-scope permissions. |
| **Surveys & Credit Appraisals** | Survey Management | Credit survey scheduling, surveyor dispatch, field appraisal dossiers, and decisive credit determinations. |
| **Inspections & Warranty** | Inspection Management | Product return triage, cosmetic/functional grading, warranty claim tracking, and repair work orders. |
| **Notifications & Outbox** | Notification Management | Push notification dispatch, SMS/WhatsApp delivery, and transactional outbox event publishing. |
| **Reporting & Executive Analytics** | Reporting Management | KPI aggregations, aging buckets, period comparisons, sales leaderboards, and financial exports. |

> [!IMPORTANT]
> **E-commerce Consumption Rule**: E-commerce frontends (Web and Mobile) consume product catalogs, inventory availability, pricing matrices, and order states directly from the shared backend via dedicated storefront endpoints (`/api/v1/storefront/*`). They **never maintain separate product catalogs or decoupled inventory databases**.

---

### 2.3 Centralized Business Logic & Rule Enforcement

Business logic must never be duplicated or implemented independently across frontend clients. The backend acts as the sole gatekeeper of operational rules, ensuring that business integrity is guaranteed even if a client application contains bugs or malicious requests.

For example, when a sales order is submitted through:
- The E-commerce Website,
- The E-commerce Mobile Application, or
- The Management System (by a showroom salesperson),

**The exact same sales order creation and validation rules are executed by the backend**:
- **Price Validation**: The backend verifies current store pricing, promotional voucher validity, and active discount rules. Frontend-submitted prices are never trusted blindly.
- **Inventory Availability Check**: Real-time evaluation of physical stock vs. commercial procurement rules.
- **Stock Reservation**: Backend atomically acquires concurrency locks to logically reserve available units or flags procurement requirements.
- **Procurement Gating**: Validation that non-stocked items are eligible for supplier procurement and lead-time estimation.
- **Order Validation**: Completeness of customer delivery address Snapshot, contact details, and line item configurations.
- **Payment Status & Method Validation**: Verification of gateway payment confirmation or installment credit eligibility.
- **Fulfillment Feasibility**: Validation that selected fulfillment method (delivery vs pickup) is viable for the destination and store.
- **Order Cancellation Rules**: Enforcing order cancellation eligibility based on fulfillment state (e.g., cannot cancel after driver dispatch).

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

| Initiating Action | Triggering Application | Propagation Mechanism | Resulting State & Downstream Impact |
|---|---|---|---|
| **Product Price Updated** | Management System (Admin) | Transactional Outbox → Storefront Cache Invalidation | E-commerce Website and Mobile App immediately display the updated price across catalog and cart views. |
| **Inbound Inventory Received** | Management System (Warehouse) | DB Commit → Outbox Event → Availability Recalculation | Commercial availability transitions from "Procurement Required" to "In Stock" across E-commerce channels. |
| **Customer Places Order** | E-commerce Web / Mobile | API Request → Sales Order Created → Outbox Event | Management System displays the new Sales Order with source badge (`ONLINE_WEB` or `ONLINE_APP`); inventory reserved. |
| **Supplier PO Received** | Management System (Procurement) | Receiving Transaction → Outbox Event | Outstanding procurement requirements linked to customer sales orders are resolved; fulfillment groups ready for dispatch. |
| **Delivery Assigned & Scheduled** | Management System (Logistics) | Trip Confirmed → Outbox Event → Push Dispatch | Worker Mobile App receives delivery stop in driver queue; E-commerce customer sees "Scheduled for Delivery". |
| **Delivery Completed** | Worker Mobile App (Driver) | Signature Upload → Delivery Confirmed → Outbox Event | E-commerce Web and Mobile display "Delivered"; Management System releases driver and reconciles Surat Jalan. |
| **Eligible Order Cancelled** | E-commerce Web / Mobile | Customer Request → Backend Cancellation Rules | Management System flags order as `CANCELLED`; reserved stock units released to available pool; procurement requirement revoked. |

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

#### 4. Customer Fulfillment Preferences:
Customers configure their preferred fulfillment arrangement during online checkout:
- **Option A: Complete Fulfillment**: Hold shipment until all items are ready, delivering the entire order in a single consolidated delivery trip.
- **Option B: Partial Fulfillment**: Fulfill and dispatch immediately available items first; fulfill and deliver remaining items in subsequent trips as they become available.
- **Option C: Customer Choice**: Provide dynamic checkout controls allowing the customer to assign delivery vs. pickup preferences per line item, subject to operational feasibility.

#### 5. Cross-Cutting Implications of Multi-Fulfillment:
- **Inventory Reservation**: Immediate reservations are applied to in-stock line items, while procurement requirements are assigned to back-ordered lines under the same sales order.
- **Payment Allocation**: Digital payments and installment agreements cover the total sales order value; revenue recognition and accounting entries map to individual fulfillment dispatches.
- **Delivery Charges**: Delivery fee algorithms calculate multi-drop logistics costs based on whether the customer requested consolidated or split deliveries.
- **Cancellations & Refunds**: Individual unfulfilled groups can be cancelled and refunded without invalidating delivered portions of the sales order.
- **Reporting & Margin**: Cost of goods sold (COGS) and freight expenses are attributed accurately per fulfillment group.

---

### 2.7 E-commerce Product Availability and Procurement Integration

Products that are not physically present in store or warehouse inventory may still be made purchasable online if the business permits on-demand supplier procurement.

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
  - The E-commerce Website and Mobile App explicitly badge products as "Available (Procurement Required)" with estimated dispatch lead times (e.g., "Ships within 5–7 business days").
  - Shopping cart and checkout summaries reiterate procurement lead times before payment commitment.
- **Procurement Requirement Recording**:
  - When an order containing procurement-required items is confirmed, the backend automatically logs an outstanding `ProcurementRequirement` linked to the sales order item.
- **Demand Consolidation (No 1:1 Auto-PO)**:
  - The system **does NOT automatically generate a separate supplier Purchase Order for every online customer order**. Automatic 1:1 PO generation creates unmanageable supplier logistics and prohibitive freight overheads.
  - Instead, the Management System provides purchasing staff with a **Demand Consolidation Work Center**, allowing procurement officers to aggregate requirements from dozens of online and showroom orders into optimized bulk Purchase Orders to distributors.
- **Inbound Receiving Linkage**:
  - When goods are physically received and serialized by warehouse staff (Group 7), the inventory module matches ingested serials to pending procurement requirements, transitioning the associated fulfillment group to ready-for-dispatch.

---

### 2.8 Fulfillment Methods (Own-Driver & Customer Pickup)

The integrated ecosystem supports two primary fulfillment methods from launch, modeled flexibly to accommodate future logistics expansions:

#### Method A: Own-Driver Delivery
- **Customer Experience**: Customer selects home delivery, inputs or selects destination address, and specifies delivery access notes (e.g., narrow street, second floor, vehicle height limits).
- **Logistics Integration**: Delivery fee calculated dynamically based on store-to-destination distance. Order items assign to an own-driver fulfillment group.
- **Trip Scheduling**: Management System logistics dispatchers group orders into multi-drop `DeliveryTrip` routes and assign company vehicles, drivers, and helpers.
- **Mobile Execution**: Assigned drivers receive delivery stops in the Worker Mobile App, review manifests, execute loading verification, navigate to destination, capture recipient touch signatures, take photo proof, and collect COD payments if applicable.
- **Status Synchronization**: Delivery confirmation updates the sales order, notifies the customer via push/SMS, and closes the delivery trip stop.

#### Method B: Customer Store Pickup
- **Customer Experience**: Customer chooses "Store Pickup" at checkout and selects an eligible store branch from the branch directory.
- **Staging & Readiness**: Store warehouse staff receive a pickup staging task in the Management System, pull reserved items, verify serial numbers, and mark the order as `READY_FOR_PICKUP`.
- **Customer Notification**: The backend triggers an automated pickup notification (Push Notification, Email, and WhatsApp) containing a unique Pickup Verification Code and QR barcode.
- **Handover Verification**: When the customer arrives at the store, floor staff verify the customer's identity and scan the QR code via the Worker Mobile App or Management System web portal.
- **Completion**: Staff and customer execute digital handover sign-off, transitioning the fulfillment group to `PICKED_UP` and updating the sales order status.

#### Architectural Extensibility for Third-Party Couriers:
Third-party courier integration (e.g., JNE, J&T, SiCepat, Lalamove) is not in the initial release scope. However, the fulfillment engine models fulfillment providers via a polymorphic interface (`FulfillmentProvider`), preventing courier-specific logic from being hardcoded into core sales order entities and ensuring straightforward API integration in future phases.

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
- **Mobile Worker App UI (`sms-mobile`)**:
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

#### Feature 4.1: Sales Order Lifecycle, Source Tracking & Multi-Fulfillment Grouping
- **Purpose**: Draft, calculate, reserve stock, and release sales orders for cash, online digital payments, COD, or credit terms across all channels (Management System, E-commerce Web, E-commerce Mobile).
- **Backend**: `SalesOrder.java`, `SalesOrderItem.java`, `SalesOrderService.java`, Flyway `V4__sales_orders.sql`.
- **Web UI**: `SalesOrderListPage.tsx`, `SalesOrderDetailPage.tsx`.
- **Status**: `[DONE]` (Core Lifecycle & In-Store SO) / `[PROPOSED]` (Omnichannel Source Tagging & Multi-Fulfillment Groups: `[P.1]`, `[P.4]`)
- **What Is Done**: State machine (`DRAFT → PENDING_APPROVAL → RELEASED → CONFIRMED → CANCELLED`), logical inventory reservation, discount calculation.
- **Integrated Omnichannel Enhancements**:
  - `order_source` tracking: Differentiating orders originated via `ONLINE_WEB`, `ONLINE_APP`, or `EMPLOYEE` (`[P.1]`).
  - Multi-Fulfillment Grouping: Modeling one Sales Order containing multiple `FulfillmentGroup` instances (e.g. partial warehouse dispatch + supplier procurement) without artificial order splitting (`[P.1]`).
  - Customer Fulfillment Preferences: Supporting complete delivery (consolidated), partial delivery (staggered), or customer choice (`[P.4]`).
- **Proposed Enhancements**: Quotation management with validity expiration dates (e.g., 7 days) and one-click quotation-to-order conversion (`[O.1]`); audit history tracking line-item changes and quantity edits on drafts (`[O.7]`).

#### Feature 4.2: Automated Price Negotiation & Discount Approval
- **Purpose**: Automatically intercept orders where `finalPrice < referencePrice`, generating approval requests with justification notes.
- **Backend**: `SalesOrderService.java` integrating with `ApprovalService.java`.
- **Web UI**: Discount alert banners and approval status chips in `SalesOrderDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Automatic workflow trigger, discount amount calculation, multi-level SPV/Manager review.
- **Proposed Enhancements**: Margin threshold warning indicator showing gross profit impact to approvers; salesperson monthly quota target and tiered commission tracking.

#### Feature 4.3: Down Payment (DP) Cash Custody & Online Gateway Payment Recording
- **Purpose**: Require upfront payment confirmation (Down Payment for credit orders or full payment for cash orders) before order confirmation, automatically reconciling transactions in Finance.
- **Backend**: `ConfirmSalesOrderRequest.java`, `SalesOrderService.confirm(...)` auto-creating `CustomerPayment` and `PaymentCustody`.
- **Web UI**: Down payment confirmation modal in `SalesOrderDetailPage.tsx`.
- **Status**: `[DONE]` (Cash Custody Confirmation) / `[PROPOSED]` (Online Payment Gateway Webhook Reconciliation: `[P.8]`)
- **What Is Done**: Direct integration between in-store Sales Order confirmation and Finance cash custody ledger (`HELD_BY_CASHIER`).
- **Omnichannel Payment Integration**: For online e-commerce orders, payments are processed via digital payment gateways (QRIS dynamic barcodes, Virtual Accounts, Credit Cards) with asynchronous webhook callback verification, automatically creating confirmed `CustomerPayment` records and bypassing physical cash custody (`[P.8]`).
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
- **Omnichannel Demand Consolidation Engine `[PROPOSED]` (Backlog `[P.3]`)**:
  - Consolidation dashboard aggregating backordered line items from sales orders (`AVAILABLE_PROCUREMENT_REQUIRED`) into optimized bulk supplier POs.
  - Strictly avoids generating 1:1 automated POs per sales order, preserving bulk procurement economies of scale.
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

#### Feature 8.1: Multi-Drop Delivery Trip Planning (Own-Driver Method)
- **Purpose**: Group confirmed sales order fulfillment groups into optimized delivery trips, assigning vehicle, driver, and helper staff.
- **Backend**: `DeliveryTrip.java`, `DeliveryOrder.java`, `DeliveryService.java`, Flyway `V8__delivery_logistics.sql`.
- **Web UI**: `DeliveryTripListPage.tsx`, `DeliveryTripDetailPage.tsx`.
- **Status**: `[DONE]`
- **What Is Done**: Trip scheduling, vehicle assignment, stop sequence ordering for own-driver delivery method.
- **Multi-Fulfillment Association**: Binds specific `FulfillmentGroup` instances to delivery stops, supporting partial order deliveries without splitting parent sales orders.
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

#### Feature 8.4: Mobile Driver Delivery Execution, Touch Signature & COD (`[DONE]`, Backlog `[M.3]`)
- **Purpose**: Driver mobile app for delivery confirmation, recipient touch signature, proof photo upload, COD cash collection, and failed delivery incident reporting.
- **Mobile**: `driver_trip_screen.dart`, `signature_pad_widget.dart`, `photo_proof_grid_widget.dart`, `delivery_provider.dart`.
- **Backend**: `POST /api/delivery-orders/{id}/deliver`, `POST /api/delivery-orders/{id}/fail`, `FailDeliveryOrderRequest.java`, `DeliveryService.java`.
- **Status**: `[DONE]`
- **What Is Done**: Mobile stop list, recipient touch signature capture, COD payment collection, delivery completion with GPS watermark, and structured delivery issue reporting (`failDelivery`) capturing failure reason tags, proof photos (`proofPhotoUrl`), device geocoordinates, and triggering automated alerts to branch dispatchers (`DELIVERY_MANAGE`) to reschedule to a new trip.
- **Architectural Policy**: Manual dispatcher reassignment is intentionally enforced instead of automatic re-dispatch to ensure vehicle payload balancing and driver route optimization.
- **Proposed Enhancements**: Turn-by-turn navigation deep linking to Google Maps / Waze using survey-verified destination coordinates (`[M.7]`).

#### Feature 8.5: Customer Store Pickup Fulfillment & Handover `[PROPOSED]` (Backlog `[P.5]`)
- **Purpose**: Facilitate customer in-store pickup orders from checkout to item handover.
- **Scope**:
  - Eligible branch store selection during online checkout based on product availability.
  - In-store preparation and staging tracking in Management System (`READY_FOR_PICKUP`).
  - Automated customer notification via WhatsApp, Push, and Email containing unique Pickup Verification Code and QR barcode.
  - Store staff QR code verification and recipient ID validation via Management System Web or Worker Mobile App.
  - Digital pickup confirmation and automatic synchronization with parent sales order fulfillment group.

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

#### Feature 14.12: Active Task-Bounded Mobile Worker Location Tracking `[PROPOSED]` (Backlog `[P.10]`)
- **Purpose**: Track field staff location strictly during active delivery trips or field surveys for ETA calculation and driver safety.
- **Scope**:
  - Tracking is strictly bounded to the lifecycle of active tasks (`TRIP_IN_PROGRESS` or `SURVEY_ACTIVE`).
  - No background location tracking occurs when off-duty or outside active tasks, preserving employee privacy and battery life.
  - Periodic location breadcrumbs uploaded to backend via MQTT/REST or cached locally when offline.
  - Visual breadcrumb route map rendered in Management System logistics center.

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

#### Feature 17.3: Shopping Cart, Checkout & Multi-Fulfillment Group Preference Selection `[PROPOSED]` (Backlog `[P.1]`, `[P.4]`)
- **Purpose**: Streamlined self-service cart management and multi-fulfillment checkout.
- **Scope**:
  - Persistent shopping cart across web and mobile sessions linked to customer account.
  - Price quote calculation including itemized tax (PPN), applied promo vouchers, and dynamic delivery fees.
  - Fulfillment method selection per order: Own-driver delivery (with address selection) or Customer store pickup (with branch selection).
  - Multi-fulfillment grouping preference selection:
    - *Complete Fulfillment*: Hold all items and deliver together in one consolidated trip.
    - *Partial Fulfillment*: Dispatch immediately available items first; deliver remaining backordered items upon receiving.
    - *Customer Choice*: Assign individual items to delivery vs store pickup where operationally feasible.

#### Feature 17.4: Customer Self-Service Registration, Authentication & Address Management `[PROPOSED]` (Backlog `[P.6]`, `[P.7]`)
- **Purpose**: Secure customer onboarding and profile management decoupled from back-office employee creation gating.
- **Scope**:
  - Public customer registration via email/phone OTP and passwordless magic links.
  - NIK validation for credit installment applications (optional for simple cash/gateway purchases).
  - Multi-address book (Home, Office, Alternate) with interactive map pin-drop coordinates and delivery access notes.
  - Customer profile settings, communication preferences, and data privacy management (UU PDP consent).

#### Feature 17.5: Online Digital Payment Integration & Webhook Reconciliation `[PROPOSED]` (Backlog `[P.8]`)
- **Purpose**: Frictionless online payment processing with automated backend ledger reconciliation.
- **Scope**:
  - Integration with reputable Indonesian payment gateways (e.g., Midtrans, Xendit).
  - Supported payment methods: QRIS dynamic barcodes, bank Virtual Accounts (BCA, Mandiri, BRI, BNI), Credit/Debit cards, and e-wallets (GoPay, OVO).
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
| **29** | Customer 360 & CRM | `Customer360Controller`, `V22` | `CustomerDetailPage.tsx` (Tabs 0-4) | `Customer360Screen.dart` | 5 JUnit + 4 Vitest Passed | **100%** | `[J.1–J.7]` |
| **30** | Promise-to-Pay (PTP) Engine | `CustomerPromiseToPay`, Lifecycle | `CustomerDetailPage` (Tab 2) | PTP Quick Dialog & Offline | 5 JUnit + 2 Vitest Passed | **100%** | `[J.3]` |
| **31** | *Sales Returns & Refunds* | *Proposed* | *Proposed* | *N/A* | *Under Architectural Review*| **0% (Proposed)** | `[K.1]`, `[K.2]` |
| **32** | *Inventory Costing (COGS/FIFO)*| *Proposed* | *Proposed* | *N/A* | *Under Architectural Review*| **0% (Proposed)** | `[I.1–I.4]` |
| **33** | *Warehouse Location & Picking* | *Proposed* | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[I.8]`, `[I.9]`, `[M.2]` |
| **34** | *Store Checklists & Fleet* | *Proposed* | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[L.1]`, `[L.2]`, `[L.5–L.7]` |
| **35** | *Internal Bulletins & Tasks* | *Proposed* | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[L.3]`, `[L.4]` |
| **36** | Mobile Work Centers & Auditing | Survey, DO, Stocktake, Notif | N/A | Screens (Sales, Pick, Audit, Hub) | 77 JUnit + 5 Flutter Passed | **100%** | `[M.1–M.6]` |
| **37** | *Architecture, SRE & Security* | *Proposed* | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[N.1–N.7]` |
| **38** | *Workflow Governance & Usability*| *Proposed* | *Proposed* | *N/A* | *Under Architectural Review*| **0% (Proposed)** | `[O.1–O.7]` |
| **39** | *E-commerce Web Application* | `StorefrontController` | *Proposed (Web)* | *N/A* | *Under Architectural Review*| **0% (Proposed)** | `[P.6]` |
| **40** | *E-commerce Mobile Application* | `StorefrontController` | *N/A* | *Proposed (Mobile)* | *Under Architectural Review*| **0% (Proposed)** | `[P.7]` |
| **41** | *Multi-Fulfillment Groups & Source Tagging*| `SalesOrder` Groups | `SalesOrderDetailPage` | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[P.1]`, `[P.4]` |
| **42** | *Commercial Availability & Lead Times*| `AvailabilityService` | *Proposed* | *Proposed* | *Under Architectural Review*| **0% (Proposed)** | `[P.2]` |
| **43** | *Procurement Demand Consolidation* | `ProcurementService` | Demand Center | *N/A* | *Under Architectural Review*| **0% (Proposed)** | `[P.3]` |
| **44** | *Customer Store Pickup & Handover* | `PickupService` | Handover Dialog | `PickupVerification` | *Under Architectural Review*| **0% (Proposed)** | `[P.5]` |
| **45** | *Digital Payment Gateway & Webhooks* | `PaymentWebhookController`| *N/A* | Checkout Flow | *Under Architectural Review*| **0% (Proposed)** | `[P.8]` |
| **46** | *Cross-Application Outbox Sync* | `OutboxEventDispatcher` | Push Events | Push Receiver | *Under Architectural Review*| **0% (Proposed)** | `[N.1]`, `[P.9]` |
| **47** | *Worker Active-Task GPS Tracking* | `GeoLocationService` | Route Map Live | Active Task Daemon | *Under Architectural Review*| **0% (Proposed)** | `[P.10]` |

---

## 6. What Hasn't Been Done Yet (Detailed Gap Analysis & Review)

While the full operational feature code across backend, web, and mobile is written, integrated, and verified by local unit/component tests, the following infrastructure, integration, and newly proposed domains represent outstanding work required to achieve full enterprise production maturity:

### 1. Live Environment & Infrastructure Deployment (Backlog `[A.1–A.5]`)
- The backend currently runs using local development profiles and placeholder credentials.
- Migrations `V1` through `V20` must be executed and validated against a live PostgreSQL 16 database (`[A.3]`).
- A production Supabase project with JWKS URI validation and S3-compatible storage buckets (`sms-documents`, `sms-photos`, `sms-signatures`) must be provisioned with row-level security policies (`[A.1]`).
- A production Redis cluster must be provisioned for high-concurrency atomic document sequence counters and query caching (`[A.2]`).

### 2. Quality Assurance, DevOps & Multi-Service Integration Testing (Backlog `[F.1–F.4]`, `[P.9]`)
- **End-to-End Browser Testing (`[F.1]`)**: Automated browser test suite using Playwright covering the primary business pipeline: *Sales Order Draft → Price Approval → Survey → Confirm + DP → Delivery Trip + Surat Jalan → Installment Payment*.
- **Mobile Integration Tests (`[F.2]`)**: Flutter integration tests validating offline action queue persistence across app restarts, biometric unlock simulation, and sync replay.
- **Continuous Integration Pipeline (`[F.3]`)**: GitHub Actions workflow running Maven build/tests, Web lint/build/Vitest, and Flutter analyze/tests on every pull request.
- **Automated Database Backup & Disaster Recovery (`[F.4]`)**: Scheduled `pg_dump` snapshot script with offsite cloud storage replication.
- **Cross-Application Integration & Event Tests (`[P.9]`)**: Multi-application test suite verifying end-to-end event propagation (Transactional Outbox → Dispatcher → Webhook / Mobile Push) and state machine coherence across all 4 applications.

### 3. Advanced Mobile Offline Architecture & Conflict Handling (Backlog `[N.3]`)
- Transition from plain `SharedPreferences` to SQLite via Drift to support multi-table relational persistence, complex offline queries, and ACID local transactions.
- Implement explicit 5-state sync tracking (`PENDING`, `SYNCING`, `SUCCESS`, `RETRY`, `CONFLICT`) with server-authoritative conflict escalation UI for financial and inventory divergence.

### 4. Proposed Business & Architectural Domains (Backlog `[H.1–H.10]`, `[I.1–I.9]`, `[J.1–J.7]`, `[K.1–K.5]`, `[L.1–L.7]`, `[M.1–M.6]`, `[N.1–N.7]`, `[O.1–O.7]`)
- Detailed design and stakeholder review of ADR-01 through ADR-09 prior to scheduling implementation for Accounting, Inventory Costing, Stocktaking, CRM 360, Returns/Refunds, Fleet/Checklists, and Workflow Governance.

### 5. E-commerce Customer Platforms & Ecosystem Integration (Backlog `[P.1–P.10]`)
- Build customer-facing E-commerce Website (`e-commerce-web`) and E-commerce Mobile Application (`e-commerce-mobile`).
- Implement the Multi-Fulfillment Grouping data model and checkout preference selector (Complete vs Partial fulfillment).
- Implement commercial availability status calculations decoupled from raw physical inventory balances.
- Implement procurement demand consolidation work center for purchasing staff.
- Build customer pickup scheduling, preparation staging, and mobile/web verification handover workflow.
- Integrate online digital payment gateway webhooks (QRIS, VA, Cards) with idempotent financial reconciliation.
- Implement active task-bounded mobile worker location tracking.

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

### J. Customer 360, CRM & Omnichannel Experience (Completed)
- [x] **J.1**: Unified Customer 360 profile consolidating sales orders, credit surveys, payment histories, delivery attempts, warranties, and interaction notes.
- [x] **J.2**: Customer demographic tags, behavioral segmentation, Customer Lifetime Value (CLV), and historical credit reliability scoring.
- [x] **J.3**: Customer Promise-to-Pay (PTP) tracking engine recording promised payment dates and amounts, tracking Kept vs Broken status, and triggering reminders.
- [x] **J.4**: Fuzzy duplicate customer detection matching phone numbers, name phonetics, and mother's maiden name.
- [x] **J.5**: Customer gift vouchers, promotional coupons, and store credit ledger management.
- [x] **J.6**: Customer omnichannel communication and interaction history log (in-person visits, phone calls, SMS, WhatsApp interactions).
- [x] **J.7**: Customer follow-up scheduler and automated reminder engine (sales lead follow-up, payment reminders, service check-ins).
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

### M. Mobile Work Center Enhancements (Completed & Extended)
- [x] **M.1**: Surveyor Customer Location Profiling capturing delivery destination GPS coordinates, alley width, stair clearance, and gate access notes (persisted in structured backend columns via `V23__survey_location_profiling.sql` and mobile survey assessment updates).
- [x] **M.2**: Warehouse mobile guided picking and packing verification with barcode scanning against delivery packing manifests (`verifyPacking` backend endpoint and mobile guided picking scanner).
- [x] **M.3**: Delivery Issue Reporting for failed deliveries with photographic proof (`proofPhotoUrl`), failure reason tagging, and dispatcher notification workflow for manual trip reassignment.
- [x] **M.4**: Salesperson Mobile Work Center with customer lookup, quotation generator, and personal quota progress tracking (configurable target benchmark and visual progress indicator).
- [x] **M.5**: Mobile Physical Stocktaking (Stock Opname) continuous barcode scanning tool with resilient offline buffer and server-side variance reconciliation for supervisor review (blind-count mode).
- [x] **M.6**: Mobile Actionable Notification Center with document deep-links and one-tap supervisory approvals/rejections.
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

### O. Workflow, Document Governance & Enterprise Usability (Proposed)
- [ ] **O.1**: Document expiry monitoring and automated reminders (quotations, contracts, warranties, supplier agreements).
- [ ] **O.2**: Approval delegation when assigned approver is unavailable (temporary proxy assignment).
- [ ] **O.3**: Approval escalation, timeout rules, and automatic reassignment upon inactivity.
- [ ] **O.4**: Saved custom table filters and persistent column preferences stored per user.
- [ ] **O.5**: Universal document attachment previewer modal supporting inline rendering of PDFs, images, and Word documents.
- [ ] **O.6**: Bulk operations across data grids (bulk document print, status updates, exports).
- [ ] **O.7**: Master data change history audit log capturing field-level diffs.

### P. Integrated E-commerce Ecosystem & Omnichannel Architecture (Proposed)
- [ ] **P.1**: Data model and Flyway migration for unified Sales Order source tagging (`ONLINE_WEB`, `ONLINE_APP`, `EMPLOYEE`) and Multi-Fulfillment Grouping (`fulfillment_group`, `shipment_status`, line-item association) avoiding order fragmentation.
- [ ] **P.2**: Commercial sales availability calculation service decoupling physical warehouse stock (`StockUnit`) from customer-facing purchasability states (`IN_STOCK`, `AVAILABLE_PROCUREMENT_REQUIRED`, `PREORDER`, `UNAVAILABLE`).
- [ ] **P.3**: Demand consolidation work center in Management System allowing purchasing staff to aggregate backordered sales order requirements into optimized bulk distributor Purchase Orders.
- [ ] **P.4**: Customer fulfillment preference selection engine (Complete fulfillment, Partial fulfillment, Customer choice) with multi-trip delivery charge computation.
- [ ] **P.5**: Customer store pickup fulfillment module: pickup branch selection, in-store staging tracking, customer pickup QR code generation, and mobile/web handover verification.
- [ ] **P.6**: Customer-facing E-commerce Website (`e-commerce-web`: Next.js / React) with catalog browsing, faceted search, shopping cart, checkout, online payments, and self-service order tracking.
- [ ] **P.7**: Customer-facing E-commerce Mobile Application (`e-commerce-mobile`: Flutter / native) sharing backend APIs with web storefront, with native push notifications for order milestones.
- [ ] **P.8**: Online digital payment gateway integration (QRIS dynamic barcodes, Virtual Accounts, Credit Cards) with cryptographic signature validation and idempotent webhook callback reconciliation.
- [ ] **P.9**: Cross-application event propagation test suite and transactional outbox dispatcher validating at-least-once message delivery and state machine coherence across all 4 applications.
- [ ] **P.10**: Worker Mobile App field logistics extensions: delivery destination access profiling (gang senggol, stairs, vehicle limits) and active task-bounded GPS tracking.

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
    - **Mobile Worker App (`sms-mobile`)**:
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
    - **Mobile Worker App (`sms-mobile`)**:
      - Enhanced `surveyor_task_screen.dart` and `survey_provider.dart` to dispatch structured GPS coordinates, alley width, stair clearance, and gate access constraints directly to backend endpoints (`[M.1]`).
      - Verified warehouse guided picking and packing verification with barcode scanning against active manifests (`warehouse_picking_screen.dart`, `[M.2]`).
      - Enforced architectural policy for delivery failure handling: captured failure root-cause tags, photo proof, and GPS coordinates while notifying dispatchers for manual load-balanced trip reassignment (`driver_trip_screen.dart`, `delivery_provider.dart`, `[M.3]`).
      - Enhanced `sales_work_center_screen.dart` with configurable monthly quota target (default Rp 50.000.000 benchmark) and visual progress bar (`LinearProgressIndicator`) with percentage calculation, tier color-coding, and estimated commission display (`[M.4]`).
      - Verified blind physical stocktaking mode (`stocktake_screen.dart`) with continuous barcode scanning, offline `SharedPreferences` buffering, and server-side variance reconciliation for supervisory sign-off (`[M.5]`).
      - Verified Actionable Notification Center (`notification_center_screen.dart`) with deep links (`/survey/:id`, `/delivery-order/:id`, `/sales-order/:id`, `/stocktake-review/:id`) and one-tap supervisory approvals/rejections (`[M.6]`).
      - Created automated Flutter test suite (`test/features/mobile_enhancements_test.dart`) mocking network adapters and testing all M features.
      - Verified: Flutter analyze 0 errors/warnings, 5/5 Flutter tests passing, and Android Gradle `compileDebugSources` build verified cleanly with Gradle 9.1.0 and Build-Tools 36.

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
- **Customer Relationship Management & Customer 360 Extensions (`[J.8–J.11]`)**:
  - Automated WhatsApp Business API integration via webhook for interactive 2-way payment reminders, PTP confirmations, and post-delivery NPS feedback (`[J.8]`).
  - Dynamic retail invoice payment links with QRIS generation for installment payments linked to PTP promises (`[J.9]`).
  - Geofenced GPS check-in validation for field collector and sales visits with automatic proximity confirmation (`[J.10]`).
  - Sentiment analysis and keyword flag extraction on customer interaction notes for proactive delinquency and churn mitigation (`[J.11]`).
  *(Note: Core Customer 360, CLV, PTP Engine, Fuzzy Duplicate Detection, Store Credit, Omnichannel Logs, and Follow-ups `[J.1–J.7]` completed across backend, web, and mobile in Version 3.3)*.

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

#### I. Integrated E-commerce Ecosystem & Omnichannel Commerce (`[P.1–P.10]`)
- **Unified Sales Orders & Multi-Fulfillment Grouping (`[P.1]`, `[P.4]`)**: Single Sales Order model with order source badges (`ONLINE_WEB`, `ONLINE_APP`, `EMPLOYEE`), multi-fulfillment groups, and complete vs partial delivery customer preferences.
- **Commercial Availability & Procurement Consolidation (`[P.2]`, `[P.3]`)**: Decoupled commercial sales availability engine (`IN_STOCK`, `AVAILABLE_PROCUREMENT_REQUIRED`, `PREORDER`, `UNAVAILABLE`) and demand consolidation work center for purchasing staff.
- **Storefront Touchpoints (`[P.6]`, `[P.7]`)**: Customer web portal and mobile app sharing backend endpoints, catalog, and cart states.
- **Customer Pickup & Logistics Execution (`[P.5]`, `[P.10]`)**: Store pickup verification, destination access constraints profiling, and active task-bounded worker tracking.
- **Online Payment Automation (`[P.8]`)**: Payment gateway webhooks (QRIS, VA, Cards) with automated financial ledger reconciliation.

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
| **ADR-10** | **Multi-Fulfillment Grouping, Partial Delivery & Financial Treatment** | How should sales orders with multiple fulfillment groups be billed, invoiced, and accounted for when dispatches are staggered? | **Policy**: A single Sales Order must never be split into multiple sales orders. The order maintains overall commercial agreement totals.<br>*Decision Needed*: Are partial delivery notes (*Surat Jalan*) treated as interim shipments with pro-rata invoicing, or is a single final commercial invoice generated upon complete delivery? How are partial delivery cancellation refunds disbursed when part of the order has already been physically delivered? |
| **ADR-11** | **Customer Identity, Self-Registration vs Gated Creation, and Guest Checkout** | How should customer identity be reconciled between back-office staff creation (strictly context-gated to SO drafts) and online e-commerce self-registration? | **Policy**: Back-office staff creation remains context-gated. E-commerce platforms permit self-service customer registration with email/phone OTP verification.<br>*Decision Needed*: Should guest checkout be supported without registration? If a guest later registers or an online buyer visits a physical showroom, how should NIK and phone number deduplication link the accounts without violating UU PDP data protection consent? |
| **ADR-12** | **E-commerce Storefront Technology Stack & API Gateway Pattern** | Which front-end frameworks and communication patterns should power the E-commerce Website (App B) and E-commerce Mobile App (App C)? | **Recommendation**: E-commerce Website built on Next.js 15 (React 19) for Search Engine Optimization (SEO), Server-Side Rendering (SSR), and incremental static regeneration. E-commerce Mobile App built on Flutter or React Native to leverage shared design tokens.<br>*Architecture*: Both frontends communicate with `sms-backend` via dedicated `/api/v1/storefront/*` endpoints, isolated from internal administrative APIs via Spring Security route guards or an API gateway. |

---

### 9.3 Detailed Analysis of Architectural Conflicts, Questions & Reconciliations for Executive Discussion

To ensure complete transparency and prevent arbitrary decisions, the following five architectural tensions between existing system rules and the new four-application ecosystem are explicitly highlighted for technical leadership and executive review:

#### 1. Context-Gated Customer Creation vs. E-commerce Self-Registration
- **Existing Documented Decision**: Feature 2.3 enforces strict context-gating: store staff cannot create free-floating customer records without an active Sales Order draft or explicit administrative override. This prevents orphaned dummy records and CRM clutter.
- **New Ecosystem Requirement**: Section 1.B requires customer-facing self-service registration and authentication on the E-commerce Website and Mobile App.
- **Architectural Reconciliation**:
  - The two mechanisms operate in completely distinct security scopes. Back-office employee endpoints (`/api/customers`) remain strictly gated by sales order context and RBAC.
  - Public storefront endpoints (`/api/v1/storefront/auth/register`) allow self-service customer registration with phone/email verification.
  - *Open Question for Discussion*: When an online-registered customer walks into a brick-and-mortar showroom, how should the showroom salesperson look up their record? Searching by NIK or verified mobile phone number will link the existing online customer record without triggering the context-gated creation rule.

#### 2. Real-Time Stock Reservation vs. Procurement-Required Ordering
- **Existing Documented Decision**: The inventory module requires that confirmed sales orders acquire concurrency locks and reserve physical serialized units (`StockUnit` with status `AVAILABLE`).
- **New Ecosystem Requirement**: Section 7 permits customers to purchase products with status `AVAILABLE_PROCUREMENT_REQUIRED` where physical inventory is currently zero.
- **Architectural Reconciliation**:
  - The sales order item entity must support an explicit `is_procurement_required` flag and a linked `ProcurementRequirement` record.
  - In-stock line items trigger immediate `StockUnit` reservation locks; procurement-required line items skip physical unit locking and transition the fulfillment group to `AWAITING_PROCUREMENT`.
  - *Open Question for Discussion*: If a customer places an order with "Complete Fulfillment" (wait for all items) containing 1 in-stock item and 1 procurement-required item, should the in-stock item remain locked in warehouse inventory for 5–7 days while waiting for distributor procurement, or should reservation be deferred until supplier PO arrival? Locking inventory ties up working capital; deferring reservation risks stock depletion by showroom floor sales.

#### 3. Multi-Fulfillment Deliveries vs. Surat Jalan Document Numbering & Invoicing
- **Existing Documented Decision**: Invariant 6 and Feature 8.3 assume that a Sales Order corresponds to a delivery order trip generating a formal Delivery Note (*Surat Jalan*) with sequential numbering.
- **New Ecosystem Requirement**: Section 6 establishes that one Sales Order may have multiple Fulfillment Groups resulting in staggered physical deliveries.
- **Architectural Reconciliation**:
  - A single Sales Order must never be cloned or split into multiple sales orders.
  - Instead, the system must support 1-to-N relationships between `SalesOrder` and `DeliveryOrder` / `SuratJalan`. Each delivery note receives a distinct sequence number referencing the parent SO and fulfillment group (e.g., `SJ/{STORE}/10/2026/0042-01` for Fulfillment 1, and `-02` for Fulfillment 2).
  - *Open Question for Discussion*: For statutory Indonesian tax invoicing (*Faktur Pajak*), should tax invoices be generated upon full sales order payment or incrementally upon each Surat Jalan physical dispatch? Tax counsel alignment is required.

#### 4. Active Task-Bounded Worker Location Tracking vs. Employee Privacy
- **Existing Documented Decision**: Group 12 and Feature 14.1 restrict GPS verification to attendance clock-in geofences (Haversine 200m) and field photo watermarks to protect employee privacy and battery life.
- **New Ecosystem Requirement**: Section 1.D specifies employee location tracking during active operational tasks.
- **Architectural Reconciliation**:
  - The system will enforce **strict lifecycle bounding**: GPS tracking is activated *only* when a driver starts a delivery trip (`TRIP_IN_PROGRESS`) or a surveyor starts an on-site survey (`SURVEY_ACTIVE`).
  - Tracking immediately halts when the trip or survey is marked complete or paused. Background tracking when off-duty or on break is strictly prohibited.
  - *Open Question for Discussion*: What breadcrumb frequency should be enforced (e.g., 60 seconds vs 180 seconds) to balance battery consumption and road safety visibility across typical 8-hour delivery routes?

#### 5. Enterprise Money Management Platform Scope vs. Payment Gateway Escrow
- **Existing Documented Decision**: Invariant 1 and Section 1 clarify that SMS is an enterprise money management platform, not a bank. Finance modules track cash custody, cashier handovers, and installment debt.
- **New Ecosystem Requirement**: Section 1.B and Section 4 require online payments via digital payment gateways (QRIS, Virtual Accounts, Credit Cards).
- **Architectural Reconciliation**:
  - SMS does not hold customer deposits or operate an escrow wallet.
  - Third-party licensed payment gateways (Midtrans, Xendit) handle fund processing, payment clearance, and statutory central bank compliance.
  - The SMS backend acts purely as the merchant ledger, receiving cryptographic webhook notifications and recording settled transactions into `CustomerPayment` registers.
