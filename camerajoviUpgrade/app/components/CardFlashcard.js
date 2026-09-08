"use client";

import { useState } from "react";

export default function CardFlashcard({ titulo, perguntas, respostas }) {
  const [virado, setVirado] = useState(false);

  return (
    <article className="grid grid-cols-1 grid-rows-[auto_auto] gap-2.5 overflow-hidden rounded-[14px] border border-[#333] bg-[#242424] p-[18px]">
      <header className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-[#ffc107]">{titulo}</span>
        <button
          className={`flex cursor-pointer border-0 bg-transparent p-1 text-[#666] transition ${virado ? "rotate-180 text-[#ffc107]" : ""}`}
          type="button"
          title="Girar"
          aria-pressed={virado}
          onClick={() => setVirado(!virado)}
        >
          <svg className="size-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
        </button>
      </header>

      <div className={`col-start-1 row-start-2 flex flex-col gap-2 ${virado ? "hidden" : ""}`}>
        {perguntas.map((pergunta) => (
          <p className="flex gap-2 text-[13px] leading-[1.45] text-[#ccc]" key={pergunta}>
            <span className="text-[#ffc107]">•</span>{pergunta}
          </p>
        ))}
      </div>

      <div className={`col-start-1 row-start-2 flex flex-col gap-2 ${virado ? "" : "hidden"}`}>
        {respostas.map((resposta) => (
          <div className="flex flex-col gap-1 text-[13px] leading-[1.45] text-[#bbb]" key={resposta.titulo}>
            <strong className="text-white">{resposta.titulo}</strong>
            {resposta.texto && <p>{resposta.texto}</p>}
            {resposta.itens && (
              <ul className="list-disc pl-5 text-[#aaa]">
                {resposta.itens.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
            {resposta.passos && (
              <ol className="list-decimal pl-5 text-[#aaa]">
                {resposta.passos.map((passo) => <li key={passo}>{passo}</li>)}
              </ol>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
