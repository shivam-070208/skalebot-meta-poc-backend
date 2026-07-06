# Server API reference

This document describes the HTTP endpoints exposed by this backend and how they are meant to be used.

## Base URL

- Local development: `http://localhost:3000`

## Authentication

Most protected endpoints require a bearer token or the auth cookie issued by the login flow.

## 1. Auth endpoints

### POST /api/v1/auth/register

- Purpose: create a new user account.
- Request body:
  - `email` (required): valid email address
  - `password` (required): minimum 8 characters
  - `name` (optional): display name
- Behavior:
  - validates the input
  - creates the user
  - sets the auth cookie for the client

### POST /api/v1/auth/login

- Purpose: authenticate an existing user.
- Request body:
  - `email` (required)
  - `password` (required)
- Behavior:
  - validates credentials
  - creates a session token
  - sets the auth cookie

### POST /api/v1/auth/logout

- Purpose: log out the current user.
- Behavior:
  - clears the auth cookie

### GET /api/v1/auth/me

- Purpose: get the currently authenticated user profile.
- Requires authentication.
- Behavior:
  - returns the authenticated user record from the request context

### POST /api/v1/auth/forgot-password

- Purpose: start the password reset flow.
- Request body:
  - `email` (required)
- Behavior:
  - validates the email
  - triggers the password reset service

### POST /api/v1/auth/reset-password

- Purpose: complete a password reset.
- Request body:
  - `resetToken` (required)
  - `newPassword` (required)
- Behavior:
  - validates the reset token and password
  - completes the password reset

### GET /api/v1/auth/instagram

- Purpose: start the Instagram OAuth connection flow.
- Requires authentication.
- Behavior:
  - redirects the browser to Instagram for authorization

### GET /api/v1/auth/instagram/callback

- Purpose: handle the Instagram OAuth callback.
- Query params:
  - `code` (required)
  - `state` (required)
- Behavior:
  - validates the callback
  - exchanges the code for tokens
  - connects the Instagram account to the user

## 2. Instagram account endpoints

### GET /api/v1/accounts

- Purpose: list the Instagram accounts connected to the authenticated user.
- Requires authentication.
- Query params:
  - `page` (optional)
  - `limit` (optional)
- Behavior:
  - returns connected account records for the user

### GET /api/v1/accounts/:id

- Purpose: get one connected Instagram account by id.
- Requires authentication.
- Path params:
  - `id` (required)
- Behavior:
  - returns one account record if it belongs to the current user

## 3. Post endpoints

### POST /api/v1/posts

- Purpose: create a post record and queue it for publishing when applicable.
- Requires authentication.
- Request body:
  - `account_id` (required)
  - `media_url` (required)
  - `caption` (optional)
  - `publish_type` (required): `immediately` or `scheduled`
  - `scheduled_at` (optional, required for scheduled posts)
  - `automation_rule` (optional): contains `trigger_type`, `trigger_value`, `action_type`, and `action_value`
- Behavior:
  - validates the payload
  - creates a post entry
  - triggers the publishing workflow when appropriate

### GET /api/v1/posts/:id/automation-rule

- Purpose: fetch the automation rule attached to a post.
- Requires authentication.
- Path params:
  - `id` (required)
- Behavior:
  - returns the automation rule associated with the requested post

## 4. Campaign endpoints

### POST /api/v1/campaigns

- Purpose: create a campaign with one or more content blocks and recipients.
- Requires authentication.
- Request body:
  - `name` (required)
  - `description` (optional)
  - `publish_type` (optional): `draft`, `scheduled`, or `published`
  - `scheduled_at` (optional)
  - `recipient_ids` (optional)
  - `contents` (required): array of content blocks
- Behavior:
  - validates the campaign input
  - stores the campaign
  - queues background processing if needed

### GET /api/v1/campaigns

- Purpose: list campaigns for the authenticated user.
- Requires authentication.
- Query params:
  - `page` (optional)
  - `limit` (optional)
  - `search` (optional)
  - `status` (optional)
- Behavior:
  - returns paginated campaign results

### GET /api/v1/campaigns/:id

- Purpose: get a single campaign by id.
- Requires authentication.
- Path params:
  - `id` (required)
- Behavior:
  - returns the campaign details if it belongs to the current user

### PATCH /api/v1/campaigns/:id

- Purpose: update an existing campaign.
- Requires authentication.
- Path params:
  - `id` (required)
- Behavior:
  - updates campaign fields such as name, description, contents, schedule, or recipients

### DELETE /api/v1/campaigns/:id

- Purpose: delete a campaign.
- Requires authentication.
- Path params:
  - `id` (required)
- Behavior:
  - removes the campaign for the current user

### GET /api/v1/campaigns/:id/recipients

- Purpose: fetch the recipients resolved for a campaign.
- Requires authentication.
- Path params:
  - `id` (required)
- Behavior:
  - returns recipient information tied to the campaign

### GET /api/v1/campaigns/:id/history

- Purpose: fetch campaign history placeholder data.
- Requires authentication.
- Path params:
  - `id` (required)
- Behavior:
  - returns the current history payload for the campaign

## 5. Webhook endpoints

### GET /webhooks/meta

- Purpose: verify the Meta webhook callback challenge.
- Query params:
  - `hub.mode`
  - `hub.challenge`
  - `hub.verify_token`
- Behavior:
  - responds to the Meta verification request

### POST /webhooks/meta

- Purpose: receive Meta/Instagram webhook events.
- Request body:
  - Meta webhook JSON payload
- Behavior:
  - parses the incoming event
  - routes event data through the webhook processing flow

## Notes

- The Swagger docs for these endpoints are available at `http://localhost:3000/api/docs`.
- The backend uses authentication middleware for most protected routes and relies on Redis/BullMQ workers for asynchronous work.
