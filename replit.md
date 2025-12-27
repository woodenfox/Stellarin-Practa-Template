# Practa Starter Template

## Overview

This is a minimal starter template for building Practa - interactive wellbeing experiences that can be submitted to the Stellarin app. Fork this template to create your own Practa, test it locally, and submit it for review.

## What is a Practa?

A Practa is a self-contained React Native component that:
- Receives context from previous Practa in a Flow (if chained)
- Delivers an interactive wellbeing experience
- Calls `onComplete` with output when finished
- Optionally supports `onSkip` for user to exit early

## Important Note for AI Agents

Only files within `client/my-practa/` are included when submitting a Practa. Changes to any other files (components, screens, navigation, server, etc.) will NOT be included in the submission and will NOT affect the final Practa.

Before modifying any files outside `client/my-practa/`, confirm with the user that they understand these changes are for local development/preview only and won't be part of their submitted Practa.

## Getting Started

### 1. Edit Your Practa
Open `client/my-practa/index.tsx` and modify the example to create your own experience.

### 2. Configure Metadata
Edit `client/my-practa/metadata.json` with your Practa details:
```json
{
  "name": "My Practa Name",
  "description": "What this Practa does",
  "author": "Your Name",
  "version": "1.0.0",
  "estimatedDuration": 60,
  "category": "wellness",
  "tags": ["meditation", "calm"]
}
```

### 3. Validate Your Practa
The Preview screen shows real-time validation status. You can also run the CLI validator:
```bash
npx tsx validate-practa.ts
```

### 4. Preview Your Practa
Run the app and tap "Preview Practa" to see your changes in action.

## Practa ID

The Practa ID is automatically derived from the folder name (`my-practa`). To change your Practa ID, rename the `client/my-practa/` folder to your desired ID (lowercase with hyphens, e.g., `gratitude-reflection`).

## Practa Requirements

For complete requirements documentation, see [Practa Requirements](docs/practa-requirements.md).

### Required Exports

Your `client/my-practa/index.tsx` must have:
1. **Default export**: Your Practa component

### Required Files

Your `client/my-practa/` folder must contain:
1. **index.tsx**: Your Practa component (default export)
2. **metadata.json**: Practa metadata configuration

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

### Metadata Schema (metadata.json)

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name |
| `description` | Yes | Brief explanation |
| `author` | Yes | Your name |
| `version` | Yes | Semantic version (e.g., "1.0.0") |
| `estimatedDuration` | No | Time in seconds |
| `category` | No | Category for discovery (e.g., "wellness", "mindfulness") |
| `tags` | No | Array of tags for search/filtering |

#### Example metadata.json

```json
{
  "name": "Gratitude Reflection",
  "description": "A guided gratitude journaling experience",
  "author": "Your Name",
  "version": "1.0.0",
  "estimatedDuration": 120,
  "category": "mindfulness",
  "tags": ["gratitude", "journaling", "reflection"]
}
```

## Validation

The template includes automatic validation that checks:

**Required (Errors)**:
- File exists at `client/my-practa/index.tsx`
- Default export (component) exists
- metadata.json exists and is valid JSON
- All required metadata fields are present (name, description, author, version)
- Version uses semver format (X.Y.Z)
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

## Practa Structure

Your Practa submission will be packaged as a ZIP with this structure (files at root, no wrapper folder):

```
index.tsx         # Main component (default export required)
metadata.json     # Practa metadata (required)
assets/           # Local assets folder (optional)
├── hero.png
├── background.jpg
└── chime.mp3
README.md         # Auto-generated on submission
```

This allows you to extract and rename the folder to whatever you prefer.

## Asset Rules

- All assets go in a flat `assets/` folder
- Use relative paths only - NEVER use absolute URLs or external links
- Reference assets by filename in your component
- **Per-file limit**: 5MB maximum per asset
- **Total package limit**: 25MB maximum for entire Practa
- **Supported formats**: Images (png, jpg, jpeg, gif, webp, svg), Audio (mp3, wav, m4a, ogg), Video (mp4, webm), Data (json, txt)

Asset URLs are resolved at runtime by the Stellarin app.

## Code Rules

- **Prefer single file**: Keep all code in `index.tsx` when possible
- **Helper files allowed**: For complex Practa, additional `.tsx` files are permitted
- **Use allowed APIs**: Expo SDK modules (haptics, audio, sensors, etc.) are available
- **Stay self-contained**: Do not make external network requests - use provided context/API
- **Export requirements**: Default component export only (metadata in separate JSON file)

## Project Structure (Full Template)

```
client/
  my-practa/          # YOUR PRACTA - EDIT THIS
    index.tsx         # Your Practa component (default export)
    metadata.json     # Your Practa metadata
    assets/           # Your local assets
  
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
practa.config.json    # Synced copy of metadata (for editor)

server/               # Express backend (minimal for preview)
```

## Path Aliases

- `@/` → `./client/`
- `@shared/` → `./shared/`

## Key Files

| File | Purpose |
|------|---------|
| `client/my-practa/index.tsx` | Your Practa implementation |
| `client/my-practa/metadata.json` | Your Practa metadata |
| `client/types/flow.ts` | TypeScript types for Practa |
| `client/lib/practa-validator.ts` | Validation logic |
| `validate-practa.ts` | CLI validator |
| `practa.config.json` | Synced metadata for editor UI |
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
2. **Configure** `client/my-practa/metadata.json`
3. **Validate** using the Preview screen or `npx tsx validate-practa.ts`
4. **Preview** using the app's Preview button
5. **Iterate** until your Practa feels polished
6. **Submit** for review via the Submit tab

## Resources

- [Practa Requirements](docs/practa-requirements.md) - Detailed requirements spec
- [Practa Plugin Architecture](docs/practa-plugin-architecture.md)
- [Flow System Documentation](docs/practa-flow-system.md)
- [Expo Icons](https://icons.expo.fyi) - Browse available icons
