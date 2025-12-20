import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { DurationChip } from "@/components/DurationChip";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { StatCard } from "@/components/StatCard";
import { LiveCounter } from "@/components/LiveCounter";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { useMeditation } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const DURATION_OPTIONS = [
  { label: "6 sec", seconds: 6 },
  { label: "1 min", seconds: 60 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "25 min", seconds: 1500 },
  { label: "45 min", seconds: 2700 },
  { label: "60 min", seconds: 3600 },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TimerScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { selectedDuration, setSelectedDuration, totalRice, getTodayStreak } = useMeditation();

  const handleStartMeditation = () => {
    navigation.navigate("Session", { duration: selectedDuration });
  };

  const currentStreak = getTodayStreak() ? 1 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing["6xl"] + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Select Duration
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Earn 10 grains of rice for every minute you meditate
          </ThemedText>
          
          <View style={styles.chipGrid}>
            {DURATION_OPTIONS.map((option) => (
              <DurationChip
                key={option.seconds}
                label={option.label}
                durationSeconds={option.seconds}
                isSelected={selectedDuration === option.seconds}
                onPress={setSelectedDuration}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Your Impact
          </ThemedText>
          <View style={styles.statsRow}>
            <StatCard
              icon="droplet"
              label="Rice Harvested"
              value={totalRice}
              iconColor={theme.accent}
            />
            <View style={{ width: Spacing.md }} />
            <StatCard
              icon="zap"
              label="Today's Streak"
              value={currentStreak > 0 ? "Complete" : "Not yet"}
              iconColor={theme.primary}
            />
          </View>
        </View>

        <View style={styles.liveSection}>
          <LiveCounter />
        </View>
      </ScrollView>

      <FloatingActionButton
        onPress={handleStartMeditation}
        icon="play"
        style={{
          position: "absolute",
          bottom: tabBarHeight + Spacing.xl,
          alignSelf: "center",
        }}
      />
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
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: Spacing.sm,
  },
  liveSection: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
});
