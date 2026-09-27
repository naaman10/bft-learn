# Simple Prompts for Each Repository

## 1. bft-learn (Frontend) ✅ DONE

**Status:** Complete - PR ready to merge

**PR:** https://github.com/naaman10/bft-learn/pull/19

No further action needed.

---

## 2. bft-games (Game) ✅ DONE

**Status:** Complete - game authentication working

**What was done:**
- Game sends GAME_READY
- Game receives INIT_GAME token
- Game sends QUIZ_COMPLETE with results
- Game calls `/api/games/sessions` to save

No further action needed.

---

## 3. bft-api (Backend) ⚠️ NEEDS FIX

### Cursor Prompt for bft-api:

```
Fix the foreign key constraint error in the /api/games/sessions endpoint.

PROBLEM:
When games try to save session results, we get this error:
"insert or update on table 'game_sessions' violates foreign key constraint 'game_sessions_user_id_fkey'"

ROOT CAUSE:
The endpoint is trying to use user.sub (neon_user_id) directly as a foreign key,
but the game_sessions table references student_id from the students table.

FIX REQUIRED:
Find the POST /api/games/sessions endpoint handler and add a student lookup 
before inserting into game_sessions.

BEFORE (broken):
```typescript
const user = c.get('user');
const body = await c.req.json();

await db.prepare(`
  INSERT INTO game_sessions (user_id, score, ...)
  VALUES (?, ?, ...)
`).bind(user.sub, body.score, ...).run();
```

AFTER (fixed):
```typescript
const user = c.get('user');
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
  INSERT INTO game_sessions (student_id, score, ...)
  VALUES (?, ?, ...)
`).bind(student.student_id, body.score, ...).run();
```

FILE TO MODIFY:
- Likely: src/routes/games.ts
- Or: src/routes/api/games/sessions.ts
- Or search for: "INSERT INTO game_sessions"

TESTING:
After the fix, complete a quiz in the app. Console should show:
[MathsQuiz] Saved to API: {"sessionId":"...","score":100}
[QuizGeneratorFrame] ✅ Quiz results saved successfully!

No foreign key error.
```

---

## Summary

| Repo | Status | Action |
|------|--------|--------|
| bft-learn | ✅ Done | Merge PR #19 |
| bft-games | ✅ Done | Already deployed |
| bft-api | ⚠️ Fix needed | Use prompt above |

**Total effort:** 15-30 minutes (backend fix only)
