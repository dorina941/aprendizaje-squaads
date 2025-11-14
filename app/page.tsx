"use client";


import { useState, useEffect, ChangeEvent } from "react";

/* ---------- Tipos ---------- */

type Task = {
  id: string;
  text: string;
  done: boolean;
};

type Entry = {
  id: string;
  date: string; // YYYY-MM-DD
  notes: string;
  hours?: number; // horas de estudio ese día
};

type VideoStatus = "to_watch" | "watched" | "mastered";

type Video = {
  id: string;
  title: string;
  url: string;
  status: VideoStatus;
};

type Screenshot = {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string; // ISO
};

const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
  to_watch: "Por ver",
  watched: "Visto",
  mastered: "Visto y aprendido",
};

const VIDEO_STATUS_BADGE_CLASSES: Record<VideoStatus, string> = {
  to_watch: "bg-amber-50 text-amber-700 border border-amber-200",
  watched: "bg-sky-50 text-sky-700 border border-sky-200",
  mastered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

/* ---------- Helpers ---------- */

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
// Hook para usar localStorage SIN romper la hidratación
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  // 1) Al montar en el cliente, leemos de localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      // si falla, nos quedamos con initial
    }
  }, [key]);

  // 2) Cada vez que cambie `value`, lo guardamos
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // si falla, no pasa nada
    }
  }, [key, value]);

  return [value, setValue] as const;
}


// “PDF” usando la impresión del navegador (Guardar como PDF)
function exportPDF(
  entries: Entry[],
  tasks: Task[],
  videos: Video[],
  screenshots: Screenshot[]
) {
  if (typeof window === "undefined") return;

  const sortedEntries = entries
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const htmlEntries =
    sortedEntries.length === 0
      ? "<p><em>Sin entradas todavía.</em></p>"
      : sortedEntries
          .map((e) => {
            const fecha = new Date(e.date).toLocaleDateString("es-ES");
            const horas = e.hours ?? 0;
            return `
            <section style="margin-bottom: 16px;">
              <h2 style="font-size: 16px; margin: 0 0 4px;">${fecha}</h2>
              <p style="margin: 0 0 4px;"><strong>Horas de estudio:</strong> ${horas}</p>
              <pre style="white-space: pre-wrap; font-size: 12px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0;">${e.notes}</pre>
            </section>
          `;
          })
          .join("");

  const htmlTasks =
    tasks.length === 0
      ? "<p><em>Sin tareas registradas.</em></p>"
      : `<ul>${tasks
          .map(
            (t) =>
              `<li>[${t.done ? "x" : " "}] ${
                t.text.trim() || "(sin descripción)"
              }</li>`
          )
          .join("")}</ul>`;

  const htmlVideos =
    videos.length === 0
      ? "<p><em>Sin vídeos registrados.</em></p>"
      : `<ul>${videos
          .map((v) => {
            const estado = VIDEO_STATUS_LABELS[v.status];
            const url = v.url || "(sin enlace)";
            return `<li><strong>${v.title}</strong><br/>Estado: ${estado}<br/>Enlace: ${url}</li>`;
          })
          .join("")}</ul>`;

  const htmlScreenshots =
    screenshots.length === 0
      ? "<p><em>Sin capturas registradas.</em></p>"
      : `<div style="display:flex;flex-wrap:wrap;gap:12px;">${screenshots
          .map(
            (s) => `
        <figure style="width:180px;">
          <img src="${s.dataUrl}" alt="${s.name}" style="width:100%;height:auto;border-radius:8px;border:1px solid #e5e7eb;"/>
          <figcaption style="font-size:11px;color:#4b5563;margin-top:4px;word-break:break-word;">
            ${s.name}<br/>
            <span style="font-size:10px;color:#9ca3af;">${new Date(
              s.createdAt
            ).toLocaleString("es-ES")}</span>
          </figcaption>
        </figure>`
          )
          .join("")}</div>`;

  const win = window.open("", "_blank");
  if (!win) return;

  const docHtml = `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Diario de Aprendizaje Squaads</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 24px;
          color: #0f172a;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 4px;
        }
        h2 {
          color: #0f172a;
        }
        h3 {
          margin-top: 16px;
        }
        hr {
          margin: 16px 0;
          border: none;
          border-top: 1px solid #e5e7eb;
        }
        small {
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <h1>Diario de Aprendizaje Squaads</h1>
      <small>Generado: ${new Date().toLocaleString("es-ES")}</small>
      <hr />
      <h2>Entradas del diario</h2>
      ${htmlEntries}
      <hr />
      <h2>Tareas</h2>
      ${htmlTasks}
      <hr />
      <h2>Vídeos de estudio</h2>
      ${htmlVideos}
      <hr />
      <h2>Capturas de pantalla</h2>
      ${htmlScreenshots}
      <script>
        window.onload = function () {
          window.print();
        }
      </script>
    </body>
  </html>
  `;

  win.document.write(docHtml);
  win.document.close();
}

/* ---------- Página principal ---------- */

export default function Home() {
  const today = new Date().toISOString().slice(0, 10);

  // tareas
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    "aprendizaje-squaads-tasks",
    []
  );
  const [newTaskText, setNewTaskText] = useState("");

  // entradas del diario (tipo blog)
  const [entries, setEntries] = useLocalStorage<Entry[]>(
    "aprendizaje-squaads-entries",
    []
  );
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [entryText, setEntryText] = useState("");
  const [entryHours, setEntryHours] = useState<string>("");

  // vídeos
  const [videos, setVideos] = useLocalStorage<Video[]>(
    "aprendizaje-squaads-videos",
    []
  );
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoStatus, setVideoStatus] = useState<VideoStatus>("to_watch");

  // capturas
  const [screenshots, setScreenshots] = useLocalStorage<Screenshot[]>(
    "aprendizaje-squaads-screenshots",
    []
  );

  const completedTasks = tasks.filter((t) => t.done).length;
  const totalHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);

  /* ----- acciones tareas ----- */

  function addTask() {
    const text = newTaskText.trim();
    if (!text) return;
    const newTask: Task = { id: createId(), text, done: false };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskText("");
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  /* ----- acciones diario (blog) ----- */

  function saveEntry() {
    const notes = entryText.trim();
    const hoursStr = entryHours.trim();

    if (!notes && !hoursStr) return;

    const hoursRaw = entryHours.replace(",", ".").trim();
    const h = Number(hoursRaw);
    const safeHours = !hoursRaw ? 0 : isNaN(h) || h < 0 ? 0 : h;

    const newEntry: Entry = {
      id: createId(), // siempre nueva entrada, aunque sea mismo día
      date: selectedDate,
      notes,
      hours: safeHours,
    };

    setEntries((prev) => [newEntry, ...prev]);

    // limpiar formulario para que cada entrada sea independiente
    setEntryText("");
    setEntryHours("");
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  /* ----- acciones vídeos ----- */

  function addVideo() {
    const rawTitle = videoTitle.trim();
    const rawUrl = videoUrl.trim();

    if (!rawTitle && !rawUrl) return;

    const title = rawTitle || rawUrl || "Vídeo sin título";

    const newVideo: Video = {
      id: createId(),
      title,
      url: rawUrl,
      status: videoStatus,
    };

    setVideos((prev) => [newVideo, ...prev]);
    setVideoTitle("");
    setVideoUrl("");
    setVideoStatus("to_watch");
  }

  function changeVideoStatus(id: string, status: VideoStatus) {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status } : v))
    );
  }

  function deleteVideo(id: string) {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  /* ----- acciones capturas ----- */

  function handleScreenshotChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const newScreenshot: Screenshot = {
            id: createId(),
            name: file.name,
            dataUrl: result,
            createdAt: new Date().toISOString(),
          };
          setScreenshots((prev) => [newScreenshot, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    });

    // permitir volver a seleccionar el mismo archivo
    e.target.value = "";
  }

  function deleteScreenshot(id: string) {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  }

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Cabecera */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-purple-500/10 px-6 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.7)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                Squaads
              </p>
              <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-slate-50">
                Diario de Aprendizaje
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Tu blog personal de estudio: notas, tareas, vídeos y capturas en
                un solo lugar.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs text-slate-300 shadow-inner">
                <p className="font-semibold text-slate-100 mb-1">
                  Resumen rápido
                </p>
                <p>
                  ⏱️ Horas totales:{" "}
                  <span className="font-semibold text-emerald-300">
                    {totalHours.toFixed(1)} h
                  </span>
                </p>
                <p>
                  📌 Tareas:{" "}
                  <span className="font-semibold text-sky-300">
                    {completedTasks}/{tasks.length}
                  </span>{" "}
                  completadas
                </p>
                <p>
                  🎞️ Vídeos aprendidos:{" "}
                  <span className="font-semibold text-purple-300">
                    {videos.filter((v) => v.status === "mastered").length}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() =>
                    exportPDF(entries, tasks, videos, screenshots)
                  }
                  className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-100 hover:border-fuchsia-400 hover:text-fuchsia-200 transition"
                >
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.5fr,1.1fr]">
          {/* Columna izquierda: diario + vídeos + capturas */}
          <div className="space-y-6">
            {/* Entrada del día */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.9)]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-semibold text-slate-50">
                  Nueva entrada ✍️
                </h2>
                <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-300">
                  Blog de estudio
                </span>
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>
                  📅 Fecha:{" "}
                  <input
                    type="date"
                    className="ml-1 rounded-xl border border-slate-700 bg-slate-950/80 px-2 py-1 text-xs text-slate-100 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-500/60"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </span>
                <span>
                  ⏱️ Horas:{" "}
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="ml-1 inline-flex w-20 rounded-xl border border-slate-700 bg-slate-950/80 px-2 py-1 text-xs text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/60"
                    placeholder="0"
                    value={entryHours}
                    onChange={(e) => setEntryHours(e.target.value)}
                  />{" "}
                  <span className="text-slate-500">h aprox</span>
                </span>
              </div>

              <textarea
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-100 shadow-inner outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60 min-h-[120px]"
                placeholder="Cuenta qué has aprendido hoy, qué te ha costado, qué te ha salido bien..."
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={saveEntry}
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 shadow hover:bg-sky-400 hover:shadow-[0_10px_25px_rgba(56,189,248,0.35)] active:translate-y-[1px] transition"
                >
                  Guardar entrada
                </button>
              </div>
            </section>

            {/* Historial de entradas (tipo blog) */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.9)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-50">
                  Entradas anteriores 📚
                </h2>
                <span className="text-[11px] text-slate-400">
                  {entries.length} entrada(s)
                </span>
              </div>
              {entries.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Aún no tienes entradas guardadas. Escribe algo arriba y pulsa{" "}
                  <span className="font-semibold">Guardar entrada</span>.
                </p>
              ) : (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {entries
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((entry) => (
                      <article
                        key={entry.id}
                        className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm transition hover:border-sky-500/70 hover:bg-slate-900/90"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-sky-300">
                              {new Date(entry.date).toLocaleDateString("es-ES")}
                            </span>
                            <span className="text-[11px] text-emerald-300">
                              {(entry.hours ?? 0).toFixed(1)} h
                            </span>
                          </div>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="text-[11px] text-slate-400 hover:text-red-400 transition"
                          >
                            Borrar
                          </button>
                        </div>
                        <p className="whitespace-pre-wrap text-slate-100 text-xs sm:text-sm">
                          {entry.notes}
                        </p>
                      </article>
                    ))}
                </div>
              )}
            </section>

            {/* Vídeos */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.9)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-50">
                  Vídeos de estudio 🎥
                </h2>
                <span className="text-[11px] text-slate-400">
                  {videos.length} vídeo(s)
                </span>
              </div>

              {/* Formulario para añadir vídeo */}
              <form
                className="space-y-3 mb-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  addVideo();
                }}
              >
                <input
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 p-2.5 text-sm text-slate-100 shadow-inner outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/60"
                  placeholder="Título del vídeo (Ej. Curso básico de Node.js)"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
                <input
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 p-2.5 text-sm text-slate-100 shadow-inner outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/60"
                  placeholder="Enlace (https://...)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <select
                    className="rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 shadow-inner outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/60"
                    value={videoStatus}
                    onChange={(e) =>
                      setVideoStatus(e.target.value as VideoStatus)
                    }
                  >
                    <option value="to_watch">Por ver</option>
                    <option value="watched">Visto</option>
                    <option value="mastered">Visto y aprendido</option>
                  </select>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow hover:bg-emerald-400 hover:shadow-[0_10px_25px_rgba(16,185,129,0.35)] active:translate-y-[1px] transition"
                  >
                    Añadir vídeo
                  </button>
                </div>
              </form>

              {/* Lista de vídeos */}
              {videos.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Aquí podrás ir apuntando los vídeos que quieres ver y dominar.
                </p>
              ) : (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {videos.map((video) => {
                    const href = video.url
                      ? video.url.startsWith("http")
                        ? video.url
                        : `https://${video.url}`
                      : "";

                    return (
                      <div
                        key={video.id}
                        className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm transition hover:border-emerald-500/70 hover:bg-slate-900/90"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-50 text-sm">
                              {video.title}
                            </p>
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-emerald-300 underline decoration-dotted underline-offset-2 break-all hover:text-emerald-200"
                              >
                                Abrir vídeo · {href}
                              </a>
                            ) : (
                              <p className="text-xs text-slate-500">
                                Sin enlace guardado para este vídeo.
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteVideo(video.id)}
                            className="text-[11px] text-slate-400 hover:text-red-400 transition"
                          >
                            Borrar
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            Estado:
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${VIDEO_STATUS_BADGE_CLASSES[video.status]}`}
                          >
                            {VIDEO_STATUS_LABELS[video.status]}
                          </span>
                          <select
                            className="ml-auto rounded-xl border border-slate-700 bg-slate-950/80 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/60"
                            value={video.status}
                            onChange={(e) =>
                              changeVideoStatus(
                                video.id,
                                e.target.value as VideoStatus
                              )
                            }
                          >
                            <option value="to_watch">
                              {VIDEO_STATUS_LABELS["to_watch"]}
                            </option>
                            <option value="watched">
                              {VIDEO_STATUS_LABELS["watched"]}
                            </option>
                            <option value="mastered">
                              {VIDEO_STATUS_LABELS["mastered"]}
                            </option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Capturas de pantalla */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.9)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-50">
                  Capturas de pantalla 🖼️
                </h2>
                <span className="text-[11px] text-slate-400">
                  {screenshots.length} captura(s)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Guarda capturas de código, resultados o cualquier cosa
                importante de tu día de estudio.
              </p>

              <div className="mb-4">
                <label
                  htmlFor="screenshot-input"
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 shadow hover:bg-amber-400 hover:shadow-[0_10px_25px_rgba(245,158,11,0.35)] active:translate-y-[1px] transition cursor-pointer"
                >
                  Añadir captura
                </label>
                <input
                  id="screenshot-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleScreenshotChange}
                />
              </div>

              {screenshots.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Cuando subas capturas, aparecerán aquí en forma de galería 📸
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[260px] overflow-y-auto pr-1">
                  {screenshots.map((shot) => (
                    <div
                      key={shot.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-2 flex flex-col gap-2"
                    >
                      <div className="relative w-full pb-[60%] overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                        <img
                          src={shot.dataUrl}
                          alt={shot.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <p className="text-[11px] text-slate-100 truncate">
                          {shot.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(shot.createdAt).toLocaleString("es-ES")}
                        </p>
                        <button
                          onClick={() => deleteScreenshot(shot.id)}
                          className="mt-1 self-start text-[11px] text-slate-400 hover:text-red-400 transition"
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Columna derecha: tareas */}
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.9)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-50">
                  Tareas y objetivos del día ✅
                </h2>
                <span className="text-[11px] text-slate-400">
                  {tasks.length} tarea(s)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Divide tu día en pequeñas tareas. Cuantas más marques como
                hechas, más satisfacción mental 💪
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  className="flex-1 rounded-2xl border border-slate-700 bg-slate-950/60 p-2.5 text-sm text-slate-100 shadow-inner outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
                  placeholder="Ej. Hacer 30 minutos de práctica con Node.js"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
                <button
                  onClick={addTask}
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 shadow hover:bg-sky-400 hover:shadow-[0_10px_25px_rgba(56,189,248,0.35)] active:translate-y-[1px] transition"
                >
                  Añadir tarea
                </button>
              </div>

              {tasks.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Cuando añadas tareas, aparecerán aquí para que puedas
                  marcarlas como completadas ✅
                </p>
              ) : (
                <ul className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-2.5 text-sm transition hover:border-sky-500/60 hover:bg-slate-900/90"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-400 focus:ring-sky-500"
                        checked={task.done}
                        onChange={() => toggleTask(task.id)}
                      />
                      <div className="flex-1">
                        <p
                          className={
                            task.done
                              ? "text-slate-500 line-through"
                              : "text-slate-100"
                          }
                        >
                          {task.text}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-[11px] text-slate-400 hover:text-red-400 transition"
                      >
                        Borrar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <footer className="mt-4 text-[11px] text-slate-500 text-center">
          Aprendizaje Squaads — tu blog de progreso se guarda en este navegador
          💾
        </footer>
      </div>
    </main>
  );
}
