# Camera Jovi

O **Camera Jovi** é uma aplicação web com backend em Python/FastAPI que utiliza o **Google Gemini** para analisar imagens de cadernos, lousas, textos, expressões matemáticas e códigos de programação.

A aplicação simula uma câmera de celular e permite capturar uma imagem diretamente pelo navegador. Conforme a funcionalidade escolhida, o processamento acontece na API com Gemini ou localmente no navegador. O projeto oferece:

* Resumos inteligentes;
* Flashcards de estudo;
* Resolução de expressões matemáticas;
* Jovi Code com explicação, identificação de problemas e correção sugerida;
* Grade de aulas com sugestão de disciplina pelo horário da foto;
* Reconhecimento de possíveis e-mails e telefones com o SmartPix;
* Arquivos `.txt` com os resultados das análises;
* Caderno Inteligente local com a foto original comprimida e o conteúdo gerado.

---

## Estrutura do projeto

```text
FrontCameraJovi/
|
|-- camerajoviUpgrade/                         # Frontend React e Next.js
|   |-- app/
|   |   |-- components/                 # Componentes funcionais
|   |   |   |-- Cabecalho.js
|   |   |   |-- CabecalhoAcao.js
|   |   |   |-- CardAcaoScan.js
|   |   |   |-- CardEstudante.js
|   |   |   |-- CardFlashcard.js
|   |   |   |-- CorpoCamera.js
|   |   |   |-- EstadoAnalise.js
|   |   |   |-- ItemHistorico.js
|   |   |   |-- ModalSmartPix.js
|   |   |   |-- PainelMais.js
|   |   |   |-- PreviewCaptura.js
|   |   |   `-- Rodape.js
|   |   |-- hooks/
|   |   |   `-- useJoviAnalysis.js      # Requisições das análises
|   |   |-- services/
|   |   |   |-- captureSession.js       # Captura e sessionStorage
|   |   |   |-- gradeAulas.js           # Grade e identificação de aula
|   |   |   |-- cadernoHistorico.js     # Matérias e histórico local
|   |   |   |-- cadernoImagens.js       # Fotos no IndexedDB
|   |   |   |-- codeResponse.js         # Adaptação da resposta de código
|   |   |   `-- joviApi.js              # Comunicação com a API
|   |   |-- lib/tailwind.js             # Classes compartilhadas e responsividade
|   |   |-- codigo/page.js              # Explicar código e Jovi Code
|   |   |-- horarios/page.js            # Grade semanal de aulas
|   |   |-- equacao/page.js             # Resultado matemático
|   |   |-- flashcard/page.js           # Flashcards gerados
|   |   |-- resumo/page.js              # Resumo gerado
|   |   |-- salvar/page.js              # Salvamento e registros recentes
|   |   |-- caderno/page.js             # Histórico completo por matéria
|   |   |-- scan/page.js                # Ações do scan
|   |   |-- icon.svg                     # Ícone da aplicação
|   |   |-- globals.css
|   |   |-- layout.js
|   |   |-- opengraph-image.js           # Imagem de compartilhamento
|   |   |-- page.js                     # Tela principal da câmera
|   |-- public/
|   |   |-- img/math.png
|   |   |-- file.svg
|   |   |-- globe.svg
|   |   |-- next.svg
|   |   |-- vercel.svg
|   |   `-- window.svg
|   |-- .env.example                    # Exemplo da URL da API
|   |-- .gitignore
|   |-- eslint.config.mjs
|   |-- jsconfig.json
|   |-- next.config.mjs
|   |-- package-lock.json
|   |-- package.json
|   `-- README.md
|
`-- python/                    # Backend
    |-- api.py                 # API FastAPI
    |-- jovi_ai.py              # Integração com Gemini
    |-- code_analysis.py        # Prompt e contrato da análise de código
    |-- script.py              # Versão antiga via terminal
    |-- requirements.txt       # Dependências Python
    |-- README.md              # Documentação do backend
    `-- salvos/                # Arquivos gerados pela aplicação
```

---

# Funcionalidades

### 📷 Captura de imagens

Utiliza a câmera do navegador através da API `getUserMedia` para capturar imagens de:

* Cadernos;
* Lousas;
* Anotações;
* Textos;
* Exercícios;
* Expressões matemáticas;
* Trechos de código.

### 📝 Resumo inteligente

A imagem capturada é enviada ao Gemini, que interpreta o conteúdo e gera um resumo organizado.

### 🧠 Flashcards

A partir do conteúdo da imagem, o sistema pode gerar flashcards para auxiliar nos estudos.

### ➗ Matemática

O sistema identifica expressões matemáticas presentes na imagem e retorna uma resolução detalhada.

### 💻 Jovi Code

O Modo Estudante possui a opção **Código**, que envia a foto real ao endpoint `POST /api/codigo`. O Gemini identifica a linguagem, transcreve o código e retorna uma análise estruturada. O código fotografado não é executado.

* **Explicar código:** apresenta o passo a passo do que o código original faz e os problemas identificados, com linha, trecho e motivo.
* **Diagnósticos:** diferencia erros, avisos e sugestões; o problema principal fica aberto e os demais podem ser expandidos.
* **Jovi Code:** permite alternar entre **Antes** e **Depois**, conferir os trechos alterados e copiar o código corrigido.
* **Salvamento:** reúne código original, explicação, diagnósticos e correção opcional no mesmo registro do Caderno, com a foto quando seu armazenamento for bem-sucedido.
* **Feedback:** informa quando o código foi copiado ou a análise foi salva e evita repetir o mesmo registro de código na mesma disciplina.

A interface trata carregamento, falha com nova tentativa, imagens sem código legível e análises sem problemas. Não utiliza uma resposta mockada como substituição automática em caso de erro. Alternar entre os painéis reaproveita a análise da captura, sem uma nova chamada ao Gemini.

**A correção é uma sugestão. Revise antes de utilizar.** Informações incompletas ou ilegíveis na imagem podem limitar a análise.

### 📚 Caderno Inteligente e grade de aulas

O Caderno reúne fotos e conteúdos por disciplina, com filtros, contagem de registros, detalhes expansíveis, renomeação de títulos e exclusão de conteúdos.

Em **Caderno → Horário de aulas**, o estudante cadastra a disciplina, o dia da semana e os horários de início e fim. É possível editar e remover aulas, e o sistema impede horários sobrepostos no mesmo dia.

Ao cadastrar uma aula, a disciplina já aparece na lista de matérias do Caderno com **0 registros**, sem precisar salvar uma foto primeiro. A integração evita adicionar outra matéria apenas por diferença de maiúsculas e minúsculas.

Ao capturar uma imagem, a Jovi guarda a aula correspondente ao horário local do aparelho. Assim, a sugestão de disciplina continua vinculada à foto mesmo que o estudante salve depois ou altere a grade.

**Exemplo:** Cálculo acontece na quarta-feira, das 19h às 20h40. Uma foto tirada às 19h30 recebe Cálculo como sugestão, mesmo que o aluno tenha chegado atrasado.

No Scan, ao tocar em **Salvar no Caderno**, a matéria sugerida já vem selecionada. O usuário pode escolher **Alterar disciplina** se a aula tiver sido trocada. Sem aula correspondente, a seleção é manual. A disciplina também pode ser alterada ao salvar uma análise de código.


### 💾 Salvamento

As análises enviadas ao endpoint de salvamento podem gerar arquivos `.txt`, organizados por matéria dentro da pasta:

```text
python/salvos/
```

No frontend, o Caderno Inteligente mantém o histórico completo e apresenta os oito registros mais recentes na tela de salvamento. Uma página própria permite consultar todos os conteúdos filtrados por matéria. Cada registro relaciona a matéria, o assunto, o tipo da análise, a data, o conteúdo gerado e a foto comprimida. Os dados descritivos ficam no `localStorage`, enquanto as imagens são armazenadas como `Blob` no IndexedDB do navegador.

Fotos simples do Scan e registros de Jovi Code são salvos no Caderno local, sem gerar automaticamente um arquivo no servidor. A análise de código continua exigindo o backend e o Gemini. A grade e o histórico ficam no `localStorage`; capturas temporárias e análises da sessão, no `sessionStorage`. Não há sincronização entre dispositivos. Limpar os dados do navegador pode remover os registros.

### ❤️ Health Check

A API possui um endpoint para verificar se o backend está funcionando:

```text
GET /api/health
```

---

# Requisitos

Antes de começar, certifique-se de possuir:

* **Node.js 20.9 ou superior**
* **npm**
* **Python 3.10 ou superior**
* Um navegador moderno, como Chrome, Edge ou Firefox
* Uma câmera, caso queira utilizar a captura diretamente pelo navegador
* Uma chave de API do **Google Gemini**
* Conexão com a internet

O projeto foi desenvolvido e testado em Windows, mas o backend pode ser executado em outros sistemas operacionais com Python.

---

# Configuração

## 1. Clone o repositório

Clone o projeto utilizando Git:

```bash
git clone https://github.com/CameraJovi/FrontCameraJovi.git
```

Entre na pasta do projeto:

```bash
cd FrontCameraJovi
```

---

# 2. Configurar o backend

Entre na pasta `python`:

```bash
cd python
```

## Criar ambiente virtual

Crie um ambiente virtual Python:

### Windows

```powershell
py -m venv .venv
```

Ative o ambiente:

```powershell
.\.venv\Scripts\Activate.ps1
```

Caso o PowerShell bloqueie a execução de scripts, utilize:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Depois:

```powershell
.\.venv\Scripts\Activate.ps1
```

### Linux/macOS

```bash
python3 -m venv .venv
```

Ative o ambiente:

```bash
source .venv/bin/activate
```

---

# 3. Instalar as dependências

Com o ambiente virtual ativado, execute:

```bash
pip install -r requirements.txt
```

Isso instalará as dependências necessárias para executar a API.

---

# 4. Configurar a API do Gemini

O projeto utiliza uma chave de API do Google Gemini para realizar as análises.

Dentro da pasta `python`, crie um arquivo chamado:

```text
.env
```

Adicione:

```env
GEMINI_API_KEYS=SUA_CHAVE_PRINCIPAL,SUA_CHAVE_FALLBACK_1,SUA_CHAVE_FALLBACK_2
```

Configure as chaves somente no backend, começando pela conta paga. A API sempre
tenta a principal e usa as demais apenas diante de quota/rate limit. A variável
antiga `GEMINI_API_KEY` continua aceita quando `GEMINI_API_KEYS` estiver ausente.
Veja as regras e a configuração do Render em [python/README.md](python/README.md).

### Importante

Nunca publique sua chave de API no GitHub.

O arquivo `.env` deve estar incluído no `.gitignore`:

```text
.env
```

---

# 5. Iniciar o backend

Ainda dentro da pasta `python`, execute:

```bash
uvicorn api:app --reload --port 8000
```

Se tudo estiver funcionando, a API ficará disponível em:

```text
http://127.0.0.1:8000
```

ou:

```text
http://localhost:8000
```

---

## Testar a API

Abra no navegador:

```text
http://127.0.0.1:8000/api/health
```

A resposta esperada é semelhante a:

```json
{
  "status": "ok",
  "service": "camera-jovi-api"
}
```

Essa resposta confirma que o serviço está acessível, mas não valida a chave, a cota ou o acesso ao modelo Gemini.

---

# 6. Iniciar o frontend

Abra **outro terminal** na pasta raiz do projeto.

Entre na pasta do frontend:

```bash
cd camerajoviUpgrade
```

Instale as dependências do React:

```bash
npm install
```

O frontend utiliza `http://127.0.0.1:8000` como endereço padrão da API. Para configurar outro endereço, copie `.env.example` para `.env.local` e altere:

```powershell
Copy-Item .env.example .env.local
```

O conteúdo esperado é:

```env
NEXT_PUBLIC_JOVI_API_URL=http://127.0.0.1:8000
```

Inicie o Next.js:

```bash
npm run dev
```

Depois abra:

```text
http://127.0.0.1:5500
```

ou:

```text
http://localhost:5500
```

---

# 7. Utilizando a aplicação

Com o backend e o frontend funcionando:

1. Abra o endereço do frontend no navegador.
2. Permita o acesso à câmera.
3. Selecione o modo Estudante e escolha Scan, Flashcard, Math ou Código.
4. Capture uma imagem.
5. No Scan, escolha uma análise ou salve a foto diretamente; nas opções de análise, aguarde a API.
6. A API enviará a imagem para o Gemini.
7. O resultado será processado e exibido na interface.

Dependendo do modo escolhido, o sistema poderá gerar:

* Resumo;
* Flashcards;
* Resolução matemática;
* Explicação e correção sugerida de código.

Os resultados também podem ser salvos através da opção de salvamento.

---

# Endpoints da API

| Método | Endpoint          | Função                                 |
| ------ | ----------------- | -------------------------------------- |
| `GET`  | `/api/health`     | Verifica se a API está funcionando     |
| `POST` | `/api/resumo`     | Gera um resumo a partir de uma imagem  |
| `POST` | `/api/flashcards` | Gera flashcards a partir de uma imagem |
| `POST` | `/api/math`       | Resolve expressões matemáticas         |
| `POST` | `/api/codigo`     | Analisa código fotografado e retorna explicação, problemas e correção opcional |
| `POST` | `/api/salvar`     | Salva a análise enviada em `.txt`       |

Os endpoints de análise recebem a imagem através de:

```text
multipart/form-data
```

utilizando o campo:

```text
image
```

---

# Fluxo da aplicação

As análises de imagens com Gemini seguem o fluxo abaixo. SmartPix, grade de aulas e salvamento local do Caderno têm processamento no navegador; a gravação em `.txt` ocorre quando a API de salvamento é chamada.

```text
┌─────────────────────┐
│      Navegador      │
│                     │
│  Câmera do usuário  │
└──────────┬──────────┘
           │
           │ Captura da imagem
           ▼
┌─────────────────────┐
│      Frontend       │
│   React e Next.js   │
└──────────┬──────────┘
           │
           │ HTTP Request
           ▼
┌─────────────────────┐
│     FastAPI         │
│      Backend        │
└──────────┬──────────┘
           │
           │ Validação
           ▼
┌─────────────────────┐
│     Pillow          │
│ Validação da imagem │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     Google Gemini   │
│  Análise da imagem  │
└──────────┬──────────┘
           │
           │ Resultado
           ▼
┌─────────────────────┐
│       FastAPI       │
│ Normalização JSON   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      Frontend       │
│ Exibição do resultado│
└──────────┬──────────┘
           │
           │ Opcional
           ▼
┌─────────────────────┐
│   python/salvos/    │
│      .txt            │
└─────────────────────┘
```

---

# Salvamento dos resultados

Quando uma análise é enviada a `POST /api/salvar`, a API cria um arquivo `.txt` dentro de:

```text
python/salvos/
```

Os arquivos são organizados de acordo com a matéria selecionada.

Exemplo:

```text
python/
`-- salvos/
    |-- matematica/
    |   |-- analise_01.txt
    |   `-- analise_02.txt
    |
    |-- historia/
    |   `-- analise_01.txt
    |
    `-- fisica/
        `-- analise_01.txt
```

---

# Executando a versão antiga via terminal

O arquivo:

```text
python/script.py
```

é uma versão anterior do projeto que permite executar o fluxo diretamente pelo terminal.

Para utilizá-lo:

```bash
cd python
```

Ative o ambiente virtual e execute:

```bash
python script.py
```

Essa versão permite utilizar uma webcam ou selecionar uma imagem local, dependendo da implementação atual do script.

---

# Problemas comuns

## A câmera não abre

Verifique:

* Se o navegador possui permissão para acessar a câmera;
* Se outro programa está utilizando a câmera;
* Se o frontend React foi iniciado com `npm run dev`;
* Se você está acessando o frontend por `localhost` ou `127.0.0.1`.

Não abra os arquivos do projeto diretamente pelo explorador de arquivos.

Utilize:

```text
http://127.0.0.1:5500
```

---

## A API não inicia

Verifique se o ambiente virtual está ativado:

```bash
python --version
```

ou:

```bash
py --version
```

Depois confirme se as dependências foram instaladas:

```bash
pip install -r requirements.txt
```

Também é possível testar diretamente:

```bash
uvicorn api:app --reload --port 8000
```

---

## Erro relacionado à chave do Gemini

Verifique se o arquivo:

```text
python/.env
```

existe e contém:

```env
GEMINI_API_KEYS=SUA_CHAVE_PRINCIPAL,SUA_CHAVE_FALLBACK
```

Também confirme se a chave é válida e possui acesso à API utilizada pelo projeto.

---

## O frontend não consegue acessar a API

Verifique se:

### Backend

Está rodando em:

```text
http://127.0.0.1:8000
```

### Frontend

Está rodando em:

```text
http://127.0.0.1:5500
```

Também verifique se `NEXT_PUBLIC_JOVI_API_URL` corresponde ao endereço em que o backend está executando.

---

# Desenvolvimento

Para modificar o projeto, recomenda-se manter dois terminais abertos:

### Terminal 1 — Backend

```bash
cd python
```

Ative o ambiente virtual e execute:

```bash
uvicorn api:app --reload --port 8000
```

### Terminal 2 — Frontend

```bash
cd camerajoviUpgrade
```

Execute:

```bash
npm run dev
```

O `--reload` do Uvicorn permite que alterações no código do backend sejam detectadas automaticamente durante o desenvolvimento.

---

# Tecnologias utilizadas

### Frontend

* React 19
* Next.js 16
* JavaScript
* Tailwind CSS 4 e PostCSS
* Tesseract.js
* MediaDevices API (`getUserMedia`)
* Fetch API
* `localStorage`, `sessionStorage` e IndexedDB

### Backend

* Python
* FastAPI
* Uvicorn
* Pillow
* python-dotenv
* Google Gemini API

---

# Uso de inteligência artificial

Na aplicação, o Tesseract.js é utilizado no navegador para reconhecer possíveis e-mails e telefones no SmartPix, enquanto as imagens do Modo Estudante são enviadas para a API Python, que utiliza o Google Gemini para gerar resumos, flashcards, resoluções matemáticas e análises de código. A associação de disciplina por horário é uma regra local, sem uso de IA. Durante o desenvolvimento, uma ferramenta de IA generativa foi utilizada como apoio na implementação e configuração da biblioteca Tesseract.js, principalmente nos ajustes de recorte, contraste, processamento da imagem e identificação dos padrões de e-mail e telefone, pois o OCR inicialmente apresentava dificuldade para reconhecer esses dados. A IA também auxiliou na melhoria do sistema de componentes React, na comunicação entre componentes por meio de props, na organização dos arquivos e na revisão do código. A IA também apoiou a implementação do Jovi Code, da grade de aulas, dos ajustes responsivos e da documentação. As sugestões precisam de revisão da equipe, e testes automatizados não substituem a validação funcional em dispositivos reais.

---

# Usuários e senhas para teste

Não há autenticação implementada. Nenhum usuário ou senha é necessário; os dados do Caderno são locais ao navegador.

---

# Verificações

Na pasta `camerajoviUpgrade`, execute:

```bash
npm run lint
npm run build
npm run start
```

Use `start` após o build, sem outra instância ocupando a porta 5500.

Na pasta `python`, com o ambiente virtual ativo:

```bash
python -m pip install -r requirements-dev.txt
python -m unittest discover -s . -p "test_*.py" -v
```

Os testes da API simulam o provedor e não consomem o Gemini; incluem prioridade
das chaves, fallback, contratos e health check. Para validar a integração real,
teste uma captura com a API e uma chave válidas.

---

# Deploy

Repositório: [FrontCameraJovi](https://github.com/CameraJovi/FrontCameraJovi).

Link informado do frontend: [Camera Jovi na Vercel](https://camerajovi-kappa.vercel.app).

Antes da entrega, confirme se o deploy contém a versão atual e se a API pública está funcionando. Na Vercel, a pasta do frontend é `camerajoviUpgrade`; configure `NEXT_PUBLIC_JOVI_API_URL` com a URL HTTPS pública do backend e autorize a origem no CORS.

O teste local de disponibilidade usa `http://127.0.0.1:8000/api/health`. O ping
externo pelo cron-job.org está pendente da URL pública do Render; localhost não
é acessível pelo agendador. O procedimento para GET aproximadamente a cada sete
minutos está em [python/README.md](python/README.md#ping-externo-para-a-apresentação).
Nenhum scheduler de autoping é executado dentro da API.

No celular, localhost aponta para o próprio aparelho. A câmera exige um contexto seguro, como HTTPS, e a API precisa ser acessível pelo dispositivo. Não use localhost como endereço da API em um frontend publicado.

---

# Equipe

* **Vitor de Castro Buzato** — RM 569720
* **Joao Pedro Ferreira Pinheiro** — RM 570569
* **Joao Pedro Gomes de Matos** — RM 569934
* **Davi Pereira** — RM 572337
* **Gabriel Palmieri** — RM 570508

---

# Observações

O Camera Jovi é um projeto desenvolvido para fins acadêmicos e de demonstração.

A aplicação depende de uma chave válida da API do Google Gemini e de conexão com a internet para realizar as análises de imagens.
