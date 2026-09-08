const CHAVE_MATERIAS = "jovi:materias";
const CHAVE_HISTORICO = "jovi:historico";
const CHAVE_MATERIA_SELECIONADA = "jovi:materia-selecionada";

export const MATERIAS_INICIAIS = [
  { nome: "Matemática", quantidade: 0 },
  { nome: "Física", quantidade: 0 },
  { nome: "Português", quantidade: 0 },
  { nome: "Programação", quantidade: 0 },
  { nome: "Inglês", quantidade: 0 },
];

function obterArmazenamento() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function lerLista(armazenamento, chave) {
  if (!armazenamento) return [];

  try {
    const valor = armazenamento.getItem(chave);
    const lista = valor ? JSON.parse(valor) : null;
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function carregarCadernoLocal() {
  const armazenamento = obterArmazenamento();
  const historico = lerLista(armazenamento, CHAVE_HISTORICO);
  const materiasSalvas = lerLista(armazenamento, CHAVE_MATERIAS);
  const materiasBase = materiasSalvas.length
    ? materiasSalvas
    : MATERIAS_INICIAIS;
  const nomesDasMaterias = [
    ...new Set([
      ...materiasBase.map((materia) => materia.nome).filter(Boolean),
      ...historico.map((item) => item.materia).filter(Boolean),
    ]),
  ];
  const materias = nomesDasMaterias.map((nome) => ({
    nome,
    quantidade: historico.filter((item) => item.materia === nome).length,
  }));
  const materiaSalva = armazenamento?.getItem(CHAVE_MATERIA_SELECIONADA);
  const materiaSelecionada = nomesDasMaterias.includes(materiaSalva)
    ? materiaSalva
    : nomesDasMaterias[0] || "";

  return { materias, historico, materiaSelecionada };
}

export function salvarCadernoLocal({
  materias,
  historico,
  materiaSelecionada,
}) {
  const armazenamento = obterArmazenamento();
  if (!armazenamento) return false;

  try {
    armazenamento.setItem(CHAVE_MATERIAS, JSON.stringify(materias));
    armazenamento.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
    armazenamento.setItem(CHAVE_MATERIA_SELECIONADA, materiaSelecionada);
    return true;
  } catch {
    return false;
  }
}

export function salvarMateriaSelecionada(materia) {
  const armazenamento = obterArmazenamento();
  if (!armazenamento) return false;

  try {
    armazenamento.setItem(CHAVE_MATERIA_SELECIONADA, materia);
    return true;
  } catch {
    return false;
  }
}
