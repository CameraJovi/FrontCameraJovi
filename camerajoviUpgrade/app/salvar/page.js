"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import CabecalhoAcao from "../components/CabecalhoAcao";
import ItemHistorico from "../components/ItemHistorico";
import { salvarAnalise } from "../services/joviApi";
import {
  capturaParaArquivo,
  obterCaptura,
  obterUltimaAnaliseSerializada,
} from "../services/captureSession";
import { salvarImagemDoCaderno } from "../services/cadernoImagens";
import {
  carregarCadernoLocal,
  MATERIAS_INICIAIS,
  salvarCadernoLocal,
} from "../services/cadernoHistorico";
import {
  actionBody,
  actionScreen,
  analysisState,
  phoneFrame,
} from "../lib/tailwind";

function assinarArmazenamento(aoMudar) {
  window.addEventListener("storage", aoMudar);
  return () => window.removeEventListener("storage", aoMudar);
}

function dadosDoRegistro(registro) {
  if (!registro) return null;

  try {
    return JSON.parse(registro) || null;
  } catch {
    return null;
  }
}

export default function Salvar() {
  const router = useRouter();
  const [materias, setMaterias] = useState(MATERIAS_INICIAIS);
  const [historico, setHistorico] = useState([]);
  const [selecionada, setSelecionada] = useState(MATERIAS_INICIAIS[0].nome);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [itemHistoricoAberto, setItemHistoricoAberto] = useState(null);
  const [armazenamentoCarregado, setArmazenamentoCarregado] = useState(false);
  const registroDaAnalise = useSyncExternalStore(
    assinarArmazenamento,
    obterUltimaAnaliseSerializada,
    () => null,
  );
  const dadosDaAnalise = useMemo(
    () => dadosDoRegistro(registroDaAnalise),
    [registroDaAnalise],
  );
  const analise = dadosDaAnalise?.analise || null;
  const carregandoAnalise = registroDaAnalise === null;

  useEffect(() => {
    let cancelado = false;

    async function carregarDadosLocais() {
      await Promise.resolve();

      if (cancelado) return;

      const dadosDoCaderno = carregarCadernoLocal();

      setMaterias(dadosDoCaderno.materias);
      setHistorico(dadosDoCaderno.historico);
      setSelecionada(dadosDoCaderno.materiaSelecionada);

      setArmazenamentoCarregado(true);
    }

    carregarDadosLocais();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!armazenamentoCarregado) return;

    const salvou = salvarCadernoLocal({
      materias,
      historico,
      materiaSelecionada: selecionada,
    });

    if (!salvou) {
      console.warn("Não foi possível salvar os dados no localStorage.");
    }
  }, [armazenamentoCarregado, historico, materias, selecionada]);

  function criarMateria() {
    const nome = window.prompt("Digite o nome da nova disciplina:");

    if (nome === null) return;
    if (nome.trim() === "") {
      setAviso("DÊ UM NOME À DISCIPLINA!");
      return;
    }

    const nomeLimpo = nome.trim();
    const materiaExistente = materias.find(
      (materia) => materia.nome.toLowerCase() === nomeLimpo.toLowerCase(),
    );

    if (materiaExistente) {
      setSelecionada(materiaExistente.nome);
      setAviso("ESSA DISCIPLINA JÁ EXISTE.");
      return;
    }

    const novaMateria = { nome: nomeLimpo, quantidade: 0 };
    setMaterias([...materias, novaMateria]);
    setSelecionada(novaMateria.nome);
    setAviso(`MATÉRIA ${novaMateria.nome.toUpperCase()} CRIADA!`);
  }

  async function confirmarSalvamento() {
    if (!analise) {
      setAviso("GERE UM RESUMO, FLASHCARD OU RESOLUÇÃO ANTES DE SALVAR.");
      return;
    }

    try {
      setSalvando(true);
      setAviso("SALVANDO...");
      const resultado = await salvarAnalise(selecionada, analise);
      const idDoRegistro = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const captura = obterCaptura();
      let imagemId = null;
      let fotoNaoSalva = true;

      if (captura?.id === dadosDaAnalise?.capturaId) {
        try {
          const arquivoDaCaptura = await capturaParaArquivo(captura);
          imagemId = `foto-${idDoRegistro}`;
          await salvarImagemDoCaderno(imagemId, arquivoDaCaptura);
          fotoNaoSalva = false;
        } catch (erroDaFoto) {
          imagemId = null;
          fotoNaoSalva = true;
          console.warn("A análise foi salva sem a foto original.", erroDaFoto);
        }
      }

      const novoRegistro = {
        id: idDoRegistro,
        materia: resultado.materia,
        tipo: analise.analysis_type,
        assunto: analise.subject,
        salvoEm: new Date().toISOString(),
        analise,
        imagemId,
      };
      const historicoAtualizado = [novoRegistro, ...historico];

      setMaterias((atuais) =>
        atuais.map((materia) =>
          materia.nome === selecionada
            ? { ...materia, quantidade: materia.quantidade + 1 }
            : materia,
        ),
      );
      setHistorico(historicoAtualizado);

      setAviso(
        fotoNaoSalva
          ? `ANÁLISE SALVA EM ${resultado.materia.toUpperCase()}, MAS A FOTO NÃO PÔDE SER GUARDADA.`
          : `FOTO E ANÁLISE SALVAS EM ${resultado.materia.toUpperCase()}!`,
      );
    } catch (erro) {
      setAviso(erro.message || "NÃO FOI POSSÍVEL SALVAR.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className={phoneFrame}>
      <section className={actionScreen}>
        <CabecalhoAcao titulo="Salvar em Matéria" />

        <div className={actionBody}>
          {aviso && <p className="rounded-md bg-[#ffc107] px-3.5 py-2 text-center text-[11px] font-bold text-[#1a1a1a]">{aviso}</p>}

          {!carregandoAnalise && !analise ? (
            <div className={`${analysisState} border-[#ffc107]/45`}>
              <strong className="text-[15px] text-white">Nenhuma análise disponível</strong>
              <span>Primeiro capture uma imagem e gere um resultado com a Jovi.</span>
              <Link className="rounded-[9px] border border-[#ffc107] px-3 py-[9px] text-xs font-bold text-[#ffc107] no-underline" href="/">Voltar à câmera</Link>
            </div>
          ) : (
            <>
              {analise && (
                <div className="flex flex-col gap-[3px] rounded-[9px] border-l-[3px] border-[#ffc107] bg-[#242424] px-3.5 py-3">
                  <span className="text-[10px] font-bold uppercase text-[#ffc107]">{analise.analysis_type}</span>
                  <strong className="text-sm text-white">{analise.subject}</strong>
                  <small className="text-[10px] text-[#999]">A foto original será incluída neste registro.</small>
                </div>
              )}

              <p className="text-center text-[13px] text-[#888]">
                Escolha a disciplina onde esta análise será salva
              </p>

              <div className="flex flex-col gap-2.5">
                {materias.map((materia) => (
                  <button
                    className={`flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 text-left text-inherit ${materia.nome === selecionada ? "border-[#ffc107] bg-[#ffc107]/[0.06]" : "border-[#333] bg-[#242424]"}`}
                    type="button"
                    aria-pressed={materia.nome === selecionada}
                    onClick={() => setSelecionada(materia.nome)}
                    key={materia.nome}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#ffc107]/10 text-[#ffc107]">
                      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </span>
                    <span className="flex flex-1 flex-col gap-[3px]">
                      <strong className="text-sm text-white">{materia.nome}</strong>
                      <small className="text-[11px] text-[#777]">{materia.quantidade} scans salvos</small>
                    </span>
                    <span className={`flex size-[22px] items-center justify-center rounded-full border-2 ${materia.nome === selecionada ? "border-[#ffc107] bg-[#ffc107]" : "border-[#444]"}`}>
                      {materia.nome === selecionada && <span className="size-2 rounded-full bg-[#1a1a1a]" />}
                    </span>
                  </button>
                ))}

                <button className="flex cursor-pointer items-center gap-3.5 rounded-xl border border-[#333] bg-[#242424] p-4 text-left text-inherit" type="button" onClick={criarMateria}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#ffc107]/10 text-[#ffc107]">
                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <span className="flex flex-1 flex-col gap-[3px]"><strong className="text-sm text-white">Criar nova matéria...</strong></span>
                </button>
              </div>

              <button
                className="w-full cursor-pointer rounded-xl border-0 bg-[#ffc107] p-[15px] text-[15px] font-bold text-[#1a1a1a] disabled:cursor-wait disabled:opacity-55"
                type="button"
                onClick={confirmarSalvamento}
                disabled={salvando || !analise}
              >
                {salvando ? "Salvando..." : "Salvar aqui"}
              </button>

              {(aviso.startsWith("FOTO E ANÁLISE") || aviso.startsWith("ANÁLISE SALVA")) && (
                <button className="cursor-pointer rounded-[10px] border border-[#444] bg-transparent p-[11px] font-semibold text-white" type="button" onClick={() => router.push("/")}>
                  Voltar à câmera
                </button>
              )}
            </>
          )}

          {historico.length > 0 && (
            <section className="flex flex-col gap-2.5 pt-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm text-white">Salvos recentemente</h2>
                <span className="text-[10px] text-[#888]">{historico.length} salvos</span>
              </div>

              <button
                className="flex min-h-[58px] w-full cursor-pointer items-center justify-between gap-3 rounded-[11px] border-0 bg-[#ffc107] px-[13px] py-[11px] text-left text-[#171717] shadow-[0_5px_16px_rgba(255,193,7,0.16)]"
                type="button"
                onClick={() => router.push("/caderno")}
              >
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <strong className="text-xs font-extrabold">Ver caderno completo</strong>
                  <small className="text-[9px] opacity-70">Todas as matérias e conteúdos salvos</small>
                </span>
                <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>

              <div className="flex flex-col gap-2">
                {historico.slice(0, 8).map((item) => (
                  <ItemHistorico
                    item={item}
                    aberto={itemHistoricoAberto === item.id}
                    aoAlternar={(id) =>
                      setItemHistoricoAberto((atual) =>
                        atual === id ? null : id,
                      )
                    }
                    key={item.id}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
