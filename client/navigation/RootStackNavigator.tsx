import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import SessionScreen from "@/screens/SessionScreen";
import RecordingScreen from "@/screens/RecordingScreen";
import FAQScreen from "@/screens/FAQScreen";
import PersonalizedMeditationScreen from "@/screens/PersonalizedMeditationScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  Session: { duration: number };
  Recording: undefined;
  FAQ: undefined;
  PersonalizedMeditation: { journalContent: string; riceEarned: number };
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
        name="Session"
        component={SessionScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="Recording"
        component={RecordingScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
          animation: "fade",
        }}
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
        name="PersonalizedMeditation"
        component={PersonalizedMeditationScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
          animation: "fade",
        }}
      />
    </Stack.Navigator>
  );
}
