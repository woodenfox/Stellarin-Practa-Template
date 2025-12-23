import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const NOTIFICATIONS_PROMPTED_KEY = "@stellarin_notifications_prompted";

export default function NotificationsPromptScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleRemindMe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      await AsyncStorage.setItem(NOTIFICATIONS_PROMPTED_KEY, "true");
      
      if (status === "granted") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error requesting notifications:", error);
    }
    
    navigation.goBack();
  };

  const handleMaybeLater = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(NOTIFICATIONS_PROMPTED_KEY, "true");
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl }]}>
        <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.iconContainer}>
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Feather name="bell" size={48} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} style={styles.textContainer}>
          <ThemedText style={[styles.heading, { color: theme.text }]}>
            Stick to your new habit with gentle reminders
          </ThemedText>
          
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            Turn on notifications to remind yourself of your intentions.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.buttonContainer}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleRemindMe}
          >
            <Feather name="bell" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <ThemedText style={styles.primaryButtonText}>Remind Me</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, { borderColor: theme.border }]}
            onPress={handleMaybeLater}
          >
            <ThemedText style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
              Maybe Later
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: Spacing["2xl"],
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 36,
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: 17,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "500",
  },
});
