"use client";

import Image from "next/image";
import { useMemo, useSyncExternalStore } from "react";
import { obterCapturaSerializada } from "../services/captureSession";

function assinarArmazenamento(aoMudar) {
  window.addEventListener("storage", aoMudar);
  return () => window.removeEventListener("storage", aoMudar);
}

function capturaDoRegistro(registro) {
  if (!registro) return null;

  try {
    return JSON.parse(registro);
  } catch {
    return null;
  }
}

export default function PreviewCaptura({ className = "", alternativa = true }) {
  const registro = useSyncExternalStore(
    assinarArmazenamento,
    obterCapturaSerializada,
    () => null,
  );
  const captura = useMemo(() => capturaDoRegistro(registro), [registro]);
  const origem = captura?.dataUrl || null;

  if (!origem && !alternativa) {
    return <p className="p-[18px] text-center text-[13px] leading-[1.45] text-[#aaa]">Nenhuma foto capturada.</p>;
  }

  return (
    <Image
      className={className}
      src={origem || "/img/math.png"}
      alt={origem ? "Foto capturada pela câmera" : "Documento de demonstração"}
      width={1280}
      height={720}
      unoptimized
      priority
    />
  );
}
