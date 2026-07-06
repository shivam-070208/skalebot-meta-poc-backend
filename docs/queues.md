# Queue overview

This backend uses BullMQ queues to process Instagram automation work asynchronously so the API remains fast and resilient.

## Why the queues exist

The request handlers create jobs and return quickly, while dedicated workers process the heavier work later. This pattern helps with:

- avoiding slow API responses during external Instagram calls
- retrying failed jobs with backoff
- keeping publishing, messaging, campaigns, and automation logic isolated

## Queue list

### 1. publish queue

- Queue name: `publish`
- Purpose: publishes a created post to Instagram.
- Trigger: when a post enters the publishing flow.
- Worker: [src/workers/publish.worker.ts](src/workers/publish.worker.ts)
- Job payload:
  - `postId`: the post to publish
  - `accountId`: the connected Instagram account used for publishing
- What happens in the worker:
  1. Loads the post and validates that it belongs to the account.
  2. Updates the post status to `publishing`.
  3. Calls the Instagram media publish service.
  4. Stores the returned external media id when available.
  5. Marks the post as `published` or `failed`.

### 2. message queue

- Queue name: `message`
- Purpose: sends a message to one Instagram recipient.
- Trigger: created by the campaign worker for each contact.
- Worker: [src/workers/message.worker.ts](src/workers/message.worker.ts)
- Job payload:
  - `accountId`
  - `recipientId`
  - `contents`: an array of message content objects such as text, image, link, or template content
- What happens in the worker:
  1. Reads the job data.
  2. Calls the Instagram messaging service.
  3. Sends the appropriate message payload to the Meta Instagram messages endpoint.

### 3. automation queue

- Queue name: `automation`
- Purpose: executes an automation action after a webhook event matches a rule.
- Trigger: when an incoming webhook event matches an automation rule.
- Worker: [src/workers/automation.worker.ts](src/workers/automation.worker.ts)
- Job payload:
  - `postId`
  - `accountId`
  - `recipientId`
  - `actionType`
  - `actionValue`
- What happens in the worker:
  1. Loads the referenced post.
  2. Executes the configured action through the automation execution service.
  3. This can result in sending a message or performing another automation step.

### 4. campaign queue

- Queue name: `campaign`
- Purpose: turns a campaign into one job per subscribed contact.
- Trigger: when a campaign is scheduled or should be delivered.
- Worker: [src/workers/campaign.worker.ts](src/workers/campaign.worker.ts)
- Job payload:
  - `campaignId`
  - `accountId`
  - `mode`
- What happens in the worker:
  1. Loads the campaign and its contents.
  2. Finds the subscribed contacts for the Instagram account.
  3. Skips contacts whose notification window has expired.
  4. Adds one `message` job per valid recipient.

## Worker startup

All workers are started together from [src/workers/index.ts](src/workers/index.ts).

## Queue configuration

The queue settings and default retry behavior are defined in [src/config/queues.ts](src/config/queues.ts).

## How jobs flow together

1. A client creates or updates a campaign or post.
2. The API enqueues one or more jobs.
3. The matching worker handles the job asynchronously.
4. External Instagram/Meta calls happen inside the worker process.
