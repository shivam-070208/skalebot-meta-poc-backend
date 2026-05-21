import type { Request, Response } from "express";

const policyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy — Skalebot</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      line-height: 1.6;
      max-width: 720px;
      margin: 0 auto;
      padding: 2rem 1.25rem;
      color: #1a1a1a;
      background: #fafafa;
    }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    h2 { font-size: 1.1rem; margin-top: 1.75rem; }
    p, li { color: #333; }
    .muted { color: #666; font-size: 0.9rem; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p class="muted">Last updated: May 2026 · Placeholder for development / Meta app review</p>

  <p>
    This is a <strong>dummy privacy policy</strong> for the Skalebot Instagram automation
    proof of concept. Replace this page with your real legal text before production.
  </p>

  <h2>Information we collect</h2>
  <p>
    When you connect your Instagram account, we may store account identifiers, profile
    information, and access tokens needed to publish content and respond to messages
    on your behalf.
  </p>

  <h2>How we use information</h2>
  <ul>
    <li>Schedule and publish Instagram posts</li>
    <li>Run automation rules (e.g. replies to comments or DMs)</li>
    <li>Authenticate you and keep your session secure</li>
  </ul>

  <h2>Data sharing</h2>
  <p>
    We use Meta (Instagram / Facebook) APIs to perform actions you authorize. We do not
    sell your personal data. Service providers (hosting, database, queue) may process
    data only to operate the app.
  </p>

  <h2>Retention & security</h2>
  <p>
    Data is retained while your account is active. We use industry-standard measures
    to protect stored credentials and tokens. You may disconnect Instagram at any time.
  </p>

  <h2>Your rights</h2>
  <p>
    You may request access, correction, or deletion of your data by contacting the
    app operator. This placeholder does not constitute legal advice.
  </p>

  <h2>Contact</h2>
  <p>
    For privacy questions, contact: <a href="mailto:privacy@example.com">privacy@example.com</a>
  </p>

  <p class="muted"><a href="/">← Back to home</a></p>
</body>
</html>`;

export const servePolicyPage = (_req: Request, res: Response): void => {
  res.type("html").send(policyHtml);
};
