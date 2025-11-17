"use client";

import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import {
  useCalendarData,
  type DayDetails,
  type LinkItem,
  type CaptureItem,
} from "../../lib/calendarStorage";

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Función para crear IDs simples
function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

// 👉 función para obtener HOY en formato local "YYYY-MM-DD" (sin toISOString)
function todayLocalKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Exportar un día a "PDF" usando la impresión del navegador
function exportDayToPDF(day: DayDetails) {
  if (typeof window === "undefined") return;

  const fecha = dateFromKey(day.date).toLocaleDateString("es-ES");

  const htmlSummary = day.summary
    ? `<p style="white-space:pre-wrap;font-size:14px;line-height:1.6;">${day.summary
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")}</p>`
    : "<p><em>Sin resumen para este día.</em></p>";

  const htmlLinks =
    day.links.length === 0
      ? "<p><em>Sin links de estudio.</em></p>"
      : `<ul>${day.links
          .map(
            (l) =>
              `<li style="margin-bottom:4px;">
                <strong>${l.title || l.url}</strong><br/>
                <a href="${l.url}" target="_blank">${l.url}</a>
              </li>`
          )
          .join("")}</ul>`;

  const htmlCaptures =
    day.captures.length === 0
      ? "<p><em>Sin capturas.</em></p>"
      : `<div style="display:flex;flex-wrap:wrap;gap:12px;">${day.captures
          .map(
            (c) => `
        <figure style="width:180px;">
          <img src="${c.url}" alt="${c.title}" style="width:100%;height:auto;border-radius:8px;border:1px solid #e5e7eb;"/>
          <figcaption style="font-size:11px;color:#4b5563;margin-top:4px;word-break:break-word;">
            ${c.title}<br/>
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
    <meta charSet="utf-8" />
    <title>Diario de estudio - ${fecha}</title>
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        margin: 40px;
        color: #111827;
      }
      h1, h2 {
        margin-bottom: 8px;
      }
      h1 {
        font-size: 24px;
      }
      h2 {
        font-size: 18px;
        margin-top: 24px;
      }
      hr {
        margin: 20px 0;
      }
    </style>
  </head>
  <body>
    <h1>Diario de estudio — ${fecha}</h1>
    <p style="font-size:12px;color:#6b7280;">Exportado desde Aprendizaje Squaads</p>
    <hr/>

    <h2>Resumen del día</h2>
    ${htmlSummary}
    <hr/>

    <h2>Links de estudio</h2>
    ${htmlLinks}
    <hr/>

    <h2>Capturas</h2>
    ${htmlCaptures}
  </body>
  </html>
  `;

  win.document.write(docHtml);
  win.document.close();
  win.focus();
  win.print(); // aquí eliges "Guardar como PDF"
}

export default function DayPage() {
  const router = useRouter();
  const params = useParams();

  // params.date puede venir como string o string[]
  const rawDate = params?.date;
  const dateParam = Array.isArray(rawDate) ? rawDate[0] : rawDate;
  // 👇 si no viene en la URL, usamos HOY en formato local (sin toISOString)
  const date = dateParam ?? todayLocalKey();

  const { getDay, updateDay } = useCalendarData();
  const day = getDay(date);

  // BORRADOR del resumen (solo se guarda al pulsar botón)
  const [summaryDraft, setSummaryDraft] = useState(day.summary);

  // Inputs para nuevos links
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Inputs para nuevas capturas
  const [captureTitle, setCaptureTitle] = useState("");
  const [capturePreview, setCapturePreview] = useState<string | null>(null);
  const [captureFileName, setCaptureFileName] = useState("");
  const [expandedCapture, setExpandedCapture] = useState<CaptureItem | null>(
    null
  );

  // Cuando llegan datos desde Supabase actualizamos el borrador
  useEffect(() => {
    setSummaryDraft(day.summary);
  }, [day.summary]);

  // Guardar resumen cuando se pulse el botón
  const handleSaveSummary = () => {
    const text = summaryDraft.trim();
    setSummaryDraft(text);
    updateDay(date, (prev) => ({
      ...prev,
      summary: text,
    }));
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    const newLink: LinkItem = {
      id: createId(),
      title: linkTitle.trim() || linkUrl.trim(),
      url: linkUrl.trim(),
    };
    updateDay(date, (prev) => ({
      ...prev,
      links: [...prev.links, newLink],
    }));
    setLinkTitle("");
    setLinkUrl("");
  };

  const handleDeleteLink = (id: string) => {
    updateDay(date, (prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== id),
    }));
  };

  // Cuando el usuario selecciona un archivo de imagen, se guarda como captura (base64)
  const handleSelectCaptureFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string; // imagen en base64
      setCapturePreview(dataUrl);
      setCaptureFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCapture = () => {
    if (!capturePreview) return;
    const newCap: CaptureItem = {
      id: createId(),
      title: captureTitle.trim() || captureFileName || "Captura",
      url: capturePreview,
    };
    updateDay(date, (prev) => ({
      ...prev,
      captures: [...prev.captures, newCap],
    }));
    setCaptureTitle("");
    setCapturePreview(null);
    setCaptureFileName("");
  };

  const handleDeleteCapture = (id: string) => {
    updateDay(date, (prev) => ({
      ...prev,
      captures: prev.captures.filter((c) => c.id !== id),
    }));
  };

  const handleExportPDF = () => {
    exportDayToPDF(day);
  };

  const formattedDate = dateFromKey(date).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center p-4">
      <div className="w-full max-w-4xl space-y-4">
        <header className="flex items-center justify-between gap-2">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-xs border border-slate-700 rounded px-2 py-1 mb-2"
            >
              ← Volver al calendario
            </button>
            <h1 className="text-2xl font-bold">
              Día de estudio — {formattedDate}
            </h1>
            <p className="text-xs text-slate-400">
              Aquí tienes tu “blog” completo de este día: resumen, links y
              capturas.
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="text-xs border border-emerald-400 rounded px-3 py-2 hover:bg-emerald-500/20"
          >
            Descargar PDF (imprimir)
          </button>
        </header>

        {/* Resumen largo */}
        <section className="bg-slate-900/70 rounded-2xl border border-slate-800 p-4 space-y-2">
          <h2 className="text-sm font-semibold">Resumen del día</h2>
          <p className="text-xs text-slate-400">
            Escribe aquí tu resumen (uno o dos folios si quieres). Cuando pulses
            &quot;Guardar resumen&quot; verás el texto actualizado al instante y
            quedará guardado también en Supabase.
          </p>
          <textarea
            value={summaryDraft}
            onChange={(e) => setSummaryDraft(e.target.value)}
            className="w-full min-h-[180px] rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm"
            placeholder="Ejemplo: Hoy he estudiado X, luego he visto un vídeo de Y, he tomado estas notas, etc..."
          />
          <button
            onClick={handleSaveSummary}
            className="text-xs border border-blue-400 rounded px-3 py-2 hover:bg-blue-500/20"
          >
            Guardar resumen
          </button>
          <div className="mt-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="text-xs uppercase text-slate-400 mb-2">
              Resumen guardado
            </div>
            {day.summary ? (
              <p className="whitespace-pre-wrap text-sm text-slate-100">
                {day.summary}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Aún no hay resumen guardado para este día.
              </p>
            )}
          </div>
        </section>

        {/* Links de estudio */}
        <section className="bg-slate-900/70 rounded-2xl border border-slate-800 p-4 space-y-2">
          <h2 className="text-sm font-semibold">Links de vídeos / recursos</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Título del recurso (opcional)"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm"
            />
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://link-del-video-o-curso..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm"
            />
            <button
              onClick={handleAddLink}
              className="text-xs border border-blue-400 rounded px-3 py-2 hover:bg-blue-500/20"
            >
              Añadir link
            </button>
          </div>

          {day.links.length === 0 ? (
            <p className="text-xs text-slate-500 mt-2">
              Aún no hay links guardados para este día.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-1">
              {day.links.map((link) => (
                <li
                  key={link.id}
                  className="flex justify-between items-start gap-2 border border-slate-700 rounded-xl p-2 text-sm"
                >
                  <div className="space-y-1">
                    <div className="text-xs uppercase text-slate-400">
                      Link de estudio
                    </div>
                    <div className="font-medium">
                      {link.title || "(sin título)"}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline break-all text-sky-300"
                    >
                      {link.url}
                    </a>
                  </div>
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-[10px] text-red-400 hover:text-red-300 underline"
                  >
                    Borrar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Capturas */}
        <section className="bg-slate-900/70 rounded-2xl border border-slate-800 p-4 space-y-2 mb-6">
          <h2 className="text-sm font-semibold">Capturas</h2>
          <p className="text-xs text-slate-400">
            Sube imágenes desde tu ordenador (pantallazos de código, resultados,
            etc.). Al elegir la imagen se guardará automáticamente para este
            día.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 items-start">
            <input
              value={captureTitle}
              onChange={(e) => setCaptureTitle(e.target.value)}
              placeholder="Descripción de la captura (opcional)"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleSelectCaptureFile}
              className="text-xs"
            />
            <button
              onClick={handleSaveCapture}
              disabled={!capturePreview}
              className="text-xs border border-blue-400 rounded px-3 py-2 hover:bg-blue-500/20 disabled:opacity-40"
            >
              Guardar captura
            </button>
          </div>
          {capturePreview && (
            <div className="mt-2 flex flex-col sm:flex-row gap-3 text-xs text-slate-400">
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-slate-200">
                  Vista previa lista para guardar
                </div>
                <div>{captureTitle || captureFileName || "Sin título"}</div>
              </div>
              <Image
                src={capturePreview}
                alt={captureTitle || captureFileName || "Captura previa"}
                width={200}
                height={150}
                unoptimized
                className="rounded-lg border border-slate-800 max-h-32 object-contain w-full sm:w-auto"
              />
            </div>
          )}

          {day.captures.length === 0 ? (
            <p className="text-xs text-slate-500 mt-2">
              Aún no hay capturas guardadas para este día.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {day.captures.map((cap) => (
                <div
                  key={cap.id}
                  className="border border-slate-700 rounded-xl p-2 flex flex-col gap-2 text-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-xs uppercase text-slate-400">
                        Captura
                      </div>
                      <div className="font-medium mb-1">
                        {cap.title || "(sin título)"}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCapture(cap.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 underline"
                    >
                      Borrar
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedCapture(cap)}
                    className="focus:outline-none"
                  >
                    <Image
                      src={cap.url}
                      alt={cap.title || "Captura"}
                      width={400}
                      height={320}
                      unoptimized
                      className="rounded-lg border border-slate-800 mt-1 max-h-40 object-contain w-full h-auto hover:brightness-110"
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
        {expandedCapture && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedCapture(null)}
          >
            <div
              className="relative bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpandedCapture(null)}
                className="absolute top-3 right-3 text-sm border border-slate-600 rounded px-3 py-1 hover:bg-slate-800"
              >
                Cerrar
              </button>
              <div className="mb-3">
                <h3 className="text-lg font-semibold">
                  {expandedCapture.title || "Captura"}
                </h3>
                <p className="text-xs text-slate-400 break-all">
                  {expandedCapture.id}
                </p>
              </div>
              <div className="w-full">
                <Image
                  src={expandedCapture.url}
                  alt={expandedCapture.title || "Captura expandida"}
                  width={1200}
                  height={900}
                  unoptimized
                  className="w-full h-auto rounded-xl border border-slate-800 object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
