import React, { useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useFlow, useCurrentPracta } from "@/context/FlowContext";
import { FlowDefinition, PractaOutput } from "@/types/flow";
import { JournalPracta, SilentMeditationPracta, PersonalizedMeditationPracta } from "@/practa";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type FlowRouteProp = RouteProp<RootStackParamList, "Flow">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FlowScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FlowRouteProp>();
  const { startFlow, currentFlow, abortFlow, setOnFlowComplete } = useFlow();
  const { practa, context, complete } = useCurrentPracta();

  const { flow } = route.params;

  useEffect(() => {
    startFlow(flow);

    setOnFlowComplete((completedFlow) => {
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    });

    return () => {
      setOnFlowComplete(undefined);
    };
  }, [flow, startFlow, setOnFlowComplete, navigation]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    abortFlow();
    navigation.goBack();
  }, [abortFlow, navigation]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const emptyOutput: PractaOutput = {
      metadata: { skipped: true },
    };
    complete(emptyOutput);
  }, [complete]);

  const handleComplete = useCallback((output: PractaOutput) => {
    complete(output);
  }, [complete]);

  if (!currentFlow || currentFlow.status === "aborted") {
    return null;
  }

  if (currentFlow.status === "completed") {
    return (
      <View
        style={[
          styles.container,
          styles.centeredContainer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={[styles.successIcon, { backgroundColor: theme.primary }]}>
          <Feather name="check" size={48} color="#FFFFFF" />
        </View>
        <ThemedText type="h2" style={styles.completeTitle}>
          Flow Complete
        </ThemedText>
        <ThemedText style={[styles.completeSubtitle, { color: theme.textSecondary }]}>
          You've completed {currentFlow.flowDefinition.name}
        </ThemedText>
      </View>
    );
  }

  if (!practa || !context) {
    return null;
  }

  const showCloseButton = currentFlow.currentIndex === 0;
  const totalSteps = currentFlow.flowDefinition.practas.length;
  const currentStep = currentFlow.currentIndex + 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        {showCloseButton ? (
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Feather name="x" size={24} color={theme.textSecondary} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}

        {totalSteps > 1 ? (
          <View style={styles.progressIndicator}>
            {currentFlow.flowDefinition.practas.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      index < currentStep
                        ? theme.primary
                        : index === currentFlow.currentIndex
                        ? theme.primary
                        : theme.border,
                  },
                ]}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.placeholder} />
      </View>

      <View style={styles.practaContainer}>
        {practa.type === "journal" ? (
          <JournalPracta
            context={context}
            onComplete={handleComplete}
            onSkip={totalSteps > 1 ? handleSkip : undefined}
          />
        ) : practa.type === "silent-meditation" ? (
          <SilentMeditationPracta
            context={context}
            onComplete={handleComplete}
            onSkip={totalSteps > 1 ? handleSkip : undefined}
          />
        ) : practa.type === "personalized-meditation" ? (
          <PersonalizedMeditationPracta
            context={context}
            onComplete={handleComplete}
            onSkip={totalSteps > 1 ? handleSkip : undefined}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  progressIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  practaContainer: {
    flex: 1,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  completeTitle: {
    marginBottom: Spacing.sm,
  },
  completeSubtitle: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});
