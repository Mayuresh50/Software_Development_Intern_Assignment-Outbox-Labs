# ReachInbox – Email Scheduling Platform

ReachInbox is a full-stack email scheduling platform that allows users to compose, schedule, and reliably send emails at scale while respecting rate limits and provider constraints.
The system guarantees delivery even across server restarts using persistent queues.

---

## 📁 Repository Structure

```
reachinbox/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config/
│   │   ├── worker.ts
│   │   └── index.ts
│   ├── prisma/
│   ├── docker-compose.yml
│   └── package.json
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
│
└── README.md
```

---

## ⚙️ Backend Setup (Express + Prisma + Redis + BullMQ)

### 1️⃣ Prerequisites

* Node.js 18+
* Docker & Docker Compose

### 2️⃣ Start PostgreSQL & Redis

```bash
cd backend
docker-compose up -d
```

This starts:

* PostgreSQL (database)
* Redis (queue + rate limiting)

---

### 3️⃣ Environment Variables

Create `backend/.env`:

```env
PORT=4000

DATABASE_URL=postgresql://reachinbox:reachinbox_password@localhost:5432/reachinbox_db
REDIS_URL=redis://localhost:6379

JWT_SECRET=reachinbox_jwt_secret
JWT_EXPIRES_IN=7d

RATE_LIMIT_ENABLED=true
MAX_EMAILS_PER_HOUR_PER_SENDER=200
MIN_DELAY_BETWEEN_EMAILS_MS=2000

WORKER_CONCURRENCY=5
```

---

### 4️⃣ Install & Run Backend

```bash
npm install
npx prisma migrate dev
npm run dev
```

Backend runs on:

```
http://localhost:4000
```

---

### 5️⃣ Run BullMQ Worker (Required)

In a separate terminal:

```bash
npm run worker
```

The worker processes scheduled emails and sends them using Nodemailer.

---

## ✉️ Ethereal Email Setup

This project uses **Ethereal Email** for testing.

* No manual account setup required
* A test account is generated automatically at runtime
* Email preview URLs are logged in the worker output

This simulates real email delivery without sending real emails.

---

## 🎨 Frontend Setup (Next.js)

### 1️⃣ Environment Variables

Create `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

### 2️⃣ Install & Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

## 🧠 Architecture Overview

### 📌 Email Scheduling

* Emails are stored in PostgreSQL with status `SCHEDULED`
* Each email is added to a BullMQ queue with a calculated delay
* Worker processes jobs at the scheduled time

---

### 📌 Persistence on Restart

* BullMQ stores jobs in Redis
* PostgreSQL stores email metadata
* If the server or worker restarts, pending jobs remain intact
* Scheduled emails still send after restart

---

### 📌 Rate Limiting & Concurrency

* **Hourly rate limit** per sender enforced using Redis + Lua script
* **Minimum delay** between emails enforced via BullMQ limiter
* **Concurrency** controlled via BullMQ worker configuration
* If rate limit is exceeded, email is rescheduled automatically

---

## ✅ Features Implemented

### 🔧 Backend

* JWT authentication
* Email scheduling with delay
* Persistent job queue (BullMQ)
* PostgreSQL persistence (Prisma)
* Redis-based rate limiting
* Worker concurrency control
* Graceful restart handling

---

### 🎨 Frontend

* Login (mock Google OAuth)
* Dashboard view
* Scheduled & Sent email tables
* Compose email modal
* CSV/TXT recipient upload
* Real-time refresh after scheduling
* Token-based API communication

---

## 🎥 Demo Video (≤ 5 minutes)

The demo video shows:

1. Logging in
2. Composing & scheduling emails
3. Viewing Scheduled and Sent emails
4. Restarting backend/worker and showing emails still send
5. (Bonus) Rate limiting behavior under load

---

## ⚠️ Assumptions & Trade-offs

* Google OAuth is mocked for simplicity
* Ethereal Email is used instead of real SMTP
* UI prioritizes clarity over advanced styling
* Pagination is basic (can be extended)
* Error handling focuses on core flows

---

## 👤 Access

This repository is **private**.
Access has been granted to: **`Mitrajit`**

---

## 📌 Summary

ReachInbox demonstrates a production-grade approach to:

* Reliable background job processing
* Email scheduling
* Rate limiting
* System resilience

It is designed to scale and can be easily extended for real-world usage.

