import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import Svg, { Circle, Line, G } from "react-native-svg";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MANDALA_SIZE = Math.min(SCREEN_WIDTH * 0.9, 380);

interface SpiralMandalaProps {
  onPress?: () => void;
  weeklyPoints?: number;
  isGrowing?: boolean;
  previousPoints?: number;
  onGrowthComplete?: () => void;
}

interface MandalaParameters {
  arms: number;
  density: number;
  curvature: number;
  lineOpacity: number;
  nodeScale: number;
  colorPalette: string[];
}

function computeNodes(
  armIndex: number,
  totalArms: number,
  density: number,
  curvature: number,
  nodeScale: number,
  maxRadius: number
) {
  const armOffset = (armIndex / totalArms) * Math.PI * 2;
  const spiralTurns = 0.25 + curvature * 0.35;
  const nodesPerSpiral = Math.floor(6 + density * 1.5);
  const startR = maxRadius * 0.1;
  const endR = maxRadius * 0.9;

  const nodes = [];
  for (let i = 0; i < nodesPerSpiral; i++) {
    const progress = i / (nodesPerSpiral - 1);
    const radius = startR + (endR - startR) * progress;
    const angle = armOffset + progress * spiralTurns * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const size = (1.5 + progress * 1.5) * nodeScale;
    nodes.push({ x, y, size });
  }
  return nodes;
}

function EnergyRing({ 
  delay, 
  maxRadius, 
  color,
  isActive 
}: { 
  delay: number; 
  maxRadius: number; 
  color: string;
  isActive: boolean;
}) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      progress.value = 0;
      opacity.value = 0;
      
      progress.value = withDelay(
        delay,
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) })
      );
      
      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(0.4, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0.4, { duration: 1200 }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) })
        )
      );
    }
  }, [isActive]);

  const animatedProps = useAnimatedProps(() => {
    const outerStart = maxRadius * 1.4;
    const outerEnd = maxRadius * 0.3;
    const r = outerStart - (outerStart - outerEnd) * progress.value;
    
    return {
      r,
      opacity: opacity.value,
    };
  });

  return (
    <AnimatedCircle
      cx={0}
      cy={0}
      stroke={color}
      strokeWidth={2}
      fill="none"
      animatedProps={animatedProps}
    />
  );
}

export function SpiralMandala({ 
  onPress, 
  weeklyPoints = 0,
  isGrowing = false,
  previousPoints = 0,
  onGrowthComplete,
}: SpiralMandalaProps) {
  const { theme, isDark } = useTheme();
  
  const breathValue = useSharedValue(0);
  const rotationValue = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const maxRadius = MANDALA_SIZE * 0.40;
  const cx = MANDALA_SIZE / 2;
  const cy = MANDALA_SIZE / 2;

  const [displayedArms, setDisplayedArms] = useState(Math.min(3 + weeklyPoints, 24));
  const [showRings, setShowRings] = useState(false);

  const targetArmCount = Math.min(3 + weeklyPoints, 24);
  const previousArmCount = Math.min(3 + previousPoints, 24);

  const updateArms = useCallback((newCount: number) => {
    setDisplayedArms(newCount);
  }, []);

  const handleGrowthComplete = useCallback(() => {
    setDisplayedArms(targetArmCount);
    setShowRings(false);
    onGrowthComplete?.();
  }, [targetArmCount, onGrowthComplete]);

  useEffect(() => {
    if (isGrowing && targetArmCount > previousArmCount) {
      setDisplayedArms(previousArmCount);
      setShowRings(true);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      pulseScale.value = withSequence(
        withTiming(1.08, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
      );
      
      const armDiff = targetArmCount - previousArmCount;
      const stepDuration = 3000 / armDiff;
      
      let currentArm = previousArmCount;
      const interval = setInterval(() => {
        currentArm++;
        if (currentArm <= targetArmCount) {
          updateArms(currentArm);
        }
        if (currentArm >= targetArmCount) {
          clearInterval(interval);
          setTimeout(() => {
            handleGrowthComplete();
          }, 500);
        }
      }, stepDuration);
      
      return () => clearInterval(interval);
    } else if (!isGrowing) {
      setDisplayedArms(targetArmCount);
    }
  }, [isGrowing, targetArmCount, previousArmCount]);
  
  const parameters: MandalaParameters = useMemo(() => ({
    arms: displayedArms,
    density: 4,
    curvature: 0.5,
    lineOpacity: 0.15,
    nodeScale: 1.2,
    colorPalette: [
      theme.primary,
      theme.secondary,
    ],
  }), [theme.primary, theme.secondary, displayedArms]);

  const allArms = useMemo(() => {
    const arms = [];
    for (let armIndex = 0; armIndex < parameters.arms; armIndex++) {
      const colorIndex = armIndex % 2;
      const color = parameters.colorPalette[colorIndex];
      const nodes = computeNodes(
        armIndex,
        parameters.arms,
        parameters.density,
        parameters.curvature,
        parameters.nodeScale,
        maxRadius
      );
      arms.push({ armIndex, color, nodes });
    }
    return arms;
  }, [parameters, maxRadius]);

  const centerSize = 4 * parameters.nodeScale;

  useEffect(() => {
    breathValue.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    rotationValue.value = withTiming(360000, { 
      duration: 60000 * 1000, 
      easing: Easing.linear 
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const breath = interpolate(breathValue.value, [0, 1], [1, 1.03]);
    return {
      transform: [
        { scale: breath * pressScale.value * pulseScale.value },
        { rotate: `${rotationValue.value}deg` },
      ],
    };
  });

  const handlePressIn = () => {
    pressScale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: 200 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View style={[styles.mandalaWrap, animatedStyle]}>
          <Svg width={MANDALA_SIZE} height={MANDALA_SIZE}>
            <G x={cx} y={cy}>
              {showRings ? (
                <>
                  <EnergyRing 
                    delay={0} 
                    maxRadius={maxRadius} 
                    color={theme.secondary}
                    isActive={showRings}
                  />
                  <EnergyRing 
                    delay={300} 
                    maxRadius={maxRadius} 
                    color={theme.primary}
                    isActive={showRings}
                  />
                  <EnergyRing 
                    delay={600} 
                    maxRadius={maxRadius} 
                    color={theme.secondary}
                    isActive={showRings}
                  />
                </>
              ) : null}
              
              {allArms.map(({ armIndex, color, nodes }) => (
                <G key={armIndex}>
                  {nodes.map((node, i) => (
                    i > 0 ? (
                      <Line
                        key={`line-${armIndex}-${i}`}
                        x1={nodes[i - 1].x}
                        y1={nodes[i - 1].y}
                        x2={node.x}
                        y2={node.y}
                        stroke={color}
                        strokeWidth={0.75}
                        strokeOpacity={parameters.lineOpacity}
                        strokeLinecap="round"
                      />
                    ) : null
                  ))}
                  {nodes.map((node, i) => (
                    <G key={`node-${armIndex}-${i}`}>
                      <Circle
                        cx={node.x}
                        cy={node.y}
                        r={node.size}
                        fill={color}
                      />
                      <Circle
                        cx={node.x - node.size * 0.2}
                        cy={node.y - node.size * 0.2}
                        r={node.size * 0.25}
                        fill="rgba(255,255,255,0.5)"
                      />
                    </G>
                  ))}
                </G>
              ))}
              
              <Circle
                cx={0}
                cy={0}
                r={centerSize}
                fill={parameters.colorPalette[0]}
              />
              <Circle
                cx={-centerSize * 0.25}
                cy={-centerSize * 0.25}
                r={centerSize * 0.3}
                fill={isDark ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.7)"}
              />
            </G>
          </Svg>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  mandalaWrap: {
    width: MANDALA_SIZE,
    height: MANDALA_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
