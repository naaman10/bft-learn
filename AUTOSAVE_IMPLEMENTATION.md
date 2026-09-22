# Auto-Save Implementation for Answer Progress

## Problem
Previously, answers were only saved when users clicked the "Complete" button on the final section of a course. This meant:
- Users could lose their work if they navigated away
- No progress was saved while working through earlier sections
- Browser crashes or accidental tab closures resulted in lost answers

## Solution
Implemented automatic progress saving with the following features:

### 1. New API Function (`lib/api/learn.ts`)
- Added `SaveProgressPatch` type for saving progress without completing
- Added `saveLearnProgress()` function that PATCHes progress with `action: "save"`
- Maintains same structure as completion but marks items as `status: "in_progress"`

### 2. New Server Action (`app/learn/[contentId]/actions.ts`)
- Added `saveProgress()` server action
- Accepts `contentId`, `itemId`, and `answer`
- Returns `{ success: boolean, error?: string }`
- Handles authentication redirects on 401 errors
- Logs errors for debugging

### 3. New Client Component (`app/learn/answer-textarea.tsx`)
- Replaces the standard textarea for questions
- Features:
  - **Debounced auto-save**: Waits 1 second after user stops typing
  - **Visual feedback**: Shows "Saving...", "Saved ✓", or error messages
  - **Duplicate prevention**: Only saves when content actually changes
  - **Cleanup**: Properly clears timeouts on unmount

### 4. Updated Components
- **`question-text-section.tsx`**: Now accepts optional `contentId` prop and uses `AnswerTextarea` when available
- **`section-body.tsx`**: Passes `contentId` to `QuestionTextSection`
- **`[contentId]/[sectionIndex]/page.tsx`**: Provides `contentId` to `SectionBody`

## Technical Details

### API Request Structure
When auto-saving, the following is sent to `/learn/content/${contentId}/progress`:
```json
{
  "action": "save",
  "currentItemId": "entry123",
  "items": {
    "entry123": {
      "answer": "User's answer text...",
      "status": "in_progress"
    }
  }
}
```

### Debounce Strategy
- Timer starts when user types
- Each keystroke resets the 1-second countdown
- Only saves after 1 second of inactivity
- Prevents excessive API calls while maintaining responsiveness

### State Management
- Uses controlled component pattern (`value` + `onChange`)
- Tracks last saved value to prevent duplicate saves
- Manages save status for UI feedback

## Manual Testing Checklist

### Prerequisites
1. Backend API must be running and accessible at `API_URL`
2. User must be authenticated
3. Course content must have question sections with `entryId`

### Test Cases

#### 1. Basic Auto-Save
- [ ] Open a course section with a question
- [ ] Type an answer in the textarea
- [ ] Wait 1 second without typing
- [ ] Verify "Saving..." appears
- [ ] Verify "Saved ✓" appears after successful save
- [ ] Refresh the page
- [ ] Verify the answer persists

#### 2. Rapid Typing
- [ ] Type continuously for 5 seconds
- [ ] Verify save is not triggered until you stop
- [ ] Stop typing and wait 1 second
- [ ] Verify save is triggered once

#### 3. Navigation Preservation
- [ ] Type an answer
- [ ] Wait for auto-save confirmation
- [ ] Navigate to next section
- [ ] Navigate back to previous section
- [ ] Verify answer is still there

#### 4. Error Handling
- [ ] Disable network connection
- [ ] Type an answer
- [ ] Wait 1 second
- [ ] Verify error message appears
- [ ] Re-enable network
- [ ] Type more text
- [ ] Verify successful save

#### 5. Completion Flow
- [ ] Type answers in multiple sections
- [ ] Verify auto-saves work throughout
- [ ] Navigate to final section
- [ ] Click "Complete" button
- [ ] Verify all answers are submitted
- [ ] Check dashboard for completed status

#### 6. Empty/Whitespace Answers
- [ ] Type an answer
- [ ] Wait for save
- [ ] Delete all text
- [ ] Wait 1 second
- [ ] Verify empty answer is saved

## Browser Compatibility
Should work in all modern browsers that support:
- React Hooks (useState, useEffect, useCallback, useRef)
- async/await
- setTimeout/clearTimeout

## Performance Considerations
- Debouncing prevents excessive API calls
- Only sends requests when content changes
- Minimal re-renders due to proper hook usage
- Timeout cleanup prevents memory leaks

## Backend Requirements
The backend API endpoint must:
1. Accept PATCH requests to `/learn/content/:contentId/progress`
2. Support `action: "save"` (in addition to existing `action: "complete"`)
3. Update progress items with `status: "in_progress"`
4. Return progress status in response
5. Handle partial updates (saving one item at a time)

## Future Enhancements
- Add optimistic UI updates
- Implement retry logic for failed saves
- Add "Unsaved changes" warning on navigation
- Show last saved timestamp
- Support offline mode with local storage backup
