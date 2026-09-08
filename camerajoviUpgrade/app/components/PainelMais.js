function IconeModoExtra({ tipo }) {
  if (tipo === "noturno") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M20 15.4A8.5 8.5 0 0 1 8.6 4a8.5 8.5 0 1 0 11.4 11.4Z" />
      </svg>
    );
  }

  if (tipo === "panorama") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 7c5-2 13-2 18 0v10c-5 2-13 2-18 0V7Z" />
        <path d="m9 13 2-2 4 4 2-2 3 3M7 10h.01" />
      </svg>
    );
  }

  if (tipo === "camera-lenta") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="13" r="7" />
        <path d="M12 10v4l3 2M9 3h6M12 6V3" />
      </svg>
    );
  }

  if (tipo === "time-lapse") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3-2M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    );
  }

  if (tipo === "documento") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M6 3h9l3 3v15H6V3Z" />
        <path d="M14 3v4h4M9 11h6M9 15h6M9 18h4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="12" cy="12" r="4" />
      <path d="M7 8h.01M17 8h.01" />
    </svg>
  );
}

export default function PainelMais({ modos, aoSelecionar, aoFechar }) {
  return (
    <section className="absolute inset-0 z-40 flex animate-[pulse_250ms_ease-out_1] flex-col gap-6 overflow-y-auto bg-[#121212]/55 px-5 pb-7 pt-6 backdrop-blur-[18px]" aria-label="Outros modos da câmera">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#ffc107]">Câmera Jovi</span>
          <h2 className="text-[22px] font-bold text-white">Mais modos</h2>
        </div>

        <button className="flex size-[38px] cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/10 text-white" type="button" aria-label="Fechar outros modos" onClick={aoFechar}>
          <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {modos.map((modo) => (
          <button
            className="flex min-h-[116px] cursor-pointer flex-col items-start gap-1 rounded-[18px] border border-white/15 bg-[#232323]/70 p-3.5 text-left text-white transition active:scale-[0.97] active:border-[#ffc107]"
            type="button"
            onClick={() => aoSelecionar(modo.nome)}
            key={modo.id}
          >
            <span className="mb-1.5 flex size-[38px] items-center justify-center rounded-xl bg-[#ffc107]/15 text-[#ffc107] [&_svg]:size-[22px]">
              <IconeModoExtra tipo={modo.id} />
            </span>
            <strong className="text-[13px]">{modo.nome}</strong>
            <small className="text-[10px] leading-[1.3] text-white/50">{modo.descricao}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
