# Practa Requirements

This document defines the required schema and specifications for a valid Practa component.

## Required Exports

Your `client/my-practa/index.tsx` file must export:

1. **Default export**: Your Practa component (function component)
2. **Named export `metadata`**: Object with Practa metadata

```typescript
// Required default export
export default function MyPracta(props: PractaProps) {
  // ...
}

// Required named export
export const metadata = {
  type: "my-unique-type",
  name: "My Practa Name",
  // ... other fields
};
```

---

## Component Props Interface

Your Practa component must accept these props:

```typescript
interface PractaProps {
  // Context from the Flow engine
  context: PractaContext;
  
  // Must be called when Practa completes successfully
  onComplete: (output: PractaOutput) => void;
  
  // Optional: Allow users to skip this Practa
  onSkip?: () => void;
}
```

### PractaContext

```typescript
interface PractaContext {
  flowId: string;           // Unique ID for the current flow execution
  practaIndex: number;      // Position in flow (0 = first)
  previous?: {              // Output from previous Practa (if chained)
    practaId: string;
    practaType: string;
    content?: PractaContent;
    metadata?: PractaMetadata;
  };
}
```

### PractaOutput

When calling `onComplete`, provide this structure:

```typescript
interface PractaOutput {
  content?: {
    type: "text" | "image";  // What type of content
    value: string;           // The content itself (text or image URI)
  };
  metadata?: {
    source?: "user" | "ai" | "system";  // Who created the content
    duration?: number;                   // Time spent (seconds)
    themes?: string[];                   // Relevant themes
    emotionTags?: string[];              // Detected emotions
    [key: string]: unknown;              // Custom fields allowed
  };
}
```

---

## Metadata Schema

The `metadata` export must include these fields:

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Unique identifier for your Practa (lowercase, hyphens ok) |
| `name` | string | Display name shown to users |
| `description` | string | Brief explanation of what this Practa does |
| `author` | string | Your name or organization |
| `version` | string | Semantic version (e.g., "1.0.0") |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `estimatedDuration` | number | Expected time to complete (seconds) |
| `tags` | string[] | Categories like ["meditation", "breathing"] |
| `icon` | string | Feather icon name (e.g., "heart", "sun") |
| `riceRange` | [number, number] | Min/max rice earned [0, 50] |

### Example

```typescript
export const metadata = {
  // Required
  type: "gratitude-journal",
  name: "Gratitude Journal",
  description: "Write three things you're grateful for today",
  author: "Jane Developer",
  version: "1.0.0",
  
  // Optional
  estimatedDuration: 120,
  tags: ["journaling", "gratitude", "reflection"],
  icon: "heart",
  riceRange: [5, 15],
};
```

---

## Validation Rules

The validator checks these requirements:

### Structure Checks
- [ ] File exists at `client/my-practa/index.tsx`
- [ ] Has a default export (the component)
- [ ] Has a named `metadata` export

### Metadata Checks
- [ ] `type` is a non-empty string
- [ ] `type` uses valid characters (lowercase letters, numbers, hyphens)
- [ ] `name` is a non-empty string
- [ ] `description` is a non-empty string
- [ ] `author` is a non-empty string
- [ ] `version` follows semver format (e.g., "1.0.0")

### Component Checks
- [ ] Component is a function
- [ ] Component accepts `context` prop
- [ ] Component accepts `onComplete` prop
- [ ] Component optionally accepts `onSkip` prop

### Best Practices (Warnings)
- [ ] `estimatedDuration` is provided
- [ ] Uses `useTheme()` for colors (not hardcoded)
- [ ] Calls `Haptics` for tactile feedback
- [ ] Has a skip option (`onSkip`)

---

## Common Issues

### Missing onComplete Call

Your Practa must call `onComplete` at some point:

```typescript
// WRONG - No onComplete call
export default function MyPracta({ context, onComplete }) {
  return <Text>Hello</Text>;
}

// CORRECT - Calls onComplete
export default function MyPracta({ context, onComplete }) {
  const handleFinish = () => {
    onComplete({ content: { type: "text", value: "Done" } });
  };
  return <Pressable onPress={handleFinish}><Text>Finish</Text></Pressable>;
}
```

### Invalid Type Format

```typescript
// WRONG
type: "My Practa"     // spaces not allowed
type: "MyPracta"      // uppercase not recommended
type: ""              // empty not allowed

// CORRECT
type: "my-practa"
type: "gratitude-journal"
type: "breathing-exercise-v2"
```

### Missing Required Fields

```typescript
// WRONG - Missing description
export const metadata = {
  type: "my-practa",
  name: "My Practa",
  author: "Jane",
  version: "1.0.0",
};

// CORRECT - All required fields
export const metadata = {
  type: "my-practa",
  name: "My Practa",
  description: "A brief description of what this does",
  author: "Jane",
  version: "1.0.0",
};
```

---

## Running the Validator

The validator runs automatically in the Preview screen and shows:

- **Green checkmarks**: Requirements passed
- **Red X marks**: Requirements failed (must fix)
- **Yellow warnings**: Best practices suggestions

You can also run the validator from the terminal:

```bash
npm run validate
```

---

## Next Steps

Once your Practa passes all validation:

1. Test it thoroughly in the Preview
2. Make sure it works on both light and dark themes
3. Test with and without previous Practa context
4. Submit for review (coming soon)

See [Practa Plugin Architecture](./practa-plugin-architecture.md) for the full submission workflow.
