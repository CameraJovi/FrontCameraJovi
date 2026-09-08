import { ImageResponse } from "next/og";

export const alt = "Câmera Jovi - recursos inteligentes para estudantes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "72px 82px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #111111 0%, #242424 100%)",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              marginBottom: "22px",
              color: "#ffc107",
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "5px",
            }}
          >
            CÂMERA JOVI
          </span>
          <strong style={{ fontSize: "66px", lineHeight: 1.08 }}>
            Transforme imagens em conteúdo para estudar
          </strong>
          <span
            style={{
              marginTop: "28px",
              color: "#c4c4c4",
              fontSize: "28px",
              lineHeight: 1.4,
            }}
          >
            Resumos, flashcards e resoluções com inteligência artificial.
          </span>
        </div>

        <div
          style={{
            width: "240px",
            height: "240px",
            border: "5px solid #ffc107",
            borderRadius: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1e1e1e",
            boxShadow: "0 24px 70px rgba(0, 0, 0, 0.45)",
          }}
        >
          <svg
            width="150"
            height="150"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M17 21h8l3-5h8l3 5h8a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H17a6 6 0 0 1-6-6V27a6 6 0 0 1 6-6Z"
              stroke="#ffc107"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="36" r="9" stroke="#ffffff" strokeWidth="4" />
            <circle cx="45" cy="28" r="2" fill="#ffc107" />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
