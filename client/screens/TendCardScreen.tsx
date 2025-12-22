import React, { useState, useEffect, useCallback } from "react";
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
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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

type TendStatus = "loading" | "choosing" | "drawn" | "completed" | "error";

const SWIPE_THRESHOLD = 100;

function SwipeableCard({
  card,
  index,
  totalCards,
  onSwipeLeft,
  onSwipeRight,
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
  const { theme, isDark } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const flipProgress = useSharedValue(isFlipped ? 1 : 0);
  
  const cardWidth = Math.min(screenWidth - Spacing.xl * 2, 340);
  const cardHeight = Math.min(screenHeight - insets.top - insets.bottom - 200, 520);
  
  // Use forward index so cards[1] appears directly under cards[0]
  const stackPosition = index;
  const stackOffsetY = stackPosition * 12;
  const stackOffsetX = stackPosition * 4;
  const stackScale = 1 - stackPosition * 0.04;
  const stackRotation = stackPosition * 2;

  const imageUrl = card.imageUrl
    ? card.imageUrl.startsWith("http")
      ? card.imageUrl
      : `https://tend-cards-api.replit.app${card.imageUrl}`
    : null;

  // Reset position when card becomes active again (after being recycled)
  useEffect(() => {
    if (isActive) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      rotation.value = withSpring(0, { damping: 20, stiffness: 200 });
      cardOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isActive]);

  useEffect(() => {
    flipProgress.value = withTiming(isFlipped ? 1 : 0, { 
      duration: 500, 
      easing: Easing.inOut(Easing.ease) 
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

  // Pan gesture for swiping (only when flipped)
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
        // Animate card off screen to the side, then immediately rotate the deck
        translateX.value = withTiming(
          screenWidth * 1.2 * direction, 
          { duration: 300, easing: Easing.out(Easing.cubic) },
          () => {
            // Rotate the deck immediately after the card exits
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

  // Tap gesture for flipping (only when not flipped)
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(handleFlip)();
    });

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: isActive ? translateX.value : stackOffsetX },
        { translateY: isActive ? translateY.value : stackOffsetY },
        { rotate: `${isActive ? rotation.value : stackRotation}deg` },
        { scale: isActive ? 1 : stackScale },
      ],
      opacity: isActive ? cardOpacity.value : 0.9,
      // Higher z-index for lower index cards (index 0 = top)
      zIndex: isActive ? totalCards + 1 : totalCards - index,
    };
  });

  const cardBackStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` },
      ],
      backfaceVisibility: 'hidden' as const,
      opacity: flipProgress.value > 0.5 ? 0 : 1,
    };
  });

  const cardFrontStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` },
      ],
      backfaceVisibility: 'hidden' as const,
      opacity: flipProgress.value > 0.5 ? 1 : 0,
    };
  });

  // Use separate gesture detectors based on flip state to prevent gesture conflicts
  const cardContent = (
    <Animated.View style={[styles.flipCardWrapper, { width: cardWidth, height: cardHeight }, containerStyle]}>
      <Animated.View style={[styles.flipCardFace, cardBackStyle]}>
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
            <ThemedText style={styles.tapToRevealText}>Tap to reveal</ThemedText>
          </View>
          <View style={styles.cardBackCornerTL} />
          <View style={styles.cardBackCornerBR} />
        </LinearGradient>
      </Animated.View>

      <Animated.View 
        style={[
          styles.flipCardFace, 
          styles.flipCardFront,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          cardFrontStyle
        ]}
      >
        <ScrollView 
          style={styles.cardScrollView}
          contentContainerStyle={styles.cardScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.fullCardImage}
              contentFit="cover"
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

  // Use separate gesture detectors: tap for face-down, pan for flipped
  if (isActive && !isFlipped) {
    return (
      <GestureDetector gesture={tapGesture}>
        {cardContent}
      </GestureDetector>
    );
  }
  
  if (isActive && isFlipped) {
    return (
      <GestureDetector gesture={panGesture}>
        {cardContent}
      </GestureDetector>
    );
  }

  // Non-active cards don't need gesture handling
  return cardContent;
}

export default function TendCardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { addTendCompletion } = useMeditation();

  const [status, setStatus] = useState<TendStatus>("loading");
  const [cards, setCards] = useState<TendCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<TendCard | null>(null);
  const [dailyTend, setDailyTend] = useState<DailyTend | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
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
        // Fetch 3 random cards for choosing
        await fetchCardChoices();
      } else if (data.status === "drawn") {
        setSelectedCard(data.card);
        setDailyTend(data.dailyTend);
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
      setCurrentCardIndex(0);
      setStatus("choosing");
    } catch (err) {
      console.error("Error fetching card choices:", err);
      setError("Failed to load cards. Please try again.");
      setStatus("error");
    }
  };

  const handleSwipeLeft = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Move the swiped card to the back of the deck (keep it revealed)
    setCards(prev => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  const handleFlipCard = (cardId: string) => {
    setFlippedCards(prev => new Set(prev).add(cardId));
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
      setDailyTend(data.dailyTend);
      setCards([]);
      setStatus("drawn");
    } catch (err) {
      console.error("Error selecting card:", err);
      setError("Failed to select card. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      
      if (selectedCard) {
        await addTendCompletion(selectedCard.id);
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
    transform: [{ scale: cardScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

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

    if (status === "choosing" && cards.length > 0) {
      const topCardFlipped = flippedCards.has(cards[0]?.id);
      
      return (
        <View style={styles.choosingContainer}>
          <Animated.View entering={FadeInUp.duration(400)}>
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

          <View style={styles.chooseButtonContainer}>
            <Pressable
              style={[
                styles.chooseButton, 
                { 
                  backgroundColor: topCardFlipped ? theme.primary : theme.border,
                  opacity: topCardFlipped ? 1 : 0.6,
                }
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

                {selectedCard.duration ? (
                  <View style={styles.durationRow}>
                    <Feather name="clock" size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.durationText, { color: theme.textSecondary }]}>
                      {selectedCard.duration}
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
  choosingContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  choosingPrompt: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  choosingHint: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  cardStack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  swipeCard: {
    position: "absolute",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
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
  swipeCardImage: {
    width: "100%",
    height: 180,
  },
  swipeCardImagePlaceholder: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeCardContent: {
    padding: Spacing.lg,
  },
  swipeCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  swipeCardPrompt: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  chooseButtonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["2xl"],
  },
  chooseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  chooseButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  swipeHintRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing["3xl"],
    paddingBottom: Spacing["2xl"],
  },
  swipeHintItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  swipeHintCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeHintText: {
    fontSize: 13,
    fontWeight: "500",
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
    padding: Spacing.lg,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  cardPrompt: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  doneWhenContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  doneWhenLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  doneWhenText: {
    fontSize: 15,
    lineHeight: 22,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  durationText: {
    fontSize: 14,
  },
  completedBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  completedText: {
    color: "#FFFFFF",
    fontSize: 13,
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
    borderRadius: BorderRadius.lg,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  flipCardWrapper: {
    position: "absolute",
  },
  flipCardFace: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
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
  flipCardFront: {
    borderWidth: 1,
  },
  cardBackGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBackPattern: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardBackLogoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  cardBackLogoImage: {
    width: 60,
    height: 60,
  },
  tapToRevealText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1,
  },
  cardBackCornerTL: {
    position: "absolute",
    top: Spacing.lg,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    borderTopLeftRadius: BorderRadius.sm,
  },
  cardBackCornerBR: {
    position: "absolute",
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    borderBottomRightRadius: BorderRadius.sm,
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
    flex: 1,
  },
  fullCardTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  fullCardPrompt: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
});
