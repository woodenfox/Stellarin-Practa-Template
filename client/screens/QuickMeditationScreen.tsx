import React, { useRef, useCallback, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { DURATION_OPTIONS } from "@/components/DurationPicker";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const ITEM_HEIGHT = 80;
const VISIBLE_ITEMS = 5;
const CIRCULAR_MULTIPLIER = 3;

export default function QuickMeditationScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  const itemCount = DURATION_OPTIONS.length;

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const defaultIdx = DURATION_OPTIONS.findIndex((opt) => opt.seconds === 180);
    return defaultIdx >= 0 ? defaultIdx : 4;
  });

  const circularData = useMemo(() => {
    const data: Array<{ label: string; seconds: number; index: number }> = [];
    for (let i = 0; i < CIRCULAR_MULTIPLIER; i++) {
      DURATION_OPTIONS.forEach((option, idx) => {
        data.push({ ...option, index: i * itemCount + idx });
      });
    }
    return data;
  }, [itemCount]);

  const initialScrollIndex = useMemo(() => {
    return itemCount + selectedIndex;
  }, [itemCount, selectedIndex]);

  const handleScrollEnd = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const currentIndex = Math.round(offsetY / ITEM_HEIGHT);
      const actualIndex = currentIndex % itemCount;
      const totalHeight = itemCount * ITEM_HEIGHT;

      setSelectedIndex(actualIndex);

      if (offsetY < totalHeight * 0.5) {
        flatListRef.current?.scrollToOffset({
          offset: offsetY + totalHeight,
          animated: false,
        });
      } else if (offsetY > totalHeight * 1.5) {
        flatListRef.current?.scrollToOffset({
          offset: offsetY - totalHeight,
          animated: false,
        });
      }
    },
    [itemCount]
  );

  const handleItemPress = useCallback(
    (index: number, seconds: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const actualIndex = index % itemCount;
      setSelectedIndex(actualIndex);
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
      });
    },
    [itemCount]
  );

  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const duration = DURATION_OPTIONS[selectedIndex].seconds;
    navigation.replace("Session", { duration });
  }, [navigation, selectedIndex]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: { label: string; seconds: number; index: number }; index: number }) => {
      const actualIndex = index % itemCount;
      const isSelected = actualIndex === selectedIndex;

      return (
        <Pressable
          onPress={() => handleItemPress(index, item.seconds)}
          style={[styles.item, { height: ITEM_HEIGHT }]}
        >
          <ThemedText
            style={[
              styles.itemLabel,
              {
                color: isSelected ? theme.primary : theme.textSecondary,
                fontSize: isSelected ? 48 : 28,
                fontWeight: isSelected ? "700" : "400",
                opacity: isSelected ? 1 : 0.5,
              },
            ]}
          >
            {item.label}
          </ThemedText>
        </Pressable>
      );
    },
    [selectedIndex, theme, handleItemPress, itemCount]
  );

  const fadeColorStart = isDark ? "rgba(18,18,18,1)" : "rgba(255,255,255,1)";
  const fadeColorEnd = isDark ? "rgba(18,18,18,0)" : "rgba(255,255,255,0)";

  const listHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
  const paddingVertical = (listHeight - ITEM_HEIGHT) / 2;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <Pressable
        onPress={handleClose}
        style={[styles.closeButton, { top: insets.top + Spacing.md }]}
      >
        <View style={[styles.closeCircle, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="x" size={24} color={theme.text} />
        </View>
      </Pressable>

      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          Choose Duration
        </ThemedText>

        <View style={[styles.pickerContainer, { height: listHeight }]}>
          <FlatList
            ref={flatListRef}
            data={circularData}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.index}`}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical }}
            initialScrollIndex={initialScrollIndex}
            getItemLayout={(_, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            onMomentumScrollEnd={handleScrollEnd}
          />

          <LinearGradient
            colors={[fadeColorStart, fadeColorEnd]}
            style={styles.fadeTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[fadeColorEnd, fadeColorStart]}
            style={styles.fadeBottom}
            pointerEvents="none"
          />

          <View
            style={[
              styles.selectionIndicator,
              {
                borderColor: theme.primary,
                top: paddingVertical,
              },
            ]}
            pointerEvents="none"
          />
        </View>

        <Pressable
          onPress={handleStart}
          style={[styles.startButton, { backgroundColor: theme.primary }]}
        >
          <Feather name="play" size={24} color="#FFFFFF" />
          <ThemedText style={styles.startText}>Start Meditation</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    left: Spacing.lg,
    zIndex: 10,
  },
  closeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.xl,
  },
  pickerContainer: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  item: {
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: {
    textAlign: "center",
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
  },
  selectionIndicator: {
    position: "absolute",
    left: Spacing.xl,
    right: Spacing.xl,
    height: ITEM_HEIGHT,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderRadius: BorderRadius.md,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.full,
    marginTop: Spacing["2xl"],
  },
  startText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
