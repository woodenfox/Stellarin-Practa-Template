import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { metadata } from "@/my-practa";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PreviewScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

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

          <Pressable
            onPress={handlePreview}
            style={[styles.previewButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="play" size={20} color="white" />
            <ThemedText style={styles.previewButtonText}>Preview Practa</ThemedText>
          </Pressable>
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
              Preview your changes using the button above
            </ThemedText>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.stepNumberText}>3</ThemedText>
            </View>
            <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
              Update the metadata export with your Practa details
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
    marginBottom: Spacing.xl,
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
  previewButton: {
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
