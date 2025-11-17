"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCalendarData, formatDateLocal } from "./lib/calendarStorage";

// De Date a "YYYY-MM-DD" en HORA LOCAL (sin toISOString)
function formatDateKey(d: Date) {
  return formatDateLocal(d);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function HomePage() {
  const router = useRouter();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0 = enero

  const { days } = useCalendarData();

  const daysInMonth = getDaysInMonth(year, month);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const goToPrevMonth = () => {
    setMonth((prev) => {
      if (prev === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setMonth((prev) => {
      if (prev === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleClickDay = (dayNumber: number) => {
    const d = new Date(year, month, dayNumber);
    const dateKey = formatDateKey(d); // "YYYY-MM-DD" correcto en local
    router.push(`/dia/${dateKey}`);
  };

  // 👉 CALCULAR EN QUÉ DÍA DE LA SEMANA CAE EL 1 DEL MES
  const firstDayOfMonth = new Date(year, month, 1);
  const jsDow = firstDayOfMonth.getDay(); // 0 = domingo, 1 = lunes, ...
  // Queremos que la columna 0 sea Lunes, así que convertimos:
  const offset = (jsDow + 6) % 7; // 0 si es lunes, 1 si es martes, ..., 6 si es domingo

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Calendario de estudio</h1>
          <p className="text-sm text-slate-400">
            Haz clic en un día para ver o editar tu “blog” de ese día.
          </p>
        </header>

        <section className="bg-slate-900/70 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPrevMonth}
              className="text-sm border border-slate-700 rounded px-2 py-1"
            >
              ◀
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {monthNames[month]} {year}
              </div>
              <div className="text-xs text-slate-400">
                Los días con contenido se marcan en azul.
              </div>
            </div>
            <button
              onClick={goToNextMonth}
              className="text-sm border border-slate-700 rounded px-2 py-1"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs text-slate-400 mb-2">
            <div>L</div>
            <div>M</div>
            <div>X</div>
            <div>J</div>
            <div>V</div>
            <div>S</div>
            <div>D</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* huecos antes del día 1 para que encaje con L/M/X... */}
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {daysArray.map((dayNumber) => {
              const d = new Date(year, month, dayNumber);
              const key = formatDateKey(d);
              const hasData = !!days[key];

              return (
                <button
                  key={dayNumber}
                  onClick={() => handleClickDay(dayNumber)}
                  className={[
                    "aspect-square rounded-xl border text-sm flex flex-col items-center justify-center gap-1",
                    hasData
                      ? "border-blue-400 bg-blue-500/20"
                      : "border-slate-700 bg-slate-900/60 hover:border-blue-400",
                  ].join(" ")}
                >
                  <span className="font-semibold">{dayNumber}</span>
                  {hasData && (
                    <span className="text-[10px] text-blue-300">
                      hay contenido
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <footer className="mt-6 text-[11px] text-slate-500 text-center">
          Aprendizaje Squaads — vista calendario (datos guardados en este
          navegador) 💾
        </footer>
      </div>
    </main>
  );
}
