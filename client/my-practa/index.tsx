import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { PractaContext, PractaOutput, PractaCompleteHandler } from "@/types/flow";

interface MyPractaProps {
  context: PractaContext;
  onComplete: PractaCompleteHandler;
  onSkip?: () => void;
}

const AFFIRMATIONS = [
  "I am worthy of love and kindness.",
  "I embrace this moment with gratitude.",
  "I am growing stronger every day.",
  "I choose peace over worry.",
  "I am enough, exactly as I am.",
  "I trust the journey of my life.",
  "I radiate calm and positivity.",
  "I am open to new possibilities.",
];

export function MyPracta({
  context,
  onComplete,
  onSkip,
}: MyPractaProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [affirmation, setAffirmation] = useState("");

  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.9);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  useEffect(() => {
    const randomAffirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    setAffirmation(randomAffirmation);

    textOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) });
    textScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    onComplete({
      content: { type: "text", value: affirmation },
      metadata: {
        source: "system",
        duration: 15,
      },
    });
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <View style={styles.content}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Today's Affirmation
        </ThemedText>

        <Animated.View style={animatedStyle}>
          <ThemedText style={styles.affirmation}>{affirmation}</ThemedText>
        </Animated.View>

        <ThemedText style={[styles.instruction, { color: theme.textSecondary }]}>
          Take a deep breath and let this sink in.
        </ThemedText>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable
          onPress={handleComplete}
          style={[styles.button, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={styles.buttonText}>I embrace this</ThemedText>
        </Pressable>

        {onSkip ? (
          <Pressable onPress={onSkip} style={styles.skipButton}>
            <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
              Skip for now
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </ThemedView>
  );
}

export const metadata = {
  type: "my-practa",
  name: "My Practa",
  description: "Edit this to create your own Practa experience",
  author: "Your Name",
  version: "1.0.0",
  estimatedDuration: 15,
};

export default MyPracta;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  label: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.lg,
  },
  affirmation: {
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 40,
  },
  instruction: {
    fontSize: 16,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
  },
  button: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  skipButton: {
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  skipText: {
    fontSize: 14,
  },
});
