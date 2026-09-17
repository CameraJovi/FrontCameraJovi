# Câmera Jovi — API Python

Backend do Câmera Jovi desenvolvido com FastAPI. A API recebe imagens capturadas pelo frontend React, utiliza o Google Gemini para interpretar o conteúdo e devolve respostas em JSON para as páginas de resumo, flashcards, matemática e código.

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
- Jovi Code: transcrição, linguagem, explicação, diagnósticos por linha e correção opcional, sem executar código;
- normalização das respostas do Gemini para JSON;
- salvamento das análises em arquivos `.txt` organizados por matéria;
- endpoint de verificação da API.

## Pré-requisitos

- Python 3.10 ou superior;
- uma ou mais chaves válidas da API Google Gemini;
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

## Configuração das chaves do Gemini

Copie o arquivo `.env.example` para `.env`.

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

Depois, abra o arquivo `.env` e configure as chaves em ordem de prioridade:

```env
GEMINI_API_KEYS=SUA_CHAVE_PRINCIPAL,SUA_CHAVE_FALLBACK_1,SUA_CHAVE_FALLBACK_2
```

A primeira chave deve pertencer à conta paga. As demais são alternativas, na ordem
informada. Uma única chave também pode ser usada em `GEMINI_API_KEYS`.

- Cada operação começa pela primeira chave, inclusive depois de uma operação que
  precisou de fallback. Não há round-robin, cooldown ou chave ativa compartilhada.
- Somente HTTP 429 ou `RESOURCE_EXHAUSTED` estruturado pelo SDK provoca tentativa
  com a próxima chave, mantendo imagem, prompt, modelo e configuração da operação.
- Erros de autenticação, validação, imagem, timeout, outros erros do provedor ou
  resposta inválida não provocam troca de chave. Uma falha desse tipo também
  interrompe a sequência se acontecer em uma chave de fallback.
- Se todas as chaves atingirem quota/rate limit, os quatro endpoints de análise
  retornam HTTP 503 com
  `{"detail":"Servico de analise temporariamente indisponivel. Tente novamente."}`.
- Espaços e entradas vazias são removidos; duplicatas são ignoradas, preservando
  a ordem. `GEMINI_API_KEYS` tem precedência sobre `GEMINI_API_KEY`; elas não são
  combinadas. Se a variável plural existir mas estiver vazia, a análise retorna
  um erro de configuração, sem usar silenciosamente a variável antiga.
- Para manter a configuração antiga, remova `GEMINI_API_KEYS` e continue usando
  `GEMINI_API_KEY`. O script legado `script.py` continua usando apenas a variável
  singular; este fallback pertence à API FastAPI.

O carregamento de `python/.env` continua usando `python-dotenv`, sem sobrescrever
variáveis já definidas no processo. No Render, configure `GEMINI_API_KEYS` em
**Environment** no serviço Python e aplique a alteração/redeploy. Não coloque
essas chaves em `NEXT_PUBLIC_*`, na URL do ping, no frontend ou em arquivos de deploy
versionados. Não é necessário alterar `NEXT_PUBLIC_JOVI_API_URL` por causa do fallback.

Os arquivos `.env` e suas variantes locais estão no `.gitignore`; somente
`.env.example`, com placeholders, deve ser versionado. Nenhuma chave real deve ser
incluída em commits, logs ou mensagens de erro. O health check funciona mesmo sem
chaves configuradas e não verifica a disponibilidade do Gemini.

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

A resposta esperada, com HTTP 200, é:

```json
{
  "status": "ok",
  "service": "camera-jovi-api"
}
```

Esse endpoint retorna somente um objeto fixo: não chama Gemini, não cria clientes,
não lê arquivos e não depende de banco ou serviço externo. As análises síncronas
rodam no thread pool para não bloquear o event loop enquanto aguardam o Gemini.

## Ping externo para a apresentação

Por enquanto, o destino disponível é **local**:

```powershell
curl.exe --fail http://127.0.0.1:8000/api/health
```

Inicie a API com o comando da seção anterior antes de testar. Esse comando faz
um único GET. Nenhum agendamento foi ativado e a API não contém loop, thread de
autoping ou scheduler. Um serviço externo não consegue alcançar o localhost do
seu computador: não configure esse endereço no cron-job.org.

Quando houver URL pública do Render, configure no painel do
[cron-job.org](https://cron-job.org/en/):

1. Crie um cron job chamado `DeepY API health` e informe a URL HTTPS pública do
   serviço Python seguida de `/api/health`, sem duplicar o caminho. Exemplo
   ilustrativo: `https://SEU-SERVICO.onrender.com/api/health`.
2. Escolha método **GET**, sem corpo, autenticação ou headers com chaves Gemini.
3. No agendamento personalizado, selecione todos os dias, meses e horas; nos
   minutos, selecione `0,7,14,21,28,35,42,49,56` (equivalente a `*/7 * * * *`).
   São intervalos de sete minutos, exceto na virada da hora, quando são quatro.
4. Ative notificações de falha, salve e habilite o job somente depois de definir
   o endereço público. Execute o teste manual e confira HTTP 200 e o JSON esperado.
5. Confira no histórico pelo menos duas execuções agendadas bem-sucedidas e faça
   um GET manual antes da apresentação para confirmar que a aplicação está pronta.

No serviço web do Render, configure também **Health Check Path** como
`/api/health`; essa configuração não substitui o ping externo. O repositório não
contém infraestrutura de cron, e nenhuma alteração adicional de código é
necessária quando a URL chegar: a ativação acontece no painel externo.

O plano gratuito do Render pode suspender o serviço após 15 minutos sem tráfego;
o ping busca reduzir essa ocorrência, mas não garante disponibilidade diante de
reinícios, limites do plano ou falhas de rede. Um primeiro GET após suspensão
pode demorar e exceder o timeout do agendador; aguarde a inicialização e teste
novamente. Consulte as limitações do [Render Free](https://render.com/docs/free)
e do [cron-job.org](https://cron-job.org/en/faq/).

A documentação interativa gerada pelo FastAPI está disponível em:

```text
http://127.0.0.1:8000/docs
```

## Executar com o frontend React

Em outro terminal, partindo da raiz do repositório, execute:

```bash
cd camerajoviUpgrade
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
| `POST` | `/api/codigo` | Analisa código fotografado e retorna explicação, problemas e correção opcional |
| `POST` | `/api/salvar` | Salva uma análise em arquivo `.txt` |

Os endpoints de resumo, flashcards, matemática e código recebem `multipart/form-data` com a imagem no campo `image`.

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

Confirme se as chaves estão corretas, se o arquivo `.env` está dentro de `python`
ou as variáveis foram definidas no Render, e se existe conexão com a internet.
Mensagens do provedor são sanitizadas; não habilite logs de credenciais para
diagnosticar falhas. HTTP 503 indica que todas as chaves tentadas atingiram quota.

### Frontend não acessa a API

Confirme que o Uvicorn continua executando na porta `8000` e que `NEXT_PUBLIC_JOVI_API_URL`, no frontend, aponta para `http://127.0.0.1:8000`.

### API encerrou

Execute novamente:

```bash
python -m uvicorn api:app --reload --port 8000
```

Fechar o terminal ou pressionar `Ctrl + C` encerra o backend.

## Jovi Code

Análise de código por foto disponível em `POST /api/codigo`. O contrato está em
`code_analysis.py`; configuração e testes estão descritos neste documento.
A grade de aulas e a associação por horário são processadas no frontend, sem chamada ao Gemini. Fotos simples do Scan e registros de Jovi Code são guardados no Caderno local; esse fluxo não equivale a sincronização de dados no servidor.

O endpoint de código valida a resposta estruturada antes de entregá-la ao frontend. Sem código legível, retorna `status: "no_code"`; falhas de análise retornam HTTP 502, exceto esgotamento de quota de todas as chaves, que retorna HTTP 503. `GEMINI_CODE_MODEL` pode ser configurado no `.env` para substituir o modelo padrão somente na análise de código.

## Testes da API e disponibilidade

Com o ambiente virtual ativo, na pasta `python`:

```bash
python -m pip install -r requirements-dev.txt
python -m unittest discover -s . -p "test_*.py" -v
```

Os testes em `test_api_availability.py` simulam o provedor Gemini e não consomem
quota. Cobrem configuração, prioridade e fallback, erros sem troca de chave,
ausência de credenciais em respostas/logs de erro, contratos das quatro análises,
validação de uploads, salvamento e health check durante uma análise em andamento.
Use um ambiente virtual com as dependências declaradas, não um SDK global antigo.
A validação real requer chaves válidas, acesso ao modelo configurado e conectividade;
os testes simulados não comprovam quota ou disponibilidade das contas no Gemini.
