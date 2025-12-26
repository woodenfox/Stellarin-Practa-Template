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
import { PRACTA_DEFINITIONS, createFlow } from "@/practa/registry";
import { PractaType } from "@/types/flow";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PRACTA_ICONS: Record<PractaType, keyof typeof Feather.glyphMap> = {
  "journal": "edit-3",
  "silent-meditation": "moon",
  "personalized-meditation": "headphones",
  "tend": "heart",
  "integration-breath": "wind",
};

export default function PractaScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const practaTypes = Object.keys(PRACTA_DEFINITIONS) as PractaType[];

  const handlePractaPress = (type: PractaType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const definition = PRACTA_DEFINITIONS[type];
    const flow = createFlow(definition.name, [type], {
      id: `test-${type}`,
      description: definition.description,
    });
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
        <ThemedText style={styles.subtitle}>
          Test individual practa components
        </ThemedText>

        {practaTypes.map((type) => {
          const definition = PRACTA_DEFINITIONS[type];
          const icon = PRACTA_ICONS[type] || "circle";

          return (
            <Pressable
              key={type}
              onPress={() => handlePractaPress(type)}
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
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
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
  practaName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  practaDescription: {
    fontSize: 14,
  },
});
