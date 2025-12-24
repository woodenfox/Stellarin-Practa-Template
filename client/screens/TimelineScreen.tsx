import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, Image, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAudioPlayer, setAudioModeAsync, AudioModule } from "expo-audio";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useTimeline } from "@/context/TimelineContext";
import { TimelineItem } from "@/types/timeline";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { PRESET_FLOWS } from "@/practa/registry";

const formatAudioDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface AudioItemPlayerProps {
  item: TimelineItem;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onStop: () => void;
}

function AudioItemPlayer({ item, isPlaying, onPlay, onStop }: AudioItemPlayerProps) {
  const { theme } = useTheme();
  const [hasError, setHasError] = useState(false);
  const audioUri = item.content?.audioUri || "";
  const player = useAudioPlayer(audioUri);

  useEffect(() => {
    if (!player) return;

    const unsubscribe = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        onStop();
      }
    });

    return () => {
      unsubscribe?.remove();
      try {
        player.pause();
      } catch (e) {}
    };
  }, [player, onStop]);

  useEffect(() => {
    if (!player) return;

    if (isPlaying) {
      const startPlayback = async () => {
        try {
          await setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: false,
          });
          player.seekTo(0);
          player.play();
        } catch (e) {
          console.error("Failed to play audio:", e);
          setHasError(true);
          onStop();
        }
      };
      startPlayback();
    } else {
      try {
        player.pause();
      } catch (e) {}
    }
  }, [isPlaying, player, onStop]);

  const togglePlay = () => {
    if (hasError) return;
    if (isPlaying) {
      onStop();
    } else {
      onPlay(item.id);
    }
  };

  const hasTranscription = item.content?.transcription && item.content.transcription !== "Transcribing...";
  const isTranscribing = item.content?.transcription === "Transcribing...";

  return (
    <View>
      <Pressable
        onPress={togglePlay}
        style={[styles.audioPlayer, { backgroundColor: theme.backgroundSecondary }]}
      >
        <View style={[styles.audioPlayButton, { backgroundColor: theme.primary }]}>
          <Feather name={isPlaying ? "pause" : "play"} size={16} color="#FFFFFF" />
        </View>
        <View style={styles.audioInfo}>
          <ThemedText style={styles.audioLabel}>Voice Note</ThemedText>
          <ThemedText style={[styles.audioDuration, { color: theme.textSecondary }]}>
            {formatAudioDuration(item.content?.audioDuration || 0)}
          </ThemedText>
        </View>
      </Pressable>
      {isTranscribing ? (
        <ThemedText style={[styles.transcriptionText, { color: theme.textSecondary, fontStyle: "italic" }]}>
          Transcribing...
        </ThemedText>
      ) : hasTranscription ? (
        <ThemedText style={styles.transcriptionText}>{item.content?.transcription}</ThemedText>
      ) : null}
    </View>
  );
}

const DELETE_THRESHOLD = -80;

interface SwipeableTimelineItemProps {
  item: TimelineItem;
  onDelete: (id: string) => void;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onStop: () => void;
}

function SwipeableTimelineItem({
  item,
  onDelete,
  isPlaying,
  onPlay,
  onStop,
}: SwipeableTimelineItemProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);

  const triggerDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDelete(item.id);
  }, [item.id, onDelete]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      const translation = Math.min(0, event.translationX);
      translateX.value = translation;
    })
    .onEnd((event) => {
      if (translateX.value < DELETE_THRESHOLD) {
        runOnJS(triggerDelete)();
        translateX.value = withSpring(-300);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, DELETE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getItemIcon = () => {
    if (item.type === "journal") {
      return item.content?.type === "audio" ? "mic" : "edit-3";
    }
    if (item.type === "meditation") {
      return "headphones";
    }
    if (item.type === "milestone") {
      return "award";
    }
    return "circle";
  };

  const getItemLabel = () => {
    if (item.type === "journal") {
      return item.content?.type === "audio" ? "Voice Reflection" : "Journal Entry";
    }
    if (item.type === "meditation") {
      const meditationType = item.metadata.meditationType;
      return meditationType === "personalized" ? "Personalized Meditation" : "Silent Meditation";
    }
    if (item.type === "milestone") {
      return "Milestone";
    }
    return "Activity";
  };

  return (
    <View style={styles.swipeableContainer}>
      <Animated.View
        style={[styles.deleteBackground, { backgroundColor: "#FF3B30" }, deleteBackgroundStyle]}
      >
        <Feather name="trash-2" size={24} color="#FFFFFF" />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <ThemedView style={[styles.timelineCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTypeIndicator}>
                <Feather name={getItemIcon()} size={14} color={theme.textSecondary} />
                <ThemedText style={[styles.itemTypeLabel, { color: theme.textSecondary }]}>
                  {getItemLabel()}
                </ThemedText>
              </View>
              <ThemedText style={[styles.itemTime, { color: theme.textSecondary }]}>
                {formatDate(item.date)} {formatTime(item.createdAt)}
              </ThemedText>
            </View>

            {item.type === "journal" && item.content?.type === "audio" ? (
              <AudioItemPlayer
                item={item}
                isPlaying={isPlaying}
                onPlay={onPlay}
                onStop={onStop}
              />
            ) : item.type === "journal" && item.content?.value ? (
              <ThemedText style={styles.itemContent}>{item.content.value}</ThemedText>
            ) : item.type === "meditation" ? (
              <View style={styles.meditationSummary}>
                {item.metadata.meditationName ? (
                  <ThemedText style={styles.meditationName}>
                    {item.metadata.meditationName}
                  </ThemedText>
                ) : null}
                <View style={styles.meditationStats}>
                  {item.metadata.duration ? (
                    <View style={[styles.statBadge, { backgroundColor: theme.primary + "20" }]}>
                      <Feather name="clock" size={12} color={theme.primary} />
                      <ThemedText style={[styles.statText, { color: theme.primary }]}>
                        {Math.floor((item.metadata.duration as number) / 60)} min
                      </ThemedText>
                    </View>
                  ) : null}
                  {item.metadata.riceEarned ? (
                    <View style={[styles.statBadge, { backgroundColor: theme.accent + "20" }]}>
                      <ThemedText style={[styles.statText, { color: theme.accent }]}>
                        +{item.metadata.riceEarned} rice
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
          </ThemedView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TimelineScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const { items, isLoading, deleteItem } = useTimeline();

  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  const handlePlayAudio = useCallback((id: string) => {
    setPlayingItemId(id);
  }, []);

  const handleStopAudio = useCallback(() => {
    setPlayingItemId(null);
  }, []);

  const handleDeleteItem = useCallback(
    (id: string) => {
      deleteItem(id);
    },
    [deleteItem]
  );

  const handleStartFlow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Flow", { flow: PRESET_FLOWS.morningReflection });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroImageWrapper}>
          <Image
            source={require("../../assets/images/journal-hero.png")}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Your Journey
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            All your reflections, meditations, and milestones in one place
          </ThemedText>

          <Pressable
            onPress={handleStartFlow}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
            <ThemedText style={styles.addButtonText}>Start Morning Reflection</ThemedText>
          </Pressable>
        </View>

        {items.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Recent Activity
            </ThemedText>
            {items.map((item) => (
              <SwipeableTimelineItem
                key={item.id}
                item={item}
                onDelete={handleDeleteItem}
                isPlaying={playingItemId === item.id}
                onPlay={handlePlayAudio}
                onStop={handleStopAudio}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="book-open" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              No entries yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Start a morning reflection to add your first entry
            </ThemedText>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  heroImageWrapper: {
    marginHorizontal: -Spacing.xl,
    marginBottom: Spacing.sm,
    overflow: "hidden",
    alignItems: "center",
  },
  heroImage: {
    width: "110%",
    height: 220,
    resizeMode: "contain",
  },
  section: {
    marginBottom: Spacing["3xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: Typography.body.fontSize,
  },
  swipeableContainer: {
    marginBottom: Spacing.md,
    position: "relative",
  },
  deleteBackground: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
  },
  timelineCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  itemTypeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  itemTypeLabel: {
    fontSize: Typography.small.fontSize,
    fontWeight: "600",
  },
  itemTime: {
    fontSize: Typography.small.fontSize,
  },
  itemContent: {
    fontSize: Typography.body.fontSize,
    lineHeight: 22,
  },
  meditationSummary: {
    gap: Spacing.sm,
  },
  meditationName: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
  },
  meditationStats: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statText: {
    fontSize: Typography.small.fontSize,
    fontWeight: "600",
  },
  audioPlayer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  audioPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  audioInfo: {
    flex: 1,
  },
  audioLabel: {
    fontWeight: "600",
    fontSize: Typography.body.fontSize,
  },
  audioDuration: {
    fontSize: Typography.small.fontSize,
  },
  transcriptionText: {
    marginTop: Spacing.sm,
    fontSize: Typography.body.fontSize,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: Typography.body.fontSize,
    textAlign: "center",
    lineHeight: 22,
  },
});
