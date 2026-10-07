# Test credentials

Demo data is created by `php artisan migrate:fresh --seed` in `backend/`.

**Password for all accounts:** `Password123!`

Demo organization: **Demo Academy** (Egypt, `Africa/Cairo`, EGP)

## Accounts

| Role | Login type | Identifier |
|------|------------|------------|
| Super Admin | Email | `admin@trainer.saas` |
| Organization Owner | Email | `owner@demo.academy` |
| Trainer | Email | `trainer@demo.academy` |
| Staff | Email | `staff@demo.academy` |
| Trainee | Phone | `01000000001` |
| Parent | Phone | `01000000002` |

## How to sign in

1. Open the frontend (`http://localhost:5173/login`).
2. **Staff / Owner / Super Admin:** use the **Staff** tab → email + password.
3. **Trainee / Parent:** use the **Trainee / Parent** tab → phone + password.
4. Super Admin can also use `http://localhost:5173/super-admin/login`.

## Quick copy

```
# Owner
owner@demo.academy / Password123!

# Trainer
trainer@demo.academy / Password123!

# Staff
staff@demo.academy / Password123!

# Trainee
01000000001 / Password123!

# Parent
01000000002 / Password123!

# Super Admin
admin@trainer.saas / Password123!
```

## Reset demo data

```bash
cd backend
php artisan migrate:fresh --seed
```
