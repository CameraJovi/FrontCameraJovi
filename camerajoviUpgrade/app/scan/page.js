"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CardAcaoScan from "../components/CardAcaoScan";
import PreviewCaptura from "../components/PreviewCaptura";
import {
  guardarAnalise,
  obterCaptura,
} from "../services/captureSession";
import { phoneFrame, phoneScreen } from "../lib/tailwind";

const acoesDoScan = [
  { tipo: "resumo", titulo: "Resumo Inteligente", descricao: "Gerar resumo com IA", destino: "/resumo" },
  { tipo: "flashcard", titulo: "Criar Flashcards", descricao: "Cards de estudo automático", destino: "/flashcard" },
  { tipo: "math", titulo: "Resolver Equação", descricao: "Passo a passo da solução", destino: "/equacao" },
];

export default function Scan() {
  const router = useRouter();
  const [aviso, setAviso] = useState("");

  function salvarNoCaderno() {
    const captura = obterCaptura();

    if (!captura) {
      setAviso("NENHUMA FOTO FOI CAPTURADA.");
      return;
    }

    guardarAnalise("scan", captura.id, {
      analysis_type: "scan",
      subject: "Documento digitalizado",
      content: "Foto digitalizada pela Câmera Jovi.",
    });
    router.push("/salvar");
  }

  function compartilhar() {
    setAviso("COMPARTILHAMENTO EM BREVE");
    setTimeout(() => setAviso(""), 2000);
  }

  return (
    <main className={phoneFrame}>
      <section className={`${phoneScreen} relative bg-[#1a1a1a] px-6 pb-5 text-white`}>
        <header className="flex shrink-0 items-center justify-between border-b border-[#2a2a2a] pb-4 pt-6">
          <Link className="flex items-center gap-1.5 text-sm font-medium text-[#ffc107] no-underline" href="/">Cancelar</Link>
          <h1 className="text-base font-semibold text-white">Scan</h1>
          <button
            className="flex cursor-pointer items-center justify-end gap-1.5 whitespace-nowrap border-0 bg-transparent text-[11px] font-bold text-[#ffc107]"
            type="button"
            onClick={salvarNoCaderno}
          >
            Salvar no Caderno
          </button>
        </header>

        {aviso && <p className="rounded-md bg-[#ffc107] px-3.5 py-2 text-center text-[11px] font-bold text-[#1a1a1a]">{aviso}</p>}

        <div className="my-[18px] mb-6 flex min-h-[220px] max-h-80 flex-1 items-center justify-center overflow-hidden rounded-[20px] bg-[#2c2c2c] [&_img]:size-full [&_img]:object-cover">
          <PreviewCaptura alternativa={false} />
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {acoesDoScan.map((acao) => (
            <CardAcaoScan {...acao} key={acao.tipo} />
          ))}

          <button className="relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-lg border border-[#3d3d3d] bg-[#2c2c2c] p-4 text-left text-inherit" type="button" onClick={compartilhar}>
            <span className="flex text-[#ffc107]">
              <svg className="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </span>
            <span className="flex flex-1 flex-col gap-1">
              <strong className="text-[15px] font-medium text-[#ffc107]">Compartilhar</strong>
              <span className="text-xs text-[#aaa]">Envie para grupo de estudo</span>
            </span>
            <svg className="size-[22px] text-[#999]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
            <span className="absolute bottom-0 left-0 h-0.5 w-[45%] bg-[#ffc107]" />
          </button>
        </div>
      </section>
    </main>
  );
}
