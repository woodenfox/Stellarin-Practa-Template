import { ComponentType } from "react";
import { PractaContext, PractaCompleteHandler } from "@/types/flow";

import BreathingPause from "./breathing-pause";
import GratitudePrompt from "./gratitude-prompt";
import TapCounter from "./tap-counter";

export interface DemoPractaInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  component: ComponentType<{
    context: PractaContext;
    onComplete: PractaCompleteHandler;
    onSkip?: () => void;
  }>;
}

export const demoPractas: DemoPractaInfo[] = [
  {
    id: "breathing-pause",
    name: "Breathing Pause",
    description: "A guided breathing exercise with animated orb and audio",
    icon: "wind",
    component: BreathingPause,
  },
  {
    id: "gratitude-prompt",
    name: "Gratitude Prompt",
    description: "A simple text input for gratitude reflection",
    icon: "heart",
    component: GratitudePrompt,
  },
  {
    id: "tap-counter",
    name: "Tap Counter",
    description: "A basic interactive tap counter with animations",
    icon: "target",
    component: TapCounter,
  },
];

export function getDemoPracta(id: string): DemoPractaInfo | undefined {
  return demoPractas.find((p) => p.id === id);
}
