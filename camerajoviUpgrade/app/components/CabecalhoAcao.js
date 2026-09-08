import Link from "next/link";

export default function CabecalhoAcao({
  titulo,
  voltarPara = "/scan",
  textoVoltar = "Scan",
}) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-[#2a2a2a] px-5 pb-4 pt-6">
      <Link className="flex items-center gap-1.5 text-sm font-medium text-[#ffc107] no-underline" href={voltarPara}>
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        </svg>
        {textoVoltar}
      </Link>
      <h1 className="mr-[60px] flex-1 text-center text-base font-semibold text-white">{titulo}</h1>
    </header>
  );
}
