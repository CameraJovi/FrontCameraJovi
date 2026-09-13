"use client";

import { useEffect, useState } from "react";
import CabecalhoAcao from "../components/CabecalhoAcao";
import {
  carregarGrade,
  salvarGrade,
  validarAula,
  DIAS,
} from "../services/gradeAulas";
import { actionBody, actionScreen, phoneFrame } from "../lib/tailwind";

const vazio = { materia: "", dia: 1, inicio: "19:00", fim: "20:40" };
const campo =
  "mt-2 min-h-11 w-full min-w-0 rounded-xl border border-white/20 bg-[#242424] px-3 text-base text-white [color-scheme:dark]";

export default function Horarios() {
  const [grade, setGrade] = useState([]);
  const [aula, setAula] = useState(vazio);
  const [pronto, setPronto] = useState(false);
  const [aviso, setAviso] = useState("");
  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (ativo) {
        setGrade(carregarGrade());
        setPronto(true);
      }
    });
    return () => {
      ativo = false;
    };
  }, []);
  function persistir(proxima, mensagem) {
    try {
      salvarGrade(proxima);
      setGrade(proxima);
      setAviso(mensagem);
      return true;
    } catch (erro) {
      setAviso(erro.message);
      return false;
    }
  }
  function salvar(evento) {
    evento.preventDefault();
    const nova = {
      ...aula,
      materia: aula.materia.trim(),
      id: aula.id || crypto.randomUUID(),
    };
    const erro = validarAula(nova, grade);
    if (erro) {
      setAviso(erro);
      return;
    }
    if (
      persistir(
        [...grade.filter((item) => item.id !== nova.id), nova],
        "Horário salvo! As próximas fotos usarão essa grade.",
      )
    )
      setAula(vazio);
  }
  return (
    <main className={phoneFrame}>
      <section className={actionScreen}>
        <CabecalhoAcao
          titulo="Horário de aulas"
          voltarPara="/caderno"
          textoVoltar="Caderno"
        />
        <div className={actionBody}>
          <p className="text-sm leading-6 text-zinc-300">
            Cadastre sua semana uma vez. A Jovi sugere a disciplina pelo horário
            em que você tirou a foto, mesmo que salve depois.
          </p>
          {aviso && (
            <p
              role="status"
              className="rounded-xl border border-[#ffc107]/30 p-3 text-sm text-[#ffc107]"
            >
              {aviso}
            </p>
          )}
          <form
            onSubmit={salvar}
            className="grid gap-4 rounded-2xl border border-white/15 p-4"
          >
            <h2 className="font-bold">
              {aula.id ? "Editar aula" : "Adicionar aula"}
            </h2>
            <label className="text-sm">
              Disciplina
              <input
                required
                maxLength={80}
                className={campo}
                value={aula.materia}
                placeholder="Ex.: Cálculo"
                onChange={(e) => setAula({ ...aula, materia: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Dia da semana
              <select
                className={campo}
                value={aula.dia}
                onChange={(e) =>
                  setAula({ ...aula, dia: Number(e.target.value) })
                }
              >
                {DIAS.map((dia, i) => (
                  <option value={i} key={dia}>
                    {dia}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="min-w-0 text-sm">
                Início
                <input
                  required
                  type="time"
                  className={campo}
                  value={aula.inicio}
                  onChange={(e) => setAula({ ...aula, inicio: e.target.value })}
                />
              </label>
              <label className="min-w-0 text-sm">
                Fim
                <input
                  required
                  type="time"
                  className={campo}
                  value={aula.fim}
                  onChange={(e) => setAula({ ...aula, fim: e.target.value })}
                />
              </label>
            </div>
            <button
              disabled={!pronto}
              className="min-h-12 rounded-xl bg-[#ffc107] font-bold text-black disabled:opacity-50"
            >
              Salvar horário
            </button>
            {aula.id && (
              <button
                type="button"
                className="min-h-11 text-sm"
                onClick={() => setAula(vazio)}
              >
                Cancelar edição
              </button>
            )}
          </form>
          <h2 className="font-bold">Sua semana</h2>
          {pronto && !grade.length && (
            <p className="text-sm text-zinc-300">
              Nenhuma aula cadastrada. Comece pela primeira disciplina.
            </p>
          )}
          {[...grade]
            .sort(
              (a, b) =>
                ((a.dia + 6) % 7) - ((b.dia + 6) % 7) ||
                a.inicio.localeCompare(b.inicio),
            )
            .map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-white/15 p-4"
              >
                <h3 className="break-words font-bold">{item.materia}</h3>
                <p className="mt-1 text-sm text-zinc-300">
                  {DIAS[item.dia]} · {item.inicio}–{item.fim}
                </p>
                <div className="mt-2 flex gap-4">
                  <button
                    type="button"
                    className="min-h-11 text-sm text-[#ffc107]"
                    onClick={() => {
                      setAula(item);
                      setAviso("Edite a aula no formulário acima.");
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="min-h-11 text-sm text-zinc-300"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remover este horário? As fotos salvas não serão alteradas.",
                        ) &&
                        persistir(
                          grade.filter((a) => a.id !== item.id),
                          "Horário removido.",
                        )
                      )
                        setAula(vazio);
                    }}
                  >
                    Remover
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}
