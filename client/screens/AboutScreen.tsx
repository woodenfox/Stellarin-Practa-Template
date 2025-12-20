import React from "react";
import { ScrollView, View, StyleSheet, Linking, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface MissionCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  iconColor: string;
}

function MissionCard({ icon, title, description, iconColor }: MissionCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.missionCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.missionIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={icon} size={28} color={iconColor} />
      </View>
      <ThemedText type="h4" style={styles.missionTitle}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.missionDescription, { color: theme.textSecondary }]}>
        {description}
      </ThemedText>
    </View>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={[styles.faqItem, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.faqHeader}>
        <ThemedText style={styles.faqQuestion}>{question}</ThemedText>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.textSecondary}
        />
      </View>
      {expanded ? (
        <ThemedText style={[styles.faqAnswer, { color: theme.textSecondary }]}>
          {answer}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

export default function AboutScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

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
      <View style={[styles.heroSection, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="heart" size={48} color={theme.primary} />
        <ThemedText type="h3" style={styles.heroTitle}>
          Our Mission
        </ThemedText>
        <ThemedText style={[styles.heroDescription, { color: theme.textSecondary }]}>
          Make meditation universally accessible and empower meditators to help others and better the world.
        </ThemedText>
      </View>

      <View style={styles.missionSection}>
        <MissionCard
          icon="book-open"
          title="Teaching Meditation"
          description="Motivate the universe to learn and practice meditation at no cost. Meditation is scientifically proven to improve health, yet most of us struggle to form a habit. We believe learning, tracking, and motivating meditation should always be free to everyone, forever."
          iconColor={theme.primary}
        />
        <MissionCard
          icon="globe"
          title="Empowering Change"
          description="Link meditation directly to world change. Healthy people make the world a better place. This project makes that link even more tangible by ensuring that every minute of meditation is directly linked to a tiny amount of world change."
          iconColor={theme.accent}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Frequently Asked Questions
        </ThemedText>
        <View style={styles.faqList}>
          <FAQItem
            question="Where does the rice come from?"
            answer="The rice powering this project came from generous donations. Our hope is that over time, as more people join and participate, we will continue to receive donations to support the planting and harvesting of more rice for those in need."
          />
          <FAQItem
            question="How much rice do I earn per meditation?"
            answer="You earn 10 grains of rice for every minute you meditate. A 10-minute session earns 100 grains, while a full hour earns 600 grains of rice."
          />
          <FAQItem
            question="How is the rice donated?"
            answer="All rice donations are sent to the World Food Program, which distributes food to those in need around the world."
          />
          <FAQItem
            question="Is this app really free?"
            answer="Yes! Rice Meditation is completely free to use. We believe meditation and the ability to help others should be accessible to everyone."
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Support Our Mission
        </ThemedText>
        <View style={[styles.supportCard, { backgroundColor: theme.secondary }]}>
          <Feather name="heart" size={24} color={theme.primary} />
          <View style={styles.supportContent}>
            <ThemedText style={styles.supportTitle}>
              Help us grow
            </ThemedText>
            <ThemedText style={[styles.supportDescription, { color: theme.textSecondary }]}>
              Share Rice Meditation with friends and family to spread mindfulness and help feed more people.
            </ThemedText>
          </View>
        </View>
      </View>
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
  heroSection: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
  },
  heroTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  heroDescription: {
    fontSize: 15,
    textAlign: "center",
  },
  missionSection: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  missionCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  missionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  missionTitle: {
    marginBottom: Spacing.sm,
  },
  missionDescription: {
    fontSize: 14,
  },
  section: {
    marginTop: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  faqList: {
    gap: Spacing.sm,
  },
  faqItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    marginRight: Spacing.md,
  },
  faqAnswer: {
    marginTop: Spacing.md,
    fontSize: 14,
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
});
