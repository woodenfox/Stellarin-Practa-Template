import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { PractaContext, PractaOutput, PractaCompleteHandler } from "@/types/flow";

interface IntegrationBreathPractaProps {
  context: PractaContext;
  onComplete: PractaCompleteHandler;
  onSkip?: () => void;
}

const TOTAL_CYCLES = 6;
const INHALE_DURATION = 2000;
const TOPOFF_DURATION = 1000;
const EXHALE_DURATION = 6000;
const PAUSE_BETWEEN = 500;

const EXHALE_WORDS = ["All", "parts", "to-", "geth-", "er", "one"];

const QUOTE = {
  text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
  author: "Thich Nhat Hanh",
};

export function IntegrationBreathPracta({ context, onComplete, onSkip }: IntegrationBreathPractaProps) {
  useKeepAwake();

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [stage, setStage] = useState<"intro" | "breathing" | "complete">("intro");
  const [currentCycle, setCurrentCycle] = useState(0);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "topoff" | "exhale" | "pause">("inhale");
  const [currentWord, setCurrentWord] = useState("");
  const [displayText, setDisplayText] = useState("Here");

  const circleScale = useSharedValue(0.6);
  const textOpacity = useSharedValue(1);
  const cycleRef = useRef(0);
  const isRunningRef = useRef(false);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const runBreathCycle = useCallback(async () => {
    if (!isRunningRef.current) return;

    setBreathPhase("inhale");
    setDisplayText("Here");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    circleScale.value = withTiming(0.85, { duration: INHALE_DURATION, easing: Easing.inOut(Easing.ease) });

    await new Promise(r => setTimeout(r, INHALE_DURATION));
    if (!isRunningRef.current) return;

    setBreathPhase("topoff");
    setDisplayText("Now");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    circleScale.value = withTiming(1, { duration: TOPOFF_DURATION, easing: Easing.inOut(Easing.ease) });

    await new Promise(r => setTimeout(r, TOPOFF_DURATION));
    if (!isRunningRef.current) return;

    setBreathPhase("exhale");
    const wordDuration = EXHALE_DURATION / EXHALE_WORDS.length;
    
    circleScale.value = withTiming(0.6, { duration: EXHALE_DURATION, easing: Easing.inOut(Easing.ease) });

    for (let i = 0; i < EXHALE_WORDS.length; i++) {
      if (!isRunningRef.current) return;
      setDisplayText(EXHALE_WORDS[i]);
      if (i === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await new Promise(r => setTimeout(r, wordDuration));
    }

    if (!isRunningRef.current) return;

    setBreathPhase("pause");
    setDisplayText("");
    await new Promise(r => setTimeout(r, PAUSE_BETWEEN));

    cycleRef.current += 1;
    setCurrentCycle(cycleRef.current);

    if (cycleRef.current >= TOTAL_CYCLES) {
      isRunningRef.current = false;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStage("complete");
      
      const output: PractaOutput = {
        metadata: {
          source: "system",
          duration: 60,
          riceEarned: 10,
          type: "integration-breath",
        },
      };
      onComplete(output);
    } else {
      runBreathCycle();
    }
  }, [circleScale, onComplete]);

  const startBreathing = useCallback(() => {
    setStage("breathing");
    cycleRef.current = 0;
    setCurrentCycle(0);
    isRunningRef.current = true;
    runBreathCycle();
  }, [runBreathCycle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startBreathing();
    }, 2000);

    return () => {
      clearTimeout(timer);
      isRunningRef.current = false;
    };
  }, [startBreathing]);

  if (stage === "intro") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top + Spacing.xl }]}>
        <View style={styles.introContent}>
          <ThemedText style={styles.introTitle}>Here / Now Integration Breath</ThemedText>
          <ThemedText style={[styles.introSubtitle, { color: theme.textSecondary }]}>
            A one-minute breath to arrive in Self and unify your inner system.
          </ThemedText>
          <View style={[styles.quoteCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.quoteText, { color: theme.textSecondary }]}>
              "{QUOTE.text}"
            </ThemedText>
            <ThemedText style={[styles.quoteAuthor, { color: theme.primary }]}>
              - {QUOTE.author}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  }

  if (stage === "complete") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top + Spacing.xl }]}>
        <View style={styles.completeContent}>
          <View style={[styles.completeCircle, { backgroundColor: theme.primary + "20" }]}>
            <ThemedText style={[styles.completeIcon, { color: theme.primary }]}>
              {"\u2713"}
            </ThemedText>
          </View>
          <ThemedText style={styles.completeTitle}>You are Here. Now.</ThemedText>
          <ThemedText style={[styles.completeSubtitle, { color: theme.textSecondary }]}>
            All parts together, one.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.breathContainer}>
        <Animated.View
          style={[
            styles.breathCircle,
            { backgroundColor: theme.primary + "30", borderColor: theme.primary },
            circleStyle,
          ]}
        >
          <Animated.View style={textStyle}>
            <ThemedText style={[styles.breathWord, { color: theme.primary }]}>
              {displayText}
            </ThemedText>
          </Animated.View>
        </Animated.View>

        <View style={styles.phaseContainer}>
          <ThemedText style={[styles.phaseText, { color: theme.textSecondary }]}>
            {breathPhase === "inhale" && "Inhale deeply..."}
            {breathPhase === "topoff" && "Top off..."}
            {breathPhase === "exhale" && "Exhale slowly..."}
            {breathPhase === "pause" && ""}
          </ThemedText>
        </View>

        <View style={styles.progressContainer}>
          <ThemedText style={[styles.cycleText, { color: theme.textSecondary }]}>
            Breath {currentCycle + 1} of {TOTAL_CYCLES}
          </ThemedText>
          <View style={styles.progressDots}>
            {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: i < currentCycle ? theme.primary : theme.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  introContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  introSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  quoteCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  breathContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  breathCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  breathWord: {
    fontSize: 42,
    fontWeight: "700",
    textAlign: "center",
  },
  phaseContainer: {
    marginTop: Spacing.xl,
    height: 30,
  },
  phaseText: {
    fontSize: 18,
    textAlign: "center",
  },
  progressContainer: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  cycleText: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  progressDots: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  completeContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  completeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  completeIcon: {
    fontSize: 48,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  completeSubtitle: {
    fontSize: 16,
    textAlign: "center",
  },
});
