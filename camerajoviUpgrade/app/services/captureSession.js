const CHAVE_CAPTURA = "jovi:captura-atual";
const CHAVE_ULTIMA_ANALISE = "jovi:ultima-analise";
const PREFIXO_ANALISE = "jovi:analise:";

function obterSessao() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function lerJson(chave) {
  const sessao = obterSessao();

  if (!sessao) return null;

  try {
    const valor = sessao.getItem(chave);
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
}

function blobParaDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error("Não foi possível preparar a foto."));
    leitor.readAsDataURL(blob);
  });
}

export async function guardarCaptura(blob) {
  const sessao = obterSessao();

  if (!sessao) {
    throw new Error("O armazenamento temporário não está disponível.");
  }

  const captura = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    dataUrl: await blobParaDataUrl(blob),
    tipo: blob.type || "image/jpeg",
    criadaEm: new Date().toISOString(),
  };

  try {
    sessao.setItem(CHAVE_CAPTURA, JSON.stringify(captura));
    sessao.removeItem(CHAVE_ULTIMA_ANALISE);

    Object.keys(sessao)
      .filter((chave) => chave.startsWith(PREFIXO_ANALISE))
      .forEach((chave) => sessao.removeItem(chave));
  } catch {
    throw new Error("A foto ficou grande demais para o armazenamento temporário.");
  }

  return captura;
}

export function obterCaptura() {
  const captura = lerJson(CHAVE_CAPTURA);
  return captura?.id && captura?.dataUrl ? captura : null;
}

export function obterCapturaSerializada() {
  const sessao = obterSessao();
  return sessao?.getItem(CHAVE_CAPTURA) || "";
}

export async function capturaParaArquivo(captura) {
  if (!captura?.dataUrl) {
    throw new Error("Nenhuma foto foi capturada.");
  }

  const resposta = await fetch(captura.dataUrl);
  const blob = await resposta.blob();
  const extensao = blob.type === "image/png" ? "png" : "jpg";

  return new File([blob], `captura-jovi.${extensao}`, {
    type: blob.type || captura.tipo || "image/jpeg",
  });
}

export function guardarAnalise(tipo, capturaId, analise) {
  const sessao = obterSessao();

  if (!sessao) return;

  const registro = { capturaId, analise };
  sessao.setItem(`${PREFIXO_ANALISE}${tipo}`, JSON.stringify(registro));
  sessao.setItem(CHAVE_ULTIMA_ANALISE, JSON.stringify(registro));
}

export function obterAnalise(tipo, capturaId) {
  const registro = lerJson(`${PREFIXO_ANALISE}${tipo}`);
  return registro?.capturaId === capturaId ? registro.analise : null;
}

export function obterUltimaAnalise() {
  return lerJson(CHAVE_ULTIMA_ANALISE)?.analise || null;
}

export function obterUltimaAnaliseSerializada() {
  const sessao = obterSessao();
  return sessao?.getItem(CHAVE_ULTIMA_ANALISE) || "";
}
