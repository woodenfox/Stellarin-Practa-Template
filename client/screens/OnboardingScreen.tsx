import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useOnboarding } from "@/context/OnboardingContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { PRESET_FLOWS } from "@/practa";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OnboardingPage {
  icon: keyof typeof Feather.glyphMap;
  iconColors: string[];
  title: string;
  subtitle: string;
  description: string;
}

const PAGES: OnboardingPage[] = [
  {
    icon: "sun",
    iconColors: ["#FF9933", "#FFCC00"],
    title: "Welcome to Stellarin",
    subtitle: "Your daily wellness companion",
    description:
      "Build a mindfulness practice that grows with you. Complete simple daily actions to nurture your inner garden and contribute to real-world good.",
  },
  {
    icon: "play-circle",
    iconColors: ["#FC7D0F", "#FF9933"],
    title: "Meditate",
    subtitle: "Find your center",
    description:
      "Start with just a few minutes of silent meditation. As you breathe, you'll earn rice grains that represent your growing practice.",
  },
  {
    icon: "mic",
    iconColors: ["#008ACA", "#33A8E0"],
    title: "Journal",
    subtitle: "Reflect on your day",
    description:
      "Write or record your thoughts. Journaling helps you process emotions and creates a personal record of your wellness journey.",
  },
  {
    icon: "heart",
    iconColors: ["#4A9B7F", "#6BC9A3"],
    title: "Tend",
    subtitle: "Daily wellness wisdom",
    description:
      "Draw a daily wellness card for inspiration and guidance. Each card offers a simple prompt to carry with you throughout the day.",
  },
  {
    icon: "gift",
    iconColors: ["#FC7D0F", "#FF6B6B"],
    title: "Grow Your Impact",
    subtitle: "Rice for good",
    description:
      "Every meditation and journal entry earns virtual rice. As our community grows, this rice translates into real donations to feed those in need.",
  },
];

function FloatingIcon({ 
  icon, 
  colors 
}: { 
  icon: keyof typeof Feather.glyphMap; 
  colors: string[];
}) {
  const floatY = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient
        colors={colors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Feather name={icon} size={48} color="#FFFFFF" />
      </LinearGradient>
    </Animated.View>
  );
}

function PageIndicator({ 
  currentPage, 
  totalPages, 
  theme 
}: { 
  currentPage: number; 
  totalPages: number; 
  theme: any;
}) {
  return (
    <View style={styles.pageIndicator}>
      {Array.from({ length: totalPages }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentPage ? theme.primary : theme.border,
              width: index === currentPage ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { completeOnboarding } = useOnboarding();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const buttonScale = useSharedValue(1);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (page !== currentPage) {
      setCurrentPage(page);
      Haptics.selectionAsync();
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentPage < PAGES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (currentPage + 1) * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleGetStarted = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completeOnboarding();
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  const handleStartFirstFlow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completeOnboarding();
    navigation.reset({
      index: 1,
      routes: [
        { name: "Main" },
        { name: "Flow", params: { flow: PRESET_FLOWS.meditate } },
      ],
    });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 10 });
  };

  const isLastPage = currentPage === PAGES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {PAGES.map((page, index) => (
          <View key={index} style={[styles.page, { width: SCREEN_WIDTH }]}>
            <View style={[styles.pageContent, { paddingTop: insets.top + Spacing["4xl"] }]}>
              <Animated.View 
                entering={FadeInUp.delay(200).duration(600)}
                style={styles.iconWrapper}
              >
                <FloatingIcon icon={page.icon} colors={page.iconColors} />
              </Animated.View>

              <Animated.View 
                entering={FadeInUp.delay(400).duration(600)}
                style={styles.textContainer}
              >
                <ThemedText type="h2" style={[styles.title, { color: theme.text }]}>
                  {page.title}
                </ThemedText>
                <ThemedText style={[styles.subtitle, { color: theme.primary }]}>
                  {page.subtitle}
                </ThemedText>
                <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
                  {page.description}
                </ThemedText>
              </Animated.View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <PageIndicator currentPage={currentPage} totalPages={PAGES.length} theme={theme} />

        {isLastPage ? (
          <View style={styles.buttonGroup}>
            <Animated.View style={buttonAnimatedStyle}>
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleStartFirstFlow}
                style={styles.primaryButtonWrap}
              >
                <LinearGradient
                  colors={[theme.primary, theme.amber]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButton}
                >
                  <ThemedText style={styles.primaryButtonText}>
                    Start First Meditation
                  </ThemedText>
                  <Feather name="arrow-right" size={20} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Pressable onPress={handleGetStarted} style={styles.secondaryButton}>
              <ThemedText style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
                Skip for now
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <Animated.View style={buttonAnimatedStyle}>
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleNext}
                style={[styles.nextButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={styles.primaryButtonText}>Next</ThemedText>
                <Feather name="chevron-right" size={20} color="#FFFFFF" />
              </Pressable>
            </Animated.View>

            <Pressable onPress={handleGetStarted} style={styles.secondaryButton}>
              <ThemedText style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
                Skip intro
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  iconWrapper: {
    marginBottom: Spacing["4xl"],
    marginTop: Spacing["4xl"],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.xl,
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonGroup: {
    gap: Spacing.md,
    alignItems: "center",
  },
  primaryButtonWrap: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    minWidth: 280,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
