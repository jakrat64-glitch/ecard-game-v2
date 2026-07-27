# Deploying to Railway

This project is two separate services — a Socket.io game server and a
Next.js client — each with its own `Dockerfile`. Railway deploys each
service from the same GitHub repo by pointing at a different root directory.

## Overview of the chicken-and-egg problem

The server needs to know the client's URL (`CLIENT_ORIGIN`, for CORS) and
the client needs to know the server's URL (`NEXT_PUBLIC_SOCKET_URL`, baked
in **at build time**). Neither URL exists until you've created the Railway
service and it's been assigned a domain. The order below avoids re-deploying
in circles.

## Step-by-step

### 1. Create a new Railway project

Push this repo to GitHub first, then in Railway: **New Project → Deploy from
GitHub repo**.

### 2. Add the server service

- **New Service → GitHub Repo** (same repo)
- **Settings → Root Directory**: `server`
- Railway will detect `server/Dockerfile` automatically (Settings → Build →
  Builder should show "Dockerfile"). If it doesn't auto-detect, set it
  explicitly.
- **Settings → Networking → Generate Domain** to get a public URL, e.g.
  `https://ecard-server-production.up.railway.app`
- **Variables**, add:
  ```
  PORT=4000
  CLIENT_ORIGIN=https://placeholder.up.railway.app
  ```
  (You'll come back and fix `CLIENT_ORIGIN` once the client's domain exists
  in step 3 — Railway does support redeploying after changing a variable,
  it just needs a second pass.)
- Deploy. Confirm it's live by visiting `https://<your-server-domain>/health`
  — you should see `{"status":"ok",...}`.

### 3. Add the client service

- **New Service → GitHub Repo** (same repo again)
- **Settings → Root Directory**: `client`
- Railway will detect `client/Dockerfile`.
- **Settings → Variables**, add:
  ```
  NEXT_PUBLIC_SOCKET_URL=https://<your-server-domain-from-step-2>
  ```
  **Critical:** this must also be added as a **Build Variable**, not just a
  runtime variable — in Railway's Variables tab, there's a toggle/section
  for build-time vs runtime env vars (the exact UI wording has changed
  across Railway versions; look for "available at build time" or a
  separate "Build Args" section). If Railway's UI in your version doesn't
  expose a build-time variable option directly, the reliable alternative is
  to reference it in `railway.toml` (see below) or pass it via the
  `dockerfilePath`/`buildArgs` field of Railway's service settings.
- **Settings → Networking → Generate Domain** to get the client's public URL.
- Deploy.

### 4. Go back and fix the server's CLIENT_ORIGIN

- Return to the **server** service's Variables.
- Update `CLIENT_ORIGIN` to the real client domain from step 3, e.g.
  `https://ecard-client-production.up.railway.app`
- Redeploy the server (Railway usually does this automatically on variable
  change; if not, trigger a manual redeploy).

### 5. Verify

Open the client's public URL in two separate browser sessions (or one
normal + one incognito window) and confirm you can create a room, join by
code, and play a full match. Also test single-player mode.

## Optional: railway.toml per service

If you'd rather pin build behavior explicitly instead of relying on
Railway's Dockerfile auto-detection, add this file at the root of each
service directory:

**server/railway.toml**
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

**client/railway.toml**
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
restartPolicyType = "ON_FAILURE"
```

## Common pitfalls

- **Client shows "connection refused" / can't reach the server**: almost
  always means `NEXT_PUBLIC_SOCKET_URL` wasn't available at *build* time
  (only runtime), so the old fallback (`http://localhost:4000`) got baked
  into the deployed bundle. Re-check the build-args configuration in step 3
  and trigger a fresh build (not just a restart — restarting won't re-run
  the build).
- **CORS errors in the browser console**: `CLIENT_ORIGIN` on the server
  doesn't exactly match the client's actual origin (including `https://`
  and no trailing slash). Copy it directly from the browser's address bar.
- **Both services show healthy but sockets never connect**: confirm
  Railway's generated domain uses HTTPS — mixing `http://` client-side
  socket URLs with an `https://` page will be blocked by the browser as
  mixed content.
