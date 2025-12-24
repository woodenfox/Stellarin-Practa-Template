import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { CircularProgress } from "@/components/CircularProgress";
import { DurationPicker } from "@/components/DurationPicker";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { PractaContext, PractaOutput, PractaCompleteHandler } from "@/types/flow";
import { useMeditation } from "@/context/MeditationContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const GONG_SOUND_URL = "https://www.orangefreesounds.com/wp-content/uploads/2015/07/Gong-sound-effect.mp3";

interface SilentMeditationPractaProps {
  context: PractaContext;
  onComplete: PractaCompleteHandler;
  onSkip?: () => void;
}

export function SilentMeditationPracta({ context, onComplete, onSkip }: SilentMeditationPractaProps) {
  useKeepAwake();

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { addSession, selectedDuration } = useMeditation();

  const [stage, setStage] = useState<"setup" | "meditating" | "complete">("setup");
  const [duration, setDuration] = useState(selectedDuration || 180);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [riceEarned, setRiceEarned] = useState(0);

  const progress = useSharedValue(0);
  const pauseScale = useSharedValue(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMinuteRef = useRef(0);
  const gongPlayerRef = useRef<AudioPlayer | null>(null);

  const playGong = useCallback(async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });

      if (gongPlayerRef.current) {
        gongPlayerRef.current.release();
      }

      gongPlayerRef.current = createAudioPlayer({ uri: GONG_SOUND_URL });
      gongPlayerRef.current.play();
    } catch (err) {
      console.error("Failed to play gong:", err);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMeditationComplete = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStage("complete");
    playGong();

    const session = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      duration,
      riceEarned: Math.floor(duration / 60) * 10,
      completedAt: new Date().toISOString(),
    };

    await addSession(session);

    const output: PractaOutput = {
      metadata: {
        source: "system",
        duration,
        riceEarned: Math.floor(duration / 60) * 10,
        type: "silent",
      },
    };

    onComplete(output);
  }, [duration, addSession, playGong, onComplete]);

  useEffect(() => {
    return () => {
      if (gongPlayerRef.current) {
        try {
          gongPlayerRef.current.release();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (stage !== "meditating") return;

    progress.value = withTiming(1, {
      duration: duration * 1000,
      easing: Easing.linear,
    });

    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            runOnJS(handleMeditationComplete)();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [stage, isPaused, duration, handleMeditationComplete, progress]);

  useEffect(() => {
    if (stage !== "meditating") return;

    const elapsedSeconds = duration - timeRemaining;
    const currentMinute = Math.floor(elapsedSeconds / 60);

    if (currentMinute > lastMinuteRef.current) {
      const newRice = currentMinute * 10;
      setRiceEarned(newRice);
      lastMinuteRef.current = currentMinute;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [timeRemaining, duration, stage]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeRemaining(duration);
    lastMinuteRef.current = 0;
    setRiceEarned(0);
    setStage("meditating");
    playGong();
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(!isPaused);
  };

  const pauseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pauseScale.value }],
  }));

  if (stage === "complete") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundRoot,
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.completeContent}>
          <View style={[styles.successIcon, { backgroundColor: theme.primary }]}>
            <Feather name="check" size={48} color="#FFFFFF" />
          </View>
          <ThemedText type="h2" style={styles.completeTitle}>
            Well Done!
          </ThemedText>
          <ThemedText style={[styles.completeSubtitle, { color: theme.textSecondary }]}>
            You completed your meditation
          </ThemedText>

          <View style={[styles.statsCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: theme.accent }]}>
                +{Math.floor(duration / 60) * 10}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Rice Earned
              </ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: theme.primary }]}>
                {Math.floor(duration / 60)}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Minutes
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (stage === "meditating") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundRoot,
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.progressContainer}>
          <CircularProgress
            progress={progress}
            timeRemaining={formatTime(timeRemaining)}
            riceEarned={riceEarned}
          />
        </View>

        <View style={styles.controls}>
          <AnimatedPressable
            onPress={handlePause}
            onPressIn={() => {
              pauseScale.value = withSpring(0.9);
            }}
            onPressOut={() => {
              pauseScale.value = withSpring(1);
            }}
            style={[
              styles.mainControlButton,
              { backgroundColor: theme.primary },
              pauseAnimatedStyle,
            ]}
          >
            <Feather name={isPaused ? "play" : "pause"} size={32} color="#FFFFFF" />
          </AnimatedPressable>
        </View>

        {isPaused ? (
          <ThemedText style={[styles.pausedText, { color: theme.textSecondary }]}>
            Paused - Tap play to continue
          </ThemedText>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing["3xl"],
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.setupContent}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="volume-x" size={48} color={theme.primary} />
        </View>

        <ThemedText type="h2" style={styles.title}>
          Silent Meditation
        </ThemedText>

        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {context.previous
            ? "Sit with what you've reflected on"
            : "Find stillness with a timed session"}
        </ThemedText>

        <View style={styles.durationSection}>
          <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Duration
          </ThemedText>
          <DurationPicker selectedDuration={duration} onSelect={setDuration} />
        </View>

        <Pressable
          onPress={handleStart}
          style={[styles.startButton, { backgroundColor: theme.primary }]}
        >
          <Feather name="play" size={20} color="#FFFFFF" />
          <ThemedText style={styles.startButtonText}>Begin</ThemedText>
        </Pressable>

        {onSkip ? (
          <Pressable onPress={onSkip} style={styles.skipButton}>
            <ThemedText style={[styles.skipButtonText, { color: theme.textSecondary }]}>
              Skip
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  setupContent: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing["3xl"],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    lineHeight: 22,
  },
  durationSection: {
    width: "100%",
    marginBottom: Spacing["2xl"],
    alignItems: "center",
  },
  sectionLabel: {
    marginBottom: Spacing.lg,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  skipButton: {
    alignItems: "center",
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  skipButtonText: {
    fontSize: 16,
  },
  progressContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing["2xl"],
    marginBottom: Spacing["3xl"],
  },
  mainControlButton: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pausedText: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  completeContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  completeTitle: {
    marginBottom: Spacing.sm,
  },
  completeSubtitle: {
    fontSize: 16,
    marginBottom: Spacing["3xl"],
  },
  statsCard: {
    flexDirection: "row",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    gap: Spacing["2xl"],
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: "100%",
  },
});
