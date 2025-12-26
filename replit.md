# Practa Starter Template

## Overview

This is a minimal starter template for building Practa - interactive wellbeing experiences that can be submitted to the Stellarin app. Fork this template to create your own Practa, test it locally, and submit it for review.

## What is a Practa?

A Practa is a self-contained React Native component that:
- Receives context from previous Practa in a Flow (if chained)
- Delivers an interactive wellbeing experience
- Calls `onComplete` with output when finished
- Optionally supports `onSkip` for user to exit early

## Getting Started

### 1. Edit Your Practa
Open `client/my-practa/index.tsx` and modify the example to create your own experience.

### 2. Validate Your Practa
The Preview screen shows real-time validation status. You can also run the CLI validator:
```bash
npx tsx validate-practa.ts
```

### 3. Preview Your Practa
Run the app and tap "Preview Practa" to see your changes in action.

### 4. Update Metadata
Export a `metadata` object with your Practa details:
```typescript
export const metadata = {
  type: "my-unique-type",
  name: "My Practa Name",
  description: "What this Practa does",
  author: "Your Name",
  version: "1.0.0",
  estimatedDuration: 60, // seconds
};
```

## Practa Requirements

For complete requirements documentation, see [Practa Requirements](docs/practa-requirements.md).

### Required Exports

Your `client/my-practa/index.tsx` must export:
1. **Default export**: Your Practa component
2. **Named export `metadata`**: Object with Practa details

### Component Props

```typescript
interface PractaProps {
  context: PractaContext;
  onComplete: (output: PractaOutput) => void;
  onSkip?: () => void;
}

interface PractaContext {
  flowId: string;
  practaIndex: number;
  previous?: {
    practaId: string;
    practaType: string;
    content?: { type: "text" | "image"; value: string };
    metadata?: Record<string, unknown>;
  };
}

interface PractaOutput {
  content?: { type: "text" | "image"; value: string };
  metadata?: Record<string, unknown>;
}
```

### Metadata Schema

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | Unique identifier (lowercase, hyphens) |
| `name` | Yes | Display name |
| `description` | Yes | Brief explanation |
| `author` | Yes | Your name |
| `version` | Yes | Semantic version (e.g., "1.0.0") |
| `estimatedDuration` | No | Time in seconds |

## Validation

The template includes automatic validation that checks:

**Required (Errors)**:
- File exists at `client/my-practa/index.tsx`
- Default export (component) exists
- Metadata export exists
- All required metadata fields are present
- Type uses valid format (lowercase, hyphens)
- Version uses semver format
- Component calls `onComplete`

**Recommended (Warnings)**:
- Uses `useTheme()` for colors
- Uses haptic feedback
- Supports `onSkip`
- Uses safe area insets

## Available APIs

Your Practa has full access to:
- All React Native primitives
- Expo SDK modules (haptics, audio, animations, etc.)
- Theme system via `useTheme()` hook
- Spacing/BorderRadius constants
- ThemedText and ThemedView components
- React Native Reanimated for animations

## Project Structure

```
client/
  my-practa/          # YOUR PRACTA - EDIT THIS
    index.tsx         # Your Practa component + metadata
  
  components/         # Shared UI components
  constants/          # Theme tokens (Colors, Spacing, etc.)
  context/            # FlowContext for execution engine
  hooks/              # useTheme, useScreenOptions, etc.
  lib/                # Utilities including practa-validator
  navigation/         # Navigation setup
  practa/             # Registry and exports
  screens/            # Preview and Flow screens
  types/              # TypeScript definitions

docs/                 # Architecture documentation
  practa-requirements.md     # Detailed requirements spec
  practa-plugin-architecture.md
  practa-flow-system.md

validate-practa.ts    # CLI validator script

server/               # Express backend (minimal for preview)
```

## Path Aliases

- `@/` → `./client/`
- `@shared/` → `./shared/`

## Key Files

| File | Purpose |
|------|---------|
| `client/my-practa/index.tsx` | Your Practa implementation |
| `client/types/flow.ts` | TypeScript types for Practa |
| `client/lib/practa-validator.ts` | Validation logic |
| `validate-practa.ts` | CLI validator |
| `docs/practa-requirements.md` | Full requirements spec |
| `docs/practa-plugin-architecture.md` | Architecture docs |

## Best Practices

### Design
- Use `useTheme()` for colors - supports light/dark mode
- Use `Spacing` and `BorderRadius` constants for consistency
- Follow iOS liquid glass design principles

### User Experience
- Always provide a clear way to complete (button, gesture, timer)
- Support `onSkip` for users who want to exit early
- Use haptic feedback for key actions

### Performance
- Use React Native Reanimated for smooth 60fps animations
- Lazy load heavy assets
- Keep your Practa lightweight and focused

## Development Workflow

1. **Edit** `client/my-practa/index.tsx`
2. **Validate** using the Preview screen or `npx tsx validate-practa.ts`
3. **Preview** using the app's Preview button
4. **Iterate** until your Practa feels polished
5. **Submit** for review (coming soon)

## Resources

- [Practa Requirements](docs/practa-requirements.md) - Detailed requirements spec
- [Practa Plugin Architecture](docs/practa-plugin-architecture.md)
- [Flow System Documentation](docs/practa-flow-system.md)
- [Expo Icons](https://icons.expo.fyi) - Browse available icons
