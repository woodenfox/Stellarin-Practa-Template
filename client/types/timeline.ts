export type TimelineItemType = "journal" | "meditation" | "reflection" | "milestone";

export interface TimelineItemContent {
  type: "text" | "audio";
  value?: string;
  audioUri?: string;
  audioDuration?: number;
  transcription?: string;
}

export interface TimelineItemMetadata {
  source: "user" | "ai" | "system";
  practaType?: string;
  flowId?: string;
  duration?: number;
  riceEarned?: number;
  meditationType?: "silent" | "personalized";
  meditationName?: string;
  [key: string]: unknown;
}

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  content?: TimelineItemContent;
  metadata: TimelineItemMetadata;
  createdAt: string;
  date: string;
}

export interface TimelinePublishPayload {
  type: TimelineItemType;
  content?: TimelineItemContent;
  metadata?: Partial<TimelineItemMetadata>;
}
