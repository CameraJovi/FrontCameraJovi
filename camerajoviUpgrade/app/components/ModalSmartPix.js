
export default function ModalSmartPix({
  resultado,
  mensagem,
  aoAlterarValor,
  aoCancelar,
  aoCopiar,
  aoAbrirBanco,
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-5">
      <section
        className="flex w-full max-w-[340px] flex-col items-center gap-2.5 rounded-[20px] border border-[#444] bg-[#242424] px-5 py-6 text-center text-white shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="smartpix-titulo"
      >
        <div className="flex size-12 items-center justify-center rounded-[14px] bg-[#ffc107]/15 text-[#ffc107] [&_svg]:size-[26px]" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 3v18M3 12h18" />
            <path d="m7 7 10 10M17 7 7 17" />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-[#ffc107]" id="smartpix-titulo">Possível chave Pix encontrada</h2>
        <p className="text-xs text-[#aaa]">Tipo: {resultado.tipo}</p>
        <input
          className="w-full max-w-full rounded-[9px] border border-[#555] bg-[#1a1a1a] p-2.5 text-center text-[15px] font-bold text-white outline-none focus:border-[#ffc107]"
          type="text"
          value={resultado.valor}
          aria-label="Chave encontrada"
          onChange={(evento) => aoAlterarValor(evento.target.value)}
        />

        <p className="mt-1 text-[11px] leading-[1.45] text-[#aaa]">
          Encontrar este dado na imagem não confirma que ele seja uma chave
          Pix. Confira e corrija o dado antes de continuar no aplicativo do
          banco.
        </p>

        {mensagem && <p className="w-full rounded-lg bg-[#ffc107]/10 p-2 text-[11px] text-[#ffc107]">{mensagem}</p>}

        <div className="mt-2 grid w-full grid-cols-2 gap-2">
          <button type="button" className="cursor-pointer rounded-[10px] border-0 bg-[#333] px-2 py-2.5 text-xs font-semibold text-white" onClick={aoCancelar}>
            Cancelar
          </button>
          <button type="button" className="cursor-pointer rounded-[10px] border-0 bg-[#333] px-2 py-2.5 text-xs font-semibold text-white" onClick={aoCopiar}>
            Copiar chave
          </button>
          <button type="button" className="col-span-2 cursor-pointer rounded-[10px] border-0 bg-[#ffc107] px-2 py-2.5 text-xs font-semibold text-[#1a1a1a]" onClick={aoAbrirBanco}>
            Abrir banco
          </button>
        </div>
      </section>
    </div>
  );
}
