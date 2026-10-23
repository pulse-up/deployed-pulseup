# PulseUp deployment: TiDB Cloud + Render + Vercel

This repository is configured as a monorepo:

- `frontend/`: React + Vite, deployed to Vercel.
- `PulseUp-Backend/PulseUp2026/`: Spring Boot 4 + Java 21, deployed to Render from its Dockerfile.
- TiDB Cloud: MySQL-compatible production database used by Spring Data JPA.

## 1. Publish a clean monorepo

The current workspace contains a nested Git repository at `PulseUp-Backend/.git`. Do **not** run `git add` from the outer repository until the project has been copied into a clean checkout, or Git can store the backend as a gitlink instead of including its source files.

1. Clone the empty target repository into a new directory:

   ```powershell
   git clone https://github.com/pulse-up/deployed-pulseup.git
   ```

2. Copy these current workspace entries into that clean checkout:

   ```text
   frontend/
   PulseUp-Backend/PulseUp2026/
   .gitignore
   README.md
   DEPLOYMENT.md
   render.yaml
   ```

3. Do not copy `.git`, `.idea`, `node_modules`, `dist`, `target`, `.env`, `http-client.private.env.json`, private keys, or `semantic-review` output.
4. In the clean checkout, confirm the backend contains ordinary files rather than a nested repository:

   ```powershell
   git status --short
   git ls-files "PulseUp-Backend/PulseUp2026/src/**"
   ```

5. Commit and push from the clean checkout only.

No Git metadata is deleted by these instructions, so the existing working repositories remain available as backups.

## 2. Create the TiDB Cloud database

1. Create a TiDB Cloud Starter, Essential, or Dedicated cluster.
2. Create a database named `pulseup`.
3. Open **Connect**, choose a public/standard connection, and copy the host, port, username, and password generated for the cluster.
4. Allow Render to connect using the network-access controls shown for the selected TiDB tier.
5. Use the hostname from TiDB rather than replacing it with an IP address. Hostname verification depends on that name.

Render environment variables:

```text
PULSEUP_DB_URL=jdbc:mysql://YOUR_TIDB_HOST:4000/pulseup?sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3&serverTimezone=UTC
PULSEUP_DB_USERNAME=YOUR_TIDB_USERNAME
PULSEUP_DB_PASSWORD=YOUR_TIDB_PASSWORD
PULSEUP_DDL_AUTO=update
PULSEUP_SHOW_SQL=false
PULSEUP_DB_POOL_SIZE=5
```

Use the exact port and TLS guidance from the TiDB **Connect** dialog. TiDB recommends `VERIFY_IDENTITY` for JDBC connections over the internet. If the chosen tier supplies a CA certificate, follow its trust-store instructions instead of weakening TLS.

`PULSEUP_DDL_AUTO=update` is provided to initialize this currently migration-free project. After the production schema is stable and versioned migrations are introduced, switch production to `validate`.

## 3. Generate a production JWT secret

Generate a new Base64 value containing 48 random bytes. Run this locally in PowerShell:

```powershell
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Save the output in Render as `PULSEUP_JWT_SECRET`. Never add it to Git, Vercel, logs, screenshots, or HTTP files.

## 4. Deploy the Spring Boot API to Render

The root `render.yaml` defines a Docker web service using the repository-root `Dockerfile` and build context. The root Dockerfile copies and builds `PulseUp-Backend/PulseUp2026`, which works for both Blueprint and default Render Docker settings. `/api/health` verifies both the API and database connection without exposing database details.

1. In Render, choose **New > Blueprint**.
2. Connect `pulse-up/deployed-pulseup`.
3. Select `render.yaml` from the repository root.
4. Enter all variables marked `sync: false`:

   ```text
   PULSEUP_DB_URL
   PULSEUP_DB_USERNAME
   PULSEUP_DB_PASSWORD
   PULSEUP_JWT_SECRET
   PULSEUP_FRONTEND_ORIGINS
   ```

5. Before Vercel exists, use the expected production domain as the initial origin, then replace it with the exact domain after the first Vercel deployment. Example:

   ```text
   PULSEUP_FRONTEND_ORIGINS=https://deployed-pulseup.vercel.app
   ```

6. Deploy and confirm:

   ```text
   https://YOUR-RENDER-SERVICE.onrender.com/api/health
   ```

   Expected response:

   ```json
   {"status":"UP"}
   ```

### Create the first production administrator

For an empty TiDB database, temporarily add these Render variables:

```text
PULSEUP_BOOTSTRAP_ADMIN_ENABLED=true
PULSEUP_BOOTSTRAP_ADMIN_EMAIL=YOUR_ADMIN_EMAIL
PULSEUP_BOOTSTRAP_ADMIN_PASSWORD=YOUR_STRONG_TEMPORARY_PASSWORD
PULSEUP_BOOTSTRAP_ADMIN_FIRST_NAME=YOUR_FIRST_NAME
PULSEUP_BOOTSTRAP_ADMIN_LAST_NAME=YOUR_LAST_NAME
PULSEUP_BOOTSTRAP_ADMIN_PHONE_NUMBER=YOUR_10_DIGIT_PHONE
PULSEUP_BOOTSTRAP_ADMIN_NUMBER=YOUR_ADMIN_NUMBER
PULSEUP_BOOTSTRAP_ADMIN_DEPARTMENT=System Administration
```

Deploy once, verify the administrator can sign in, then immediately:

1. Set `PULSEUP_BOOTSTRAP_ADMIN_ENABLED=false`.
2. Remove all other bootstrap variables, especially the password.
3. Redeploy.

Do not run the local reset SQL against TiDB production.

## 5. Deploy the Vite frontend to Vercel

The frontend includes `vercel.json` for Vite builds and BrowserRouter fallback routing. Node 22 is pinned in `package.json` and `.nvmrc`.

1. In Vercel, import `pulse-up/deployed-pulseup`.
2. Set **Root Directory** to `frontend`.
3. Keep the Vite framework preset. Repository defaults are:

   ```text
   Install command: npm ci
   Build command: npm run build
   Output directory: dist
   ```

4. Add this Vercel environment variable for Production:

   ```text
   VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
   ```

   `VITE_API_BASE_URL` is public browser configuration, not a secret.

5. Deploy the frontend.
6. Copy the exact Vercel production URL into Render:

   ```text
   PULSEUP_FRONTEND_ORIGINS=https://YOUR-VERCEL-DOMAIN
   ```

   Do not include a trailing slash. Redeploy Render after changing the origin.

For intentional Vercel preview support, append a narrowly scoped pattern as a comma-separated value, for example:

```text
https://YOUR-PRODUCTION-DOMAIN,https://*.vercel.app
```

An exact production origin is safer when previews do not need live production data.

## 6. Production smoke checks

Verify in order:

1. Render `/api/health` returns `200` and `{"status":"UP"}`.
2. Vercel `/`, `/login`, `/register`, and dashboard deep-link refreshes return the SPA rather than 404.
3. Browser requests use the Render `/api` URL and pass CORS.
4. Admin login works and role guards prevent cross-dashboard access.
5. Student registration writes to TiDB.
6. Admin creates a staff account inside AdminDashboard.
7. Staff publishes a slot; Student books it; Staff confirms/completes it.
8. Student rewards, sick notes, referral sign-off, PDF generation, password changes, recovery, profile images, and notifications still work.
9. Render logs contain no passwords, JWTs, database URL credentials, medical summaries, or downloaded documents.

## Required production variables

| Platform | Variable | Secret | Purpose |
| --- | --- | --- | --- |
| Render | `PULSEUP_DB_URL` | Yes | TiDB TLS JDBC URL |
| Render | `PULSEUP_DB_USERNAME` | Yes | TiDB account |
| Render | `PULSEUP_DB_PASSWORD` | Yes | TiDB password |
| Render | `PULSEUP_JWT_SECRET` | Yes | Base64 JWT signing key |
| Render | `PULSEUP_FRONTEND_ORIGINS` | No | Exact allowed Vercel origin(s) |
| Render | `SPRING_PROFILES_ACTIVE=production` | No | Production Spring settings |
| Render | `PULSEUP_DDL_AUTO=update` | No | Initial schema setup only |
| Vercel | `VITE_API_BASE_URL` | No | Public Render API base URL |

## Provider references

- [TiDB Cloud JDBC connection guide](https://docs.pingcap.com/tidbcloud/dev-guide-sample-application-java-jdbc/)
- [TiDB Cloud TLS connections](https://docs.pingcap.com/tidbcloud/secure-connections-to-serverless-clusters)
- [Render Docker deployments](https://render.com/docs/docker)
- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
- [Render monorepo support](https://render.com/docs/monorepo-support/)
- [Render environment variables and secrets](https://render.com/docs/configure-environment-variables)
- [Vercel Vite deployments](https://vercel.com/docs/frameworks/vite)
- [Vercel monorepos](https://vercel.com/docs/concepts/monorepos)
- [Vercel rewrites](https://vercel.com/docs/routing/rewrites)

Provider guidance in this document is paraphrased for compliance with licensing restrictions.
