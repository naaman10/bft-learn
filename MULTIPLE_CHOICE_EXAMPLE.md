# Multiple Choice Questions - Usage Guide

## Overview

Multiple choice questions are automatically detected and rendered when a question in Contentful includes an `options` or `choices` field containing an array of option objects.

## Contentful Data Format

The options should be provided in the following JSON format:

```json
[
  {
    "id": "1",
    "text": "To suggest that another mystery may have happened."
  },
  {
    "id": "2",
    "text": "To show that Maya did not understand the clues."
  },
  {
    "id": "3",
    "text": "To prove that Oliver was lying."
  },
  {
    "id": "4",
    "text": "To explain why the library clock stopped."
  }
]
```

### With Images

Options can include an optional `imageUrl` field:

```json
[
  {
    "id": "1",
    "text": "Red Apple",
    "imageUrl": "https://example.com/red-apple.jpg"
  },
  {
    "id": "2",
    "text": "Green Apple",
    "imageUrl": "https://example.com/green-apple.jpg"
  }
]
```

## Field Names

The component will look for options in these field names (in order):
- `options`
- `choices`

## Layout

- **Desktop**: Options are displayed in a 2x2 grid
- **Mobile**: Options are displayed in a single column

## Visual Features

- ✅ Radio button indicator for selected option
- 🎨 Accent color highlighting for selected state
- 🖼️ Image display above option text (when provided)
- 📱 Responsive design for all screen sizes
- 💾 Auto-save functionality (saves selection automatically)
- 📊 Save status indicator (Saving/Saved/Error)

## Answer Storage

The selected option's `id` is stored as the answer when the user completes the content or changes their selection.

## Auto-Save Behavior

The component supports two modes:

1. **Auto-save mode** (when `contentId` and `entryId` are available):
   - Selection is automatically saved when changed
   - Shows save status indicator
   - Buttons are disabled while saving

2. **Form submission mode** (completion/submission):
   - Selection is stored in hidden input
   - Submitted with form when user completes the content

## Detection Logic

The system automatically detects multiple choice questions by checking if the question has an `options` or `choices` field with a valid array of option objects. If not present, it falls back to the standard text answer question format.

## Troubleshooting

### Options Not Appearing

If options don't appear:
1. Check that the `options` or `choices` field exists in Contentful
2. Verify the field contains a valid JSON array
3. Ensure each option has both `id` and `text` fields
4. Check browser console for any parsing errors

### Images Not Loading

If images don't load:
1. Verify the `imageUrl` field contains a valid URL
2. Check that the image URLs are accessible
3. Ensure images are properly configured in Contentful

### Question Type Detection

The component checks for the presence of options to determine if a question is multiple choice. The question must:
- Have `contentType` set to `"question"`
- Have an `options` or `choices` field
- The options field must contain a valid array with at least one option
