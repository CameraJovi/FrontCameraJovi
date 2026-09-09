export function adaptarAnaliseCodigo(dados) {
  if (!dados || dados.analysis_type !== "code" ||
      !["ok", "no_code"].includes(dados.status)) {
    throw new Error("A Jovi retornou uma resposta inválida. Tente novamente.");
  }
  if (dados.status === "no_code") return null;
  if (typeof dados.original_code !== "string" || !dados.original_code.trim() ||
      typeof dados.language !== "string" || !dados.language.trim() ||
      !Array.isArray(dados.explanation) || !dados.explanation.length ||
      !dados.explanation.every((step) => typeof step === "string" && step.trim()) ||
      !Array.isArray(dados.issues) ||
      !(dados.corrected_code === null || typeof dados.corrected_code === "string")) {
    throw new Error("A análise veio incompleta. Tente novamente.");
  }
  const linhas = dados.original_code.split("\n");
  if (!dados.issues.every((issue) => issue && Number.isInteger(issue.line) &&
      issue.line > 0 && issue.line <= linhas.length &&
      ["erro", "aviso", "sugestao"].includes(issue.severity) &&
      typeof issue.title === "string" && typeof issue.description === "string")) {
    throw new Error("A análise contém diagnósticos inválidos. Tente novamente.");
  }
  const corrigido = dados.corrected_code?.trim() &&
    dados.corrected_code !== dados.original_code ? dados.corrected_code : null;
  const novasLinhas = corrigido?.split("\n") || [];
  const antes = corrigido ? linhas.filter((linha) => !novasLinhas.includes(linha)) : [];
  const depois = novasLinhas.filter((linha) => !linhas.includes(linha));
  return {
    titulo: dados.subject || "Análise de código",
    resumo: dados.content || "",
    linguagem: dados.language,
    codigoOriginal: dados.original_code,
    codigoCorrigido: corrigido,
    explicacao: dados.explanation,
    problemas: dados.issues.map((issue) => ({
      linha: issue.line, severidade: issue.severity,
      titulo: issue.title, descricao: issue.description,
    })),
    comparacoes: Array.from({ length: Math.max(antes.length, depois.length) },
      (_, index) => ({ antes: antes[index] || "", depois: depois[index] || "" })),
  };
}
