"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import CabecalhoAcao from "../components/CabecalhoAcao";
import ItemHistorico from "../components/ItemHistorico";
import { removerImagensDoCaderno } from "../services/cadernoImagens";
import {
  carregarCadernoLocal,
  salvarCadernoLocal,
  salvarMateriaSelecionada,
} from "../services/cadernoHistorico";
import { actionBody, actionScreen, phoneFrame } from "../lib/tailwind";

export default function Caderno() {
  const [materias, setMaterias] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [selecionada, setSelecionada] = useState("");
  const [itemAberto, setItemAberto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState("");
  const arrasteMaterias = useRef({
    ativo: false,
    moveu: false,
    ponteiro: null,
    xInicial: 0,
    rolagemInicial: 0,
  });

  useEffect(() => {
    let cancelado = false;

    async function carregarCaderno() {
      await Promise.resolve();

      if (cancelado) return;

      const dadosDoCaderno = carregarCadernoLocal();

      setMaterias(dadosDoCaderno.materias.map((materia) => materia.nome));
      setHistorico(dadosDoCaderno.historico);
      setSelecionada(dadosDoCaderno.materiaSelecionada);
      setCarregando(false);
    }

    carregarCaderno();

    return () => {
      cancelado = true;
    };
  }, []);

  const registrosDaMateria = useMemo(
    () => historico.filter((item) => item.materia === selecionada),
    [historico, selecionada],
  );

  const quantidades = useMemo(
    () => Object.fromEntries(
      materias.map((materia) => [
        materia,
        historico.filter((item) => item.materia === materia).length,
      ]),
    ),
    [historico, materias],
  );

  function selecionarMateria(materia) {
    setSelecionada(materia);
    setItemAberto(null);
    setAviso("");
    salvarMateriaSelecionada(materia);
  }

  function persistirHistorico(novoHistorico) {
    const materiasAtualizadas = materias.map((nome) => ({
      nome,
      quantidade: novoHistorico.filter((item) => item.materia === nome).length,
    }));

    return salvarCadernoLocal({
      materias: materiasAtualizadas,
      historico: novoHistorico,
      materiaSelecionada: selecionada,
    });
  }

  function renomearRegistro(item) {
    const novoTitulo = window.prompt(
      "Digite o novo título do registro:",
      item.assunto || "",
    );

    if (novoTitulo === null) return;

    const tituloLimpo = novoTitulo.trim();
    if (!tituloLimpo) {
      setAviso("O título do registro não pode ficar vazio.");
      return;
    }

    const historicoAtualizado = historico.map((registro) =>
      registro.id === item.id
        ? { ...registro, assunto: tituloLimpo }
        : registro,
    );

    if (!persistirHistorico(historicoAtualizado)) {
      setAviso("Não foi possível renomear o registro.");
      return;
    }

    setHistorico(historicoAtualizado);
    setAviso("Registro renomeado.");
  }

  async function excluirRegistro(item) {
    const confirmou = window.confirm(
      `Excluir “${item.assunto || "Conteúdo sem título"}” do Caderno?`,
    );

    if (!confirmou) return;

    const historicoAtualizado = historico.filter(
      (registro) => registro.id !== item.id,
    );

    if (!persistirHistorico(historicoAtualizado)) {
      setAviso("Não foi possível excluir o registro.");
      return;
    }

    setHistorico(historicoAtualizado);
    setItemAberto(null);
    setAviso("Registro excluído do Caderno.");

    if (item.imagemId) {
      try {
        await removerImagensDoCaderno([item.imagemId]);
      } catch (erro) {
        console.warn("O registro foi excluído, mas a foto não pôde ser limpa.", erro);
      }
    }
  }

  function iniciarArrasteMaterias(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    arrasteMaterias.current = {
      ativo: true,
      moveu: false,
      ponteiro: event.pointerId,
      xInicial: event.clientX,
      rolagemInicial: event.currentTarget.scrollLeft,
    };
    event.currentTarget.classList.add("cursor-grabbing");
  }

  function moverMaterias(event) {
    const arraste = arrasteMaterias.current;
    if (!arraste.ativo || arraste.ponteiro !== event.pointerId) return;

    const deslocamento = event.clientX - arraste.xInicial;
    if (Math.abs(deslocamento) > 4 && !arraste.moveu) {
      arraste.moveu = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    if (arraste.moveu) {
      event.preventDefault();
      event.currentTarget.scrollLeft = arraste.rolagemInicial - deslocamento;
    }
  }

  function finalizarArrasteMaterias(event) {
    const faixa = event.currentTarget;
    const arraste = arrasteMaterias.current;
    if (arraste.ponteiro !== event.pointerId) return;

    arraste.ativo = false;
    faixa.classList.remove("cursor-grabbing");

    if (faixa.hasPointerCapture?.(event.pointerId)) {
      faixa.releasePointerCapture(event.pointerId);
    }

    window.setTimeout(() => {
      arraste.moveu = false;
    }, 0);
  }

  function impedirCliqueAposArraste(event) {
    if (!arrasteMaterias.current.moveu) return;

    event.preventDefault();
    event.stopPropagation();
    arrasteMaterias.current.moveu = false;
  }

  return (
    <main className={phoneFrame}>
      <section className={actionScreen}>
        <CabecalhoAcao
          titulo="Caderno Inteligente"
          voltarPara="/?modo=estudante"
          textoVoltar="Câmera"
        />

        <div className={`${actionBody} gap-[18px]`}>
          <header className="rounded-xl border-l-[3px] border-[#ffc107] bg-[#242424] p-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#ffc107]">Biblioteca de estudos</span>
            <h2 className="mt-1 text-lg font-bold text-white">{selecionada || "Suas matérias"}</h2>
            <p className="mt-[5px] text-[11px] leading-[1.45] text-[#999]">
              Consulte as fotos e os conteúdos gerados pela Jovi, organizados
              por matéria.
            </p>
          </header>

          {carregando ? (
            <p className="rounded-xl border border-[#333] bg-[#242424] px-[18px] py-7 text-center text-[11px] text-[#999]">Carregando caderno...</p>
          ) : (
            <>
              {aviso && (
                <p className="rounded-[9px] border border-[#ffc107]/40 bg-[#ffc107]/10 px-[11px] py-[9px] text-[10px] leading-[1.4] text-[#ffc107]" role="status">
                  {aviso}
                </p>
              )}

              <nav
                className="flex max-w-full cursor-grab select-none gap-2 overflow-x-auto overscroll-x-contain pb-[3px] [scrollbar-width:none] [touch-action:pan-y] [&::-webkit-scrollbar]:hidden"
                aria-label="Matérias do caderno"
                onPointerDown={iniciarArrasteMaterias}
                onPointerMove={moverMaterias}
                onPointerUp={finalizarArrasteMaterias}
                onPointerCancel={finalizarArrasteMaterias}
                onClickCapture={impedirCliqueAposArraste}
              >
                {materias.map((materia) => (
                  <button
                    className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-2 text-[10px] ${materia === selecionada ? "border-[#ffc107] bg-[#ffc107]/10 text-[#ffc107]" : "border-[#3a3a3a] bg-[#242424] text-[#aaa]"}`}
                    type="button"
                    aria-pressed={materia === selecionada}
                    onClick={() => selecionarMateria(materia)}
                    key={materia}
                  >
                    <span>{materia}</span>
                    <small className="inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#333] px-1 text-[8px] text-white">{quantidades[materia] || 0}</small>
                  </button>
                ))}
              </nav>

              <section className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[13px] font-bold text-white">Todos os conteúdos</h3>
                  <span className="text-[10px] text-[#888]">
                    {registrosDaMateria.length} {registrosDaMateria.length === 1
                      ? "registro"
                      : "registros"}
                  </span>
                </div>

                {registrosDaMateria.length ? (
                  <div className="flex flex-col gap-2">
                    {registrosDaMateria.map((item) => (
                      <ItemHistorico
                        item={item}
                        aberto={itemAberto === item.id}
                        aoAlternar={(id) =>
                          setItemAberto((atual) => atual === id ? null : id)
                        }
                        aoRenomear={renomearRegistro}
                        aoExcluir={excluirRegistro}
                        key={item.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-[7px] rounded-xl border border-[#333] bg-[#242424] px-[18px] py-7 text-center text-[11px] text-[#999]">
                    <strong className="text-[13px] text-white">Nenhum conteúdo salvo nesta matéria</strong>
                    <p>Capture uma imagem e salve uma análise para começar.</p>
                    <Link className="mt-[5px] font-bold text-[#ffc107] no-underline" href="/">Ir para a câmera</Link>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
