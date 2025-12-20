import React from "react";
import { ScrollView, View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { FooterIllustration } from "@/components/FooterIllustration";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

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
          How Our Rice Donation System Works
        </ThemedText>
        <ThemedText style={[styles.heroDescription, { color: theme.textSecondary }]}>
          Every meditation session contributes to real-world impact through our sustainable rice donation system.
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
            title="Growing Rice Fund"
            description="Our principal investment of $1,000 growing at 4.5% interest annually. This fund remains untouched, ensuring sustainable growth."
          />
          <HowItWorksStep
            number={2}
            title="Interest Generation"
            description="The interest earned becomes our 'Ready for Harvest' amount, which funds the rice donations without depleting the principal."
          />
          <HowItWorksStep
            number={3}
            title="Rice Distribution"
            description="Every $1 in the Ready for Harvest fund converts to 4 meals, with each meal providing 5,000 grains of rice."
          />
          <HowItWorksStep
            number={4}
            title="Meditation Impact"
            description="Your meditation sessions directly contribute to rice donations, making real-world impact while you practice mindfulness."
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Frequently Asked Questions
        </ThemedText>
        <View style={styles.faqList}>
          <FAQItem
            question="How does meditation on this app help fight hunger?"
            answer="For every minute you meditate, our app tracks your contribution in grains of rice (10 grains per minute). Once a year, all grains of rice earned by users are converted into monetary donations. This is done by calculating the average price of rice per kilogram in developing countries and making a donation to the World Food Programme (WFP)."
          />
          <FAQItem
            question="Is this app sponsored by or affiliated with the World Food Programme?"
            answer="No, this app is not directly sponsored or affiliated with the World Food Programme. However, it makes annual donations based on user contributions to support their global hunger initiatives."
          />
          <FAQItem
            question="How much rice is earned by meditating?"
            answer="You earn 10 grains of rice per minute. For example, meditating for 10 minutes generates 100 grains of rice."
          />
          <FAQItem
            question="Can meditation really help fight global hunger?"
            answer="Yes! With 8.16 billion people on the planet, if everyone meditated for 10 minutes a day, we could generate the equivalent of 816 billion grains of rice daily. This would far exceed the 360 billion to 600 billion grains needed to feed all 36 million starving children globally."
          />
          <FAQItem
            question="How many grains of rice are needed to feed starving children?"
            answer="Feeding 36 million starving children costs $18 million per day, which translates to 360 billion to 600 billion grains of rice at a cost of $0.00003 to $0.00005 per grain."
          />
          <FAQItem
            question="Why focus on meditation to fight hunger?"
            answer="Meditation not only fosters personal well-being but also creates a ripple effect of positive change. By meditating, you support your mental health while contributing to a global cause."
          />
          <FAQItem
            question="How do I get started?"
            answer="You can start with our simple timer on the home page. Select your preferred duration and tap the Start button to begin your meditation session and start earning rice."
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.supportCard, { backgroundColor: theme.secondary }]}>
          <Feather name="heart" size={24} color={theme.primary} />
          <View style={styles.supportContent}>
            <ThemedText style={styles.supportTitle}>
              Help Us Grow
            </ThemedText>
            <ThemedText style={[styles.supportDescription, { color: theme.textSecondary }]}>
              Share Rice Meditation with friends and family to spread mindfulness and help feed more people.
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
    lineHeight: 20,
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
