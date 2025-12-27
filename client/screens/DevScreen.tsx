import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

export default function DevScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();
  const [isResetting, setIsResetting] = useState(false);

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/practa/reset-to-demo");
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/practa/metadata"] });
      Alert.alert(
        "Reset Complete",
        "Your Practa has been reset to the demo state. Restart the app to see the changes.",
        [{ text: "OK" }]
      );
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Reset Failed", error.message || "Failed to reset Practa");
    },
    onSettled: () => {
      setIsResetting(false);
    },
  });

  const handleResetToDemo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Reset to Demo",
      "This will replace your current Practa files with the demo template. Your changes will be lost. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setIsResetting(true);
            resetMutation.mutate();
          },
        },
      ]
    );
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText style={styles.title}>Developer Options</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Tools for development and testing
        </ThemedText>
      </View>

      <View style={styles.content}>
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="refresh-cw" size={20} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>Reset</ThemedText>
          </View>

          <Pressable
            onPress={handleResetToDemo}
            disabled={isResetting}
            style={({ pressed }) => [
              styles.optionButton,
              {
                backgroundColor: pressed
                  ? theme.backgroundSecondary
                  : "transparent",
              },
            ]}
          >
            <View style={styles.optionContent}>
              <Feather
                name="rotate-ccw"
                size={20}
                color={isResetting ? theme.textSecondary : "#EF4444"}
              />
              <View style={styles.optionText}>
                <ThemedText
                  style={[
                    styles.optionTitle,
                    { color: isResetting ? theme.textSecondary : "#EF4444" },
                  ]}
                >
                  Reset Practa to Demo
                </ThemedText>
                <ThemedText
                  style={[styles.optionDescription, { color: theme.textSecondary }]}
                >
                  Replace current Practa with the demo template
                </ThemedText>
              </View>
            </View>
            {isResetting ? (
              <ActivityIndicator size="small" color={theme.textSecondary} />
            ) : (
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            )}
          </Pressable>
        </Card>

        <ThemedText style={[styles.warningText, { color: theme.textSecondary }]}>
          Warning: Resetting will overwrite all files in the my-practa folder.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  warningText: {
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
  },
});
