# Gem Hunt Authentication - Verification Checklist

## ✅ Confirmed Working

1. **Environment Variables (bft-learn)**
   - ✅ `NEON_AUTH_BASE_URL` set correctly
   - ✅ `NEON_AUTH_COOKIE_SECRET` set
   - ✅ `API_URL` set to `https://bft-api.onrender.com`
   - ✅ `NEXT_PUBLIC_GAMES_URL` set to `https://bft-games.vercel.app`

2. **Database**
   - ✅ Migration `009_gem_hunt_tables.sql` applied
   - ✅ Question bank populated (~250 records)

## ⚠️ Need to Verify

### 1. bft-games Environment Variables

Check Vercel deployment settings for bft-games:

```env
VITE_BFT_API_URL=https://bft-api.onrender.com
VITE_PARENT_ORIGINS=https://learn.brighterfuturestutoring.com
```

**To verify:**
1. Go to Vercel dashboard → bft-games project
2. Settings → Environment Variables
3. Check if these are set for Production

### 2. bft-api CORS Configuration

The API needs to allow requests from the games domain.

**Check file:** `bft-api/src/config/env.ts`

Should include:
```typescript
export const frontendOrigins = [
  "http://localhost:3000",
  "https://learn.brighterfuturestutoring.com",
  "https://bft-games.vercel.app",  // ← Must be here
];
```

**To verify:**
1. Check the deployed version on Render
2. Look at environment variable `FRONTEND_URL` or similar

### 3. Test Authentication Flow

**Step-by-step test:**

1. Sign in to https://learn.brighterfuturestutoring.com
2. Navigate to Gem Hunt game
3. Open browser DevTools → Console
4. Look for these messages:

```javascript
// Expected console logs:
[useGameSession] GAME_READY sent
[useGameSession] Received INIT_GAME
[API] Fetching questions from https://bft-api.onrender.com/gem-hunt/questions
[API] Successfully fetched N questions from database
```

5. Also check Network tab for:
   - `POST /gem-hunt/sessions` → Should return 201
   - `GET /gem-hunt/questions` → Should return 200
   - Headers should include `Authorization: Bearer <token>`

### 4. Check for CORS Errors

In browser console, look for errors like:
```
Access to fetch at 'https://bft-api.onrender.com/gem-hunt/sessions' 
from origin 'https://bft-games.vercel.app' has been blocked by CORS policy
```

If you see this, CORS needs to be fixed.

## Quick Test Commands

### Test API Endpoints Directly

```bash
# 1. Get a token from the learn app (copy from DevTools → Application → Cookies)
TOKEN="your-jwt-token-here"

# 2. Test session creation
curl -X POST https://bft-api.onrender.com/gem-hunt/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"yearGroup":"Year 6","subject":"Percentages"}'

# 3. Test questions endpoint
curl "https://bft-api.onrender.com/gem-hunt/questions?yearGroup=Year%206&subject=Percentages&count=5" \
  -H "Authorization: Bearer $TOKEN"
```

### Test CORS Preflight

```bash
curl -X OPTIONS https://bft-api.onrender.com/gem-hunt/sessions \
  -H "Origin: https://bft-games.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -v
```

Expected response headers:
```
Access-Control-Allow-Origin: https://bft-games.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

## Common Issues & Fixes

### Issue 1: Token Not Being Sent
**Symptoms:** Game stays in "Getting your session ready..."
**Check:**
- Is `API_URL` set in bft-learn?
- Is token being retrieved? (Check `/app/games/gem-hunt/page.tsx` line 33-39)

### Issue 2: CORS Blocking Requests
**Symptoms:** Network errors in console, preflight failures
**Fix:**
1. Add `https://bft-games.vercel.app` to `frontendOrigins` in bft-api
2. Redeploy bft-api
3. Clear browser cache and test again

### Issue 3: 401 Unauthorized
**Symptoms:** API returns 401 even with token
**Check:**
1. Is `NEON_AUTH_BASE_URL` correct in bft-api?
2. Is token expired? (JWT tokens expire after ~1 hour)
3. Verify JWKS endpoint is reachable:
   ```bash
   curl https://ep-flat-night-abrnism3.neonauth.eu-west-2.aws.neon.tech/neondb/auth/.well-known/jwks.json
   ```

### Issue 4: Empty Questions Response
**Symptoms:** "Failed to fetch questions" in console
**Check:**
1. Are questions in database for that year/subject?
   ```sql
   SELECT COUNT(*) FROM gem_hunt_questions 
   WHERE year_group = 'Year 6' AND subject = 'Percentages' AND active = TRUE;
   ```
2. Do questions exist for all combinations the game might request?

## What to Check Next

Based on the screenshots you provided, I see:

**bft-learn environment:**
- ✅ `NEXT_PUBLIC_GAMES_URL` = https://bft-games.vercel.app
- ✅ `API_URL` = https://bft-api.onrender.com

**bft-games environment:**
- ✅ `VITE_PARENT_ORIGINS` = https://learn.brighterfuturestutoring.com (just added)
- ⚠️ `VITE_BFT_API_URL` = https://bft-api.onrender.com (need to verify)

**Next Steps:**
1. Verify `VITE_BFT_API_URL` is set in bft-games Vercel deployment
2. Test the authentication flow with browser DevTools
3. Check for any CORS errors
4. Verify API endpoints respond correctly with a valid token

Would you like me to help you test any of these?
