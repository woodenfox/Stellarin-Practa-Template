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
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Line, G } from "react-native-svg";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

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

interface NodeData {
  x: number;
  y: number;
  size: number;
}

function computeNodes(
  armIndex: number,
  totalArms: number,
  density: number,
  curvature: number,
  nodeScale: number,
  maxRadius: number
): NodeData[] {
  const armOffset = (armIndex / totalArms) * Math.PI * 2;
  const spiralTurns = 0.25 + curvature * 0.35;
  const nodesPerSpiral = Math.floor(6 + density * 1.5);
  const startR = maxRadius * 0.1;
  const endR = maxRadius * 0.9;

  const nodes: NodeData[] = [];
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
  phaseOffset, 
  maxRadius, 
  color,
  isActive,
  glowIntensity,
}: { 
  phaseOffset: number; 
  maxRadius: number; 
  color: string;
  isActive: boolean;
  glowIntensity: number;
}) {
  const time = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      time.value = 0;
      time.value = withRepeat(
        withTiming(1, { duration: 2500, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      time.value = 0;
    }
  }, [isActive]);

  const animatedProps = useAnimatedProps(() => {
    const ringPhase = (phaseOffset + time.value) % 1;
    const ringProgress = 1 - ringPhase;
    
    const outerStart = maxRadius * 1.3;
    const outerEnd = maxRadius * 0.95;
    const r = outerEnd + (outerStart - outerEnd) * ringProgress;
    
    const ringAlpha = Math.sin(ringPhase * Math.PI) * glowIntensity * 0.35;
    
    return {
      r,
      opacity: ringAlpha,
    };
  });

  if (!isActive) return null;

  return (
    <AnimatedCircle
      cx={0}
      cy={0}
      stroke={color}
      strokeWidth={1.5}
      fill="none"
      animatedProps={animatedProps}
    />
  );
}

function GrowingNode({
  node,
  nodeIndex,
  color,
  growthProgress,
  totalNodes,
}: {
  node: NodeData;
  nodeIndex: number;
  color: string;
  growthProgress: SharedValue<number>;
  totalNodes: number;
}) {
  const nodeThreshold = nodeIndex / totalNodes;
  const nodeEndThreshold = (nodeIndex + 1) / totalNodes;

  const animatedProps = useAnimatedProps(() => {
    const progress = growthProgress.value;
    
    if (progress < nodeThreshold) {
      return {
        cx: 0,
        cy: 0,
        r: 0,
        opacity: 0,
      };
    }
    
    const nodeProgress = Math.min(
      (progress - nodeThreshold) / (nodeEndThreshold - nodeThreshold),
      1
    );
    
    const eased = nodeProgress < 0.5 
      ? 2 * nodeProgress * nodeProgress 
      : 1 - Math.pow(-2 * nodeProgress + 2, 2) / 2;
    
    return {
      cx: node.x * eased,
      cy: node.y * eased,
      r: node.size * eased,
      opacity: eased,
    };
  });

  const highlightProps = useAnimatedProps(() => {
    const progress = growthProgress.value;
    
    if (progress < nodeThreshold) {
      return {
        cx: 0,
        cy: 0,
        r: 0,
        opacity: 0,
      };
    }
    
    const nodeProgress = Math.min(
      (progress - nodeThreshold) / (nodeEndThreshold - nodeThreshold),
      1
    );
    
    const eased = nodeProgress < 0.5 
      ? 2 * nodeProgress * nodeProgress 
      : 1 - Math.pow(-2 * nodeProgress + 2, 2) / 2;
    
    const cx = node.x * eased;
    const cy = node.y * eased;
    const size = node.size * eased;
    
    return {
      cx: cx - size * 0.2,
      cy: cy - size * 0.2,
      r: size * 0.25,
      opacity: eased * 0.5,
    };
  });

  return (
    <>
      <AnimatedCircle
        fill={color}
        animatedProps={animatedProps}
      />
      <AnimatedCircle
        fill="rgba(255,255,255,0.5)"
        animatedProps={highlightProps}
      />
    </>
  );
}

function GrowingLine({
  prevNode,
  node,
  nodeIndex,
  color,
  lineOpacity,
  growthProgress,
  totalNodes,
}: {
  prevNode: NodeData;
  node: NodeData;
  nodeIndex: number;
  color: string;
  lineOpacity: number;
  growthProgress: SharedValue<number>;
  totalNodes: number;
}) {
  const prevThreshold = (nodeIndex - 1) / totalNodes;
  const nodeThreshold = nodeIndex / totalNodes;

  const animatedProps = useAnimatedProps(() => {
    const progress = growthProgress.value;
    
    if (progress < prevThreshold) {
      return {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        strokeOpacity: 0,
      };
    }
    
    const lineProgress = Math.min(
      (progress - prevThreshold) / (nodeThreshold - prevThreshold),
      1
    );
    
    const eased = lineProgress < 0.5 
      ? 2 * lineProgress * lineProgress 
      : 1 - Math.pow(-2 * lineProgress + 2, 2) / 2;
    
    const prevEased = progress >= nodeThreshold ? 1 : eased;
    
    return {
      x1: prevNode.x * prevEased,
      y1: prevNode.y * prevEased,
      x2: prevNode.x + (node.x - prevNode.x) * eased,
      y2: prevNode.y + (node.y - prevNode.y) * eased,
      strokeOpacity: lineOpacity * eased,
    };
  });

  return (
    <AnimatedLine
      stroke={color}
      strokeWidth={0.75}
      strokeLinecap="round"
      animatedProps={animatedProps}
    />
  );
}

function GrowingArm({
  armIndex,
  totalArms,
  color,
  density,
  curvature,
  nodeScale,
  maxRadius,
  lineOpacity,
  growthProgress,
}: {
  armIndex: number;
  totalArms: number;
  color: string;
  density: number;
  curvature: number;
  nodeScale: number;
  maxRadius: number;
  lineOpacity: number;
  growthProgress: SharedValue<number>;
}) {
  const nodes = useMemo(() => 
    computeNodes(armIndex, totalArms, density, curvature, nodeScale, maxRadius),
    [armIndex, totalArms, density, curvature, nodeScale, maxRadius]
  );

  return (
    <G>
      {nodes.map((node, i) => (
        i > 0 ? (
          <GrowingLine
            key={`line-${i}`}
            prevNode={nodes[i - 1]}
            node={node}
            nodeIndex={i}
            color={color}
            lineOpacity={lineOpacity}
            growthProgress={growthProgress}
            totalNodes={nodes.length}
          />
        ) : null
      ))}
      {nodes.map((node, i) => (
        <GrowingNode
          key={`node-${i}`}
          node={node}
          nodeIndex={i}
          color={color}
          growthProgress={growthProgress}
          totalNodes={nodes.length}
        />
      ))}
    </G>
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
  const armGrowthProgress = useSharedValue(1);

  const maxRadius = MANDALA_SIZE * 0.40;
  const cx = MANDALA_SIZE / 2;
  const cy = MANDALA_SIZE / 2;

  const targetArmCount = Math.min(3 + weeklyPoints, 24);
  const previousArmCount = Math.min(3 + previousPoints, 24);

  const [baseArms, setBaseArms] = useState(targetArmCount);
  const [growingArmIndices, setGrowingArmIndices] = useState<number[]>([]);
  const [showRings, setShowRings] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0);

  const density = 4;
  const curvature = 0.5;
  const lineOpacity = 0.15;
  const nodeScale = 1.2;

  const handleAnimationComplete = useCallback(() => {
    setBaseArms(targetArmCount);
    setGrowingArmIndices([]);
    setShowRings(false);
    setGlowIntensity(0);
    onGrowthComplete?.();
  }, [targetArmCount, onGrowthComplete]);

  useEffect(() => {
    if (isGrowing && targetArmCount > previousArmCount) {
      setBaseArms(previousArmCount);
      const newArmIndices: number[] = [];
      for (let i = previousArmCount; i < targetArmCount; i++) {
        newArmIndices.push(i);
      }
      setGrowingArmIndices(newArmIndices);
      setShowRings(true);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      pulseScale.value = withSequence(
        withTiming(1.08, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
      );
      
      armGrowthProgress.value = 0;
      armGrowthProgress.value = withTiming(1, {
        duration: 2500,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished) {
          runOnJS(handleAnimationComplete)();
        }
      });
      
      const duration = 3000;
      const startTime = Date.now();
      
      const glowInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        
        let intensity = 0;
        if (rawProgress < 0.3) {
          intensity = rawProgress / 0.3;
        } else if (rawProgress < 0.7) {
          intensity = 1;
        } else {
          intensity = 1 - (rawProgress - 0.7) / 0.3;
        }
        setGlowIntensity(intensity);
        
        if (rawProgress >= 1) {
          clearInterval(glowInterval);
        }
      }, 50);
      
      return () => {
        clearInterval(glowInterval);
      };
    } else if (!isGrowing) {
      setBaseArms(targetArmCount);
      setGrowingArmIndices([]);
      setGlowIntensity(0);
      armGrowthProgress.value = 1;
    }
  }, [isGrowing, targetArmCount, previousArmCount]);

  const baseArmData = useMemo(() => {
    const arms = [];
    for (let armIndex = 0; armIndex < baseArms; armIndex++) {
      const colorIndex = armIndex % 2;
      const color = colorIndex === 0 ? theme.primary : theme.secondary;
      const nodes = computeNodes(
        armIndex,
        baseArms + growingArmIndices.length,
        density,
        curvature,
        nodeScale,
        maxRadius
      );
      arms.push({ armIndex, color, nodes });
    }
    return arms;
  }, [baseArms, growingArmIndices.length, theme.primary, theme.secondary, maxRadius]);

  const centerSize = 4 * nodeScale;

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
                    phaseOffset={0} 
                    maxRadius={maxRadius} 
                    color={theme.secondary}
                    isActive={showRings}
                    glowIntensity={glowIntensity}
                  />
                  <EnergyRing 
                    phaseOffset={0.33} 
                    maxRadius={maxRadius} 
                    color={theme.primary}
                    isActive={showRings}
                    glowIntensity={glowIntensity}
                  />
                  <EnergyRing 
                    phaseOffset={0.66} 
                    maxRadius={maxRadius} 
                    color={theme.secondary}
                    isActive={showRings}
                    glowIntensity={glowIntensity}
                  />
                </>
              ) : null}
              
              {baseArmData.map(({ armIndex, color, nodes }) => (
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
                        strokeOpacity={lineOpacity}
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
              
              {growingArmIndices.map((armIndex) => (
                <GrowingArm
                  key={`growing-${armIndex}`}
                  armIndex={armIndex}
                  totalArms={baseArms + growingArmIndices.length}
                  color={armIndex % 2 === 0 ? theme.primary : theme.secondary}
                  density={density}
                  curvature={curvature}
                  nodeScale={nodeScale}
                  maxRadius={maxRadius}
                  lineOpacity={lineOpacity}
                  growthProgress={armGrowthProgress}
                />
              ))}
              
              <Circle
                cx={0}
                cy={0}
                r={centerSize}
                fill={theme.primary}
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
