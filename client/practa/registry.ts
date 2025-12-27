import { FlowDefinition, PractaDefinition } from "@/types/flow";

export interface PractaMetadata {
  type: string;
  name: string;
  description: string;
  author: string;
  version: string;
  estimatedDuration?: number;
}

export const PRACTA_DEFINITIONS: Record<string, Omit<PractaDefinition, "id">> = {
  "my-practa": {
    type: "my-practa" as any,
    name: "My Practa",
    description: "Your custom Practa - edit my-practa/index.tsx",
  },
  "breathing-pause": {
    type: "breathing-pause" as any,
    name: "Breathing Pause",
    description: "A guided breathing exercise with animated orb and audio",
  },
  "gratitude-prompt": {
    type: "gratitude-prompt" as any,
    name: "Gratitude Prompt",
    description: "A simple text input for gratitude reflection",
  },
  "tap-counter": {
    type: "tap-counter" as any,
    name: "Tap Counter",
    description: "A basic interactive tap counter with animations",
  },
};

export function createPracta(type: string, id?: string): PractaDefinition {
  const definition = PRACTA_DEFINITIONS[type];
  if (!definition) {
    return {
      id: id || `${type}_${Date.now()}`,
      type: type as any,
      name: type,
      description: "",
    };
  }
  return {
    ...definition,
    id: id || `${type}_${Date.now()}`,
  } as PractaDefinition;
}

export function createFlow(
  name: string,
  practaTypes: string[],
  options?: { id?: string; description?: string }
): FlowDefinition {
  return {
    id: options?.id || `flow_${Date.now()}`,
    name,
    description: options?.description,
    practas: practaTypes.map((type, index) => createPracta(type, `${type}_${index}`)),
  };
}
