import React, { useMemo, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { HarmonyHalo } from "@/components/HarmonyHalo";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useMeditation } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { sessions, totalRice, journalEntries } = useMeditation();

  const riceCounterScale = useSharedValue(1);

  useEffect(() => {
    riceCounterScale.value = withSpring(1.05, { damping: 8 });
    setTimeout(() => {
      riceCounterScale.value = withSpring(1);
    }, 200);
  }, [totalRice]);

  const riceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: riceCounterScale.value }],
  }));

  const sevenDayData = useMemo(() => {
    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const hasMeditation = sessions.some((s) => s.date === dateStr);
      const hasJournal = journalEntries.some((e) => e.date === dateStr);

      days.push({
        day: dayNames[date.getDay()],
        meditated: hasMeditation,
        journaled: hasJournal,
        isToday: i === 0,
      });
    }

    return days;
  }, [sessions, journalEntries]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const hasActivity =
        sessions.some((s) => s.date === dateStr) ||
        journalEntries.some((e) => e.date === dateStr);

      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }, [sessions, journalEntries]);

  const todaysMeditation = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return sessions.filter((s) => s.date === today);
  }, [sessions]);

  const todaysMinutes = useMemo(() => {
    return Math.floor(
      todaysMeditation.reduce((acc, s) => acc + s.duration, 0) / 60
    );
  }, [todaysMeditation]);

  const handleStartMeditation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("QuickMeditation");
  };

  const handleStartJournal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Recording");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <LinearGradient
            colors={
              isDark
                ? ["rgba(255,148,66,0.15)", "rgba(255,107,0,0.05)"]
                : ["rgba(255,128,31,0.12)", "rgba(255,107,0,0.04)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroGradient, { borderColor: theme.border }]}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <ThemedText
                  style={[styles.heroLabel, { color: theme.textSecondary }]}
                >
                  Rice Harvested
                </ThemedText>
                <Animated.View style={riceAnimatedStyle}>
                  <ThemedText style={[styles.heroValue, { color: theme.primary }]}>
                    {totalRice.toLocaleString()}
                  </ThemedText>
                </Animated.View>
                <ThemedText
                  style={[styles.heroSubtext, { color: theme.textSecondary }]}
                >
                  grains donated
                </ThemedText>
              </View>
              <View style={styles.heroRight}>
                <View
                  style={[
                    styles.todayBadge,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <Feather name="sun" size={16} color={theme.amber} />
                  <ThemedText
                    style={[styles.todayText, { color: theme.text }]}
                  >
                    {todaysMinutes} min today
                  </ThemedText>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <HarmonyHalo days={sevenDayData} currentStreak={currentStreak} />

        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleStartMeditation}
            style={[styles.actionTile, styles.actionTileLarge]}
          >
            <LinearGradient
              colors={[theme.amber, theme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="play-circle" size={32} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.actionTitle}>Meditate</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                Start a session
              </ThemedText>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleStartJournal}
            style={[styles.actionTile, styles.actionTileSmall]}
          >
            <LinearGradient
              colors={isDark ? [theme.jade, "#4A9B7F"] : [theme.jade, "#4A9B7F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="mic" size={28} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.actionTitle}>Journal</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                Reflect today
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>

        <View
          style={[styles.insightCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.insightHeader}>
            <View
              style={[
                styles.insightIcon,
                { backgroundColor: theme.jadeMuted },
              ]}
            >
              <Feather name="trending-up" size={18} color={theme.jade} />
            </View>
            <ThemedText style={[styles.insightTitle, { color: theme.text }]}>
              Your Progress
            </ThemedText>
          </View>
          <ThemedText
            style={[styles.insightText, { color: theme.textSecondary }]}
          >
            {currentStreak === 0
              ? "Start your mindfulness journey today. Every minute counts!"
              : currentStreak < 3
              ? `Great start! You're on a ${currentStreak}-day streak. Keep the momentum going.`
              : currentStreak < 7
              ? `Amazing! ${currentStreak} days of mindfulness. You're building a powerful habit.`
              : `Incredible ${currentStreak}-day streak! Your dedication is inspiring.`}
          </ThemedText>
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
  heroSection: {
    marginBottom: Spacing.xs,
  },
  heroGradient: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.xl,
  },
  heroLeft: {
    gap: 2,
  },
  heroRight: {},
  heroLabel: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 44,
    fontWeight: "700",
    lineHeight: 52,
  },
  heroSubtext: {
    fontSize: 14,
  },
  todayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  todayText: {
    fontSize: 13,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionTile: {
    borderRadius: 20,
    overflow: "hidden",
  },
  actionTileLarge: {
    flex: 1.2,
    height: 140,
  },
  actionTileSmall: {
    flex: 1,
    height: 140,
  },
  actionGradient: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "space-between",
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  actionSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  insightCard: {
    padding: Spacing.lg,
    borderRadius: 20,
    gap: Spacing.md,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
