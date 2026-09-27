# Fix: /api/games/sessions Foreign Key Error

## Problem

The `/api/games/sessions` endpoint exists and is being called correctly, but returns:

```json
{
  "error": "insert or update on table 'game_sessions' violates foreign key constraint 'game_sessions_user_id_fkey'"
}
```

## Root Cause

The backend is trying to insert a `user_id` that doesn't exist in the referenced table. The JWT contains a `neon_user_id` but the database uses `student_id` as the foreign key.

## Required Fix (bft-api)

### Current Implementation (Broken)

The endpoint is likely doing something like:

```typescript
// ❌ WRONG - directly using user.sub or user.id as user_id
await c.env.DB.prepare(`
  INSERT INTO game_sessions (user_id, score, ...)
  VALUES (?, ?, ...)
`).bind(user.sub, score, ...).run();
```

### Fixed Implementation

The endpoint needs to look up the `student_id` first:

```typescript
// ✅ CORRECT
const user = c.get('user'); // From JWT middleware
const body = await c.req.json();

// 1. Look up student_id from neon_user_id
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
    total_questions,
    ...
  ) VALUES (?, ?, ?, ?, ?, ...)
`).bind(
  crypto.randomUUID(),
  student.student_id,  -- The correct foreign key
  'quiz-generator',
  body.score,
  body.totalQuestions,
  ...
).run();
```

## File to Modify

**bft-api repository:**
- Find: `src/routes/games.ts` or wherever `/api/games/sessions` POST handler is
- Or: `src/routes/api/games/sessions.ts`
- Or: Search for `game_sessions` table insert

## Complete Fixed Handler Example

```typescript
import { Hono } from 'hono';
import { requireAuth } from '../middleware/require-auth';

const gamesRouter = new Hono();

gamesRouter.post('/sessions', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const {
      gameType = 'quiz-generator',
      score,
      totalQuestions,
      correctAnswers,
      timeElapsed,
      yearGroup,
      subject,
      difficulty,
      answers = []
    } = body;
    
    // Validate required fields
    if (typeof score !== 'number' || typeof totalQuestions !== 'number') {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // 🔑 KEY FIX: Look up student_id from JWT's neon_user_id
    const student = await c.env.DB.prepare(
      'SELECT student_id FROM students WHERE neon_user_id = ?'
    ).bind(user.sub).first();
    
    if (!student) {
      console.error('[games/sessions] Student not found for neon_user_id:', user.sub);
      return c.json({ 
        error: 'Student not found',
        details: 'No student record exists for this authenticated user'
      }, 404);
    }
    
    // Create session
    const sessionId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO game_sessions (
        session_id, 
        student_id,
        game_type,
        year_group,
        subject,
        difficulty,
        score,
        total_questions,
        correct_answers,
        time_elapsed_seconds,
        completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `).bind(
      sessionId,
      student.student_id,  // Use student_id, not user.sub!
      gameType,
      yearGroup || null,
      subject || null,
      difficulty || null,
      score,
      totalQuestions,
      correctAnswers || null,
      timeElapsed || null
    ).run();
    
    // Optionally store detailed answers if provided
    if (answers && answers.length > 0) {
      const insertPromises = answers.map((answer) => {
        return c.env.DB.prepare(`
          INSERT INTO game_question_responses (
            session_id,
            question_id,
            question_text,
            user_answer,
            correct,
            time_spent_seconds
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          sessionId,
          answer.questionId || null,
          answer.questionText || null,
          answer.userAnswer || null,
          answer.correct,
          answer.timeSpent || null
        ).run();
      });
      
      await Promise.all(insertPromises);
    }
    
    return c.json({
      sessionId,
      score,
      totalQuestions,
      correctAnswers: correctAnswers || null,
      savedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[games/sessions] Error:', error);
    return c.json({ 
      error: 'Internal server error',
      message: error.message 
    }, 500);
  }
});

export default gamesRouter;
```

## Database Schema Requirements

Make sure the `game_sessions` table has:

```sql
CREATE TABLE IF NOT EXISTS game_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  game_type VARCHAR(100),
  year_group VARCHAR(50),
  subject VARCHAR(100),
  difficulty VARCHAR(50),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER,
  time_elapsed_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: table for detailed answers
CREATE TABLE IF NOT EXISTS game_question_responses (
  response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(session_id) ON DELETE CASCADE,
  question_id VARCHAR(255),
  question_text TEXT,
  user_answer TEXT,
  correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key points:**
- Foreign key is `student_id` not `user_id`
- References `students(student_id)`
- `game_type` field to distinguish different games (quiz-generator, gem-hunt, etc.)

## Testing

### Test 1: Check Student Record Exists
```sql
-- Use the neon_user_id from JWT (user.sub)
SELECT student_id, neon_user_id, name 
FROM students 
WHERE neon_user_id = 'user_xxx';  -- Replace with actual JWT sub
```

If no record exists, the user needs a student record created first.

### Test 2: Test API Endpoint
```bash
# Get token from browser Network tab
TOKEN="your-jwt-token"

curl -X POST https://bft-api.onrender.com/api/games/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameType": "quiz-generator",
    "score": 100,
    "totalQuestions": 10,
    "correctAnswers": 10,
    "timeElapsed": 120,
    "yearGroup": "Year 4",
    "subject": "Percentages"
  }'

# Should return:
# {"sessionId":"...","score":100,"totalQuestions":10,"savedAt":"..."}
```

### Test 3: End-to-End
1. Complete a quiz in the app
2. Console should show:
   ```
   [MathsQuiz] Saved to API: {"sessionId":"...","score":100,...}
   [QuizGeneratorFrame] ✅ Quiz results saved successfully!
   ```
3. Check database:
   ```sql
   SELECT * FROM game_sessions 
   WHERE game_type = 'quiz-generator' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

## Summary

**Problem:** Foreign key constraint violation
**Root Cause:** Using `user.sub` directly as `user_id` instead of looking up `student_id`
**Fix:** Add student lookup before insert
**Location:** `src/routes/games.ts` (or wherever `/api/games/sessions` POST is handled)

**Key change:**
```typescript
// ❌ Before
INSERT INTO game_sessions (user_id, ...) VALUES (user.sub, ...)

// ✅ After
const student = await db.query('SELECT student_id FROM students WHERE neon_user_id = ?', [user.sub]);
INSERT INTO game_sessions (student_id, ...) VALUES (student.student_id, ...)
```

This fix allows the generic `/api/games/sessions` endpoint to work for all games! 🎮
