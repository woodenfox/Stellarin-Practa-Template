import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import FAQScreen from "@/screens/FAQScreen";
import NotificationsPromptScreen from "@/screens/NotificationsPromptScreen";
import FlowScreen from "@/screens/FlowScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { FlowDefinition } from "@/types/flow";

export type RootStackParamList = {
  Main: undefined;
  FAQ: undefined;
  NotificationsPrompt: undefined;
  Flow: { flow: FlowDefinition };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
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
