# Practa Starter Template - Design Guidelines

## Purpose
These guidelines help you create polished, consistent Practa experiences that fit seamlessly into the Stellarin wellbeing app.

## Design Philosophy

### iOS 26 Liquid Glass
Stellarin uses iOS 26's liquid glass design language:
- Frosted glass effects with subtle blur and tint
- Subtle spring animations like Dynamic Island
- Light reflection and organic movement
- Clean, minimal interfaces that let content shine

### Core Principles
1. **Clarity**: Users should immediately understand what to do
2. **Calm**: Wellbeing experiences should feel peaceful
3. **Feedback**: Every action should have a response (haptic, visual)
4. **Completion**: Always provide a clear path to finish

## Color System

### Using Colors
Always use the theme system via `useTheme()` hook:
```typescript
const { theme } = useTheme();
// theme.primary, theme.text, theme.textSecondary, theme.backgroundRoot, etc.
```

### Semantic Colors
- **Primary**: Main action color (buttons, active states)
- **Text**: Primary text color
- **TextSecondary**: Secondary/muted text
- **BackgroundRoot**: Screen background
- **BackgroundDefault**: Card/surface background
- **Border**: Subtle borders

## Typography

Use `ThemedText` component for all text:
```tsx
import { ThemedText } from "@/components/ThemedText";

<ThemedText style={{ fontSize: 28, fontWeight: "600" }}>
  Heading Text
</ThemedText>
```

### Type Scale
- **Large Title**: 32pt, Bold (700)
- **Title**: 24-28pt, Semibold (600)
- **Body**: 16pt, Regular (400)
- **Caption**: 14pt, Regular (400)
- **Label**: 12pt, Uppercase, Letter-spacing 1

## Spacing

Import from constants:
```typescript
import { Spacing, BorderRadius } from "@/constants/theme";
```

### Spacing Scale
- `Spacing.xs`: 4
- `Spacing.sm`: 8
- `Spacing.md`: 12
- `Spacing.lg`: 16
- `Spacing.xl`: 24

### Border Radius
- `BorderRadius.sm`: 8
- `BorderRadius.md`: 12
- `BorderRadius.lg`: 16

## Layout

### Safe Areas
Always account for device notch/home indicator:
```typescript
import { useSafeAreaInsets } from "react-native-safe-area-context";

const insets = useSafeAreaInsets();

// Container padding
paddingTop: insets.top + Spacing.xl
paddingBottom: insets.bottom + Spacing.lg
```

### Content Centering
For centered content (like affirmations):
```typescript
<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
  {/* Centered content */}
</View>
```

## Components

### Buttons
Use Pressable with theme colors:
```tsx
<Pressable
  onPress={handleAction}
  style={[styles.button, { backgroundColor: theme.primary }]}
>
  <ThemedText style={{ color: "white", fontWeight: "600" }}>
    Action Text
  </ThemedText>
</Pressable>
```

### Cards
Use the Card component for elevated surfaces:
```tsx
import { Card } from "@/components/Card";

<Card style={{ padding: Spacing.lg }}>
  {/* Card content */}
</Card>
```

## Animations

Use React Native Reanimated for smooth 60fps animations:
```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const opacity = useSharedValue(0);
opacity.value = withTiming(1, { duration: 500 });
```

### Common Patterns
- Fade in: `withTiming(1, { duration: 500 })`
- Spring scale: `Easing.out(Easing.back(1.5))`
- Smooth ease: `Easing.out(Easing.ease)`

## Haptic Feedback

Use haptics for key moments:
```typescript
import * as Haptics from "expo-haptics";

// Light feedback for selections
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Success feedback for completion
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

## Icons

Use Feather icons from @expo/vector-icons:
```tsx
import { Feather } from "@expo/vector-icons";

<Feather name="check" size={24} color={theme.primary} />
```

Browse available icons: https://icons.expo.fyi

## Skip Option

When your Practa supports `onSkip`, show a subtle secondary action:
```tsx
{onSkip ? (
  <Pressable onPress={onSkip} style={{ padding: Spacing.md }}>
    <ThemedText style={{ color: theme.textSecondary, fontSize: 14 }}>
      Skip for now
    </ThemedText>
  </Pressable>
) : null}
```

## Accessibility

- Minimum 44pt touch targets
- Clear contrast ratios (4.5:1 for text)
- Haptic feedback for all interactions
- Support for VoiceOver labels
