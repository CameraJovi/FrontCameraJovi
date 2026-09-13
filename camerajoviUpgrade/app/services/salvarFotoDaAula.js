import { carregarCadernoLocal, salvarCadernoLocal } from "./cadernoHistorico";
import { salvarImagemDoCaderno, removerImagensDoCaderno } from "./cadernoImagens";

export async function salvarFotoDaAula(captura, imagem) {
  if (captura?.modo !== "Estudante" || !captura.aula?.materia) {
    throw new Error("Nenhuma aula identificada para esta captura do Modo Estudante.");
  }
  const id = "aula-" + captura.id;
  const imagemId = "foto-" + id;
  const anteriores = carregarCadernoLocal();
  const existente = anteriores.historico.find((item) => item.id === id);
  if (existente) return existente.materia;

  await salvarImagemDoCaderno(imagemId, imagem);
  try {
    // Releia após gravar a imagem para preservar registros recentes.
    const dados = carregarCadernoLocal();
    const materia = dados.materias.find((item) =>
      item.nome.toLocaleLowerCase() === captura.aula.materia.toLocaleLowerCase()
    )?.nome || captura.aula.materia;
    const registro = {
      id, materia, imagemId, tipo: "scan",
      assunto: "Foto da aula de " + materia,
      salvoEm: new Date().toISOString(),
      capturadaEm: captura.criadaEm,
      aula: captura.aula,
      analise: {
        analysis_type: "scan",
        subject: "Foto da aula de " + materia,
        content: "Foto salva pelo horário da aula no Modo Estudante.",
      },
    };
    const historico = [registro, ...dados.historico];
    const materias = [...new Set([...dados.materias.map((item) => item.nome), materia])]
      .map((nome) => ({ nome, quantidade: historico.filter((item) => item.materia === nome).length }));
    if (!salvarCadernoLocal({ materias, historico, materiaSelecionada: materia })) {
      throw new Error("Não foi possível guardar o registro. Libere espaço e tente novamente.");
    }
    return materia;
  } catch (erro) {
    try { await removerImagensDoCaderno([imagemId]); } catch { /* Preserva o erro original. */ }
    throw erro;
  }
}
