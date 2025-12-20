import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ChallengeCardProps {
  progress: number;
  total: number;
  title: string;
}

export function ChallengeCard({ progress, total, title }: ChallengeCardProps) {
  const { theme } = useTheme();
  const percentage = Math.min((progress / total) * 100, 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="award" size={20} color={theme.accent} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="h4">{title}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {progress} out of {total} meditations completed
          </ThemedText>
        </View>
      </View>

      <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.accent,
              width: `${percentage}%`,
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <ThemedText style={[styles.progressText, { color: theme.textSecondary }]}>
          {percentage.toFixed(0)}% complete
        </ThemedText>
        <ThemedText style={[styles.daysLeft, { color: theme.primary }]}>
          {total - progress} days left
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  progressText: {
    fontSize: 13,
  },
  daysLeft: {
    fontSize: 13,
    fontWeight: "600",
  },
});
