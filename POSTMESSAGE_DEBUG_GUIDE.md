# PostMessage Authentication Debug Guide

## Issue
Game is loaded via iframe from learn app but still uses local questions instead of authenticated API calls.

## Possible Causes

### 1. Token Not Retrieved in Learn App
**Check:** Did the learn app successfully get the token?

**Add debug logging to `/app/games/gem-hunt/page.tsx`:**
```typescript
export default async function GemHuntPage() {
  const { data: session } = await getSession();
  console.log('[Learn App] Session:', session);

  const { data: tokenPayload } = await getAuthToken();
  console.log('[Learn App] Token payload:', tokenPayload);
  
  const token = /* ... */;
  console.log('[Learn App] Extracted token:', token ? 'EXISTS' : 'MISSING');
  
  // ... rest of code
}
```

**Expected output:**
```
[Learn App] Session: { user: { id: '...', name: '...', email: '...' } }
[Learn App] Token payload: { token: 'eyJ...' }
[Learn App] Extracted token: EXISTS
```

### 2. PostMessage Not Being Sent
**Check:** Is the parent window sending the INIT_GAME message?

**Add debug logging to `/app/games/gem-hunt/gem-hunt-frame.tsx`:**
```typescript
const sendInit = useCallback(() => {
  const frame = iframeRef.current?.contentWindow;
  console.log('[GemHuntFrame] sendInit called');
  console.log('[GemHuntFrame] frame:', frame ? 'EXISTS' : 'MISSING');
  console.log('[GemHuntFrame] token:', token ? 'EXISTS' : 'MISSING');
  
  if (!frame || !token) {
    console.warn('[GemHuntFrame] Cannot send INIT_GAME - missing frame or token');
    return;
  }

  console.log('[GemHuntFrame] Sending INIT_GAME to origin:', gamesOrigin);
  console.log('[GemHuntFrame] Payload:', {
    token: token.substring(0, 20) + '...',
    apiBaseUrl,
    username,
    yearGroup,
    subject,
  });

  frame.postMessage(
    {
      type: "INIT_GAME",
      payload: {
        token,
        apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
        username: username ?? undefined,
        yearGroup,
        subject,
      },
    },
    gamesOrigin
  );
  
  console.log('[GemHuntFrame] INIT_GAME sent successfully');
  initSent.current = true;
}, [apiBaseUrl, gamesOrigin, subject, token, username, yearGroup]);

useEffect(() => {
  const onMessage = (event: MessageEvent) => {
    console.log('[GemHuntFrame] Received message:', event.data);
    console.log('[GemHuntFrame] Message origin:', event.origin);
    console.log('[GemHuntFrame] Expected origin:', gamesOrigin);
    
    if (gamesOrigin !== "*" && event.origin !== gamesOrigin) {
      console.warn('[GemHuntFrame] Origin mismatch - ignoring message');
      return;
    }
    if (!event.data || typeof event.data !== "object") return;
    if (event.data.type !== "GAME_READY") return;
    
    console.log('[GemHuntFrame] GAME_READY received, sending INIT_GAME');
    sendInit();
  };

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}, [gamesOrigin, sendInit]);
```

**Expected output:**
```
[GemHuntFrame] Received message: { type: 'GAME_READY' }
[GemHuntFrame] Message origin: https://bft-games.vercel.app
[GemHuntFrame] Expected origin: https://bft-games.vercel.app
[GemHuntFrame] GAME_READY received, sending INIT_GAME
[GemHuntFrame] sendInit called
[GemHuntFrame] frame: EXISTS
[GemHuntFrame] token: EXISTS
[GemHuntFrame] Sending INIT_GAME to origin: https://bft-games.vercel.app
[GemHuntFrame] INIT_GAME sent successfully
```

### 3. Game Not Receiving Message
**Check:** Is the game iframe listening for messages?

**The game already has logging for this in `useGameSession`:**
```typescript
const handleMessage = (event: MessageEvent) => {
  if (!isAllowedParentOrigin(event.origin)) {
    console.warn('Ignored message from origin:', event.origin);
    return;
  }
  const data = event.data as ParentToGameMessage | undefined;
  if (!data || typeof data !== 'object' || !('type' in data)) return;

  if (data.type === 'INIT_GAME' && data.payload?.token) {
    void applyAuthPayload(data.payload);
  }
};
```

**Expected output in game console:**
```
[useGameSession] Received message with token
[useGameSession] applyAuthPayload called
[API] Fetching questions from https://bft-api.onrender.com/gem-hunt/questions
```

### 4. Origin Validation Issues
**Check:** Are the origins matching correctly?

**Common issues:**
- Learn app sends to `https://bft-games.vercel.app`
- Game expects from `https://learn.brighterfuturestutoring.com`
- But one has trailing slash or different protocol

**Debug the origins:**
```typescript
// In GemHuntFrame
console.log('[Parent] My origin:', window.location.origin);
console.log('[Parent] Game origin:', gamesOrigin);
console.log('[Parent] Game URL:', gameUrl);

// In game (useGameSession)
console.log('[Game] My origin:', window.location.origin);
console.log('[Game] Parent origin:', document.referrer);
console.log('[Game] Allowed origins:', allowedOrigins());
```

## Quick Test: Manual PostMessage

Open the learn app with the game loaded, then run this in the **parent window console**:

```javascript
// Get the iframe
const iframe = document.querySelector('iframe');

// Manually send INIT_GAME
iframe.contentWindow.postMessage({
  type: 'INIT_GAME',
  payload: {
    token: 'test-token-123',
    apiBaseUrl: 'https://bft-api.onrender.com',
    username: 'Test User',
    yearGroup: 'Year 6',
    subject: 'Percentages'
  }
}, 'https://bft-games.vercel.app');

console.log('Manual INIT_GAME sent');
```

Then check the **game console** for:
```
[useGameSession] Received message with token
```

## Checklist for Testing

Run through this checklist while watching the console:

### In Learn App Console:
- [ ] Session retrieved successfully
- [ ] Token retrieved successfully
- [ ] GAME_READY message received from iframe
- [ ] INIT_GAME message sent to iframe
- [ ] No origin validation errors

### In Game Console:
- [ ] GAME_READY sent on load
- [ ] INIT_GAME message received
- [ ] Token stored in session
- [ ] API base URL set correctly
- [ ] API calls made with Authorization header
- [ ] Questions fetched from database (not local)

## Common Issues & Solutions

### Issue 1: "Ignored message from origin: ..."
**Cause:** Origin validation failing
**Fix:** 
1. Check `VITE_PARENT_ORIGINS` includes exact learn app URL
2. Verify no trailing slashes or protocol mismatches
3. Check both http/https match

### Issue 2: GAME_READY never received
**Cause:** Message sent before listener ready
**Fix:** The backup timeout in `onLoad` should handle this
```typescript
onLoad={() => {
  window.setTimeout(() => {
    if (!initSent.current) sendInit();
  }, 400);
}}
```

### Issue 3: Token is null
**Cause:** `getAuthToken()` failed in learn app
**Fix:**
1. Check user is signed in
2. Verify Neon Auth session is valid
3. Check `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`

### Issue 4: CORS errors
**Cause:** API rejecting requests from game origin
**Fix:** Add `https://bft-games.vercel.app` to `frontendOrigins` in bft-api

## Next Steps

1. Add the debug logging above
2. Reload the page through the learn app
3. Share the complete console output from both windows
4. I'll help identify exactly where the flow breaks

## Expected Full Flow Console Output

**Learn App Console:**
```
[Learn App] Session: { user: {...} }
[Learn App] Token payload: { token: 'eyJ...' }
[Learn App] Extracted token: EXISTS
[GemHuntFrame] Received message: { type: 'GAME_READY' }
[GemHuntFrame] GAME_READY received, sending INIT_GAME
[GemHuntFrame] sendInit called
[GemHuntFrame] frame: EXISTS
[GemHuntFrame] token: EXISTS
[GemHuntFrame] Sending INIT_GAME to origin: https://bft-games.vercel.app
[GemHuntFrame] INIT_GAME sent successfully
```

**Game Console:**
```
[API Config] Base URL: https://bft-api.onrender.com
[useGameSession] GAME_READY sent
[useGameSession] Received INIT_GAME with token
[useGameSession] applyAuthPayload called
[API] Fetching questions from https://bft-api.onrender.com/gem-hunt/questions
[API] Successfully fetched 5 questions from database
[QuestionPhase] Questions loaded: 5
```
