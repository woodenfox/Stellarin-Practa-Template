import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import FAQScreen from "@/screens/FAQScreen";
import NotificationsPromptScreen from "@/screens/NotificationsPromptScreen";
import FlowScreen from "@/screens/FlowScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTheme } from "@/hooks/useTheme";
import { FlowDefinition } from "@/types/flow";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  FAQ: undefined;
  NotificationsPrompt: undefined;
  Flow: { flow: FlowDefinition };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { hasCompletedOnboarding, isLoading } = useOnboarding();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={screenOptions}
      initialRouteName={hasCompletedOnboarding ? "Main" : "Onboarding"}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{
          presentation: "modal",
          headerTitle: "Frequently Asked Questions",
        }}
      />
      <Stack.Screen
        name="NotificationsPrompt"
        component={NotificationsPromptScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="Flow"
        component={FlowScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
          animation: "fade",
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
