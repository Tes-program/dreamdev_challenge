# DreamDevs Code Challenge

**Author**: Teslim Odumuyiwa


## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Data Ingestion](#data-ingestion)
- [Data Quality & Assumptions](#data-quality--assumptions)
- [Architecture Decisions](#architecture-decisions)


## Overview

This project is a backend service built with Node.js, Express, and TypeScript that processes merchant activity data from CSV files. It includes a script to seed the database with activity records, ensuring data integrity through validation and upsert operations. The service provides 5 endpoints to provide insights and analytics on merchant activities, such as monthly active merchants, channel distribution, and status breakdowns. 

**Note**: ⚠️ Please read the personal notes at the end of this document for important context on assumptions made and challenges faced during development.

## Tech Stack

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- csv-parser for data ingestion
- dotenv for configuration

## Project Structure

```
src/
├── controllers/        # Request/response handling
├── enums/              # Strongly typed enums for all fixed-value fields
├── middlewares/        # Error handler, request validation
├── routes/             # API route definitions
├── scripts/            # Seed script for CSV ingestion
├── services/           # Business logic and database queries
├── types/              # TypeScript interfaces and response types
├── utils/              # Prisma client, CSV parser, response helpers
├── app.ts
└── index.ts
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- Git

### Steps

1. **Clone the repository**
```bash
git clone 
cd 
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```
Open `.env` and set your database connection:
```env
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/dreamdevs_db"
PORT=8080
```

4. **Create the database**
```bash
psql -U postgres -c "CREATE DATABASE dreamdevs_db;"
```

5. **Run database migrations**
```bash
npx prisma migrate dev
```

6. **Place CSV files in the data directory**

CSV files must follow the naming convention:

> ⚠️ CSV data files are not included in this repository due to 
> file size (102MB). Place your activity CSV files in `src/data/` 
> before running the seed script.

```
src/data/activities_YYYYMMDD.csv
```
7. **Seed the database**
```bash
npm run seed:data
```
Expected output:
```
  Seed Complete
  Files processed : 31
  Records ingested: 849372
  Records skipped : 303
```

8. **Start the server**
```bash
npm run dev
```

Server starts at `http://localhost:8080`.

## API Endpoints

### `GET /analytics/top-merchant`
Returns the merchant with the highest total successful transaction 
amount across all products.

**Response:**
```json
{
    "merchant_id": "MRC-009405",
    "total_volume": 181479333.57
}
```

---

### `GET /analytics/monthly-active-merchants`
Returns the count of unique merchants with at least one successful 
event per month.

**Response:**
```json
{
    "2023-12": 244,
    "2024-01": 9847
}
```

---

### `GET /analytics/product-adoption`
Returns unique merchant count per product, sorted by count descending.

**Response:**
```json
{
    "BILLS": 4379,
    "SAVINGS": 4368,
    "POS": 4348,
    "AIRTIME": 4277,
    "MONIEBOOK": 4267,
    "CARD_PAYMENT": 4233,
    "KYC": 4167
}
```

---

### `GET /analytics/kyc-funnel`
Returns the KYC conversion funnel — unique merchants at each stage 
for successful events only.

**Response:**
```json
{
    "documents_submitted": 3760,
    "verifications_completed": 3389,
    "tier_upgrades": 2496
}
```

---

### `GET /analytics/failure-rates`
Returns failure rate per product: `(FAILED / (SUCCESS + FAILED)) x 100`.
PENDING events are excluded. Sorted by rate descending.

**Response:**
```json
[
  { "product": "BILLS", "failure_rate": 5.3 },
  { "product": "AIRTIME", "failure_rate": 5.2 },
  { "product": "CARD_PAYMENT", "failure_rate": 5.2 },
  { "product": "KYC", "failure_rate": 5.2 },
  { "product": "MONIEBOOK", "failure_rate": 5.2 },
  { "product": "POS", "failure_rate": 5.2 },
  { "product": "SAVINGS", "failure_rate": 5.2 }
]
```

## Testing with cURL

```bash
# Health check
curl http://localhost:8080/

# Top merchant by volume
curl http://localhost:8080/analytics/top-merchant

# Monthly active merchants
curl http://localhost:8080/analytics/monthly-active-merchants

# Product adoption
curl http://localhost:8080/analytics/product-adoption

# KYC funnel
curl http://localhost:8080/analytics/kyc-funnel

# Failure rates
curl http://localhost:8080/analytics/failure-rates

# Unknown route (should return 404 JSON)
curl http://localhost:8080/nonexistent
```

## Data Ingestion

The seed script (`src/scripts/seed-data.ts`) reads all `activities_YYYYMMDD.csv` files from `src/data/`, validates each row, and upserts in batches of 1,000. Safe to re-run — duplicates are skipped.

**Records are discarded** if `event_id`, `merchant_id`, `product`, or `status` is missing — these are required for the analytics to work.

**Records with bad timestamps** get a sentinel date (`1970-01-01`) instead of being thrown out, so they still count toward non-time-based queries.

| Field | Default | Why |
|---|---|---|
| `event_type` | `UNKNOWN` | Not critical to any endpoint |
| `channel` | `UNKNOWN` | Not used in the 5 endpoints |
| `merchant_tier` | `STARTER` | Safe default for unverified merchants |
| `region` | `UNKNOWN` | Not used in the 5 endpoints |
| `amount` | `0` | Non-monetary events have no amount |

Monetary values are stored as `Decimal(15,2)`. Failure rates are rounded to 1 decimal place. Monthly active merchant counts exclude sentinel-dated records.

## Architecture Notes

- **Layered design**: Routes → Controllers → Services → Prisma → DB. Each layer does one thing.
- **Typed enums**: All fixed-value fields use TypeScript enums validated at ingestion and query time.
- **Exact response shapes**: Service return types match the spec — no wrapper objects.
- **DB indexes**: On `merchant_id`, `product`, `status`, and `event_timestamp` for query performance.
- **Batch upserts**: 1,000 records per transaction, balancing memory and speed.

## Personal Notes and Assumptions

This are some of the assumptions I made and challenges I faced during development:

- **Null `merchant_id`** — discarded (127 of 849,372). Every endpoint aggregates by merchant, so no identity = no value.
- **Bad/missing timestamps** — stored with sentinel `1970-01-01` instead of discarded. Only monthly-active-merchants needs a real date; the other 4 endpoints still benefit from these records.
- **Non-critical nulls** — `channel`, `region`, `merchant_tier` default to `UNKNOWN`/`STARTER` to avoid unnecessary record loss.
- **Enum validation** — unrecognised `product` or `status` values discard the record. Unrecognised `event_type` or `channel` fall back to `UNKNOWN`.
- **Failure rate** — `(FAILED / (SUCCESS + FAILED)) x 100`, rounded to 1 decimal place. PENDING excluded.
- **Performance** — batch upserts of 1,000, DB indexes on key columns, all aggregation done in PostgreSQL.
