from __future__ import annotations

from io import BytesIO
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field

from jovi_ai import analyse_image, save_analysis


app = FastAPI(title="Camera Jovi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://camerajovi-kappa.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SaveRequest(BaseModel):
    materia: str = Field(min_length=1)
    analysis: dict[str, Any]


def _http_error_from_exception(error: Exception) -> HTTPException:
    if isinstance(error, ValueError):
        return HTTPException(status_code=400, detail=str(error))
    if isinstance(error, RuntimeError):
        return HTTPException(status_code=500, detail=str(error))
    return HTTPException(status_code=500, detail="Nao foi possivel concluir a analise.")


async def _image_from_upload(file: UploadFile) -> Image.Image:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Envie um arquivo de imagem valido.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="A imagem enviada esta vazia.")

    try:
        image = Image.open(BytesIO(content))
        image.load()
        return image.convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Nao foi possivel ler a imagem enviada.") from exc


async def _analyse_upload(file: UploadFile, analysis_type: str) -> dict[str, Any]:
    image = await _image_from_upload(file)

    try:
        return analyse_image(image, analysis_type)
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "camera-jovi-api"}


@app.post("/api/resumo")
async def create_summary(image: UploadFile = File(...)) -> dict[str, Any]:
    return await _analyse_upload(image, "resumo")


@app.post("/api/flashcards")
async def create_flashcards(image: UploadFile = File(...)) -> dict[str, Any]:
    return await _analyse_upload(image, "flashcards")


@app.post("/api/math")
async def solve_math(image: UploadFile = File(...)) -> dict[str, Any]:
    return await _analyse_upload(image, "math")


@app.post("/api/salvar")
def save_scan(payload: SaveRequest) -> dict[str, str]:
    try:
        saved = save_analysis(payload.materia, payload.analysis)
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc

    return {"status": "saved", **saved}

@app.post("/api/codigo")
async def analyse_code_upload(image: UploadFile = File(...)) -> dict[str, Any]:
    picture = await _image_from_upload(image)
    try:
        return await run_in_threadpool(analyse_image, picture, "code")
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="A Jovi não conseguiu analisar o código. Tente novamente.",
        ) from exc
