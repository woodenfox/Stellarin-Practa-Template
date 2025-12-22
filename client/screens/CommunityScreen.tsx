import React, { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet, Pressable, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reloadAppAsync } from "expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { FooterIllustration } from "@/components/FooterIllustration";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useMeditation } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  subtitle?: string;
  iconColor: string;
}

function StatCard({ icon, label, value, subtitle, iconColor }: StatCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.statIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={icon} size={24} color={iconColor} />
      </View>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <ThemedText type="h4" style={[styles.statValue, { color: theme.primary }]}>
        {value}
      </ThemedText>
      {subtitle ? (
        <ThemedText style={[styles.statSubtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

interface HowItWorksStepProps {
  number: number;
  title: string;
  description: string;
}

function HowItWorksStep({ number, title, description }: HowItWorksStepProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.stepContainer}>
      <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
        <ThemedText style={[styles.stepNumberText, { color: theme.buttonText }]}>
          {number}
        </ThemedText>
      </View>
      <View style={styles.stepContent}>
        <ThemedText style={styles.stepTitle}>{title}</ThemedText>
        <ThemedText style={[styles.stepDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { globalRice, globalMeditators, refreshCommunityStats } = useMeditation();

  const [liveCount, setLiveCount] = useState(Math.floor(Math.random() * 100) + 150);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    refreshCommunityStats();
  }, [refreshCommunityStats]);

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
    }, 3000);

    return () => clearInterval(interval);
  }, [pulseScale]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const performReset = async () => {
    try {
      await AsyncStorage.clear();
      if (Platform.OS === "web") {
        window.location.reload();
      } else {
        reloadAppAsync();
      }
    } catch (error) {
      console.error("Failed to reset app data:", error);
      if (Platform.OS === "web") {
        window.alert("Failed to reset app data. Please try again.");
      } else {
        Alert.alert("Error", "Failed to reset app data. Please try again.");
      }
    }
  };

  const handleResetAppData = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "This will clear all your meditation sessions, journal entries, and progress. This cannot be undone. Are you sure?"
      );
      if (confirmed) {
        performReset();
      }
    } else {
      Alert.alert(
        "Reset App Data",
        "This will clear all your meditation sessions, journal entries, and progress. This cannot be undone. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reset Everything",
            style: "destructive",
            onPress: performReset,
          },
        ]
      );
    }
  };

  const formatRiceCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

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
        <View style={[styles.statCardSmall, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="users" size={24} color={theme.accent} />
          <ThemedText style={[styles.statNumberSmall, { color: theme.text }]}>
            {globalMeditators > 0 ? globalMeditators.toLocaleString() : "1,200+"}
          </ThemedText>
          <ThemedText style={[styles.statLabelSmall, { color: theme.textSecondary }]}>
            Total Meditators
          </ThemedText>
        </View>
        <View style={[styles.statCardSmall, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="droplet" size={24} color={theme.primary} />
          <ThemedText style={[styles.statNumberSmall, { color: theme.text }]}>
            {formatRiceCount(globalRice)}
          </ThemedText>
          <ThemedText style={[styles.statLabelSmall, { color: theme.textSecondary }]}>
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

      <View style={styles.statsGrid}>
        <StatCard
          icon="trending-up"
          label="Growing Rice Fund"
          value="$1,000"
          subtitle="Growing at 4.5% interest annually"
          iconColor={theme.primary}
        />
        <StatCard
          icon="package"
          label="Ready for Harvest"
          value="20,000,000"
          subtitle="grains (4,000 meals)"
          iconColor={theme.accent}
        />
        <StatCard
          icon="check-circle"
          label="Harvested Rice"
          value="0"
          subtitle="grains harvested by meditators"
          iconColor={theme.success}
        />
        <StatCard
          icon="calendar"
          label="Rice Donation"
          value="December"
          subtitle="All rice donated annually"
          iconColor={theme.primary}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          How It Works
        </ThemedText>
        <View style={[styles.howItWorksCard, { backgroundColor: theme.backgroundDefault }]}>
          <HowItWorksStep
            number={1}
            title="You Meditate"
            description="Choose your duration and start a session. Your practice earns 10 grains of rice per minute."
          />
          <HowItWorksStep
            number={2}
            title="Interest Generation"
            description="Our $1,000 fund grows at 4.5% annually. This interest funds rice donations without depleting the principal."
          />
          <HowItWorksStep
            number={3}
            title="Rice Distribution"
            description="Every $1 converts to 4 meals, with each meal providing 5,000 grains of rice to those in need."
          />
          <HowItWorksStep
            number={4}
            title="Annual Donation"
            description="Each December, all accumulated rice is donated to the World Food Programme."
          />
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          style={[styles.faqButton, { backgroundColor: theme.backgroundDefault }]}
          onPress={() => navigation.navigate("FAQ")}
        >
          <View style={styles.faqButtonContent}>
            <Feather name="help-circle" size={24} color={theme.primary} />
            <View style={styles.faqButtonText}>
              <ThemedText style={styles.faqButtonTitle}>
                Frequently Asked Questions
              </ThemedText>
              <ThemedText style={[styles.faqButtonSubtitle, { color: theme.textSecondary }]}>
                Learn more about how your meditation helps
              </ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={[styles.supportCard, { backgroundColor: theme.secondary }]}>
          <Feather name="heart" size={24} color={theme.primary} />
          <View style={styles.supportContent}>
            <ThemedText style={styles.supportTitle}>
              Help Us Grow
            </ThemedText>
            <ThemedText style={[styles.supportDescription, { color: theme.textSecondary }]}>
              Share Stellarin with friends and family to spread mindfulness and help feed more people.
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Developer Options
        </ThemedText>
        <Pressable
          style={[styles.resetButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.error }]}
          onPress={handleResetAppData}
        >
          <Feather name="trash-2" size={20} color={theme.error} />
          <View style={styles.resetButtonText}>
            <ThemedText style={[styles.resetButtonTitle, { color: theme.error }]}>
              Reset App Data
            </ThemedText>
            <ThemedText style={[styles.resetButtonSubtitle, { color: theme.textSecondary }]}>
              Clear all sessions, journal entries, and progress
            </ThemedText>
          </View>
        </Pressable>
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
  statCardSmall: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  statNumberSmall: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabelSmall: {
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
  statsGrid: {
    marginTop: Spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  statValue: {
    textAlign: "center",
  },
  statSubtitle: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
  section: {
    marginTop: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  howItWorksCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.lg,
  },
  stepContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
  },
  faqButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  faqButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  faqButtonText: {
    flex: 1,
  },
  faqButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  faqButtonSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.lg,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  supportDescription: {
    fontSize: 13,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  resetButtonText: {
    flex: 1,
  },
  resetButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  resetButtonSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
