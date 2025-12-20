import React from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { StatCard } from "@/components/StatCard";
import { LiveCounter } from "@/components/LiveCounter";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
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
        <View style={styles.liveSection}>
          <LiveCounter />
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

        <View style={styles.durationSection}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Select Duration
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Earn 10 grains of rice for every minute you meditate
          </ThemedText>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.durationRow}
          >
            {DURATION_OPTIONS.map((option) => (
              <Pressable
                key={option.seconds}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDuration(option.seconds);
                }}
                style={[
                  styles.durationChip,
                  {
                    backgroundColor: selectedDuration === option.seconds ? theme.primary : theme.backgroundDefault,
                    borderColor: selectedDuration === option.seconds ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.durationChipLabel,
                    { color: selectedDuration === option.seconds ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
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
  durationRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  durationChip: {
    height: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  durationChipLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: Spacing.sm,
  },
  liveSection: {
    marginBottom: Spacing["2xl"],
    alignItems: "center",
  },
  durationSection: {
    marginBottom: Spacing.lg,
  },
});
