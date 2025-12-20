import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { DurationChip } from "@/components/DurationChip";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useMeditation } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type PersonalizedMeditationRouteProp = RouteProp<RootStackParamList, "PersonalizedMeditation">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const STELLARIS_API_URL = process.env.EXPO_PUBLIC_STELLARIS_API_URL || "https://3d77cd5d-0f42-4969-9e97-483d81ea0de1-00-2r1phugtxs3kj.riker.replit.dev";

const DURATION_OPTIONS = [
  { label: "1 min", seconds: 60 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
];

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

export default function PersonalizedMeditationScreen() {
  useKeepAwake();

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PersonalizedMeditationRouteProp>();
  const { addSession, selectedDuration } = useMeditation();

  const { journalContent, riceEarned: initialRiceEarned } = route.params;

  const [stage, setStage] = useState<"setup" | "generating" | "meditating" | "complete">("setup");
  const [localDuration, setLocalDuration] = useState(selectedDuration || 180);
  const [meditationType, setMeditationType] = useState<"personalized" | "silent">("personalized");
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

    try {
      const prompt = `Based on this journal reflection: "${journalContent.slice(0, 500)}"

Create a calming ${Math.floor(localDuration / 60)}-minute meditation to help process these thoughts and feelings with mindfulness and peace.`;

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
      });

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
        startMeditationSession(audioUrl, data.duration_seconds || localDuration);
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (err) {
      console.error("Meditation generation error:", err);
      setError("Unable to generate personalized meditation. Starting silent meditation instead.");
      setTimeout(() => {
        setMeditationType("silent");
        startSilentMeditation();
      }, 2000);
    }
  };

  const startSilentMeditation = () => {
    setStage("meditating");
    setElapsedSeconds(0);
    lastMinuteRef.current = 0;
    setRiceEarned(0);
    setSessionCompleted(false);
  };

  const startMeditationSession = async (audioUrl: string, duration: number) => {
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
  }, [totalDuration, addSession, sessionCompleted]);

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

    if (meditationType === "personalized") {
      generateMeditation();
    } else {
      startSilentMeditation();
    }
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    if (playerRef.current && meditationType === "personalized" && generatedMeditation) {
      try {
        if (newPausedState) {
          playerRef.current.pause();
        } else {
          playerRef.current.play();
        }
      } catch (e) {}
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.release();
      } catch (e) {}
    }
    navigation.goBack();
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.goBack();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
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
            {meditationType === "personalized"
              ? "Your personalized meditation is complete"
              : "You completed your meditation session"}
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

        <Pressable
          onPress={handleDone}
          style={[styles.doneButton, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={styles.doneButtonText}>Done</ThemedText>
        </Pressable>
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
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>
        <View style={[styles.generatingIcon, { backgroundColor: theme.primary + "20" }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
        <ThemedText type="h3" style={styles.generatingTitle}>
          Creating Your Meditation
        </ThemedText>
        <ThemedText style={[styles.generatingSubtitle, { color: theme.textSecondary }]}>
          Generating a personalized experience based on your journal entry...
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
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>

        {meditationType === "personalized" && generatedMeditation ? (
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
            <Feather
              name={isPaused ? "play" : "pause"}
              size={32}
              color="#FFFFFF"
            />
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
      <Pressable style={styles.closeButton} onPress={handleClose}>
        <Feather name="x" size={24} color={theme.textSecondary} />
      </Pressable>

      <View style={styles.setupContent}>
        <View style={[styles.promptIcon, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="sun" size={48} color={theme.primary} />
        </View>

        {initialRiceEarned > 0 ? (
          <View style={[styles.riceEarnedBadge, { backgroundColor: theme.accent + "20" }]}>
            <ThemedText style={[styles.riceEarnedText, { color: theme.accent }]}>
              +{initialRiceEarned} rice earned for journaling today
            </ThemedText>
          </View>
        ) : null}

        <ThemedText type="h2" style={styles.promptTitle}>
          Would you like to meditate?
        </ThemedText>

        <ThemedText style={[styles.promptSubtitle, { color: theme.textSecondary }]}>
          A personalized meditation based on your journal entry
        </ThemedText>

        <View style={styles.typeToggle}>
          <Pressable
            onPress={() => setMeditationType("personalized")}
            style={[
              styles.typeButton,
              {
                backgroundColor: meditationType === "personalized" ? theme.primary : theme.backgroundDefault,
                borderColor: meditationType === "personalized" ? theme.primary : theme.border,
              },
            ]}
          >
            <Feather
              name="headphones"
              size={20}
              color={meditationType === "personalized" ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.typeButtonText,
                { color: meditationType === "personalized" ? "#FFFFFF" : theme.text },
              ]}
            >
              Personalized
            </ThemedText>
            <ThemedText
              style={[
                styles.typeButtonSubtext,
                { color: meditationType === "personalized" ? "rgba(255,255,255,0.8)" : theme.textSecondary },
              ]}
            >
              AI-generated audio
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setMeditationType("silent")}
            style={[
              styles.typeButton,
              {
                backgroundColor: meditationType === "silent" ? theme.primary : theme.backgroundDefault,
                borderColor: meditationType === "silent" ? theme.primary : theme.border,
              },
            ]}
          >
            <Feather
              name="volume-x"
              size={20}
              color={meditationType === "silent" ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.typeButtonText,
                { color: meditationType === "silent" ? "#FFFFFF" : theme.text },
              ]}
            >
              Silent
            </ThemedText>
            <ThemedText
              style={[
                styles.typeButtonSubtext,
                { color: meditationType === "silent" ? "rgba(255,255,255,0.8)" : theme.textSecondary },
              ]}
            >
              Timer only
            </ThemedText>
          </Pressable>
        </View>

        {meditationType === "personalized" ? (
          <View style={styles.voiceSection}>
            <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Voice
            </ThemedText>
            <View style={styles.voiceRow}>
              {VOICE_OPTIONS.map((voice) => (
                <Pressable
                  key={voice.value}
                  onPress={() => setSelectedVoice(voice.value)}
                  style={[
                    styles.voiceChip,
                    {
                      backgroundColor: selectedVoice === voice.value ? theme.primary : theme.backgroundDefault,
                      borderColor: selectedVoice === voice.value ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.voiceChipText,
                      { color: selectedVoice === voice.value ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {voice.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.durationSection}>
          <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Duration
          </ThemedText>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((option) => (
              <DurationChip
                key={option.seconds}
                label={option.label}
                durationSeconds={option.seconds}
                isSelected={localDuration === option.seconds}
                onPress={setLocalDuration}
              />
            ))}
          </View>
        </View>

        <Pressable
          onPress={handleStartMeditation}
          style={[styles.startButton, { backgroundColor: theme.primary }]}
        >
          <Feather name="play" size={20} color="#FFFFFF" />
          <ThemedText style={styles.startButtonText}>
            {meditationType === "personalized" ? "Generate & Start" : "Start Meditation"}
          </ThemedText>
        </Pressable>

        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <ThemedText style={[styles.skipButtonText, { color: theme.textSecondary }]}>
            Maybe later
          </ThemedText>
        </Pressable>
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
  closeButton: {
    position: "absolute",
    top: Spacing.xl,
    right: Spacing.lg,
    padding: Spacing.sm,
    zIndex: 10,
  },
  setupContent: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing["3xl"],
  },
  promptIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  riceEarnedBadge: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xl,
  },
  riceEarnedText: {
    fontWeight: "600",
    fontSize: 14,
  },
  promptTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  promptSubtitle: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    lineHeight: 22,
  },
  typeToggle: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
    width: "100%",
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  typeButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  typeButtonSubtext: {
    fontSize: 12,
  },
  voiceSection: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  voiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  voiceChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  voiceChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  durationSection: {
    width: "100%",
    marginBottom: Spacing["2xl"],
  },
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  skipButton: {
    paddingVertical: Spacing.md,
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
    textAlign: "center",
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
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
    textAlign: "center",
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
  doneButton: {
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.lg,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
