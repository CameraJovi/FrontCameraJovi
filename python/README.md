# Câmera Jovi — API Python

Backend do Câmera Jovi desenvolvido com FastAPI. A API recebe imagens capturadas pelo frontend React, utiliza o Google Gemini para interpretar o conteúdo e devolve respostas em JSON para as páginas de resumo, flashcards e matemática.

## Tecnologias utilizadas

- Python 3.10 ou superior;
- FastAPI;
- Uvicorn;
- Google Gen AI SDK;
- Google Gemini (`gemini-3.6-flash`);
- Pillow;
- python-dotenv;
- python-multipart;
- OpenCV, mantido para o fluxo antigo do `script.py`.

## Funcionalidades

- validação das imagens recebidas;
- geração de resumo inteligente;
- criação de flashcards;
- identificação e resolução de exercícios matemáticos;
- normalização das respostas do Gemini para JSON;
- salvamento das análises em arquivos `.txt` organizados por matéria;
- endpoint de verificação da API.

## Pré-requisitos

- Python 3.10 ou superior;
- uma chave válida da API Google Gemini;
- conexão com a internet;
- frontend React executando em `http://localhost:5500` ou `http://127.0.0.1:5500`.

## Instalação

Partindo da raiz do repositório, entre na pasta do backend:

```bash
cd python
```

Crie um ambiente virtual:

```bash
python -m venv .venv
```

No Windows PowerShell, ative com:

```powershell
.\.venv\Scripts\Activate.ps1
```

No Linux ou macOS, ative com:

```bash
source .venv/bin/activate
```

Instale as dependências:

```bash
python -m pip install -r requirements.txt
```

## Configuração da chave do Gemini

Copie o arquivo `.env.example` para `.env`.

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

Depois, abra o arquivo `.env` e substitua o valor de exemplo pela sua chave:

```env
GEMINI_API_KEY=sua_chave_do_google_gemini
```

O arquivo `.env` está no `.gitignore` e não deve ser enviado ao GitHub.

## Como executar

Com o ambiente virtual ativo e dentro da pasta `python`, execute:

```bash
python -m uvicorn api:app --reload --port 8000
```

A API ficará disponível em:

```text
http://127.0.0.1:8000
```

Mantenha esse terminal aberto enquanto utiliza a aplicação.

## Como testar a API

Abra o health check no navegador:

```text
http://127.0.0.1:8000/api/health
```

A resposta esperada é:

```json
{
  "status": "ok",
  "service": "camera-jovi-api"
}
```

A documentação interativa gerada pelo FastAPI está disponível em:

```text
http://127.0.0.1:8000/docs
```

## Executar com o frontend React

Em outro terminal, partindo da raiz do repositório, execute:

```bash
cd camerajovi
npm install
npm run dev
```

Acesse:

```text
http://localhost:5500
```

O CORS da API está configurado para aceitar o frontend local nas portas e endereços indicados acima.

## Endpoints

| Método | Endpoint | Função |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica se a API está funcionando |
| `POST` | `/api/resumo` | Gera um resumo a partir de uma imagem |
| `POST` | `/api/flashcards` | Gera flashcards a partir de uma imagem |
| `POST` | `/api/math` | Identifica e resolve um exercício matemático |
| `POST` | `/api/salvar` | Salva uma análise em arquivo `.txt` |

Os endpoints de resumo, flashcards e matemática recebem `multipart/form-data` com a imagem no campo `image`.

O endpoint de salvamento recebe JSON no seguinte formato:

```json
{
  "materia": "Matemática",
  "analysis": {
    "analysis_type": "math",
    "subject": "Equação do segundo grau"
  }
}
```

## Fluxo da integração

1. O frontend React abre a câmera com `getUserMedia`.
2. O usuário captura uma imagem no Modo Estudante.
3. O frontend envia a imagem para um endpoint FastAPI.
4. A API valida a imagem com Pillow.
5. O Gemini analisa o conteúdo.
6. A API normaliza e devolve o resultado em JSON.
7. O React apresenta o conteúdo na tela.
8. Se solicitado, a API salva a análise em `python/salvos/<materia>/`.

## Arquivos principais

- `api.py`: configura o FastAPI, o CORS e os endpoints;
- `jovi_ai.py`: configura o Gemini, os prompts, a normalização e o salvamento;
- `requirements.txt`: lista as dependências Python;
- `.env.example`: mostra a variável de ambiente necessária;
- `script.py`: fluxo antigo executado pelo terminal, mantido apenas como referência.

## Problemas comuns

### Erro 500 nas análises

Confirme se a chave está correta, se o arquivo `.env` está dentro de `python` e se existe conexão com a internet. O terminal da API também apresenta informações sobre o erro ocorrido.

### Frontend não acessa a API

Confirme que o Uvicorn continua executando na porta `8000` e que `NEXT_PUBLIC_JOVI_API_URL`, no frontend, aponta para `http://127.0.0.1:8000`.

### API encerrou

Execute novamente:

```bash
python -m uvicorn api:app --reload --port 8000
```

Fechar o terminal ou pressionar `Ctrl + C` encerra o backend.

## Jovi Code

Análise de código por foto disponível em `POST /api/codigo`. Veja o [contrato, configuração e testes](CODIGO.md).

