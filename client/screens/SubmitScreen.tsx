import React, { useMemo, useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ScrollView, Alert, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import MyPracta, { metadata as codeMetadata } from "@/my-practa";
import { validatePracta, ValidationReport } from "@/lib/practa-validator";
import { getApiUrl } from "@/lib/query-client";

const VERIFICATION_SERVICE_URL = "https://stellarin-practa-verification.replit.app";
const AUTH_TOKEN_KEY = "stellarin_auth_token";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_TOKEN_KEY).then((token) => {
      setIsAuthenticated(!!token);
    });
  }, []);

  const { data: metadata } = useQuery<PractaMetadata>({
    queryKey: ["/api/practa/metadata"],
  });

  const validationReport = useMemo<ValidationReport>(() => {
    return validatePracta(MyPracta, codeMetadata);
  }, []);

  const hasErrors = !validationReport.isValid;
  const errorCount = validationReport.errors.length;
  const warningCount = validationReport.warnings.length;

  const handleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await WebBrowser.openBrowserAsync(VERIFICATION_SERVICE_URL);
    } catch {
      Linking.openURL(VERIFICATION_SERVICE_URL);
    }
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

  const handleUploadManually = async () => {
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
          <ThemedText style={styles.sectionTitle}>How to Submit</ThemedText>
          
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.stepNumberText}>1</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Download Your Practa</ThemedText>
              <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
                Get the ZIP file with your component, manifest, and README
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.stepNumberText}>2</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Sign in with GitHub</ThemedText>
              <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
                Authenticate on the Stellarin Practa Validator
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.stepNumberText}>3</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Upload for Review</ThemedText>
              <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
                Submit your ZIP and wait for approval
              </ThemedText>
            </View>
          </View>
        </Card>

        <Card style={[styles.card, styles.packageCard]}>
          <View style={styles.packageHeader}>
            <Feather name="package" size={24} color={theme.primary} />
            <ThemedText style={styles.packageTitle}>Your Package</ThemedText>
          </View>
          <ThemedText style={[styles.packageDescription, { color: theme.textSecondary }]}>
            ZIP includes: index.tsx, manifest.json, README.md
          </ThemedText>
          
          <Pressable
            style={[
              styles.downloadButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={handleDownload}
          >
            <Feather name="download" size={20} color="#FFFFFF" />
            <ThemedText style={styles.downloadButtonText}>Download ZIP</ThemedText>
          </Pressable>
        </Card>

        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={handleSignIn}
        >
          <Feather name="github" size={20} color={theme.text} />
          <ThemedText style={[styles.submitText, { color: theme.text }]}>
            Open Validator Portal
          </ThemedText>
        </Pressable>

        <Pressable
          style={[
            styles.uploadButton,
            { backgroundColor: hasErrors ? theme.textSecondary : theme.primary },
          ]}
          onPress={handleUploadManually}
          disabled={hasErrors}
        >
          <Feather name="upload-cloud" size={20} color="#FFFFFF" />
          <ThemedText style={styles.uploadButtonText}>
            Submit on Stellarin
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
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.md,
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
    fontWeight: "600",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  stepText: {
    fontSize: 13,
    lineHeight: 18,
  },
  packageCard: {
    gap: Spacing.sm,
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  packageDescription: {
    fontSize: 13,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 13,
    textAlign: "center",
  },
});
