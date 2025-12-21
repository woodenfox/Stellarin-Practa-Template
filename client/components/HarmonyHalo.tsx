import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import Svg, { Circle, G } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DayData {
  day: string;
  meditated: boolean;
  journaled: boolean;
  isToday: boolean;
}

interface HarmonyHaloProps {
  days: DayData[];
  currentStreak: number;
  onPress?: () => void;
}

const RING_SIZE = 44;
const STROKE_WIDTH = 3;
const OUTER_STROKE_WIDTH = 2.5;
const INNER_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2 - 4;
const OUTER_RADIUS = (RING_SIZE - OUTER_STROKE_WIDTH) / 2;
const INNER_CIRCUMFERENCE = 2 * Math.PI * INNER_RADIUS;
const OUTER_CIRCUMFERENCE = 2 * Math.PI * OUTER_RADIUS;

function DayHalo({ day, meditated, journaled, isToday }: DayData) {
  const { theme } = useTheme();
  const meditationProgress = useSharedValue(0);
  const journalProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    meditationProgress.value = withTiming(meditated ? 1 : 0, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    journalProgress.value = withTiming(journaled ? 1 : 0, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    if (isToday && (!meditated || !journaled)) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }

    if (meditated && journaled) {
      glowOpacity.value = withSpring(0.6);
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [meditated, journaled, isToday]);

  const innerStrokeDashoffset = useMemo(() => {
    return INNER_CIRCUMFERENCE * (1 - (meditated ? 1 : 0));
  }, [meditated]);

  const outerStrokeDashoffset = useMemo(() => {
    return OUTER_CIRCUMFERENCE * (1 - (journaled ? 1 : 0));
  }, [journaled]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const bothComplete = meditated && journaled;
  const neitherComplete = !meditated && !journaled;

  return (
    <View style={styles.dayContainer}>
      <Animated.View style={[styles.haloWrapper, pulseStyle]}>
        {bothComplete ? (
          <Animated.View
            style={[
              styles.glow,
              {
                backgroundColor: theme.amber,
                shadowColor: theme.amber,
              },
              glowStyle,
            ]}
          />
        ) : null}
        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svg}>
          <G rotation="-90" origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={OUTER_RADIUS}
              stroke={neitherComplete && !isToday ? theme.border : `${theme.jade}30`}
              strokeWidth={OUTER_STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={OUTER_RADIUS}
              stroke={theme.jade}
              strokeWidth={OUTER_STROKE_WIDTH}
              fill="none"
              strokeDasharray={OUTER_CIRCUMFERENCE}
              strokeDashoffset={outerStrokeDashoffset}
              strokeLinecap="round"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={INNER_RADIUS}
              stroke={neitherComplete && !isToday ? theme.border : `${theme.amber}30`}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={INNER_RADIUS}
              stroke={theme.amber}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={INNER_CIRCUMFERENCE}
              strokeDashoffset={innerStrokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        {bothComplete ? (
          <View style={styles.checkContainer}>
            <Feather name="check" size={14} color={theme.amber} />
          </View>
        ) : null}
      </Animated.View>
      <ThemedText
        style={[
          styles.dayLabel,
          {
            color: isToday ? theme.primary : theme.textSecondary,
            fontWeight: isToday ? "700" : "500",
          },
        ]}
      >
        {day}
      </ThemedText>
    </View>
  );
}

export function HarmonyHalo({ days, currentStreak, onPress }: HarmonyHaloProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.header}>
        <View>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            Weekly Balance
          </ThemedText>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.amber }]} />
              <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
                Meditate
              </ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.jade }]} />
              <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
                Journal
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: theme.amberMuted }]}>
          <Feather name="zap" size={14} color={theme.amber} />
          <ThemedText style={[styles.streakText, { color: theme.amber }]}>
            {currentStreak}
          </ThemedText>
        </View>
      </View>

      <View style={styles.daysRow}>
        {days.map((day, index) => (
          <DayHalo key={index} {...day} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: 20,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  legendRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 15,
    fontWeight: "700",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayContainer: {
    alignItems: "center",
    gap: 6,
  },
  haloWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  glow: {
    position: "absolute",
    width: RING_SIZE - 8,
    height: RING_SIZE - 8,
    borderRadius: (RING_SIZE - 8) / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  checkContainer: {
    position: "absolute",
  },
  dayLabel: {
    fontSize: 11,
  },
});
