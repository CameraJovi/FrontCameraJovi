"use client";

import { useEffect, useRef } from "react";

export default function Rodape({
  modos,
  modoAtivo,
  aoSelecionarModo,
  aoCapturar,
  aoGirarCamera,
  modoExtraAtivo,
  painelMaisAberto,
  capturando = false,
}) {
  const botaoAtivo = useRef(null);
  const modoExtraDeVideo = ["Câmera lenta", "Time-lapse"].includes(
    modoExtraAtivo,
  );

  useEffect(() => {
    botaoAtivo.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [modoAtivo]);

  return (
    <footer className="shrink-0 bg-[#1e1e1e]">
      {!painelMaisAberto && (
        <section className="flex items-center justify-between px-7 pb-2.5 pt-4" aria-label="Controles de captura">
          <button
            className={`flex size-[52px] cursor-pointer items-center justify-center rounded-[10px] border-2 border-[#ffc107] bg-[#ffc107] text-white [&_svg]:size-[26px] ${
              modoAtivo === "Estudante" ? "pointer-events-none opacity-0" : ""
            }`}
            type="button"
            aria-label="Abrir galeria"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <polyline points="3 9 9 9 9 3" />
            </svg>
          </button>

          <button
            className="flex size-[72px] cursor-pointer items-center justify-center rounded-full border-[3px] border-white/50 bg-transparent disabled:cursor-wait disabled:opacity-55"
            type="button"
            aria-label={capturando ? "Capturando foto" : "Tirar foto"}
            onClick={aoCapturar}
            disabled={capturando}
          >
            <span
              className={`size-[58px] rounded-full ${
                modoAtivo === "Vídeo" || modoExtraDeVideo ? "bg-[#ff3b30]" : "bg-white"
              }`}
            />
          </button>

          <button
            className="flex size-[52px] cursor-pointer items-center justify-center rounded-full border-0 bg-white/10 text-white/80 [&_svg]:size-[22px]"
            type="button"
            aria-label="Girar câmera"
            onClick={aoGirarCamera}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M1 4v6h6" />
              <path d="M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        </section>
      )}

      <nav className="flex snap-x snap-mandatory items-center justify-start gap-2.5 overflow-x-auto scroll-smooth px-[calc(50%_-_45px)] pb-5 pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Modos da câmera">
        {modos.map((modo) => (
          <button
            className={`min-w-[90px] shrink-0 snap-center cursor-pointer border-0 bg-transparent px-[15px] py-1.5 text-xs font-semibold uppercase tracking-[0.1em] ${modo === modoAtivo ? "font-extrabold text-[#ffc107]" : "text-white/40"}`}
            type="button"
            aria-pressed={modo === modoAtivo}
            onClick={() => aoSelecionarModo(modo)}
            ref={modo === modoAtivo ? botaoAtivo : null}
            key={modo}
          >
            {modo}
          </button>
        ))}
      </nav>
    </footer>
  );
}
