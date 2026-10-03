# Trainer SaaS

Multi-tenant SaaS for trainers and training academies (Egypt/MENA-ready). Manage trainees, packages, subscriptions, attendance (manual + QR + geolocation), parents, progress, reports, and in-app notifications — with Arabic RTL and English LTR.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, React Hook Form, Zod, i18next, Recharts |
| Backend | Laravel 12, PHP 8.3, Sanctum (Bearer tokens), Spatie Permission, Pest |
| Database | MySQL 8 |
| Local queues/cache | Database queue + file cache (Redis optional for production) |

## Repository layout

```
trainer-saas/
  backend/     Laravel API
  frontend/    React SPA
  docs/        API overview
```

## Prerequisites (Windows)

- PHP 8.3+ with `pdo_mysql`, Composer
- MySQL 8
- Node.js 20+
- Redis optional (not required for local default config)

## Backend setup

```bash
cd backend
copy .env.example .env   # or use existing .env
# Set DB_* to your MySQL instance
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve
```

API base: `http://localhost:8000/api`

Queue worker (optional locally; notifications use database channel):

```bash
php artisan queue:work
```

Scheduler (subscription expiry / low-session alerts):

```bash
php artisan schedule:work
# or Windows Task Scheduler: php artisan schedule:run every minute
```

### Testing database

Create a separate DB for Pest:

```sql
CREATE DATABASE trainer_saas_testing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
php artisan test
```

## Frontend setup

```bash
cd frontend
npm install
# .env: VITE_API_URL=http://localhost:8000/api
npm run dev
```

App: `http://localhost:5173`

Production build:

```bash
npm run build
```

## Demo accounts

Password for all: `Password123!`

| Role | Login |
|------|--------|
| Super Admin | `admin@trainer.saas` (email) |
| Organization Owner | `owner@demo.academy` |
| Trainer | `trainer@demo.academy` |
| Staff | `staff@demo.academy` |
| Trainee | phone `01000000001` |
| Parent | phone `01000000002` |

Demo org: **Demo Academy** — Egypt, `Africa/Cairo`, EGP.

## Auth notes

- Staff / owner / super admin: email + password
- Trainee / parent: phone + password
- Send `Authorization: Bearer {token}`
- Tenant-scoped requests also send `X-Organization-Id: {id}`

## Core business rules

- `remaining_sessions` is updated only via subscription transactions (never trust the client)
- Valid **Present** attendance consumes one session inside a DB transaction
- Late consumes a session only if org setting `consume_session_on_late` is enabled
- Duplicate attendance for the same trainee + subscription + date is rejected
- QR payloads are opaque random tokens (no PII); org check-in QR codes expire

## Production checklist

- HTTPS termination (Nginx)
- Redis for cache + queues
- `php artisan queue:work` supervised
- Cron / Task Scheduler for `schedule:run`
- Object storage (`FILESYSTEM_DISK=s3` or compatible) for logos/avatars
- Strong `APP_KEY`, restricted CORS (`FRONTEND_URL`), rate limits on auth
- Backups for MySQL

## API documentation

See [docs/API.md](docs/API.md).

## Deploy on Contabo (aaPanel)

See [docs/DEPLOY_CONTABO_AAPANEL.md](docs/DEPLOY_CONTABO_AAPANEL.md).
