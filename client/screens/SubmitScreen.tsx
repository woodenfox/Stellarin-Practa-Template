import React, { useMemo } from "react";
import { View, StyleSheet, Pressable, ScrollView, Alert, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import MyPracta, { metadata as codeMetadata } from "@/my-practa";
import { validatePracta, ValidationReport } from "@/lib/practa-validator";
import { apiRequest, getApiUrl } from "@/lib/query-client";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PractaMetadata {
  type: string;
  name: string;
  description: string;
  author: string;
  version: string;
  estimatedDuration?: number;
}

export default function SubmitScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const { data: metadata } = useQuery<PractaMetadata>({
    queryKey: ["/api/practa/metadata"],
  });

  const validationReport = useMemo<ValidationReport>(() => {
    return validatePracta(MyPracta, codeMetadata);
  }, []);

  const hasErrors = !validationReport.isValid;
  const errorCount = validationReport.errors.length;
  const warningCount = validationReport.warnings.length;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/practa/submit");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || error.error || "Submission failed");
      }
      return res.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Submitted",
        "Your Practa has been submitted for review. You'll receive a notification when it's approved.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Submission Failed", error.message);
    },
  });

  const handleSubmit = () => {
    if (hasErrors) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Cannot Submit",
        "Please fix all validation errors before submitting.",
        [{ text: "OK" }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Submit Practa",
      `Submit "${metadata?.name || codeMetadata.name}" v${metadata?.version || codeMetadata.version} for review?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: () => submitMutation.mutate() },
      ]
    );
  };

  const handleDownload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const downloadUrl = new URL("/api/practa/download-zip", getApiUrl()).toString();
    
    if (Platform.OS === "web") {
      window.open(downloadUrl, "_blank");
    } else {
      try {
        await Linking.openURL(downloadUrl);
      } catch {
        Alert.alert("Download", "Open the download link in a browser to get your ZIP file.");
      }
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const displayMetadata = metadata || codeMetadata;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Submit Practa</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <ThemedText style={styles.cardTitle}>{displayMetadata.name}</ThemedText>
          <ThemedText style={styles.cardSubtitle}>
            {displayMetadata.type} v{displayMetadata.version}
          </ThemedText>
          <ThemedText style={[styles.cardDescription, { color: theme.textSecondary }]}>
            by {displayMetadata.author}
          </ThemedText>
        </Card>

        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <Feather
              name={hasErrors ? "alert-circle" : "check-circle"}
              size={20}
              color={hasErrors ? theme.error : theme.success}
            />
            <ThemedText style={styles.statusText}>
              {hasErrors ? "Validation Failed" : "Ready to Submit"}
            </ThemedText>
          </View>
          
          <View style={styles.statsRow}>
            {errorCount > 0 ? (
              <View style={[styles.statBadge, { backgroundColor: theme.error + "20" }]}>
                <ThemedText style={[styles.statText, { color: theme.error }]}>
                  {errorCount} error{errorCount !== 1 ? "s" : ""}
                </ThemedText>
              </View>
            ) : null}
            {warningCount > 0 ? (
              <View style={[styles.statBadge, { backgroundColor: theme.warning + "20" }]}>
                <ThemedText style={[styles.statText, { color: theme.warning }]}>
                  {warningCount} warning{warningCount !== 1 ? "s" : ""}
                </ThemedText>
              </View>
            ) : null}
            {errorCount === 0 && warningCount === 0 ? (
              <View style={[styles.statBadge, { backgroundColor: theme.success + "20" }]}>
                <ThemedText style={[styles.statText, { color: theme.success }]}>
                  All checks passed
                </ThemedText>
              </View>
            ) : null}
          </View>
        </Card>

        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>What happens next?</ThemedText>
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.stepNumberText}>1</ThemedText>
            </View>
            <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
              Your Practa is uploaded for review
            </ThemedText>
          </View>
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.stepNumberText}>2</ThemedText>
            </View>
            <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
              We verify it meets all requirements
            </ThemedText>
          </View>
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.stepNumberText}>3</ThemedText>
            </View>
            <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
              Once approved, it appears in Stellarin
            </ThemedText>
          </View>
        </Card>

        <Pressable
          style={[
            styles.downloadButton,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={handleDownload}
        >
          <Feather name="download" size={20} color={theme.text} />
          <ThemedText style={styles.downloadText}>Download ZIP</ThemedText>
        </Pressable>

        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: hasErrors ? theme.textSecondary : theme.primary },
          ]}
          onPress={handleSubmit}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <ThemedText style={styles.submitText}>Submitting...</ThemedText>
          ) : (
            <>
              <Feather name="upload" size={20} color="#FFFFFF" />
              <ThemedText style={styles.submitText}>Submit for Review</ThemedText>
            </>
          )}
        </Pressable>
      </ScrollView>
    </ThemedView>
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
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  stepText: {
    fontSize: 14,
    flex: 1,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  downloadText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
