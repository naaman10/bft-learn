# Cursor Prompt: Add Authentication to Maths Quiz Game

## Task
Add postMessage authentication handling to the maths-quiz game so it can receive authentication tokens from the parent frame and send quiz completion results back.

## Context
The maths-quiz game is embedded in an iframe on the learn app (bft-learn). Currently, the parent frame sends authentication via `INIT_GAME` postMessage, but the game doesn't receive or process it, causing the "Sign in to save results" banner to show even when users are authenticated.

## Current Behavior (Console Logs)
```
[QuizGeneratorFrame] INIT_GAME sent successfully  ✅ Parent sends token
[API Config] Base URL: https://bft-api.onrender.com  ✅ Game has API URL  
Game completed!  ✅ Quiz works
💡 Sign in to save your results  ❌ Game doesn't have token
(No QUIZ_COMPLETE message sent)  ❌ Results not saved
```

## Required Changes

### 1. Create postMessage Authentication Hook

Create a hook similar to the one used in Gem Hunt (if it exists) or create a new one at:
- Location: `src/games/maths-quiz/hooks/useQuizAuth.ts` (or similar)

The hook should:

**A. Send GAME_READY on mount:**
```typescript
window.parent.postMessage({ type: 'GAME_READY' }, '*');
```

**B. Listen for INIT_GAME messages:**
```typescript
window.addEventListener('message', (event) => {
  if (event.data?.type === 'INIT_GAME') {
    // Store auth data
    const { token, apiBaseUrl, username, yearGroup, subject } = event.data.payload;
  }
});
```

**C. Return authentication state:**
```typescript
return {
  token,
  apiBaseUrl, 
  username,
  yearGroup,
  subject,
  isAuthenticated: !!token
};
```

### 2. Update Maths Quiz Component

Find the main maths-quiz component and:

**A. Import and use the auth hook:**
```typescript
import { useQuizAuth } from './hooks/useQuizAuth';

function MathsQuiz() {
  const { token, apiBaseUrl, username, isAuthenticated } = useQuizAuth();
  // ... rest of component
}
```

**B. Hide "Sign in" banner when authenticated:**
```typescript
// Find the banner that shows "Sign in to save your results"
// Only show it if NOT authenticated:
{!isAuthenticated && (
  <div>💡 Sign in to save your results...</div>
)}
```

**C. Send QUIZ_COMPLETE when quiz finishes:**
```typescript
const handleQuizComplete = () => {
  const results = {
    score: finalScore,
    totalQuestions: questionCount,
    correctAnswers: correctCount,
    timeElapsed: Math.floor((Date.now() - startTime) / 1000),
    yearGroup: yearGroup || 'Year 6',
    subject: subject || 'Percentages',
    difficulty: 'medium', // or calculate based on questions
    answers: detailedAnswers, // optional: array of individual answers
  };

  // Send to parent frame
  console.log('[MathsQuiz] Sending QUIZ_COMPLETE to parent:', results);
  window.parent.postMessage(
    {
      type: 'QUIZ_COMPLETE',
      payload: results,
    },
    '*'
  );

  // Optionally, also save directly to API if authenticated
  if (isAuthenticated && token && apiBaseUrl) {
    fetch(`${apiBaseUrl}/quiz-generator/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(results),
    })
      .then(res => res.json())
      .then(data => console.log('[MathsQuiz] Saved to API:', data))
      .catch(err => console.error('[MathsQuiz] Failed to save:', err));
  }
};
```

### 3. Add Logging

Add console logs throughout for debugging:
```typescript
console.log('[MathsQuiz] Component mounted');
console.log('[MathsQuiz] Sending GAME_READY to parent');
console.log('[MathsQuiz] Received INIT_GAME:', payload);
console.log('[MathsQuiz] Authentication configured:', { hasToken: !!token });
console.log('[MathsQuiz] Quiz completed, sending results');
```

## Reference Implementation

**Look at the Gem Hunt game in this repository** - it should have a working implementation of postMessage authentication. You can:
1. Find the `useGameSession` hook (or similar) in Gem Hunt
2. Copy and adapt it for maths-quiz
3. Follow the same pattern

Search for:
- `useGameSession` 
- `INIT_GAME`
- `GAME_READY`
- `postMessage`

## Expected Message Formats

### Parent → Game: INIT_GAME
```typescript
{
  type: "INIT_GAME",
  payload: {
    token: "eyJhbGciOiJSUzI1NiIs...",  // JWT token
    apiBaseUrl: "https://bft-api.onrender.com",
    username: "John Doe",
    yearGroup: "Year 6",
    subject: "Percentages"
  }
}
```

### Game → Parent: GAME_READY (on mount)
```typescript
{
  type: "GAME_READY"
}
```

### Game → Parent: QUIZ_COMPLETE (when finished)
```typescript
{
  type: "QUIZ_COMPLETE",
  payload: {
    score: 100,
    totalQuestions: 10,
    correctAnswers: 10,
    timeElapsed: 120,  // seconds
    yearGroup: "Year 6",
    subject: "Percentages",
    difficulty: "medium",
    answers: [  // optional
      {
        questionId: "q1",
        questionText: "What is 50% of 100?",
        userAnswer: "50",
        correct: true,
        timeSpent: 12
      }
      // ... more answers
    ]
  }
}
```

## Testing

### 1. Local Testing
Run the game locally and open console:
```javascript
// Manually test postMessage
window.postMessage({
  type: 'INIT_GAME',
  payload: {
    token: 'test-token',
    apiBaseUrl: 'http://localhost:4000',
    username: 'Test User'
  }
}, '*');

// You should see:
// [MathsQuiz] Received INIT_GAME
// [MathsQuiz] Authentication configured: { hasToken: true }
// (Sign in banner should disappear)
```

### 2. Integration Testing
1. Run bft-learn locally: `http://localhost:3000`
2. Run bft-games locally: `http://localhost:3001`  
3. Sign in to learn app
4. Go to `/games/quiz-generator`
5. Console should show:
   ```
   [QuizGeneratorFrame] INIT_GAME sent successfully
   [MathsQuiz] Received INIT_GAME with auth payload
   [MathsQuiz] Authentication configured
   ```
6. Complete quiz
7. Console should show:
   ```
   [MathsQuiz] Sending QUIZ_COMPLETE to parent
   [QuizGeneratorFrame] QUIZ_COMPLETE message received!
   [QuizGeneratorFrame] ✅ Quiz results saved successfully!
   ```

### 3. Production Testing
After deploying to production:
1. Sign in at learn.brighterfuturestutoring.com
2. Go to quiz generator
3. Check console for same messages
4. Verify "Sign in" banner does NOT appear
5. Complete quiz
6. Verify results are sent to parent

## Success Criteria

- ✅ Game sends `GAME_READY` when loaded
- ✅ Game receives and stores `INIT_GAME` data
- ✅ "Sign in" banner hidden when authenticated
- ✅ Game sends `QUIZ_COMPLETE` with results when finished
- ✅ Console shows all expected log messages
- ✅ Parent frame receives completion message
- ✅ Results saved to database (after backend is implemented)

## Files to Create/Modify

Expected files (adjust paths based on actual structure):
```
src/games/maths-quiz/
├── hooks/
│   └── useQuizAuth.ts          [CREATE]
├── MathsQuiz.tsx               [MODIFY - add hook, hide banner, send completion]
├── components/
│   └── SignInBanner.tsx        [MODIFY - add isAuthenticated prop]
└── types/
    └── quiz.types.ts           [MODIFY - add result types]
```

## Additional Notes

- Use TypeScript for type safety
- Add comprehensive error handling
- Don't break existing functionality
- Preserve all current game features
- Match the authentication pattern used in Gem Hunt

## Questions to Ask if Unclear

1. Where is the Gem Hunt game code? (look for it to copy the pattern)
2. Where does the "Sign in to save results" message render?
3. Where is the quiz completion logic?
4. What data structure does the quiz currently use for results?

## Commit Message Template

```
Add authentication and completion tracking to maths-quiz

- Created useQuizAuth hook to receive INIT_GAME messages
- Store authentication token and user data
- Hide sign-in banner when authenticated
- Send QUIZ_COMPLETE postMessage when quiz finishes
- Add comprehensive logging for debugging

Fixes quiz completion tracking - results will now be saved to database
```

---

**Start by exploring the codebase to find:**
1. The Gem Hunt authentication implementation (as reference)
2. The maths-quiz component files
3. Where the "Sign in" message is rendered
4. Where quiz completion is triggered
