import type { Request, Response } from "express";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Skalebot Meta POC Backend API",
    version: "1.0.0",
    description:
      "Swagger documentation for the Instagram automation backend, including auth, campaigns, posts, and webhook endpoints.",
  },
  servers: [
    { url: "http://localhost:3000", description: "Local development server" },
  ],
  tags: [
    {
      name: "Auth",
      description:
        "User authentication, password recovery, and Instagram OAuth",
    },
    {
      name: "Accounts",
      description: "Instagram accounts linked to the authenticated user",
    },
    { name: "Posts", description: "Post creation and automation rule lookup" },
    {
      name: "Campaigns",
      description: "Campaign lifecycle and recipient management",
    },
    {
      name: "Webhooks",
      description: "Instagram and Meta webhook verification and events",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Validation failed" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          password: { type: "string", minLength: 8, example: "strongpass123" },
          name: { type: "string", example: "Ada Lovelace" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          password: { type: "string", example: "strongpass123" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["resetToken", "newPassword"],
        properties: {
          resetToken: { type: "string", example: "reset-token-123" },
          newPassword: { type: "string", example: "newStrongPass123" },
        },
      },
      CreatePostRequest: {
        type: "object",
        required: ["account_id", "media_url", "publish_type"],
        properties: {
          account_id: { type: "string", example: "acc_123" },
          media_url: {
            type: "string",
            example: "https://cdn.example.com/post.jpg",
          },
          caption: { type: "string", example: "Launching our new campaign" },
          publish_type: {
            type: "string",
            enum: ["immediately", "scheduled"],
            example: "immediately",
          },
          scheduled_at: {
            type: "string",
            format: "date-time",
            example: "2026-07-10T10:00:00.000Z",
          },
          automation_rule: {
            type: "object",
            properties: {
              trigger_type: { type: "string", example: "comment" },
              trigger_value: { type: "string", example: "@skalebot" },
              action_type: { type: "string", example: "reply" },
              action_value: {
                type: "string",
                example: "Thanks for your comment",
              },
            },
          },
        },
      },
      CreateCampaignRequest: {
        type: "object",
        required: ["name", "contents"],
        properties: {
          name: { type: "string", example: "Welcome campaign" },
          description: { type: "string", example: "Automated welcome flow" },
          publish_type: {
            type: "string",
            enum: ["draft", "scheduled", "published"],
            example: "draft",
          },
          scheduled_at: {
            type: "string",
            format: "date-time",
            example: "2026-07-10T12:00:00.000Z",
          },
          recipient_ids: {
            type: "array",
            items: { type: "string" },
            example: ["contact_1", "contact_2"],
          },
          contents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                content_type: {
                  type: "string",
                  enum: ["text", "link", "image", "video", "template"],
                  example: "text",
                },
                text_content: { type: "string", example: "Hi there!" },
                media_url: {
                  type: "string",
                  example: "https://cdn.example.com/banner.png",
                },
                link_url: { type: "string", example: "https://example.com" },
                buttons: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string", example: "Open" },
                      action_type: {
                        type: "string",
                        enum: ["open_url", "reply", "trigger_post"],
                        example: "open_url",
                      },
                      action_value: {
                        type: "string",
                        example: "https://example.com",
                      },
                      position: { type: "number", example: 1 },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description: "Creates a new user account and issues an auth cookie.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
              example: {
                email: "user@example.com",
                password: "strongpass123",
                name: "Ada Lovelace",
              },
            },
          },
        },
        responses: {
          "201": { description: "User created successfully" },
          "400": {
            description: "Invalid request body",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login a user",
        description: "Authenticates a user and sets the access cookie.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: {
                email: "user@example.com",
                password: "strongpass123",
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout the current user",
        description: "Clears the authentication cookie.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Logout successful" },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the authenticated user profile",
        description: "Returns the currently logged-in user details.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Authenticated user returned" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset",
        description: "Starts the password reset flow for an account.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
              example: { email: "user@example.com" },
            },
          },
        },
        responses: {
          "200": { description: "Password reset request accepted" },
          "400": { description: "Invalid email" },
        },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset a password",
        description: "Completes password reset using a reset token.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
              example: {
                resetToken: "reset-token-123",
                newPassword: "newStrongPass123",
              },
            },
          },
        },
        responses: {
          "200": { description: "Password reset successful" },
          "400": { description: "Invalid reset token" },
        },
      },
    },
    "/api/v1/auth/instagram": {
      get: {
        tags: ["Auth"],
        summary: "Start Instagram OAuth",
        description: "Redirects the user to the Instagram OAuth authorize URL.",
        security: [{ bearerAuth: [] }],
        responses: {
          "302": { description: "Redirect to Instagram OAuth" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/auth/instagram/callback": {
      get: {
        tags: ["Auth"],
        summary: "Handle Instagram OAuth callback",
        description:
          "Receives the Instagram OAuth callback and links the account.",
        security: [],
        parameters: [
          {
            name: "code",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "state",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Instagram account connected" },
          "400": { description: "OAuth callback validation failed" },
        },
      },
    },
    "/api/v1/accounts": {
      get: {
        tags: ["Accounts"],
        summary: "List Instagram accounts",
        description:
          "Lists the Instagram accounts connected to the authenticated user.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", example: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", example: 20 },
          },
        ],
        responses: {
          "200": { description: "Instagram accounts fetched" },
        },
      },
    },
    "/api/v1/accounts/{id}": {
      get: {
        tags: ["Accounts"],
        summary: "Get an Instagram account",
        description: "Returns a single Instagram account by its identifier.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Instagram account fetched" },
          "404": { description: "Account not found" },
        },
      },
    },
    "/api/v1/posts": {
      post: {
        tags: ["Posts"],
        summary: "Create a post",
        description:
          "Creates a post and queues it for Instagram publishing when applicable.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePostRequest" },
              example: {
                account_id: "acc_123",
                media_url: "https://cdn.example.com/post.jpg",
                caption: "Launching our new campaign",
                publish_type: "immediately",
                automation_rule: {
                  trigger_type: "comment",
                  trigger_value: "@skalebot",
                  action_type: "reply",
                  action_value: "Thanks for your comment",
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Post created" },
          "400": { description: "Invalid request body" },
        },
      },
    },
    "/api/v1/posts/{id}/automation-rule": {
      get: {
        tags: ["Posts"],
        summary: "Get automation rule for a post",
        description:
          "Returns the automation rule attached to the specified post.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Automation rule fetched" },
          "404": { description: "Post not found" },
        },
      },
    },
    "/api/v1/campaigns": {
      post: {
        tags: ["Campaigns"],
        summary: "Create a campaign",
        description:
          "Creates a campaign with message contents and optional recipients.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCampaignRequest" },
              example: {
                name: "Welcome campaign",
                description: "Automated welcome flow",
                publish_type: "draft",
                recipient_ids: ["contact_1", "contact_2"],
                contents: [
                  {
                    content_type: "text",
                    text_content: "Hi there!",
                  },
                ],
              },
            },
          },
        },
        responses: {
          "201": { description: "Campaign created" },
          "400": { description: "Invalid request body" },
        },
      },
      get: {
        tags: ["Campaigns"],
        summary: "List campaigns",
        description: "Lists campaigns for the authenticated user.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", example: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", example: 20 },
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string", example: "welcome" },
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", example: "draft" },
          },
        ],
        responses: {
          "200": { description: "Campaigns fetched" },
        },
      },
    },
    "/api/v1/campaigns/{id}": {
      get: {
        tags: ["Campaigns"],
        summary: "Get a campaign",
        description: "Returns a single campaign by its identifier.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Campaign fetched" },
          "404": { description: "Campaign not found" },
        },
      },
      patch: {
        tags: ["Campaigns"],
        summary: "Update a campaign",
        description: "Updates campaign metadata, contents, or recipients.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                name: "Updated welcome campaign",
                publish_type: "scheduled",
                scheduled_at: "2026-07-10T12:00:00.000Z",
              },
            },
          },
        },
        responses: {
          "200": { description: "Campaign updated" },
          "400": { description: "Invalid request body" },
        },
      },
      delete: {
        tags: ["Campaigns"],
        summary: "Delete a campaign",
        description: "Deletes a campaign owned by the authenticated user.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Campaign deleted" },
          "404": { description: "Campaign not found" },
        },
      },
    },
    "/api/v1/campaigns/{id}/recipients": {
      get: {
        tags: ["Campaigns"],
        summary: "Get campaign recipients",
        description: "Returns the recipients resolved for a campaign.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Campaign recipients fetched" },
        },
      },
    },
    "/api/v1/campaigns/{id}/history": {
      get: {
        tags: ["Campaigns"],
        summary: "Get campaign history",
        description: "Returns the history placeholder data for a campaign.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Campaign history fetched" },
        },
      },
    },
    "/webhooks/meta": {
      get: {
        tags: ["Webhooks"],
        summary: "Verify Meta webhook",
        description: "Handles the webhook verification challenge from Meta.",
        security: [],
        parameters: [
          { name: "hub.mode", in: "query", schema: { type: "string" } },
          { name: "hub.challenge", in: "query", schema: { type: "string" } },
          { name: "hub.verify_token", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Webhook verification response" },
        },
      },
      post: {
        tags: ["Webhooks"],
        summary: "Receive Meta webhook event",
        description: "Receives Instagram or Meta webhook payloads.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                object: "instagram",
                entry: [
                  {
                    messaging: [
                      {
                        sender: { id: "123456" },
                        recipient: { id: "7890" },
                        timestamp: 1710000000000,
                        message: { text: "hello" },
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
        responses: {
          "200": { description: "Webhook event acknowledged" },
        },
      },
    },
  },
} as const;

export const swaggerJson = (req: Request, res: Response): void => {
  res.json(swaggerSpec);
};
