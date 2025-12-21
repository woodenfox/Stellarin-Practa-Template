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

### Project Structure

```
client/           # React Native/Expo frontend
  ├── components/   # Reusable UI components
  ├── screens/      # Screen components
  ├── navigation/   # Navigation configuration
  ├── context/      # React Context providers
  ├── hooks/        # Custom hooks
  ├── constants/    # Theme and config
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