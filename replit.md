# Stellarin

## Overview

Stellarin is a cross-platform meditation app built with Expo/React Native that gamifies mindfulness practice. Users complete meditation sessions to earn virtual "rice" that will be tracked and potentially donated to charity. The app features timed meditation sessions, streak tracking, progress challenges, and community statistics.

The app follows a tab-based navigation pattern with four main screens (Timer, Progress, Community, About) and a modal session screen for active meditation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Expo SDK 54 with React Native 0.81, targeting iOS, Android, and Web
- Uses React 19 with the experimental React Compiler enabled
- New Architecture enabled for improved performance

**Navigation**: React Navigation v7
- Native Stack Navigator for root-level navigation with modal presentation for meditation sessions
- Bottom Tab Navigator with 4 tabs (Timer, Progress, Community, About)
- Blur effect tab bar on iOS, solid background on Android

**State Management**:
- React Context (MeditationContext) for meditation state: sessions, rice earned, streaks, challenge progress
- AsyncStorage for local data persistence
- TanStack React Query for server state management (prepared but not heavily used yet)

**Animations**: React Native Reanimated v4 for smooth 60fps animations
- Animated circular progress timer
- Spring-based button interactions
- Pulse effects for live indicators

**Styling Approach**:
- Theme system with light/dark mode support via `useTheme` hook
- Centralized design tokens in `constants/theme.ts` (Colors, Spacing, BorderRadius, Typography)
- Platform-specific adaptations (blur effects on iOS, solid backgrounds on Android/Web)

### Backend Architecture

**Server**: Express.js with TypeScript
- Runs on port 5000
- CORS configured for Replit domains
- Currently minimal - routes file is mostly a placeholder

**Storage**: 
- MemStorage class for in-memory data (users only currently)
- Drizzle ORM configured for PostgreSQL (schema exists but database not actively used)
- Main app data persisted client-side via AsyncStorage

### Flow/Practa System

**Purpose**: Composable wellbeing system that chains atomic actions (Practa) together with context-aware personalization.

**Core Concepts**:
- **Practa**: Self-contained, reusable atomic actions (journal, meditation, etc.) that receive context and emit output
- **Flow**: A sequence of Practa that execute in order with automatic context passing
- **PractaContext**: Local context from the previous Practa only (not full flow history)

**Key Components**:
- `client/types/flow.ts`: Type definitions for Practa, Flow, PractaContext, PractaContent
- `client/context/FlowContext.tsx`: Flow engine provider managing execution state and context passing
- `client/practa/registry.ts`: Registry of Practa definitions and preset flows
- `client/screens/FlowScreen.tsx`: Orchestrator component that renders current Practa in sequence
- `client/practa/*.tsx`: Individual Practa components (JournalPracta, SilentMeditationPracta, PersonalizedMeditationPracta)

**Preset Flows**:
- `morningReflection`: Journal → Personalized AI Meditation
- `quickMeditation`: 5-minute silent meditation
- `deepDive`: Journal → 15-minute personalized meditation

**Context Passing**: When a Practa completes, its output (content + metadata) is passed to the next Practa via `context.previous`.

**Architecture Design**:
- Practa components are pure and self-contained - they emit PractaOutput without side effects
- FlowScreen orchestrates all persistence via a central `persistPractaOutput` callback
- This callback handles both MeditationContext persistence and Timeline publishing
- Registry-driven component mapping (PRACTA_COMPONENTS) replaces hardcoded switch statements

### Timeline System

**Purpose**: Unified content feed displaying all user-generated content (journal entries, meditations, milestones).

**Key Components**:
- `client/types/timeline.ts`: Type definitions for TimelineItem
- `client/context/TimelineContext.tsx`: Timeline provider with AsyncStorage persistence
- `client/screens/TimelineScreen.tsx`: "Your Journey" screen with swipe-to-delete

**Features**:
- Unified feed replacing separate journal reflections view
- Swipe-to-delete with haptic feedback
- Audio playback for voice recordings
- Flexible metadata for different item types (journal, meditation, milestone)

### Project Structure

```
client/           # React Native/Expo frontend
  ├── components/   # Reusable UI components
  ├── screens/      # Screen components
  ├── navigation/   # Navigation configuration
  ├── context/      # React Context providers (includes FlowContext)
  ├── hooks/        # Custom hooks
  ├── constants/    # Theme and config
  ├── practa/       # Practa components and registry
  ├── types/        # TypeScript type definitions
  └── lib/          # API client utilities

server/           # Express backend
  ├── routes.ts     # API route definitions
  ├── storage.ts    # Data storage layer
  └── templates/    # HTML templates

shared/           # Shared code between client/server
  └── schema.ts     # Drizzle schema and Zod types
```

### Path Aliases

- `@/` → `./client/`
- `@shared/` → `./shared/`

## External Dependencies

### Core Framework
- **Expo SDK 54**: Cross-platform mobile development
- **React Navigation 7**: Navigation (native-stack, bottom-tabs)

### UI/Animation
- **React Native Reanimated 4**: Gesture-driven animations
- **expo-blur/expo-glass-effect**: iOS blur effects
- **expo-haptics**: Tactile feedback
- **@expo/vector-icons (Feather)**: Icon library

### Data Layer
- **TanStack React Query**: Server state caching
- **AsyncStorage**: Local persistence
- **Drizzle ORM + drizzle-zod**: Database ORM (PostgreSQL ready)
- **Zod**: Schema validation

### Backend
- **Express**: HTTP server
- **pg**: PostgreSQL client (configured but not required currently)

### Build/Dev
- **tsx**: TypeScript execution for server
- **esbuild**: Server bundling for production