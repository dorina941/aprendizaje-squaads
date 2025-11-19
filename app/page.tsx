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

// 🔍 Tipo para los resultados de búsqueda
type SearchResult = {
  date: string;
  snippet: string;
};

export default function HomePage() {
  const router = useRouter();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0 = enero

  // 🔍 texto que escribes en la barra de búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  const { days } = useCalendarData();

  // 🔍 normalizamos lo que escribes
  const normalizedSearch = searchTerm.toLowerCase().trim();

  // 🔍 calculamos resultados de búsqueda
  // 👉 CAMBIADO: ahora SOLO busca en los LINKS (title + url)
  const searchResults: SearchResult[] = normalizedSearch
    ? Object.entries(days)
      .map(([date, rawDay]) => {
        const day: any = rawDay || {};

        // Solo nos interesan los links
        const linksArray = Array.isArray(day.links) ? day.links : [];

        // Si no hay links, este día no entra en la búsqueda
        if (linksArray.length === 0) {
          return null;
        }

        // Texto de todos los links (títulos + urls)
        const linksText = linksArray
          .map((l: any) => `${l?.title ?? ""} ${l?.url ?? ""}`)
          .join(" ")
          .toLowerCase();

        // Si el término no está en los links, descartamos este día
        if (!linksText.includes(normalizedSearch)) {
          return null;
        }

        // Snippet: usamos el primer link (título o url) y lo recortamos
        const firstLink = linksArray[0] || {};
        let snippet =
          (typeof firstLink.title === "string" && firstLink.title) ||
          (typeof firstLink.url === "string" && firstLink.url) ||
          "";

        if (snippet.length > 120) {
          snippet = snippet.slice(0, 117) + "...";
        }

        return {
          date,
          snippet,
        } as SearchResult;
      })
      .filter((item): item is SearchResult => item !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
    : [];

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
    <main className="min-h-screen bg-gradient-to-b from-[#4A271B] via-[#2c1a13] to-[#120806] text-slate-100 flex justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* 🔍 HEADER: añadimos la lupa a la derecha, sin tocar tu texto */}
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">Calendario de estudio</h1>
            <p className="text-sm text-yellow-500">
              Haz clic en un día para ver o editar tu “blog” de ese día.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por palabras..."
                className="w-full rounded-full border border-slate-700/70 bg-black/40 backdrop-blur-sm py-1.5 pl-7 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/70 shadow-md shadow-black/40"
              />
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-1 text-[10px] text-slate-400 hover:text-slate-200"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        </header>

        {/* ⬇️ TU CALENDARIO TAL CUAL ESTABA */}
        <section className="bg-[#1FA3AA] rounded-3xl border border-[#0B6A6F] p-6 shadow-[0_22px_55px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPrevMonth}
              className="text-sm border border-white/40 bg-white/10 rounded-full px-3 py-1 hover:bg-white/20 transition-colors shadow-sm"
            >
              ◀
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {monthNames[month]} {year}
              </div>
              <div className="text-xs text-slate-400">

              </div>
            </div>
            <button
              onClick={goToNextMonth}
              className="text-sm border border-slate-700 rounded px-2 py-1"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs text-slate-100 mb-2">
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
                    "aspect-square rounded-xl border text-sm flex flex-col items-center justify-center gap-1 transition-transform transition-colors duration-150 hover:-translate-y-0.5",
                    hasData
                      ? "border-[#243663] bg-[#DEA243] text-black"
                      : "border-[#2E4682] bg-[#22376B] hover:border-[#E089B7]"
                  ].join(" ")}
                >
                  <span className="font-semibold">{dayNumber}</span>

                  {hasData ? (
                    // ⭐ Día completado
                    <span className="text-[28px] text-[#FFD700]">⭐</span>
                  ) : (
                    // 📚 Día sin completar
                    <span className="text-[10px] text-[
#75E1FF] opacity-100 text-center leading-tight">
                      ¿Qué aprendiste hoy?
                    </span>

                  )}

                </button>
              );
            })}
          </div>
        </section>

        {/* 🔍 RESULTADOS DE BÚSQUEDA DEBAJO DEL CALENDARIO */}
        {normalizedSearch && (
          <section className="mt-6 bg-[#0B1020] rounded-2xl border border-slate-800/80 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.7)]">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              Resultados de búsqueda ({searchResults.length})
            </h2>

            {searchResults.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No hay coincidencias para "{searchTerm}".
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                {searchResults.map((item) => {
                  const date = new Date(item.date);
                  const formattedDate = date.toLocaleDateString("es-ES", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <li key={item.date}>
                      <button
                        type="button"
                        onClick={() => router.push(`/dia/${item.date}`)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-700/80 px-3 py-2 text-left hover:border-yellow-400 hover:bg-yellow-400/5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[11px] font-medium text-slate-300">
                            {formattedDate}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Día: {item.date}
                          </div>
                        </div>

                        {item.snippet ? (
                          <div className="mt-1 text-[11px] text-slate-100">
                            {item.snippet}
                          </div>
                        ) : (
                          <div className="mt-1 text-[11px] text-slate-500">
                            Sin texto en los links.
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <footer className="mt-6 text-[11px] text-slate-500 text-center">
          Aprendizaje Squaads — vista calendario (datos guardados en este
          navegador) 💾
        </footer>
      </div>
    </main>
  );
}
