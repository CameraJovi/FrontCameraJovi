const NOME_DO_BANCO = "jovi-caderno-inteligente";
const VERSAO_DO_BANCO = 1;
const ARMAZEM_DE_IMAGENS = "imagens";
const LARGURA_MAXIMA = 960;
const QUALIDADE_JPEG = 0.72;

let aberturaDoBanco;

function abrirBanco() {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(
      new Error("O navegador não oferece armazenamento de imagens."),
    );
  }

  if (aberturaDoBanco) return aberturaDoBanco;

  aberturaDoBanco = new Promise((resolve, reject) => {
    const requisicao = window.indexedDB.open(NOME_DO_BANCO, VERSAO_DO_BANCO);

    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result;

      if (!banco.objectStoreNames.contains(ARMAZEM_DE_IMAGENS)) {
        banco.createObjectStore(ARMAZEM_DE_IMAGENS, { keyPath: "id" });
      }
    };

    requisicao.onsuccess = () => resolve(requisicao.result);
    requisicao.onerror = () => {
      aberturaDoBanco = null;
      reject(new Error("Não foi possível abrir o Caderno Inteligente."));
    };
    requisicao.onblocked = () => {
      aberturaDoBanco = null;
      reject(
        new Error("O armazenamento do Caderno Inteligente está bloqueado."),
      );
    };
  });

  return aberturaDoBanco;
}

async function comprimirImagem(blob) {
  if (typeof window.createImageBitmap !== "function") {
    return { blob, largura: null, altura: null };
  }

  const imagem = await window.createImageBitmap(blob);

  try {
    const escala = Math.min(1, LARGURA_MAXIMA / imagem.width);
    const largura = Math.max(1, Math.round(imagem.width * escala));
    const altura = Math.max(1, Math.round(imagem.height * escala));
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;

    const contexto = canvas.getContext("2d");

    if (!contexto) {
      return { blob, largura: imagem.width, altura: imagem.height };
    }

    contexto.drawImage(imagem, 0, 0, largura, altura);

    const imagemComprimida = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", QUALIDADE_JPEG);
    });

    return {
      blob: imagemComprimida || blob,
      largura,
      altura,
    };
  } finally {
    imagem.close();
  }
}

export async function salvarImagemDoCaderno(id, arquivo) {
  const banco = await abrirBanco();
  const imagem = await comprimirImagem(arquivo);

  await new Promise((resolve, reject) => {
    const transacao = banco.transaction(ARMAZEM_DE_IMAGENS, "readwrite");
    const armazem = transacao.objectStore(ARMAZEM_DE_IMAGENS);

    armazem.put({
      id,
      blob: imagem.blob,
      largura: imagem.largura,
      altura: imagem.altura,
      tipo: imagem.blob.type || "image/jpeg",
      salvoEm: new Date().toISOString(),
    });

    transacao.oncomplete = () => resolve();
    transacao.onerror = () =>
      reject(
        new Error("Não foi possível salvar a foto no Caderno Inteligente."),
      );
    transacao.onabort = () =>
      reject(new Error("O salvamento da foto foi cancelado pelo navegador."));
  });

  return id;
}

export async function obterImagemDoCaderno(id) {
  if (!id) return null;

  const banco = await abrirBanco();

  return new Promise((resolve, reject) => {
    const transacao = banco.transaction(ARMAZEM_DE_IMAGENS, "readonly");
    const requisicao = transacao.objectStore(ARMAZEM_DE_IMAGENS).get(id);

    requisicao.onsuccess = () => resolve(requisicao.result || null);
    requisicao.onerror = () =>
      reject(new Error("Não foi possível carregar a foto salva."));
  });
}

export async function removerImagensDoCaderno(ids) {
  const imagens = ids.filter(Boolean);

  if (!imagens.length) return;

  const banco = await abrirBanco();

  await new Promise((resolve, reject) => {
    const transacao = banco.transaction(ARMAZEM_DE_IMAGENS, "readwrite");
    const armazem = transacao.objectStore(ARMAZEM_DE_IMAGENS);

    imagens.forEach((id) => armazem.delete(id));

    transacao.oncomplete = () => resolve();
    transacao.onerror = () =>
      reject(new Error("Não foi possível limpar fotos antigas do caderno."));
  });
}
