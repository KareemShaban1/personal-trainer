# Deploy Trainer SaaS on Contabo with aaPanel

Step-by-step guide to deploy this project on a Contabo VPS using [aaPanel](https://www.aapanel.com/).

| Component | Production target |
|-----------|-------------------|
| Frontend | React SPA (`frontend/dist`) served by Nginx |
| Backend | Laravel 12 API (`backend/public`) on PHP 8.2-FPM |
| Database | MySQL 8 |
| Queue | `php artisan queue:work` (Supervisor / aaPanel Process Manager) |
| Scheduler | Cron: `* * * * * php artisan schedule:run` |

## Domain layout (recommended: same domain)

Use **one domain** for both SPA and API. Nginx serves the React app at `/` and Laravel at `/api`.

| Purpose | URL |
|---------|-----|
| App (SPA) | `https://yourdomain.com` |
| API | `https://yourdomain.com/api` |
| Uploads | `https://yourdomain.com/storage/...` |

This avoids CORS issues, needs one SSL certificate, and matches how the frontend already treats `/api` in the PWA config.

> Prefer separate subdomains (`app.` + `api.`)? See [Alternative: two subdomains](#alternative-two-subdomains) at the end.

---

## 1. Contabo VPS

1. Order a Contabo VPS (Ubuntu 22.04 or 24.04 LTS recommended).
2. Note the **root password** and **public IP** from the Contabo panel.
3. Point DNS A record to the VPS IP:
   - `yourdomain.com` → VPS IP
   - (optional) `www.yourdomain.com` → VPS IP
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

## 5. Create one website (same domain)

**Website → Add site**

| Field | Value |
|-------|-------|
| Domain | `yourdomain.com` (+ `www.yourdomain.com` if used) |
| Root | `/www/wwwroot/yourdomain.com` (temporary; you will point it at Laravel `public`) |
| PHP | **PHP-83** |
| Database | Do **not** create another DB here if you already created one |

---

## 6. Clone the project

```bash
cd /www/wwwroot
git clone https://github.com/YOUR_ORG/trainer-saas.git trainer-saas
```

Layout:

```text
/www/wwwroot/trainer-saas/
  backend/          # Laravel — site document root = backend/public
  frontend/         # build SPA, then copy dist into backend/public
```

In aaPanel → site → **Settings → Website directory**:

1. Set site root to `/www/wwwroot/trainer-saas/backend`
2. Set **running directory** to `/public`
3. Do **not** enable “anti-cross-site” in a way that blocks the SPA assets you will place in `public`

---

## 7. Configure Laravel backend

```bash
cd /www/wwwroot/trainer-saas/backend
cp .env.example .env
nano .env
```

Production `.env` (same domain):

```env
APP_NAME="Trainer SaaS"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://yourdomain.com

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

FRONTEND_URL=https://yourdomain.com
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
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

---

## 8. Build frontend into Laravel `public`

```bash
cd /www/wwwroot/trainer-saas/frontend
cp .env.example .env
nano .env
```

Same-domain API URL:

```env
VITE_API_URL=https://yourdomain.com/api
```

Build and copy into Laravel public (keep `index.php`):

```bash
npm ci
npm run build

# Copy SPA files next to Laravel's index.php
cp -r dist/* /www/wwwroot/trainer-saas/backend/public/
chown -R www:www /www/wwwroot/trainer-saas/backend/public
```

After copy, `backend/public` should contain both:

| Path | Role |
|------|------|
| `index.php` | Laravel entry (API) |
| `index.html` | React SPA entry |
| `assets/` | Vite JS/CSS |
| `storage` | symlink from `php artisan storage:link` |

> Never overwrite `index.php` or `storage`. Re-copying `dist/*` is fine; it only adds/updates SPA files.

---

## 9. Nginx config (same domain)

aaPanel → site → **Settings → Config file**.

Keep aaPanel’s PHP handler (`include enable-php-83.conf;` or the panel’s generated block). Replace the main `location /` handling so:

- `/api` → Laravel `index.php`
- `/storage` → uploaded files
- everything else → SPA `index.html`

Example inside the `server { ... }` block:

```nginx
# Laravel API
location ^~ /api {
    try_files $uri $uri/ /index.php?$query_string;
}

# Public storage (logos, avatars)
location ^~ /storage {
    try_files $uri $uri/ =404;
}

# React SPA (deep links)
location / {
    try_files $uri $uri/ /index.html;
}

# PHP (keep aaPanel default — example only)
location ~ \.php$ {
    try_files $uri =404;
    include enable-php-83.conf;
}

# Hide dotfiles
location ~ /\.(?!well-known).* {
    deny all;
}
```

Important:

1. The `/api` block must reach PHP (`index.php`), not `index.html`.
2. The SPA block must fall back to `/index.html` (not Laravel).
3. Reload Nginx after saving.

If aaPanel regenerates config and wipes customs, re-apply these `location` blocks, or put them in the site’s **custom Nginx config** include if your panel version supports it.

---

## 10. SSL certificate

1. aaPanel → site → **SSL**
2. Use **Let’s Encrypt** for `yourdomain.com` (and `www` if used)
3. Issue certificate
4. Enable **Force HTTPS**

Wait until DNS A records have propagated before requesting certificates.

---

## 11. Queue worker (Supervisor)

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

## 12. Laravel scheduler (cron)

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

## 13. Verify deployment

1. Open `https://yourdomain.com` — SPA loads.
2. Open `https://yourdomain.com/api` — Laravel API response (not the React HTML page).
3. Login / register and confirm Network calls go to `https://yourdomain.com/api/...`.
4. Refresh a deep link (e.g. `/attendance`) — should not 404.
5. Check `backend/storage/logs/laravel.log` if something fails.

Demo accounts (only after `db:seed`): password `Password123!`

| Role | Login |
|------|--------|
| Super Admin | `admin@trainer.saas` |
| Owner | `owner@demo.academy` |

---

## 14. Updates / redeploy

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

# Frontend → same public folder
cd ../frontend
# confirm .env: VITE_API_URL=https://yourdomain.com/api
npm ci
npm run build
cp -r dist/* /www/wwwroot/trainer-saas/backend/public/
chown -R www:www /www/wwwroot/trainer-saas/backend/public
```

---

## 15. Production checklist

- [ ] `APP_DEBUG=false`, strong `APP_KEY`
- [ ] HTTPS + Force HTTPS on the single domain
- [ ] `APP_URL`, `FRONTEND_URL`, and `VITE_API_URL` all use the same domain
- [ ] Nginx routes `/api` to PHP and `/` to `index.html`
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
| `/api` returns React HTML | Nginx is sending `/api` to `index.html` — fix the `/api` → `index.php` location |
| SPA deep link 404 | Add `try_files $uri $uri/ /index.html` for `/` |
| 500 on API | Check `storage/logs/laravel.log`, DB credentials, `php artisan config:clear` temporarily |
| Frontend blank / wrong API host | Rebuild after fixing `VITE_API_URL` (Vite bakes env at build time) |
| CORS errors | Same domain usually avoids this; still set `FRONTEND_URL=https://yourdomain.com` and clear config cache |
| Uploads fail | Fix `storage` permissions + `php artisan storage:link` |
| Jobs never run | Start Supervisor queue worker; check failed jobs table |
| SSL fail | Confirm DNS A record points to Contabo IP; wait for propagation |
| `index.php` missing after deploy | You overwrote `public/` incorrectly — restore Laravel `public/index.php` from git |

---

## Alternative: two subdomains

If you prefer split hosts:

| Purpose | Example |
|---------|---------|
| Frontend | `https://app.yourdomain.com` |
| API | `https://api.yourdomain.com` |

1. Create **two** aaPanel sites.
2. API site root → `/www/wwwroot/trainer-saas/backend`, running directory `/public`, Laravel `try_files` → `index.php`.
3. App site root → copy of `frontend/dist`, SPA `try_files` → `index.html`.
4. Env:

```env
# backend/.env
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
SANCTUM_STATEFUL_DOMAINS=app.yourdomain.com

# frontend/.env (before build)
VITE_API_URL=https://api.yourdomain.com/api
```

5. Issue SSL for both domains.

Same-domain is simpler for Contabo + aaPanel; use subdomains only if you need separate scaling or CDN rules.

---

## Related docs

- Local setup: [README.md](../README.md)
- API overview: [API.md](./API.md)
