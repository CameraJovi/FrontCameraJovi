"use client";

import Link from "next/link";
import CabecalhoAcao from "../components/CabecalhoAcao";
import EstadoAnalise from "../components/EstadoAnalise";
import useJoviAnalysis from "../hooks/useJoviAnalysis";
import { actionBody, actionScreen, phoneFrame, primaryAction } from "../lib/tailwind";

export default function Resumo() {
  const { status, dados, erro, tentarNovamente } = useJoviAnalysis("resumo");

  return (
    <main className={phoneFrame}>
      <section className={actionScreen}>
        <CabecalhoAcao titulo="Resumo Inteligente" />

        <div className={actionBody}>
          {status !== "sucesso" ? (
            <EstadoAnalise
              status={status}
              mensagem={status === "carregando" ? "Gerando resumo..." : erro}
              aoTentarNovamente={tentarNovamente}
            />
          ) : (
            <>
              <div>
                <h2 className="mt-3.5 text-lg font-bold text-white">{dados.subject}</h2>
                <p className="mt-1 text-xs text-[#888]">Resumo gerado pela Jovi</p>
              </div>

              <div className="flex flex-col gap-3 rounded-[14px] border-l-[3px] border-[#ffc107] bg-[#242424] p-[18px]">
                <section className="flex flex-col gap-[5px]">
                  <h3 className="text-[13px] font-bold uppercase text-[#ffc107]">Conteúdo identificado</h3>
                  <p className="whitespace-pre-wrap text-[13px] leading-[1.55] text-[#ccc]">{dados.content}</p>
                </section>
              </div>

              <Link className={primaryAction} href="/salvar">
                Salvar no Caderno Inteligente
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
