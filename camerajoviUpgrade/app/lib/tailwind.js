export const phoneFrame =
  "h-dvh w-full min-w-0 min-[500px]:my-6 min-[500px]:h-[min(844px,calc(100dvh-48px))] min-[500px]:w-[390px]";

export const phoneScreen =
  "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] [@media(max-height:500px)]:overflow-y-auto bg-[#1a1a1a] min-[500px]:rounded-[48px] min-[500px]:shadow-[0_0_0_10px_#2a2a2a,0_0_0_12px_#444,0_30px_80px_rgba(0,0,0,0.8)]";

export const actionScreen = `${phoneScreen} relative text-white`;

export const actionBody =
  "flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain p-5 [overflow-wrap:anywhere] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export const primaryAction =
  "block w-full rounded-xl bg-[#ffc107] p-3.5 text-center text-[13px] font-extrabold text-[#1a1a1a] no-underline";

export const analysisState =
  "flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-[#333] bg-[#242424] px-[22px] py-7 text-center text-[13px] leading-[1.45] text-[#aaa]";
