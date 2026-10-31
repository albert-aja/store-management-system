# Store Management System (SMS) — Enterprise Infrastructure & Environment Setup Guide

> **Document Version**: 1.0.0  
> **Target Audience**: DevOps Engineers, SREs, Backend & Mobile Developers  
> **Status**: Verified & Operational  
> **Backlog Reference**: `[A.1]` to `[A.5]`

---

## 1. System Topology Overview

The Store Management System (SMS) operates as an integrated omnichannel retail and money management ecosystem anchored by a single authoritative Spring Boot modular monolith and shared relational database:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT APPLICATION LAYER                                │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────┐ ┌─────────────┐ │
│  │ Management Web SPA   │  │ E-commerce Web       │  │ Worker Mobile │ │ E-comm App  │ │
│  │ (React 19 / MUI)     │  │ (React 19 Storefront)│  │ (Flutter 3.44)│ │ (Flutter)   │ │
│  └──────────┬───────────┘  └──────────┬───────────┘  └───────┬───────┘ └──────┬──────┘ │
└─────────────┼─────────────────────────┼──────────────────────┼────────────────┼────────┘
              │                         │                      │                │
              ▼                         ▼                      ▼                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                AUTHORITATIVE BACKEND ENGINE (Spring Boot 4.1 / Java 21)                │
│  - REST API (/api/v1/* & /api/v1/storefront/*)                                         │
│  - Spring Security OAuth2 Resource Server (Supabase JWKS validation)                  │
│  - Transactional Outbox Event Engine                                                  │
│  - WebSocket STOMP Live Fleet GPS Streaming                                            │
└──────────────────────────────┬─────────────────────────┬───────────────────────────────┘
                               │                         │
                               ▼                         ▼
┌──────────────────────────────────────────┐  ┌──────────────────────────────────────────┐
│   PostgreSQL 16 + PostGIS Spatial DB     │  │   Redis 7 In-Memory Persistence Engine   │
│   - Flyway Schema Migrations (V1 to V28) │  │   - Atomic Sequence Counters (DOC_SEQ:*) │
│   - Connection Pooler (PgBouncer/Supavisor│ │   - AOF Persistence (everysec)           │
│   - 87 Canonical Domain Tables           │  │   - Short-Lived Query Cache & GPS Hash   │
└──────────────────────────────────────────┘  └──────────────────────────────────────────┘
```

---

## 2. Live Supabase Project Provisioning (`[A.1]`)

### 2.1 Database Connection Configuration

Supabase provides both session pooling and transaction pooling. For high-concurrency Spring Boot Hikari connection pools, connect via the **Transaction Pooler** (Port `6543`) to prevent socket exhaustion:

- **JDBC Connection URL**:
  ```properties
  SUPABASE_DB_URL=jdbc:postgresql://aws-0-<REGION>.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0
  SUPABASE_DB_USER=postgres.<PROJECT_REF>
  SUPABASE_DB_PASSWORD=<YOUR_STRONG_DATABASE_PASSWORD>
  ```
  _(Note: `prepareThreshold=0` is required when routing through PgBouncer / Supavisor transaction poolers)._

### 2.2 Supabase Auth & JWT Resource Server

Configure Spring Security to validate Supabase user JWT tokens via the Supabase JWKS endpoint:

- **JWKS Endpoint**: `https://<PROJECT_REF>.supabase.co/auth/v1/.well-known/jwks.json`
- **Supabase URL**: `https://<PROJECT_REF>.supabase.co`
- **Service Role Key**: Secret key injected securely into backend runtime (`SUPABASE_SERVICE_ROLE_KEY`).

### 2.3 Storage Buckets & Row-Level Security (RLS) Setup

Execute the provision script `core-backend/src/main/resources/db/supabase/supabase_storage_and_rls_setup.sql` in the Supabase SQL Editor:

1. `sms-documents`: Private bucket (50 MB limit) for generated Invoices, Surat Jalan Delivery Notes, Purchase Orders, and Payslips.
2. `sms-photos`: Private bucket (20 MB limit) for field survey photos, GPS-watermarked delivery proof photos, and repossession condition photos.
3. `sms-signatures`: Private bucket (5 MB limit) for delivery touch signatures and contract sign-offs.

---

## 3. High-Concurrency Production Redis Setup (`[A.2]`)

Redis is utilized for:

1. **Atomic Document Number Counters**: Generates zero-collision monotonically increasing document numbers (`DOC_SEQ:SO:`, `DOC_SEQ:PO:`, `DOC_SEQ:SJ:`, `DOC_SEQ:PY:`).
2. **Short-Lived Query Cache**: Caching storefront product taxonomies, store prices, and customer session carts.
3. **Real-time Fleet GPS Latest Coordinates**: Redis hash storing the latest coordinates of mobile field workers (`FLEET:LATEST_LOCATION:{employeeId}`).

### 3.1 Durability & Persistence Configuration

To ensure sequence numbers are never lost during host restarts or power events, Redis **must** be deployed with AOF (Append-Only File) enabled:

```properties
# core-backend/src/main/resources/redis/redis.conf
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
maxmemory 536870912
maxmemory-policy volatile-lru
requirepass <YOUR_SECURE_REDIS_PASSWORD>
```

---

## 4. Flyway Database Migrations Execution & Verification (`[A.3]`)

The database schema is strictly managed by **28 contiguous Flyway migrations** (`V1` to `V28`) spanning 87 domain tables:

| Migration File                            | Domain / Module             | Key Tables Provisioned                                               |
| ----------------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| `V1__foundation_schema.sql`               | Organizational Foundation   | `store`, `employee`, `role`, `permission`, `role_permission`         |
| `V2__approval_engine.sql`                 | Workflow Engine             | `approval_workflow`, `approval_request`, `approval_request_step`     |
| `V3__document_notification.sql`           | Notifications & Documents   | `document_record`, `notification`, `notification_recipient`          |
| `V4__seed_roles.sql`                      | RBAC Initial Seed           | Seed 10 enterprise roles and permissions                             |
| `V5__customer.sql`                        | Customer Directory          | `customer`, `customer_contact`, `customer_address`                   |
| `V6__product.sql`                         | Product Catalog             | `product`, `product_variant`, `product_component`                    |
| `V7__pricing.sql`                         | Store Pricing Matrices      | `store_product_price`, `store_product_payment_plan`                  |
| `V8__sales_order.sql`                     | Sales Orders                | `sales_order`, `sales_order_item`                                    |
| `V9__survey.sql`                          | Credit Surveys              | `survey`                                                             |
| `V10__inventory.sql`                      | Physical Inventory          | `component_stock`, `stock_unit`, `stock_movement`                    |
| `V11__procurement.sql`                    | Supplier Purchasing         | `supplier`, `purchase_order`, `purchase_order_item`                  |
| `V12__product_catalog_restructure.sql`    | Master Taxonomies           | `product_type`, `product_category`, `product_brand`                  |
| `V13__procurement_receiving_payments.sql` | Inbound PO Receiving        | `purchase_receipt`, `supplier_payment`                               |
| `V14__delivery.sql`                       | Fulfillment & Surat Jalan   | `delivery_trip`, `delivery_order`, `delivery_item`                   |
| `V15__finance.sql`                        | Money Management & Credit   | `receivable`, `receivable_installment`, `payment_custody`            |
| `V16__repossession_warranty.sql`          | Repossessions & Warranty    | `stock_return`, `warranty_claim`, `repair_ticket`                    |
| `V17__expense_budget.sql`                 | Budget & Operational Costs  | `expense_category`, `budget_request`, `expense`                      |
| `V18__hr_payroll.sql`                     | Attendance & Cutoff Payroll | `employee_attendance`, `leave_request`, `payroll_slip`               |
| `V19__reporting.sql`                      | Analytics Views             | Analytical reporting structures                                      |
| `V20__security_audit_log.sql`             | Enterprise Audit            | `security_audit_log`                                                 |
| `V21__mobile_stocktake.sql`               | Warehouse Mobile Audit      | `stocktake_session`, `stocktake_count_line`                          |
| `V22__customer_360_crm.sql`               | CRM & Customer 360          | `customer_interaction`, `customer_promise_to_pay`, `store_voucher`   |
| `V23__survey_location_profiling.sql`      | Delivery Geocoding          | Destination GPS coordinates & access constraints                     |
| `V24__logistics_and_fleet_management.sql` | Fleet & GPS Telemetry       | `vehicle`, `break_schedule`, `tracking_session`, `tracking_location` |
| `V25__storefront_ecommerce.sql`           | Omnichannel Storefront      | `fulfillment_group`, `storefront_customer`, `customer_cart`          |
| `V26__storefront_push_notifications.sql`  | Push Notification Hub       | `customer_device_token`, `storefront_push_notification_log`          |
| `V27__fleet_maintenance_reminders.sql`    | Fleet Preventative Alerts   | `fleet_maintenance_alert`                                            |
| `V28__storefront_pickup_staging.sql`      | Store Pickup Staging        | Pickup rack locations, passcodes, handover verification audit        |

### 4.1 Verification Commands

Run the automated verification script:

```powershell
powershell -ExecutionPolicy Bypass -File core-backend\scripts\verify_migrations.ps1
```

Or execute through Maven test validation:

```powershell
cd core-backend
.\mvnw.cmd test -Dtest="FlywayMigrationValidationTest"
```

---

## 5. Docker Orchestration & Multi-Service Containers (`[A.4]`)

### 5.1 Local & Staging Docker Compose Stack

The root `docker-compose.yml` spins up the entire integrated ecosystem:

```bash
# Start infrastructure and all micro-frontends
docker compose up -d
```

Services exposed:

- **PostgreSQL 16 + PostGIS**: `localhost:5432`
- **Redis 7**: `localhost:6379`
- **SMS Authoritative Backend**: `http://localhost:8080` (OpenAPI Swagger: `http://localhost:8080/swagger-ui.html`)
- **SMS Management Web SPA**: `http://localhost:3000`
- **SMS E-commerce Storefront**: `http://localhost:3001`

### 5.2 Testcontainers Automated Integration Testing

The backend test suite (`InfrastructureIntegrationTest.java`) automatically leverages Testcontainers when Docker is active:

- Dynamically provisions ephemeral `postgres:16-alpine` and `redis:7-alpine` containers.
- Automatically executes all 28 Flyway migrations on the dynamic database.
- Gracefully skips container execution if the local Docker daemon is not active (`@Testcontainers(disabledWithoutDocker = true)`), guaranteeing reliable unit test runs across all environments.

---

## 6. Environment Configuration Files Directory (`[A.5]`)

| Configuration File                                     | Scope & Target             | Purpose                                                                                           |
| ------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------- |
| `.env.example`                                         | Root Project               | Orchestrates Docker Compose environment (PostgreSQL, Redis, Supabase, Backend, Frontends)         |
| `core-backend/.env.example`                            | Backend Spring Boot        | Configures Spring DataSource, Supabase JWKS, Redis credentials, and Hikari pooling                |
| `core-backend/src/main/resources/application-prod.yml` | Backend Production Profile | Production properties: batch JDBC inserts, SQL formatting off, HTTP compression, security filters |
| `sms-web/.env.example`                                 | Management Web SPA         | Configures Vite API base URL, WebSocket STOMP endpoint, and Supabase client                       |
| `ecommerce-web/.env.example`                           | E-commerce Storefront      | Configures Storefront REST API base URL and Supabase customer session client                      |
| `workerapp-mobile/.env.example`                        | Worker Mobile App          | Configures Dio API base URL (10.0.2.2 for Android emulator) and GPS telemetry parameters          |
| `ecommerce-mobile/.env.example`                        | Customer Mobile App        | Configures Storefront REST API endpoint and Firebase Cloud Messaging sender ID                    |

## 7. E-commerce Google Login and Email OTP

Both storefront clients use Supabase Auth with persistent, automatically refreshed sessions.
Google and email OTP create accounts on first sign-in; passwords are not required.
The backend validates the JWT issuer, signature and expiry and checks Supabase's
`/auth/v1/user` response for a confirmed email before linking a storefront profile.
Customer identity comes from the verified subject, not `X-Customer-ID` or browser storage.
Existing unlinked storefront accounts are linked only after their email is verified.
Inactive accounts cannot sign in. Staff authentication remains separate.

### 7.1 Supabase and Google configuration

1. In Supabase Authentication, enable Email and allow new user signups.
2. Edit the **Magic Link** and **Confirm signup** email templates to deliver the numeric OTP, for example:
   `<p>Your SMS Mart login code is: {{ .Token }}</p>`.
   Do not use a magic-link-only template. Configure OTP expiry and rate limits.
   Both apps accept 6–10 digit codes and enforce a 60-second resend cooldown.
3. Configure production SMTP so real customers can receive codes, not just project team members.
4. Create a Google Cloud **Web application** OAuth client. Set its authorized redirect URI to
   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`.
5. Enable Google in Supabase Authentication Providers and enter that client ID and secret there.
   Never put the Google secret or Supabase service-role key in either storefront client.
6. Set Supabase's Site URL to your storefront domain. Add exact allowed redirect URLs:
   - `http://localhost:5174/auth` for Vite development.
   - `http://localhost:3001/auth` for the Docker storefront.
   - `https://<YOUR_STOREFRONT_DOMAIN>/auth` for production.
   - `com.sms.mart://login-callback/` for Android and iOS.
   - Your Flutter web origin, if running the mobile app on web.
7. Use a Supabase asymmetric JWT signing key supported by the JWKS endpoint (RS256 or ES256).
   Legacy HS256 tokens cannot be validated using the public JWKS endpoint.

### 7.2 Runtime configuration

Backend environment:

```properties
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_JWKS_URI=https://<PROJECT_REF>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_PUBLISHABLE_KEY=<PUBLIC_PUBLISHABLE_OR_ANON_KEY>
```

The URL must have no trailing slash. Apply Flyway migration V33 before enabling login.
The backend can fall back to its existing service-role key when no publishable key is configured;
that key remains backend-only.

For Vite development, supply these in a local environment file or shell:

```properties
VITE_API_BASE_URL=http://localhost:8080/api/v1/storefront
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<PUBLIC_PUBLISHABLE_OR_ANON_KEY>
```

Vite embeds these values at build time. Root Docker Compose passes them as build arguments;
rebuild the storefront image after changing them: `docker compose up -d --build ecommerce-web`.
The public key is intended for client use. No secret keys belong in build arguments.

Flutter does not load environment files automatically. Run with:

```powershell
flutter run --dart-define=SUPABASE_URL=https://<PROJECT_REF>.supabase.co --dart-define=SUPABASE_PUBLISHABLE_KEY=<PUBLIC_PUBLISHABLE_OR_ANON_KEY> --dart-define=API_BASE_URL=http://10.0.2.2:8080/api/v1/storefront
```

Use your HTTPS backend URL for physical devices and release builds. Android and iOS callback
schemes are registered in the app. On Windows, Flutter plugins require Developer Mode for
symlinks. Missing auth configuration leaves guest shopping available and shows an explicit
configuration error when login is attempted.

### 7.3 API and verification

- `POST /api/v1/storefront/auth/session` requires a Supabase Bearer token and returns
  `{ customerId, email, fullName, phone }` (`phone` may be null).
- `GET /api/v1/storefront/auth/profile/{customerId}` only returns the signed-in customer's profile.
- Mock password `/auth/register` and `/auth/login` endpoints have been removed.
- Account wishlist operations and guest-to-account sync use verified identity. Guest wishlist
  operations still use `X-Session-ID`. Logout clears client identity and starts a fresh guest session.
- Never simulate successful login when Supabase or the backend is unavailable.

Before production, test real OTP delivery, wrong/expired/reused codes, Google consent/cancellation,
web callback reload, Android/iOS deep-link return, app restart, token refresh and logout.
Provider setup, real email delivery and device callbacks require a configured Supabase project
and cannot be verified by unit tests alone.
