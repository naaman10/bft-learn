# Maths Quiz Game - Authentication Implementation Required

## Problem

The maths-quiz game is showing "Sign in to save your results" because it's **not receiving the authentication token** from the parent frame.

### Console Evidence
```
[QuizGeneratorFrame] INIT_GAME sent successfully  ✅ Parent sends token
[API Config] Base URL: https://bft-api.onrender.com  ✅ Game has API URL
Score: 100
Game completed!
💡 Sign in to save your results  ❌ Game doesn't have token
(No QUIZ_COMPLETE message sent)  ❌ Results not sent to parent
```

## Root Cause

The **maths-quiz game** (in the bft-games repository) does not have:
1. ❌ postMessage listener to receive `INIT_GAME` 
2. ❌ Token storage and usage
3. ❌ Code to send `QUIZ_COMPLETE` messages back to parent

**Gem Hunt works** because it has `useGameSession` hook that handles all of this.
**Maths Quiz needs the same implementation.**

## Required Changes (bft-games Repository)

### Option 1: Use Existing `useGameSession` Hook (Recommended)

If the `useGameSession` hook from Gem Hunt is reusable, import and use it:

```typescript
// In src/games/maths-quiz/MathsQuiz.tsx (or similar)
import { useGameSession } from '@/hooks/useGameSession'; // Adjust path

function MathsQuiz() {
  const { token, apiBaseUrl, username, isAuthenticated } = useGameSession({
    gameType: 'quiz-generator'
  });

  // Use token for API calls
  // When quiz completes, send results back
}
```

### Option 2: Implement Custom postMessage Handler

If `useGameSession` isn't reusable, implement a custom hook:

```typescript
// src/games/maths-quiz/hooks/useQuizAuth.ts
import { useEffect, useState } from 'react';

interface QuizAuthState {
  token: string | null;
  apiBaseUrl: string | null;
  username: string | null;
  yearGroup: string | null;
  subject: string | null;
  isAuthenticated: boolean;
}

export function useQuizAuth() {
  const [authState, setAuthState] = useState<QuizAuthState>({
    token: null,
    apiBaseUrl: null,
    username: null,
    yearGroup: null,
    subject: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Send GAME_READY to parent
    console.log('[MathsQuiz] Sending GAME_READY to parent');
    window.parent.postMessage({ type: 'GAME_READY' }, '*');

    // Listen for INIT_GAME from parent
    const handleMessage = (event: MessageEvent) => {
      console.log('[MathsQuiz] Received message:', event.data);

      if (event.data?.type === 'INIT_GAME') {
        console.log('[MathsQuiz] Received INIT_GAME with auth payload');
        const { token, apiBaseUrl, username, yearGroup, subject } = event.data.payload;

        setAuthState({
          token,
          apiBaseUrl,
          username,
          yearGroup,
          subject,
          isAuthenticated: !!token,
        });

        console.log('[MathsQuiz] Authentication configured:', {
          hasToken: !!token,
          apiBaseUrl,
          username,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return authState;
}
```

### Integrate into Maths Quiz Component

```typescript
// src/games/maths-quiz/MathsQuiz.tsx
import { useQuizAuth } from './hooks/useQuizAuth';

function MathsQuiz() {
  const { token, apiBaseUrl, username, isAuthenticated } = useQuizAuth();
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizStartTime] = useState(Date.now());

  // Remove the "Sign in to save results" message if authenticated
  const showSignInPrompt = !isAuthenticated;

  // When quiz completes
  const handleQuizComplete = () => {
    const timeElapsed = Math.floor((Date.now() - quizStartTime) / 1000);

    const results = {
      score,
      totalQuestions,
      correctAnswers,
      timeElapsed,
      yearGroup: 'Year 6', // Or from auth state
      subject: 'Percentages', // Or from auth state
      difficulty: 'medium',
      answers: [], // Optional: detailed answer data
    };

    // Send results to parent
    console.log('[MathsQuiz] Sending QUIZ_COMPLETE to parent:', results);
    window.parent.postMessage(
      {
        type: 'QUIZ_COMPLETE',
        payload: results,
      },
      '*'
    );

    // If authenticated, also save directly to API
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

  return (
    <div>
      {showSignInPrompt && (
        <div className="sign-in-banner">
          💡 Sign in to save your results and track your progress over time!
        </div>
      )}
      {/* Quiz UI */}
    </div>
  );
}
```

## Message Flow

### 1. Initialization
```
┌─────────────┐                           ┌──────────────┐
│  Parent     │                           │  Game        │
│  (Learn)    │                           │  (Quiz)      │
└─────────────┘                           └──────────────┘
       │                                          │
       │  (1) Load iframe                        │
       │ ────────────────────────────────────>   │
       │                                          │
       │                   (2) Send GAME_READY   │
       │  <──────────────────────────────────── │
       │                                          │
       │  (3) Send INIT_GAME + token             │
       │ ────────────────────────────────────>   │
       │                                          │
       │                   (4) Store token       │
       │                       Show as signed in │
```

### 2. Quiz Completion
```
┌─────────────┐                           ┌──────────────┐
│  Parent     │                           │  Game        │
│  (Learn)    │                           │  (Quiz)      │
└─────────────┘                           └──────────────┘
       │                                          │
       │              (1) User completes quiz    │
       │                                          │
       │         (2) Send QUIZ_COMPLETE + results│
       │  <──────────────────────────────────── │
       │                                          │
       │  (3) Save to API                        │
       │ ────────────────────────────────────>   │
       │                          [Backend API]  │
```

## Expected Message Formats

### Parent → Game: INIT_GAME
```typescript
{
  type: "INIT_GAME",
  payload: {
    token: "eyJhbGciOiJSUzI1NiIs...",
    apiBaseUrl: "https://bft-api.onrender.com",
    username: "John Doe",
    yearGroup: "Year 6",
    subject: "Percentages"
  }
}
```

### Game → Parent: GAME_READY
```typescript
{
  type: "GAME_READY"
}
```

### Game → Parent: QUIZ_COMPLETE
```typescript
{
  type: "QUIZ_COMPLETE",
  payload: {
    score: 100,
    totalQuestions: 10,
    correctAnswers: 10,
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
      }
      // ... more answers
    ]
  }
}
```

## Testing

### 1. Local Development
```bash
# In bft-games repository
cd src/games/maths-quiz
# Add useQuizAuth hook
# Update MathsQuiz component to use it
npm run dev
```

### 2. Test postMessage
Open browser console and test manually:
```javascript
// Simulate parent sending INIT_GAME
window.postMessage({
  type: 'INIT_GAME',
  payload: {
    token: 'test-token',
    apiBaseUrl: 'http://localhost:4000',
    username: 'Test User'
  }
}, '*');

// Check if game receives it
// Should see: [MathsQuiz] Received INIT_GAME
// Should hide: "Sign in to save results" message
```

### 3. Test Integration
1. Run bft-learn locally: `http://localhost:3000`
2. Run bft-games locally: `http://localhost:3001`
3. Sign in to learn app
4. Go to `/games/quiz-generator`
5. Check console for:
   ```
   [QuizGeneratorFrame] INIT_GAME sent successfully
   [MathsQuiz] Received INIT_GAME with auth payload
   [MathsQuiz] Authentication configured: { hasToken: true, ... }
   ```
6. Complete quiz
7. Check console for:
   ```
   [MathsQuiz] Sending QUIZ_COMPLETE to parent
   [QuizGeneratorFrame] QUIZ_COMPLETE message received!
   [QuizGeneratorFrame] ✅ Quiz results saved successfully!
   ```

## Current Status

### ✅ Parent Frame (bft-learn)
- Sends INIT_GAME with token
- Listens for QUIZ_COMPLETE
- Saves results to API
- All code complete

### ❌ Game (bft-games - maths-quiz)
- Does NOT listen for INIT_GAME
- Does NOT store token
- Does NOT send QUIZ_COMPLETE
- Needs implementation

### ✅ Backend (bft-api)
- May need quiz endpoints (see QUIZ_BACKEND_IMPLEMENTATION.md)

## Reference Implementation

Look at **Gem Hunt** in bft-games repository:
- File: `src/games/gem-hunt/hooks/useGameSession.ts` (or similar)
- Shows complete working implementation
- Copy and adapt for maths-quiz

## Files to Modify (bft-games repo)

```
bft-games/
├── src/
│   └── games/
│       └── maths-quiz/
│           ├── hooks/
│           │   └── useQuizAuth.ts  [CREATE - postMessage handler]
│           ├── MathsQuiz.tsx       [MODIFY - add auth, send QUIZ_COMPLETE]
│           └── components/
│               └── SignInBanner.tsx [MODIFY - hide when authenticated]
```

## Summary

**Problem:** Maths quiz game doesn't receive authentication token from parent
**Solution:** Add postMessage listener (like Gem Hunt has) to receive INIT_GAME
**Impact:** Once implemented, quiz results will save to database
**Effort:** ~2-3 hours (copy from Gem Hunt, adapt for maths-quiz)

## Next Steps

1. **Game developer** (bft-games): Implement postMessage handling in maths-quiz
2. **Backend developer** (bft-api): Implement quiz endpoints (see QUIZ_BACKEND_IMPLEMENTATION.md)
3. **QA**: Test end-to-end after both are deployed

---

**Current State:** Parent sends token ✅ → Game receives token ❌ → Database saves ❌
**Desired State:** Parent sends token ✅ → Game receives token ✅ → Database saves ✅
