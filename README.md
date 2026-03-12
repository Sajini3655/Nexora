# Nexora (Admin/Manager/Developer) — Single Frontend + Single Backend

This repo contains:
- **Unified Frontend** (Vite + React + MUI) in `admin-manager/`
- **One shared Spring Boot backend**

## What you asked for
✅ When logging in with a **Developer** account, you are routed to the **Developer dashboard** inside the same frontend.

✅ Developer routes now live inside the unified frontend under `/developer/*`.

## Ports
- Backend: `http://localhost:8081`
- Frontend UI: `http://localhost:5173`

## Run frontend from repo root (recommended)
This repo is set up as an **npm workspaces** monorepo so you can install once and run the UI.

From the repo root:

```bash
npm install
npm run dev
```

Or run them individually:

```bash
npm run dev:admin
```

> Note: the Vite app is configured with a **strict port** (5173). If you already have something running on that port, the dev server will fail fast.
> 
> On Windows you can find/kill the process using:
>
> ```bash
> netstat -ano | findstr :5173
> taskkill /PID <PID> /F
> ```

## Run backend (H2 DB – no PostgreSQL needed)
From `backend/`:

```bash
mvn spring-boot:run
```

- H2 console: `http://localhost:8081/h2`

### Demo users (auto-created on first run)
- Admin: `admin@nexora.com` / `admin123`
- Manager: `manager@nexora.com` / `manager123`
- Developer: `dev@nexora.com` / `dev123`

> If `mvn clean` fails on Windows because `target/` is locked, run without clean:
> `mvn spring-boot:run`

## Run Admin/Manager frontend
From `admin-manager/`:

```bash
npm install
npm run dev
```

## Developer routing
- Developer pages are served from the same frontend under `/developer/*` (e.g. `/developer`, `/developer/tasks`, `/developer/profile`).

---

Next (when you're ready): we can add AI task assignment on the backend.
