import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useMeditation } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type SessionRouteProp = RouteProp<RootStackParamList, "Session">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GONG_SOUND_URL = "https://www.orangefreesounds.com/wp-content/uploads/2015/07/Gong-sound-effect.mp3";

export default function SessionScreen() {
  useKeepAwake();
  
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SessionRouteProp>();
  const { addSession } = useMeditation();

  const { duration } = route.params;
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [riceEarned, setRiceEarned] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
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

  const handleComplete = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsComplete(true);
    playGong();

    const session = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      duration,
      riceEarned: Math.floor(duration / 60) * 10,
      completedAt: new Date().toISOString(),
    };

    await addSession(session);
  }, [duration, addSession, playGong]);

  useEffect(() => {
    playGong();
    
    return () => {
      if (gongPlayerRef.current) {
        try {
          gongPlayerRef.current.release();
        } catch (e) {}
      }
    };
  }, [playGong]);

  useEffect(() => {
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
            runOnJS(handleComplete)();
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
  }, [duration, isPaused, handleComplete, progress]);

  useEffect(() => {
    const elapsedSeconds = duration - timeRemaining;
    const currentMinute = Math.floor(elapsedSeconds / 60);
    
    if (currentMinute > lastMinuteRef.current) {
      const newRice = currentMinute * 10;
      setRiceEarned(newRice);
      lastMinuteRef.current = currentMinute;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [timeRemaining, duration]);

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(!isPaused);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    navigation.goBack();
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.goBack();
  };

  const pauseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pauseScale.value }],
  }));

  if (isComplete) {
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
            You completed your meditation session
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

        <Pressable
          onPress={handleDone}
          style={[styles.doneButton, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={styles.doneButtonText}>Done</ThemedText>
        </Pressable>
      </View>
    );
  }

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
          onPressIn={() => { pauseScale.value = withSpring(0.9); }}
          onPressOut={() => { pauseScale.value = withSpring(1); }}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: Spacing.sm,
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
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
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
  doneButton: {
    height: Spacing.buttonHeight,
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
