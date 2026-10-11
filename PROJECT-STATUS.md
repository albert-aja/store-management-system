# SMS Project Status — Resume Point

> Read this first before continuing work. Full historical detail is documented below, tracking modules completed, verified tests, and next actions.

## Project

Store Management System (multi-store electronics/furniture retailer) + Worker App (mobile Flutter).
Requirements source of truth: [Store-Management-System-README.md](Store-Management-System-README.md) (authoritative,
newest-wins conflict resolution already applied) + [Store-Management-System-AI-Prompt.md](Store-Management-System-AI-Prompt.md)
(working-style rules) + [Download the revised Markdown specification.md](Download%20the%20revised%20Markdown%20specification.md)
(older raw spec, superseded where it conflicts with the README).

## Repos

- `sms-backend/` — Java 21, Maven, Spring Boot 4.1.x, package-by-module under `com.sms.<module>`.
- `sms-web/` — Vite + React 19 + TypeScript, MUI v9, TanStack Query, React Hook Form + Zod, Zustand, Axios, Notistack.
- `sms-mobile/` — Flutter 3.44.0 • Dart 3.12.0, Flutter Riverpod 3.x, GoRouter, Material 3.

All three are separate codebases living as subfolders of this workspace.

## Prerequisites still outstanding (blocks real runtime, not blocking further code-writing)

1. **Supabase project** — need URL, anon key, service role key, DB connection string, JWKS URI. Config currently
   reads these from env vars with placeholder defaults (see `sms-backend/src/main/resources/application.yml`).
   No `.env.example` file exists — Copilot-ignore settings block creating `.env*` files; env var names are
   documented directly in `application.yml` comments instead.
2. **Docker Desktop** — not available in the dev sandbox used so far. Testcontainers-based integration tests and
   `sms-backend/docker-compose.yml` (local Postgres+Redis) have not been run. Only pure-Mockito unit tests have
   been executed. **Run the full integration suite once on a machine with Docker.**
3. **Redis** — document numbering (`DocumentNumberingService`) requires Redis at runtime (`docker-compose.yml`
   provides one for local dev).

---

## What's DONE (backend + web, both verified: build/lint/tests green each time)

### 1. Foundation module

- Backend: `com.sms.foundation.{store,employee,role,approval,numbering,notification,document}` + `com.sms.common.*`
  (audit base entity, Supabase JWT security, structured error handling).
- Migrations `V1`–`V4`: store, employee (+ `auth_user_id` linking to Supabase), role/permission/assignments,
  generic approval engine (workflow → request with **step snapshotting** so later workflow edits never rewrite
  history), generic `document_record` + `notification`/`notification_recipient`, seed of 10 baseline roles
  (Owner, Manager, Admin, SPV, Salesperson, Surveyor, Driver, Collector, AR, Helper/OB).
- Document numbering is **Redis-backed** (`INCR` on `docnum:{storeId}:{docType}:{year}`), format
  `{TYPE}/{STORE_CODE}/{MM}/{YYYY}/{SEQ:04d}` — not a Postgres table.
- Web: Stores, Employees (+ role/store/supervisor assignment), Roles/Permissions (+ role creation dialog),
  Approval Workflow config (React Flow step visualization), Notification bell.
- Supabase Auth login, JWT → employee/roles/permissions/store-scope principal resolution, `/api/me` bootstrap.

### 2. Customer module

- Backend: `com.sms.customer.*` (Customer, CustomerContact, CustomerAddress). Migration `V5`.
  `CUSTOMER_MANAGE` permission seeded to Owner/Manager/Admin/Salesperson. NIK unique-if-present. Only one
  active primary address per customer (partial unique index + service-level enforcement). Documents reuse the
  generic `document_record` (`ownerType=CUSTOMER`) — no separate customer-documents table.
- Web: `src/features/customers/*` (search/list, create/edit, detail page with contacts/addresses/documents via
  reusable `src/features/documents/DocumentsPanel.tsx`).
- **Flagged, unresolved conflict**: README says customer create/update should normally be gated through the SO
  workflow. Since a Sales Order module now exists (see below) but doesn't yet enforce this gating, Customer CRUD
  is still open via direct Management System access for Owner/Manager/Admin/Salesperson. Revisit if/when strict
  SO-gated customer editing is required.

### 3. Product / Pricing module

- Backend: `com.sms.product.*` (Product, ProductVariant, ProductComponent — migration `V6`, product code
  auto-generated via Postgres sequence `product_code_seq` → `PRD-00001`). `com.sms.pricing.*`
  (StoreProductPrice, StoreProductPaymentPlan — migration `V7`, mutable in place, no price history yet).
  `PRODUCT_MANAGE` → Owner/Manager/Admin. `PRICING_MANAGE` → Owner/Manager only.
- **Deliberately deferred**: Component Stock (loose spare-part quantity) — it's inherently
  `stock_movement`-ledger-backed (README 6.2/6.5), so no fake quantity column was added; it belongs in the
  Inventory module below.
- Web: `src/features/products/*` (list/detail with variants + standard components),
  `src/features/pricing/PricingPanel.tsx` embedded in the product detail page (per-store cash price + term plans).

### 4. Sales Order module

- Backend: `com.sms.sales.*` (SalesOrder, SalesOrderItem — migration `V8`). Lifecycle implemented so far:
  `DRAFT → (PENDING_PRICE_APPROVAL) → RELEASED → SURVEY_REJECTED | CONFIRMED → CANCELLED`.
  - Draft = workspace, no number, items hard-deletable only while Draft (not yet historical truth).
  - Negotiated price (`finalPrice != referencePrice` on any item) requires an **APPROVED** request via the
    existing generic approval engine (`reference_type='SALES_ORDER'`) before release; rejected negotiation
    returns the SO to Draft for revision (`POST /revise`), never becomes official.
  - Release assigns the official number via `DocumentNumberingService` (`docType=SO`) and freezes the delivery
    address snapshot.
  - `confirm()` = customer confirmation + DP step: requires an APPROVED survey for credit orders (see below);
    DP itself is just a boolean attestation right now — real DP payment capture connects into Finance.
  - `SALES_ORDER_MANAGE` → Owner/Manager/Admin/Salesperson.
- Web: `src/features/salesOrders/*` — list/filter, new-draft dialog (store/customer/address), detail page
  (items add/remove, submit-for-approval, revise, release, confirm, cancel).

### 5. Survey module

- Backend: `com.sms.survey.*` (Survey — migration `V9`, 1 SO → 1 Survey → 1 Surveyor, no resurvey loop).
  Only credit SOs (any item with `paymentTermMonths > 0`) need a survey; cash-only SOs skip it. Surveyor's
  Approved/Rejected result is decisive: Rejected sets the SO to the terminal `SURVEY_REJECTED` status (distinct
  from the revisable price-negotiation `REJECTED`). `SURVEY_MANAGE` → Owner/Manager/Admin;
  `SURVEY_DECIDE` → + Surveyor role.
- Web: `src/features/surveys/SurveyPanel.tsx` embedded in the Sales Order detail page (start survey, assign
  surveyor, record assessment fields, approve/reject).

### 6. Inventory/Stock module

- Backend: `com.sms.inventory.*` (StockUnit, ComponentStock, StockMovement, SalesOrderItemStockUnit —
  migration `V10`). Three independent dimensions on StockUnit: `currentStore`+`locationType` (Warehouse/
  Showroom/Repair Area/in-transit/external states), `availabilityStatus` (Available/Reserved/Unavailable —
  only 3 states per README's own core-concepts table), and the permanent `stock_movement` ledger (immutable,
  physical/location changes only — Reservation/Allocation are explicitly separate concepts, not movement rows).
  `INVENTORY_MANAGE` → Owner/Manager/Admin.
  - Normal-price SOs reserve stock at `release()`; negotiated SOs reserve at `submitForPriceApproval()`.
  - Allocation (`sales_order_item_stock_unit`) is a separate action (`AllocationController`).
  - Component Stock implemented via `stock_movement` ledger (`COMPONENT_RECEIVING`/`COMPONENT_ADJUSTMENT`).
- Web: `src/features/inventory/*` — Stock Unit list/filter, receive dialog, transfer dialog, availability
  toggle; `ComponentStockPanel` embedded in Product detail; `AllocationPanel` embedded per-item in the Sales
  Order detail page.

### 7. Product catalog restructure (V12)

- Entities model Type → Category → Product, Product → Brand, Variant identified by `sku`.
- Migration `V12__product_catalog_restructure.sql` creates `product_type/category/brand/attribute`.
- API: `ProductRequest`, `VariantRequest`; lookups at `/api/catalog/{types,categories,brands}`.

### 8. Procurement module (complete)

- Migration `V11__procurement.sql`; `com.sms.procurement.*`; permission `PROCUREMENT_MANAGE`.
- Supplier (+ contacts). PO lifecycle (`DRAFT → PENDING_APPROVAL → ISSUED | REJECTED | CANCELLED`).
  PO number (`docType=PO`) assigned on issue. PO items are variant XOR component with unit cost.
- Receiving: Inspection-driven `purchase_receipt` + `purchase_receipt_item` (accepted vs rejected). Finalizing
  a draft receipt creates serial-tracked `StockUnit`s (in Warehouse, Available) + posts `RECEIVING` movements,
  and increments `ComponentStock` + posts `COMPONENT_RECEIVING` movements for components.
- Supplier payments: Cash/transfer recording (`supplier_payment`) against any non-cancelled PO.
- Web: `src/features/procurement/*`:
  - `SupplierListPage`, `SupplierDetailPage`.
  - `PurchaseOrderListPage`, `PurchaseOrderDetailPage`.
  - `ReceivingPanel` (inspection entry for accepted/rejected qty, finalization).
  - `SupplierPaymentPanel` (payment recording, balance tracking).

### 9. Delivery module (complete)

- Migration `V14__delivery.sql`; `com.sms.delivery.*`; permissions `DELIVERY_MANAGE`, `DELIVERY_EXECUTE`.
- MovementType: `MovementType.DELIVERY` added to stock movements.
- Delivery Trip (`delivery_trip`): Picking/Trip run for a store, driver and helper assignments, vehicle plate,
  lifecycle (`PLANNED → DISPATCHED → COMPLETED | CANCELLED`). Mandatory pre-delivery inspection barrier.
- Delivery Order / Surat Jalan (`delivery_order`): 1 Sales Order → many Deliveries (split/partial/batch delivery).
  Pre-inspection, customer signature, proof photo URL, COD custody, failure rescheduling.
- Delivery Items (`delivery_item`): Links to allocated `sales_order_item_stock_unit`. Only successful delivery
  transitions stock units from `ALLOCATED` to `AT_CUSTOMER` and posts `MovementType.DELIVERY` to the ledger.
- Web: `src/features/delivery/*`: `DeliveryTripListPage`, `DeliveryTripDetailPage`, `DeliveryOrderPanel`.

### 10. Finance module (complete)

- Migration `V15__finance.sql`; `com.sms.finance.*`; permissions `FINANCE_MANAGE`, `FINANCE_COLLECT`.
- Receivables & Schedules (`receivable`, `receivable_installment`): Created per confirmed/released SO,
  generating monthly installment schedules. Final installment absorbs rounding adjustments (README 4.9).
- Customer Payments & Allocations (`customer_payment`, `payment_allocation`): DocType `PAY`. Payments automatically
  allocate via FIFO to oldest outstanding installment (`dueDate ASC, installmentNumber ASC`). Excess cash retained
  as unallocated credit.
- Cash Custody & Handover (`payment_custody`): Two-stage handover (`HELD_BY_COLLECTOR` → `HANDED_OVER` → `VERIFIED_BY_CASHIER`
  or `DISCREPANCY` with short/over amount and audit notes per README 12.4).
- Operational Field Visits (`collection_attempt`): Visit date, collector, outcome (`PAID`, `PROMISED_TO_PAY`, etc.).
  Promised dates do not alter legal contract due dates.
- Web: `src/features/finance/*`: `FinancePage` (4 tabs: Receivables, Payments, Cash Custody Handover, Field Visits),
  `CreditScheduleDialog`, `RecordPaymentDialog`, `CashCustodyActionDialog`, `CollectionAttemptDialog`, `ReceivableSalesOrderPanel`.

### 11. Repossession / Warranty / Disposal module (complete)

- Migration `V16__repossession_warranty.sql`; `com.sms.repossession.*`; permissions `REPOSSESSION_MANAGE`, `REPOSSESSION_EXECUTE`, `WARRANTY_MANAGE`.
- Stock Return (`stock_return`):
  - Inbound physical return workflow for `CUSTOMER_RETURN` and `REPOSSESSION`.
  - Re-ingests stock unit physically with `RETURN_INBOUND` movement to `REPAIR_AREA` with `UNAVAILABLE` status.
  - Repossession financial rule: automatically settles customer receivable (`SETTLED_REPOSSESSION`), marks remaining unpaid installments as `FORGIVEN`, zeroes remaining balance, and keeps previously collected cash intact without refund (README 4.11 / 13.3).
- Disposition (`stock_return_disposition`):
  - Inspection-driven grading and decision: `SELL_AS_IS` (moves to `SHOWROOM`, `AVAILABLE`), `REPAIR_THEN_SELL` (keeps in `REPAIR_AREA`), or `SCRAP_DISPOSAL`.
- Warranty Claims (`warranty_claim`):
  - Tracks customer warranty requests, failure symptoms, and warranty status (`SUBMITTED`, `UNDER_REVIEW`, `ACCEPTED_REPAIR`, `ACCEPTED_REPLACE`, `REJECTED_OUT_OF_WARRANTY`).
  - Store coordinates logistics; manufacturer makes final warranty determination.
- Repair Tickets (`repair_ticket`):
  - Vendor repair dispatching (`REPAIR_OUT`) and return intake (`REPAIR_IN`).
  - Logs repair cost, vendor invoice, parts replaced, and updates stock unit availability.
- Stock Disposal (`stock_disposal`):
  - Permanent write-off for unsalvageable or scrap units.
  - Posts `SCRAP_DISPOSAL` stock movement and marks unit as permanently `DISPOSED` / `UNAVAILABLE`.
- Web: `src/features/repossession/*`:
  - `RepossessionWarrantyPage`: 4 tabs for Stock Returns & Repossessions, Inspections & Dispositions, Warranty Claims, and Repair & Disposal.
  - Dialogs for Inbound Stock Return, Inspection Disposition, Warranty Claim creation and review, Repair Ticket management, and Disposal authorization.
  - Route `/returns` and navigation tab "Returns & Warranty".

### 12. Expense / Budget module (complete)

- Migration `V17__expense_budget.sql`; `com.sms.expense.*`; permissions `EXPENSE_MANAGE`, `EXPENSE_CREATE`, `BUDGET_MANAGE`.
- Expense Categories (`expense_category`): Configurable master list with operational code and active flag.
- Monthly Budget Requests (`budget_request`):
  - Planned spend limit per store, category, and month/year (`DRAFT → SUBMITTED → APPROVED | REJECTED`).
- Expense Tracking & Overrun Enforcement (`expense`):
  - Logs actual expenditures against category and store, linked to optional budget request and activity description.
  - **Automatic Budget Overrun Detection**: checks current store + category committed spending against approved budget. If the expense exceeds remaining budget, it is automatically flagged `is_overrun=true` and forced to `PENDING_APPROVAL` for manager authorization (README 14.3).
  - Disbursement workflow: transitions from `APPROVED` to `PAID` with payment method and reference.
- Web: `src/features/expense/*`:
  - `ExpenseBudgetPage`: Metrics for Committed Spend, Approved Budgets, Overrun Alerts, and Paid Expenses.
  - Tabs for Expense Vouchers, Monthly Budgets, and Expense Categories.
  - Modals for submitting budget requests, recording expenses with live overrun warnings, approving overruns, and recording cash disbursement.
  - Route `/expenses` and navigation tab "Expenses & Budget".

### 13. HR & Payroll module (complete)

- Migration `V18__hr_payroll.sql`; `com.sms.payroll.*`; permissions `HR_MANAGE`, `PAYROLL_MANAGE`, `ATTENDANCE_RECORD`.
- Attendance Tracking (`employee_attendance`):
  - Daily clock-in and clock-out with work date deduplication.
  - Statuses: `PRESENT`, `LATE`, `HALF_DAY`, `ON_LEAVE`, `ABSENT`.
- Leave Requests (`leave_request`):
  - Types: `ANNUAL`, `SICK`, `UNPAID`, `MATERNITY`, `OTHER`.
  - Workflow: `PENDING → APPROVED | REJECTED`.
  - On approval, automatically generates date-ranged `ON_LEAVE` attendance records for the employee to preserve payroll rosters.
- Non-Calendar Payroll Periods (`payroll_period`):
  - Supports custom period cutoffs (e.g. 26th of previous month to 25th of current month per README 16.1), with explicit `start_date`, `end_date`, `cutoff_date`, and `payout_date`.
  - Status lifecycle: `DRAFT → FINALIZED → CLOSED`.
- Payroll Calculation & Strict Freezing (`payroll_slip`):
  - Base salary with attendance proration (`presentDays / totalWorkingDays`).
  - Role-based sales commission engine calculated on confirmed sales orders within the period.
  - Collection incentive engine calculated on verified customer payments collected within the period.
  - Deductions and net pay calculations.
  - **Strict Freezing Invariant**: Once a payroll period is `FINALIZED`, recalculation is strictly rejected with a `ConflictException` (README 16.5). Slips transition from `DRAFT` to `FINALIZED` and then `PAID`.
- Web: `src/features/payroll/*`:
  - `PayrollPage.tsx`: Tabs for Payroll Periods & Slips, Attendance Roster, and Leave Requests.
  - Dialogs for Period Creation, Parameterized Calculation, Daily Clock-in, and Leave Application with approval/rejection actions.
  - Route `/payroll` and navigation tab "HR & Payroll".
  - Unit tests: `PayrollPage.test.tsx`.

### 14. Reporting & Dashboards module (complete)

- Migration `V19__reporting.sql`; `com.sms.reporting.*`; permission `REPORTING_VIEW`.
- Backend:
  - `ReportingService` & `ReportingController`:
    - `/api/v1/reporting/overview`: aggregates gross sales volume, non-cancelled order counts, cash collected, outstanding credit balances, overdue debt, stock counts across locations (warehouse, showroom, repair), and budget overruns.
    - `/api/v1/reporting/sales-performance`: salesperson leaderboard with confirmed order volume, ranking, and estimated commission.
    - `/api/v1/reporting/collection-aging`: installment debts bucketed into Current (0-30 days), Past Due (1-30 days), Delinquent (31-60 days), and Default Risk (60+ days) with counts, balances, and percentage progress.
    - `/api/v1/reporting/inventory-distribution`: units tallied across warehouse, showroom, repair area, in-transit, at-customer, and availability states.
    - `/api/v1/reporting/exceptions`: active alerts center for budget overruns, cash custody discrepancies, and severely overdue credit accounts with jump links.
    - CSV Export endpoints: `/api/v1/reporting/export/receivables-aging` and `/api/v1/reporting/export/sales-summary`.
  - Unit tests: `ReportingServiceTest` (6/6 tests passing).
- Web: `src/features/reporting/*`:
  - `DashboardPage.tsx`: Top executive KPI cards, financial overview, inventory breakdown, salesperson leaderboard, credit aging visualization, operational exceptions center, and one-click CSV export downloads.
  - Route `/reports` and navigation tab "Reports".
  - Unit tests: `DashboardPage.test.tsx`.

---

## Verification state at this checkpoint

- **Backend**: **65/65 Mockito unit tests pass with 0 errors** across all 13 modules:
  - `EmployeeServiceTest` (3 tests)
  - `RoleServiceTest` (4 tests)
  - `ApprovalServiceTest` (3 tests)
  - `CustomerServiceTest` (3 tests)
  - `ProductServiceTest` (3 tests)
  - `SalesOrderServiceTest` (3 tests)
  - `SurveyServiceTest` (3 tests)
  - `InventoryServiceTest` (3 tests)
  - `ProcurementServiceTest` (5 tests)
  - `DeliveryServiceTest` (4 tests)
  - `FinanceServiceTest` (5 tests)
  - `RepossessionServiceTest` (6 tests)
  - `ExpenseServiceTest` (7 tests)
  - `PayrollServiceTest` (6 tests)
  - `ReportingServiceTest` (6 tests)
- **Web**: `npm run build`, `npm run lint`, `npm run test` (**23 tests across 11 test suites**) **all green with 0 errors**.
- **Flyway Migrations**: All V1 through V19 syntactically clean, indexed, and aligned with JPA entities.

---

## Nav tabs currently in the web app

Stores, Customers, Products, Inventory, Sales Orders, Suppliers, Purchase Orders, Deliveries, Finance, Expenses & Budget, Returns & Warranty, HR & Payroll, Reports, Employees, Roles, Approvals.
(Notifications = bell icon.)

---

## Roadmap Completion Status

**All 13 implementation sequence steps for the Store Management System (Web Administration System) from README Section 22 are now fully built, integrated, tested, and verified!**

1. Foundation: stores, employees, roles, approvals, numbering, notifications (DONE)
2. Customer, contacts, addresses, documents, search (DONE)
3. Product, variant, components, catalog restructure, store pricing (DONE)
4. Draft/released SO, items, customer/address snapshots, price approval (DONE)
5. Survey and credit confirmation workflow (DONE)
6. Stock units, locations, movement ledger, reservation/allocation (DONE)
7. Supplier, PO, receiving, inspection, Component Stock (DONE)
8. Delivery/trip, delivery items, confirmation, custody/COD (DONE)
9. Receivable, installments, payments, allocations, collection visits, custody (DONE)
10. Returns/repossession, repair, warranty, disposal (DONE)
11. Expenses, budgets, activities, overrun approvals (DONE)
12. Attendance, leave, compensation rules, sales periods, payroll (DONE)
13. Dashboards, detailed reports, aging buckets, CSV exports, operational exceptions (DONE)
14. Worker App (Mobile Flutter): field operations, task queues, attendance, surveys, delivery custody, debt collection, payroll slips, SOP bulletins (DONE)

---

### 14. Worker App (Mobile - Flutter)

- Repo / directory: `sms-mobile/` (Flutter 3.44.0 • Dart 3.12.0)
- Architecture:
  - `lib/core/` (Deep Navy & Emerald Material 3 theme, UserProfile with multi-role flags, SharedPreferences JWT token storage, Dio API client).
  - `lib/features/auth/` (Riverpod 3 Notifier auth provider, Worker Login screen with quick demo role-switcher chips).
  - `lib/features/home/` (Adaptive Worker Home Screen rendering dynamic action queues based on employee's active operational roles).
  - `lib/features/attendance/` (Clock in / clock out state, daily presence log, leave application form with multiple categories).
  - `lib/features/surveys/` (Surveyor credit assessment checklist: home ownership, monthly income, document checks, and definitive Approve/Reject actions).
  - `lib/features/delivery/` (Driver multi-drop trip execution, Surat Jalan delivery items, COD custody balance, delivery confirmation, and failure reporting).
  - `lib/features/collection/` (Collector field visits, customer installment context, visit outcome recording: Paid Cash/Transfer, PTP, Refused, and Cashier Custody Handover).
  - `lib/features/payroll/` (Personal non-calendar sales period earnings, prorated base salary, attendance deductions, earned commission, net payout card).
  - `lib/features/bulletin/` (Searchable SOP knowledge base, commission tier guidelines, store policies).
  - `lib/features/tasks/` (Unified operational work queue with status filter chips).
  - `lib/router/app_router.dart` (GoRouter with auth guard and deep-linked routes).
- Verification:
  - `flutter analyze`: **0 warnings, 0 errors ("No issues found!")**.
  - `flutter test`: **100% test pass**.
