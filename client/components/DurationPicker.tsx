import React, { useRef, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, FlatList, Dimensions } from "react-native";
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

const ITEM_WIDTH = 88;
const ITEM_MARGIN = 4;
const TOTAL_ITEM_WIDTH = ITEM_WIDTH + ITEM_MARGIN * 2;
const CIRCULAR_MULTIPLIER = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;

export function DurationPicker({ selectedDuration, onSelect }: DurationPickerProps) {
  const { theme, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const itemCount = DURATION_OPTIONS.length;

  const circularData = useMemo(() => {
    const data: Array<{ label: string; seconds: number; index: number }> = [];
    for (let i = 0; i < CIRCULAR_MULTIPLIER; i++) {
      DURATION_OPTIONS.forEach((option, idx) => {
        data.push({ ...option, index: i * itemCount + idx });
      });
    }
    return data;
  }, [itemCount]);

  const initialScrollOffset = useMemo(() => {
    const selectedIdx = DURATION_OPTIONS.findIndex(opt => opt.seconds === selectedDuration);
    const indexInMiddleSet = itemCount + (selectedIdx >= 0 ? selectedIdx : 4);
    const itemOffset = indexInMiddleSet * TOTAL_ITEM_WIDTH;
    const centerOffset = itemOffset - (SCREEN_WIDTH / 2) + (TOTAL_ITEM_WIDTH / 2);
    return Math.max(0, centerOffset);
  }, [selectedDuration, itemCount]);

  const handleScrollEnd = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const totalWidth = itemCount * TOTAL_ITEM_WIDTH;
    
    if (offsetX < totalWidth * 0.3) {
      flatListRef.current?.scrollToOffset({
        offset: offsetX + totalWidth,
        animated: false,
      });
    } else if (offsetX > totalWidth * 1.7) {
      flatListRef.current?.scrollToOffset({
        offset: offsetX - totalWidth,
        animated: false,
      });
    }
  }, [itemCount]);

  const handleSelect = useCallback((seconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(seconds);
  }, [onSelect]);

  const renderItem = useCallback(({ item }: { item: { label: string; seconds: number; index: number } }) => (
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

  const fadeColorStart = isDark ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)";
  const fadeColorEnd = isDark ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)";

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={circularData}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        contentOffset={{ x: initialScrollOffset, y: 0 }}
        getItemLayout={(_, index) => ({
          length: TOTAL_ITEM_WIDTH,
          offset: TOTAL_ITEM_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={handleScrollEnd}
      />
      <LinearGradient
        colors={[fadeColorStart, fadeColorEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fadeLeft}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[fadeColorEnd, fadeColorStart]}
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
    height: 52,
    width: ITEM_WIDTH,
    marginHorizontal: ITEM_MARGIN,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  fadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
  },
  fadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
  },
});
