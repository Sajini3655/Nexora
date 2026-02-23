# Nexora Combined (Admin/Manager + Developer) — Single Backend

This zip contains:
- **Admin/Manager Frontend** (Vite + React + MUI)
- **Developer Frontend** (Vite + React + Tailwind theme)
- **One shared Spring Boot backend**

## What you asked for
✅ When logging in with a **Developer** account on the shared login page (Admin/Manager frontend), you are redirected to the **Developer dashboard**.

## Ports
- Backend: `http://localhost:8081`
- Admin/Manager UI: `http://localhost:5173`
- Developer UI: `http://localhost:5174`

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

## Run Developer frontend
From `developer/`:

```bash
npm install
npm run dev
```

## Developer redirect logic
- Login stores JWT in `localStorage.token`.
- If role is `DEVELOPER`, Admin/Manager UI redirects to:
  `http://localhost:5174/?token=<JWT>`
- Developer UI reads `?token=` and stores it into `localStorage.token`.

---

Next (when you're ready): we can add AI task assignment on the backend.
