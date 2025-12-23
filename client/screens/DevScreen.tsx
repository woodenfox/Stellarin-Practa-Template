import React, { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet, Pressable, Alert, Platform, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { reloadAppAsync } from "expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useMeditation } from "@/context/MeditationContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DevButtonProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  iconColor?: string;
  destructive?: boolean;
}

function DevButton({ icon, title, subtitle, onPress, iconColor, destructive }: DevButtonProps) {
  const { theme } = useTheme();
  const color = destructive ? theme.error : (iconColor || theme.textSecondary);
  const borderColor = destructive ? theme.error : theme.border;

  return (
    <Pressable
      style={[styles.devButton, { backgroundColor: theme.backgroundDefault, borderColor }]}
      onPress={onPress}
    >
      <Feather name={icon} size={20} color={color} />
      <View style={styles.devButtonText}>
        <ThemedText style={[styles.devButtonTitle, { color: destructive ? theme.error : theme.text }]}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.devButtonSubtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export default function DevScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { sessions, totalRice, streakDays } = useMeditation();

  const [notificationStatus, setNotificationStatus] = useState<string>("checking...");

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationStatus(status);
  };

  const performReset = async () => {
    try {
      await AsyncStorage.clear();
      if (Platform.OS === "web") {
        window.location.reload();
      } else {
        await reloadAppAsync();
      }
    } catch (error) {
      console.error("Failed to reset app data:", error);
      showAlert("Error", "Failed to reset app data. Please try again.");
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleResetAppData = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "This will clear all your meditation sessions, journal entries, and progress. This cannot be undone. Are you sure?"
      );
      if (confirmed) {
        performReset();
      }
    } else {
      Alert.alert(
        "Reset App Data",
        "This will clear all your meditation sessions, journal entries, and progress. This cannot be undone. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reset Everything",
            style: "destructive",
            onPress: performReset,
          },
        ]
      );
    }
  };

  const handleResetNotificationPrompt = async () => {
    await AsyncStorage.removeItem("hasShownNotificationPrompt");
    showAlert("Done", "Notification prompt will show on next app restart.");
  };

  const handleTestLocalNotification = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Required", "Enable notifications first to test this feature.");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "This is a test notification from Stellarin!",
      },
      trigger: { seconds: 2, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
    });
    showAlert("Scheduled", "A test notification will appear in 2 seconds.");
  };

  const handleAddTestSession = async () => {
    const existingData = await AsyncStorage.getItem("meditationData");
    const data = existingData ? JSON.parse(existingData) : { sessions: [], journalEntries: [] };
    
    const testSession = {
      id: `test-${Date.now()}`,
      durationMinutes: 5,
      riceEarned: 50,
      timestamp: new Date().toISOString(),
    };
    
    data.sessions.push(testSession);
    await AsyncStorage.setItem("meditationData", JSON.stringify(data));
    showAlert("Added", "Test meditation session added. Restart app to see changes.");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
    >
      <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          App State
        </ThemedText>
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Sessions:</ThemedText>
          <ThemedText style={styles.infoValue}>{sessions.length}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Total Rice:</ThemedText>
          <ThemedText style={styles.infoValue}>{totalRice.toLocaleString()}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Streak Days:</ThemedText>
          <ThemedText style={styles.infoValue}>{streakDays.length} days</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Notification Status:</ThemedText>
          <ThemedText style={styles.infoValue}>{notificationStatus}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Platform:</ThemedText>
          <ThemedText style={styles.infoValue}>{Platform.OS}</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Screens
        </ThemedText>
        <DevButton
          icon="bell"
          title="Notifications Prompt"
          subtitle="Show the notification permission modal"
          onPress={() => navigation.navigate("NotificationsPrompt")}
        />
        <DevButton
          icon="layers"
          title="Tend Cards"
          subtitle="Open the Tend card deck screen"
          onPress={() => navigation.navigate("TendCard")}
        />
        <DevButton
          icon="play-circle"
          title="Meditation Session"
          subtitle="Start a 6-second test session"
          onPress={() => navigation.navigate("Session", { duration: 0.1 })}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Notifications
        </ThemedText>
        <DevButton
          icon="refresh-cw"
          title="Reset Notification Prompt Flag"
          subtitle="Will show prompt again on next restart"
          onPress={handleResetNotificationPrompt}
        />
        <DevButton
          icon="send"
          title="Send Test Notification"
          subtitle="Schedules a local notification in 2 seconds"
          onPress={handleTestLocalNotification}
        />
        <DevButton
          icon="settings"
          title="Check Permission Status"
          subtitle={`Current: ${notificationStatus}`}
          onPress={checkNotificationStatus}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Data
        </ThemedText>
        <DevButton
          icon="plus-circle"
          title="Add Test Session"
          subtitle="Add a fake 5-minute meditation session"
          onPress={handleAddTestSession}
        />
        <DevButton
          icon="trash-2"
          title="Reset App Data"
          subtitle="Clear all sessions, journal entries, and progress"
          onPress={handleResetAppData}
          destructive
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  devButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  devButtonText: {
    flex: 1,
  },
  devButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  devButtonSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
