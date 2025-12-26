import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from "react-native";
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
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { getApiUrl } from "@/lib/query-client";
import { PractaContext, PractaOutput, PractaCompleteHandler } from "@/types/flow";

interface TendCard {
  id: string;
  title: string;
  prompt: string;
  doneWhen: string | null;
  duration: string | null;
  imageUrl: string | null;
}

interface TendPractaProps {
  context: PractaContext;
  onComplete: PractaCompleteHandler;
  onSkip?: () => void;
}

type TendStatus = "loading" | "choosing" | "drawn" | "completed" | "error";

const SWIPE_THRESHOLD = 100;

const SwipeableCard = memo(function SwipeableCard({
  card,
  index,
  totalCards,
  onSwipeLeft,
  isActive,
  isFlipped,
  onFlip,
}: {
  card: TendCard;
  index: number;
  totalCards: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isActive: boolean;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const flipProgress = useSharedValue(isFlipped ? 1 : 0);

  const cardWidth = Math.min(screenWidth - Spacing.xl * 2, 340);
  const cardHeight = Math.min(screenHeight - insets.top - insets.bottom - 200, 520);

  const imageUrl = card.imageUrl
    ? card.imageUrl.startsWith("http")
      ? card.imageUrl
      : `https://tend-cards-api.replit.app${card.imageUrl}`
    : null;

  useEffect(() => {
    if (isActive) {
      translateX.value = 0;
      translateY.value = 0;
      rotation.value = 0;
      cardOpacity.value = 1;
    }
  }, [isActive]);

  useEffect(() => {
    flipProgress.value = withTiming(isFlipped ? 1 : 0, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isFlipped]);

  const rotateToBack = useCallback(() => {
    onSwipeLeft();
  }, [onSwipeLeft]);

  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onFlip();
    }
  }, [isFlipped, onFlip]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
      rotation.value = event.translationX / 20;
    })
    .onEnd((event) => {
      const swipedFarEnough = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      if (swipedFarEnough) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(
          screenWidth * 1.2 * direction,
          { duration: 300, easing: Easing.out(Easing.cubic) },
          () => {
            runOnJS(rotateToBack)();
          }
        );
        rotation.value = withTiming(20 * direction, { duration: 300 });
        cardOpacity.value = withTiming(0.5, { duration: 300 });
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        rotation.value = withSpring(0, { damping: 15 });
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleFlip)();
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: isActive ? translateX.value : 0 },
        { translateY: isActive ? translateY.value : 0 },
        { rotate: `${isActive ? rotation.value : 0}deg` },
        { scale: isActive ? 1 : 1 },
      ],
      opacity: isActive ? cardOpacity.value : 1,
      zIndex: isActive ? totalCards + 1 : totalCards - index,
    };
  });

  const cardBackStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` },
      ],
      backfaceVisibility: "hidden" as const,
      opacity: flipProgress.value > 0.5 ? 0 : 1,
    };
  });

  const cardFrontStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` },
      ],
      backfaceVisibility: "hidden" as const,
      opacity: flipProgress.value > 0.5 ? 1 : 0,
    };
  });

  const cardContent = (
    <Animated.View
      style={[styles.flipCardWrapper, { width: cardWidth, height: cardHeight }, containerStyle]}
    >
      <Animated.View style={[styles.flipCardFace, cardBackStyle]}>
        <LinearGradient
          colors={["#008ACA", "#0066A0", "#004D7A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBackGradient}
        >
          <View style={styles.cardBackPattern}>
            <View style={styles.cardBackLogoRing}>
              <Feather name="sun" size={48} color="rgba(255,255,255,0.8)" />
            </View>
            <ThemedText style={styles.tapToRevealText}>Tap to reveal</ThemedText>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        style={[
          styles.flipCardFace,
          styles.flipCardFront,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          cardFrontStyle,
        ]}
      >
        <ScrollView
          style={styles.cardScrollView}
          contentContainerStyle={styles.cardScrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.fullCardImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
            />
          ) : (
            <LinearGradient
              colors={[theme.secondary, theme.jade]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fullCardImagePlaceholder}
            >
              <Feather name="sun" size={48} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          )}

          <View style={styles.fullCardContent}>
            <ThemedText style={[styles.fullCardTitle, { color: theme.text }]}>
              {card.title}
            </ThemedText>

            <ThemedText style={[styles.fullCardPrompt, { color: theme.textSecondary }]}>
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
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );

  if (isActive && !isFlipped) {
    return <GestureDetector gesture={tapGesture}>{cardContent}</GestureDetector>;
  }

  if (isActive && isFlipped) {
    return <GestureDetector gesture={panGesture}>{cardContent}</GestureDetector>;
  }

  return cardContent;
});

export function TendPracta({ context, onComplete, onSkip }: TendPractaProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<TendStatus>("loading");
  const [cards, setCards] = useState<TendCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<TendCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const cardScale = useSharedValue(0.9);
  const glowOpacity = useSharedValue(0.3);

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
        await fetchCardChoices();
      } else if (data.status === "drawn") {
        setSelectedCard(data.card);
        setStatus(data.dailyTend.isCompleted ? "completed" : "drawn");
      }
    } catch (err) {
      console.error("Error checking tend status:", err);
      setError("Unable to connect. Please try again.");
      setStatus("error");
    }
  };

  const fetchCardChoices = async () => {
    try {
      const url = new URL("/api/tend/choices", getApiUrl());
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch card choices");
      }

      const data = await response.json();
      setCards(data.cards || []);
      setStatus("choosing");
    } catch (err) {
      console.error("Error fetching card choices:", err);
      setError("Failed to load cards. Please try again.");
      setStatus("error");
    }
  };

  const handleSwipeLeft = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCards((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  const handleFlipCard = (cardId: string) => {
    setFlippedCards((prev) => new Set(prev).add(cardId));
  };

  const handleSwipeRight = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const chosenCard = cards[0];
    if (!chosenCard) return;

    try {
      const userId = await getOrCreateDeviceId();
      const url = new URL("/api/tend/draw", getApiUrl());
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, cardId: chosenCard.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to select card");
      }

      const data = await response.json();
      setSelectedCard(data.card);
      setCards([]);
      setStatus("drawn");
    } catch (err) {
      console.error("Error selecting card:", err);
      setError("Failed to select card. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const output: PractaOutput = {
      content: selectedCard
        ? {
            type: "text",
            value: selectedCard.prompt,
          }
        : undefined,
      metadata: {
        source: "system",
        cardId: selectedCard?.id,
        cardTitle: selectedCard?.title,
        cardPrompt: selectedCard?.prompt,
        status: "accepted",
      },
    };

    onComplete(output);
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (status === "loading") {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.backgroundRoot, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Checking your daily card...
        </ThemedText>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.backgroundRoot, paddingTop: insets.top },
        ]}
      >
        <Feather name="alert-circle" size={48} color={theme.error} />
        <ThemedText style={[styles.errorText, { color: theme.text }]}>{error}</ThemedText>
        <Pressable
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={checkTodayStatus}
        >
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (status === "choosing" && cards.length > 0) {
    const topCardFlipped = flippedCards.has(cards[0]?.id);

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.backgroundRoot, paddingTop: insets.top + Spacing.xl },
        ]}
      >
        <Animated.View entering={FadeInUp.duration(400)} style={styles.headerSection}>
          <ThemedText style={[styles.choosingPrompt, { color: theme.text }]}>
            Choose your wellness focus
          </ThemedText>
          <ThemedText style={[styles.choosingHint, { color: theme.textSecondary }]}>
            {topCardFlipped ? "Swipe to see more cards" : "Tap the card to reveal"}
          </ThemedText>
        </Animated.View>

        <View style={styles.cardStack}>
          {cards.slice(0, 3).map((card, index) => (
            <SwipeableCard
              key={card.id}
              card={card}
              index={index}
              totalCards={Math.min(cards.length, 3)}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              isActive={index === 0}
              isFlipped={flippedCards.has(card.id)}
              onFlip={() => handleFlipCard(card.id)}
            />
          ))}
        </View>

        <View style={[styles.chooseButtonContainer, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <Pressable
            style={[
              styles.chooseButton,
              {
                backgroundColor: topCardFlipped ? theme.primary : theme.border,
                opacity: topCardFlipped ? 1 : 0.6,
              },
            ]}
            onPress={topCardFlipped ? handleSwipeRight : undefined}
            disabled={!topCardFlipped}
          >
            <Feather name="heart" size={20} color="#FFFFFF" />
            <ThemedText style={styles.chooseButtonText}>Choose This Card</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  if ((status === "drawn" || status === "completed") && selectedCard) {
    const imageUrl = selectedCard.imageUrl
      ? selectedCard.imageUrl.startsWith("http")
        ? selectedCard.imageUrl
        : `https://tend-cards-api.replit.app${selectedCard.imageUrl}`
      : null;

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.backgroundRoot, paddingTop: insets.top + Spacing.xl },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing["3xl"] }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
            <Animated.View
              style={[styles.cardGlow, { backgroundColor: theme.secondary }, glowAnimatedStyle]}
            />
            <View
              style={[styles.tendCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.cardImage} contentFit="cover" />
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

              <View style={styles.cardContentSection}>
                <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
                  {selectedCard.title}
                </ThemedText>

                <ThemedText style={[styles.cardPrompt, { color: theme.textSecondary }]}>
                  {selectedCard.prompt}
                </ThemedText>

                {selectedCard.doneWhen ? (
                  <View style={[styles.doneWhenContainer, { backgroundColor: theme.jadeMuted }]}>
                    <ThemedText style={[styles.doneWhenLabel, { color: theme.jade }]}>
                      You're done when...
                    </ThemedText>
                    <ThemedText style={[styles.doneWhenText, { color: theme.jade }]}>
                      {selectedCard.doneWhen}
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

          <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.buttonGroup}>
            <Pressable
              style={[styles.acceptButton, { backgroundColor: theme.primary }]}
              onPress={handleAccept}
            >
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
              <ThemedText style={styles.acceptButtonText}>Continue</ThemedText>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 16,
  },
  errorText: {
    marginTop: Spacing.lg,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  retryButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  choosingPrompt: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  choosingHint: {
    fontSize: 16,
    textAlign: "center",
  },
  cardStack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  flipCardWrapper: {
    position: "absolute",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  flipCardFace: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  flipCardFront: {
    borderWidth: 1,
  },
  cardBackGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.xl,
  },
  cardBackPattern: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  cardBackLogoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  tapToRevealText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "500",
  },
  cardScrollView: {
    flex: 1,
  },
  cardScrollContent: {
    flexGrow: 1,
  },
  fullCardImage: {
    width: "100%",
    height: 200,
  },
  fullCardImagePlaceholder: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  fullCardContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  fullCardTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  fullCardPrompt: {
    fontSize: 16,
    lineHeight: 24,
  },
  doneWhenContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  doneWhenLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  doneWhenText: {
    fontSize: 14,
    lineHeight: 20,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  durationText: {
    fontSize: 14,
  },
  chooseButtonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  chooseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  chooseButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  cardWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  cardGlow: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: BorderRadius.xl + 20,
  },
  tendCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContentSection: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  cardPrompt: {
    fontSize: 16,
    lineHeight: 24,
  },
  completedBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  completedText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  buttonGroup: {
    width: "100%",
    gap: Spacing.md,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
