"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { obterImagemDoCaderno } from "../services/cadernoImagens";

function formatarData(data) {
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function FotoDoHistorico({ imagemId, assunto }) {
  const [imagem, setImagem] = useState({
    id: null,
    url: "",
    indisponivel: false,
  });

  useEffect(() => {
    if (!imagemId) return undefined;

    let componenteAtivo = true;
    let urlTemporaria = "";

    async function carregarImagem() {
      try {
        const registro = await obterImagemDoCaderno(imagemId);

        if (!componenteAtivo) return;

        if (!registro?.blob) {
          setImagem({ id: imagemId, url: "", indisponivel: true });
          return;
        }

        urlTemporaria = URL.createObjectURL(registro.blob);
        setImagem({ id: imagemId, url: urlTemporaria, indisponivel: false });
      } catch {
        if (componenteAtivo) {
          setImagem({ id: imagemId, url: "", indisponivel: true });
        }
      }
    }

    carregarImagem();

    return () => {
      componenteAtivo = false;
      if (urlTemporaria) URL.revokeObjectURL(urlTemporaria);
    };
  }, [imagemId]);

  if (!imagemId) return null;

  if (imagem.id !== imagemId) {
    return <p className="mb-2.5 rounded-lg bg-[#1b1b1b] p-2.5 text-center text-[#888]">Carregando foto...</p>;
  }

  if (imagem.indisponivel) {
    return (
      <p className="mb-2.5 rounded-lg bg-[#1b1b1b] p-2.5 text-center text-[#888]">
        A foto deste registro não está mais disponível.
      </p>
    );
  }

  return (
    <figure className="mb-3 overflow-hidden rounded-[9px] bg-[#181818]">
      <Image
        src={imagem.url}
        alt={`Foto original de ${assunto || "conteúdo estudado"}`}
        width={960}
        height={720}
        unoptimized
        className="block h-auto max-h-60 w-full object-contain"
      />
      <figcaption className="px-[9px] py-1.5 text-center text-[9px] text-[#888]">Foto original</figcaption>
    </figure>
  );
}

function DetalhesAnalise({ analise }) {
  if (!analise) {
    return (
      <p className="whitespace-pre-line text-center text-[#888] [overflow-wrap:anywhere]">
        Os detalhes não estão disponíveis para este registro antigo.
      </p>
    );
  }

  if (analise.analysis_type === "flashcards") {
    return (
      <div className="flex flex-col gap-2.5">
        {analise.cards?.map((card, indice) => (
          <div className="border-b border-[#333] pb-[9px] last:border-0 last:pb-0" key={`${card.question}-${indice}`}>
            <strong className="text-[#ffc107]">{card.question}</strong>
            <p className="mt-[3px]">{card.answer}</p>
          </div>
        ))}
      </div>
    );
  }

  if (analise.analysis_type === "math") {
    return (
      <div className="flex flex-col gap-2.5">
        {analise.expression && (
          <p><strong className="text-[#ffc107]">Expressão:</strong> {analise.expression}</p>
        )}

        {analise.steps?.map((passo, indice) => (
          <div className="border-b border-[#333] pb-[9px] last:border-0 last:pb-0" key={`${passo.title}-${indice}`}>
            <strong className="text-[#ffc107]">{indice + 1}. {passo.title}</strong>
            <p className="mt-[3px]">{passo.step}</p>
          </div>
        ))}

        {analise.result?.length > 0 && (
          <p>
            <strong className="text-[#ffc107]">Resultado:</strong> {analise.result.join(", ")}
          </p>
        )}
      </div>
    );
  }

  if (analise.analysis_type === "code") {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-5 text-zinc-300">{analise.content}</p>
        <span className="inline-flex rounded-full border border-[#ffc107]/30 bg-[#ffc107]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#ffc107]">
          {analise.language}
        </span>
        <section>
          <h4 className="mb-2 text-xs font-bold text-[#ffc107]">Explicação do código</h4>
          {analise.explanation?.length ? (
            <ol className="list-decimal space-y-2 pl-4 text-xs leading-5 text-zinc-300">
              {analise.explanation.map((passo, indice) => <li key={indice}>{passo}</li>)}
            </ol>
          ) : (
            <p className="text-xs text-zinc-400">Este registro não possui explicação detalhada salva.</p>
          )}
          {analise.input && <p className="mt-3"><strong className="text-white">Entrada: </strong>{analise.input}</p>}
          {analise.expected_output && <p className="mt-2"><strong className="text-white">Saída esperada: </strong>{analise.expected_output}</p>}
          {analise.concepts?.length > 0 && <p className="mt-2"><strong className="text-white">Conceitos: </strong>{analise.concepts.join(", ")}</p>}
        </section>
        {analise.original_code && (
          <details className="rounded-xl border border-white/10 p-3">
            <summary className="cursor-pointer text-xs font-bold text-[#ffc107]">Código original</summary>
            <pre className="mt-2 overflow-x-auto text-[11px] leading-5 text-zinc-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><code>{analise.original_code}</code></pre>
          </details>
        )}
        {analise.corrected_code?.trim() && <div>
          <strong className="mb-2 block text-xs text-zinc-400">Código corrigido</strong>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/35 p-3 text-[11px] leading-5 text-zinc-200">
            <code>{analise.corrected_code}</code>
          </pre>
          {analise.correction_impact && <p className="mt-2 text-xs leading-5 text-zinc-300">{analise.correction_impact}</p>}
          {analise.changes?.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-zinc-400">
              {analise.changes.map((alteracao, indice) => <li key={indice}>{alteracao}</li>)}
            </ul>
          )}
        </div>}
      </div>
    );
  }

  return <p className="whitespace-pre-line [overflow-wrap:anywhere]">{analise.content}</p>;
}

export default function ItemHistorico({
  item,
  aberto,
  aoAlternar,
  aoRenomear,
  aoExcluir,
}) {
  return (
    <article className={`w-full min-w-0 max-w-full overflow-hidden rounded-[10px] border bg-[#242424] ${aberto ? "border-[#ffc107]/55" : "border-[#333]"}`}>
      <button
        className="flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 border-0 bg-transparent p-3 text-left text-inherit"
        type="button"
        aria-expanded={aberto}
        onClick={() => aoAlternar(item.id)}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-[3px] overflow-hidden">
          <strong className="truncate text-xs text-white">{item.assunto || "Conteúdo sem título"}</strong>
          <span className="truncate text-[10px] text-[#888]">
            {item.materia} · {item.tipo}{item.imagemId ? " · Foto" : ""}
          </span>
        </span>

        <span className="flex max-w-[105px] shrink-0 items-center gap-[5px]">
          <time className="text-[10px] text-[#888]" dateTime={item.salvoEm}>{formatarData(item.salvoEm)}</time>
          <svg className={`size-3.5 shrink-0 text-[#ffc107] transition-transform ${aberto ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {aberto && (
        <div className="min-w-0 max-w-full border-t border-[#333] p-3 text-[11px] leading-normal text-[#bbb] [overflow-wrap:anywhere]">
          <FotoDoHistorico imagemId={item.imagemId} assunto={item.assunto} />
          <DetalhesAnalise analise={item.analise} />

          {(aoRenomear || aoExcluir) && (
            <div className="mt-3.5 flex justify-end gap-2 border-t border-[#333] pt-2.5">
              {aoRenomear && (
                <button className="cursor-pointer rounded-lg border border-[#4a4a4a] bg-transparent px-[11px] py-[7px] text-[10px] font-bold text-white" type="button" onClick={() => aoRenomear(item)}>
                  Renomear
                </button>
              )}
              {aoExcluir && (
                <button
                  className="cursor-pointer rounded-lg border border-[#ff5c5c]/55 bg-transparent px-[11px] py-[7px] text-[10px] font-bold text-[#ff7777]"
                  type="button"
                  onClick={() => aoExcluir(item)}
                >
                  Excluir
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
