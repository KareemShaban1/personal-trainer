# Trainer SaaS API Overview

Base URL: `http://localhost:8000/api`

## Authentication

All protected routes require:

```
Authorization: Bearer {token}
```

Tenant-scoped routes also require:

```
X-Organization-Id: {organization_id}
```

### Auth endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register organization + owner |
| POST | `/auth/login` | Academy login (`email` or `phone` + `password`) — not for super admin |
| POST | `/auth/super-admin/login` | Super admin login (`email` + `password`) |
| POST | `/auth/logout` | Revoke current token |
| GET | `/auth/me` | Current user + memberships |
| POST | `/auth/forgot-password` | Password reset request |
| POST | `/auth/reset-password` | Reset with token |
| POST | `/auth/change-password` | Change password |

Login body examples:

```json
{ "email": "owner@demo.academy", "password": "Password123!", "device_name": "web" }
```

```json
{ "phone": "01000000001", "password": "Password123!", "device_name": "web" }
```

## Resources

| Area | Endpoints |
|------|-----------|
| Dashboard | `GET /dashboard` |
| Organization | `GET/PUT /organization`, `GET/PUT /organization/settings` |
| Trainees | `GET/POST /trainees`, `GET/PUT/DELETE /trainees/{id}` |
| Parents | `GET/POST /parents`, `GET/PUT/DELETE /parents/{id}` |
| Packages | `GET/POST /packages`, `GET/PUT/DELETE /packages/{id}` |
| Subscriptions | `GET/POST /subscriptions`, `GET /subscriptions/{id}`, `POST .../cancel|suspend|resume` |
| Payments | `GET/POST /payments`, `GET /payments/{id}` |
| Attendance | `GET/POST /attendance`, `POST /attendance/scan`, `POST /attendance/self-check-in`, `POST /attendance/org-qr`, `GET /attendance/my-qr` |
| Progress | `GET/POST /progress`, `GET /progress/{id}` |
| Notes | `GET/POST /notes`, `DELETE /notes/{id}` |
| Notifications | `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all` |
| Reports | `GET /reports/summary\|attendance\|subscriptions\|revenue`, `GET /reports/export` |
| Search | `GET /search?q=` |
| Profile | `GET/PUT /profile` |
| Super Admin | `GET /super-admin/organizations`, `GET .../{id}`, `PATCH .../status`, `GET/PUT /super-admin/appearance` |
| System | `GET /system/appearance` (public theme + fonts) |

## Error shape

Business rule failures return JSON:

```json
{ "message": "Attendance already recorded for this trainee, subscription, and date." }
```

with HTTP `422` (or other 4xx as appropriate).

## Rate limiting

Auth endpoints are throttled. API routes use Laravel's default API throttling.
