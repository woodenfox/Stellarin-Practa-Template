import React, { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet, Pressable, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Battery from "expo-battery";
import * as Application from "expo-application";
import * as Network from "expo-network";
import Constants from "expo-constants";
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

interface DeviceInfo {
  brand: string | null;
  manufacturer: string | null;
  modelName: string | null;
  modelId: string | null;
  designName: string | null;
  productName: string | null;
  deviceYearClass: number | null;
  totalMemory: number | null;
  supportedCpuArchitectures: string[] | null;
  osName: string | null;
  osVersion: string | null;
  osBuildId: string | null;
  osInternalBuildId: string | null;
  platformApiLevel: number | null;
  deviceName: string | null;
  deviceType: string;
  isDevice: boolean;
}

interface BatteryInfo {
  batteryLevel: number;
  batteryState: string;
  lowPowerMode: boolean;
}

interface NetworkInfo {
  networkState: string;
  ipAddress: string | null;
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

interface AppInfo {
  applicationName: string | null;
  applicationId: string | null;
  nativeApplicationVersion: string | null;
  nativeBuildVersion: string | null;
  installTime: Date | null;
}

const deviceTypeMap: Record<number, string> = {
  0: "Unknown",
  1: "Phone",
  2: "Tablet",
  3: "Desktop",
  4: "TV",
};

const batteryStateMap: Record<number, string> = {
  0: "Unknown",
  1: "Unplugged",
  2: "Charging",
  3: "Full",
};

export default function DevScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { sessions, totalRice, streakDays } = useMeditation();

  const [notificationStatus, setNotificationStatus] = useState<string>("checking...");
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    checkNotificationStatus();
    loadDeviceInfo();
    loadBatteryInfo();
    loadNetworkInfo();
    loadAppInfo();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const info: DeviceInfo = {
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        modelId: Device.modelId,
        designName: Device.designName,
        productName: Device.productName,
        deviceYearClass: Device.deviceYearClass,
        totalMemory: Device.totalMemory,
        supportedCpuArchitectures: Device.supportedCpuArchitectures,
        osName: Device.osName,
        osVersion: Device.osVersion,
        osBuildId: Device.osBuildId,
        osInternalBuildId: Device.osInternalBuildId,
        platformApiLevel: Device.platformApiLevel,
        deviceName: Device.deviceName,
        deviceType: deviceTypeMap[Device.deviceType ?? 0] || "Unknown",
        isDevice: Device.isDevice,
      };
      setDeviceInfo(info);
    } catch (error) {
      console.log("Error loading device info:", error);
    }
  };

  const loadBatteryInfo = async () => {
    try {
      const level = await Battery.getBatteryLevelAsync();
      const state = await Battery.getBatteryStateAsync();
      const lowPower = await Battery.isLowPowerModeEnabledAsync();
      setBatteryInfo({
        batteryLevel: level,
        batteryState: batteryStateMap[state] || "Unknown",
        lowPowerMode: lowPower,
      });
    } catch (error) {
      console.log("Error loading battery info:", error);
    }
  };

  const loadNetworkInfo = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const ip = await Network.getIpAddressAsync();
      setNetworkInfo({
        networkState: state.type || "Unknown",
        ipAddress: ip,
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
      });
    } catch (error) {
      console.log("Error loading network info:", error);
    }
  };

  const loadAppInfo = async () => {
    try {
      let installTime: Date | null = null;
      if (Platform.OS === "android") {
        installTime = await Application.getInstallationTimeAsync();
      }
      setAppInfo({
        applicationName: Application.applicationName,
        applicationId: Application.applicationId,
        nativeApplicationVersion: Application.nativeApplicationVersion,
        nativeBuildVersion: Application.nativeBuildVersion,
        installTime,
      });
    } catch (error) {
      console.log("Error loading app info:", error);
    }
  };

  const formatBytes = (bytes: number | null): string => {
    if (bytes === null) return "N/A";
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.join(", ") || "N/A";
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  };

  const refreshAllInfo = () => {
    loadDeviceInfo();
    loadBatteryInfo();
    loadNetworkInfo();
    loadAppInfo();
    checkNotificationStatus();
    showAlert("Refreshed", "Device info updated.");
  };

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
    if (Platform.OS === "web") {
      showAlert("Not Available", "Push notifications don't work on web. Test this feature using Expo Go on your phone.");
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Required", "Enable notifications first to test this feature.");
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification from Stellarin!",
        },
        trigger: { seconds: 2, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
      });
      showAlert("Scheduled", "A test notification will appear in 2 seconds.");
    } catch (error) {
      showAlert("Error", "Failed to schedule notification. This feature may be limited in Expo Go.");
    }
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

      <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Device Info</ThemedText>
          <Pressable onPress={refreshAllInfo} hitSlop={8}>
            <Feather name="refresh-cw" size={18} color={theme.primary} />
          </Pressable>
        </View>
        {deviceInfo ? (
          <>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Device Name:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(deviceInfo.deviceName)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Brand:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(deviceInfo.brand)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Manufacturer:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(deviceInfo.manufacturer)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Model:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(deviceInfo.modelName)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Model ID:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(deviceInfo.modelId)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Design Name:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(deviceInfo.designName)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Product Name:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(deviceInfo.productName)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Device Type:</ThemedText>
              <ThemedText style={styles.infoValue}>{deviceInfo.deviceType}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Year Class:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(deviceInfo.deviceYearClass)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Is Physical Device:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(deviceInfo.isDevice)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Total Memory:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatBytes(deviceInfo.totalMemory)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>CPU Architectures:</ThemedText>
              <ThemedText style={[styles.infoValue, styles.infoValueWrap]} numberOfLines={2}>
                {formatValue(deviceInfo.supportedCpuArchitectures)}
              </ThemedText>
            </View>
          </>
        ) : (
          <ThemedText style={{ color: theme.textSecondary }}>Loading...</ThemedText>
        )}
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          Operating System
        </ThemedText>
        {deviceInfo ? (
          <>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>OS Name:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(deviceInfo.osName)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>OS Version:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(deviceInfo.osVersion)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Build ID:</ThemedText>
              <ThemedText style={[styles.infoValue, styles.infoValueWrap]} numberOfLines={2}>
                {formatValue(deviceInfo.osBuildId)}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Internal Build ID:</ThemedText>
              <ThemedText style={[styles.infoValue, styles.infoValueWrap]} numberOfLines={2}>
                {formatValue(deviceInfo.osInternalBuildId)}
              </ThemedText>
            </View>
            {deviceInfo.platformApiLevel !== null && (
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>API Level:</ThemedText>
                <ThemedText style={styles.infoValue}>{deviceInfo.platformApiLevel}</ThemedText>
              </View>
            )}
          </>
        ) : (
          <ThemedText style={{ color: theme.textSecondary }}>Loading...</ThemedText>
        )}
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          Battery
        </ThemedText>
        {batteryInfo ? (
          <>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Battery Level:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {batteryInfo.batteryLevel >= 0 ? `${Math.round(batteryInfo.batteryLevel * 100)}%` : "N/A"}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>State:</ThemedText>
              <ThemedText style={styles.infoValue}>{batteryInfo.batteryState}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Low Power Mode:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(batteryInfo.lowPowerMode)}</ThemedText>
            </View>
          </>
        ) : (
          <ThemedText style={{ color: theme.textSecondary }}>Loading...</ThemedText>
        )}
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          Network
        </ThemedText>
        {networkInfo ? (
          <>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Type:</ThemedText>
              <ThemedText style={styles.infoValue}>{networkInfo.networkState}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Connected:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(networkInfo.isConnected)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Internet Reachable:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(networkInfo.isInternetReachable)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>IP Address:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(networkInfo.ipAddress)}</ThemedText>
            </View>
          </>
        ) : (
          <ThemedText style={{ color: theme.textSecondary }}>Loading...</ThemedText>
        )}
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          App Info
        </ThemedText>
        {appInfo ? (
          <>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>App Name:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(appInfo.applicationName)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Bundle ID:</ThemedText>
              <ThemedText style={[styles.infoValue, styles.infoValueWrap]} numberOfLines={2}>
                {formatValue(appInfo.applicationId)}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Version:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(appInfo.nativeApplicationVersion)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Build:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatValue(appInfo.nativeBuildVersion)}</ThemedText>
            </View>
            {appInfo.installTime && (
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Installed:</ThemedText>
                <ThemedText style={styles.infoValue}>{formatValue(appInfo.installTime)}</ThemedText>
              </View>
            )}
          </>
        ) : (
          <ThemedText style={{ color: theme.textSecondary }}>Loading...</ThemedText>
        )}
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          Expo Constants
        </ThemedText>
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Expo Version:</ThemedText>
          <ThemedText style={styles.infoValue}>{formatValue(Constants.expoVersion)}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>App Ownership:</ThemedText>
          <ThemedText style={styles.infoValue}>{formatValue(Constants.appOwnership)}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Debug Mode:</ThemedText>
          <ThemedText style={styles.infoValue}>{formatValue(Constants.debugMode)}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Execution Env:</ThemedText>
          <ThemedText style={styles.infoValue}>{formatValue(Constants.executionEnvironment)}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Session ID:</ThemedText>
          <ThemedText style={[styles.infoValue, styles.infoValueWrap]} numberOfLines={1}>
            {formatValue(Constants.sessionId)}
          </ThemedText>
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
    textAlign: "right",
  },
  infoValueWrap: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
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
