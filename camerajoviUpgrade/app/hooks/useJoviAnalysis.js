"use client";

import { useCallback, useEffect, useState } from "react";
import { analisarImagem } from "../services/joviApi";
import {
  capturaParaArquivo,
  guardarAnalise,
  obterAnalise,
  obterCaptura,
} from "../services/captureSession";

export default function useJoviAnalysis(tipo) {
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState({
    status: "carregando",
    dados: null,
    erro: "",
  });

  useEffect(() => {
    let cancelado = false;

    async function executar() {
      await Promise.resolve();

      if (cancelado) return;

      const captura = obterCaptura();

      if (!captura) {
        setEstado({
          status: "erro",
          dados: null,
          erro: "Nenhuma foto foi capturada. Volte à câmera e tire uma foto.",
        });
        return;
      }

      const analiseEmCache = tentativa === 0
        ? obterAnalise(tipo, captura.id)
        : null;

      if (analiseEmCache) {
        setEstado({ status: "sucesso", dados: analiseEmCache, erro: "" });
        return;
      }

      setEstado({ status: "carregando", dados: null, erro: "" });

      try {
        const arquivo = await capturaParaArquivo(captura);
        const dados = await analisarImagem(tipo, arquivo);

        if (cancelado) return;

        guardarAnalise(tipo, captura.id, dados);
        setEstado({ status: "sucesso", dados, erro: "" });
      } catch (erro) {
        if (cancelado) return;

        setEstado({
          status: "erro",
          dados: null,
          erro: erro.message || "Não foi possível concluir a análise.",
        });
      }
    }

    executar();

    return () => {
      cancelado = true;
    };
  }, [tentativa, tipo]);

  const tentarNovamente = useCallback(() => {
    setTentativa((valor) => valor + 1);
  }, []);

  return { ...estado, tentarNovamente };
}
