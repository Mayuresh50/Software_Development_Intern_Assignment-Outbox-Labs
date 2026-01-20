# Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Git

## Step-by-Step Setup

### 1. Start Infrastructure

```bash
docker-compose up -d
```

Wait for PostgreSQL and Redis to be ready (about 10-15 seconds).

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and update JWT_SECRET with a random 32+ character string

# Generate Prisma client
npm run db:generate

# Initialize database
npm run db:push
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment (optional, defaults work for development)
cp .env.example .env.local
```

### 4. Start Services

**Terminal 1 - Backend API:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Worker (required for sending emails):**
```bash
cd backend
npm run worker
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## First Login

1. Go to http://localhost:3000
2. Click "Sign in with Google" (uses mock auth for development)
3. You'll be redirected to the dashboard

## Testing Email Scheduling

1. Click "Compose Email"
2. Fill in:
   - Sender Email: any valid email format
   - Subject: Test email
   - Body: Hello world
   - Recipients: Add one or more email addresses, or upload a CSV
3. Click "Schedule Emails"
4. Check the "Scheduled" tab to see your emails
5. Wait for the worker to process them (check the worker terminal for logs)
6. Check the "Sent" tab after emails are sent

## Notes

- **Worker is required**: Emails won't send without the worker process running
- **Ethereal Email**: Uses test SMTP service - check worker logs for preview URLs
- **Rate Limits**: Default is 200 emails/hour per sender, 2s delay between emails
- **Mock Auth**: Development uses mock Google OAuth - implement real OAuth for production

## Troubleshooting

**Database connection errors:**
- Ensure Docker containers are running: `docker-compose ps`
- Check PostgreSQL is ready: `docker-compose logs postgres`

**Redis connection errors:**
- Check Redis is running: `docker-compose logs redis`
- Verify connection: `redis-cli -h localhost -p 6379 ping`

**Emails not sending:**
- Ensure worker is running (`npm run worker` in backend/)
- Check worker logs for errors
- Verify SMTP credentials in worker logs (Ethereal auto-generates them)

**Port already in use:**
- Backend default: 3001 (change in `backend/.env`)
- Frontend default: 3000 (change by running `PORT=3002 npm run dev`)
