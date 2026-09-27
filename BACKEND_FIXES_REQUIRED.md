# Backend Fix Required - Quiz Results Not Saving

## Current Status

✅ **Game authentication working!** The game now receives tokens and sends completion data.
✅ **Game calling correct endpoint:** `/api/games/sessions` (generic endpoint for all games)

❌ **Backend has foreign key constraint error preventing saves**

## Error Analysis

### Foreign Key Constraint Error (Backend Side)
```json
{
  "error": "insert or update on table 'game_sessions' violates foreign key constraint 'game_sessions_user_id_fkey'"
}
```

The backend is trying to insert a `user_id` that doesn't exist in the referenced table.

## Root Cause

The backend's **generic games endpoint** (`/api/games/sessions`) is:
1. ✅ Correctly being called by the game
2. ✅ Has the right database schema (`game_sessions` table)
3. ❌ **Has incorrect user ID lookup** - trying to use `user.sub` directly instead of looking up `student_id`

## Required Fix

### Fix the Backend `/api/games/sessions` Endpoint (bft-api)

**File:** Find the `/api/games/sessions` POST handler in bft-api (likely `src/routes/games.ts` or `src/routes/api/games/sessions.ts`)

**The Problem:**
```typescript
// ❌ CURRENT CODE (BROKEN)
await c.env.DB.prepare(`
  INSERT INTO game_sessions (user_id, score, ...)
  VALUES (?, ?, ...)
`).bind(user.sub, score, ...).run();  // user.sub doesn't exist in users table
```

**The Fix:**
```typescript
// ✅ FIXED CODE
const user = c.get('user');
const body = await c.req.json();

// 1. Look up student_id from neon_user_id (from JWT)
const student = await c.env.DB.prepare(
  'SELECT student_id FROM students WHERE neon_user_id = ?'
).bind(user.sub).first();

if (!student) {
  return c.json({ error: 'Student not found' }, 404);
}

// 2. Use student_id for the foreign key
await c.env.DB.prepare(`
  INSERT INTO game_sessions (
    session_id,
    student_id,  -- Use this, not user_id!
    game_type,
    score,
    ...
  ) VALUES (?, ?, ?, ?, ...)
`).bind(
  crypto.randomUUID(),
  student.student_id,  -- The correct foreign key reference
  'quiz-generator',
  body.score,
  ...
).run();
```

**See complete implementation in:** `BACKEND_FIX_GAMES_SESSIONS.md`

## Why This Happens

The JWT contains `neon_user_id` (in `user.sub`), but the database uses `students` table with `student_id` as the foreign key. The backend must do the lookup:

**JWT** (`user.sub`) → **students table** (`neon_user_id`) → **student_id** → **game_sessions** (`student_id`)

## Testing After Fixes

### Test 1: Backend Endpoint
```bash
# Get a token from browser (Network tab)
TOKEN="your-jwt-token"

# Test the new endpoint
curl -X POST https://bft-api.onrender.com/quiz-generator/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 100,
    "totalQuestions": 10,
    "correctAnswers": 10,
    "timeElapsed": 120,
    "yearGroup": "Year 4",
    "subject": "Percentages"
  }'

# Should return:
# {"sessionId":"...","score":100,"totalQuestions":10,"correctAnswers":10,"savedAt":"..."}
```

### Test 2: End-to-End
1. Complete a quiz in the app
2. Check browser console:
   ```
   [MathsQuiz] Sending QUIZ_COMPLETE to parent: {...}
   [QuizGeneratorFrame] QUIZ_COMPLETE message received!
   [QuizGeneratorFrame] ✅ Quiz results saved successfully! Session ID: xxx
   [MathsQuiz] Saved to API: {"sessionId":"..."}
   ```

3. Check database:
   ```sql
   SELECT * FROM quiz_sessions ORDER BY created_at DESC LIMIT 1;
   ```

## Summary

**Issue:** Backend foreign key constraint violation

**Fix:**
1. ⚠️ **Backend:** Add student_id lookup to `/api/games/sessions` endpoint (15-30 min)

**After fix:**
- Quiz results will save successfully ✅
- No more foreign key errors ✅
- Both frontend and game will confirm saves in console ✅

## Files to Modify

**bft-api:**
- Find: `src/routes/games.ts` or wherever `/api/games/sessions` POST handler is
- Add: Student lookup before insert
- Change: Use `student.student_id` instead of `user.sub`

**Complete implementation:** See `BACKEND_FIX_GAMES_SESSIONS.md`
