# Quiz Generator - Completion Data Not Being Saved

## Problem

When users complete a quiz in the Quiz Generator, no progress or results are saved to the database.

## Root Cause

### 1. Missing Message Handler

The `quiz-generator-frame.tsx` component only listens for `GAME_READY` messages from the game iframe:

```typescript
if (event.data.type === "GAME_READY") {
  // Handle initialization
  sendInit();
}
// No handling for QUIZ_COMPLETE or similar messages
```

### 2. No Database Save Logic

Even if completion messages were received, there's no:
- Server action to save quiz results
- API endpoint to store quiz data
- Database schema for quiz results

## Expected Behavior

When a quiz is completed, the system should:
1. Game iframe sends `QUIZ_COMPLETE` message with results (score, answers, time, etc.)
2. Parent frame receives and validates the message
3. Parent frame calls API to save results to database
4. Database stores:
   - User ID
   - Quiz parameters (subject, year group)
   - Score and completion time
   - Individual answers (optional)
   - Timestamp

## Solution Required

### Frontend Changes (bft-learn)

1. **Update `quiz-generator-frame.tsx`** to listen for completion messages:
   ```typescript
   if (event.data.type === "QUIZ_COMPLETE") {
     await saveQuizResults(event.data.payload);
   }
   ```

2. **Create server action** `app/games/quiz-generator/actions.ts`:
   ```typescript
   export async function saveQuizResults(results: QuizResults) {
     // Call API endpoint
   }
   ```

### Backend Changes (bft-api)

1. **Create database migration** for quiz results:
   - `quiz_sessions` table
   - `quiz_results` table (similar to gem_hunt_sessions)

2. **Create API endpoints**:
   - `POST /quiz-generator/sessions` - Create new quiz session
   - `PATCH /quiz-generator/sessions/:id` - Update with results
   - `GET /quiz-generator/leaderboard` - View high scores

3. **Add authentication middleware** (likely already exists for Gem Hunt)

## Comparison with Gem Hunt

Gem Hunt has a similar flow but handles progress differently:
- Gem Hunt saves progress continuously as the player answers questions
- Quiz Generator would save once at completion
- Both use the same authentication pattern (JWT via postMessage)

## Message Format (Expected from Game)

The game iframe should send:

```typescript
{
  type: "QUIZ_COMPLETE",
  payload: {
    score: number,
    totalQuestions: number,
    correctAnswers: number,
    timeElapsed: number,
    yearGroup: string,
    subject: string,
    difficulty?: string,
    answers?: Array<{
      questionId: string,
      correct: boolean,
      timeSpent: number
    }>
  }
}
```

## Next Steps

1. **Check what message the game actually sends** - Add logging to see all messages
2. **Verify backend API** - Check if quiz endpoints exist in bft-api
3. **Add message handler** - Implement QUIZ_COMPLETE listener
4. **Create save function** - Add server action to call API
5. **Test end-to-end** - Verify results save to database

## Testing Checklist

- [ ] Complete a quiz
- [ ] Verify QUIZ_COMPLETE message is sent by game
- [ ] Verify message is received by parent frame
- [ ] Verify API call is made with correct data
- [ ] Verify database record is created
- [ ] Verify results display on dashboard (if applicable)
- [ ] Test with network errors
- [ ] Test with invalid data
