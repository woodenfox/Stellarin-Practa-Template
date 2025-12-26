import React, { useMemo, useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import MyPracta, { metadata as codeMetadata } from "@/my-practa";
import { validatePracta, ValidationResult } from "@/lib/practa-validator";

interface PractaMetadata {
  type: string;
  name: string;
  description: string;
  author: string;
  version: string;
  estimatedDuration?: number;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function ValidationItem({ result }: { result: ValidationResult }) {
  const { theme } = useTheme();
  
  const iconName = result.severity === "error" 
    ? "x-circle" 
    : result.severity === "warning" 
      ? "alert-circle" 
      : "check-circle";
      
  const iconColor = result.severity === "error"
    ? "#EF4444"
    : result.severity === "warning"
      ? "#F59E0B"
      : "#10B981";

  return (
    <View style={styles.validationItem}>
      <Feather name={iconName} size={16} color={iconColor} />
      <ThemedText 
        style={[
          styles.validationText, 
          { color: result.severity === "error" ? "#EF4444" : theme.textSecondary }
        ]}
      >
        {result.message}
      </ThemedText>
    </View>
  );
}

export default function PreviewScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [showValidation, setShowValidation] = useState(false);

  const { data: savedMetadata } = useQuery<PractaMetadata>({
    queryKey: ["/api/practa/metadata"],
  });

  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/practa/metadata"] });
    }, [queryClient])
  );

  const metadata = savedMetadata || codeMetadata;

  const validationReport = useMemo(() => {
    return validatePracta(MyPracta, codeMetadata);
  }, []);

  const handlePreview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Flow", {
      flow: {
        id: "preview",
        name: "Preview",
        practas: [
          {
            id: "my-practa",
            type: "my-practa" as any,
            name: metadata.name,
            description: metadata.description,
          },
        ],
      },
    });
  };

  const toggleValidation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowValidation(!showValidation);
  };

  const handleEditMetadata = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MetadataEditor");
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Practa Starter</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Build and test your Practa
          </ThemedText>
        </View>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="layers" size={24} color={theme.primary} />
            </View>
            <View style={styles.cardInfo}>
              <ThemedText style={styles.cardTitle}>{metadata.name}</ThemedText>
              <ThemedText style={[styles.cardDescription, { color: theme.textSecondary }]}>
                {metadata.description}
              </ThemedText>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>
                Author
              </ThemedText>
              <ThemedText style={styles.metaValue}>{metadata.author}</ThemedText>
            </View>
            <View style={styles.metaItem}>
              <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>
                Version
              </ThemedText>
              <ThemedText style={styles.metaValue}>{metadata.version}</ThemedText>
            </View>
            <View style={styles.metaItem}>
              <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>
                Duration
              </ThemedText>
              <ThemedText style={styles.metaValue}>
                {metadata.estimatedDuration ? `${metadata.estimatedDuration}s` : "—"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleEditMetadata}
              style={[styles.editButton, { borderColor: theme.primary }]}
            >
              <Feather name="edit-2" size={18} color={theme.primary} />
              <ThemedText style={[styles.editButtonText, { color: theme.primary }]}>
                Edit Info
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handlePreview}
              style={[styles.previewButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="play" size={20} color="white" />
              <ThemedText style={styles.previewButtonText}>Preview</ThemedText>
            </Pressable>
          </View>
        </Card>

        <Card style={styles.validationCard}>
          <Pressable onPress={toggleValidation} style={styles.validationHeader}>
            <View style={styles.validationHeaderLeft}>
              <Feather 
                name={validationReport.isValid ? "check-circle" : "alert-circle"} 
                size={20} 
                color={validationReport.isValid ? "#10B981" : "#EF4444"} 
              />
              <ThemedText style={styles.validationTitle}>
                Validation {validationReport.isValid ? "Passed" : "Failed"}
              </ThemedText>
            </View>
            <View style={styles.validationStats}>
              {validationReport.errors.length > 0 ? (
                <View style={[styles.statBadge, { backgroundColor: "#FEE2E2" }]}>
                  <ThemedText style={[styles.statText, { color: "#EF4444" }]}>
                    {validationReport.errors.length} errors
                  </ThemedText>
                </View>
              ) : null}
              {validationReport.warnings.length > 0 ? (
                <View style={[styles.statBadge, { backgroundColor: "#FEF3C7" }]}>
                  <ThemedText style={[styles.statText, { color: "#D97706" }]}>
                    {validationReport.warnings.length} warnings
                  </ThemedText>
                </View>
              ) : null}
              <Feather 
                name={showValidation ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.textSecondary} 
              />
            </View>
          </Pressable>
          
          {showValidation ? (
            <View style={styles.validationList}>
              {validationReport.errors.map((result, i) => (
                <ValidationItem key={`error-${i}`} result={result} />
              ))}
              {validationReport.warnings.map((result, i) => (
                <ValidationItem key={`warning-${i}`} result={result} />
              ))}
              {validationReport.successes.map((result, i) => (
                <ValidationItem key={`success-${i}`} result={result} />
              ))}
            </View>
          ) : null}
        </Card>

        <View style={styles.instructions}>
          <ThemedText style={styles.instructionsTitle}>How to develop</ThemedText>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.stepNumberText}>1</ThemedText>
            </View>
            <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
              Edit my-practa/index.tsx to build your Practa
            </ThemedText>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.stepNumberText}>2</ThemedText>
            </View>
            <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
              Check validation results above for requirements
            </ThemedText>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.stepNumberText}>3</ThemedText>
            </View>
            <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
              Preview your changes using the button above
            </ThemedText>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.stepNumberText}>4</ThemedText>
            </View>
            <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
              Update the metadata export with your details
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: Spacing.xs,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  previewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  previewButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  validationCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  validationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  validationHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  validationStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statText: {
    fontSize: 12,
    fontWeight: "500",
  },
  validationList: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  validationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  instructions: {
    marginTop: Spacing.md,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  stepNumberText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
  },
});
