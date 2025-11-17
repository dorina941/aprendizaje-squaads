"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

export type LinkItem = {
  id: string;
  title: string;
  url: string;
};

export type CaptureItem = {
  id: string;
  title: string;
  url: string;
};

export type DayDetails = {
  date: string; // "2025-11-16"
  summary: string;
  links: LinkItem[];
  captures: CaptureItem[];
};

const TABLE_NAME = "calendar_days";
const LOCAL_STORAGE_KEY = "calendarDays";

type CalendarRow = {
  date: string;
  summary: string | null;
  links: LinkItem[] | null;
  captures: CaptureItem[] | null;
};

// ⭐ ESTE ES MUY IMPORTANTE ⭐
// Formatear fechas correctamente en hora LOCAL (no UTC)
export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDayDetails = (row: CalendarRow): DayDetails => ({
  date: row.date,
  summary: row.summary ?? "",
  links: row.links ?? [],
  captures: row.captures ?? [],
});

export function useCalendarData() {
  const [days, setDays] = useState<Record<string, DayDetails>>({});
  const hasLoadedLocal = useRef(false);

  // Leer datos locales primero
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        setDays(JSON.parse(raw));
      }
    } catch (error) {
      console.error("No se pudieron leer los días del localStorage:", error);
    } finally {
      hasLoadedLocal.current = true;
    }
  }, []);

  // Guardar cambios en localStorage
  useEffect(() => {
    if (!hasLoadedLocal.current) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(days));
    } catch (error) {
      console.error("No se pudieron guardar los días en localStorage:", error);
    }
  }, [days]);

  // Cargar desde Supabase
  useEffect(() => {
    let isMounted = true;

    const fetchDays = async () => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error cargando días desde Supabase:", error);
        return;
      }

      if (!data || !isMounted) return;

      const map: Record<string, DayDetails> = {};
      data.forEach((row) => {
        map[row.date] = toDayDetails(row as CalendarRow);
      });

      setDays((prev) => ({ ...prev, ...map }));
    };

    fetchDays();

    const channel = supabase
      .channel("public:calendar_days")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE_NAME }, fetchDays)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const getDay = (date: string): DayDetails => {
    return (
      days[date] ?? {
        date,
        summary: "",
        links: [],
        captures: [],
      }
    );
  };

  const saveDayToSupabase = async (day: DayDetails) => {
    const { error } = await supabase.from(TABLE_NAME).upsert(day);
    if (error) console.error("Error guardando día en Supabase:", error);
  };

  const updateDay = (
    date: string,
    updater: (prev: DayDetails) => DayDetails
  ) => {
    setDays((prev) => {
      const current =
        prev[date] ?? {
          date,
          summary: "",
          links: [],
          captures: [],
        };

      const next = updater(current);

      saveDayToSupabase(next).catch((err) => {
        console.error("Error guardando en Supabase:", err);
      });

      return {
        ...prev,
        [date]: next,
      };
    });
  };

  return { days, getDay, updateDay };
}
