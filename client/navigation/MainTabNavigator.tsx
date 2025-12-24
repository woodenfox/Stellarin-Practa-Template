import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import HomeScreen from "@/screens/HomeScreen";
import TimelineScreen from "@/screens/TimelineScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import DevScreen from "@/screens/DevScreen";
import { useTheme } from "@/hooks/useTheme";
import { HeaderTitle } from "@/components/HeaderTitle";

const isDev = __DEV__;

export type MainTabParamList = {
  HomeTab: undefined;
  TimelineTab: undefined;
  CommunityTab: undefined;
  DevTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerTitleAlign: "center",
        headerTintColor: theme.text,
        headerStyle: {
          backgroundColor: theme.backgroundRoot,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: "Home",
          headerTitle: () => <HeaderTitle />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TimelineTab"
        component={TimelineScreen}
        options={{
          title: "Timeline",
          headerTitle: "Your Journey",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CommunityTab"
        component={CommunityScreen}
        options={{
          title: "Community",
          headerTitle: "Community & Mission",
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size} color={color} />
          ),
        }}
      />
      {isDev ? (
        <Tab.Screen
          name="DevTab"
          component={DevScreen}
          options={{
            title: "Dev",
            headerTitle: "Developer Tools",
            tabBarIcon: ({ color, size }) => (
              <Feather name="code" size={size} color={color} />
            ),
          }}
        />
      ) : null}
    </Tab.Navigator>
  );
}
