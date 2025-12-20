import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export function LiveCounter() {
  const { theme } = useTheme();
  const [count, setCount] = useState(Math.floor(Math.random() * 50) + 120);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        const change = Math.floor(Math.random() * 7) - 3;
        return Math.max(50, prev + change);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.dot, { backgroundColor: theme.success }]} />
      <Feather name="users" size={16} color={theme.textSecondary} />
      <ThemedText style={[styles.text, { color: theme.textSecondary }]}>
        <ThemedText style={[styles.count, { color: theme.text }]}>{count}</ThemedText>
        {" "}people meditating now
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 14,
  },
  count: {
    fontWeight: "600",
  },
});
