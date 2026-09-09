"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import EstadoAnalise from "../components/EstadoAnalise";
import PreviewCaptura from "../components/PreviewCaptura";
import { analisarImagem } from "../services/joviApi";
import { adaptarAnaliseCodigo } from "../services/codeResponse";
import { phoneFrame, phoneScreen } from "../lib/tailwind";
import {
  carregarCadernoLocal,
  salvarCadernoLocal,
  salvarMateriaSelecionada,
} from "../services/cadernoHistorico";
import { salvarImagemDoCaderno } from "../services/cadernoImagens";
import {
  capturaParaArquivo,
  obterCaptura,
  obterAnalise,
  guardarAnalise,
} from "../services/captureSession";

function IconeVoltar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="size-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
    </svg>
  );
}

function IconeCodigo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="size-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
    </svg>
  );
}

function useArrasteScroll(eixo) {
  const elementoRef = useRef(null);
  const arrasteRef = useRef({
    ativo: false,
    moveu: false,
    ponteiro: null,
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  function iniciarArraste(evento) {
    if (evento.pointerType !== "mouse" || evento.button !== 0) return;
    if (evento.target.closest("button, a, summary, input")) return;

    if (eixo === "x") evento.stopPropagation();

    const elemento = elementoRef.current;
    if (!elemento) return;

    arrasteRef.current = {
      ativo: true,
      moveu: false,
      ponteiro: evento.pointerId,
      x: evento.clientX,
      y: evento.clientY,
      scrollLeft: elemento.scrollLeft,
      scrollTop: elemento.scrollTop,
    };
  }

  function moverArraste(evento) {
    const arraste = arrasteRef.current;
    const elemento = elementoRef.current;

    if (!elemento || !arraste.ativo || arraste.ponteiro !== evento.pointerId) {
      return;
    }

    if (eixo === "x") evento.stopPropagation();

    const deslocamentoX = evento.clientX - arraste.x;
    const deslocamentoY = evento.clientY - arraste.y;
    const deslocamento = eixo === "x" ? deslocamentoX : deslocamentoY;

    if (!arraste.moveu && Math.abs(deslocamento) < 5) return;

    if (!arraste.moveu) {
      arraste.moveu = true;
      elemento.setPointerCapture?.(evento.pointerId);
      elemento.classList.add("cursor-grabbing", "select-none");
    }

    evento.preventDefault();

    if (eixo === "x") {
      elemento.scrollLeft = arraste.scrollLeft - deslocamentoX;
    } else {
      elemento.scrollTop = arraste.scrollTop - deslocamentoY;
    }
  }

  function finalizarArraste(evento) {
    const arraste = arrasteRef.current;
    const elemento = elementoRef.current;

    if (!elemento || arraste.ponteiro !== evento.pointerId) return;

    arraste.ativo = false;
    elemento.classList.remove("cursor-grabbing", "select-none");

    if (elemento.hasPointerCapture?.(evento.pointerId)) {
      elemento.releasePointerCapture(evento.pointerId);
    }

    window.setTimeout(() => {
      arraste.moveu = false;
    }, 0);
  }

  function impedirCliqueAposArraste(evento) {
    if (!arrasteRef.current.moveu) return;

    evento.preventDefault();
    evento.stopPropagation();
  }

  return {
    ref: elementoRef,
    onPointerDown: iniciarArraste,
    onPointerMove: moverArraste,
    onPointerUp: finalizarArraste,
    onPointerCancel: finalizarArraste,
    onClickCapture: impedirCliqueAposArraste,
  };
}

function BlocoCodigo({ codigo, destaque = false, linhaDestaque, trechos = [], versao = "antes" }) {
  const linhas = codigo.split("\n");
  const arrasteHorizontal = useArrasteScroll("x");

  return (
    <div className={`overflow-hidden rounded-2xl border ${destaque ? "border-[#ffc107]/35 bg-[#ffc107]/[0.04]" : "border-white/10 bg-black/35"}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="size-2 rounded-full bg-zinc-700" />
          <i className="size-2 rounded-full bg-[#ffc107]" />
          <i className="size-2 rounded-full bg-zinc-600" />
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
          {destaque ? "Código revisado" : "Código original"}
        </span>
      </div>
      <pre
        {...arrasteHorizontal}
        className="cursor-grab touch-pan-x overflow-x-auto py-3 text-[13px] leading-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <code className="block min-w-max font-mono text-zinc-200">
          {linhas.map((linha, indice) => {
            const numero = indice + 1;
            const trecho = trechos.find((item) => item[versao] === linha && linha !== "");
            const marcada = Boolean(trecho) || numero === linhaDestaque;

            return (
              <span
                className={`flex min-h-5 px-3 ${marcada ? "bg-[#ffc107]/10" : ""}`}
                key={`${numero}-${linha}`}
              >
                <span className={`mr-4 w-4 select-none text-right ${marcada ? "text-[#ffc107]" : "text-zinc-400"}`}>
                  {numero}
                </span>
                <span>{trecho ? <TrechoAlterado texto={linha} outro={trecho[versao === "antes" ? "depois" : "antes"]} /> : linha || " "}</span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

function TrechoAlterado({ texto, outro }) {
  let inicio = 0;
  while (inicio < Math.min(texto.length, outro.length) && texto[inicio] === outro[inicio]) inicio++;
  let fim = 0;
  while (fim < Math.min(texto.length, outro.length) - inicio && texto[texto.length - 1 - fim] === outro[outro.length - 1 - fim]) fim++;
  if (!texto) return <span className="text-zinc-400">Linha adicionada na versão seguinte.</span>;
  return <code className="whitespace-pre-wrap break-words font-mono text-[13px] leading-6">
    {texto.slice(0, inicio)}
    <mark className="rounded bg-[#ffc107]/20 text-[#ffc107]">{texto.slice(inicio, texto.length - fim)}</mark>
    {fim > 0 ? texto.slice(-fim) : ""}
  </code>;
}

function EstadoDaAnalise({ estado, mensagem, aoTentarNovamente }) {
  if (estado === "carregando") {
    return (
      <div className="flex flex-1 flex-col justify-center p-5">
        <EstadoAnalise
          status="carregando"
          mensagem="A Jovi está analisando seu código..."
        />
      </div>
    );
  }

  const semCodigo = estado === "sem-codigo";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center" role="alert">
      <span className="grid size-16 place-items-center rounded-2xl bg-[#ffc107]/10 text-2xl font-black text-[#ffc107]">
        {semCodigo ? "</>" : "!"}
      </span>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#ffc107]">
        {semCodigo ? "Nenhum código identificado" : "Análise interrompida"}
      </p>
      <h2 className="mt-2 text-xl font-bold">
        {semCodigo ? "Não encontramos um código legível" : "Não foi possível analisar a imagem"}
      </h2>
      <p className="mt-3 max-w-[300px] text-sm leading-5 text-zinc-400">
        {mensagem || (semCodigo
          ? "Aponte a câmera diretamente para o código, evite reflexos e tente enquadrar todas as linhas."
          : "Ocorreu uma falha temporária durante a análise. Sua foto continua disponível para uma nova tentativa.")}
      </p>
      <div className="mt-6 grid w-full max-w-[310px] gap-2">
        <button
          type="button"
          onClick={aoTentarNovamente}
          className="rounded-2xl bg-[#ffc107] px-4 py-3.5 text-sm font-extrabold text-black active:scale-[0.99]"
        >
          Tentar novamente
        </button>
        <Link
          href="/?modo=estudante"
          className="rounded-2xl border border-white/15 bg-[#222] px-4 py-3.5 text-sm font-bold text-white no-underline"
        >
          Tirar outra foto
        </Link>
      </div>
    </div>
  );
}

const rotulosDeSeveridade = {
  erro: "Erro",
  aviso: "Aviso",
  sugestao: "Sugestão",
};

function criarIdRegistro() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function CodigoConteudo() {
  const [painel, setPainel] = useState("explicacao");
  const [comparacao, setComparacao] = useState("corrigido");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [estadoAnalise, setEstadoAnalise] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [analise, setAnalise] = useState(null);
  const [erroAnalise, setErroAnalise] = useState("");
  const problemas = [...(analise?.problemas || [])].sort((a, b) =>
    Number(b.severidade === "erro") - Number(a.severidade === "erro"));
  const temCorrecao = Boolean(analise?.codigoCorrigido?.trim());
  const salvamentoRef = useRef(false);
  const resultadoRef = useRef(null);
  const arrasteVertical = useArrasteScroll("y");

  useEffect(() => {
    const controller = new AbortController();
    let ativo = true;
    let expirou = false;
    const timeout = window.setTimeout(() => {
      expirou = true;
      controller.abort();
    }, 90000);

    async function analisar() {
      try {
        const captura = obterCaptura();
        if (!captura) throw new Error("Tire uma foto do código antes de iniciar a análise.");
        const cache = tentativa === 0 ? obterAnalise("code", captura.id) : null;
        const resposta = cache || await analisarImagem("code",
          await capturaParaArquivo(captura), { signal: controller.signal });
        if (!ativo) return;
        const resultado = adaptarAnaliseCodigo(resposta);
        // A falta de espaço no cache não invalida uma resposta já recebida.
        try { guardarAnalise("code", captura.id, resposta); } catch {}
        setAnalise(resultado);
        setEstadoAnalise(resultado ? "sucesso" : "sem-codigo");
        setErroAnalise("");
      } catch (erro) {
        if (!ativo) return;
        setErroAnalise(expirou
          ? "A análise demorou mais que o esperado. Tente novamente."
          : erro.message || "Não foi possível analisar o código.");
        setEstadoAnalise("erro");
      } finally {
        window.clearTimeout(timeout);
      }
    }
    analisar();
    return () => {
      ativo = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [tentativa]);

  function tentarNovamente() {
    setEstadoAnalise("carregando");
    setTentativa((valor) => valor + 1);
  }

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(analise.codigoCorrigido);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      setAviso("Não foi possível copiar o código neste navegador.");
    }
  }

  async function salvarNoCaderno() {
    if (salvamentoRef.current || salvo) return;
    salvamentoRef.current = true;

    setSalvando(true);
    setSalvo(false);
    setAviso("Salvando análise...");

    try {
      const materia = "Programação";
      const dados = carregarCadernoLocal();
      const id = criarIdRegistro();
      const captura = obterCaptura();
      const chaveAnalise = JSON.stringify([
        captura?.id || "demonstracao", analise.codigoOriginal,
        analise.codigoCorrigido, analise.explicacao,
      ]);
      if (dados.historico.some((item) => item.chaveAnalise === chaveAnalise)) {
        salvarMateriaSelecionada(materia);
        setSalvo(true);
        setAviso("Salvo anteriormente em Programação no Caderno Inteligente.");
        return;
      }
      let imagemId = null;

      if (captura) {
        try {
          imagemId = `foto-${id}`;
          const arquivo = await capturaParaArquivo(captura);
          await salvarImagemDoCaderno(imagemId, arquivo);
        } catch (erroDaImagem) {
          imagemId = null;
          console.warn("A análise de código será salva sem a foto.", erroDaImagem);
        }
      }

      const registro = {
        id,
        chaveAnalise,
        materia,
        tipo: "código",
        assunto: analise.titulo,
        salvoEm: new Date().toISOString(),
        imagemId,
        analise: {
          analysis_type: "code",
          subject: analise.titulo,
          content: analise.resumo,
          language: analise.linguagem,
          original_code: analise.codigoOriginal,
          corrected_code: analise.codigoCorrigido?.trim() || null,
          explanation: analise.explicacao || [],
          input: analise.entrada || "",
          expected_output: analise.saida || "",
          concepts: analise.conceitos || [],
          changes: analise.codigoCorrigido?.trim() ? analise.alteracoes || [] : [],
          correction_impact: analise.codigoCorrigido?.trim() ? analise.impactoCorrecao || "" : "",
          issues: problemas,
        },
      };
      const historico = [registro, ...dados.historico];
      const nomes = new Set([
        ...dados.materias.map((item) => item.nome),
        materia,
      ]);
      const materias = [...nomes].map((nome) => ({
        nome,
        quantidade: historico.filter((item) => item.materia === nome).length,
      }));

      const salvou = salvarCadernoLocal({
        materias,
        historico,
        materiaSelecionada: materia,
      });

      if (!salvou) throw new Error("Não foi possível acessar o armazenamento local.");

      salvarMateriaSelecionada(materia);
      setSalvo(true);
      setAviso("Salvo em Programação no Caderno Inteligente.");
    } catch (erro) {
      setAviso(erro.message || "Não foi possível salvar a análise.");
    } finally {
      salvamentoRef.current = false;
      setSalvando(false);
    }
  }

  return (
    <main className={phoneFrame}>
      <section className={`${phoneScreen} bg-[#171717] text-white`}>
        <header className="relative flex min-h-16 items-center border-b border-white/10 px-4">
          <Link
            href="/?modo=estudante"
            className="flex items-center gap-1 text-sm font-semibold text-[#ffc107] no-underline"
          >
            <IconeVoltar />
            Câmera
          </Link>
          <h1 className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-base font-bold">
            Analisar código
          </h1>
        </header>

        {estadoAnalise !== "sucesso" ? (
          <EstadoDaAnalise
            estado={estadoAnalise}
            mensagem={erroAnalise}
            aoTentarNovamente={tentarNovamente}
          />
        ) : (
          <div
            {...arrasteVertical}
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 pb-8 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
          <div className="mb-4 overflow-hidden rounded-3xl border border-white/10 bg-[#222]">
            <div className="relative h-32 bg-black">
              <PreviewCaptura className="h-full w-full object-cover opacity-80" alternativa={false} />
              <span className="absolute bottom-3 left-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-200 backdrop-blur">
                Código capturado
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                  Linguagem identificada
                </p>
                <div className="mt-1 flex items-center gap-2 font-bold">
                  <span className="grid size-8 place-items-center rounded-xl bg-[#ffc107] text-black">
                    <IconeCodigo />
                  </span>
                  {analise.linguagem}
                </div>
              </div>
              <span className="rounded-full border border-[#ffc107]/30 bg-[#ffc107]/10 px-3 py-1.5 text-xs font-semibold text-[#ffc107]">
                Código identificado
              </span>
            </div>
          </div>

          <section aria-labelledby="titulo-analise">
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ffc107]">
                Verificação do código
              </p>
              <h2 id="titulo-analise" className="mt-1 text-xl font-bold leading-tight">
                {analise.titulo}
              </h2>
              <p className="mt-2 text-sm leading-5 text-zinc-400">{analise.resumo}</p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setPainel("explicacao"); requestAnimationFrame(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }}
                className={`rounded-2xl border px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${painel === "explicacao" ? "border-[#ffc107] bg-[#ffc107] text-black" : "border-white/15 bg-[#222] text-white"}`}
              >
                Explicar código
              </button>
              <button
                type="button"
                onClick={() => { setPainel("correcao"); requestAnimationFrame(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }}
                className={`rounded-2xl border px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${painel === "correcao" ? "border-[#ffc107] bg-[#ffc107] text-black" : "border-white/15 bg-[#222] text-white"}`}
              >
                Jovi Code
              </button>
            </div>




          </section>

          <div ref={resultadoRef} className="scroll-mt-4" />
          {painel === "explicacao" && (
            <section className="mt-4 rounded-3xl border border-white/10 bg-[#202020] p-4" aria-labelledby="titulo-explicacao">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ffc107]">Passo a passo</p>
              <h2 id="titulo-explicacao" className="mt-1 text-lg font-bold">O que este código faz</h2>

              <ol className="mt-4 space-y-4">
                {analise.explicacao.map((passo, indice) => (
                  <li className="flex gap-3 text-base leading-6 text-zinc-300" key={passo}>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#ffc107]/40 text-xs font-bold text-[#ffc107]">
                      {indice + 1}
                    </span>
                    <span>{passo}</span>
                  </li>
                ))}
              </ol>

            {problemas.length ? (
              <section className="my-4" aria-labelledby="problemas-codigo">
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <h3 id="problemas-codigo" className="text-sm font-bold text-white">
                    Pontos para revisar
                  </h3>
                  <span className="text-xs font-bold text-zinc-400">
                    {problemas.length} {problemas.length === 1 ? "encontrado" : "encontrados"}
                  </span>
                </div>
                <div className="space-y-2">
                  {problemas.map((problema, indice) => {
                    const rotulo = rotulosDeSeveridade[problema.severidade] || "Aviso";

                    return (
                      <details open={indice === 0 && problema.severidade === "erro"} className="group rounded-2xl border border-white/15 bg-[#202020] p-4" key={`${problema.linha}-${problema.titulo}`}>
                        <summary className="cursor-pointer marker:text-[#ffc107]">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#ffc107]">
                            {indice + 1}. {rotulo}
                          </span>
                          <span className="rounded-full border border-[#ffc107]/30 bg-[#ffc107]/10 px-2 py-1 text-xs font-extrabold text-[#ffc107]">
                            LINHA {problema.linha}
                          </span>
                        </div>
                        <h4 className="mt-2.5 text-sm font-bold">{problema.titulo}</h4>
                        </summary>
                        <code className="mt-3 block whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 text-sm leading-6 text-[#ffc107]">
                          {analise.codigoOriginal.split("\n")[problema.linha - 1] || "Trecho não disponível"}
                        </code>
                        <p className="mt-2 text-sm leading-6 text-zinc-300">{problema.descricao}</p>
                      </details>
                    );
                  })}
                </div>
              </section>
            ) : (
              <div className="my-4 rounded-2xl border border-[#ffc107]/25 bg-[#ffc107]/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-[#ffc107]/15 font-black text-[#ffc107]">✓</span>
                  <div>
                    <strong className="block text-sm text-[#ffc107]">Nenhum problema encontrado</strong>
                    <p className="mt-1 text-[13px] leading-4 text-zinc-400">A análise não encontrou erros ou avisos neste código.</p>
                  </div>
                </div>
              </div>
            )}
            </section>
          )}

          {painel === "correcao" && !temCorrecao && (
            <section className="mt-4 rounded-2xl border border-[#ffc107]/25 p-4">
              <h2 className="font-bold text-[#ffc107]">Nenhuma correção proposta</h2>
              <p className="mt-2 text-sm text-zinc-300">Nenhuma alteração foi proposta. Consulte a explicação e os pontos de revisão antes de utilizar o código.</p>
            </section>
          )}
          {painel === "correcao" && temCorrecao && (
            <section className="mt-4 rounded-3xl border border-white/10 bg-[#202020] p-4" aria-labelledby="titulo-correcao">
              <h2 id="titulo-correcao" className="text-lg font-bold">Jovi Code</h2>
              <div className="my-4 grid grid-cols-2 rounded-xl bg-black/30 p-1" role="group" aria-label="Versões do código">
                {[
                  ["original", "Antes"],
                  ["corrigido", "Depois"],
                ].map(([valor, rotulo]) => (
                  <button
                    type="button"
                    aria-pressed={comparacao === valor}
                    onClick={() => setComparacao(valor)}
                    className={`min-h-11 rounded-lg py-2 text-sm font-bold ${comparacao === valor ? "bg-white/10 text-white" : "text-zinc-400"}`}
                    key={valor}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>

              <BlocoCodigo
                codigo={comparacao === "original" ? analise.codigoOriginal : analise.codigoCorrigido}
                destaque={comparacao === "corrigido"}
                trechos={analise.comparacoes}
                versao={comparacao === "corrigido" ? "depois" : "antes"}
                linhaDestaque={comparacao === "original" ? problemas[0]?.linha : undefined}
              />

              {comparacao === "corrigido" && (
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition active:scale-[0.99] ${copiado ? "border-[#ffc107]/30 bg-[#ffc107]/10 text-[#ffc107]" : "border-white/15 bg-white/[0.04] text-white"}`}
                >
                  <span aria-hidden="true">{copiado ? "✓" : "▣"}</span>
                  {copiado ? "Código copiado!" : "Copiar código corrigido"}
                </button>
              )}

              <p className="mt-3 text-sm leading-6 text-zinc-300">
                A correção é uma sugestão. Revise antes de utilizar.
              </p>
            </section>
          )}

          <div className="mt-5 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={salvarNoCaderno}
              disabled={salvando || salvo}
              className="w-full rounded-2xl bg-[#ffc107] px-4 py-4 text-sm font-extrabold text-black transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
            >
              {salvando
                ? "Salvando..."
                : salvo
                  ? "Salvo no Caderno ✓"
                  : "Salvar no Caderno Inteligente"}
            </button>
            {aviso && (
              <p className="mt-3 text-center text-sm leading-6 text-zinc-400" role="status" aria-live="polite">
                {aviso}
              </p>
            )}
            {aviso.startsWith("Salvo") && (
              <Link href="/caderno" className="mt-2 block text-center text-xs font-bold text-[#ffc107] no-underline">
                Abrir Caderno Inteligente
              </Link>
            )}
          </div>
          </div>
        )}
      </section>
    </main>
  );
}

function CenarioCodigo() {
  const parametros = useSearchParams();
  return <CodigoConteudo key={parametros.get("estado") || "normal"} />;
}

export default function Codigo() {
  return (
    <Suspense fallback={null}>
      <CenarioCodigo />
    </Suspense>
  );
}
