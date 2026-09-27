# Backend Fixes Required - Quiz Results Not Saving

## Current Status

✅ **Game authentication working!** The game now receives tokens and sends completion data.

❌ **Backend has two issues preventing saves:**

## Error Analysis

### Error 1: Wrong Endpoint (Game Side)
```
POST https://bft-api.onrender.com/api/games/sessions 500
```

The game is calling `/api/games/sessions` but should call `/quiz-generator/sessions`

### Error 2: Foreign Key Constraint (Backend Side)
```json
{
  "error": "insert or update on table 'game_sessions' violates foreign key constraint 'game_sessions_user_id_fkey'"
}
```

The backend is trying to insert a `user_id` that doesn't exist in the referenced table.

## Root Cause

The backend has a **generic games endpoint** (`/api/games/sessions`) that:
1. Exists and responds (not 404)
2. Uses a different database schema (`game_sessions` table)
3. Has incorrect foreign key references
4. Is not suitable for quiz results

## Required Fixes

### Fix 1: Update Game Endpoint (bft-games - QUICK FIX)

**File:** `src/games/maths-quiz/MathsQuiz.tsx` (or wherever the API call is made)

**Find this:**
```typescript
fetch(`${apiBaseUrl}/api/games/sessions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(results),
})
```

**Change to:**
```typescript
fetch(`${apiBaseUrl}/quiz-generator/sessions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(results),
})
```

**Just change:** `/api/games/sessions` → `/quiz-generator/sessions`

This will make it call the correct endpoint (which needs to be created in Fix 2).

### Fix 2: Create Quiz Endpoints (bft-api)

The backend needs quiz-specific endpoints. Follow the complete guide in `QUIZ_BACKEND_IMPLEMENTATION.md`.

**Quick summary:**

#### A. Create Migration: `migrations/0XX_quiz_generator_tables.sql`

```sql
CREATE TABLE IF NOT EXISTS quiz_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  
  year_group VARCHAR(50),
  subject VARCHAR(100),
  difficulty VARCHAR(50),
  
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_elapsed_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### B. Create Route: `src/routes/quiz-generator.ts`

```typescript
import { Hono } from 'hono';
import { requireAuth } from '../middleware/require-auth';

const quizRouter = new Hono();

quizRouter.post('/sessions', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const {
    score,
    totalQuestions,
    correctAnswers,
    timeElapsed,
    yearGroup,
    subject,
    difficulty,
  } = body;
  
  // Get student_id from JWT (not direct user_id!)
  const student = await c.env.DB.prepare(
    'SELECT student_id FROM students WHERE neon_user_id = ?'
  ).bind(user.sub).first();
  
  if (!student) {
    return c.json({ error: 'Student not found' }, 404);
  }
  
  // Insert session
  const sessionId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO quiz_sessions (
      session_id, student_id, year_group, subject, difficulty,
      score, total_questions, correct_answers, time_elapsed_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    sessionId,
    student.student_id,  // Use student_id, not user_id!
    yearGroup || null,
    subject || null,
    difficulty || null,
    score,
    totalQuestions,
    correctAnswers,
    timeElapsed || null
  ).run();
  
  return c.json({
    sessionId,
    score,
    totalQuestions,
    correctAnswers,
    savedAt: new Date().toISOString()
  });
});

export default quizRouter;
```

#### C. Register Route: `src/app.ts`

```typescript
import quizRouter from './routes/quiz-generator';

// ... existing code ...

app.route('/quiz-generator', quizRouter);
```

## Alternative: Fix Generic Games Endpoint (Not Recommended)

If you want to keep using `/api/games/sessions`, you need to:

1. Fix the foreign key constraint in the `game_sessions` table
2. Update it to look up `student_id` correctly
3. Ensure it supports quiz data format

**This is not recommended** because:
- The endpoint name doesn't match the purpose
- It may break other games using it
- Quiz-specific endpoints are clearer and more maintainable

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

**Issue:** Game calls wrong endpoint + backend has foreign key error

**Fix Priority:**
1. ⚠️ **Game:** Change `/api/games/sessions` → `/quiz-generator/sessions` (5 min)
2. ⚠️ **Backend:** Create `/quiz-generator/sessions` endpoint (30-60 min)
3. ⚠️ **Backend:** Run migration to create `quiz_sessions` table (5 min)

**After fixes:**
- Quiz results will save successfully
- No more foreign key errors
- Both frontend and game will confirm saves in console

## Files to Check/Modify

**bft-games:**
- Find where `POST ${apiBaseUrl}/api/games/sessions` is called
- Change to `POST ${apiBaseUrl}/quiz-generator/sessions`

**bft-api:**
- Create `migrations/0XX_quiz_generator_tables.sql`
- Create `src/routes/quiz-generator.ts`
- Update `src/app.ts` to register route
- Run migration

**Complete implementation details:** See `QUIZ_BACKEND_IMPLEMENTATION.md`
