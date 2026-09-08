"use client";

import Link from "next/link";
import CabecalhoAcao from "../components/CabecalhoAcao";
import EstadoAnalise from "../components/EstadoAnalise";
import PreviewCaptura from "../components/PreviewCaptura";
import useJoviAnalysis from "../hooks/useJoviAnalysis";
import { actionBody, actionScreen, phoneFrame, primaryAction } from "../lib/tailwind";

export default function Equacao() {
  const { status, dados, erro, tentarNovamente } = useJoviAnalysis("math");

  return (
    <main className={phoneFrame}>
      <section className={actionScreen}>
        <CabecalhoAcao titulo="Resolver Equação" />

        <div className={actionBody}>
          {status !== "sucesso" ? (
            <EstadoAnalise
              status={status}
              mensagem={status === "carregando" ? "Resolvendo exercício..." : erro}
              aoTentarNovamente={tentarNovamente}
            />
          ) : (
            <>
              <div className="flex flex-col gap-5">
                <div className="relative flex flex-col gap-[18px] overflow-hidden rounded-[20px] bg-[#2c2c2c] px-[22px] py-7 before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[3px] before:bg-[#ffc107]">
                  <PreviewCaptura className="h-auto w-full rounded-lg" alternativa={false} />
                </div>

                <div className="rounded-2xl border border-[#333] bg-[#242424] px-[18px] py-5">
                  <p className="mb-3 text-[15px] font-bold text-white">{dados.subject}</p>

                  <div className="mb-3.5 flex flex-col gap-[3px]">
                    <span className="font-serif text-[15px] font-semibold text-[#ffc107]">
                      {dados.expression || "Nenhuma expressão matemática encontrada"}
                    </span>
                  </div>

                  {dados.steps?.length ? (
                    dados.steps.map((passo, indice) => (
                      <div className="border-t border-[#2e2e2e] py-[13px]" key={`${passo.title}-${indice}`}>
                        <strong className="mb-[5px] block text-xs text-[#ffc107]">
                          {indice + 1}. {passo.title}
                        </strong>
                        <span className="block whitespace-pre-wrap text-[13px] font-normal leading-[1.45] text-[#ccc]">{passo.step}</span>
                      </div>
                    ))
                  ) : (
                    <p className="mb-4 text-xs text-[#888]">{dados.content}</p>
                  )}

                  {dados.result?.length > 0 && (
                    <div className="mt-3 flex flex-col gap-[5px] rounded-[10px] bg-[#ffc107]/10 p-3.5 text-[15px] text-[#ffc107]">
                      <strong>Resultado</strong>
                      {dados.result.map((resultado, indice) => (
                        <span key={`${resultado}-${indice}`}>{resultado}</span>
                      ))}
                    </div>
                  )}
                </div>
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
