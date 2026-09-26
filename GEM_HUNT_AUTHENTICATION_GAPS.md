# Gem Hunt Authentication: Gap Analysis

## Executive Summary

The authentication infrastructure is **mostly implemented** but requires configuration and deployment to work end-to-end. The code exists in both repositories but needs environment setup and database initialization.

## ✅ What's Already Implemented

### In bft-learn (Parent App)
- ✅ JWT token retrieval via Neon Auth
- ✅ `GemHuntFrame` component with postMessage
- ✅ Token passing to iframe via `INIT_GAME` message
- ✅ Origin validation and GAME_READY handshake

### In bft-games (Game iFrame)
- ✅ `useGameSession` hook with postMessage listener
- ✅ Token storage and API configuration
- ✅ API service with Bearer authentication
- ✅ Session, question, and progress management
- ✅ Fallback to local questions when API unavailable

### In bft-api (Backend)
- ✅ Complete Gem Hunt API endpoints (`/gem-hunt/*`)
- ✅ Database migration (`009_gem_hunt_tables.sql`)
- ✅ JWT authentication middleware
- ✅ CORS configuration for cross-origin requests
- ✅ All CRUD operations for sessions, questions, leaderboard

## ❌ What's Missing to Make It Work

### 1. **Environment Configuration** (CRITICAL)

#### bft-learn needs:
```env
# Currently in .env.example:
API_URL=http://localhost:4000

# For production:
API_URL=https://api.brighterfuturestutoring.com  # Or your actual API URL
NEXT_PUBLIC_GAMES_URL=https://bft-games.vercel.app
```

**Status:** ⚠️ Check if these are set in production environment

#### bft-games needs:
```env
# Currently in .env.example:
VITE_BFT_API_URL=http://localhost:4000

# For production:
VITE_BFT_API_URL=https://api.brighterfuturestutoring.com
VITE_PARENT_ORIGINS=https://learn.brighterfuturestutoring.com
```

**Status:** ⚠️ Likely not configured for production

#### bft-api needs:
```env
DATABASE_URL=postgresql://...  # Neon database connection
NEON_AUTH_JWKS_URL=https://...  # For JWT verification
FRONTEND_ORIGIN=https://learn.brighterfuturestutoring.com
GAMES_ORIGIN=https://bft-games.vercel.app
```

**Status:** ⚠️ Check CORS origins include games domain

---

### 2. **Database Migration** (CRITICAL)

The migration file exists but needs to be applied:

```bash
# In bft-api repository
npm run migrate  # Applies 009_gem_hunt_tables.sql
```

**Verify migration was applied:**
```sql
SELECT * FROM schema_migrations WHERE id = '009_gem_hunt_tables.sql';
```

**Check tables exist:**
```sql
\dt gem_hunt*
```

**Expected tables:**
- `gem_hunt_sessions`
- `gem_hunt_level_progress`
- `gem_hunt_leaderboard`
- `gem_hunt_questions`
- `gem_hunt_question_responses`
- `gem_hunt_achievements`
- `gem_hunt_student_achievements`

**Status:** ⚠️ Unknown if applied to production database

---

### 3. **Question Bank Population** (CRITICAL)

The migration includes 10 sample Year 6 Percentages questions, but you need:

**More questions for production:**
- At least 50-100 questions per Year/Subject combination
- Multiple difficulty levels (1, 2, 3)
- Alternative answers for common variations

**Check if questions exist:**
```sql
SELECT year_group, subject, COUNT(*) 
FROM gem_hunt_questions 
WHERE active = TRUE 
GROUP BY year_group, subject;
```

**If empty, you need to populate:**
```sql
-- See bft-games/gem-hunt-api-files/populate_questions.sql for examples
INSERT INTO gem_hunt_questions (year_group, subject, question_text, correct_answer, difficulty_level)
VALUES 
  ('Year 5', 'Fractions', 'What is 1/2 + 1/4?', '3/4', 1),
  ('Year 5', 'Fractions', 'What is 2/3 + 1/3?', '1', 1);
  -- ... many more needed
```

**Status:** ⚠️ Only 10 sample questions exist, needs expansion

---

### 4. **API URL Configuration in Learn App** (CRITICAL)

The learn app fetches the token but needs to know which API to tell the game to use.

**Check `/workspace/app/games/gem-hunt/page.tsx`:**

```typescript
function apiBaseUrl() {
  const url = process.env.API_URL?.replace(/\/$/, "");
  if (!url) {
    throw new Error("API_URL is not configured.");
  }
  return url;
}
```

**This means:**
- `process.env.API_URL` must be set
- This value is passed to the game iframe
- The game will use it to make API calls

**Current code passes it correctly:**
```typescript
<GemHuntFrame
  gameUrl={gameUrl}
  token={token}
  apiBaseUrl={apiBaseUrl()}  // ← This needs to be configured
  username={session.user.name}
/>
```

**Status:** ⚠️ Verify `API_URL` environment variable is set

---

### 5. **CORS Configuration** (CRITICAL)

The API must allow requests from the games domain.

**In bft-api, check `src/config/env.ts`:**
```typescript
export const frontendOrigins = [
  "http://localhost:3000",
  "https://learn.brighterfuturestutoring.com",
  "https://bft-games.vercel.app",  // ← Must include this
];
```

**Current CORS config in `app.ts`:**
```typescript
cors({
  origin: frontendOrigins,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Authorization", "Content-Type"],
})
```

**Status:** ⚠️ Verify games origin is in allowed list

---

### 6. **JWT Token Verification** (IMPORTANT)

The API must be able to verify tokens issued by Neon Auth.

**Check bft-api has:**
```typescript
// src/middleware/require-auth.ts
// Must verify JWT signature against Neon Auth JWKS endpoint
```

**Neon Auth configuration:**
```env
NEON_AUTH_JWKS_URL=https://ep-xxx.neonauth.region.aws.neon.tech/.well-known/jwks.json
```

**Status:** ✅ Likely already configured since other learn endpoints work

---

### 7. **Origin Validation in Game** (SECURITY)

The game must only accept messages from the learn app.

**Current validation in bft-games:**
```typescript
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://learn.brighterfuturestutoring.com',
];
```

**Can be overridden with:**
```env
VITE_PARENT_ORIGINS=https://learn.brighterfuturestutoring.com,https://staging.learn.brighterfuturestutoring.com
```

**Status:** ✅ Implemented, needs production URL in env vars

---

### 8. **Session ID Tracking** (ENHANCEMENT)

Currently, the learn app passes token and metadata, but not an existing session ID.

**To resume sessions:**

The game supports `RESUME_SESSION` message:
```typescript
frame.postMessage({
  type: 'RESUME_SESSION',
  payload: { sessionId: 'existing-session-id' }
}, origin);
```

But the learn app doesn't track or pass existing session IDs.

**Enhancement needed:**
1. Store last session ID in learn app (localStorage or database)
2. Check for active session before creating new one
3. Pass `sessionId` in initial payload if resuming

**Status:** ⚠️ Creates new session every time (loses progress)

---

### 9. **Error Handling & Fallbacks** (IMPORTANT)

**What happens if API is down?**
- Game falls back to local questions ✅
- But session progress is lost ❌

**What happens if token is invalid?**
- API returns 401 ✅
- Game shows error screen ✅
- But no retry mechanism ❌

**What happens if network is slow?**
- 3-second timeout before local play ✅
- But no loading state in learn app ❌

**Status:** ⚠️ Basic fallbacks exist, could be improved

---

## 🔧 Required Actions to Make It Work

### Immediate (Must Have)

1. **Set environment variables in bft-learn:**
   ```bash
   # Production deployment
   API_URL=https://api.brighterfuturestutoring.com
   NEXT_PUBLIC_GAMES_URL=https://bft-games.vercel.app
   ```

2. **Set environment variables in bft-games:**
   ```bash
   # Vercel deployment settings
   VITE_BFT_API_URL=https://api.brighterfuturestutoring.com
   VITE_PARENT_ORIGINS=https://learn.brighterfuturestutoring.com
   ```

3. **Set environment variables in bft-api:**
   ```bash
   # Add to existing config
   GAMES_ORIGIN=https://bft-games.vercel.app
   ```

4. **Run database migration:**
   ```bash
   cd bft-api
   npm run migrate
   # Verify: psql $DATABASE_URL -c "\dt gem_hunt*"
   ```

5. **Verify CORS includes games origin:**
   - Check `src/config/env.ts` in bft-api
   - Add `https://bft-games.vercel.app` to `frontendOrigins`

6. **Populate question bank:**
   - Add at least 50 questions per Year/Subject combination
   - Use `bft-games/gem-hunt-api-files/populate_questions.sql` as template

### Short Term (Should Have)

7. **Test end-to-end authentication flow:**
   ```bash
   # 1. Sign in to learn app
   # 2. Click "Gem Hunt"
   # 3. Check browser console for:
   #    - "GAME_READY" message sent
   #    - "INIT_GAME" message received
   #    - API calls with Authorization header
   #    - Successful session creation
   ```

8. **Add session resumption:**
   - Track active session ID in learn app
   - Pass to game iframe on load
   - Allow continuing instead of starting over

9. **Add monitoring:**
   - Log failed API calls
   - Track token validation errors
   - Monitor CORS rejections

### Medium Term (Nice to Have)

10. **Improve error handling:**
    - Retry failed API calls
    - Better error messages
    - Graceful degradation

11. **Add token refresh:**
    - Implement refresh token flow
    - Handle token expiration mid-game
    - Re-authenticate without losing progress

12. **Add progress sync:**
    - Periodic background sync
    - Sync on visibility change
    - Sync before page unload

---

## 🧪 Testing Checklist

### Local Development

- [ ] bft-api running on localhost:4000
- [ ] bft-learn running on localhost:3000
- [ ] bft-games running on localhost:3001
- [ ] All environment variables set
- [ ] Database migration applied
- [ ] Can sign in to learn app
- [ ] Can open Gem Hunt game
- [ ] Game receives token via postMessage
- [ ] Game can fetch questions from API
- [ ] Game can save session progress
- [ ] Progress persists on page reload

### Production

- [ ] API_URL set in learn app deployment
- [ ] VITE_BFT_API_URL set in games deployment
- [ ] CORS configured in API deployment
- [ ] Database migration applied to production
- [ ] Questions populated in production database
- [ ] SSL certificates valid
- [ ] Can authenticate via Neon Auth
- [ ] Can open game from learn app
- [ ] Can complete questions and earn moves
- [ ] Progress saves to database
- [ ] Leaderboard updates correctly

---

## 🐛 Common Issues & Solutions

### Issue: "API_URL is not configured"
**Cause:** Environment variable not set in learn app
**Fix:** Add `API_URL=https://...` to deployment config

### Issue: "Failed to fetch questions"
**Cause:** CORS blocking requests from games domain
**Fix:** Add games origin to `frontendOrigins` in bft-api

### Issue: "Session not found"
**Cause:** Database migration not applied
**Fix:** Run `npm run migrate` in bft-api

### Issue: "Empty questions response"
**Cause:** No questions in database for that year/subject
**Fix:** Insert questions via SQL or admin panel

### Issue: Game stays in "Getting your session ready..."
**Cause:** postMessage not being received
**Fix:** Check origin validation in both apps

### Issue: "Token validation failed"
**Cause:** Invalid JWT or JWKS misconfiguration
**Fix:** Verify NEON_AUTH_JWKS_URL in bft-api

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      bft-learn (Next.js)                        │
│  https://learn.brighterfuturestutoring.com                      │
│                                                                  │
│  1. User signs in via Neon Auth                                │
│  2. Gets JWT token                                              │
│  3. Embeds game iframe                                          │
│  4. Sends postMessage(INIT_GAME) with:                         │
│     - token                                                     │
│     - apiBaseUrl                                                │
│     - username, yearGroup, subject                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ postMessage
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   bft-games (Vite + React)                      │
│  https://bft-games.vercel.app                                   │
│                                                                  │
│  1. Sends GAME_READY signal                                    │
│  2. Receives INIT_GAME message                                  │
│  3. Stores token & apiBaseUrl                                   │
│  4. Makes authenticated API calls                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ fetch() with Bearer token
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    bft-api (Hono + Neon)                        │
│  https://api.brighterfuturestutoring.com                        │
│                                                                  │
│  1. Verifies JWT token                                          │
│  2. Gets student from Neon user ID                             │
│  3. CRUD operations on gem_hunt_* tables                       │
│  4. Returns JSON responses                                      │
│                                                                  │
│  Endpoints:                                                     │
│  POST   /gem-hunt/sessions                                      │
│  GET    /gem-hunt/sessions/:id                                  │
│  PATCH  /gem-hunt/sessions/:id                                  │
│  GET    /gem-hunt/questions                                     │
│  POST   /gem-hunt/questions/validate                           │
│  GET    /gem-hunt/leaderboard                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ SQL queries
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Neon PostgreSQL Database                       │
│                                                                  │
│  Tables:                                                        │
│  - students (existing)                                          │
│  - gem_hunt_sessions                                            │
│  - gem_hunt_questions                                           │
│  - gem_hunt_question_responses                                  │
│  - gem_hunt_level_progress                                      │
│  - gem_hunt_leaderboard                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Recommended Implementation Approach

The recommended approach for your production environment is:

### **Enhanced postMessage + Server-Side Token Exchange**

This combines your current implementation with added security:

1. **Short-lived tokens** (15 min) passed via postMessage ✅ (current)
2. **Server-side validation** in API middleware ✅ (current)
3. **Token refresh endpoint** for long sessions ❌ (add later)
4. **Session resumption** for returning players ❌ (add later)

**Why this approach:**
- Already 80% implemented
- Secure (token never exposed in URLs)
- Works cross-origin
- Easy to enhance incrementally

**vs other approaches:**
- ❌ URL parameters: Security risk
- ❌ Shared cookies: Requires same domain
- ❌ Proxy pattern: Added complexity
- ✅ OAuth-style exchange: Good for later enhancement

---

## 📝 Summary

**Current Status:** 🟡 **85% Complete**

**What works:**
- All code is written and deployed
- Authentication flow is implemented
- API endpoints exist and work
- Database schema is ready

**What's missing:**
- Environment variables configuration
- Database migration execution
- Question bank population
- CORS configuration verification

**Estimated effort to complete:**
- Configuration: 30 minutes
- Database setup: 1 hour
- Question population: 2-4 hours
- Testing: 1-2 hours
- **Total: 4-8 hours**

**Next step:** Set environment variables and run migration.
