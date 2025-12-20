import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, Platform, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, AudioModule } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
  interpolate,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useMeditation, JournalEntry } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CIRCLE_SIZE = SCREEN_WIDTH * 0.6;
const NUM_RINGS = 3;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RecordingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { addJournalEntry } = useMeditation();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(audioRecorder, 50);

  const amplitude = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const ring1Scale = useSharedValue(1);
  const ring2Scale = useSharedValue(1);
  const ring3Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.3);
  const ring2Opacity = useSharedValue(0.2);
  const ring3Opacity = useSharedValue(0.1);

  useEffect(() => {
    checkPermission();
    return () => {
      cleanup();
    };
  }, []);

  const cleanupAnimationsAndTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    cancelAnimation(pulseScale);
    cancelAnimation(ring1Scale);
    cancelAnimation(ring2Scale);
    cancelAnimation(ring3Scale);
  };

  const cleanup = () => {
    cleanupAnimationsAndTimer();
    audioRecorder.stop();
  };

  useEffect(() => {
    if (!isRecording) return;

    const level = recorderState.metering ?? -60;
    const normalized = Math.max(0, Math.min(1, (level + 60) / 60));
    amplitude.value = withSpring(normalized, {
      damping: 15,
      stiffness: 150,
    });

    const ringScale = 1 + normalized * 0.4;
    ring1Scale.value = withSpring(ringScale, { damping: 12, stiffness: 100 });
    ring2Scale.value = withSpring(1 + normalized * 0.6, { damping: 14, stiffness: 90 });
    ring3Scale.value = withSpring(1 + normalized * 0.8, { damping: 16, stiffness: 80 });

    ring1Opacity.value = withSpring(0.3 + normalized * 0.3);
    ring2Opacity.value = withSpring(0.2 + normalized * 0.2);
    ring3Opacity.value = withSpring(0.1 + normalized * 0.15);
  }, [recorderState.metering, isRecording]);

  const checkPermission = async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionGranted(status.granted);
      if (status.granted) {
        startRecording();
      }
    } catch (error) {
      setPermissionGranted(false);
    }
  };

  const startRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      startPulseAnimation();
      audioRecorder.record();
    } catch (error) {
      console.error("Failed to start recording:", error);
      cleanup();
      setIsRecording(false);
    }
  };

  const startPulseAnimation = () => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      cleanupAnimationsAndTimer();
      setIsRecording(false);

      await audioRecorder.stop();

      const uri = audioRecorder.uri;
      if (!uri) {
        navigation.goBack();
        return;
      }

      const permanentUri = `${FileSystem.documentDirectory}audio_${Date.now()}.m4a`;
      await FileSystem.copyAsync({ from: uri, to: permanentUri });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const today = new Date().toISOString().split("T")[0];
      const entry: JournalEntry = {
        id: Date.now().toString(),
        date: today,
        content: "",
        createdAt: new Date().toISOString(),
        type: "audio",
        audioUri: permanentUri,
        audioDuration: recordingDuration,
      };

      await addJournalEntry(entry);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to stop recording:", error);
      navigation.goBack();
    }
  };

  const cancelRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cleanup();
    navigation.goBack();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const centerCircleStyle = useAnimatedStyle(() => {
    const scale = interpolate(amplitude.value, [0, 1], [1, 1.2]);
    return {
      transform: [{ scale: scale * pulseScale.value }],
    };
  });

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: ring3Opacity.value,
  }));

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.webNotice, { marginTop: insets.top + Spacing["3xl"] }]}>
          <Feather name="info" size={48} color={theme.textSecondary} />
          <ThemedText type="h3" style={styles.webNoticeTitle}>
            Voice Recording
          </ThemedText>
          <ThemedText style={[styles.webNoticeText, { color: theme.textSecondary }]}>
            Voice recording is available in Expo Go. Open the app on your phone to record voice notes.
          </ThemedText>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: theme.primary }]}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (permissionGranted === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.permissionNotice, { marginTop: insets.top + Spacing["3xl"] }]}>
          <Feather name="mic-off" size={48} color={theme.error} />
          <ThemedText type="h3" style={styles.webNoticeTitle}>
            Microphone Access Required
          </ThemedText>
          <ThemedText style={[styles.webNoticeText, { color: theme.textSecondary }]}>
            Please enable microphone access in your device settings to record voice notes.
          </ThemedText>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: theme.primary }]}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable onPress={cancelRecording} style={styles.cancelButton}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h4">Recording</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.visualizerContainer}>
        <Animated.View
          style={[
            styles.ring,
            {
              width: CIRCLE_SIZE * 1.8,
              height: CIRCLE_SIZE * 1.8,
              borderRadius: CIRCLE_SIZE * 0.9,
              borderColor: theme.primary,
            },
            ring3Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              width: CIRCLE_SIZE * 1.5,
              height: CIRCLE_SIZE * 1.5,
              borderRadius: CIRCLE_SIZE * 0.75,
              borderColor: theme.primary,
            },
            ring2Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              width: CIRCLE_SIZE * 1.2,
              height: CIRCLE_SIZE * 1.2,
              borderRadius: CIRCLE_SIZE * 0.6,
              borderColor: theme.primary,
            },
            ring1Style,
          ]}
        />
        <Animated.View
          style={[
            styles.centerCircle,
            {
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: CIRCLE_SIZE / 2,
              backgroundColor: theme.primary + "30",
            },
            centerCircleStyle,
          ]}
        >
          <View style={[styles.innerCircle, { backgroundColor: theme.primary }]}>
            <Feather name="mic" size={48} color="#FFFFFF" />
          </View>
        </Animated.View>

        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, { backgroundColor: theme.error }]} />
          <ThemedText style={[styles.recordingText, { color: theme.error }]}>
            Recording
          </ThemedText>
        </View>

        <ThemedText type="h1" style={styles.timer}>
          {formatTime(recordingDuration)}
        </ThemedText>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
          Tap to stop and save your voice note
        </ThemedText>
        <Pressable
          onPress={stopRecording}
          style={[styles.stopButton, { backgroundColor: theme.error }]}
        >
          <Feather name="square" size={32} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  cancelButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
  },
  visualizerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
  },
  centerCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing["3xl"],
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recordingText: {
    fontWeight: "600",
    fontSize: Typography.body.fontSize,
  },
  timer: {
    marginTop: Spacing.lg,
    fontSize: 64,
    fontWeight: "200",
  },
  controls: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  hint: {
    textAlign: "center",
    lineHeight: 22,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  webNotice: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
    gap: Spacing.lg,
  },
  webNoticeTitle: {
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  webNoticeText: {
    textAlign: "center",
    lineHeight: 22,
  },
  permissionNotice: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
    gap: Spacing.lg,
  },
  backButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: Typography.body.fontSize,
  },
});
