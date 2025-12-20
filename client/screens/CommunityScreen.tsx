import React, { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { FooterIllustration } from "@/components/FooterIllustration";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function CommunityScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  const [liveCount, setLiveCount] = useState(Math.floor(Math.random() * 100) + 150);
  const [totalToday, setTotalToday] = useState(Math.floor(Math.random() * 500) + 1200);
  const [totalRiceDonated, setTotalRiceDonated] = useState(Math.floor(Math.random() * 50000) + 250000);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );

    const interval = setInterval(() => {
      setLiveCount((prev) => Math.max(50, prev + Math.floor(Math.random() * 11) - 5));
      setTotalToday((prev) => prev + Math.floor(Math.random() * 3));
      setTotalRiceDonated((prev) => prev + Math.floor(Math.random() * 50));
    }, 3000);

    return () => clearInterval(interval);
  }, [pulseScale]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroCard, { backgroundColor: theme.backgroundDefault }]}>
        <Animated.View
          style={[
            styles.liveIndicator,
            { backgroundColor: theme.success },
            pulseAnimatedStyle,
          ]}
        />
        <ThemedText style={[styles.liveLabel, { color: theme.textSecondary }]}>
          LIVE NOW
        </ThemedText>
        <ThemedText style={[styles.heroNumber, { color: theme.primary }]}>
          {liveCount}
        </ThemedText>
        <ThemedText style={[styles.heroLabel, { color: theme.textSecondary }]}>
          people meditating right now
        </ThemedText>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="sun" size={24} color={theme.accent} />
          <ThemedText style={[styles.statNumber, { color: theme.text }]}>
            {totalToday.toLocaleString()}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Sessions Today
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="droplet" size={24} color={theme.primary} />
          <ThemedText style={[styles.statNumber, { color: theme.text }]}>
            {(totalRiceDonated / 1000).toFixed(0)}K
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Rice Donated
          </ThemedText>
        </View>
      </View>

      <View style={[styles.messageCard, { backgroundColor: theme.primary }]}>
        <Feather name="heart" size={28} color="#FFFFFF" />
        <ThemedText style={styles.messageText}>
          Together, we're making a difference. Every minute of meditation helps feed those in need.
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          How It Works
        </ThemedText>
        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.infoRow}>
            <View style={[styles.stepCircle, { backgroundColor: theme.secondary }]}>
              <ThemedText style={[styles.stepNumber, { color: theme.primary }]}>1</ThemedText>
            </View>
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoTitle}>You Meditate</ThemedText>
              <ThemedText style={[styles.infoDescription, { color: theme.textSecondary }]}>
                Choose your duration and start a session
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.stepCircle, { backgroundColor: theme.secondary }]}>
              <ThemedText style={[styles.stepNumber, { color: theme.primary }]}>2</ThemedText>
            </View>
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoTitle}>We Donate Rice</ThemedText>
              <ThemedText style={[styles.infoDescription, { color: theme.textSecondary }]}>
                10 grains of rice per minute of meditation
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.stepCircle, { backgroundColor: theme.secondary }]}>
              <ThemedText style={[styles.stepNumber, { color: theme.primary }]}>3</ThemedText>
            </View>
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoTitle}>Feed The World</ThemedText>
              <ThemedText style={[styles.infoDescription, { color: theme.textSecondary }]}>
                Rice goes to the World Food Program
              </ThemedText>
            </View>
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
  heroCard: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
  },
  liveIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: Spacing.sm,
  },
  liveLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  heroNumber: {
    fontSize: 72,
    fontWeight: "700",
  },
  heroLabel: {
    fontSize: 16,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.lg,
  },
  messageText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },
  section: {
    marginTop: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  infoCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 13,
  },
});
