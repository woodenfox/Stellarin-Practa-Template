# Practa Starter Template

## Overview

This is a Replit-powered development environment for creating Practa - interactive wellbeing experiences for the Stellarin app. Use Replit's AI to describe what you want to build, iterate on your design, preview it in real-time, and submit it for review.

**No coding experience required.** Just describe your idea to Replit AI and it will build your Practa for you.

## What is a Practa?

A Practa is a self-contained React Native component that:
- Receives context from previous Practa in a Flow (if chained)
- Delivers an interactive wellbeing experience
- Calls `onComplete` with output when finished
- Optionally supports `onSkip` for user to exit early

## Important Note for AI Agents

**Only files within `client/my-practa/` are submitted to Stellarin.** All other files (components, screens, navigation, server, etc.) exist only for local development and preview - they will NOT be included in the final submission.

When building a Practa:
- Focus all implementation work in `client/my-practa/index.tsx`
- Update metadata in `client/my-practa/metadata.json`
- Place any assets in `client/my-practa/assets/`
- Use the Preview tab to test changes in real-time
- Do not modify files outside `client/my-practa/` unless explicitly requested for local preview purposes

## Getting Started

### 1. Describe Your Idea
Tell Replit AI what kind of wellbeing experience you want to create. Be specific about:
- The core interaction (breathing exercise, gratitude prompt, meditation timer, etc.)
- The visual style and mood
- How long the experience should take
- What the user should feel or accomplish

### 2. Iterate and Refine
Review the AI's implementation in the Preview tab. Ask for changes:
- "Make the animations smoother"
- "Add haptic feedback when the user taps"
- "Change the color scheme to be more calming"
- "Add a skip button for users who want to exit early"

### 3. Test Your Practa
Use the Preview tab to run through your Practa multiple times. Test on your phone using Expo Go by scanning the QR code. Make sure:
- All interactions work as expected
- The experience feels polished
- The completion flow works correctly

### 4. Configure Metadata
Update `client/my-practa/metadata.json` with your Practa details:
```json
{
  "id": "my-unique-practa",
  "name": "My Practa Name",
  "description": "What this Practa does",
  "author": "Your Name",
  "version": "1.0.0",
  "estimatedDuration": 60,
  "category": "wellness",
  "tags": ["meditation", "calm"]
}
```

### 5. Submit for Review
Once your Practa passes validation, use the Publish tab to submit it to Stellarin for review.

## Automatic Version Bumping

The template automatically increments your Practa's patch version (e.g., 1.0.0 → 1.0.1) whenever a new git commit is detected. This happens automatically when the server starts - no setup required after forking.

**How it works:**
- The server watches for new git commits
- When a new commit is detected, the patch version is incremented
- Both `client/my-practa/metadata.json` and `practa.config.json` are updated
- A cache file (`.cache/last-version-commit.json`) tracks the last processed commit to prevent duplicate bumps

**Note:** On first run after forking, the system initializes without bumping - versions only increment after your first commit.

## Practa ID

The Practa ID is defined in `metadata.json` using the `id` field. This is a unique identifier for your Practa (lowercase kebab-case, 3-50 characters, e.g., `gratitude-reflection`). The folder name always stays `my-practa`.

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
| `id` | Yes | Unique Practa ID (lowercase kebab-case, 3-50 chars) |
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
  "id": "gratitude-reflection",
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
- All required metadata fields are present (id, name, description, author, version)
- Version uses semver format (X.Y.Z)
- Component calls `onComplete`
- No direct `require()` for assets - must use `assets.ts` resolver
- All declared assets in `assets.ts` must exist in `./assets/` folder

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
assets.ts         # Asset resolver (required if using assets)
assets/           # Local assets folder (optional)
├── hero.png
├── background.jpg
└── chime.mp3
README.md         # Auto-generated on submission
```

This allows you to extract and rename the folder to whatever you prefer.

## Asset Rules

- All assets go in a flat `assets/` folder
- **Per-file limit**: 5MB maximum per asset
- **Total package limit**: 25MB maximum for entire Practa
- **Supported formats**: Images (png, jpg, jpeg, gif, webp, svg), Audio (mp3, wav, m4a, ogg), Video (mp4, webm), Data (json, txt)

### Using Assets (IMPORTANT)

**ALWAYS** use the `assets.ts` resolver to load assets. **NEVER** use `require()` directly in component code.

```typescript
// In assets.ts - register your assets here
const localAssets = {
  "background": require("./assets/background.png"),
  "icon": require("./assets/icon.svg"),
  "click-sound": require("./assets/click.mp3"),
} as const;

export type AssetKey = keyof typeof localAssets;

export const assets = (key: AssetKey): string => localAssets[key] as string;

// In index.tsx - use the resolver
import { assets } from "./assets";

// For images (React Native)
<Image source={{ uri: assets("background") }} />

// For images (Web)
<img src={assets("icon")} alt="Icon" />

// For audio
<audio src={assets("click-sound")} />
```

**Why this pattern?**
- Component code stays the same across local dev, publish, and Stellarin
- The `assets.ts` file is replaced with CDN URLs during publish
- Direct `require()` in components will break after publish
- TypeScript catches typos in asset keys at compile time
- Console warnings help debug missing assets

## Code Rules

- **Prefer single file**: Keep all code in `index.tsx` when possible
- **Helper files allowed**: For complex Practa, additional `.tsx` files are permitted
- **Use allowed APIs**: Expo SDK modules (haptics, audio, sensors, etc.) are available
- **Stay self-contained**: Do not make external network requests - use provided context/API
- **Export requirements**: Default component export only (metadata in separate JSON file)

## Demo Practas

The template includes example Practas in `client/demo-practa/` that demonstrate common patterns:

| Demo | Description | Techniques Shown |
|------|-------------|------------------|
| **Breathing Pause** | Guided breathing exercise | Animations, audio, progress bar, haptics |
| **Gratitude Prompt** | Text input for reflection | Keyboard handling, text input, state management |
| **Tap Counter** | Interactive tap counter | Gesture feedback, progress tracking, animations |

Try them from the **How To** tab in the app to see how they work.

**For AI Agents:** Reference these demos when building new Practas. They show best practices for assets, animations, and user interactions.

## Project Structure (Full Template)

```
client/
  my-practa/          # YOUR PRACTA - EDIT THIS
    index.tsx         # Your Practa component (default export)
    metadata.json     # Your Practa metadata
    assets.ts         # Asset resolver (use this to load assets)
    assets/           # Your local assets
  
  demo-practa/        # EXAMPLE PRACTAS - REFERENCE THESE
    breathing-pause/  # Breathing exercise with animations & audio
    gratitude-prompt/ # Text input for gratitude reflection
    tap-counter/      # Interactive tap counter
    index.ts          # Demo registry
  
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
| `client/demo-practa/` | Example Practas for reference |
| `client/types/flow.ts` | TypeScript types for Practa |
| `client/lib/practa-validator.ts` | Validation logic |
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
3. **Validate** using the Preview screen (validation runs automatically)
4. **Preview** using the app's Preview button
5. **Iterate** until your Practa feels polished
6. **Submit** for review via the Submit tab

## Resources

- [Practa Requirements](docs/practa-requirements.md) - Detailed requirements spec
- [Practa Plugin Architecture](docs/practa-plugin-architecture.md)
- [Flow System Documentation](docs/practa-flow-system.md)
- [Expo Icons](https://icons.expo.fyi) - Browse available icons
