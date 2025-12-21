import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { StreakCalendar } from "@/components/StreakCalendar";
import { QuickJournalEntry } from "@/components/QuickJournalEntry";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useMeditation } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { sessions, totalRice } = useMeditation();

  const sevenDayStreak = useMemo(() => {
    const today = new Date();
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const hasSession = sessions.some((s) => s.date === dateStr);

      days.push({
        day: dayNames[date.getDay()],
        completed: hasSession,
        isToday: i === 0,
      });
    }

    return days;
  }, [sessions]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const hasSession = sessions.some((s) => s.date === dateStr);
      
      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  }, [sessions]);

  const handleStartMeditation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Session", { duration: 180 });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
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
        <View style={[styles.statsRow, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.statItem}>
            <Feather name="zap" size={20} color={theme.primary} />
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {currentStreak}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Day Streak
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Feather name="award" size={20} color={theme.accent} />
            <ThemedText style={[styles.statValue, { color: theme.accent }]}>
              {totalRice.toLocaleString()}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Rice Donated
            </ThemedText>
          </View>
        </View>

        <StreakCalendar days={sevenDayStreak} />

        <Pressable
          onPress={handleStartMeditation}
          style={[styles.quickStartButton, { backgroundColor: theme.primary }]}
        >
          <View style={styles.quickStartContent}>
            <View style={styles.quickStartLeft}>
              <Feather name="play-circle" size={28} color="#FFFFFF" />
              <View>
                <ThemedText style={styles.quickStartTitle}>Quick Meditation</ThemedText>
                <ThemedText style={styles.quickStartSubtitle}>3 minutes</ThemedText>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="rgba(255,255,255,0.7)" />
          </View>
        </Pressable>

        <View style={[styles.journalSection, { backgroundColor: theme.backgroundDefault }]}>
          <QuickJournalEntry compact />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    marginHorizontal: Spacing.md,
  },
  quickStartButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  quickStartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickStartLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  quickStartTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  quickStartSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  journalSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
});
