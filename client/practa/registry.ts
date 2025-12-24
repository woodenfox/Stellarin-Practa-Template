import { PractaType, FlowDefinition, PractaDefinition } from "@/types/flow";

export const PRACTA_DEFINITIONS: Record<PractaType, Omit<PractaDefinition, "id">> = {
  "journal": {
    type: "journal",
    name: "Journal",
    description: "Write or record your thoughts and feelings",
  },
  "silent-meditation": {
    type: "silent-meditation",
    name: "Silent Meditation",
    description: "A timed meditation session with a gong",
  },
  "personalized-meditation": {
    type: "personalized-meditation",
    name: "Personalized Meditation",
    description: "AI-generated meditation based on your reflections",
  },
};

export function createPracta(type: PractaType, id?: string): PractaDefinition {
  const definition = PRACTA_DEFINITIONS[type];
  return {
    ...definition,
    id: id || `${type}_${Date.now()}`,
  };
}

export function createFlow(
  name: string,
  practaTypes: PractaType[],
  options?: { id?: string; description?: string }
): FlowDefinition {
  return {
    id: options?.id || `flow_${Date.now()}`,
    name,
    description: options?.description,
    practas: practaTypes.map((type, index) => createPracta(type, `${type}_${index}`)),
  };
}

export const PRESET_FLOWS = {
  morningReflection: createFlow(
    "Morning Reflection",
    ["journal", "personalized-meditation"],
    {
      id: "morning-reflection",
      description: "Journal your thoughts, then receive a personalized meditation",
    }
  ),
  quickMeditation: createFlow(
    "Quick Meditation",
    ["silent-meditation"],
    {
      id: "quick-meditation",
      description: "A simple timed meditation",
    }
  ),
  deepDive: createFlow(
    "Deep Dive",
    ["journal", "silent-meditation"],
    {
      id: "deep-dive",
      description: "Journal then sit with your thoughts in silence",
    }
  ),
};
