import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface MeditationSession {
  id: string;
  date: string;
  duration: number;
  riceEarned: number;
  completedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  createdAt: string;
}

interface MeditationState {
  totalRice: number;
  sessions: MeditationSession[];
  streakDays: string[];
  challengeProgress: number;
  selectedDuration: number;
  journalEntries: JournalEntry[];
  isLoading: boolean;
}

interface MeditationContextType extends MeditationState {
  setSelectedDuration: (duration: number) => void;
  addSession: (session: MeditationSession) => Promise<void>;
  addJournalEntry: (entry: JournalEntry) => Promise<number>;
  hasJournaledToday: () => boolean;
  getTodayStreak: () => boolean;
  getWeekStreaks: () => { day: string; completed: boolean; isToday: boolean }[];
}

const STORAGE_KEYS = {
  TOTAL_RICE: "@rice_meditation_total_rice",
  SESSIONS: "@rice_meditation_sessions",
  STREAK_DAYS: "@rice_meditation_streak_days",
  CHALLENGE_PROGRESS: "@rice_meditation_challenge",
  JOURNAL_ENTRIES: "@rice_meditation_journal",
};

const MeditationContext = createContext<MeditationContextType | undefined>(undefined);

export function MeditationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MeditationState>({
    totalRice: 0,
    sessions: [],
    streakDays: [],
    challengeProgress: 0,
    selectedDuration: 300,
    journalEntries: [],
    isLoading: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [totalRice, sessions, streakDays, challengeProgress, journalEntries] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOTAL_RICE),
        AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.STREAK_DAYS),
        AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_PROGRESS),
        AsyncStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES),
      ]);

      setState((prev) => ({
        ...prev,
        totalRice: totalRice ? parseInt(totalRice, 10) : 0,
        sessions: sessions ? JSON.parse(sessions) : [],
        streakDays: streakDays ? JSON.parse(streakDays) : [],
        challengeProgress: challengeProgress ? parseInt(challengeProgress, 10) : 0,
        journalEntries: journalEntries ? JSON.parse(journalEntries) : [],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to load meditation data:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const setSelectedDuration = useCallback((duration: number) => {
    setState((prev) => ({ ...prev, selectedDuration: duration }));
  }, []);

  const addSession = useCallback(async (session: MeditationSession) => {
    try {
      const newTotalRice = state.totalRice + session.riceEarned;
      const newSessions = [session, ...state.sessions];
      
      const today = new Date().toISOString().split("T")[0];
      const newStreakDays = state.streakDays.includes(today)
        ? state.streakDays
        : [today, ...state.streakDays];
      
      const newChallengeProgress = state.challengeProgress + 1;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOTAL_RICE, newTotalRice.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(newSessions)),
        AsyncStorage.setItem(STORAGE_KEYS.STREAK_DAYS, JSON.stringify(newStreakDays)),
        AsyncStorage.setItem(STORAGE_KEYS.CHALLENGE_PROGRESS, newChallengeProgress.toString()),
      ]);

      setState((prev) => ({
        ...prev,
        totalRice: newTotalRice,
        sessions: newSessions,
        streakDays: newStreakDays,
        challengeProgress: newChallengeProgress,
      }));
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }, [state.totalRice, state.sessions, state.streakDays, state.challengeProgress]);

  const addJournalEntry = useCallback(async (entry: JournalEntry) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const hasEntryToday = state.journalEntries.some(e => e.date === today);
      const riceBonus = hasEntryToday ? 0 : 10;
      
      const newEntries = [entry, ...state.journalEntries];
      const newTotalRice = state.totalRice + riceBonus;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(newEntries)),
        ...(riceBonus > 0 ? [AsyncStorage.setItem(STORAGE_KEYS.TOTAL_RICE, newTotalRice.toString())] : []),
      ]);

      setState((prev) => ({
        ...prev,
        journalEntries: newEntries,
        totalRice: newTotalRice,
      }));
      
      return riceBonus;
    } catch (error) {
      console.error("Failed to save journal entry:", error);
      return 0;
    }
  }, [state.journalEntries, state.totalRice]);

  const hasJournaledToday = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return state.journalEntries.some(e => e.date === today);
  }, [state.journalEntries]);

  const getTodayStreak = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return state.streakDays.includes(today);
  }, [state.streakDays]);

  const getWeekStreaks = useCallback(() => {
    const days = ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"];
    const today = new Date();
    const currentDayIndex = today.getDay();
    const saturdayOffset = currentDayIndex === 6 ? 0 : -(currentDayIndex + 1);
    
    return days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + saturdayOffset + index);
      const dateStr = date.toISOString().split("T")[0];
      const isToday = dateStr === today.toISOString().split("T")[0];
      
      return {
        day,
        completed: state.streakDays.includes(dateStr),
        isToday,
      };
    });
  }, [state.streakDays]);

  return (
    <MeditationContext.Provider
      value={{
        ...state,
        setSelectedDuration,
        addSession,
        addJournalEntry,
        hasJournaledToday,
        getTodayStreak,
        getWeekStreaks,
      }}
    >
      {children}
    </MeditationContext.Provider>
  );
}

export function useMeditation() {
  const context = useContext(MeditationContext);
  if (context === undefined) {
    throw new Error("useMeditation must be used within a MeditationProvider");
  }
  return context;
}
