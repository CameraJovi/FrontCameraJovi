from pathlib import Path
from PIL import Image
from google import genai
from dotenv import load_dotenv
import cv2
import os
import json
import re

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)


def start():
    print("\nBEM-VINDO AO MENU DA CÂMERA JOVI")
    menu()

# Função pra criar o menu principal
def menu():
    while True:
        print("\nMENU PRINCIPAL")
        print("[1] Tirar foto")
        print("[2] Escolher foto da galeria")
        print("[3] Sair\n")

        try:
            choice = int(input("Resposta: "))

            match choice:
                case 1:
                    takePhoto()

                case 2:
                    gallery()

                case 3:
                    print("\nObrigado por usar a Câmera JOVI.\n")
                    break

                case _:
                    print("Opção inválida.\n")

        except ValueError: # Tratamento de erro (input recebeu string/bool ou qualquer coisa que nao for int)
            print("Opção inválida.\n")

# Função pra abrir camera e tirar fotos
def takePhoto():
    print("\nIniciando câmera...")

    cap = cv2.VideoCapture(0) # Detecta qualquer tipo de gravação na porta 0 da máquina (normalmente a webcam)

    if not cap.isOpened(): # se não der pra abrir é porque a máquina nao tem nenhuma camera conectada
        print("Nenhuma câmera detectada.\n")
        return

    contador = 0 # gambiarra pra nomear as fotos

    while True: # loop pra "capturar" a camera infinitamente e fazer um video
        ret, frame = cap.read()

        if not ret: # ret é o retorno do frame (bool), se nao tem é pq a camera nao abriu
            break

        cv2.putText( # colocar texto no display
            frame,
            "C = Foto | Q = Sair",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

        cv2.imshow("Camera JOVI", frame) # titulo

        tecla = cv2.waitKey(1) & 0xFF #detecta quando uma tecla é apertada

        if tecla == ord("c"): #tira foto
            nome_arquivo = f"foto_{contador}.jpg"
            cv2.imwrite(nome_arquivo, frame)
            print(f"Foto salva: {nome_arquivo}")
            contador += 1

        elif tecla == ord("q"): #fecha a camera
            print("\nFechando câmera...\n")
            break

    cap.release()
    cv2.destroyAllWindows()

    if contador > 0:
        print("Fotos capturadas com sucesso.\n")


def gallery():
    print("\nGALERIA JOVI")
    print("Escaneando fotos disponíveis...\n")

    folder_path = Path("./")
    sufixes = ["png", "jpeg", "jpg", "webp"]

    photos = [
        file.name for file in folder_path.iterdir()
        if file.is_file() and file.suffix.lower().replace(".", "") in sufixes
    ] # itera pelo diretorio pra achar qualquer arquivo com os sufixos do vetor de sufixos e coloca dentro do vetor de fotos caso encontrar

    if not photos:
        print("Nenhuma foto encontrada.\n")
        return

    print("Fotos encontradas!\n")

    for i, photo in enumerate(photos, start=1):
        print(f"[{i}] {photo}")

    print()

    while True:
        try:
            photo = int(input("Resposta: "))

            if 1 <= photo <= len(photos):
                break

            print("Opção inválida.")

        except ValueError:
            print("Opção inválida.")

    file = photos[photo - 1]
    img = Image.open(file)

    print(f"\nFoto escolhida: {file}")
    print("Escolha o tipo de análise:")
    print("[1] Criar resumo")
    print("[2] Criar flashcards")
    print("[3] Math Resolver")
    print("[4] Voltar\n")

    while True:
        try:
            option = int(input("Resposta: "))

            if option in [1, 2, 3, 4]:
                break

            print("Opção inválida.")

        except ValueError:
            print("Opção inválida.")

    match option:
        case 1:
            result = scanPhoto(img, "Resumo")
            showResult(result, save_file=True)

        case 2:
            result = scanPhoto(img, "Flashcards")
            showResult(result, save_file=True)

        case 3:
            result = scanPhoto(img, "Math Resolver")
            showMathResult(result)

        case 4:
            return

def parseOCRResponse(response): # parseia a resposta vinda da api pra tirar qualquer texto e transformar em JSON
    try:
        text = response.text.strip()

        text = re.sub(r"```json\s*|\s*```", "", text)

        return json.loads(text)

    except Exception:
        return {
            "subject": "Erro",
            "expression": None,
            "result": [],
            "steps": [],
            "content": response.text
        }

def showResult(response, save_file=False):
    data = parseOCRResponse(response)

    print("\nRESULTADO")
    print(f"Assunto: {data.get('subject', 'Não identificado')}\n") #caso venha sem matéria ele coloca como nao identificado
    print(data.get("content", "Sem conteúdo")) # mesma coisa com conteúdo
    print()

    if save_file:
        saveOption(data)


def showMathResult(response):
    data = parseOCRResponse(response)

    print("\nRESULTADO MATH\n")

    if data.get("content") == "Nenhuma conta encontrada.":
        print("Nenhuma conta encontrada.\n")
        return

    print(f"Expressão detectada:")
    print(f"{data.get('expression')}\n")

    steps = data.get("steps", [])

    if steps: # como a api retorna o passo a passo das operções matemáticas eu itero por eles e printo um por um
        for i, step in enumerate(steps, start=1):
            print(f"PASSO {i}")
            print(f"Título: {step.get('title')}")
            print(f"Descrição: {step.get('step')}")
            print()

    print("RESULTADO FINAL:")

    results = data.get("result", [])

    if results:
        for result in results:
            print(f"- {result}")

    print()

    print("RESUMO:")
    print(data.get("content"))
    print()


def saveOption(data):
    print("-" * 50)

    file_name = data["subject"].strip().replace(" ", "").replace(':',"") #parseia o titulo pra tirar qualquer caracter invalido pro .txt

    print(f"Deseja salvar em {file_name}.txt")
    print("[1] Sim")
    print("[2] Não\n")

    while True:
        try:
            option = int(input("Resposta: "))

            if option in [1, 2]:
                break

            print("Opção inválida.")

        except ValueError:
            print("Opção inválida.")

    if option == 1:
        with open(f"{file_name}.txt", "w", encoding="utf-8") as f: #cria um .txt e coloca a resposta da api dentro
            f.write(data["content"])

        print(f"\nArquivo salvo em {file_name}.txt\n")



def scanPhoto(img, scan_type="Resumo"): # manda a requisição pra api do gemini com o contexto escolhido
    if scan_type == "Math Resolver":
        context = """
Você é uma API matemática OCR.

Você DEVE responder SOMENTE com JSON puro.

REGRAS OBRIGATÓRIAS:
- NÃO escreva texto fora do JSON
- NÃO use markdown
- NÃO use ```json
- NÃO explique nada fora do JSON
- A resposta DEVE começar com {
- A resposta DEVE terminar com }

SE NÃO EXISTIR conta matemática:

{
  "subject": "Matemática",
  "expression": null,
  "result": [],
  "steps": [],
  "content": "Nenhuma conta encontrada."
}

SE EXISTIR conta matemática:

Retorne EXATAMENTE neste formato:

{
  "subject": "Matemática",
  "expression": "equação detectada",
  "result": [
    "resultado final"
  ],
  "steps": [
    {
      "title": "Nome da etapa",
      "step": "Explicação da etapa"
    }
  ],
  "content": "Resumo curto da resolução"
}

As etapas DEVEM estar separadas.
Cada etapa deve explicar apenas UMA ação.
"""

    else:
        context = f"""
Você é um sistema OCR avançado para estudantes.

Objetivos:
- Ler textos de lousa e caderno
- Corrigir erros ortográficos
- Organizar conteúdo
- Responder em formato {scan_type}

IMPORTANTE:
- Responda APENAS JSON válido
- Não use markdown

Formato obrigatório:

{{
  "subject": "assunto identificado",
  "content": "texto aqui"
}}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            context,
            f"Tipo de análise: {scan_type}",
            "Analise essa imagem.",
            img
        ]
    )

    return response


if __name__ == "__main__":
    start()