function IconeAcao({ tipo }) {
  if (tipo === "scan") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
      </svg>
    );
  }

  if (tipo === "flashcard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    );
  }

  if (tipo === "math") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="4" y1="6" x2="9" y2="6" />
        <line x1="4" y1="18" x2="9" y2="18" />
      </svg>
    );
  }

  if (tipo === "codigo") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function CardEstudante({ id, nome, aoSelecionar }) {
  return (
    <button
      className="flex w-full min-w-0 cursor-pointer flex-col items-center gap-[5px] rounded-2xl border-0 bg-[#141414]/70 px-1 pb-[9px] pt-3 text-[10px] font-semibold text-[#ffc107] shadow-[0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-xl transition active:scale-90 active:bg-[#ffc107]/25 [&_svg]:size-[22px]"
      type="button"
      onClick={() => aoSelecionar(id)}
    >
      <IconeAcao tipo={id} />
      <span>{nome}</span>
    </button>
  );
}
