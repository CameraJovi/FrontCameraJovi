"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import EstadoAnalise from "../components/EstadoAnalise";
import PreviewCaptura from "../components/PreviewCaptura";
import { analiseCodigoMock } from "../mocks/codigoMock";
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

function BlocoCodigo({ codigo, destaque = false, linhaDestaque }) {
  const linhas = codigo.split("\n");
  const arrasteHorizontal = useArrasteScroll("x");

  return (
    <div className={`overflow-hidden rounded-2xl border ${destaque ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-white/10 bg-black/35"}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="size-2 rounded-full bg-red-400/70" />
          <i className="size-2 rounded-full bg-amber-300/70" />
          <i className="size-2 rounded-full bg-emerald-400/70" />
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-600">
          {destaque ? "Código revisado" : "Código original"}
        </span>
      </div>
      <pre
        {...arrasteHorizontal}
        className="cursor-grab touch-pan-x overflow-x-auto py-3 text-[11px] leading-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <code className="block min-w-max font-mono text-zinc-200">
          {linhas.map((linha, indice) => {
            const numero = indice + 1;
            const marcada = numero === linhaDestaque;

            return (
              <span
                className={`flex min-h-5 px-3 ${marcada ? destaque ? "bg-emerald-400/10" : "bg-red-400/10" : ""}`}
                key={`${numero}-${linha}`}
              >
                <span className={`mr-4 w-4 select-none text-right ${marcada ? destaque ? "text-emerald-400" : "text-red-400" : "text-zinc-700"}`}>
                  {numero}
                </span>
                <span>{linha || " "}</span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
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
      <span className={`grid size-16 place-items-center rounded-2xl text-2xl font-black ${semCodigo ? "bg-amber-400/10 text-amber-300" : "bg-red-400/10 text-red-400"}`}>
        {semCodigo ? "</>" : "!"}
      </span>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffc107]">
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

const estilosDeSeveridade = {
  erro: {
    rotulo: "Erro",
    borda: "border-red-400/30",
    fundo: "bg-red-400/[0.07]",
    texto: "text-red-300",
    selo: "bg-red-300 text-red-950",
  },
  aviso: {
    rotulo: "Aviso",
    borda: "border-amber-400/30",
    fundo: "bg-amber-400/[0.07]",
    texto: "text-amber-300",
    selo: "bg-amber-300 text-amber-950",
  },
  sugestao: {
    rotulo: "Sugestão",
    borda: "border-sky-400/30",
    fundo: "bg-sky-400/[0.07]",
    texto: "text-sky-300",
    selo: "bg-sky-300 text-sky-950",
  },
};

function criarIdRegistro() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function CodigoConteudo() {
  const parametros = useSearchParams();
  const cenario = parametros.get("estado");
  const [painel, setPainel] = useState("diagnostico");
  const [comparacao, setComparacao] = useState("corrigido");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [estadoAnalise, setEstadoAnalise] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);
  const analise = analiseCodigoMock;
  const problemas = cenario === "sem-erros"
    ? []
    : Array.isArray(analise.problemas) ? analise.problemas : [];
  const qualidade = problemas.length
    ? analise.qualidade
    : analise.qualidade.map((item) => ({
        ...item,
        resultado: item.estado === "ok" ? item.resultado : "Aprovada",
        estado: "ok",
      }));
  const arrasteVertical = useArrasteScroll("y");

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      if (tentativa > 0) {
        setEstadoAnalise("sucesso");
      } else if (cenario === "erro") {
        setEstadoAnalise("erro");
      } else if (cenario === "sem-codigo") {
        setEstadoAnalise("sem-codigo");
      } else {
        setEstadoAnalise("sucesso");
      }
    }, 1100);

    return () => window.clearTimeout(temporizador);
  }, [cenario, tentativa]);

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
    if (salvando) return;

    setSalvando(true);
    setSalvo(false);
    setAviso("Salvando análise...");

    try {
      const materia = "Programação";
      const dados = carregarCadernoLocal();
      const id = criarIdRegistro();
      const captura = obterCaptura();
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
          corrected_code: analise.codigoCorrigido,
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
              <span className="absolute bottom-3 left-3 rounded-full bg-black/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-200 backdrop-blur">
                Código capturado
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
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
                {analise.confianca}% de confiança
              </span>
            </div>
          </div>

          <section aria-labelledby="titulo-analise">
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ffc107]">
                Verificação do código
              </p>
              <h2 id="titulo-analise" className="mt-1 text-xl font-bold leading-tight">
                {analise.titulo}
              </h2>
              <p className="mt-2 text-sm leading-5 text-zinc-400">{analise.resumo}</p>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/10 bg-[#202020] p-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Complexidade</span>
                <strong className="mt-1 block text-sm text-white">{analise.complexidade}</strong>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#202020] p-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Tamanho</span>
                <strong className="mt-1 block text-sm text-white">{analise.totalLinhas} linhas</strong>
              </div>
              <div className={`rounded-2xl border p-3 ${problemas.length ? "border-amber-400/25 bg-amber-400/[0.07]" : "border-emerald-400/25 bg-emerald-400/[0.07]"}`}>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${problemas.length ? "text-amber-300/60" : "text-emerald-300/60"}`}>Diagnóstico</span>
                <strong className={`mt-1 block text-sm ${problemas.length ? "text-amber-300" : "text-emerald-300"}`}>
                  {problemas.length ? `${problemas.length} ajustes` : "Sem erros"}
                </strong>
              </div>
            </div>

            <BlocoCodigo
              codigo={analise.codigoOriginal}
              linhaDestaque={problemas[0]?.linha}
            />

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#202020] p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffc107]">Raio-X do código</p>
                  <h3 className="mt-1 text-sm font-bold">Análise de qualidade</h3>
                </div>
                <span className="text-[10px] text-zinc-500">4 verificações</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {qualidade.map((item) => (
                  <div className="flex items-center gap-2 rounded-xl bg-black/25 p-2.5" key={item.nome}>
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-black ${item.estado === "ok" ? "bg-emerald-400/15 text-emerald-400" : "bg-red-400/15 text-red-400"}`}>
                      {item.estado === "ok" ? "✓" : "!"}
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-[11px] text-zinc-200">{item.nome}</strong>
                      <small className={`block truncate text-[9px] ${item.estado === "ok" ? "text-zinc-500" : "text-red-300"}`}>{item.resultado}</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {problemas.length ? (
              <section className="my-4" aria-labelledby="problemas-codigo">
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <h3 id="problemas-codigo" className="text-sm font-bold text-white">
                    Pontos para revisar
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-500">
                    {problemas.length} {problemas.length === 1 ? "encontrado" : "encontrados"}
                  </span>
                </div>
                <div className="space-y-2">
                  {problemas.map((problema, indice) => {
                    const estilo = estilosDeSeveridade[problema.severidade] || estilosDeSeveridade.aviso;

                    return (
                      <article className={`rounded-2xl border p-4 ${estilo.borda} ${estilo.fundo}`} key={`${problema.linha}-${problema.titulo}`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${estilo.texto}`}>
                            {indice + 1}. {estilo.rotulo}
                          </span>
                          <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${estilo.selo}`}>
                            LINHA {problema.linha}
                          </span>
                        </div>
                        <h4 className="mt-2.5 text-sm font-bold">{problema.titulo}</h4>
                        <p className="mt-1 text-xs leading-5 text-zinc-400">{problema.descricao}</p>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : (
              <div className="my-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-emerald-400/15 font-black text-emerald-400">✓</span>
                  <div>
                    <strong className="block text-sm text-emerald-300">Nenhum problema encontrado</strong>
                    <p className="mt-1 text-[11px] leading-4 text-zinc-400">A análise não encontrou erros ou avisos neste código.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPainel("explicacao")}
                className={`rounded-2xl border px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${painel === "explicacao" ? "border-[#ffc107] bg-[#ffc107] text-black" : "border-white/15 bg-[#222] text-white"}`}
              >
                Explicar código
              </button>
              <button
                type="button"
                onClick={() => setPainel("correcao")}
                className={`rounded-2xl border px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${painel === "correcao" ? "border-[#ffc107] bg-[#ffc107] text-black" : "border-white/15 bg-[#222] text-white"}`}
              >
                Jovi Code
              </button>
            </div>
          </section>

          {painel === "explicacao" && (
            <section className="mt-4 rounded-3xl border border-white/10 bg-[#202020] p-4" aria-labelledby="titulo-explicacao">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ffc107]">Passo a passo</p>
              <h2 id="titulo-explicacao" className="mt-1 text-lg font-bold">O que este código faz</h2>

              <div className="mt-4 grid gap-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Entrada</span>
                  <p className="mt-1 text-xs leading-5 text-zinc-300">{analise.entrada}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Saída esperada</span>
                  <p className="mt-1 text-xs leading-5 text-zinc-300">{analise.saida}</p>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Conceitos encontrados</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {analise.conceitos.map((conceito) => (
                    <span className="rounded-full border border-[#ffc107]/20 bg-[#ffc107]/5 px-2.5 py-1 text-[10px] font-semibold text-[#ffc107]" key={conceito}>
                      {conceito}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="mt-5 text-sm font-bold text-white">Fluxo da lógica</h3>
              <ol className="mt-4 space-y-4">
                {analise.explicacao.map((passo, indice) => (
                  <li className="flex gap-3 text-sm leading-5 text-zinc-300" key={passo}>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#ffc107]/40 text-xs font-bold text-[#ffc107]">
                      {indice + 1}
                    </span>
                    <span>{passo}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {painel === "correcao" && (
            <section className="mt-4 rounded-3xl border border-white/10 bg-[#202020] p-4" aria-labelledby="titulo-correcao">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#ffc107] text-black">
                  <IconeCodigo />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ffc107]">Jovi Code</p>
                  <h2 id="titulo-correcao" className="text-lg font-bold">Correção inteligente</h2>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-emerald-400">Correção pronta</strong>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[9px] font-bold text-emerald-300">
                    {analise.alteracoes.length} ALTERAÇÕES
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-[1.55] text-zinc-400">{analise.impactoCorrecao}</p>
              </div>

              <p className="mt-3 rounded-xl border border-[#ffc107]/20 bg-[#ffc107]/5 p-3 text-[10px] leading-[1.5] text-zinc-400">
                <strong className="text-[#ffc107]">Importante:</strong> a correção é uma sugestão. Revise antes de utilizar.
              </p>

              <h3 className="mt-4 text-xs font-bold text-zinc-300">Compare as versões</h3>

              <div className="my-4 grid grid-cols-2 rounded-xl bg-black/30 p-1" role="tablist" aria-label="Versões do código">
                {[
                  ["original", "Original"],
                  ["corrigido", "Corrigido"],
                ].map(([valor, rotulo]) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={comparacao === valor}
                    onClick={() => setComparacao(valor)}
                    className={`rounded-lg py-2 text-xs font-bold ${comparacao === valor ? "bg-white/10 text-white" : "text-zinc-500"}`}
                    key={valor}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>

              <BlocoCodigo
                codigo={comparacao === "original" ? analise.codigoOriginal : analise.codigoCorrigido}
                destaque={comparacao === "corrigido"}
                linhaDestaque={comparacao === "original" ? problemas[0]?.linha : undefined}
              />

              {comparacao === "corrigido" && (
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition active:scale-[0.99] ${copiado ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/15 bg-white/[0.04] text-white"}`}
                >
                  <span aria-hidden="true">{copiado ? "✓" : "▣"}</span>
                  {copiado ? "Código copiado!" : "Copiar código corrigido"}
                </button>
              )}

              <div className="mt-4 border-t border-white/10 pt-4">
                <h3 className="text-xs font-bold text-white">O que a Jovi alterou</h3>
                <ul className="mt-3 space-y-2">
                {analise.alteracoes.map((alteracao) => (
                  <li className="flex gap-2 text-xs leading-5 text-zinc-400" key={alteracao}>
                    <span className="mt-1 text-emerald-400">✓</span>
                    {alteracao}
                  </li>
                ))}
                </ul>
              </div>
            </section>
          )}

          <div className="mt-5 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={salvarNoCaderno}
              disabled={salvando}
              className="w-full rounded-2xl bg-[#ffc107] px-4 py-4 text-sm font-extrabold text-black transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
            >
              {salvando
                ? "Salvando..."
                : salvo
                  ? "Salvo no Caderno ✓"
                  : "Salvar no Caderno Inteligente"}
            </button>
            {aviso && (
              <p className="mt-3 text-center text-xs leading-5 text-zinc-400" role="status" aria-live="polite">
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

export default function Codigo() {
  return (
    <Suspense fallback={null}>
      <CodigoConteudo />
    </Suspense>
  );
}
