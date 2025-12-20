import React from "react";
import { ScrollView, View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

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

export default function FAQScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
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
});
