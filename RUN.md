# Store Management System (SMS) — Run & Orchestration Guide

> Guide for spinning up the full SMS retail and money management ecosystem (Backend, Management Web, E-commerce Web, and Mobile Apps) with dedicated, conflict-free port allocations.

---

## 1. Network Topology & Port Allocation Matrix

All services run on distinct, non-overlapping ports so they can run concurrently without collisions:

| Component | Technology | Local Dev Port | Docker Compose Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Database Engine** | Supabase Postgres / PostGIS 16 | `5432` | `5432` (or Supabase Pooler `6543`) | 87 tables. Cloud Supabase or Local Docker Postgres clone |
| **Redis** | Redis 7 Alpine | `6379` | `6379` | Atomic sequence counters & cache |
| **Core Backend** | Spring Boot 4.1 / Java 21 | `8080` | `8080` | Authoritative REST & WebSocket API |
| **Management Web SPA** | React 19 / Vite / MUI | `5173` | `3000` | Administrative & showroom operations |
| **E-Commerce Web** | React 19 / Vite / Tailwind | `5174` | `3001` | Customer storefront & product catalog |
| **Worker Mobile App** | Flutter 3.44 | N/A (Device/Emulator) | N/A | Driver logistics & warehouse scanner |
| **E-Commerce Mobile App**| Flutter 3.44 | N/A (Device/Emulator) | N/A | Customer mobile shopping experience |

---

## 2. Database Options: Supabase (Cloud) vs Local Postgres (Docker)

Supabase **is** Postgres under the hood. You can run SMS against either:

### Option A: Live Supabase Project (Cloud)
Set these variables in your root `.env` or `core-backend/.env`:
```properties
SUPABASE_DB_URL=jdbc:postgresql://aws-0-<REGION>.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0
SUPABASE_DB_USER=postgres.<PROJECT_REF>
SUPABASE_DB_PASSWORD=<YOUR_SUPABASE_DB_PASSWORD>
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_JWKS_URI=https://<PROJECT_REF>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>
```
*Note: In this mode, skip starting the local `postgres` Docker container! Spring Boot talks directly to your Supabase PostgreSQL cluster, Auth, and Storage.*

### Option B: Local Postgres Container (Offline Development)
If developing offline without cloud Supabase credentials:
- Run `docker compose up postgres redis -d`.
- Local `postgis/postgis:16-3.4-alpine` acts as a local drop-in replica of Supabase's PostgreSQL engine.
- Default connection: `jdbc:postgresql://localhost:5432/sms`, User: `postgres`, Password: `postgres`.

---

## 3. Prerequisites

Ensure your host machine has the following tools installed:
- **Docker & Docker Compose** (Docker Desktop or Linux Docker Engine)
- **Java 21 JDK** (Eclipse Temurin / Amazon Corretto recommended)
- **Node.js 20+ & npm 10+**
- **Flutter SDK 3.27+** (Optional, only needed for mobile apps)

---

## 3. Quick Run: Docker Compose (All-in-One)

The fastest way to spin up the entire multi-tier system with database, cache, backend, and both web frontends:

```bash
# 1. Clone or navigate to the project root
cd C:\D\Project\SMS

# 2. Build images and start all containers in background
docker compose up --build -d

# 3. Check health and status of containers
docker compose ps
```

### Access URLs:
- **Management Web SPA**: [http://localhost:3000](http://localhost:3000)
- **E-Commerce Storefront**: [http://localhost:3001](http://localhost:3001)
- **Core Backend API Docs (Swagger)**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Backend Actuator Health**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

To stop the containers:
```bash
docker compose down
```

---

## 4. Development Run: Individual Local Services

For active coding with Hot Module Replacement (HMR) and fast compilation:

### Step 1: Start Database & Cache Containers
Spin up only the database and Redis instances:
```bash
docker compose up postgres redis -d
```

### Step 2: Run Core Backend (Spring Boot — Port 8080)
Open a terminal:
```bash
cd core-backend

# Windows (PowerShell/CMD)
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```
*Backend initializes Flyway schema migrations, connects to PostgreSQL and Redis, and listens on `http://localhost:8080`.*

### Step 3: Run Management Web SPA (React 19 / Vite — Port 5173)
Open a second terminal:
```bash
cd sms-web

# Install dependencies if first time
npm install

# Start Vite dev server on dedicated port 5173
npm run dev
```
*Access Management Web at `http://localhost:5173`.*

### Step 4: Run E-Commerce Web Storefront (React 19 / Vite — Port 5174)
Open a third terminal:
```bash
cd ecommerce-web

# Install dependencies if first time
npm install

# Start Vite storefront dev server on dedicated port 5174
npm run dev
```
*Access Storefront at `http://localhost:5174` (API requests automatically proxy to `http://localhost:8080`).*

### Step 5: (Optional) Run Mobile Applications (Flutter)
Open a terminal in either mobile application folder:
```bash
# For Worker App (Logistics & Warehouse)
cd workerapp-mobile
flutter pub get
flutter run

# For E-commerce App (Customer Store)
cd ecommerce-mobile
flutter pub get
flutter run
```
*Note: When testing on Android Emulator, target the backend via `http://10.0.2.2:8080` instead of `localhost`.*

---

## 5. Verification & Healthchecks

Once running, verify each tier:

1. **Backend Health Check**:
   ```bash
   curl http://localhost:8080/actuator/health
   # Expected response: {"status":"UP"}
   ```
2. **OpenAPI / Swagger UI**:
   Open [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) in your browser to inspect and test all 87+ REST endpoints.
3. **Management SPA**:
   Open [http://localhost:5173](http://localhost:5173) (Local Dev) or [http://localhost:3000](http://localhost:3000) (Docker).
4. **E-Commerce Storefront**:
   Open [http://localhost:5174](http://localhost:5174) (Local Dev) or [http://localhost:3001](http://localhost:3001) (Docker).

---

## 6. Troubleshooting & FAQs

### Port Already in Use (e.g., 8080, 5173, 5174)
- **Windows**:
  ```powershell
  # Check which process holds the port
  netstat -ano | findstr :8080
  # Terminate process by PID
  taskkill /PID <PID> /F
  ```
- **Linux/macOS**:
  ```bash
  lsof -i :8080
  kill -9 <PID>
  ```

### Database Authentication Error
Ensure your `.env` or application configuration matches the default credentials:
- Username: `postgres`
- Password: `postgres`
- Database: `sms`
- Host: `localhost` (or `postgres` inside Docker)
