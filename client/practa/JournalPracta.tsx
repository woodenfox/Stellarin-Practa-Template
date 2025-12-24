import React, { useState } from "react";
import { View, TextInput, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { PractaContext, PractaOutput, PractaCompleteHandler } from "@/types/flow";
import { useMeditation } from "@/context/MeditationContext";

interface JournalPractaProps {
  context: PractaContext;
  onComplete: PractaCompleteHandler;
  onSkip?: () => void;
}

export function JournalPracta({ context, onComplete, onSkip }: JournalPractaProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { addJournalEntry, hasJournaledToday } = useMeditation();
  const [journalText, setJournalText] = useState("");

  const handleSubmit = async () => {
    if (!journalText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const journalContent = journalText.trim();
    const today = new Date().toISOString().split("T")[0];
    
    const entry = {
      id: Date.now().toString(),
      date: today,
      content: journalContent,
      createdAt: new Date().toISOString(),
      type: "text" as const,
    };

    await addJournalEntry(entry);

    const output: PractaOutput = {
      content: {
        type: "text",
        value: journalContent,
      },
      metadata: {
        source: "user",
        wordCount: journalContent.split(/\s+/).length,
      },
    };

    onComplete(output);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="edit-3" size={48} color={theme.primary} />
        </View>

        <ThemedText type="h2" style={styles.title}>
          What's on your mind?
        </ThemedText>

        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {hasJournaledToday()
            ? "Add another reflection"
            : "Share your thoughts to personalize your experience"}
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
          onPress={handleSubmit}
          disabled={!journalText.trim()}
          style={[
            styles.submitButton,
            {
              backgroundColor: journalText.trim() ? theme.primary : theme.border,
              opacity: journalText.trim() ? 1 : 0.5,
            },
          ]}
        >
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
          <ThemedText style={styles.submitButtonText}>Continue</ThemedText>
        </Pressable>

        {onSkip ? (
          <Pressable onPress={onSkip} style={styles.skipButton}>
            <ThemedText style={[styles.skipButtonText, { color: theme.textSecondary }]}>
              Skip for now
            </ThemedText>
          </Pressable>
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
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
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
  textInput: {
    minHeight: 180,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    fontSize: Typography.body.fontSize,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: Typography.body.fontSize,
  },
  skipButton: {
    alignItems: "center",
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  skipButtonText: {
    fontSize: Typography.body.fontSize,
  },
});
