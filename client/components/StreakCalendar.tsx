import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  withDelay,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface DayData {
  day: string;
  completed: boolean;
  isToday: boolean;
}

interface StreakCalendarProps {
  days: DayData[];
}

function DayIndicator({ day, completed, isToday }: DayData) {
  const { theme } = useTheme();
  const pulseOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (isToday && !completed) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    }
  }, [isToday, completed, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isToday && !completed ? pulseOpacity.value : 1,
  }));

  const getBackgroundColor = () => {
    if (completed) return theme.accent;
    if (isToday) return theme.primary;
    return theme.backgroundSecondary;
  };

  const getTextColor = () => {
    if (completed || isToday) return "#FFFFFF";
    return theme.textSecondary;
  };

  return (
    <View style={styles.dayContainer}>
      <Animated.View
        style={[
          styles.dayCircle,
          { backgroundColor: getBackgroundColor() },
          animatedStyle,
        ]}
      >
        {completed ? (
          <Feather name="check" size={16} color="#FFFFFF" />
        ) : null}
      </Animated.View>
      <ThemedText
        style={[
          styles.dayLabel,
          { color: isToday ? theme.primary : theme.textSecondary },
        ]}
      >
        {day}
      </ThemedText>
    </View>
  );
}

export function StreakCalendar({ days }: StreakCalendarProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <ThemedText type="h4" style={styles.title}>
        Your Seven Day Streak
      </ThemedText>
      <View style={styles.daysRow}>
        {days.map((day, index) => (
          <DayIndicator key={index} {...day} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayContainer: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
});
