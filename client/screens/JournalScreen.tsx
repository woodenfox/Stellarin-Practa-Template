import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { DurationChip } from "@/components/DurationChip";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useMeditation, JournalEntry } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const DURATION_OPTIONS = [
  { label: "1 min", seconds: 60 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
];

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
    getTodayJournalEntry,
    selectedDuration,
    setSelectedDuration 
  } = useMeditation();

  const [journalText, setJournalText] = useState("");
  const [showMeditationPrompt, setShowMeditationPrompt] = useState(false);
  const [localDuration, setLocalDuration] = useState(300);
  const [riceEarned, setRiceEarned] = useState(0);

  const todayEntry = getTodayJournalEntry();

  useEffect(() => {
    if (todayEntry) {
      setJournalText(todayEntry.content);
    }
  }, [todayEntry]);

  const handleSaveJournal = async () => {
    if (!journalText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const today = new Date().toISOString().split("T")[0];
    const entry: JournalEntry = {
      id: todayEntry?.id || Date.now().toString(),
      date: today,
      content: journalText.trim(),
      createdAt: todayEntry?.createdAt || new Date().toISOString(),
    };

    const bonus = await addJournalEntry(entry);
    setRiceEarned(bonus);
    setShowMeditationPrompt(true);
  };

  const handleStartMeditation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedDuration(localDuration);
    setShowMeditationPrompt(false);
    navigation.navigate("Session", { duration: localDuration });
  };

  const handleSkipMeditation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMeditationPrompt(false);
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

  const pastEntries = journalEntries.filter(
    e => e.date !== new Date().toISOString().split("T")[0]
  );

  const renderPastEntry = ({ item }: { item: JournalEntry }) => (
    <ThemedView 
      style={[styles.historyCard, { backgroundColor: theme.backgroundDefault }]}
    >
      <ThemedText style={[styles.historyDate, { color: theme.textSecondary }]}>
        {formatDate(item.date)}
      </ThemedText>
      <ThemedText style={styles.historyContent} numberOfLines={3}>
        {item.content}
      </ThemedText>
    </ThemedView>
  );

  if (showMeditationPrompt) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View 
          style={[
            styles.promptContainer, 
            { paddingTop: headerHeight + Spacing["3xl"] }
          ]}
        >
          <View style={[styles.promptIcon, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="sun" size={48} color={theme.primary} />
          </View>

          {riceEarned > 0 ? (
            <View style={[styles.riceEarnedBadge, { backgroundColor: theme.accent + "20" }]}>
              <ThemedText style={[styles.riceEarnedText, { color: theme.accent }]}>
                +{riceEarned} rice earned for journaling today
              </ThemedText>
            </View>
          ) : null}
          
          <ThemedText type="h2" style={styles.promptTitle}>
            Do you have a moment to meditate?
          </ThemedText>
          
          <ThemedText style={[styles.promptSubtitle, { color: theme.textSecondary }]}>
            A short meditation can help clear your mind
          </ThemedText>

          <View style={styles.durationSection}>
            <ThemedText type="body" style={styles.durationLabel}>
              Choose a duration
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
            style={[styles.meditateButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="play" size={20} color="#FFFFFF" />
            <ThemedText style={styles.meditateButtonText}>
              Start Meditation
            </ThemedText>
          </Pressable>

          <Pressable onPress={handleSkipMeditation} style={styles.skipButton}>
            <ThemedText style={[styles.skipButtonText, { color: theme.textSecondary }]}>
              Maybe later
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

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
            {todayEntry ? "Today's Reflection" : "What's on your mind?"}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Take a moment to reflect on your day, your thoughts, or what's ahead
          </ThemedText>

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
              name={todayEntry ? "check" : "save"} 
              size={20} 
              color="#FFFFFF" 
            />
            <ThemedText style={styles.saveButtonText}>
              {todayEntry ? "Update Entry" : "Save Entry"}
            </ThemedText>
          </Pressable>
        </View>

        {pastEntries.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Past Entries
            </ThemedText>
            {pastEntries.slice(0, 10).map((entry) => (
              <View key={entry.id}>
                {renderPastEntry({ item: entry })}
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
    marginBottom: Spacing.md,
  },
  historyDate: {
    fontSize: Typography.small.fontSize,
    fontWeight: "600",
    marginBottom: Spacing.xs,
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
});
