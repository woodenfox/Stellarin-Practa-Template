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
};

export function createPracta(type: string, id?: string): PractaDefinition {
  const definition = PRACTA_DEFINITIONS[type];
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
