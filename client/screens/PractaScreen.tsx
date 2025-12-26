import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { PRACTA_DEFINITIONS, COMMUNITY_PRACTA, createFlow } from "@/practa/registry";
import { PractaType, FlowDefinition, PractaDefinition } from "@/types/flow";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PRACTA_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  "journal": "edit-3",
  "silent-meditation": "moon",
  "personalized-meditation": "headphones",
  "tend": "heart",
  "integration-breath": "wind",
  "example-affirmation": "sun",
};

export default function PractaScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const corePractaTypes = Object.keys(PRACTA_DEFINITIONS) as PractaType[];
  const communityPractaTypes = Object.keys(COMMUNITY_PRACTA);

  const handleCorePractaPress = (type: PractaType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const definition = PRACTA_DEFINITIONS[type];
    const flow = createFlow(definition.name, [type], {
      id: `test-${type}`,
      description: definition.description,
    });
    navigation.navigate("Flow", { flow });
  };

  const handleCommunityPractaPress = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const definition = COMMUNITY_PRACTA[type];
    const flow: FlowDefinition = {
      id: `test-community-${type}`,
      name: definition.name,
      description: definition.description,
      practas: [{
        id: `${type}_0`,
        type: type as PractaType,
        name: definition.name,
        description: definition.description,
      }],
    };
    navigation.navigate("Flow", { flow });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.sectionTitle}>Core Practa</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Built-in wellbeing experiences
        </ThemedText>

        {corePractaTypes.map((type) => {
          const definition = PRACTA_DEFINITIONS[type];
          const icon = PRACTA_ICONS[type] || "circle";

          return (
            <Pressable
              key={type}
              onPress={() => handleCorePractaPress(type)}
              style={({ pressed }) => [
                styles.practaCard,
                { backgroundColor: theme.backgroundDefault },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
                <Feather name={icon} size={24} color={theme.primary} />
              </View>
              <View style={styles.textContainer}>
                <ThemedText style={styles.practaName}>{definition.name}</ThemedText>
                <ThemedText style={[styles.practaDescription, { color: theme.textSecondary }]}>
                  {definition.description}
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          );
        })}

        {communityPractaTypes.length > 0 ? (
          <>
            <ThemedText style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
              Community Practa
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Created by trusted developers
            </ThemedText>

            {communityPractaTypes.map((type) => {
              const definition = COMMUNITY_PRACTA[type];
              const icon = PRACTA_ICONS[type] || "users";

              return (
                <Pressable
                  key={type}
                  onPress={() => handleCommunityPractaPress(type)}
                  style={({ pressed }) => [
                    styles.practaCard,
                    { backgroundColor: theme.backgroundDefault },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.accent + "20" }]}>
                    <Feather name={icon} size={24} color={theme.accent} />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.nameRow}>
                      <ThemedText style={styles.practaName}>{definition.name}</ThemedText>
                      <View style={[styles.communityBadge, { backgroundColor: theme.accent + "20" }]}>
                        <ThemedText style={[styles.badgeText, { color: theme.accent }]}>
                          Community
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={[styles.practaDescription, { color: theme.textSecondary }]}>
                      {definition.description}
                    </ThemedText>
                    <ThemedText style={[styles.authorText, { color: theme.textSecondary }]}>
                      by {definition.author}
                    </ThemedText>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  practaCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  practaName: {
    fontSize: 17,
    fontWeight: "600",
  },
  practaDescription: {
    fontSize: 14,
  },
  authorText: {
    fontSize: 12,
    marginTop: 2,
  },
  communityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
