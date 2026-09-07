# CampusLink AI — Shared Supabase Database Onboarding Guide

This document explains how developers set up their local environment to connect to the **shared Supabase cloud PostgreSQL database**.

---

## 1. Environment Configuration

1. Copy `.env.example` to `.env` in the project root and in `apps/api/.env`:
   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   ```

2. Set the `DATABASE_URL` in both `.env` files to point to the shared Supabase project:
   ```env
   DATABASE_URL=postgresql://postgres.mjfdaffpsllhfhxonnxt:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   ```
   *(Replace `[YOUR-PASSWORD]` with the actual Supabase database password provided by your team lead).*

> [!CAUTION]
> **CRITICAL SECURITY RULE**: NEVER commit `.env` or any database passwords to GitHub. Both `.env` and `apps/api/.env` are listed in `.gitignore`.

---

## 2. Database Migrations

Both developers share the **same live database schema**. Schema changes are managed via Alembic.

### Applying Existing Migrations
To ensure your connection has the latest schema:
```bash
cd apps/api
.\.venv\Scripts\activate  # or source .venv/bin/activate
alembic upgrade head
```

### Adding New Migrations
When adding new models or changing table schemas:
1. Make your model changes in `app/models/`.
2. Generate a migration script:
   ```bash
   alembic revision --autogenerate -m "describe your changes"
   ```
3. Inspect the generated script under `apps/api/migrations/versions/`.
4. Apply the migration:
   ```bash
   alembic upgrade head
   ```
5. Commit the migration version file to Git so your teammate can run `alembic upgrade head`.

---

## 3. Starting the Application

You do **NOT** need to run `docker compose up db` for local database hosting when connected to Supabase.

Start the API backend directly:
```bash
cd apps/api
uvicorn app.main:app --reload --port 8000
```

Start the Web frontend:
```bash
cd apps/web
npm run dev
```

---

## 4. Verifying Shared Database Connectivity

To verify that your backend is connected to the shared Supabase cloud database:

Run the python database test script:
```bash
cd apps/api
python -c "from app.db.session import SyncSessionLocal; from sqlalchemy import text; db = SyncSessionLocal(); print(db.execute(text('SELECT current_database(), inet_server_addr();')).fetchone()); db.close()"
```
Output will show the Supabase server details rather than `localhost`.

---

## 5. Offline Local Development Fallback

If you need to develop offline without internet access:
1. Start the local Docker PostgreSQL container:
   ```bash
   docker compose up db -d
   ```
2. Temporarily set your `.env` `DATABASE_URL` to:
   ```env
   DATABASE_URL=postgresql+psycopg://campuslink:campuslink_dev_pass@localhost:5433/campuslink_db
   ```
