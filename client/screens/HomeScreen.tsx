import React, { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
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
import { SpiralMandala } from "@/components/SpiralMandala";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useMeditation } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { PRESET_FLOWS } from "@/practa";

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
  completed = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  colors: string[];
  onPress: () => void;
  delay?: number;
  completed?: boolean;
}) {
  const { theme } = useTheme();
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

  const primaryColor = colors[0];

  if (completed) {
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

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(600).springify()}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View 
          style={[
            styles.actionCard, 
            animatedStyle,
            { 
              backgroundColor: theme.backgroundSecondary,
              borderWidth: 2,
              borderColor: primaryColor,
            }
          ]}
        >
          <View style={styles.actionGradient}>
            <View style={[styles.actionIconWrap, { backgroundColor: `${primaryColor}20` }]}>
              <Feather name={icon} size={24} color={primaryColor} />
            </View>
            <View style={styles.actionTextWrap}>
              <ThemedText style={[styles.actionTitle, { color: primaryColor }]}>{title}</ThemedText>
              <ThemedText style={[styles.actionSubtitle, { color: theme.textSecondary }]}>{subtitle}</ThemedText>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const MINI_HALO_SIZE = 40;
const MINI_STROKE = 2;
const MINI_INNER_RADIUS = (MINI_HALO_SIZE - MINI_STROKE) / 2 - 8;
const MINI_MIDDLE_RADIUS = (MINI_HALO_SIZE - MINI_STROKE) / 2 - 4;
const MINI_OUTER_RADIUS = (MINI_HALO_SIZE - MINI_STROKE) / 2;
const MINI_INNER_CIRC = 2 * Math.PI * MINI_INNER_RADIUS;
const MINI_MIDDLE_CIRC = 2 * Math.PI * MINI_MIDDLE_RADIUS;
const MINI_OUTER_CIRC = 2 * Math.PI * MINI_OUTER_RADIUS;

function DayMiniHalo({ day, theme }: { day: any; theme: any }) {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (day.isToday && (!day.meditated || !day.journaled || !day.tended)) {
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
  }, [day.isToday, day.meditated, day.journaled, day.tended]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const allComplete = day.meditated && day.journaled && day.tended;
  const noneComplete = !day.meditated && !day.journaled && !day.tended;

  return (
    <View style={styles.dayDotColumn}>
      <Animated.View style={[styles.miniHaloWrap, pulseStyle]}>
        <Svg width={MINI_HALO_SIZE} height={MINI_HALO_SIZE}>
          <G rotation="-90" origin={`${MINI_HALO_SIZE / 2}, ${MINI_HALO_SIZE / 2}`}>
            {/* Outer ring - Tend (blue) */}
            <Circle
              cx={MINI_HALO_SIZE / 2}
              cy={MINI_HALO_SIZE / 2}
              r={MINI_OUTER_RADIUS}
              stroke={noneComplete && !day.isToday ? theme.border : `${theme.secondary}30`}
              strokeWidth={MINI_STROKE}
              fill="none"
            />
            <Circle
              cx={MINI_HALO_SIZE / 2}
              cy={MINI_HALO_SIZE / 2}
              r={MINI_OUTER_RADIUS}
              stroke={theme.secondary}
              strokeWidth={MINI_STROKE}
              fill="none"
              strokeDasharray={MINI_OUTER_CIRC}
              strokeDashoffset={day.tended ? 0 : MINI_OUTER_CIRC}
              strokeLinecap="round"
            />
            {/* Middle ring - Journal (green) */}
            <Circle
              cx={MINI_HALO_SIZE / 2}
              cy={MINI_HALO_SIZE / 2}
              r={MINI_MIDDLE_RADIUS}
              stroke={noneComplete && !day.isToday ? theme.border : `${theme.jade}30`}
              strokeWidth={MINI_STROKE}
              fill="none"
            />
            <Circle
              cx={MINI_HALO_SIZE / 2}
              cy={MINI_HALO_SIZE / 2}
              r={MINI_MIDDLE_RADIUS}
              stroke={theme.jade}
              strokeWidth={MINI_STROKE}
              fill="none"
              strokeDasharray={MINI_MIDDLE_CIRC}
              strokeDashoffset={day.journaled ? 0 : MINI_MIDDLE_CIRC}
              strokeLinecap="round"
            />
            {/* Inner ring - Meditate (amber) */}
            <Circle
              cx={MINI_HALO_SIZE / 2}
              cy={MINI_HALO_SIZE / 2}
              r={MINI_INNER_RADIUS}
              stroke={noneComplete && !day.isToday ? theme.border : `${theme.amber}30`}
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
        {allComplete ? (
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
  const tendDays = days.filter(d => d.tended).length;
  const meditationProgress = meditationDays / 7;
  const journalProgress = journalDays / 7;
  const tendProgress = tendDays / 7;

  return (
    <Animated.View 
      entering={FadeInDown.delay(400).duration(600).springify()}
      style={[styles.momentumCard, { borderColor: theme.border }]}
    >
      <BlurView
        intensity={80}
        tint="light"
        style={styles.momentumBlur}
      >
        <View style={styles.momentumContent}>
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

          <View style={styles.dayDots}>
            {days.map((day, i) => (
              <DayMiniHalo key={i} day={day} theme={theme} />
            ))}
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { sessions, journalEntries, tendCompletions, getWeeklyCompletionPoints, getTodayStreak, hasJournaledToday, hasTendedToday, hasCompletedFlowToday } = useMeditation();
  const weeklyPoints = getWeeklyCompletionPoints();
  
  const [isGrowing, setIsGrowing] = useState(false);
  const [previousPoints, setPreviousPoints] = useState(weeklyPoints);
  const isCheckingGrowth = useRef(false);
  const hasCheckedNotifications = useRef(false);

  useEffect(() => {
    const checkNotificationPrompt = async () => {
      if (hasCheckedNotifications.current) return;
      hasCheckedNotifications.current = true;

      try {
        const prompted = await AsyncStorage.getItem("@stellarin_notifications_prompted");
        if (prompted === "true") return;

        const { status } = await Notifications.getPermissionsAsync();
        if (status === "undetermined") {
          setTimeout(() => {
            navigation.navigate("NotificationsPrompt");
          }, 1500);
        }
      } catch (error) {
        console.error("Error checking notification prompt:", error);
      }
    };

    checkNotificationPrompt();
  }, [navigation]);
  
  useFocusEffect(
    useCallback(() => {
      const checkForGrowth = async () => {
        if (isCheckingGrowth.current || isGrowing) return;
        isCheckingGrowth.current = true;
        
        try {
          const storedPoints = await AsyncStorage.getItem("@stellarin_last_weekly_points");
          const lastPoints = storedPoints ? parseInt(storedPoints, 10) : 0;
          
          if (weeklyPoints > lastPoints) {
            setPreviousPoints(lastPoints);
            setIsGrowing(true);
          }
        } catch (error) {
          console.error("Error checking growth:", error);
        } finally {
          isCheckingGrowth.current = false;
        }
      };
      
      checkForGrowth();
    }, [weeklyPoints, isGrowing])
  );
  
  const handleGrowthComplete = async () => {
    setIsGrowing(false);
    setPreviousPoints(weeklyPoints);
    try {
      await AsyncStorage.setItem("@stellarin_last_weekly_points", weeklyPoints.toString());
    } catch (error) {
      console.error("Error saving points:", error);
    }
  };

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
      const hasTend = tendCompletions.some((c) => c.date === dateStr);

      days.push({
        day: dayNames[date.getDay()],
        meditated: hasMeditation,
        journaled: hasJournal,
        tended: hasTend,
        isToday: i === 0,
      });
    }

    return days;
  }, [sessions, journalEntries, tendCompletions]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const hasActivity =
        sessions.some((s) => s.date === dateStr) ||
        journalEntries.some((e) => e.date === dateStr) ||
        tendCompletions.some((c) => c.date === dateStr);

      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }, [sessions, journalEntries, tendCompletions]);

  const handleStartMeditation = () => {
    navigation.navigate("Flow", { flow: PRESET_FLOWS.meditate });
  };

  const handleStartJournal = () => {
    navigation.navigate("Flow", { flow: PRESET_FLOWS.journal });
  };

  const handleOrbPress = () => {
    navigation.navigate("Flow", { flow: PRESET_FLOWS.meditate });
  };

  const handleStartTend = () => {
    navigation.navigate("Flow", { flow: PRESET_FLOWS.tend });
  };

  const handleStartFlow = () => {
    navigation.navigate("Flow", { flow: PRESET_FLOWS.morningReflection });
  };

  const handleStartEveningFlow = () => {
    navigation.navigate("Flow", { flow: PRESET_FLOWS.eveningWinddown });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <WeeklyMomentum days={sevenDayData} streak={currentStreak} />

        <SpiralMandala 
          onPress={handleOrbPress} 
          weeklyPoints={weeklyPoints}
          isGrowing={isGrowing}
          previousPoints={previousPoints}
          onGrowthComplete={handleGrowthComplete}
        />

        <View style={styles.actionsRow}>
          <ActionCard
            icon="play-circle"
            title="Meditate"
            subtitle="Start session"
            colors={[theme.amber, theme.primary]}
            onPress={handleStartMeditation}
            delay={200}
            completed={getTodayStreak()}
          />
          <ActionCard
            icon="mic"
            title="Journal"
            subtitle="Reflect today"
            colors={[theme.jade, "#4A9B7F"]}
            onPress={handleStartJournal}
            delay={300}
            completed={hasJournaledToday()}
          />
          <ActionCard
            icon="sun"
            title="Tend"
            subtitle="Wellness card"
            colors={[theme.secondary, "#006699"]}
            onPress={handleStartTend}
            delay={400}
            completed={hasTendedToday()}
          />
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(600).springify()}>
          <Pressable 
            onPress={handleStartFlow}
            style={[styles.flowCard, { backgroundColor: theme.backgroundSecondary, borderColor: hasCompletedFlowToday("morning-reflection") ? theme.success : theme.primary }]}
          >
            <View style={[styles.flowIconWrap, { backgroundColor: hasCompletedFlowToday("morning-reflection") ? `${theme.success}20` : `${theme.primary}20` }]}>
              {hasCompletedFlowToday("morning-reflection") ? (
                <Feather name="check" size={24} color={theme.success} />
              ) : (
                <Feather name="sunrise" size={24} color={theme.primary} />
              )}
            </View>
            <View style={styles.flowTextWrap}>
              <ThemedText style={[styles.flowTitle, { color: theme.text }]}>
                Morning Reflection
              </ThemedText>
              <ThemedText style={[styles.flowSubtitle, { color: theme.textSecondary }]}>
                {hasCompletedFlowToday("morning-reflection") ? "Completed today" : "Tend + Journal + Personalized Meditation"}
              </ThemedText>
            </View>
            {hasCompletedFlowToday("morning-reflection") ? (
              <View style={[styles.completedBadge, { backgroundColor: theme.success }]}>
                <Feather name="check" size={14} color="#FFFFFF" />
              </View>
            ) : (
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            )}
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(600).springify()}>
          <Pressable 
            onPress={handleStartEveningFlow}
            style={[styles.flowCard, { backgroundColor: theme.backgroundSecondary, borderColor: hasCompletedFlowToday("evening-winddown") ? theme.success : theme.jade }]}
          >
            <View style={[styles.flowIconWrap, { backgroundColor: hasCompletedFlowToday("evening-winddown") ? `${theme.success}20` : `${theme.jade}20` }]}>
              {hasCompletedFlowToday("evening-winddown") ? (
                <Feather name="check" size={24} color={theme.success} />
              ) : (
                <Feather name="moon" size={24} color={theme.jade} />
              )}
            </View>
            <View style={styles.flowTextWrap}>
              <ThemedText style={[styles.flowTitle, { color: theme.text }]}>
                End of Day Winddown
              </ThemedText>
              <ThemedText style={[styles.flowSubtitle, { color: theme.textSecondary }]}>
                {hasCompletedFlowToday("evening-winddown") ? "Completed today" : "Journal + Tend + Silent Meditation"}
              </ThemedText>
            </View>
            {hasCompletedFlowToday("evening-winddown") ? (
              <View style={[styles.completedBadge, { backgroundColor: theme.success }]}>
                <Feather name="check" size={14} color="#FFFFFF" />
              </View>
            ) : (
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            )}
          </Pressable>
        </Animated.View>
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
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  momentumBlur: {
    padding: Spacing.lg,
  },
  momentumHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  momentumRingsRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
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
    gap: Spacing.sm,
  },
  ringStack: {
    width: 80,
    height: 80,
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
  ringInnermost: {
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
  flowCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  flowIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  flowTextWrap: {
    flex: 1,
    gap: 2,
  },
  flowTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  flowSubtitle: {
    fontSize: 13,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
