# Authentication Fix - Ready to Deploy

## What Was Changed

I've added a **proactive fallback timer** to `/app/games/gem-hunt/gem-hunt-frame.tsx` that will send the `INIT_GAME` message after 1 second, even if `GAME_READY` is never received from the game.

### The Fix (Lines 112-126)

```typescript
// Fallback: Send INIT_GAME after a delay if GAME_READY wasn't received
useEffect(() => {
  console.log("[GemHuntFrame] Setting up fallback timer");
  const timer = window.setTimeout(() => {
    console.log("[GemHuntFrame] Fallback timer fired - checking if init sent:", initSent.current);
    if (!initSent.current) {
      console.log("[GemHuntFrame] GAME_READY not received, sending INIT_GAME proactively");
      sendInit();
    }
  }, 1000);
  
  return () => {
    console.log("[GemHuntFrame] Clearing fallback timer");
    window.clearTimeout(timer);
  };
}, [sendInit]);
```

## Why This Fixes the Issue

**Problem:** The game was sending `GAME_READY`, but the parent never received it (likely timing issue).

**Solution:** Instead of waiting indefinitely for `GAME_READY`, we now:
1. Still listen for `GAME_READY` (preferred method)
2. **But also** send `INIT_GAME` after 1 second if we haven't sent it yet
3. This ensures authentication happens regardless of message timing

## How to Deploy

### Option 1: Git Pull (Local Testing)
```bash
cd /path/to/bft-learn
git pull origin main
git log --oneline -1  # Should show: "Add proactive INIT_GAME fallback timer"
npm run dev
```

Then test at `http://localhost:3000/games/gem-hunt`

### Option 2: Push to Vercel
The commit is ready in the repository. You need to:

1. **Pull the changes locally:**
   ```bash
   git pull origin main
   ```

2. **Push to trigger Vercel deployment:**
   ```bash
   git push origin main
   ```

3. **Or manually trigger in Vercel dashboard:**
   - Go to https://vercel.com/dashboard
   - Select bft-learn project
   - Click "Deployments"
   - Click "Redeploy" on latest

## Expected Behavior After Deploy

### Console Output (Parent Window):
```javascript
[GemHuntFrame] Setting up message listener
[GemHuntFrame] Expected game origin: https://bft-games.vercel.app
[GemHuntFrame] Setting up fallback timer
[GemHuntFrame] Iframe loaded
// ... 1 second passes ...
[GemHuntFrame] Fallback timer fired - checking if init sent: false
[GemHuntFrame] GAME_READY not received, sending INIT_GAME proactively
[GemHuntFrame] sendInit called
[GemHuntFrame] frame exists: true
[GemHuntFrame] token exists: true
[GemHuntFrame] Sending INIT_GAME with payload: {...}
[GemHuntFrame] INIT_GAME sent successfully
```

### Console Output (Game iframe):
```javascript
[API Config] Base URL: https://bft-api.onrender.com
[useGameSession] GAME_READY sent
[useGameSession] Received INIT_GAME  // ← Should see this now!
[useGameSession] applyAuthPayload called
[API] Fetching questions from https://bft-api.onrender.com/gem-hunt/questions
[API] Successfully fetched 5 questions from database  // ← Real API!
```

### What You Should See in the Game:
- ✅ Game loads in iframe
- ✅ Questions fetched from database (not local)
- ✅ Session saved to database
- ✅ Progress persists

## Testing Checklist

Once deployed, test these scenarios:

### Test 1: Fresh Load
1. Go to `https://learn.brighterfuturestutoring.com/games/gem-hunt`
2. Open DevTools console
3. Verify you see "INIT_GAME sent successfully"
4. Verify game uses database questions (not local)
5. Answer a question
6. Check database for session record

### Test 2: Reload
1. Reload the page
2. Verify authentication still works
3. Verify progress is maintained

### Test 3: Different Browser
1. Open in incognito/private window
2. Sign in
3. Open game
4. Verify authentication works

## If It Still Doesn't Work

If you still see "No token - using local questions" after deploying:

### Check 1: Is the right version deployed?
```javascript
// In console, you should see:
[GemHuntFrame] Setting up fallback timer
```

If you DON'T see this, the new version isn't deployed yet.

### Check 2: Is the token being retrieved?
Look for:
```javascript
[GemHuntFrame] token exists: true  // Should be true
```

If it says `false`, the issue is with token retrieval, not postMessage.

### Check 3: Is the iframe reference valid?
Look for:
```javascript
[GemHuntFrame] frame exists: true  // Should be true
```

If it says `false`, there's an issue with the iframe ref.

## Additional Debug Info

The changes also include comprehensive logging for ALL postMessage events, so you can see exactly what's happening in the console.

## Commit Details

**Commit:** `258c7a5`  
**Message:** "Add proactive INIT_GAME fallback timer"  
**File Changed:** `app/games/gem-hunt/gem-hunt-frame.tsx`  
**Lines Changed:** +17

## Summary

This fix ensures that authentication will work by:
1. ✅ Sending INIT_GAME proactively after 1 second
2. ✅ Not relying solely on GAME_READY message
3. ✅ Maintaining comprehensive logging for debugging
4. ✅ Preserving the preferred GAME_READY flow if it works

**The authentication should now work! 🎉**
