# Quiz Generator Backend Implementation Guide

## Overview

This document describes the backend API changes needed to support saving quiz completion data from the Quiz Generator game.

## Frontend Changes (Completed)

✅ Added `QUIZ_COMPLETE` message listener in `quiz-generator-frame.tsx`
✅ Created `saveQuizResults()` server action in `app/games/quiz-generator/actions.ts`
✅ Comprehensive logging for debugging

The frontend now:
1. Receives `QUIZ_COMPLETE` messages from the game iframe
2. Calls the API to save results
3. Handles errors gracefully and logs helpful messages

## Backend Changes Required (bft-api)

### 1. Database Migration

Create a new migration file: `migrations/0XX_quiz_generator_tables.sql`

```sql
-- Quiz Generator: Game sessions and results
-- Similar structure to gem_hunt_sessions but for quiz games

-- Main sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  
  -- Quiz parameters
  year_group VARCHAR(50),
  subject VARCHAR(100),
  difficulty VARCHAR(50),
  
  -- Results
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_elapsed_seconds INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for common queries
  INDEX idx_quiz_sessions_student_id (student_id),
  INDEX idx_quiz_sessions_created_at (created_at),
  INDEX idx_quiz_sessions_subject (subject),
  INDEX idx_quiz_sessions_year_group (year_group)
);

-- Individual question responses (optional, for detailed analytics)
CREATE TABLE IF NOT EXISTS quiz_question_responses (
  response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(session_id) ON DELETE CASCADE,
  
  -- Question info
  question_id VARCHAR(255),
  question_text TEXT,
  
  -- Response
  user_answer TEXT,
  correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  
  -- Timestamps
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_quiz_responses_session_id (session_id)
);

-- Leaderboard view (optional, for high scores)
CREATE TABLE IF NOT EXISTS quiz_leaderboard (
  entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES quiz_sessions(session_id) ON DELETE CASCADE,
  
  year_group VARCHAR(50),
  subject VARCHAR(100),
  difficulty VARCHAR(50),
  
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_elapsed_seconds INTEGER,
  
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_quiz_leaderboard_subject_score (subject, score DESC),
  INDEX idx_quiz_leaderboard_year_group_score (year_group, score DESC),
  INDEX idx_quiz_leaderboard_achieved_at (achieved_at DESC)
);

-- Comments
COMMENT ON TABLE quiz_sessions IS 'Quiz Generator game sessions and completion data';
COMMENT ON TABLE quiz_question_responses IS 'Individual question responses for detailed analytics';
COMMENT ON TABLE quiz_leaderboard IS 'High scores leaderboard for Quiz Generator';
```

### 2. API Endpoints

Create a new route file: `src/routes/quiz-generator.ts`

#### POST /quiz-generator/sessions

Create a new quiz session with completion results.

**Request:**
```typescript
{
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  timeElapsed?: number,
  yearGroup?: string,
  subject?: string,
  difficulty?: string,
  answers?: Array<{
    questionId?: string,
    questionText?: string,
    correct: boolean,
    timeSpent?: number,
    userAnswer?: string
  }>
}
```

**Response:**
```typescript
{
  sessionId: string,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  savedAt: string
}
```

**Implementation:**
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
    answers = []
  } = body;
  
  // Validate required fields
  if (typeof score !== 'number' || typeof totalQuestions !== 'number' || typeof correctAnswers !== 'number') {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  // Get student_id from authenticated user
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
    student.student_id,
    yearGroup || null,
    subject || null,
    difficulty || null,
    score,
    totalQuestions,
    correctAnswers,
    timeElapsed || null
  ).run();
  
  // Insert individual answers if provided
  if (answers.length > 0) {
    const insertPromises = answers.map((answer) => {
      return c.env.DB.prepare(`
        INSERT INTO quiz_question_responses (
          session_id, question_id, question_text, user_answer, correct, time_spent_seconds
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
  
  // Add to leaderboard if high score
  await c.env.DB.prepare(`
    INSERT INTO quiz_leaderboard (
      student_id, session_id, year_group, subject, difficulty,
      score, total_questions, time_elapsed_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    student.student_id,
    sessionId,
    yearGroup || null,
    subject || null,
    difficulty || null,
    score,
    totalQuestions,
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

#### GET /quiz-generator/sessions

Get quiz history for the authenticated user.

**Response:**
```typescript
Array<{
  sessionId: string,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  yearGroup?: string,
  subject?: string,
  difficulty?: string,
  timeElapsed?: number,
  completedAt: string
}>
```

**Implementation:**
```typescript
quizRouter.get('/sessions', requireAuth, async (c) => {
  const user = c.get('user');
  
  // Get student_id
  const student = await c.env.DB.prepare(
    'SELECT student_id FROM students WHERE neon_user_id = ?'
  ).bind(user.sub).first();
  
  if (!student) {
    return c.json({ error: 'Student not found' }, 404);
  }
  
  // Get sessions
  const sessions = await c.env.DB.prepare(`
    SELECT 
      session_id as sessionId,
      score,
      total_questions as totalQuestions,
      correct_answers as correctAnswers,
      year_group as yearGroup,
      subject,
      difficulty,
      time_elapsed_seconds as timeElapsed,
      completed_at as completedAt
    FROM quiz_sessions
    WHERE student_id = ?
    ORDER BY completed_at DESC
    LIMIT 50
  `).bind(student.student_id).all();
  
  return c.json(sessions.results || []);
});
```

#### GET /quiz-generator/leaderboard

Get top scores (optional).

**Query params:**
- `subject` (optional)
- `yearGroup` (optional)
- `difficulty` (optional)
- `limit` (default: 10)

**Response:**
```typescript
Array<{
  studentName: string,
  score: number,
  totalQuestions: number,
  timeElapsed?: number,
  achievedAt: string
}>
```

### 3. Register Routes

In `src/app.ts`, add the quiz router:

```typescript
import quizRouter from './routes/quiz-generator';

// ... existing code ...

app.route('/quiz-generator', quizRouter);
```

### 4. CORS Configuration

Ensure `https://bft-games.vercel.app` is in the allowed origins (should already be configured for Gem Hunt).

In `src/config/env.ts`:
```typescript
export const frontendOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://learn.brighterfuturestutoring.com",
  "https://bft-games.vercel.app",  // ✅ Should already be here
];
```

## Testing

### 1. Test with curl

```bash
# Get a valid JWT token from the browser (Network tab, any API request)
TOKEN="your-jwt-token-here"

# Create a quiz session
curl -X POST https://bft-api.onrender.com/quiz-generator/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 8,
    "totalQuestions": 10,
    "correctAnswers": 8,
    "timeElapsed": 120,
    "yearGroup": "Year 6",
    "subject": "Percentages",
    "difficulty": "medium"
  }'

# Get quiz history
curl https://bft-api.onrender.com/quiz-generator/sessions \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Test end-to-end

1. Sign in to learn app
2. Go to `/games/quiz-generator`
3. Complete a quiz
4. Check browser console for:
   ```
   [QuizGeneratorFrame] QUIZ_COMPLETE message received!
   [QuizGeneratorFrame] ✅ Quiz results saved successfully! Session ID: xxx
   ```
5. Check database for new record:
   ```sql
   SELECT * FROM quiz_sessions ORDER BY created_at DESC LIMIT 1;
   ```

## Message Format from Game

The game iframe sends this message when quiz is complete:

```typescript
window.parent.postMessage({
  type: "QUIZ_COMPLETE",
  payload: {
    score: 8,
    totalQuestions: 10,
    correctAnswers: 8,
    timeElapsed: 120,
    yearGroup: "Year 6",
    subject: "Percentages",
    difficulty: "medium",
    answers: [
      {
        questionId: "q1",
        questionText: "What is 50% of 100?",
        userAnswer: "50",
        correct: true,
        timeSpent: 12
      },
      // ... more answers
    ]
  }
}, "*");
```

## Summary

**What's been fixed:**
- ✅ Frontend now listens for `QUIZ_COMPLETE` messages
- ✅ Frontend attempts to save results via API
- ✅ Comprehensive error handling and logging

**What needs to be done:**
- ⚠️ Backend: Create database migration for quiz tables
- ⚠️ Backend: Implement POST /quiz-generator/sessions endpoint
- ⚠️ Backend: Implement GET /quiz-generator/sessions endpoint
- ⚠️ Backend: Register routes in app.ts
- ⚠️ Testing: Verify end-to-end flow

**Estimated effort:** 2-3 hours for backend implementation

## Related Files

- Frontend: `app/games/quiz-generator/quiz-generator-frame.tsx`
- Server Actions: `app/games/quiz-generator/actions.ts`
- Issue Documentation: `QUIZ_COMPLETION_ISSUE.md`
- Backend (separate repo): `bft-api/src/routes/quiz-generator.ts` (to be created)
