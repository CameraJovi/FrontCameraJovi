"use client";

import { useEffect, useState } from "react";

const opcoesDeResolucao = ["HD", "4K"];
const opcoesDeFps = [24, 30, 60];

function obterHoraAtual() {
  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, "0");
  const minutos = String(agora.getMinutes()).padStart(2, "0");

  return `${horas}:${minutos}`;
}

export default function Cabecalho({
  lanternaLigada,
  menuAberto,
  resolucao,
  fps,
  aoAlternarLanterna,
  aoAlternarMenu,
  aoSelecionarResolucao,
  aoSelecionarFps,
}) {
  const [hora, setHora] = useState(obterHoraAtual);

  useEffect(() => {
    const intervalo = setInterval(() => setHora(obterHoraAtual()), 1000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <header className="shrink-0 bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-7 pb-1 pt-3.5 text-[13px] font-semibold text-white">
        <time>{hora}</time>

        <div className="flex gap-1.5 [&_svg]:size-4" aria-label="Status do aparelho">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8 3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4 2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
          </svg>
        </div>
      </div>

      <nav className="relative flex items-center justify-between px-5 pb-2.5 pt-2" aria-label="Controles da câmera">
        <button
          className={`flex size-11 cursor-pointer items-center justify-center rounded-[14px] border-0 [&_svg]:size-[22px] [&_svg]:text-[#2c2c2c] ${lanternaLigada ? "bg-[#ffc107]" : "bg-white/90"}`}
          type="button"
          aria-label={lanternaLigada ? "Desativar lanterna" : "Ativar lanterna"}
          aria-pressed={lanternaLigada}
          onClick={aoAlternarLanterna}
        >
          {lanternaLigada ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.412 15.655 9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 10.5h8.25l-4.707 5.043M8.457 8.457 3 3m5.457 5.457 7.086 7.086m0 0L21 21"
              />
            </svg>
          )}
        </button>

        <button
          className="flex size-11 cursor-pointer items-center justify-center rounded-[14px] border-0 bg-white/90 [&_svg]:size-[22px] [&_svg]:text-[#2c2c2c]"
          type="button"
          aria-label="Abrir configurações"
          aria-expanded={menuAberto}
          onClick={aoAlternarMenu}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06-.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {menuAberto && (
          <div className="absolute right-4 top-[calc(100%+6px)] z-10 min-w-[190px] rounded-2xl bg-slate-50/95 px-3.5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between gap-2.5 py-1">
              <span className="min-w-16 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">Resolução</span>
              <div className="flex gap-1">
                {opcoesDeResolucao.map((opcao) => (
                  <button
                    className={`cursor-pointer rounded-full border-0 px-2 py-1 text-[13px] ${opcao === resolucao ? "bg-[#ffc107] font-bold text-[#222]" : "bg-transparent text-slate-500"}`}
                    type="button"
                    aria-pressed={opcao === resolucao}
                    onClick={() => aoSelecionarResolucao(opcao)}
                    key={opcao}
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            </div>

            <div className="my-1 h-px bg-black/10" />

            <div className="flex items-center justify-between gap-2.5 py-1">
              <span className="min-w-16 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">FPS</span>
              <div className="flex gap-1">
                {opcoesDeFps.map((opcao) => (
                  <button
                    className={`cursor-pointer rounded-full border-0 px-2 py-1 text-[13px] ${opcao === fps ? "bg-[#ffc107] font-bold text-[#222]" : "bg-transparent text-slate-500"}`}
                    type="button"
                    aria-pressed={opcao === fps}
                    onClick={() => aoSelecionarFps(opcao)}
                    key={opcao}
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
