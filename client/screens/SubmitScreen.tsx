import React, { useMemo } from "react";
import { View, StyleSheet, Pressable, ScrollView, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import MyPracta, { metadata as codeMetadata } from "@/my-practa";
import { validatePracta, ValidationReport } from "@/lib/practa-validator";
const VERIFICATION_SERVICE_URL = "https://stellarin-practa-verification.replit.app";

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

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await WebBrowser.openBrowserAsync(`${VERIFICATION_SERVICE_URL}/submit`);
    } catch {
      Linking.openURL(`${VERIFICATION_SERVICE_URL}/submit`);
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
          <ThemedText style={styles.sectionTitle}>How it works</ThemedText>
          <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
            Tap the button below to open the Stellarin Practa Validator. You'll sign in with GitHub and submit your Practa for review.
          </ThemedText>
        </Card>

        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: hasErrors ? theme.textSecondary : theme.primary },
          ]}
          onPress={handleSubmit}
          disabled={hasErrors}
        >
          <Feather name="upload-cloud" size={20} color="#FFFFFF" />
          <ThemedText style={styles.submitButtonText}>
            Submit to Stellarin
          </ThemedText>
        </Pressable>

        {hasErrors ? (
          <ThemedText style={[styles.warningText, { color: theme.error }]}>
            Fix all validation errors before submitting
          </ThemedText>
        ) : null}
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statText: {
    fontSize: 13,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 13,
    textAlign: "center",
  },
});
