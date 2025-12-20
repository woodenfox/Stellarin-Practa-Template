import React, { useRef, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, FlatList } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export const DURATION_OPTIONS = [
  { label: "6 sec", seconds: 6 },
  { label: "30 sec", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "20 min", seconds: 1200 },
  { label: "30 min", seconds: 1800 },
  { label: "45 min", seconds: 2700 },
  { label: "60 min", seconds: 3600 },
];

interface DurationPickerProps {
  selectedDuration: number;
  onSelect: (duration: number) => void;
}

const ITEM_WIDTH = 82;
const ITEM_MARGIN = 4;
const TOTAL_ITEM_WIDTH = ITEM_WIDTH + ITEM_MARGIN * 2;

export function DurationPicker({ selectedDuration, onSelect }: DurationPickerProps) {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const handleSelect = useCallback((seconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(seconds);
  }, [onSelect]);

  const renderItem = useCallback(({ item }: { item: { label: string; seconds: number } }) => (
    <Pressable
      onPress={() => handleSelect(item.seconds)}
      style={[
        styles.chip,
        {
          backgroundColor: selectedDuration === item.seconds ? theme.primary : theme.backgroundDefault,
          borderColor: selectedDuration === item.seconds ? theme.primary : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.chipLabel,
          { color: selectedDuration === item.seconds ? "#FFFFFF" : theme.text },
        ]}
      >
        {item.label}
      </ThemedText>
    </Pressable>
  ), [selectedDuration, theme, handleSelect]);

  const initialIndex = useMemo(() => {
    const idx = DURATION_OPTIONS.findIndex(opt => opt.seconds === selectedDuration);
    return Math.max(0, idx);
  }, [selectedDuration]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={DURATION_OPTIONS}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.seconds}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialScrollIndex={initialIndex > 2 ? initialIndex - 2 : 0}
        getItemLayout={(_, index) => ({
          length: TOTAL_ITEM_WIDTH,
          offset: TOTAL_ITEM_WIDTH * index,
          index,
        })}
      />
      <LinearGradient
        colors={[theme.backgroundRoot, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fadeLeft}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", theme.backgroundRoot]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fadeRight}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  chip: {
    height: 44,
    width: ITEM_WIDTH,
    marginHorizontal: ITEM_MARGIN,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  fadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 24,
  },
  fadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
  },
});
