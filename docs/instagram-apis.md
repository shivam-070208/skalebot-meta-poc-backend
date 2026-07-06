# Instagram APIs and Meta integrations

This backend uses the Instagram Graph API and Meta webhook endpoints to connect accounts, publish content, and send conversational messages.

## API-by-API breakdown

### 1. OAuth and account connection

- What it does: starts the Instagram OAuth flow, exchanges the code for tokens, fetches the account profile, and stores the connected account.
- Payloads expected:
  - The OAuth start route does not require a request body; it redirects the browser to Instagram.
  - The callback expects query params: `code` and `state`.
- How it uses Meta/Instagram APIs:
  1. Opens the Instagram authorization URL.
  2. Exchanges the authorization code for a short-lived access token.
  3. Exchanges the short-lived token for a long-lived token.
  4. Calls the Instagram profile endpoint to read the user id, username, and profile picture.
- Official docs:
 Login with instagram: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login
 Login with facebook :https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-facebook-login
### 2. Profile lookup

- What it does: reads the connected Instagram profile metadata after OAuth completes.
- Payloads expected: no body; it uses the access token from the connected account.
- How it uses Meta/Instagram APIs: calls the `/me` Graph API endpoint with the access token.
- Official docs:


### 3. Webhook subscription

- What it does: subscribes the app to Instagram/Meta webhook events for comments and messages.
- Payloads expected: no body for the route itself; the app sends the Instagram user id and access token to Meta.
- How it uses Meta/Instagram APIs: POSTs to the subscribed apps endpoint for the connected account.
- Official docs:


### 4. Media publishing

- What it does: publishes a post image to Instagram by creating a media container and then publishing it.
- Payloads expected:
  - The backend uses the stored post and account data; no request body is required from the client for this step.
  - The post must include a valid `media_url` and the account must have a stored access token.
- How it uses Meta/Instagram APIs:
  1. Calls the media container creation endpoint.
  2. Uses the returned creation id to publish the media.
- Official docs:
  - Create media container: https://developers.facebook.com/docs/instagram-api/reference/ig-media/
  - Publish media:https://developers.facebook.com/documentation/instagram-platform/content-publishing

### 5. Messaging API

- What it does: sends campaign or automation messages to Instagram users.
- Payloads expected:
  - `recipient.id` for the Instagram user.
  - A message payload containing text, image attachment, link template, or button template content.
- How it uses Meta/Instagram APIs: sends HTTP requests to the Instagram messages endpoint.
- Official docs:
  - Instagram Messaging API: https://developers.facebook.com/documentation/business-messaging/instagram-messaging

## Where these flows are used in the code

- OAuth and profile handling: [src/services/instagram-oauth.service.ts](src/services/instagram-oauth.service.ts)
- Media publish: [src/services/instagram-publish.service.ts](src/services/instagram-publish.service.ts)
- Message sending: [src/services/instagram-message.service.ts](src/services/instagram-message.service.ts)
- Webhook handling: [src/webhooks/meta-parser.ts](src/webhooks/meta-parser.ts)

## Notes

- The app uses the Graph API version configured by the environment variable `INSTAGRAM_GRAPH_API_VERSION`.
- Proper Meta app credentials, redirect URL, and token storage are required for these flows to work.
