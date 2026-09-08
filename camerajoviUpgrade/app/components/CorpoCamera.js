"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import CardEstudante from "./CardEstudante";
import ModalSmartPix from "./ModalSmartPix";
import PainelMais from "./PainelMais";

const opcoesDeZoom = ["0.5", "1x", "2", "5"];
const tamanhosDoQuadro = {
  0.5: 72,
  "1x": 110,
  2: 160,
  5: 220,
};

function formatarTelefone(digitos) {
  const possuiCodigoDoBrasil =
    (digitos.length === 12 || digitos.length === 13) &&
    digitos.startsWith("55");
  const numeroNacional = possuiCodigoDoBrasil ? digitos.slice(2) : digitos;
  const ddd = numeroNacional.slice(0, 2);
  const inicio = numeroNacional.slice(2, -4);
  const final = numeroNacional.slice(-4);

  return `${possuiCodigoDoBrasil ? "+55 " : ""}(${ddd}) ${inicio}-${final}`;
}

function encontrarDadoSmartPix(texto) {
  const textoNormalizado = texto
    .replace(/\s*@\s*/g, "@")
    .replace(/\s*\.\s*/g, ".")
    .replace(/\s+/g, " ")
    .trim();

  const emailEncontrado = textoNormalizado.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  );

  if (emailEncontrado) {
    return { tipo: "E-mail", valor: emailEncontrado[0] };
  }

  const textoParaTelefone = textoNormalizado
    .replace(/[oO]/g, "0")
    .replace(/[iIl|]/g, "1")
    .replace(/[zZ]/g, "2")
    .replace(/[sS]/g, "5")
    .replace(/[bB]/g, "8")
    .replace(/[gGq]/g, "9")
    .replace(/[^0-9+().\-\s]/g, " ");

  const candidatosDeTelefone = textoParaTelefone.match(
    /\+?\d[\d\s().-]{8,}\d/g,
  );

  const telefoneEncontrado = candidatosDeTelefone?.find((telefone) => {
    const quantidadeDeDigitos = telefone.replace(/\D/g, "").length;
    return (
      quantidadeDeDigitos === 10 ||
      quantidadeDeDigitos === 11 ||
      ((quantidadeDeDigitos === 12 || quantidadeDeDigitos === 13) &&
        telefone.replace(/\D/g, "").startsWith("55"))
    );
  });

  if (telefoneEncontrado) {
    const digitos = telefoneEncontrado.replace(/\D/g, "");

    return {
      tipo: "Telefone",
      valor: formatarTelefone(digitos),
    };
  }

  return null;
}

const CorpoCamera = forwardRef(function CorpoCamera(
  {
    modoAtivo,
    zoomAtivo,
    acoesEstudante,
    acaoEstudante,
    cameraFrontal,
    mensagemCaptura,
    modosExtras,
    modoExtraAtivo,
    painelMaisAberto,
    aoSelecionarZoom,
    aoSelecionarAcao,
    aoSelecionarModoExtra,
    aoFecharPainelMais,
    aoVoltar,
  },
  ref,
) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const resultadoSmartPixRef = useRef(null);
  const [resultadoSmartPix, setResultadoSmartPix] = useState(null);
  const [mensagemSmartPix, setMensagemSmartPix] = useState("");
  const [estadoCamera, setEstadoCamera] = useState("Abrindo câmera...");
  const modoEstudante = modoAtivo === "Estudante";
  const modoPro = modoAtivo === "Pro";
  const ocrSmartPixAtivo = ["Retrato", "Foto", "Pro"].includes(modoAtivo);
  const acaoDeCaptura = acaoEstudante && acaoEstudante !== "salvar";
  const nomeDaAcao = acoesEstudante.find(
    (acao) => acao.id === acaoEstudante,
  )?.nome;

  let tamanhoDoQuadro = {
    width: tamanhosDoQuadro[zoomAtivo],
    height: tamanhosDoQuadro[zoomAtivo],
  };

  if (acaoDeCaptura) {
    tamanhoDoQuadro = {
      width: "80%",
      height: "60%",
      maxWidth: 320,
      maxHeight: 480,
    };
  }

  if (modoPro) {
    tamanhoDoQuadro = {
      width: "82%",
      height: "36%",
      maxWidth: 330,
      maxHeight: 240,
    };
  }

  useImperativeHandle(
    ref,
    () => ({
      capturarImagem() {
        const video = videoRef.current;

        if (!video?.videoWidth || !video?.videoHeight) {
          return Promise.reject(
            new Error("A câmera ainda não está pronta para capturar."),
          );
        }

        const larguraMaxima = 1280;
        const escala = Math.min(1, larguraMaxima / video.videoWidth);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(video.videoWidth * escala);
        canvas.height = Math.round(video.videoHeight * escala);
        const contexto = canvas.getContext("2d");

        if (!contexto) {
          return Promise.reject(new Error("Não foi possível criar a foto."));
        }

        if (cameraFrontal) {
          contexto.translate(canvas.width, 0);
          contexto.scale(-1, 1);
        }

        contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

        return new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Não foi possível gerar a foto."));
            },
            "image/jpeg",
            0.86,
          );
        });
      },
    }),
    [cameraFrontal],
  );

  useEffect(() => {
    let streamDaCamera;
    let componenteAtivo = true;
    const video = videoRef.current;

    async function iniciarCamera() {
      await Promise.resolve();

      if (!componenteAtivo) return;

      if (!navigator.mediaDevices?.getUserMedia || !video) {
        if (componenteAtivo) {
          setEstadoCamera("Este navegador não oferece acesso à câmera.");
        }
        return;
      }

      try {
        streamDaCamera = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: cameraFrontal ? "user" : "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!componenteAtivo) {
          streamDaCamera.getTracks().forEach((track) => track.stop());
          return;
        }

        video.srcObject = streamDaCamera;
        await video.play();
        if (componenteAtivo) setEstadoCamera("");
      } catch {
        streamDaCamera?.getTracks().forEach((track) => track.stop());
        if (componenteAtivo) {
          setEstadoCamera("Autorize a câmera para continuar.");
        }
        console.warn("A câmera não foi autorizada ou não está disponível.");
      }
    }

    iniciarCamera();

    return () => {
      componenteAtivo = false;
      streamDaCamera?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, [cameraFrontal]);

  useEffect(() => {
    if (!ocrSmartPixAtivo) {
      return;
    }

    let leituraCancelada = false;
    let temporizador;
    let workerOcr;

    function agendarLeitura(tempo = 1800) {
      if (!leituraCancelada) {
        temporizador = setTimeout(analisarQuadro, tempo);
      }
    }

    async function analisarQuadro() {
      if (leituraCancelada) {
        return;
      }

      if (resultadoSmartPixRef.current) {
        agendarLeitura(500);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        !video ||
        !canvas ||
        !video.videoWidth ||
        !video.videoHeight ||
        !video.clientWidth ||
        !video.clientHeight
      ) {
        agendarLeitura(1000);
        return;
      }

      const escalaDePreenchimento = Math.max(
        video.clientWidth / video.videoWidth,
        video.clientHeight / video.videoHeight,
      );
      const larguraVisivel = video.clientWidth / escalaDePreenchimento;
      const alturaVisivel = video.clientHeight / escalaDePreenchimento;
      const larguraDoRecorte = larguraVisivel * 0.82;
      const alturaDoRecorte = alturaVisivel * 0.36;
      const origemX = (video.videoWidth - larguraDoRecorte) / 2;
      const origemY = (video.videoHeight - alturaDoRecorte) / 2;
      const larguraProcessada = 700;
      const escalaDoRecorte = larguraProcessada / larguraDoRecorte;

      canvas.width = larguraProcessada;
      canvas.height = Math.round(alturaDoRecorte * escalaDoRecorte);

      const contexto = canvas.getContext("2d");

      if (!contexto) {
        return;
      }

      contexto.filter = "grayscale(1) contrast(1.2)";
      contexto.drawImage(
        video,
        origemX,
        origemY,
        larguraDoRecorte,
        alturaDoRecorte,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      contexto.filter = "none";

      try {
        const reconhecimento = await workerOcr.recognize(canvas);

        if (leituraCancelada) {
          return;
        }

        const dadoEncontrado = encontrarDadoSmartPix(
          reconhecimento.data.text,
        );

        if (dadoEncontrado) {
          resultadoSmartPixRef.current = dadoEncontrado;
          setResultadoSmartPix(dadoEncontrado);
        }
      } catch (erro) {
        console.warn("Falha ao analisar o quadro da câmera.", erro);
      }

      agendarLeitura();
    }

    async function prepararOcr() {
      try {
        const { createWorker } = await import("tesseract.js");
        const novoWorker = await createWorker("eng");

        if (leituraCancelada) {
          await novoWorker.terminate();
          return;
        }

        workerOcr = novoWorker;
        analisarQuadro();
      } catch (erro) {
        console.warn("Falha ao iniciar o OCR.", erro);
      }
    }

    prepararOcr();

    return () => {
      leituraCancelada = true;
      clearTimeout(temporizador);
      workerOcr?.terminate();
    };
  }, [ocrSmartPixAtivo]);

  function cancelarSmartPix() {
    resultadoSmartPixRef.current = null;
    setResultadoSmartPix(null);
    setMensagemSmartPix("");
  }

  function alterarChaveSmartPix(novoValor) {
    const resultadoAtualizado = {
      ...resultadoSmartPixRef.current,
      valor: novoValor,
    };

    resultadoSmartPixRef.current = resultadoAtualizado;
    setResultadoSmartPix(resultadoAtualizado);
    setMensagemSmartPix("");
  }

  async function copiarChaveSmartPix() {
    try {
      await navigator.clipboard.writeText(resultadoSmartPix.valor);
      setMensagemSmartPix("Chave copiada para a área de transferência.");
    } catch {
      setMensagemSmartPix("Não foi possível copiar a chave.");
    }
  }

  function simularAberturaDoBanco() {
    setMensagemSmartPix(
      "O usuário seria encaminhado ao aplicativo bancário para continuar com segurança.",
    );
  }

  return (
    <section className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
      <video
        className={`absolute inset-0 z-0 size-full object-cover ${cameraFrontal ? "-scale-x-100" : ""}`}
        ref={videoRef}
        autoPlay
        playsInline
        muted
      />
      <canvas className="hidden" ref={canvasRef} aria-hidden="true" />

      {(mensagemCaptura || estadoCamera) && (
        <p className="z-[3] max-w-[72%] rounded-xl bg-black/60 px-3 py-2.5 text-center text-[13px] leading-[1.35] text-white" role="status" aria-live="polite">
          {mensagemCaptura || estadoCamera}
        </p>
      )}

      {modoAtivo !== "Foto" && !modoPro && !painelMaisAberto && (
        <p className="absolute left-1/2 top-3.5 z-[3] -translate-x-1/2 whitespace-nowrap rounded-full bg-white/15 px-3.5 py-1 text-[11px] font-semibold tracking-[0.05em] text-[#ffc107]">
          ● Modo {nomeDaAcao || modoExtraAtivo || modoAtivo}
        </p>
      )}

      <div className={`pointer-events-none absolute inset-0 z-[1] transition-opacity ${painelMaisAberto ? "opacity-0" : ""}`} aria-hidden="true">
        <span className="absolute bottom-0 left-1/3 top-0 w-px bg-[#ffc107]/25" />
        <span className="absolute bottom-0 left-2/3 top-0 w-px bg-[#ffc107]/25" />
        <span className="absolute left-0 right-0 top-1/3 h-px bg-[#ffc107]/25" />
        <span className="absolute left-0 right-0 top-2/3 h-px bg-[#ffc107]/25" />
      </div>

      <div
        className={`absolute z-[2] transition-[width,height,opacity] duration-[250ms] ${painelMaisAberto ? "opacity-0" : ""}`}
        style={tamanhoDoQuadro}
        aria-hidden="true"
      >
        <span className="absolute left-0 top-0 size-[22px] border-l-[3px] border-t-[3px] border-[#ffc107]" />
        <span className="absolute right-0 top-0 size-[22px] border-r-[3px] border-t-[3px] border-[#ffc107]" />
        <span className="absolute bottom-0 left-0 size-[22px] border-b-[3px] border-l-[3px] border-[#ffc107]" />
        <span className="absolute bottom-0 right-0 size-[22px] border-b-[3px] border-r-[3px] border-[#ffc107]" />
      </div>

      {!modoEstudante && (
        <div className={`absolute bottom-5 left-1/2 z-[3] flex -translate-x-1/2 rounded-full bg-black/35 px-2 py-1 transition-opacity ${painelMaisAberto ? "opacity-0" : ""}`} aria-label="Opções de zoom">
          {opcoesDeZoom.map((zoom) => (
            <button
              className={`cursor-pointer rounded-full border-0 px-2.5 py-1 ${zoom === zoomAtivo ? "bg-[#ffc107] font-bold text-white" : "bg-transparent text-white/80"}`}
              type="button"
              aria-pressed={zoom === zoomAtivo}
              onClick={() => aoSelecionarZoom(zoom)}
              key={zoom}
            >
              {zoom}
            </button>
          ))}
        </div>
      )}

      {modoEstudante && !acaoEstudante && (
        <div className="absolute bottom-5 left-1/2 z-[3] grid w-[calc(100%-24px)] -translate-x-1/2 grid-cols-5 gap-1.5">
          {acoesEstudante.map((acao) => (
            <CardEstudante
              id={acao.id}
              nome={acao.nome}
              aoSelecionar={aoSelecionarAcao}
              key={acao.id}
            />
          ))}
        </div>
      )}

      {modoEstudante && acaoEstudante && (
        <button className="absolute bottom-5 left-1/2 z-[3] flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-white/90 px-5 py-2.5 text-[13px] font-semibold text-[#a87900]" type="button" onClick={aoVoltar}>
          <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          Voltar
        </button>
      )}

      {ocrSmartPixAtivo && resultadoSmartPix && (
        <ModalSmartPix
          resultado={resultadoSmartPix}
          mensagem={mensagemSmartPix}
          aoAlterarValor={alterarChaveSmartPix}
          aoCancelar={cancelarSmartPix}
          aoCopiar={copiarChaveSmartPix}
          aoAbrirBanco={simularAberturaDoBanco}
        />
      )}

      {painelMaisAberto && (
        <PainelMais
          modos={modosExtras}
          aoSelecionar={aoSelecionarModoExtra}
          aoFechar={aoFecharPainelMais}
        />
      )}
    </section>
  );
});

export default CorpoCamera;
