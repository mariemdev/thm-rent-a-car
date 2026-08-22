---
name: local-dev-setup
description: How to run and test the THM Rent A Car app locally (postgres, dev server, seeded logins, common pitfalls).
---

# Running THM Rent A Car locally

## Database
No system postgres is installed on the box; docker is available:

```bash
docker run -d --name thmpg -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=thm_rent_a_car -p 5432:5432 postgres:16
cp .env.example .env   # defaults (localhost/5432/thm_rent_a_car/postgres/admin) already match
```

Leave `DATABASE_RESET=false`. `server.ts` creates the schema and seeds data on boot.
Leave SMTP_* empty — email flows are not needed for login (verification check is disabled in `server.ts`).

## Dev server
`npm run dev` (= `tsx server.ts`) serves both the Express API and the Vite frontend on http://localhost:3000.
Boot takes ~25-40s (schema init + seeding); wait for `Server running on http://localhost:3000` in the log.

Pitfall: with the pinned `tsx@4.21.0` the server crashes at startup with
`failed to load config from vite.config.ts` / `TypeError [ERR_INVALID_URL_SCHEME]: The URL must be of scheme file`.
Upgrading tsx (`npm i -D tsx@latest`, verified with 4.23.12) fixes it. Renaming the config to `.mjs` does NOT help.
If a future tsx version regresses, try another tsx version first before touching app code.

## Logins (seeded in server.ts)
- superadmin@automanager.com / superadmin123
- admin@automanager.com / admin123

Extra users can be inserted directly:
```bash
HASH=$(node -e "console.log(require('bcryptjs').hashSync('temp1234',10))")
docker exec -i thmpg psql -U postgres -d thm_rent_a_car -c \
  "INSERT INTO users (name,email,password,role,is_verified,agency_id,branch_id) VALUES ('Temp','temp@test.com','$HASH','admin',1,1,1);"
```

## Testing auth/session behaviour
- Session lives in localStorage keys `token` and `user` (`src/lib/auth.ts`).
- Simulate "DB down" without killing the frontend: `docker stop thmpg` → `/api/auth/me` returns 503 `AUTH_UNAVAILABLE`.
- Simulate total backend loss: `pkill -f "tsx server.ts"` (frontend already loaded keeps working client-side).
- Trigger `USER_NOT_FOUND`: log in as a throwaway user then `DELETE FROM users WHERE email='...'` and reload.
- The logout button is at the bottom of the sidebar; its label follows the i18n locale (shows "Logout" in en-US, "Déconnexion" in fr).
- Chrome omnibox autocompletes `localhost:3000/` to a previously visited `/login`; type the full URL then press Delete before Enter to avoid a false "logged out" result.

## Devin Secrets Needed
None for local runs (SMTP/Gemini keys optional and unused for auth testing).
