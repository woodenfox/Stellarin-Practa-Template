import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeInUp,
  FadeInDown,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Image } from "expo-image";


import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { getApiUrl } from "@/lib/query-client";
import { useMeditation } from "@/context/MeditationContext";

interface TendCard {
  id: string;
  title: string;
  prompt: string;
  doneWhen: string | null;
  duration: string | null;
  imageUrl: string | null;
}

interface DailyTend {
  id: string;
  userId: string;
  cardId: string;
  date: string;
  isCompleted: boolean;
  note: string | null;
  completedAt: string | null;
  createdAt: string;
}

type TendStatus = "loading" | "not_drawn" | "drawn" | "completed" | "error";

export default function TendCardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { addTendCompletion } = useMeditation();

  const [status, setStatus] = useState<TendStatus>("loading");
  const [card, setCard] = useState<TendCard | null>(null);
  const [dailyTend, setDailyTend] = useState<DailyTend | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const cardScale = useSharedValue(0.9);
  const cardRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const flipProgress = useSharedValue(0);

  // Card dimensions - match 2:3 aspect ratio of the card back image
  const cardWidth = Math.min(screenWidth - Spacing.xl * 2, 300);
  const cardHeight = cardWidth * 1.5;

  useEffect(() => {
    checkTodayStatus();
  }, []);

  useEffect(() => {
    if (status === "drawn" || status === "completed") {
      cardScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [status]);

  const checkTodayStatus = async () => {
    try {
      const userId = await getOrCreateDeviceId();
      const url = new URL(`/api/tend/today?userId=${encodeURIComponent(userId)}`, getApiUrl());
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error("Failed to check today's status");
      }

      const data = await response.json();
      
      if (data.status === "not_drawn") {
        setStatus("not_drawn");
      } else if (data.status === "drawn") {
        setCard(data.card);
        setDailyTend(data.dailyTend);
        setStatus(data.dailyTend.isCompleted ? "completed" : "drawn");
      }
    } catch (err) {
      console.error("Error checking tend status:", err);
      setError("Unable to connect. Please try again.");
      setStatus("error");
    }
  };

  const drawCard = async () => {
    setIsDrawing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const userId = await getOrCreateDeviceId();
      const url = new URL("/api/tend/draw", getApiUrl());
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to draw card");
      }

      const data = await response.json();
      setCard(data.card);
      setDailyTend(data.dailyTend);
      setStatus("drawn");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Error drawing card:", err);
      setError("Failed to draw card. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsDrawing(false);
    }
  };

  const completeCard = async () => {
    setIsCompleting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const userId = await getOrCreateDeviceId();
      const url = new URL("/api/tend/complete", getApiUrl());
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete card");
      }

      const data = await response.json();
      setDailyTend(data.dailyTend);
      setStatus("completed");
      
      // Save tend completion locally for streak tracking
      if (card) {
        await addTendCompletion(card.id);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Error completing card:", err);
      setError("Failed to mark as complete. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { rotate: `${cardRotate.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Flip animation styles
  const cardBackAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` },
    ],
    backfaceVisibility: "hidden" as const,
    opacity: flipProgress.value > 0.5 ? 0 : 1,
  }));

  const cardFrontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` },
    ],
    backfaceVisibility: "hidden" as const,
    opacity: flipProgress.value > 0.5 ? 1 : 0,
  }));

  const handleFlipAndDraw = async () => {
    if (isDrawing || isFlipped) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDrawing(true);

    // Start the flip animation
    flipProgress.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) });

    try {
      const userId = await getOrCreateDeviceId();
      const url = new URL("/api/tend/draw", getApiUrl());
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to draw card");
      }

      const data = await response.json();
      
      // Wait for animation midpoint to set the card data
      setTimeout(() => {
        setCard(data.card);
        setDailyTend(data.dailyTend);
        setIsFlipped(true);
        setStatus("drawn");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 400);
    } catch (err) {
      console.error("Error drawing card:", err);
      // Reverse the flip on error
      flipProgress.value = withTiming(0, { duration: 400 });
      setError("Failed to draw card. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setTimeout(() => setIsDrawing(false), 800);
    }
  };

  const renderContent = () => {
    if (status === "loading") {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Checking your daily card...
          </ThemedText>
        </View>
      );
    }

    if (status === "error") {
      return (
        <View style={styles.centerContent}>
          <Feather name="alert-circle" size={48} color={theme.error} />
          <ThemedText style={[styles.errorText, { color: theme.text }]}>
            {error}
          </ThemedText>
          <Pressable
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={checkTodayStatus}
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </Pressable>
        </View>
      );
    }

    if (status === "not_drawn") {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing["3xl"] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.duration(600).springify()}>
            <ThemedText style={[styles.drawPrompt, { color: theme.text, marginBottom: Spacing.lg, textAlign: "center" }]}>
              Tap to reveal your daily wellness card
            </ThemedText>
          </Animated.View>

          <Pressable onPress={handleFlipAndDraw} disabled={isDrawing} style={styles.cardWrapper}>
            <View style={[styles.flipCardContainer, { width: "100%" }]}>
              {/* Card Back - CSS Generated */}
              <Animated.View style={[styles.flipCardBack, cardBackAnimatedStyle]}>
                <LinearGradient
                  colors={["#008ACA", "#0066A0", "#004D7A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardBackGradient}
                >
                  <View style={styles.cardBackPattern}>
                    <View style={styles.cardBackLogoRing}>
                      <Image
                        source={require("../../assets/images/icon.png")}
                        style={styles.cardBackLogoImage}
                        contentFit="contain"
                      />
                    </View>
                  </View>
                  <View style={styles.cardBackCornerTL} />
                  <View style={styles.cardBackCornerBR} />
                </LinearGradient>
              </Animated.View>
              
              {/* Card Front (placeholder while loading) */}
              <Animated.View 
                style={[
                  styles.flipCardBack, 
                  styles.flipCardFront, 
                  cardFrontAnimatedStyle, 
                  { 
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  }
                ]}
              >
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText style={[styles.loadingText, { color: theme.textSecondary, marginTop: Spacing.md }]}>
                  Drawing your card...
                </ThemedText>
              </Animated.View>
            </View>
          </Pressable>

          {isDrawing ? null : (
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <ThemedText style={[styles.tapHint, { color: theme.textSecondary, textAlign: "center" }]}>
                Tap the card to draw
              </ThemedText>
            </Animated.View>
          )}
        </ScrollView>
      );
    }

    if ((status === "drawn" || status === "completed") && card) {
      const imageUrl = card.imageUrl
        ? card.imageUrl.startsWith("http")
          ? card.imageUrl
          : `https://tend-cards-api.replit.app${card.imageUrl}`
        : null;

      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing["3xl"] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
            <Animated.View style={[styles.cardGlow, { backgroundColor: theme.secondary }, glowAnimatedStyle]} />
            <View style={[styles.tendCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              ) : (
                <LinearGradient
                  colors={[theme.secondary, theme.jade]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardImagePlaceholder}
                >
                  <Feather name="sun" size={48} color="rgba(255,255,255,0.5)" />
                </LinearGradient>
              )}

              <View style={styles.cardContent}>
                <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
                  {card.title}
                </ThemedText>

                <ThemedText style={[styles.cardPrompt, { color: theme.textSecondary }]}>
                  {card.prompt}
                </ThemedText>

                {card.doneWhen ? (
                  <View style={[styles.doneWhenContainer, { backgroundColor: theme.jadeMuted }]}>
                    <ThemedText style={[styles.doneWhenLabel, { color: theme.jade }]}>
                      You're done when...
                    </ThemedText>
                    <ThemedText style={[styles.doneWhenText, { color: theme.jade }]}>
                      {card.doneWhen}
                    </ThemedText>
                  </View>
                ) : null}

                {card.duration ? (
                  <View style={styles.durationRow}>
                    <Feather name="clock" size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.durationText, { color: theme.textSecondary }]}>
                      {card.duration}
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              {status === "completed" ? (
                <View style={[styles.completedBadge, { backgroundColor: theme.success }]}>
                  <Feather name="check" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.completedText}>Completed</ThemedText>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {status === "drawn" ? (
            <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.buttonGroup}>
              <Pressable
                style={[styles.acceptButton, { backgroundColor: theme.primary }]}
                onPress={handleClose}
              >
                <Feather name="heart" size={20} color="#FFFFFF" />
                <ThemedText style={styles.acceptButtonText}>I'll do it!</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.completeButton, { backgroundColor: theme.success }]}
                onPress={completeCard}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.completeButtonText}>Mark as Done</ThemedText>
                  </>
                )}
              </Pressable>
            </Animated.View>
          ) : null}
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
          Daily Tend
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 15,
  },
  errorText: {
    marginTop: Spacing.lg,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  drawCardContainer: {
    width: 240,
    height: 320,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing["2xl"],
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardBackText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 60,
  },
  drawPrompt: {
    fontSize: 17,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  drawButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    minWidth: 180,
  },
  drawButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  flipCardContainer: {
    position: "relative",
  },
  flipCard: {
    position: "absolute",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  flipCardBack: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  flipCardFront: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardBackImage: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.lg,
  },
  cardBackGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
  },
  cardBackPattern: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardBackLogoRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  cardBackLogoInner: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBackLogoImage: {
    width: 180,
    height: 180,
    borderRadius: 36,
  },
  cardBackCornerTL: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    borderTopLeftRadius: 8,
  },
  cardBackCornerBR: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    borderBottomRightRadius: 8,
  },
  tapHint: {
    fontSize: 14,
    marginTop: Spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  cardWrapper: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  cardGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.lg + 4,
    transform: [{ scale: 1.03 }],
  },
  tendCard: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardImage: {
    width: "100%",
    height: 200,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  cardPrompt: {
    fontSize: 16,
    lineHeight: 24,
  },
  doneWhenContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  doneWhenLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  doneWhenText: {
    fontSize: 14,
    lineHeight: 20,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  durationText: {
    fontSize: 13,
  },
  completedBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  completedText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  buttonGroup: {
    gap: Spacing.md,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
