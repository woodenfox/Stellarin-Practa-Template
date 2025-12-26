# Practa Plugin Architecture: Curated Bundle Approach

This document describes how third-party developers can create, test, and publish Practa for the Stellarin wellbeing app.

## Overview

Practa are interactive wellbeing experiences - breathing exercises, journaling prompts, guided meditations, card draws, and more. The **Curated Bundle Approach** allows external developers to create their own Practa while maintaining security, quality, and a consistent user experience.

### How It Works

1. Developer creates a Practa using our starter template
2. Developer tests locally using Expo
3. Developer submits their bundle for review
4. Our team reviews, scans, and signs the bundle
5. Approved Practa become available to users

---

## Developer Workflow

### Getting Started

Third-party developers can build Practa using the **Practa Starter Template** - an Expo project that mirrors Stellarin's primitives and provides a testing harness.

#### Using Replit

Yes! Developers can use Replit to build and test their Practa:

1. Fork the Practa Starter Template on Replit
2. Develop your Practa component using the provided primitives
3. Test in the browser or scan the QR code to test on a physical device via Expo Go
4. Use the CLI to validate and bundle before submission

#### Local Development

Developers can also work locally with any Expo-compatible environment:

```bash
# Clone the starter template
npx create-practa my-breathing-exercise

# Start development
cd my-breathing-exercise
npm run dev

# Validate your practa
npm run validate

# Build submission bundle
npm run bundle
```

### Project Structure

```
my-practa/
├── src/
│   └── MyPracta.tsx      # Your Practa component
├── assets/               # Images, sounds, etc.
├── practa.manifest.json  # Metadata and capabilities
├── tests/
│   └── MyPracta.test.tsx # Contract tests
└── package.json
```

---

## The Practa Contract

Every Practa must implement this interface:

```typescript
interface PractaProps {
  // Context from the previous Practa in a Flow (if any)
  context: {
    previous?: {
      content?: PractaContent;
      metadata?: Record<string, unknown>;
    };
    flowId: string;
    practaIndex: number;
  };

  // Call when the Practa completes successfully
  onComplete: (output: PractaOutput) => void;

  // Call if the user wants to skip this Practa
  onSkip?: () => void;

  // Host-provided capabilities (see Capabilities section)
  capabilities: PractaCapabilities;
}

interface PractaOutput {
  content?: {
    text?: string;
    audioUri?: string;
    imageUri?: string;
  };
  metadata: {
    source: "user" | "ai" | "system";
    duration?: number;        // seconds spent
    riceEarned?: number;      // 0-50 range
    type: string;             // your practa type ID
    [key: string]: unknown;   // custom metadata
  };
}
```

### Example Practa

```tsx
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { PractaProps } from "@stellarin/practa-sdk";

export default function GratitudePracta({ 
  context, 
  onComplete, 
  onSkip,
  capabilities 
}: PractaProps) {
  const [gratitude, setGratitude] = useState("");

  const handleComplete = () => {
    capabilities.haptics.impact("light");
    
    onComplete({
      content: { text: gratitude },
      metadata: {
        source: "user",
        duration: 60,
        riceEarned: 5,
        type: "gratitude-reflection",
      },
    });
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>What are you grateful for today?</Text>
      <TextInput
        value={gratitude}
        onChangeText={setGratitude}
        multiline
      />
      <Pressable onPress={handleComplete}>
        <Text>Complete</Text>
      </Pressable>
    </View>
  );
}
```

---

## Capabilities

Practa don't have direct access to device APIs or external services. Instead, they request **capabilities** in their manifest, and the host app provides sandboxed access.

### Available Capabilities

| Capability | Description | Requires Approval |
|------------|-------------|-------------------|
| `timeline` | Publish content to user's Timeline | No |
| `haptics` | Trigger haptic feedback | No |
| `audio` | Play sounds, record voice | Yes |
| `camera` | Capture photos | Yes |
| `ai` | Access AI text generation | Yes |
| `storage` | Persist data between sessions | No |

### Declaring Capabilities

In `practa.manifest.json`:

```json
{
  "id": "com.developer.gratitude-reflection",
  "name": "Gratitude Reflection",
  "version": "1.0.0",
  "description": "A simple gratitude journaling exercise",
  "author": {
    "name": "Jane Developer",
    "email": "jane@example.com"
  },
  "capabilities": {
    "required": ["timeline", "haptics"],
    "optional": ["audio"]
  },
  "permissions": {
    "microphone": "Record voice reflections"
  },
  "riceRange": [1, 10],
  "estimatedDuration": 60
}
```

---

## AI Access

Many Practa benefit from AI capabilities - generating personalized meditations, responding to journal entries, creating affirmations, etc.

### How AI Access Works

**The host app provides AI access** - developers do NOT bring their own API keys.

```typescript
// In your Practa component
const { ai } = capabilities;

// Generate text
const meditation = await ai.generateText({
  prompt: "Create a 2-minute meditation about gratitude",
  maxTokens: 500,
});

// Stream text (for real-time display)
await ai.streamText({
  prompt: "Guide me through a body scan",
  onChunk: (text) => setDisplayText(prev => prev + text),
});
```

### Why Host-Managed AI?

1. **Security**: No API keys in third-party code
2. **Billing**: Stellarin manages costs with usage quotas
3. **Rate Limiting**: Prevents abuse
4. **Consistency**: Same AI behavior across all Practa
5. **Privacy**: User data stays within the app's control

### AI Usage Limits

| Tier | Requests/Day | Tokens/Request | Notes |
|------|--------------|----------------|-------|
| Standard | 50 | 1,000 | Default for all Practa |
| Extended | 200 | 2,000 | Requires approval |
| Unlimited | No limit | 4,000 | Partner developers only |

### AI Guidelines

- Use AI to enhance the experience, not replace human connection
- Don't store or transmit AI responses outside the app
- Provide fallback experiences if AI is unavailable
- Keep prompts focused on wellbeing and mindfulness

---

## Submission Pipeline

### Step 1: Develop and Test

Build your Practa using the starter template. Test thoroughly using:

- Expo Go on your device
- The contract test harness
- Mocked capabilities for edge cases

### Step 2: Validate

Run the validation CLI to check your bundle:

```bash
npm run validate
```

This checks:
- Manifest schema compliance
- Required exports
- Capability declarations match usage
- No forbidden API usage
- Bundle size limits

### Step 3: Bundle

Create a submission-ready bundle:

```bash
npm run bundle
```

This produces:
- `dist/practa-bundle.zip` - Your compiled code and assets
- `dist/manifest.signed.json` - Your manifest with integrity hash

### Step 4: Submit

Upload your bundle to the Stellarin Partner Portal:

1. Create a developer account
2. Upload your bundle
3. Provide additional metadata (screenshots, demo video)
4. Submit for review

### Step 5: Review Process

Our team will:
- Run automated security scans
- Test on multiple devices
- Review code for quality and safety
- Verify AI usage is appropriate
- Check UX consistency

Review typically takes 3-5 business days.

### Step 6: Publication

Once approved:
- Your Practa is signed with our certificate
- It becomes available in the Practa library
- Users can add it to their Flows
- You receive analytics on usage

---

## Testing Strategy

### Local Testing

The starter template includes a test harness that simulates the host environment:

```bash
# Run in development mode with hot reload
npm run dev

# Run contract tests
npm run test

# Run with mocked capabilities
npm run dev:mocked
```

### Contract Tests

Write tests that verify your Practa:
- Renders without crashing
- Calls onComplete with valid output
- Respects the PractaOutput schema
- Handles onSkip gracefully

```typescript
import { render, fireEvent } from "@testing-library/react-native";
import { MockCapabilities } from "@stellarin/practa-sdk/testing";
import GratitudePracta from "./GratitudePracta";

test("completes with valid output", async () => {
  const onComplete = jest.fn();
  const { getByText, getByPlaceholderText } = render(
    <GratitudePracta
      context={{ flowId: "test", practaIndex: 0 }}
      onComplete={onComplete}
      capabilities={MockCapabilities}
    />
  );

  fireEvent.changeText(
    getByPlaceholderText("Enter gratitude"),
    "My family"
  );
  fireEvent.press(getByText("Complete"));

  expect(onComplete).toHaveBeenCalledWith({
    content: { text: "My family" },
    metadata: expect.objectContaining({
      source: "user",
      type: "gratitude-reflection",
    }),
  });
});
```

### Staging Channel

Before final submission, you can request a staging channel to test your Practa in the real app:

1. Submit a "staging" build
2. We'll provide a special invite code
3. Test with real users in a sandboxed environment
4. Gather feedback before full publication

---

## Best Practices

### Design

- Follow Stellarin's visual design language
- Use the provided theme colors and spacing
- Support both light and dark modes
- Design for mobile-first (320px minimum width)

### Performance

- Keep bundle size under 500KB
- Lazy load heavy assets
- Use Reanimated for animations (60fps)
- Avoid blocking the main thread

### User Experience

- Provide clear instructions
- Show progress for multi-step experiences
- Allow graceful exit (onSkip)
- Give feedback for user actions (haptics, visual)

### Accessibility

- Use semantic text components
- Support screen readers
- Maintain adequate contrast ratios
- Don't rely solely on color for meaning

---

## Frequently Asked Questions

### Can I use my own AI API key for testing?

Yes, during local development you can configure a personal API key in your environment. However, published Practa must use the host-provided AI capability.

### What happens if my Practa is rejected?

You'll receive detailed feedback explaining what needs to change. Common reasons:
- Security concerns
- UX inconsistencies
- Excessive AI usage
- Missing accessibility features

### Can I update my Practa after publication?

Yes! Submit a new version through the partner portal. Updates go through an expedited review (1-2 days) if changes are minor.

### How do I earn money from my Practa?

We're exploring a revenue sharing model for popular Practa. Join our partner program for early access.

### Can my Practa work offline?

Yes, but AI capabilities require connectivity. Design your Practa to gracefully degrade when offline.

---

## Resources

- [Practa Starter Template](https://github.com/stellarin/practa-starter)
- [SDK Documentation](https://docs.stellarin.app/practa-sdk)
- [Partner Portal](https://partners.stellarin.app)
- [Design Guidelines](https://docs.stellarin.app/design)
- [Discord Community](https://discord.gg/stellarin)

---

## Appendix: Manifest Schema

```json
{
  "$schema": "https://stellarin.app/schemas/practa-manifest.json",
  "id": "string (reverse domain notation)",
  "name": "string (display name)",
  "version": "string (semver)",
  "description": "string (1-200 chars)",
  "author": {
    "name": "string",
    "email": "string (optional)",
    "url": "string (optional)"
  },
  "capabilities": {
    "required": ["timeline", "haptics", "..."],
    "optional": ["ai", "audio", "..."]
  },
  "permissions": {
    "microphone": "string (reason)",
    "camera": "string (reason)"
  },
  "riceRange": [min, max],
  "estimatedDuration": "number (seconds)",
  "tags": ["meditation", "breathing", "..."],
  "icon": "string (path to icon)",
  "screenshots": ["string (paths)"],
  "minHostVersion": "string (semver)"
}
```
