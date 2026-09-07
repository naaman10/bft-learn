# BFT Learn

Student learning portal for BFT tuition. This Next.js app handles sign-in with [Neon Auth](https://neon.com/docs/auth/quick-start/nextjs-api-only). Learning content will come from a separate API.

## Prerequisites

- Node.js 20.9 or later
- A [Neon](https://console.neon.tech) project with Auth enabled

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env file and fill in Neon values:

   ```bash
   cp .env.example .env.local
   ```

3. In the Neon Console, open your project → **Auth** → **Configuration** and copy the Auth URL into `NEON_AUTH_BASE_URL`.

4. Generate a cookie secret (32+ characters) and set `NEON_AUTH_COOKIE_SECRET`:

   ```bash
   openssl rand -base64 32
   ```

5. Create a test user in the Neon Console (Auth → Users). This portal has no public sign-up page.

6. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Unauthenticated visits go to `/auth/sign-in`; a successful login lands on `/dashboard`.

Safari blocks third-party cookies on non-HTTPS localhost. If sign-in fails in Safari, use:

```bash
npm run dev -- --experimental-https
```

and open `https://localhost:3000`.

## Auth and the future API

Login lives in this app. Neon Auth issues an HTTP-only session cookie and a JWT. When the content API exists, this portal will send that JWT as `Authorization: Bearer …`. The API should verify it against `{NEON_AUTH_BASE_URL}/.well-known/jwks.json`.
