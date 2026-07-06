# skalebot-meta-poc-backend

This project is a TypeScript/Express backend for Instagram automation workflows. It supports user authentication, Instagram account connection, post publishing, campaign messaging, and webhook-driven automation.

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL
- Redis
- A Meta/Instagram app with OAuth credentials

## Environment variables

Create a `.env` file in the project root with values such as:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/skalebot
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=replace-with-a-secure-secret
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/v1/auth/instagram/callback
INSTAGRAM_OAUTH_SCOPE=business_basic
INSTAGRAM_GRAPH_API_VERSION=v25.0
```

## Install dependencies

```bash
npm install
```

## Run the app

### Start the API server

```bash
npm run dev
```

The backend will run on `http://localhost:3000`.

### Start the worker processes

```bash
npm run worker:dev
```

This starts the BullMQ workers that process publishing, messaging, automation, and campaign jobs.

## Database setup

Run the migrations before first use:

```bash
npm run db:push
```

## API documentation

### Swagger UI

Swagger documentation is available at:

- `http://localhost:3000/api/docs`
- `http://localhost:3000/api/docs/swagger.json`

The Swagger UI documents the available API endpoints, request payload examples, and response expectations.

### Additional docs

- [docs/instagram-apis.md](docs/instagram-apis.md) explains the Instagram/Meta APIs used by the backend
- [docs/queues.md](docs/queues.md) explains the queue and worker flow in detail

## Main API areas

- Authentication: `/api/v1/auth`
- Instagram accounts: `/api/v1/accounts`
- Posts: `/api/v1/posts`
- Campaigns: `/api/v1/campaigns`
- Webhooks: `/webhooks/meta`

## Build

```bash
npm run build
```
