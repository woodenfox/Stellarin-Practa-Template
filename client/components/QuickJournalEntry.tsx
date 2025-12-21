import React, { useState } from "react";
import { View, TextInput, StyleSheet, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AudioModule } from "expo-audio";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useMeditation, JournalEntry } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface QuickJournalEntryProps {
  compact?: boolean;
}

export function QuickJournalEntry({ compact = false }: QuickJournalEntryProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { addJournalEntry, hasJournaledToday } = useMeditation();

  const [journalText, setJournalText] = useState("");
  const [entryMode, setEntryMode] = useState<"text" | "audio">("text");

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

  return (
    <View style={styles.container}>
      <ThemedText type={compact ? "h4" : "h3"} style={styles.title}>
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
              compact ? styles.textInputCompact : null,
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
                  <Feather name="mic" size={32} color={theme.primary} />
                </View>
                <ThemedText style={[styles.recordingHint, { color: theme.textSecondary }]}>
                  Tap below to record your voice note
                </ThemedText>
              </View>

              <Pressable
                onPress={handleOpenRecording}
                style={[styles.recordButton, { backgroundColor: theme.primary }]}
              >
                <Feather name="mic" size={20} color="#FFFFFF" />
                <ThemedText style={styles.recordButtonText}>
                  Start Recording
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  modeToggle: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  modeButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  textInput: {
    height: 120,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 16,
    lineHeight: 24,
  },
  textInputCompact: {
    height: 100,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  audioSection: {
    gap: Spacing.md,
  },
  webNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  webNoticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  recordingArea: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.md,
  },
  micIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingHint: {
    fontSize: 14,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  recordButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
