# PulseUp

[![CI](https://github.com/pulse-up/deployed-pulseup/actions/workflows/ci.yml/badge.svg)](https://github.com/pulse-up/deployed-pulseup/actions/workflows/ci.yml)

**A digital campus-clinic platform for appointment booking, queue visibility, clinical support, and student wellness rewards.**

PulseUp connects CPUT students with campus clinic staff through one responsive web application. Students can book clinic visits, track appointment changes, request signed clinic letters, and monitor Health Points. Clinic staff manage availability and assigned consultations. Administrators manage users, appointments, time slots, and operational records.

> PulseUp is a campus healthcare coordination tool. It is not an emergency service and does not replace professional medical advice, diagnosis, or treatment.

## Why PulseUp?

Campus clinics often depend on physical queues and fragmented appointment communication. PulseUp provides a structured digital workflow that helps:

- Students find available clinic services without joining an early physical queue.
- Clinic staff publish availability and manage assigned bookings.
- Students and staff see appointment status changes from the same source of truth.
- Clinic teams issue auditable sick-note and optional referral records after completed consultations.
- Administrators monitor users, schedules, appointment outcomes, and clinic activity.

## Features

### Student experience

- Register with a CPUT student email and academic profile.
- Sign in through a secure role-aware authentication flow.
- Browse available clinic time slots by consultation type.
- Book, reschedule, or cancel eligible appointments.
- View active bookings, historical consultations, and queue information.
- Filter consultation history by status, service, and date range.
- Receive dashboard notifications for bookings, status changes, and reminders.
- Update personal, academic, residence, and emergency-contact information.
- Upload, replace, or remove a profile image.
- Change a password while signed in.
- Recover a forgotten password by matching registered student details.
- Request a sick note from a previous completed consultation.
- Optionally request a hospital referral with explicit consent.
- Download or print a clinic-staff-signed PDF when a letter is approved.
- Earn Health Points from completed consultations.
- Track food-voucher progress and issued voucher records.

### Clinic staff experience

- Access a dedicated clinical dashboard.
- View the staff profile, department, position, specialization, and availability.
- Upload or remove a profile image.
- Publish clinic time slots for the staff member's assigned service.
- View available and booked slots.
- Review bookings assigned through the staff member's schedule.
- Confirm consultations and mark eligible appointments as completed or no-show.
- Review sick-note requests linked to assigned completed consultations.
- Approve or reject clinic-letter requests with a required clinical comment.
- Add minimum necessary referral information when a student requests further care.
- Add an electronic signature and sign-off timestamp to approved letters.

### Administrator experience

- View live operational summaries for users, appointments, clinicians, and slots.
- Search and filter a unified student, staff, and administrator directory.
- Open complete account details only when a user is selected.
- Create clinic staff accounts inside the Admin dashboard.
- Filter appointments by consultation type, status period, and date range.
- Manage appointment status, cancellations, no-shows, and eligible deletions.
- Filter time slots by availability and schedule period.
- View time slots grouped by date and ordered by start time.
- Open or close eligible slots and remove unused availability.
- Monitor sick-note and referral records while clinical sign-off remains staff-only.

### Public website

- Full-width healthcare landing page and responsive navigation.
- CPUT campus-clinic information for Bellville, District Six, Mowbray, and Wellington.
- Service descriptions, opening-hour information, and emergency guidance.
- Pulsy, a draggable navigation and information assistant.
- Student registration and shared sign-in entry points.

## Core workflows

### Appointment lifecycle

```text
Staff publishes a slot
        ↓
Student books the slot
        ↓
Appointment becomes PENDING
        ↓
Assigned staff confirms the appointment
        ↓
Student receives queue and schedule information
        ↓
Staff records COMPLETED or NO_SHOW
        ↓
A completed visit awards Health Points once
```

Students can cancel eligible appointments or move them to another compatible open slot. Slot reservation uses an atomic conditional database update so only one request can claim an available slot.

### Sick note and optional referral

```text
Completed consultation
        ↓
Student submits a sick-note request
        ↓
Optional referral reason and consent
        ↓
Assigned clinic staff reviews the request
        ↓
Staff adds clinical information and signs
        ↓
Student downloads or prints the PDF letter
```

The referral workflow does not guarantee admission, transport, payment, treatment, or an appointment at another facility.

### Health Points and vouchers

A completed appointment creates a persisted Health Point transaction. Duplicate awards are prevented at the appointment level. The application tracks reward progress, eligible voucher tiers, generated voucher codes, issue dates, statuses, and expiry dates.

## Architecture

```text
Browser
  │
  ▼
React + Vite single-page application
  │  HTTPS / JSON / Bearer JWT
  ▼
Spring Boot REST API
  │  Spring Data JPA / Hibernate
  ▼
MySQL locally or TiDB Cloud in production
```

The frontend never connects directly to the database. Spring Security and backend service rules are the authoritative access-control layer.

## Technology stack

### Frontend

| Technology | Purpose |
| --- | --- |
| React 19 | Component-based user interface |
| Vite 8 | Development server and production bundling |
| React Router 7 | SPA routing and role dashboard navigation |
| Axios | REST API requests and Bearer-token handling |
| CSS | Responsive layouts and the PulseUp design system |
| Node.js 22 | Supported frontend build runtime |

### Backend

| Technology | Purpose |
| --- | --- |
| Java 21 | Backend language and runtime |
| Spring Boot 4.0.6 | API application framework |
| Spring Web MVC | REST controllers and JSON APIs |
| Spring Security | Authentication and role authorization |
| OAuth2 Resource Server | JWT validation |
| Spring Data JPA | Repository and persistence abstraction |
| Hibernate | Object-relational mapping |
| BCrypt | Password hashing |
| Maven | Dependency management, tests, and packaging |
| MySQL Connector/J | MySQL-compatible JDBC connectivity |

### Data and deployment

| Technology | Purpose |
| --- | --- |
| MySQL | Local development database |
| TiDB Cloud | MySQL-compatible production database target |
| Docker | Reproducible Java 21 backend image |
| Render | Spring Boot API deployment target |
| Vercel | Vite frontend deployment target |
| GitHub | Source control and deployment integration |

## Security and privacy

PulseUp includes:

- BCrypt password hashes. Plaintext passwords are never persisted.
- Stateless HS256 JWT authentication.
- A required Base64 signing key of at least 32 decoded bytes.
- Role-specific authorization for Student, Staff, and Admin APIs.
- A default-deny Spring Security policy.
- Database-backed account activation and token-version validation.
- Immediate JWT invalidation after password changes or account deactivation.
- Resource ownership checks for student bookings, staff schedules, and clinical reviews.
- Exact production CORS origin configuration.
- Input validation and status-transition allowlists.
- Atomic conditional time-slot reservation for booking and rescheduling.
- Five-megabyte profile-image limits, image decoding, square resizing, and metadata-removing re-encoding.
- Authenticated profile-image retrieval with no-store caching.
- Minimum-necessary fields in generated clinic letters.
- Production error responses that suppress internal binding and server details.

Forgot-password recovery currently verifies registered account details directly. It does not send an email or SMS recovery code. For higher-risk production use, replace this workflow with an expiring, single-use token delivered through a verified institutional channel.

## Project structure

```text
.
├── frontend/                         React + Vite SPA
│   ├── public/                       Static images and icons
│   ├── src/
│   │   ├── app/                      Routes and route guards
│   │   ├── components/               Shared and role-specific UI
│   │   ├── lib/                      API, configuration, hooks, utilities
│   │   ├── pages/                    Public, auth, student, staff, admin pages
│   │   └── styles/                   Design system and responsive CSS
│   ├── vercel.json                   Vercel build and SPA routing
│   └── package.json
├── PulseUp-Backend/
│   └── PulseUp2026/                  Spring Boot API
│       ├── src/main/java/.../
│       │   ├── config/               Security, CORS, JWT, bootstrap
│       │   ├── controller/           REST endpoints
│       │   ├── domain/               JPA entities and enums
│       │   ├── factory/              Domain construction
│       │   ├── repository/           Spring Data repositories
│       │   ├── request/              Request contracts
│       │   ├── response/             Response contracts
│       │   ├── service/              Business rules and transactions
│       │   └── util/                 Shared backend utilities
│       ├── Seeding/                  Local seed and security checks
│       ├── Dockerfile                Render-ready Java 21 image
│       └── pom.xml
├── Dockerfile                        Render-compatible root build entry
├── .dockerignore                     Root Docker build exclusions
├── render.yaml                       Render Blueprint
└── DEPLOYMENT.md                     TiDB, Render, and Vercel guide
```

## Local development

### Prerequisites

- Node.js 22.x
- npm
- Java 21
- MySQL 8 or a compatible server
- Git

### 1. Create the local database

Create an empty database named `pulseup`:

```sql
CREATE DATABASE pulseup;
```

### 2. Configure the backend

The backend reads configuration from environment variables. Generate a JWT secret in PowerShell:

```powershell
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Set the environment for the current terminal:

```powershell
$env:PULSEUP_DB_URL="jdbc:mysql://localhost:3306/pulseup?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=Africa/Johannesburg"
$env:PULSEUP_DB_USERNAME="root"
$env:PULSEUP_DB_PASSWORD="YOUR_LOCAL_MYSQL_PASSWORD"
$env:PULSEUP_JWT_SECRET="YOUR_GENERATED_BASE64_SECRET"
$env:PULSEUP_FRONTEND_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
```

Start the API from `PulseUp-Backend/PulseUp2026`:

```powershell
.\mvnw.cmd spring-boot:run
```

The API runs at `http://localhost:8080`. Its database-aware health endpoint is:

```text
http://localhost:8080/api/health
```

### 3. Configure and run the frontend

From `frontend`:

```powershell
npm ci
npm run dev
```

Vite serves the application at `http://localhost:5173` and proxies `/api` to Spring Boot.

`frontend/.env.example` documents the optional API override:

```properties
VITE_API_BASE_URL=/api
```

Never put secrets in a `VITE_` variable. Vite exposes those values to the browser.

### 4. Create local accounts and seed data

The first administrator can be created once through the optional startup bootstrap. Clinic staff accounts are then created by that administrator from the Admin dashboard.

See [`PulseUp-Backend/PulseUp2026/Seeding/README.md`](PulseUp-Backend/PulseUp2026/Seeding/README.md) for the clean local reset, private IntelliJ environment, bootstrap, API seeding, and security-check workflow.

Do not run the local reset SQL against production.

## Environment variables

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `PULSEUP_DB_URL` | Production | MySQL/TiDB JDBC URL |
| `PULSEUP_DB_USERNAME` | Production | Database username |
| `PULSEUP_DB_PASSWORD` | Production | Database password |
| `PULSEUP_JWT_SECRET` | Yes | Base64 JWT signing key |
| `PULSEUP_FRONTEND_ORIGINS` | Production | Comma-separated trusted frontend origins |
| `PULSEUP_DDL_AUTO` | No | Hibernate schema mode; currently defaults to `update` |
| `PULSEUP_SHOW_SQL` | No | SQL logging switch; keep false in production |
| `PULSEUP_DB_POOL_SIZE` | No | Production Hikari pool size |
| `SPRING_PROFILES_ACTIVE` | Production | Set to `production` on Render |
| `PORT` | Render provides | HTTP port |

Temporary first-admin variables are documented in [`DEPLOYMENT.md`](DEPLOYMENT.md). Remove them after the first administrator is created.

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Production | Public base URL of the Render API, ending in `/api` |

## Validation

Frontend checks:

```powershell
cd frontend
npm ci
npm run lint
npm run build
npm audit --omit=dev
```

Backend checks:

```powershell
cd PulseUp-Backend\PulseUp2026
.\mvnw.cmd test
.\mvnw.cmd clean package
```

The frontend currently has lint and production-build validation but no component-test framework. Backend tests cover account-token validation and core controller/service behavior.

## Production deployment

The repository is configured for:

```text
Vercel frontend → Render API → TiDB Cloud
```

- The root `Dockerfile` builds the Spring Boot project from the monorepo root for Render compatibility.
- `frontend/vercel.json` configures the Vite build and BrowserRouter fallback.
- `render.yaml` configures the Dockerized Spring Boot web service.
- `/api/health` verifies API and database readiness.
- TiDB connections use a MySQL-compatible JDBC URL with verified TLS.

Follow [`DEPLOYMENT.md`](DEPLOYMENT.md) for exact environment variables, deployment order, one-time administrator bootstrap, CORS configuration, and production smoke checks.

## Current limitations

- Dashboard notifications are derived from fetched data; only read IDs are stored in browser local storage.
- Dashboard updates use polling rather than WebSockets or server-sent events.
- Password recovery does not currently deliver an email or SMS code.
- Generated clinic PDFs contain persisted staff sign-off text but are not cryptographically signed documents.
- Voucher records are generated internally; no external merchant redemption integration is included.
- Database evolution currently uses Hibernate `ddl-auto`; versioned Flyway or Liquibase migrations should be introduced before long-term production operation.
- Campus details and service availability should be verified by the project owner before public release.

## Responsible use

A referral letter does not guarantee admission, an appointment, treatment, transport, or payment. For severe or rapidly worsening symptoms, seek emergency care immediately. In South Africa, call `112` from a mobile phone or `10177` for an ambulance.

## Deployment references

- [TiDB Cloud JDBC guide](https://docs.pingcap.com/tidbcloud/dev-guide-sample-application-java-jdbc/)
- [Render Docker deployments](https://render.com/docs/docker)
- [Render Blueprints](https://render.com/docs/blueprint-spec)
- [Vercel Vite deployments](https://vercel.com/docs/frameworks/vite)
- [Vercel rewrites](https://vercel.com/docs/routing/rewrites)

Provider documentation has been paraphrased for compliance with licensing restrictions.
