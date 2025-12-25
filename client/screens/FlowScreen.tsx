import React, { useEffect, useCallback, useState, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { FlowCelebration } from "@/components/FlowCelebration";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { useFlow, useCurrentPracta } from "@/context/FlowContext";
import { FlowDefinition, FlowExecutionState, PractaOutput, PractaType, PractaContext, PractaCompleteHandler } from "@/types/flow";
import { JournalPracta, SilentMeditationPracta, PersonalizedMeditationPracta, TendPracta } from "@/practa";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useMeditation } from "@/context/MeditationContext";
import { useTimeline } from "@/context/TimelineContext";

interface PractaComponentProps {
  context: PractaContext;
  onComplete: PractaCompleteHandler;
  onSkip?: () => void;
}

type PractaComponent = React.ComponentType<PractaComponentProps>;

const PRACTA_COMPONENTS: Record<PractaType, PractaComponent> = {
  "journal": JournalPracta,
  "silent-meditation": SilentMeditationPracta,
  "personalized-meditation": PersonalizedMeditationPracta,
  "tend": TendPracta,
};

type FlowRouteProp = RouteProp<RootStackParamList, "Flow">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FlowScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FlowRouteProp>();
  const { startFlow, currentFlow, abortFlow, setOnFlowComplete } = useFlow();
  const { practa, context, complete } = useCurrentPracta();
  const { addJournalEntry, addSession, addFlowCompletion, sessions, journalEntries, tendCompletions } = useMeditation();
  const { publish: addItem } = useTimeline();
  
  const [totalRiceEarned, setTotalRiceEarned] = useState(0);

  const { flow } = route.params;

  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const hasActivity =
        sessions.some((s) => s.date === dateStr) ||
        journalEntries.some((e) => e.date === dateStr) ||
        tendCompletions.some((c) => c.date === dateStr);

      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }, [sessions, journalEntries, tendCompletions]);

  const persistPractaOutput = useCallback(async (type: PractaType, output: PractaOutput) => {
    if (output.metadata?.skipped) return;

    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();
    let riceFromAction = 0;

    if (type === "journal" && output.content?.type === "text") {
      const entry = {
        id: Date.now().toString(),
        date: today,
        content: output.content.value,
        createdAt: now,
        type: "text" as const,
      };
      riceFromAction = await addJournalEntry(entry);

      await addItem({
        type: "journal",
        content: {
          type: "text",
          value: output.content.value,
        },
        metadata: output.metadata,
      });
    } else if (type === "silent-meditation" || type === "personalized-meditation") {
      const duration = (output.metadata?.duration as number) || 180;
      riceFromAction = Math.floor(duration / 60) * 10;

      const session = {
        id: Date.now().toString(),
        date: today,
        duration,
        riceEarned: riceFromAction,
        completedAt: now,
      };
      await addSession(session);

      await addItem({
        type: "meditation",
        content: {
          type: "text",
          value: `${Math.floor(duration / 60)} minute meditation`,
        },
        metadata: {
          ...output.metadata,
          duration,
          riceEarned: riceFromAction,
          meditationType: type === "personalized-meditation" ? "personalized" : "silent",
          meditationName: type === "personalized-meditation" 
            ? (output.metadata?.meditationName as string) || "Personalized Meditation"
            : "Silent Meditation",
        },
      });
    } else if (type === "tend" && output.metadata?.cardTitle) {
      await addItem({
        type: "milestone",
        content: {
          type: "text",
          value: output.metadata.cardPrompt as string,
        },
        metadata: {
          source: "system",
          cardId: output.metadata.cardId as string,
          cardTitle: output.metadata.cardTitle as string,
          practaType: "tend",
        },
      });
    }

    if (riceFromAction > 0) {
      setTotalRiceEarned(prev => prev + riceFromAction);
    }
  }, [addJournalEntry, addSession, addItem]);

  useEffect(() => {
    setTotalRiceEarned(0);
    startFlow(flow);

    setOnFlowComplete(() => (flowState: FlowExecutionState) => {
      const hasCompletedPracta = flowState.practaOutputs.some(
        (output: PractaOutput) => !output.metadata?.skipped
      );
      if (hasCompletedPracta) {
        addFlowCompletion(flow.id);
      }
    });

    return () => {
      setOnFlowComplete(() => undefined);
    };
  }, [flow, startFlow, setOnFlowComplete, addFlowCompletion]);

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

  const handleComplete = useCallback(async (output: PractaOutput) => {
    if (practa) {
      await persistPractaOutput(practa.type, output);
    }
    complete(output);
  }, [complete, practa, persistPractaOutput]);

  if (!currentFlow || currentFlow.status === "aborted") {
    return null;
  }

  const handleContinue = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (currentFlow.status === "completed") {
    return (
      <FlowCelebration
        flow={currentFlow.flowDefinition}
        riceEarned={totalRiceEarned}
        streak={currentStreak}
        onContinue={handleContinue}
      />
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
        {(() => {
          const PractaComponent = PRACTA_COMPONENTS[practa.type];
          if (!PractaComponent) return null;
          return (
            <PractaComponent
              context={context}
              onComplete={handleComplete}
              onSkip={totalSteps > 1 ? handleSkip : undefined}
            />
          );
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
