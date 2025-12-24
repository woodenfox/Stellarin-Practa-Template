import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import Animated, {
  useSharedValue,
  useDerivedValue,
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
const STELLARIS_API_URL = process.env.EXPO_PUBLIC_STELLARIS_API_URL || "https://stellarin-meditation-backend.replit.app";

const VOICE_OPTIONS = [
  { value: "nova", label: "Nova" },
  { value: "sage", label: "Sage" },
  { value: "shimmer", label: "Shimmer" },
  { value: "echo", label: "Echo" },
];

interface GeneratedMeditation {
  audioUrl: string;
  duration: number;
  name: string;
  description: string;
}

interface PersonalizedMeditationPractaProps {
  context: PractaContext;
  onComplete: PractaCompleteHandler;
  onSkip?: () => void;
}

export function PersonalizedMeditationPracta({ context, onComplete, onSkip }: PersonalizedMeditationPractaProps) {
  useKeepAwake();

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { addSession, selectedDuration } = useMeditation();

  const journalContent = context.previous?.content?.type === "text" 
    ? context.previous.content.value 
    : "";

  const [stage, setStage] = useState<"setup" | "generating" | "meditating" | "complete">("setup");
  const [localDuration, setLocalDuration] = useState(selectedDuration || 180);
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [generatedMeditation, setGeneratedMeditation] = useState<GeneratedMeditation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [riceEarned, setRiceEarned] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const pauseScale = useSharedValue(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMinuteRef = useRef(0);
  const playerRef = useRef<AudioPlayer | null>(null);

  const totalDuration = useMemo(() => {
    return generatedMeditation?.duration || localDuration;
  }, [generatedMeditation, localDuration]);

  const timeRemaining = useMemo(() => {
    return Math.max(0, totalDuration - elapsedSeconds);
  }, [totalDuration, elapsedSeconds]);

  const progressValue = useSharedValue(0);

  useDerivedValue(() => {
    progressValue.value = totalDuration > 0 ? elapsedSeconds / totalDuration : 0;
  }, [elapsedSeconds, totalDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const generateMeditation = async () => {
    setStage("generating");
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const prompt = journalContent
        ? `Based on this journal reflection: "${journalContent.slice(0, 500)}"

Create a calming ${Math.floor(localDuration / 60)}-minute meditation to help process these thoughts and feelings with mindfulness and peace.`
        : `Create a calming ${Math.floor(localDuration / 60)}-minute meditation for relaxation and mindfulness.`;

      const response = await fetch(`${STELLARIS_API_URL}/api/orchestrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          voice: selectedVoice,
          background_music_enabled: true,
          duration_seconds: localDuration,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to generate meditation");
      }

      const data = await response.json();

      if (data.status === "success" && data.url) {
        const audioUrl = data.url.startsWith("http")
          ? data.url
          : `${STELLARIS_API_URL}${data.url}`;

        setGeneratedMeditation({
          audioUrl,
          duration: data.duration_seconds || localDuration,
          name: data.json_data?.name || "Personalized Meditation",
          description: data.json_data?.description || "",
        });
        startMeditationSession(audioUrl);
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (err) {
      console.error("Meditation generation error:", err);
      setError("Unable to generate personalized meditation.");
      setStage("setup");
    }
  };

  const startMeditationSession = async (audioUrl: string) => {
    setStage("meditating");
    setElapsedSeconds(0);
    lastMinuteRef.current = 0;
    setRiceEarned(0);
    setSessionCompleted(false);

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });

      if (playerRef.current) {
        playerRef.current.release();
      }

      playerRef.current = createAudioPlayer({ uri: audioUrl });
      playerRef.current.play();
    } catch (err) {
      console.error("Failed to play audio:", err);
    }
  };

  const handleComplete = useCallback(async () => {
    if (sessionCompleted) return;
    setSessionCompleted(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStage("complete");

    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch (e) {}
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const session = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      duration: totalDuration,
      riceEarned: Math.floor(totalDuration / 60) * 10,
      completedAt: new Date().toISOString(),
    };

    await addSession(session);

    const output: PractaOutput = {
      metadata: {
        source: "ai",
        duration: totalDuration,
        riceEarned: Math.floor(totalDuration / 60) * 10,
        meditationName: generatedMeditation?.name,
        type: "personalized",
      },
    };

    onComplete(output);
  }, [totalDuration, addSession, sessionCompleted, generatedMeditation, onComplete]);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.release();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (stage !== "meditating" || sessionCompleted) return;

    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= totalDuration) {
            handleComplete();
            return totalDuration;
          }
          return next;
        });
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [stage, isPaused, totalDuration, handleComplete, sessionCompleted]);

  useEffect(() => {
    if (stage !== "meditating") return;

    const currentMinute = Math.floor(elapsedSeconds / 60);

    if (currentMinute > lastMinuteRef.current) {
      const newRice = currentMinute * 10;
      setRiceEarned(newRice);
      lastMinuteRef.current = currentMinute;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [elapsedSeconds, stage]);

  const handleStartMeditation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    generateMeditation();
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    if (playerRef.current && generatedMeditation) {
      try {
        if (newPausedState) {
          playerRef.current.pause();
        } else {
          playerRef.current.play();
        }
      } catch (e) {}
    }
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
            Your personalized meditation is complete
          </ThemedText>

          <View style={[styles.statsCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: theme.accent }]}>
                +{Math.floor(totalDuration / 60) * 10}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Rice Earned
              </ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: theme.primary }]}>
                {Math.floor(totalDuration / 60)}
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

  if (stage === "generating") {
    return (
      <View
        style={[
          styles.container,
          styles.centeredContainer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={[styles.generatingIcon, { backgroundColor: theme.primary + "20" }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
        <ThemedText type="h3" style={styles.generatingTitle}>
          Creating Your Meditation
        </ThemedText>
        <ThemedText style={[styles.generatingSubtitle, { color: theme.textSecondary }]}>
          {journalContent
            ? "Generating a personalized experience based on your reflection..."
            : "Generating your meditation experience..."}
        </ThemedText>
        {error ? (
          <ThemedText style={[styles.errorText, { color: theme.accent }]}>
            {error}
          </ThemedText>
        ) : null}
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
        {generatedMeditation ? (
          <View style={styles.meditationInfo}>
            <ThemedText type="h4" style={styles.meditationName}>
              {generatedMeditation.name}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.progressContainer}>
          <CircularProgress
            progress={progressValue}
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
          <Feather name="headphones" size={48} color={theme.primary} />
        </View>

        <ThemedText type="h2" style={styles.title}>
          Personalized Meditation
        </ThemedText>

        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {journalContent
            ? "An AI-generated meditation based on your reflection"
            : "A meditation crafted just for you"}
        </ThemedText>

        <View style={styles.durationSection}>
          <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Duration
          </ThemedText>
          <DurationPicker selectedDuration={localDuration} onSelect={setLocalDuration} />
        </View>

        <View style={styles.voiceSection}>
          <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Voice
          </ThemedText>
          <View style={styles.voiceOptions}>
            {VOICE_OPTIONS.map((voice) => (
              <Pressable
                key={voice.value}
                onPress={() => setSelectedVoice(voice.value)}
                style={[
                  styles.voiceOption,
                  {
                    backgroundColor:
                      selectedVoice === voice.value ? theme.primary : theme.backgroundDefault,
                    borderColor: selectedVoice === voice.value ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.voiceOptionText,
                    { color: selectedVoice === voice.value ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {voice.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={handleStartMeditation}
          style={[styles.startButton, { backgroundColor: theme.primary }]}
        >
          <Feather name="play" size={20} color="#FFFFFF" />
          <ThemedText style={styles.startButtonText}>Generate & Start</ThemedText>
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
  centeredContainer: {
    alignItems: "center",
    justifyContent: "center",
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
  voiceSection: {
    width: "100%",
    marginBottom: Spacing["2xl"],
    alignItems: "center",
  },
  voiceOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  voiceOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  voiceOptionText: {
    fontWeight: "500",
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
  generatingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  generatingTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  generatingSubtitle: {
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  meditationInfo: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  meditationName: {
    textAlign: "center",
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
