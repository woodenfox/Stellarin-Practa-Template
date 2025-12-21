import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  withDelay,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop, G } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ORB_SIZE = Math.min(SCREEN_WIDTH * 0.55, 220);
const RING_COUNT = 3;

interface BreathingOrbProps {
  totalRice: number;
  todaysMinutes: number;
  onPress?: () => void;
}

function FloatingRing({ 
  index, 
  primaryColor, 
  size 
}: { 
  index: number; 
  primaryColor: string; 
  size: number;
}) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const direction = index % 2 === 0 ? 1 : -1;
    const duration = 20000 + index * 5000;
    
    rotation.value = withRepeat(
      withTiming(direction * 360, { duration, easing: Easing.linear }),
      -1,
      false
    );

    pulse.value = withRepeat(
      withSequence(
        withDelay(
          index * 400,
          withTiming(1.08, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: pulse.value },
    ],
    opacity: interpolate(pulse.value, [1, 1.08], [0.3, 0.5]),
  }));

  const ringSize = size + (index + 1) * 28;

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderColor: primaryColor,
          borderWidth: 1,
        },
        animatedStyle,
      ]}
    />
  );
}

function Particle({ 
  index, 
  color, 
  orbSize 
}: { 
  index: number; 
  color: string; 
  orbSize: number;
}) {
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const angle = (index / 8) * Math.PI * 2;
    const radius = orbSize / 2 + 20 + Math.random() * 30;
    const duration = 4000 + Math.random() * 2000;
    const delay = index * 300;

    offsetX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(Math.cos(angle) * radius, { duration }),
          withTiming(Math.cos(angle + 0.5) * (radius + 15), { duration }),
          withTiming(Math.cos(angle) * radius, { duration })
        ),
        -1,
        true
      )
    );

    offsetY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(Math.sin(angle) * radius, { duration }),
          withTiming(Math.sin(angle + 0.5) * (radius + 15), { duration }),
          withTiming(Math.sin(angle) * radius, { duration })
        ),
        -1,
        true
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration / 2 }),
          withTiming(0.2, { duration: duration / 2 })
        ),
        -1,
        true
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: duration / 2 }),
          withTiming(0.6, { duration: duration / 2 })
        ),
        -1,
        true
      )
    );
  }, [index, orbSize]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

export function BreathingOrb({ totalRice, todaysMinutes, onPress }: BreathingOrbProps) {
  const { theme, isDark } = useTheme();
  
  const breathScale = useSharedValue(1);
  const innerGlow = useSharedValue(0.6);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    innerGlow.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breathScale.value * pressScale.value },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: innerGlow.value,
    transform: [{ scale: breathScale.value * 1.3 }],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 10 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const particles = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => (
      <Particle key={i} index={i} color={theme.primary} orbSize={ORB_SIZE} />
    )), 
    [theme.primary]
  );

  const rings = useMemo(() =>
    Array.from({ length: RING_COUNT }, (_, i) => (
      <FloatingRing key={i} index={i} primaryColor={theme.primary} size={ORB_SIZE} />
    )),
    [theme.primary]
  );

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={styles.container}
    >
      {rings}
      {particles}
      
      <Animated.View style={[styles.glowLayer, glowAnimatedStyle]}>
        <LinearGradient
          colors={[
            `${theme.primary}40`,
            `${theme.primary}10`,
            "transparent",
          ]}
          style={styles.glowGradient}
        />
      </Animated.View>

      <Animated.View style={[styles.orb, orbAnimatedStyle]}>
        <LinearGradient
          colors={
            isDark
              ? [`${theme.primary}E6`, `${theme.accent}CC`]
              : [theme.primary, theme.accent]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbGradient}
        >
          <View style={styles.orbContent}>
            <ThemedText style={styles.riceValue}>
              {totalRice.toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.riceLabel}>
              grains
            </ThemedText>
          </View>
          
          <View style={styles.orbHighlight} />
        </LinearGradient>
      </Animated.View>

      <View style={styles.todayBadge}>
        <LinearGradient
          colors={isDark ? ["#2E2E2E", "#242424"] : ["#FFFFFF", "#F8F8F8"]}
          style={[styles.todayGradient, { borderColor: theme.border }]}
        >
          <ThemedText style={[styles.todayText, { color: theme.text }]}>
            {todaysMinutes} min today
          </ThemedText>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: ORB_SIZE + 120,
    marginVertical: Spacing.lg,
  },
  ring: {
    position: "absolute",
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  glowLayer: {
    position: "absolute",
    width: ORB_SIZE * 1.6,
    height: ORB_SIZE * 1.6,
  },
  glowGradient: {
    flex: 1,
    borderRadius: ORB_SIZE * 0.8,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: "hidden",
    shadowColor: "#1E88C7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  orbGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  orbContent: {
    alignItems: "center",
  },
  riceValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  riceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  orbHighlight: {
    position: "absolute",
    top: 15,
    left: 25,
    width: ORB_SIZE * 0.35,
    height: ORB_SIZE * 0.2,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: ORB_SIZE * 0.2,
    transform: [{ rotate: "-30deg" }],
  },
  todayBadge: {
    position: "absolute",
    bottom: 0,
  },
  todayGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  todayText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
