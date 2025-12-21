import React, { useMemo, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Svg, { Circle, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInUp,
  FadeInDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { BreathingOrb } from "@/components/BreathingOrb";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useMeditation } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function ActionCard({
  icon,
  title,
  subtitle,
  colors,
  onPress,
  delay = 0,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  colors: string[];
  onPress: () => void;
  delay?: number;
}) {
  const pressScale = useSharedValue(1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pressScale.value },
      { translateY: floatY.value },
    ],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 10 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(600).springify()}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View style={[styles.actionCard, animatedStyle]}>
          <LinearGradient
            colors={colors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <View style={styles.actionIconWrap}>
              <Feather name={icon} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionTextWrap}>
              <ThemedText style={styles.actionTitle}>{title}</ThemedText>
              <ThemedText style={styles.actionSubtitle}>{subtitle}</ThemedText>
            </View>
            <View style={styles.actionShine} />
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const MINI_HALO_SIZE = 36;
const MINI_STROKE = 2.5;
const MINI_INNER_RADIUS = (MINI_HALO_SIZE - MINI_STROKE) / 2 - 4;
const MINI_OUTER_RADIUS = (MINI_HALO_SIZE - MINI_STROKE) / 2;
const MINI_INNER_CIRC = 2 * Math.PI * MINI_INNER_RADIUS;
const MINI_OUTER_CIRC = 2 * Math.PI * MINI_OUTER_RADIUS;

function DayMiniHalo({ day, theme }: { day: any; theme: any }) {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (day.isToday && (!day.meditated || !day.journaled)) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [day.isToday, day.meditated, day.journaled]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const bothComplete = day.meditated && day.journaled;
  const neitherComplete = !day.meditated && !day.journaled;

  return (
    <View style={styles.dayDotColumn}>
      <Animated.View style={[styles.miniHaloWrap, pulseStyle]}>
        <Svg width={MINI_HALO_SIZE} height={MINI_HALO_SIZE}>
          <G rotation="-90" origin={`${MINI_HALO_SIZE / 2}, ${MINI_HALO_SIZE / 2}`}>
            <Circle
              cx={MINI_HALO_SIZE / 2}
              cy={MINI_HALO_SIZE / 2}
              r={MINI_OUTER_RADIUS}
              stroke={neitherComplete && !day.isToday ? theme.border : `${theme.jade}30`}
              strokeWidth={MINI_STROKE}
              fill="none"
            />
            <Circle
              cx={MINI_HALO_SIZE / 2}
              cy={MINI_HALO_SIZE / 2}
              r={MINI_OUTER_RADIUS}
              stroke={theme.jade}
              strokeWidth={MINI_STROKE}
              fill="none"
              strokeDasharray={MINI_OUTER_CIRC}
              strokeDashoffset={day.journaled ? 0 : MINI_OUTER_CIRC}
              strokeLinecap="round"
            />
            <Circle
              cx={MINI_HALO_SIZE / 2}
              cy={MINI_HALO_SIZE / 2}
              r={MINI_INNER_RADIUS}
              stroke={neitherComplete && !day.isToday ? theme.border : `${theme.amber}30`}
              strokeWidth={MINI_STROKE}
              fill="none"
            />
            <Circle
              cx={MINI_HALO_SIZE / 2}
              cy={MINI_HALO_SIZE / 2}
              r={MINI_INNER_RADIUS}
              stroke={theme.amber}
              strokeWidth={MINI_STROKE}
              fill="none"
              strokeDasharray={MINI_INNER_CIRC}
              strokeDashoffset={day.meditated ? 0 : MINI_INNER_CIRC}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        {bothComplete ? (
          <View style={styles.miniCheck}>
            <Feather name="check" size={10} color={theme.amber} />
          </View>
        ) : null}
      </Animated.View>
      <ThemedText
        style={[
          styles.dayLabel,
          {
            color: day.isToday ? theme.primary : theme.textSecondary,
            fontWeight: day.isToday ? "700" : "400",
          },
        ]}
      >
        {day.day.charAt(0)}
      </ThemedText>
    </View>
  );
}

function StreakRing({ 
  progress, 
  color, 
  size, 
  strokeWidth 
}: { 
  progress: number; 
  color: string; 
  size: number; 
  strokeWidth: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`${color}25`}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
    </View>
  );
}

function WeeklyMomentum({ days, streak }: { days: any[]; streak: number }) {
  const { theme } = useTheme();
  
  const meditationDays = days.filter(d => d.meditated).length;
  const journalDays = days.filter(d => d.journaled).length;
  const meditationProgress = meditationDays / 7;
  const journalProgress = journalDays / 7;

  return (
    <Animated.View 
      entering={FadeInDown.delay(400).duration(600).springify()}
      style={[styles.momentumCard, { backgroundColor: "#FFFFFF", borderColor: theme.border }]}
    >
      <View style={styles.momentumHeader}>
        <ThemedText style={[styles.momentumTitle, { color: theme.text }]}>
          Weekly Momentum
        </ThemedText>
        <View style={[styles.streakPill, { backgroundColor: theme.amberMuted }]}>
          <Feather name="zap" size={12} color={theme.amber} />
          <ThemedText style={[styles.streakValue, { color: theme.amber }]}>
            {streak}
          </ThemedText>
        </View>
      </View>

      <View style={styles.momentumContent}>
        <View style={styles.ringStack}>
          <StreakRing progress={journalProgress} color={theme.jade} size={72} strokeWidth={6} />
          <View style={styles.ringInner}>
            <StreakRing progress={meditationProgress} color={theme.amber} size={52} strokeWidth={5} />
          </View>
        </View>

        <View style={styles.momentumStats}>
          <View style={styles.statRow}>
            <View style={[styles.statDot, { backgroundColor: theme.amber }]} />
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Meditate
            </ThemedText>
            <ThemedText style={[styles.statValue, { color: theme.text }]}>
              {meditationDays}/7
            </ThemedText>
          </View>
          <View style={styles.statRow}>
            <View style={[styles.statDot, { backgroundColor: theme.jade }]} />
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Journal
            </ThemedText>
            <ThemedText style={[styles.statValue, { color: theme.text }]}>
              {journalDays}/7
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.dayDots}>
        {days.map((day, i) => (
          <DayMiniHalo key={i} day={day} theme={theme} />
        ))}
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { sessions, totalRice, journalEntries } = useMeditation();

  const sevenDayData = useMemo(() => {
    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const hasMeditation = sessions.some((s) => s.date === dateStr);
      const hasJournal = journalEntries.some((e) => e.date === dateStr);

      days.push({
        day: dayNames[date.getDay()],
        meditated: hasMeditation,
        journaled: hasJournal,
        isToday: i === 0,
      });
    }

    return days;
  }, [sessions, journalEntries]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const hasActivity =
        sessions.some((s) => s.date === dateStr) ||
        journalEntries.some((e) => e.date === dateStr);

      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }, [sessions, journalEntries]);

  const todaysMeditation = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return sessions.filter((s) => s.date === today);
  }, [sessions]);

  const todaysMinutes = useMemo(() => {
    return Math.floor(
      todaysMeditation.reduce((acc, s) => acc + s.duration, 0) / 60
    );
  }, [todaysMeditation]);

  const handleStartMeditation = () => {
    navigation.navigate("QuickMeditation");
  };

  const handleStartJournal = () => {
    navigation.navigate("Recording");
  };

  const handleOrbPress = () => {
    navigation.navigate("QuickMeditation");
  };

  const handleStartTend = () => {
    navigation.navigate("TendCard");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <WeeklyMomentum days={sevenDayData} streak={currentStreak} />

        <BreathingOrb
          totalRice={totalRice}
          todaysMinutes={todaysMinutes}
          onPress={handleOrbPress}
        />

        <View style={styles.actionsRow}>
          <ActionCard
            icon="play-circle"
            title="Meditate"
            subtitle="Start session"
            colors={[theme.amber, theme.primary]}
            onPress={handleStartMeditation}
            delay={200}
          />
          <ActionCard
            icon="mic"
            title="Journal"
            subtitle="Reflect today"
            colors={[theme.jade, "#4A9B7F"]}
            onPress={handleStartJournal}
            delay={300}
          />
          <ActionCard
            icon="sun"
            title="Tend"
            subtitle="Wellness card"
            colors={[theme.secondary, "#006699"]}
            onPress={handleStartTend}
            delay={400}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    justifyContent: "center",
  },
  actionCard: {
    flex: 1,
    height: 100,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  actionGradient: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "space-between",
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextWrap: {
    gap: 2,
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  actionSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  actionShine: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  momentumCard: {
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  momentumHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  momentumTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  streakValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  momentumContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  ringStack: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  ringContainer: {
    position: "absolute",
  },
  ringBackground: {
    position: "absolute",
  },
  ringForeground: {
    position: "absolute",
  },
  ringInner: {
    position: "absolute",
  },
  momentumStats: {
    flex: 1,
    gap: Spacing.sm,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  dayDots: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  dayDotColumn: {
    alignItems: "center",
    gap: 4,
  },
  miniHaloWrap: {
    width: MINI_HALO_SIZE,
    height: MINI_HALO_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCheck: {
    position: "absolute",
  },
  dayLabel: {
    fontSize: 11,
  },
});
