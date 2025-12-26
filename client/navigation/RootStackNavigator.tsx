import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PreviewScreen from "@/screens/PreviewScreen";
import FlowScreen from "@/screens/FlowScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { FlowDefinition } from "@/types/flow";

export type RootStackParamList = {
  Preview: undefined;
  Flow: { flow: FlowDefinition };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Preview"
        component={PreviewScreen}
        options={{ headerShown: false }}
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
