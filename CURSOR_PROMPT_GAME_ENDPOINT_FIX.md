# Quick Fix: Change Quiz API Endpoint

## Task
Change the API endpoint that the maths-quiz game calls when saving results.

## Current Issue
The game is calling:
```
POST https://bft-api.onrender.com/api/games/sessions
```

This endpoint has the wrong database schema and causes a foreign key error.

## Required Change

Find where the quiz completion API call is made in the maths-quiz game and change:

**FROM:**
```typescript
fetch(`${apiBaseUrl}/api/games/sessions`, {
  method: 'POST',
  // ...
})
```

**TO:**
```typescript
fetch(`${apiBaseUrl}/quiz-generator/sessions`, {
  method: 'POST',
  // ...
})
```

## Where to Look

Search the codebase for:
- `/api/games/sessions`
- `api/games/sessions`
- The file where quiz completion is handled (likely where QUIZ_COMPLETE postMessage is sent)

It's probably in:
- `src/games/maths-quiz/MathsQuiz.tsx`
- `src/games/maths-quiz/hooks/useQuizAuth.ts`
- Or wherever the `handleQuizComplete` function is

## That's It!

Just change that one endpoint URL. The backend will be updated to handle `/quiz-generator/sessions` properly.

## Testing

After the change:
1. Complete a quiz
2. Check console - should see:
   ```
   [MathsQuiz] Saved to API: {"sessionId":"..."}
   ```
   (No error about foreign key constraint)

## Commit Message
```
Fix quiz API endpoint to use quiz-generator route

Changed endpoint from /api/games/sessions to /quiz-generator/sessions
to match the backend quiz-specific implementation.
```
