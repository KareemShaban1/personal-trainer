# Deploy Trainer SaaS on Contabo with aaPanel

Step-by-step guide to deploy this project on a Contabo VPS using [aaPanel](https://www.aapanel.com/).

| Component | Production target |
|-----------|-------------------|
| Frontend | React SPA (`frontend/dist`) served by Nginx |
| Backend | Laravel 12 API (`backend/public`) on PHP 8.3-FPM |
| Database | MySQL 8 |
| Queue | `php artisan queue:work` (Supervisor / aaPanel Process Manager) |
| Scheduler | Cron: `* * * * * php artisan schedule:run` |

Recommended domains:

| Purpose | Example |
|---------|---------|
| Frontend | `https://app.yourdomain.com` |
| API | `https://api.yourdomain.com` |

---

## 1. Contabo VPS

1. Order a Contabo VPS (Ubuntu 22.04 or 24.04 LTS recommended).
2. Note the **root password** and **public IP** from the Contabo panel.
3. Point DNS A records to the VPS IP:
   - `app.yourdomain.com` → VPS IP
   - `api.yourdomain.com` → VPS IP
4. Open Contabo firewall / security group if needed: ports **22**, **80**, **443**.

SSH in:

```bash
ssh root@YOUR_VPS_IP
```

---

## 2. Install aaPanel

On Ubuntu:

```bash
URL=https://www.aapanel.com/script/install_7.0_en.sh && curl -sSO $URL && bash install_7.0_en.sh aapanel
```

When install finishes, save:

- Panel URL (usually `http://IP:7800`)
- Username
- Password

Log in to aaPanel in the browser.

> Change the panel port later under **Panel settings** if you want. Enable HTTPS for the panel when possible.

---

## 3. Install required software (aaPanel)

Go to **App Store** and install:

| Soft | Version / notes |
|------|-----------------|
| **Nginx** | Latest stable |
| **MySQL** | 8.0 |
| **PHP** | **8.3** (required: Laravel 12 needs PHP ^8.2) |
| **phpMyAdmin** | Optional, for DB management |
| **Supervisor** / **Process Manager** | For queue workers |
| **Redis** | Optional but recommended for cache/queues |

### PHP 8.3 extensions

In **App Store → PHP 8.3 → Settings → Install extensions**, enable at least:

- `opcache`
- `pdo_mysql` / `mysqli`
- `mbstring`
- `tokenizer`
- `xml`
- `ctype`
- `json`
- `bcmath`
- `fileinfo`
- `curl`
- `zip`
- `gd` or `imagick`
- `redis` (if using Redis)

Also raise limits if needed (PHP Settings):

- `upload_max_filesize` = `20M`
- `post_max_size` = `20M`
- `max_execution_time` = `120`
- `memory_limit` = `256M`

### Install Composer (SSH)

```bash
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
composer --version
```

### Install Node.js 20+ (SSH)

Needed to build the frontend on the server (or build locally and upload `dist`).

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v
npm -v
```

---

## 4. Create MySQL database

In aaPanel → **Database** → **Add database**:

| Field | Example |
|-------|---------|
| Database name | `trainer_saas` |
| Username | `trainer_user` |
| Password | strong random password |
| Access | Local server |

Save these credentials for `backend/.env`.

---

## 5. Create websites

### 5.1 API site

**Website → Add site**

| Field | Value |
|-------|-------|
| Domain | `api.yourdomain.com` |
| Root | `/www/wwwroot/api.yourdomain.com` |
| PHP | **PHP-83** |
| Database | Do **not** create another DB here if you already created one |

After creation:

1. Open site → **Settings → Website directory**.
2. Set running directory to `/public` (Laravel document root).
3. Enable **Force HTTPS** after SSL is issued.

### 5.2 Frontend site

**Website → Add site**

| Field | Value |
|-------|-------|
| Domain | `app.yourdomain.com` |
| Root | `/www/wwwroot/app.yourdomain.com` |
| PHP | Pure static / any (SPA only needs Nginx) |

---

## 6. Upload / clone the project

### Option A — Git (recommended)

```bash
# API
cd /www/wwwroot
rm -rf api.yourdomain.com
git clone https://github.com/YOUR_ORG/trainer-saas.git api.yourdomain.com
# Keep only backend files in the web root, or symlink — simplest: clone then point site at backend

cd /www/wwwroot/api.yourdomain.com
# If repo is monorepo, use backend as the site root:
# Site root in aaPanel should be: /www/wwwroot/trainer-saas/backend
```

Practical layout:

```text
/www/wwwroot/trainer-saas/          # full git clone
  backend/                          # ← aaPanel API site root
  frontend/                         # build here, copy dist to app site
```

```bash
cd /www/wwwroot
git clone https://github.com/YOUR_ORG/trainer-saas.git trainer-saas
```

Then in aaPanel:

- API site root → `/www/wwwroot/trainer-saas/backend`
- API running directory → `/public`
- Frontend site root → `/www/wwwroot/app.yourdomain.com` (copy of `frontend/dist`)

### Option B — Upload ZIP via aaPanel File Manager

Upload and extract `backend` into the API site path, and later upload `frontend/dist` into the app site path.

---

## 7. Configure Laravel backend

```bash
cd /www/wwwroot/trainer-saas/backend
cp .env.example .env
nano .env
```

Production `.env` example:

```env
APP_NAME="Trainer SaaS"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

APP_LOCALE=en
APP_FALLBACK_LOCALE=en

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=trainer_saas
DB_USERNAME=trainer_user
DB_PASSWORD=YOUR_DB_PASSWORD

SESSION_DRIVER=file
SESSION_LIFETIME=120

FILESYSTEM_DISK=public
QUEUE_CONNECTION=database
CACHE_STORE=file

# If Redis is installed:
# QUEUE_CONNECTION=redis
# CACHE_STORE=redis
# REDIS_CLIENT=phpredis
# REDIS_HOST=127.0.0.1
# REDIS_PASSWORD=null
# REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@yourdomain.com"
MAIL_FROM_NAME="${APP_NAME}"

FRONTEND_URL=https://app.yourdomain.com
SANCTUM_STATEFUL_DOMAINS=app.yourdomain.com
```

Install dependencies and bootstrap:

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
# Optional demo data (dev/staging only — skip on real production):
# php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Permissions (aaPanel usually runs as `www`):

```bash
chown -R www:www /www/wwwroot/trainer-saas/backend
chmod -R 755 /www/wwwroot/trainer-saas/backend
chmod -R 775 /www/wwwroot/trainer-saas/backend/storage
chmod -R 775 /www/wwwroot/trainer-saas/backend/bootstrap/cache
```

### Laravel Nginx rewrite (API site)

In aaPanel → API site → **Settings → Config file**, ensure the PHP location uses Laravel’s front controller. Typical snippet inside the `server` block:

```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}

location ~ \.php$ {
    include enable-php-83.conf;
    # or aaPanel's generated PHP handler — keep the panel default and only fix try_files if needed
}
```

Deny direct access to sensitive paths:

```nginx
location ~ /\.(?!well-known).* {
    deny all;
}
```

Reload Nginx from aaPanel after edits.

---

## 8. Build and deploy the frontend

```bash
cd /www/wwwroot/trainer-saas/frontend
cp .env.example .env
nano .env
```

Set:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

Build:

```bash
npm ci
npm run build
```

Copy build output to the frontend site root:

```bash
rm -rf /www/wwwroot/app.yourdomain.com/*
cp -r dist/* /www/wwwroot/app.yourdomain.com/
chown -R www:www /www/wwwroot/app.yourdomain.com
```

### SPA rewrite (frontend site)

aaPanel → frontend site → **Settings → Config file**, add:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

This is required so React Router deep links work.

---

## 9. SSL certificates

For each site (`app` and `api`):

1. aaPanel → site → **SSL**
2. Use **Let’s Encrypt**
3. Issue certificate
4. Enable **Force HTTPS**

Wait until DNS A records have propagated before requesting certificates.

---

## 10. Queue worker (Supervisor)

Notifications and background jobs need a worker.

### Via aaPanel Process Manager / Supervisor

Add a process:

| Field | Value |
|-------|-------|
| Name | `trainer-queue` |
| Run user | `www` |
| Run directory | `/www/wwwroot/trainer-saas/backend` |
| Start command | `php artisan queue:work --sleep=3 --tries=3 --max-time=3600` |
| Auto restart | Yes |

Or create `/etc/supervisor/conf.d/trainer-queue.conf`:

```ini
[program:trainer-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /www/wwwroot/trainer-saas/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www
numprocs=1
redirect_stderr=true
stdout_logfile=/www/wwwroot/trainer-saas/backend/storage/logs/queue-worker.log
stopwaitsecs=3600
```

```bash
supervisorctl reread
supervisorctl update
supervisorctl start trainer-queue:*
```

---

## 11. Laravel scheduler (cron)

aaPanel → **Cron** → **Add**:

| Field | Value |
|-------|-------|
| Type | Shell script |
| Period | Every 1 minute |
| Script | see below |

```bash
cd /www/wwwroot/trainer-saas/backend && php artisan schedule:run >> /dev/null 2>&1
```

This runs subscription expiry / low-session alerts defined in the app.

---

## 12. Verify deployment

1. Open `https://api.yourdomain.com/api` — expect Laravel JSON / route response (not 500).
2. Open `https://app.yourdomain.com` — SPA loads.
3. Login with a seeded account (only if you ran seeders), or register a new organization.
4. Confirm API calls from the browser Network tab go to `https://api.yourdomain.com/api/...`.
5. Check `backend/storage/logs/laravel.log` if something fails.

Demo accounts (only after `db:seed`): password `Password123!`

| Role | Login |
|------|--------|
| Super Admin | `admin@trainer.saas` |
| Owner | `owner@demo.academy` |

---

## 13. Updates / redeploy

```bash
cd /www/wwwroot/trainer-saas
git pull

# Backend
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart

# Frontend
cd ../frontend
# confirm .env still has production VITE_API_URL
npm ci
npm run build
rm -rf /www/wwwroot/app.yourdomain.com/*
cp -r dist/* /www/wwwroot/app.yourdomain.com/
chown -R www:www /www/wwwroot/app.yourdomain.com
```

---

## 14. Production checklist

- [ ] `APP_DEBUG=false`, strong `APP_KEY`
- [ ] HTTPS on both domains + Force HTTPS
- [ ] `FRONTEND_URL` and CORS match the real app domain
- [ ] MySQL backups enabled in aaPanel (daily)
- [ ] Queue worker running and auto-restarting
- [ ] Scheduler cron every minute
- [ ] `storage` and `bootstrap/cache` writable by `www`
- [ ] Firewall: only 22 / 80 / 443 (and panel port) open
- [ ] Change aaPanel default credentials; restrict panel access by IP if possible
- [ ] Prefer Redis for `CACHE_STORE` + `QUEUE_CONNECTION` under load
- [ ] Optional: S3-compatible storage for logos/avatars (`FILESYSTEM_DISK=s3`)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 500 on API | Check `storage/logs/laravel.log`, run `php artisan config:clear` temporarily, confirm DB credentials |
| 404 on API routes | Running directory must be `/public`; Nginx `try_files` must hit `index.php` |
| Frontend blank / wrong API host | Rebuild after fixing `VITE_API_URL` (Vite bakes env at build time) |
| CORS errors | Set `FRONTEND_URL=https://app.yourdomain.com` and clear config cache |
| SPA deep link 404 | Add `try_files ... /index.html` on the frontend Nginx site |
| Uploads fail | Fix `storage` permissions + `php artisan storage:link` |
| Jobs never run | Start Supervisor queue worker; check failed jobs table |
| SSL fail | Confirm DNS A records point to Contabo IP; wait for propagation |

---

## Related docs

- Local setup: [README.md](../README.md)
- API overview: [API.md](./API.md)
