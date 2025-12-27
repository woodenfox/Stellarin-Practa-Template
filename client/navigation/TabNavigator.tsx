import React from "react";
import { StyleSheet, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { BlurView } from "expo-blur";

import MyPractaScreen from "@/screens/MyPractaScreen";
import EditPractaScreen from "@/screens/EditPractaScreen";
import HowToScreen from "@/screens/HowToScreen";
import PublishScreen from "@/screens/PublishScreen";
import DevScreen from "@/screens/DevScreen";

export type TabParamList = {
  MyPracta: undefined;
  EditPracta: undefined;
  HowTo: undefined;
  Publish: undefined;
  Dev: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="MyPracta"
        component={MyPractaScreen}
        options={{
          tabBarLabel: "My Practa",
          tabBarIcon: ({ color, size }) => (
            <Feather name="layers" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EditPracta"
        component={EditPractaScreen}
        options={{
          tabBarLabel: "Edit",
          tabBarIcon: ({ color, size }) => (
            <Feather name="edit-3" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HowTo"
        component={HowToScreen}
        options={{
          tabBarLabel: "How To",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Publish"
        component={PublishScreen}
        options={{
          tabBarLabel: "Publish",
          tabBarIcon: ({ color, size }) => (
            <Feather name="upload-cloud" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Dev"
        component={DevScreen}
        options={{
          tabBarLabel: "Dev",
          tabBarIcon: ({ color, size }) => (
            <Feather name="code" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: "transparent",
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
});
