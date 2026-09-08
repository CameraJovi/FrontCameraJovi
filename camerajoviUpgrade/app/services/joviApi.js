const URL_DA_API = (
  process.env.NEXT_PUBLIC_JOVI_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const ROTAS_DE_ANALISE = {
  resumo: "resumo",
  flashcards: "flashcards",
  math: "math",
};

async function lerResposta(resposta) {
  const texto = await resposta.text();
  let dados = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = { detail: texto };
    }
  }

  if (!resposta.ok) {
    throw new Error(
      dados?.detail || `A API respondeu com o status ${resposta.status}.`,
    );
  }

  return dados;
}

async function requisitar(caminho, opcoes) {
  try {
    const resposta = await fetch(`${URL_DA_API}/api/${caminho}`, opcoes);
    return await lerResposta(resposta);
  } catch (erro) {
    if (erro instanceof TypeError) {
      throw new Error(
        "Não foi possível acessar a API Jovi. Confirme se o backend Python está ligado.",
      );
    }

    throw erro;
  }
}

export async function analisarImagem(tipo, arquivo) {
  const rota = ROTAS_DE_ANALISE[tipo];

  if (!rota) throw new Error("Tipo de análise inválido.");

  const formulario = new FormData();
  formulario.append("image", arquivo, arquivo.name || "captura-jovi.jpg");

  return requisitar(rota, {
    method: "POST",
    body: formulario,
  });
}

export function salvarAnalise(materia, analise) {
  return requisitar("salvar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ materia, analysis: analise }),
  });
}

export function verificarSaudeDaApi() {
  return requisitar("health", { cache: "no-store" });
}
