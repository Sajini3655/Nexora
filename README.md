# Nexora — Single Backend + Single Frontend

This project contains:
- **One Frontend** (Vite + React) with **Admin / Manager / Developer** routes
- **One shared Spring Boot backend**

## What you asked for
✅ When logging in with a **Developer** account on the shared login page (Admin/Manager frontend), you are redirected to the **Developer dashboard**.

## Ports
- Backend: `http://localhost:8081`
- Frontend UI: `http://localhost:5173`

## Run backend (Supabase Postgres)
From `backend/`:

```bash
mvn spring-boot:run
```

- Create `backend/.env` from `backend/.env.example` and set:
	- `DATABASE_URL`
	- `DATABASE_USER`
	- `DATABASE_PASSWORD`

### Demo users (auto-created on first run)
- Admin: `admin@nexora.com` / `admin123`
- Manager: `manager@nexora.com` / `manager123`
- Developer: `dev@nexora.com` / `dev123`

> If `mvn clean` fails on Windows because `target/` is locked, run without clean:
> `mvn spring-boot:run`

## Run frontend
From `admin-manager/`:

```bash
npm install
npm run dev
```

## Developer routing
- Login stores JWT in `localStorage.token`.
- If role is `DEVELOPER`, the app routes to `/dev` within the same frontend.

---

Next (when you're ready): we can add AI task assignment on the backend.
