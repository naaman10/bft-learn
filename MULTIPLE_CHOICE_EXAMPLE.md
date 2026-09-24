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

## Answer Storage

The selected option's `id` is stored as the answer when the user completes the content.

## Detection Logic

The system automatically detects multiple choice questions by checking if the question has an `options` or `choices` field with a valid array of option objects. If not present, it falls back to the standard text answer question format.
