# PulseUp frontend

React + Vite client for the PulseUp CPUT Campus Clinic application. The browser always uses the Spring Boot REST API; MySQL through Spring Data JPA is the source of truth.

## Configuration

Copy `.env.example` to `.env` when a custom API URL is needed:

```properties
VITE_API_BASE_URL=http://localhost:8080/api
```

Without this variable, the client uses the configured `/api` proxy. Public users can register student accounts and use the shared login. Clinic staff accounts are created only by an authenticated administrator from the compact **Create staff account** section inside `AdminDashboard`.

For Vercel, set the project root to `frontend` and define:

```properties
VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
```

The value is public browser configuration. See the root [`DEPLOYMENT.md`](../DEPLOYMENT.md) for TiDB, Render, CORS, and Vercel setup.

## Commands

```bash
npm run lint
npm run build
```
