import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import Svg, { Circle, Line, G } from "react-native-svg";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MANDALA_SIZE = Math.min(SCREEN_WIDTH * 0.65, 280);

interface SpiralMandalaProps {
  onPress?: () => void;
}

interface MandalaParameters {
  arms: number;
  density: number;
  curvature: number;
  lineOpacity: number;
  nodeScale: number;
  colorPalette: string[];
}

function SpiralArm({
  armIndex,
  totalArms,
  parameters,
  maxRadius,
}: {
  armIndex: number;
  totalArms: number;
  parameters: MandalaParameters;
  maxRadius: number;
}) {
  const { density, curvature, lineOpacity, nodeScale, colorPalette } = parameters;
  
  const armOffset = (armIndex / totalArms) * Math.PI * 2;
  const colorIndex = armIndex % 2;
  const color = colorPalette[colorIndex];
  const spiralTurns = 0.25 + curvature * 0.35;
  const nodesPerSpiral = Math.floor(6 + density * 1.5);
  
  const startR = maxRadius * 0.1;
  const endR = maxRadius * 0.9;
  
  const nodes = useMemo(() => {
    const result = [];
    for (let i = 0; i < nodesPerSpiral; i++) {
      const progress = i / (nodesPerSpiral - 1);
      const radius = startR + (endR - startR) * progress;
      const angle = armOffset + progress * spiralTurns * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const nodeSize = (1.5 + progress * 1.5) * nodeScale;
      
      result.push({ x, y, size: nodeSize, progress });
    }
    return result;
  }, [armOffset, spiralTurns, nodesPerSpiral, startR, endR, nodeScale]);

  return (
    <G>
      {nodes.map((node, i) => (
        i > 0 ? (
          <Line
            key={`line-${i}`}
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
        <G key={`node-${i}`}>
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
  );
}

export function SpiralMandala({ onPress }: SpiralMandalaProps) {
  const { theme, isDark } = useTheme();
  
  const breathValue = useSharedValue(0);
  const rotationValue = useSharedValue(0);
  const pressScale = useSharedValue(1);

  const parameters: MandalaParameters = useMemo(() => ({
    arms: 6,
    density: 4,
    curvature: 0.5,
    lineOpacity: 0.15,
    nodeScale: 1.2,
    colorPalette: [
      theme.primary,
      theme.secondary,
    ],
  }), [theme.primary, theme.secondary]);

  useEffect(() => {
    breathValue.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    rotationValue.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const breath = interpolate(breathValue.value, [0, 1], [1, 1.03]);
    return {
      transform: [
        { scale: breath * pressScale.value },
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

  const cx = MANDALA_SIZE / 2;
  const cy = MANDALA_SIZE / 2;
  const maxRadius = MANDALA_SIZE * 0.40;
  const centerSize = 4 * parameters.nodeScale;

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
              {Array.from({ length: parameters.arms }).map((_, i) => (
                <SpiralArm
                  key={i}
                  armIndex={i}
                  totalArms={parameters.arms}
                  parameters={parameters}
                  maxRadius={maxRadius}
                />
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
