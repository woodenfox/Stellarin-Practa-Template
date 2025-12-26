import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, ScrollView, Linking, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import MyPracta, { metadata as codeMetadata } from "@/my-practa";
import { validatePracta, ValidationReport } from "@/lib/practa-validator";
import { getApiUrl, apiRequest } from "@/lib/query-client";

const VERIFICATION_SERVICE_URL = "https://stellarin-practa-verification.replit.app";
const AUTH_TOKEN_KEY = "stellarin_auth_token";

WebBrowser.maybeCompleteAuthSession();

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PractaMetadata {
  type: string;
  name: string;
  description: string;
  author: string;
  githubUsername?: string;
  version: string;
  estimatedDuration?: number;
}

interface SubmissionResult {
  id: string;
  practaName: string;
  practaType: string;
  version: string;
  status: string;
  validationScore?: number;
  createdAt: string;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function SubmitScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitResult, setSubmitResult] = useState<SubmissionResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(AUTH_TOKEN_KEY).then((token: string | null) => {
      setAuthToken(token);
      setIsCheckingAuth(false);
    }).catch(() => {
      setIsCheckingAuth(false);
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
      const result = await WebBrowser.openAuthSessionAsync(
        `${VERIFICATION_SERVICE_URL}/auth/github`,
        "stellarin-practa://auth"
      );
      
      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const token = url.searchParams.get("token");
        if (token) {
          await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
          setAuthToken(token);
        }
      }
    } catch {
      Linking.openURL(`${VERIFICATION_SERVICE_URL}/auth/github`);
    }
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    setAuthToken(null);
    setSubmitState("idle");
    setSubmitResult(null);
  };

  const handleSubmit = async () => {
    if (!authToken || hasErrors) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitState("submitting");
    setSubmitError(null);
    
    try {
      const response = await fetch(new URL("/api/practa/submit", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || "Submission failed");
      }
      
      setSubmitResult(data);
      setSubmitState("success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed");
      setSubmitState("error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleViewStatus = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await WebBrowser.openBrowserAsync(`${VERIFICATION_SERVICE_URL}/submissions`);
    } catch {
      Linking.openURL(`${VERIFICATION_SERVICE_URL}/submissions`);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const displayMetadata = metadata || codeMetadata;
  const isAuthenticated = !!authToken;
  const canSubmit = isAuthenticated && !hasErrors && submitState !== "submitting";

  if (isCheckingAuth) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

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
          <View style={styles.authHeader}>
            <Feather 
              name={isAuthenticated ? "check-circle" : "github"} 
              size={20} 
              color={isAuthenticated ? theme.success : theme.text} 
            />
            <ThemedText style={styles.sectionTitle}>
              {isAuthenticated ? "Connected to Stellarin" : "Sign in to Submit"}
            </ThemedText>
          </View>
          
          {isAuthenticated ? (
            <View style={styles.authContent}>
              <ThemedText style={[styles.authText, { color: theme.textSecondary }]}>
                Your Practa will be submitted for review
              </ThemedText>
              <Pressable onPress={handleSignOut} style={styles.signOutLink}>
                <ThemedText style={[styles.linkText, { color: theme.primary }]}>
                  Sign out
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.authContent}>
              <ThemedText style={[styles.authText, { color: theme.textSecondary }]}>
                Sign in with your GitHub account to submit your Practa for review
              </ThemedText>
              <Pressable
                style={[styles.githubButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={handleSignIn}
              >
                <Feather name="github" size={20} color={theme.text} />
                <ThemedText style={styles.githubButtonText}>Sign in with GitHub</ThemedText>
              </Pressable>
            </View>
          )}
        </Card>

        {submitState === "success" && submitResult ? (
          <Card style={{ ...styles.card, borderColor: theme.success, borderWidth: 1 }}>
            <View style={styles.successHeader}>
              <Feather name="check-circle" size={24} color={theme.success} />
              <ThemedText style={[styles.successTitle, { color: theme.success }]}>
                Submitted Successfully
              </ThemedText>
            </View>
            <ThemedText style={[styles.successText, { color: theme.textSecondary }]}>
              Your Practa has been submitted for review. You can track its status on the Stellarin portal.
            </ThemedText>
            <View style={styles.submissionDetails}>
              <ThemedText style={styles.detailLabel}>Submission ID</ThemedText>
              <ThemedText style={[styles.detailValue, { color: theme.textSecondary }]}>
                {submitResult.id}
              </ThemedText>
            </View>
            <View style={styles.submissionDetails}>
              <ThemedText style={styles.detailLabel}>Status</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: theme.warning + "20" }]}>
                <ThemedText style={[styles.statusBadgeText, { color: theme.warning }]}>
                  {submitResult.status}
                </ThemedText>
              </View>
            </View>
            <Pressable
              style={[styles.viewStatusButton, { backgroundColor: theme.primary }]}
              onPress={handleViewStatus}
            >
              <ThemedText style={styles.viewStatusText}>View on Stellarin</ThemedText>
            </Pressable>
          </Card>
        ) : null}

        {submitState === "error" && submitError ? (
          <Card style={{ ...styles.card, borderColor: theme.error, borderWidth: 1 }}>
            <View style={styles.errorHeader}>
              <Feather name="alert-circle" size={24} color={theme.error} />
              <ThemedText style={[styles.errorTitle, { color: theme.error }]}>
                Submission Failed
              </ThemedText>
            </View>
            <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
              {submitError}
            </ThemedText>
          </Card>
        ) : null}

        {submitState !== "success" ? (
          <Pressable
            style={[
              styles.submitButton,
              { 
                backgroundColor: canSubmit ? theme.primary : theme.textSecondary,
                opacity: submitState === "submitting" ? 0.7 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitState === "submitting" ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="upload-cloud" size={20} color="#FFFFFF" />
            )}
            <ThemedText style={styles.submitButtonText}>
              {submitState === "submitting" ? "Submitting..." : "Submit to Stellarin"}
            </ThemedText>
          </Pressable>
        ) : null}

        {hasErrors ? (
          <ThemedText style={[styles.warningText, { color: theme.error }]}>
            Fix all validation errors before submitting
          </ThemedText>
        ) : !isAuthenticated ? (
          <ThemedText style={[styles.warningText, { color: theme.textSecondary }]}>
            Sign in with GitHub to enable submission
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  authHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  authContent: {
    gap: Spacing.md,
  },
  authText: {
    fontSize: 14,
    lineHeight: 20,
  },
  signOutLink: {
    alignSelf: "flex-start",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
  },
  githubButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  githubButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  successHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  submissionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  viewStatusButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  viewStatusText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
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
