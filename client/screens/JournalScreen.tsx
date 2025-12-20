import React, { useState, useEffect, useCallback } from "react";
import { View, TextInput, StyleSheet, Pressable, Platform } from "react-native";
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
import { useMeditation, JournalEntry } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const formatAudioDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface AudioEntryPlayerProps {
  entry: JournalEntry;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onStop: () => void;
}

function AudioEntryPlayer({ entry, isPlaying, onPlay, onStop }: AudioEntryPlayerProps) {
  const { theme } = useTheme();
  const [hasError, setHasError] = useState(false);
  const player = useAudioPlayer(entry.audioUri || "");
  
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
      } catch (e) {
        // Ignore pause errors on cleanup
      }
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
      } catch (e) {
        // Ignore pause errors
      }
    }
  }, [isPlaying, player, onStop]);
  
  const togglePlay = () => {
    if (hasError) return;
    if (isPlaying) {
      onStop();
    } else {
      onPlay(entry.id);
    }
  };

  const hasTranscription = entry.transcription && entry.transcription !== "Transcribing...";
  const isTranscribing = entry.transcription === "Transcribing...";

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
            {formatAudioDuration(entry.audioDuration || 0)}
          </ThemedText>
        </View>
      </Pressable>
      {isTranscribing ? (
        <ThemedText style={[styles.transcriptionText, { color: theme.textSecondary, fontStyle: "italic" }]}>
          Transcribing...
        </ThemedText>
      ) : hasTranscription ? (
        <ThemedText style={styles.transcriptionText}>
          {entry.transcription}
        </ThemedText>
      ) : null}
    </View>
  );
}

const DELETE_THRESHOLD = -80;

interface SwipeableJournalEntryProps {
  entry: JournalEntry;
  onDelete: (id: string) => void;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onStop: () => void;
  formatDate: (dateStr: string) => string;
  formatTime: (dateStr: string) => string;
}

function SwipeableJournalEntry({ 
  entry, 
  onDelete, 
  isPlaying, 
  onPlay, 
  onStop,
  formatDate,
  formatTime,
}: SwipeableJournalEntryProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);

  const triggerDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDelete(entry.id);
  }, [entry.id, onDelete]);

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

  return (
    <View style={styles.swipeableContainer}>
      <Animated.View 
        style={[
          styles.deleteBackground, 
          { backgroundColor: "#FF3B30" },
          deleteBackgroundStyle,
        ]}
      >
        <Feather name="trash-2" size={24} color="#FFFFFF" />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <ThemedView 
            style={[styles.historyCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={styles.entryHeader}>
              <View style={styles.entryTypeIndicator}>
                <Feather 
                  name={entry.type === "audio" ? "mic" : "edit-3"} 
                  size={14} 
                  color={theme.textSecondary} 
                />
                <ThemedText style={[styles.historyDate, { color: theme.textSecondary }]}>
                  {formatDate(entry.date)}
                </ThemedText>
              </View>
              <ThemedText style={[styles.entryTime, { color: theme.textSecondary }]}>
                {formatTime(entry.createdAt)}
              </ThemedText>
            </View>
            {entry.type === "audio" ? (
              <AudioEntryPlayer 
                entry={entry} 
                isPlaying={isPlaying}
                onPlay={onPlay}
                onStop={onStop}
              />
            ) : (
              <ThemedText style={styles.historyContent}>
                {entry.content}
              </ThemedText>
            )}
          </ThemedView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function JournalScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  
  const { 
    journalEntries, 
    addJournalEntry, 
    deleteJournalEntry,
    hasJournaledToday
  } = useMeditation();

  const [journalText, setJournalText] = useState("");
  const [entryMode, setEntryMode] = useState<"text" | "audio">("text");
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);

  const handlePlayAudio = useCallback((id: string) => {
    setPlayingEntryId(id);
  }, []);

  const handleStopAudio = useCallback(() => {
    setPlayingEntryId(null);
  }, []);

  const handleDeleteEntry = useCallback((id: string) => {
    deleteJournalEntry(id);
  }, [deleteJournalEntry]);

  const handleSaveJournal = async () => {
    if (!journalText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const journalContent = journalText.trim();
    const today = new Date().toISOString().split("T")[0];
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: today,
      content: journalContent,
      createdAt: new Date().toISOString(),
      type: "text",
    };

    const bonus = await addJournalEntry(entry);
    setJournalText("");
    navigation.navigate("PersonalizedMeditation", { 
      journalContent, 
      riceEarned: bonus 
    });
  };

  const handleOpenRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (status.granted) {
        navigation.navigate("Recording");
      }
    } catch (error) {
      console.error("Failed to request microphone permission:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <SwipeableJournalEntry
      entry={item}
      onDelete={handleDeleteEntry}
      isPlaying={playingEntryId === item.id}
      onPlay={handlePlayAudio}
      onStop={handleStopAudio}
      formatDate={formatDate}
      formatTime={formatTime}
    />
  );

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
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            What's on your mind?
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {hasJournaledToday() 
              ? "Add another reflection to your journal"
              : "Your first entry today earns +10 rice"
            }
          </ThemedText>

          <View style={styles.modeToggle}>
            <Pressable
              onPress={() => setEntryMode("text")}
              style={[
                styles.modeButton,
                { 
                  backgroundColor: entryMode === "text" ? theme.primary : theme.backgroundDefault,
                  borderColor: entryMode === "text" ? theme.primary : theme.border,
                },
              ]}
            >
              <Feather 
                name="edit-3" 
                size={18} 
                color={entryMode === "text" ? "#FFFFFF" : theme.textSecondary} 
              />
              <ThemedText 
                style={[
                  styles.modeButtonText, 
                  { color: entryMode === "text" ? "#FFFFFF" : theme.textSecondary }
                ]}
              >
                Text
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setEntryMode("audio")}
              style={[
                styles.modeButton,
                { 
                  backgroundColor: entryMode === "audio" ? theme.primary : theme.backgroundDefault,
                  borderColor: entryMode === "audio" ? theme.primary : theme.border,
                },
              ]}
            >
              <Feather 
                name="mic" 
                size={18} 
                color={entryMode === "audio" ? "#FFFFFF" : theme.textSecondary} 
              />
              <ThemedText 
                style={[
                  styles.modeButtonText, 
                  { color: entryMode === "audio" ? "#FFFFFF" : theme.textSecondary }
                ]}
              >
                Voice
              </ThemedText>
            </Pressable>
          </View>

          {entryMode === "text" ? (
            <>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Write your thoughts here..."
                placeholderTextColor={theme.textSecondary}
                value={journalText}
                onChangeText={setJournalText}
                multiline
                textAlignVertical="top"
              />

              <Pressable
                onPress={handleSaveJournal}
                disabled={!journalText.trim()}
                style={[
                  styles.saveButton,
                  { 
                    backgroundColor: journalText.trim() ? theme.primary : theme.border,
                    opacity: journalText.trim() ? 1 : 0.5,
                  },
                ]}
              >
                <Feather 
                  name="plus" 
                  size={20} 
                  color="#FFFFFF" 
                />
                <ThemedText style={styles.saveButtonText}>
                  Add Entry
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <View style={styles.audioSection}>
              {Platform.OS === "web" ? (
                <View style={[styles.webNotice, { backgroundColor: theme.backgroundDefault }]}>
                  <Feather name="info" size={20} color={theme.textSecondary} />
                  <ThemedText style={[styles.webNoticeText, { color: theme.textSecondary }]}>
                    Voice recording is available in Expo Go. Open the app on your phone to record voice notes.
                  </ThemedText>
                </View>
              ) : (
                <>
                  <View style={[styles.recordingArea, { backgroundColor: theme.backgroundDefault }]}>
                    <View style={[styles.micIconContainer, { backgroundColor: theme.primary + "20" }]}>
                      <Feather name="mic" size={48} color={theme.primary} />
                    </View>
                    <ThemedText style={[styles.recordingHint, { color: theme.textSecondary }]}>
                      Record your thoughts with an immersive voice experience
                    </ThemedText>
                  </View>

                  <Pressable
                    onPress={handleOpenRecording}
                    style={[styles.recordButton, { backgroundColor: theme.primary }]}
                  >
                    <Feather name="mic" size={24} color="#FFFFFF" />
                    <ThemedText style={styles.saveButtonText}>
                      Start Recording
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </View>

        {journalEntries.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Your Reflections
            </ThemedText>
            {journalEntries.map((entry) => (
              <View key={entry.id}>
                {renderEntry({ item: entry })}
              </View>
            ))}
          </View>
        ) : null}
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
  textInput: {
    minHeight: 150,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    fontSize: Typography.body.fontSize,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: Typography.body.fontSize,
  },
  historyCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  historyDate: {
    fontSize: Typography.small.fontSize,
    fontWeight: "600",
  },
  entryTime: {
    fontSize: Typography.small.fontSize,
  },
  historyContent: {
    fontSize: Typography.body.fontSize,
    lineHeight: 22,
  },
  promptContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
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
    fontSize: Typography.small.fontSize,
  },
  promptTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  promptSubtitle: {
    textAlign: "center",
    marginBottom: Spacing["3xl"],
    lineHeight: 22,
  },
  durationSection: {
    width: "100%",
    marginBottom: Spacing["3xl"],
  },
  durationLabel: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  meditateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  meditateButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: Typography.body.fontSize,
  },
  skipButton: {
    padding: Spacing.md,
  },
  skipButtonText: {
    fontSize: Typography.body.fontSize,
  },
  modeToggle: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  modeButtonText: {
    fontWeight: "600",
    fontSize: Typography.body.fontSize,
  },
  audioSection: {
    marginBottom: Spacing.lg,
  },
  webNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  webNoticeText: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    lineHeight: 22,
  },
  recordingArea: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    minHeight: 180,
    marginBottom: Spacing.lg,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingText: {
    fontWeight: "600",
    fontSize: Typography.small.fontSize,
  },
  recordingTimer: {
    textAlign: "center",
  },
  recordingHint: {
    marginTop: Spacing.lg,
    textAlign: "center",
    lineHeight: 22,
  },
  micIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  entryTypeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
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
    marginBottom: 2,
  },
  audioDuration: {
    fontSize: Typography.small.fontSize,
  },
  transcriptionText: {
    fontSize: Typography.body.fontSize,
    lineHeight: 22,
    marginTop: Spacing.sm,
  },
  swipeableContainer: {
    marginBottom: Spacing.md,
    position: "relative",
    overflow: "hidden",
    borderRadius: BorderRadius.lg,
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    alignItems: "center",
    justifyContent: "center",
    borderTopRightRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
});
