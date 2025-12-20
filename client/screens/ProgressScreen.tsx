import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { StreakCalendar } from "@/components/StreakCalendar";
import { ChallengeCard } from "@/components/ChallengeCard";
import { FooterIllustration } from "@/components/FooterIllustration";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useMeditation } from "@/context/MeditationContext";

export default function ProgressScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { totalRice, challengeProgress, getWeekStreaks, sessions } = useMeditation();

  const weekStreaks = getWeekStreaks();
  const totalMinutes = sessions.reduce((acc, s) => acc + Math.floor(s.duration / 60), 0);
  const totalSessions = sessions.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <StreakCalendar days={weekStreaks} />

      <View style={styles.section}>
        <ChallengeCard
          title="90 Days Challenge"
          progress={challengeProgress}
          total={90}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Total Impact
        </ThemedText>
        <View style={[styles.riceCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.riceIconContainer, { backgroundColor: theme.secondary }]}>
            <Feather name="droplet" size={32} color={theme.primary} />
          </View>
          <ThemedText style={[styles.riceValue, { color: theme.accent }]}>
            {totalRice.toLocaleString()}
          </ThemedText>
          <ThemedText style={[styles.riceLabel, { color: theme.textSecondary }]}>
            Grains of rice harvested
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Statistics
        </ThemedText>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="clock" size={20} color={theme.primary} />
            <ThemedText style={[styles.statValue, { color: theme.text }]}>
              {totalMinutes}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Minutes
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="activity" size={20} color={theme.accent} />
            <ThemedText style={[styles.statValue, { color: theme.text }]}>
              {totalSessions}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Sessions
            </ThemedText>
          </View>
        </View>
      </View>

      <FooterIllustration />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginTop: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  riceCard: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
  },
  riceIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  riceValue: {
    fontSize: 48,
    fontWeight: "700",
  },
  riceLabel: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
  },
});
