"use client";

import { useEffect, useState } from "react";

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
};

type VideoStatus = "to_watch" | "watched" | "mastered";

type Video = {
  id: string;
  title: string;
  url: string;
  status: VideoStatus;
};

const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
  to_watch: "Por ver",
  watched: "Visto",
  mastered: "Visto y aprendido",
};

/* ---------- Helpers ---------- */

// IDs sencillitos
function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Hook para usar localStorage
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

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

/* ---------- Página principal ---------- */

export default function Home() {
  // tareas
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    "aprendizaje-squaads-tasks",
    []
  );
  const [newTaskText, setNewTaskText] = useState("");

  // entradas del diario
  const [entries, setEntries] = useLocalStorage<Entry[]>(
    "aprendizaje-squaads-entries",
    []
  );
  const today = new Date().toISOString().slice(0, 10);
  const [entryText, setEntryText] = useState("");

  // vídeos
  const [videos, setVideos] = useLocalStorage<Video[]>(
    "aprendizaje-squaads-videos",
    []
  );
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoStatus, setVideoStatus] = useState<VideoStatus>("to_watch");

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

  /* ----- acciones diario ----- */

  function addEntry() {
    const notes = entryText.trim();
    if (!notes) return;
    const newEntry: Entry = { id: createId(), date: today, notes };
    setEntries((prev) => [newEntry, ...prev]);
    setEntryText("");
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  /* ----- acciones vídeos ----- */

  function addVideo() {
    const rawTitle = videoTitle.trim();
    const rawUrl = videoUrl.trim();

    // si no hay ni título ni enlace, no hacemos nada
    if (!rawTitle && !rawUrl) return;

    // si solo pegas el enlace, usamos el enlace como título
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Cabecera */}
        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Diario de Aprendizaje Squaads
          </h1>
          <p className="text-slate-500">
            Un lugar para anotar lo que estudias, las tareas que cumples y los
            vídeos que vas viendo.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
          {/* Columna izquierda: diario + vídeos */}
          <div className="space-y-6">
            {/* Diario del día */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold mb-1">Entrada de hoy</h2>
              <p className="text-xs text-slate-500 mb-3">
                Escribe un pequeño resumen de lo que has estudiado y practicado
                hoy.
              </p>
              <div className="mb-2 text-xs text-slate-500">
                Fecha:{" "}
                <span className="font-medium">
                  {new Date(today).toLocaleDateString()}
                </span>
              </div>
              <textarea
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 min-h-[120px]"
                placeholder="Ejemplo: practiqué Node.js, hice un pequeño proyecto, repasé promesas y async/await..."
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={addEntry}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
                  Guardar entrada
                </button>
              </div>
            </section>

            {/* Historial de entradas */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-3">Historial de días</h2>
              {entries.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aún no tienes entradas guardadas. Escribe algo en “Entrada de
                  hoy” y pulsa en “Guardar entrada”.
                </p>
              ) : (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-700">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Borrar
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap text-slate-700">
                        {entry.notes}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Vídeos */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-3">Vídeos de estudio</h2>

              {/* Formulario para añadir vídeo */}
              <form
                className="space-y-3 mb-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  addVideo();
                }}
              >
                <input
                  className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="Título del vídeo (Ej. Curso básico de Node.js)"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="Enlace (https://...)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <select
                    className="rounded-xl border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Añadir vídeo
                  </button>
                </div>
              </form>

              {/* Lista de vídeos */}
              {videos.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aquí podrás ir apuntando los vídeos que te recomienda la
                  empresa o que tú quieres ver.
                </p>
              ) : (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {videos.map((video) => {
                    // aseguramos que el enlace tenga http/https
                    const href = video.url
                      ? video.url.startsWith("http")
                        ? video.url
                        : `https://${video.url}`
                      : "";

                    return (
                      <div
                        key={video.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="font-medium text-slate-800">
                              {video.title}
                            </p>
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-sky-600 underline break-all"
                              >
                                Abrir vídeo · {href}
                              </a>
                            ) : (
                              <p className="text-xs text-slate-400">
                                Sin enlace guardado para este vídeo.
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteVideo(video.id)}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Borrar
                          </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          <span className="text-xs text-slate-500">
                            Estado:
                          </span>
                          <select
                            className="rounded-lg border border-slate-200 p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
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
          </div>

          {/* Columna derecha: tareas */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">
                Tareas y objetivos del día
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Añade pequeñas tareas que quieras cumplir hoy (o esta semana).
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  className="flex-1 rounded-xl border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="Ej. Hacer 30 minutos de práctica con Node.js"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
                <button
                  onClick={addTask}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
                  Añadir tarea
                </button>
              </div>

              {tasks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Cuando añadas tareas, aparecerán aquí para que puedas
                  marcarlas como completadas ✅
                </p>
              ) : (
                <ul className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={task.done}
                        onChange={() => toggleTask(task.id)}
                      />
                      <div className="flex-1">
                        <p
                          className={
                            task.done
                              ? "text-slate-400 line-through"
                              : "text-slate-700"
                          }
                        >
                          {task.text}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-xs text-red-500 hover:text-red-600"
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

        <footer className="text-xs text-slate-400 text-center pt-4">
          Aprendizaje Squaads — tus avances se guardan en este navegador 💾
        </footer>
      </div>
    </main>
  );
}
