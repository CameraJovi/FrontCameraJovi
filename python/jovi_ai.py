from __future__ import annotations

import json
import os
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any

from code_analysis import CODE_PROMPT, CodeAnalysis
from dotenv import load_dotenv
from google import genai
from PIL import Image


BASE_DIR = Path(__file__).resolve().parent
SAVED_DIR = BASE_DIR / "salvos"
MODEL_NAME = "gemini-3.6-flash"

load_dotenv(BASE_DIR / ".env")


def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY nao foi configurada no arquivo .env.")

    return genai.Client(api_key=api_key)


def _strip_json_fence(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def parse_gemini_json(raw_text: str) -> dict[str, Any]:
    clean_text = _strip_json_fence(raw_text)

    try:
        return json.loads(clean_text)
    except json.JSONDecodeError:
        return {
            "subject": "Erro",
            "content": raw_text,
            "expression": None,
            "result": [],
            "steps": [],
            "cards": [],
        }


def _summary_prompt() -> str:
    return """
Voce e um sistema OCR avancado para estudantes.

Objetivos:
- Ler textos de lousa e caderno
- Corrigir erros ortograficos
- Organizar conteudo
- Criar um resumo claro, curto e util para estudo

Responda SOMENTE com JSON valido, sem markdown e sem texto fora do JSON.

Formato obrigatorio:

{
  "subject": "assunto identificado",
  "content": "resumo organizado do conteudo"
}
"""


def _flashcards_prompt() -> str:
    return """
Voce e um sistema OCR avancado para estudantes.

Objetivos:
- Ler textos de lousa e caderno
- Corrigir erros ortograficos
- Transformar o conteudo em flashcards de estudo

Responda SOMENTE com JSON valido, sem markdown e sem texto fora do JSON.

Formato obrigatorio:

{
  "subject": "assunto identificado",
  "cards": [
    {
      "question": "pergunta objetiva",
      "answer": "resposta direta e didatica"
    }
  ],
  "content": "resumo curto do deck gerado"
}

Crie de 3 a 6 flashcards quando houver conteudo suficiente.
"""


def _math_prompt() -> str:
    return """
Voce e uma API matematica OCR.

Voce DEVE responder SOMENTE com JSON puro.

REGRAS OBRIGATORIAS:
- NAO escreva texto fora do JSON
- NAO use markdown
- NAO use ```json
- NAO explique nada fora do JSON
- A resposta DEVE comecar com {
- A resposta DEVE terminar com }

SE NAO EXISTIR conta matematica:

{
  "subject": "Matematica",
  "expression": null,
  "result": [],
  "steps": [],
  "content": "Nenhuma conta encontrada."
}

SE EXISTIR conta matematica:

{
  "subject": "Matematica",
  "expression": "equacao detectada",
  "result": [
    "resultado final"
  ],
  "steps": [
    {
      "title": "Nome da etapa",
      "step": "Explicacao da etapa"
    }
  ],
  "content": "Resumo curto da resolucao"
}

As etapas DEVEM estar separadas.
Cada etapa deve explicar apenas UMA acao.
"""


def _prompt_for(analysis_type: str) -> str:
    if analysis_type == "resumo":
        return _summary_prompt()
    if analysis_type == "flashcards":
        return _flashcards_prompt()
    if analysis_type == "math":
        return _math_prompt()

    raise ValueError("Tipo de analise invalido.")


def _string(value: Any, fallback: str = "") -> str:
    if value is None:
        return fallback
    if isinstance(value, str):
        return value.strip() or fallback
    return str(value)


def _normalise_summary(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "analysis_type": "resumo",
        "subject": _string(data.get("subject"), "Nao identificado"),
        "content": _string(data.get("content"), "Sem conteudo retornado."),
    }


def _normalise_flashcards(data: dict[str, Any]) -> dict[str, Any]:
    cards: list[dict[str, str]] = []

    for item in data.get("cards") or []:
        if not isinstance(item, dict):
            continue

        question = _string(item.get("question") or item.get("pergunta"))
        answer = _string(item.get("answer") or item.get("resposta"))

        if question or answer:
            cards.append({"question": question, "answer": answer})

    if not cards and data.get("content"):
        cards.append(
            {
                "question": "O que foi identificado na imagem?",
                "answer": _string(data.get("content")),
            }
        )

    return {
        "analysis_type": "flashcards",
        "subject": _string(data.get("subject"), "Nao identificado"),
        "cards": cards,
        "content": _string(data.get("content"), "Flashcards gerados pela Jovi."),
    }


def _normalise_math(data: dict[str, Any]) -> dict[str, Any]:
    steps: list[dict[str, str]] = []

    for item in data.get("steps") or []:
        if not isinstance(item, dict):
            continue

        steps.append(
            {
                "title": _string(item.get("title"), "Etapa"),
                "step": _string(item.get("step")),
            }
        )

    result = data.get("result") or []
    if not isinstance(result, list):
        result = [result]

    return {
        "analysis_type": "math",
        "subject": _string(data.get("subject"), "Matematica"),
        "expression": data.get("expression"),
        "result": [_string(item) for item in result if _string(item)],
        "steps": steps,
        "content": _string(data.get("content"), "Sem resolucao retornada."),
    }


def normalise_analysis(data: dict[str, Any], analysis_type: str) -> dict[str, Any]:
    if analysis_type == "resumo":
        return _normalise_summary(data)
    if analysis_type == "flashcards":
        return _normalise_flashcards(data)
    if analysis_type == "math":
        return _normalise_math(data)

    raise ValueError("Tipo de analise invalido.")


def analyse_image(image: Image.Image, analysis_type: str) -> dict[str, Any]:
    if analysis_type == "code":
        return analyse_code(image)
    prompt = _prompt_for(analysis_type)
    client = _get_client()
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[
            prompt,
            "Analise essa imagem.",
            image,
        ],
    )

    data = parse_gemini_json(response.text or "")
    return normalise_analysis(data, analysis_type)


def _safe_name(value: str, fallback: str) -> str:
    normalised = unicodedata.normalize("NFKD", value)
    ascii_text = normalised.encode("ascii", "ignore").decode("ascii")
    safe = re.sub(r"[^a-zA-Z0-9_-]+", "-", ascii_text).strip("-").lower()
    return safe or fallback


def _format_analysis_text(materia: str, analysis: dict[str, Any]) -> str:
    analysis_type = _string(analysis.get("analysis_type"), "analise")
    subject = _string(analysis.get("subject"), "Nao identificado")

    lines = [
        "Camera Jovi",
        f"Materia: {materia}",
        f"Tipo: {analysis_type}",
        f"Assunto: {subject}",
        f"Criado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
    ]

    if analysis_type == "flashcards":
        lines.append("Flashcards:")
        for index, card in enumerate(analysis.get("cards") or [], start=1):
            if not isinstance(card, dict):
                continue
            lines.extend(
                [
                    "",
                    f"{index}. Pergunta: {_string(card.get('question'))}",
                    f"Resposta: {_string(card.get('answer'))}",
                ]
            )
        lines.extend(["", "Resumo:", _string(analysis.get("content"))])
        return "\n".join(lines).strip() + "\n"

    if analysis_type == "math":
        lines.extend(
            [
                f"Expressao: {_string(analysis.get('expression'), 'Nenhuma')}",
                "",
                "Passos:",
            ]
        )
        for index, step in enumerate(analysis.get("steps") or [], start=1):
            if not isinstance(step, dict):
                continue
            lines.extend(
                [
                    f"{index}. {_string(step.get('title'), 'Etapa')}",
                    _string(step.get("step")),
                    "",
                ]
            )
        results = [_string(item) for item in analysis.get("result") or [] if _string(item)]
        lines.extend(["Resultado:", *(results or ["Sem resultado retornado."]), "", "Resumo:", _string(analysis.get("content"))])
        return "\n".join(lines).strip() + "\n"

    if analysis_type == "code":
        lines.extend(["Código original:", analysis.get("original_code") or "", "", "Explicação:"])
        lines.extend(str(step) for step in analysis.get("explanation") or [])
        lines.extend(["", "Pontos para revisar:"])
        for issue in analysis.get("issues") or []:
            if isinstance(issue, dict):
                line = issue.get("line", issue.get("linha", "?"))
                title = issue.get("title", issue.get("titulo", ""))
                description = issue.get("description", issue.get("descricao", ""))
                lines.append(f"Linha {line}: {title} — {description}")
        if analysis.get("corrected_code"):
            lines.extend(["", "Correção sugerida:", analysis["corrected_code"]])
        return "\n".join(lines).strip() + "\n"

    lines.extend(["Conteudo:", _string(analysis.get("content"))])
    return "\n".join(lines).strip() + "\n"


def save_analysis(materia: str, analysis: dict[str, Any]) -> dict[str, str]:
    clean_materia = _string(materia, "Materia")
    subject = _string(analysis.get("subject"), "scan")
    materia_dir = SAVED_DIR / _safe_name(clean_materia, "materia")
    materia_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    file_name = f"{timestamp}-{_safe_name(subject, 'scan')}.txt"
    file_path = materia_dir / file_name
    file_path.write_text(_format_analysis_text(clean_materia, analysis), encoding="utf-8")

    return {
        "materia": clean_materia,
        "file_name": file_name,
        "file_path": str(file_path.relative_to(BASE_DIR)),
    }

def analyse_code(image: Image.Image) -> dict[str, Any]:
    """Structured response validated before returning any model output to the UI."""
    try:
        client = _get_client()
        response = client.models.generate_content(
            model=os.getenv("GEMINI_CODE_MODEL", MODEL_NAME),
            contents=[image],
            config={
                "system_instruction": CODE_PROMPT,
                "response_mime_type": "application/json",
                "response_json_schema": CodeAnalysis.model_json_schema(),
            },
        )
        result = CodeAnalysis.model_validate_json(response.text or "")
        return {"analysis_type": "code", **result.model_dump()}
    except Exception as exc:
        # Do not expose provider messages, credentials or raw responses to clients.
        raise RuntimeError("A Jovi não conseguiu analisar o código. Tente novamente.") from exc
