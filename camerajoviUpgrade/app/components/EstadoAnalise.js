import Link from "next/link";
import { analysisState } from "../lib/tailwind";

export default function EstadoAnalise({ status, mensagem, aoTentarNovamente }) {
  if (status === "carregando") {
    return (
      <div className={analysisState} role="status" aria-live="polite">
        <span className="size-[38px] animate-spin rounded-full border-[3px] border-[#444] border-t-[#ffc107]" aria-hidden="true" />
        <strong className="text-[15px] text-white">{mensagem}</strong>
        <span>Aguarde enquanto a Jovi analisa a imagem.</span>
      </div>
    );
  }

  return (
    <div className={`${analysisState} border-[#ffc107]/45`} role="alert">
      <strong className="text-[15px] text-white">Não foi possível concluir a análise</strong>
      <span>{mensagem}</span>
      <div className="mt-2 flex gap-2.5">
        <button className="cursor-pointer rounded-[9px] border border-[#ffc107] bg-transparent px-3 py-[9px] text-xs font-bold text-[#ffc107]" type="button" onClick={aoTentarNovamente}>
          Tentar novamente
        </button>
        <Link className="rounded-[9px] border border-[#ffc107] px-3 py-[9px] text-xs font-bold text-[#ffc107] no-underline" href="/">Voltar à câmera</Link>
      </div>
    </div>
  );
}
