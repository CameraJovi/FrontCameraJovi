"use client";

import Link from "next/link";
import CabecalhoAcao from "../components/CabecalhoAcao";
import CardFlashcard from "../components/CardFlashcard";
import EstadoAnalise from "../components/EstadoAnalise";
import useJoviAnalysis from "../hooks/useJoviAnalysis";
import { actionBody, actionScreen, phoneFrame, primaryAction } from "../lib/tailwind";

export default function Flashcards() {
  const { status, dados, erro, tentarNovamente } = useJoviAnalysis("flashcards");
  const cards = dados?.cards || [];

  return (
    <main className={phoneFrame}>
      <section className={actionScreen}>
        <CabecalhoAcao titulo="Flashcards" />

        <div className={actionBody}>
          {status !== "sucesso" ? (
            <EstadoAnalise
              status={status}
              mensagem={status === "carregando" ? "Criando flashcards..." : erro}
              aoTentarNovamente={tentarNovamente}
            />
          ) : (
            <>
              <p className="text-center text-lg font-bold text-white">{dados.subject}</p>
              <p className="mb-3 text-center text-xs text-[#888]">
                {cards.length} {cards.length === 1 ? "card gerado" : "cards gerados"}
              </p>

              <div className="flex flex-col gap-3.5">
                {cards.length ? (
                  cards.map((card, indice) => (
                    <CardFlashcard
                      titulo={`Flashcard ${indice + 1}`}
                      perguntas={[card.question || "Pergunta não identificada"]}
                      respostas={[
                        {
                          titulo: "Resposta",
                          texto: card.answer || "Resposta não identificada.",
                        },
                      ]}
                      key={`${card.question}-${indice}`}
                    />
                  ))
                ) : (
                  <p className="p-[18px] text-center text-[13px] leading-[1.45] text-[#aaa]">{dados.content}</p>
                )}
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
