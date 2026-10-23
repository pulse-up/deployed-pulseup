# PulseUp local clean-seed workflow

This workflow is for a local MySQL database only. It never requires a public admin-registration endpoint. Hibernate uses `update` locally to create tables after the database reset.

## Exact IntelliJ IDEA sequence

1. **Stop the Spring Boot application.** Confirm no PulseUp run configuration is active.
2. Open the local MySQL data source in IntelliJ's **Database** tool window. Open `Seeding/reset-database.sql`, verify the selected connection is local, and run it manually. It is destructive: it drops and recreates `pulseup`.
3. Generate a fresh JWT secret in Windows PowerShell with an RNG instance, then copy the resulting Base64 value into the IntelliJ Run Configuration environment (do not commit it):

   ```powershell
   $bytes = New-Object 'System.Byte[]' 48
   $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
   try {
       $rng.GetBytes($bytes)
       [Convert]::ToBase64String($bytes)
   }
   finally {
       $rng.Dispose()
   }
   ```

4. In **Run | Edit Configurations | PulseUp2026Application**, configure:
   - `PULSEUP_DB_URL` for the local `pulseup` database (optional when the default URL is correct).
   - `PULSEUP_DB_USERNAME` (defaults to `root`).
   - `PULSEUP_DB_PASSWORD` for the local MySQL account.
   - `PULSEUP_JWT_SECRET` with the newly generated Base64 value.
   - `PULSEUP_DDL_AUTO=update`.
   - `PULSEUP_SHOW_SQL=false`.
5. For the first startup only, add this administrator bootstrap identity and supply the administrator password in the Run Configuration environment:
   - `PULSEUP_BOOTSTRAP_ADMIN_ENABLED=true`
   - `PULSEUP_BOOTSTRAP_ADMIN_EMAIL=pulseadmin@cput.ac.za`
   - `PULSEUP_BOOTSTRAP_ADMIN_FIRST_NAME=Tiyani`
   - `PULSEUP_BOOTSTRAP_ADMIN_LAST_NAME=Ngwana`
   - `PULSEUP_BOOTSTRAP_ADMIN_PHONE_NUMBER=0600000001`
   - `PULSEUP_BOOTSTRAP_ADMIN_NUMBER=ADM-LOCAL-001`
   - `PULSEUP_BOOTSTRAP_ADMIN_DEPARTMENT=System Administration`
   - `PULSEUP_BOOTSTRAP_ADMIN_PASSWORD` set to the same local value referenced by `adminPassword` in the private HTTP environment.
6. Start `PulseUp2026Application` once. Wait for startup to complete and confirm the bootstrap did not report invalid configuration.
7. Stop the application. Set `PULSEUP_BOOTSTRAP_ADMIN_ENABLED=false` (or remove it), remove `PULSEUP_BOOTSTRAP_ADMIN_PASSWORD` from the Run Configuration, and restart the application. Do not leave the bootstrap password in a persistent run environment.
8. In IntelliJ's HTTP Client, select the `local` environment from ignored `http-client.private.env.json`. Never select or edit the tracked example with real values.
9. Run every request in `Seeding/seed-pulseup.http` from step 1 through step 15 in order. The script computes `seedSlotDate` as the local date plus 30 days, logs in the administrator, creates five staff accounts, validates every returned dashboard profile field, captures each generated ID from its creation response, creates service slots, and verifies all records.
10. Run `Seeding/security-test.http`, then verify each intended login and role dashboard in the frontend: administrator, each clinic staff account, and a separately registered student account. Confirm the embedded **Create staff account** section is available only in the administrator dashboard and creates clinic staff only.
11. Never commit JWT secrets, database passwords, bootstrap passwords, staff/student passwords, private HTTP environments, HTTP request history, or generated tokens.

## Local seed phone numbers

The synchronized catalog and HTTP seed use administrator phone `0600000001` and staff phones `0608920131`, `0738900789`, `0823750013`, `0728960301`, and `0669003415`. Keep both files aligned and use only approved test data.

## Configuration notes

`application.properties` reads `PULSEUP_DB_URL`, `PULSEUP_DB_USERNAME`, and `PULSEUP_DB_PASSWORD`; the username defaults to `root` and the password defaults to empty. `spring.jpa.open-in-view` is disabled. The JWT secret must be standard Base64 containing at least 32 decoded bytes. The application keeps HS256 signing and checks issuer, timestamps, active account state, and token version on every authenticated API request.

Staff registration returns `201 Created` with a safe staff profile containing `userId`, name, contact, assignment, specialization, and availability fields. It never returns a staff JWT or password. The seed captures generated IDs directly from these creation responses and retains the ADMIN-protected staff-list request as profile verification. Registration is intentionally not idempotent; repeat this workflow only after a deliberate clean local reset.
