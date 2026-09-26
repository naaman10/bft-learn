# Backend API Update Required for Multiple Choice Answer Display

## Issue
Students' answers for multiple choice questions currently only show the option index/ID (e.g., "1", "2") instead of the human-readable answer text.

## Frontend Changes Made
The frontend has been updated to support displaying the actual answer text:

1. Updated `AssessmentQuestion` type in `/lib/api/learn.ts` to include:
   - `questionType?: string` - to identify multiple choice questions
   - `options?: Array<{ id: string; text: string; imageUrl?: string }>` - to provide the answer choices

2. Updated `/app/learn/assessment/[assessmentId]/page.tsx` to:
   - Map the `userAnswer` ID to the actual option text when displaying
   - Fall back to showing the raw answer for non-multiple-choice questions

## Backend API Changes Required

The `/learn/assessment/:assessmentId` endpoint needs to be updated to include additional fields in the response:

### Current Response Structure
```json
{
  "assessmentId": "string",
  "enrollmentName": "string",
  "totalPointsEarned": 0,
  "totalPointsAvailable": 0,
  "questions": [
    {
      "questionId": "string",
      "questionText": "string",
      "pointsAvailable": 0,
      "pointsEarned": 0,
      "feedback": "string | null",
      "userAnswer": "string | null"
    }
  ],
  "assessmentFeedback": "string | null",
  "assessmentDate": "string | null"
}
```

### Updated Response Structure Required
```json
{
  "assessmentId": "string",
  "enrollmentName": "string",
  "totalPointsEarned": 0,
  "totalPointsAvailable": 0,
  "questions": [
    {
      "questionId": "string",
      "questionText": "string",
      "questionType": "questionMultipleChoice",  // NEW FIELD
      "pointsAvailable": 0,
      "pointsEarned": 0,
      "feedback": "string | null",
      "userAnswer": "1",  // Option ID as currently stored
      "options": [  // NEW FIELD - include for multiple choice questions
        {
          "id": "1",
          "text": "She was looking for a book",
          "imageUrl": "https://..." // optional
        },
        {
          "id": "2",
          "text": "She was meeting a friend"
        }
      ]
    }
  ],
  "assessmentFeedback": "string | null",
  "assessmentDate": "string | null"
}
```

### Implementation Notes

1. **questionType Field**: Should be set to `"questionMultipleChoice"` for multiple choice questions, or the appropriate content type ID from Contentful.

2. **options Field**: 
   - Only include for multiple choice questions
   - Parse the options from the original question data (likely stored in Contentful)
   - Include all options (not just the selected one) to maintain context
   - Each option should have an `id` matching the stored answer format

3. **Alternative Approach**: Instead of including all options, the backend could resolve `userAnswer` to the actual text:
   ```json
   {
     "userAnswer": "She was looking for a book",  // Resolved text instead of ID
     "userAnswerId": "1"  // Keep original ID for reference if needed
   }
   ```

## Testing
Once the backend is updated, test with:
1. Multiple choice questions with text-only options
2. Multiple choice questions with images
3. Text answer questions (should continue to work as before)
4. Questions where the student didn't provide an answer (userAnswer is null)

## Priority
**High** - This affects the readability of assessment results for students and tutors.
