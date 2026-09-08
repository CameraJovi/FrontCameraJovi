# Câmera Jovi — frontend React

Frontend do Câmera Jovi desenvolvido com React e Next.js. A aplicação reproduz uma câmera de celular, captura imagens reais pelo navegador, oferece o reconhecimento conceitual do SmartPix e se comunica com a API Python do projeto para gerar resumos, flashcards e resoluções matemáticas.

## Tecnologias utilizadas

- React 19;
- Next.js 16;
- JavaScript;
- HTML5 e CSS3;
- Tesseract.js;
- Fetch API;
- MediaDevices API;
- `localStorage` e `sessionStorage`.

## Funcionalidades

- componentes funcionais com comunicação por props;
- câmera do navegador com troca entre câmera frontal e traseira;
- modos Retrato, Vídeo, Foto, Estudante, Pro e Mais;
- SmartPix conceitual com OCR de e-mails e telefones;
- integração com os endpoints de resumo, flashcards e matemática;
- organização por matérias e histórico persistente com `localStorage`;
- página completa do Caderno Inteligente com filtro por matéria;
- detalhes dos conteúdos salvos em cards expansíveis.

## Pré-requisitos

- Node.js 20.9 ou superior;
- npm;
- API Python do projeto em execução na porta `8000`;
- navegador com permissão para acessar a câmera.

## Instalação

Dentro da pasta `camerajovi`, execute:

```bash
npm install
```

Copie o arquivo de exemplo para `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

No Linux ou macOS:

```bash
cp .env.example .env.local
```

Configure o endereço da API:

```env
NEXT_PUBLIC_JOVI_API_URL=http://127.0.0.1:8000
```

Se nenhum endereço for informado, esse mesmo valor local será utilizado como padrão.

## Execução

Primeiro inicie a API seguindo o README da pasta `python`. Depois execute:

```bash
npm run dev
```

Abra:

```text
http://localhost:5500
```

## Scripts disponíveis

```bash
npm run dev
npm run lint
npm run build
npm run start
```

O comando `npm run start` deve ser utilizado depois de `npm run build`.

## Fluxo do Modo Estudante

1. Selecione o modo **Estudante**.
2. Escolha **Scan**, **Flashcard** ou **Math**.
3. Capture uma imagem.
4. Aguarde a resposta da API.
5. Confira o conteúdo e, se desejar, salve em uma matéria.

O frontend chama diretamente:

- `POST /api/resumo`;
- `POST /api/flashcards`;
- `POST /api/math`;
- `POST /api/salvar`;
- `GET /api/health`.

## Fluxo do SmartPix

O SmartPix fica ativo nos modos **Retrato**, **Foto** e **Pro**. O Tesseract.js analisa periodicamente a região central da imagem diretamente no navegador, aplicando recorte, escala de cinza e contraste para tentar reconhecer um e-mail ou telefone.

Para testar a funcionalidade:

1. Autorize o acesso à câmera.
2. Selecione Retrato, Foto ou Pro.
3. Posicione um e-mail ou telefone legível dentro do quadro amarelo.
4. Mantenha a câmera estável e aguarde o reconhecimento.
5. Confira o valor apresentado no pop-up.
6. Escolha entre cancelar, copiar a chave ou simular a abertura do banco.

O SmartPix não envia o dado reconhecido para o Gemini e não realiza integração bancária. A funcionalidade não valida uma chave Pix, não identifica o proprietário, não solicita senha ou biometria e não efetua pagamentos. A opção **Abrir banco** apresenta apenas uma mensagem simulando a continuação segura em um aplicativo bancário.

## Armazenamento

O `sessionStorage` mantém temporariamente a captura atual e os resultados usados durante a navegação. O `localStorage` guarda as matérias, a última matéria selecionada e o histórico completo com seus detalhes. A tela de salvamento exibe os oito registros mais recentes, enquanto a página `/caderno` permite consultar todos os registros separados por matéria. Ao salvar no Caderno Inteligente, a foto correspondente é reduzida para no máximo 960 pixels de largura, comprimida em JPEG e armazenada como `Blob` no IndexedDB. O histórico mantém apenas a referência da imagem, evitando ocupar o limite reduzido do `localStorage`. Registros antigos, criados antes dessa funcionalidade, continuam disponíveis sem foto.

## Usuários e senhas

Não existe autenticação no frontend. Nenhum usuário ou senha é necessário para teste.

## Uso de inteligência artificial

Na aplicação, o Tesseract.js é utilizado no navegador para reconhecer possíveis e-mails e telefones no SmartPix, enquanto as imagens do Modo Estudante são enviadas para a API Python, que utiliza o Google Gemini para gerar resumos, flashcards e resoluções matemáticas. Durante o desenvolvimento, a IA como o Codex foi utilizada como apoio na implementação e configuração da biblioteca Tesseract.js, principalmente nos ajustes de recorte, contraste, processamento da imagem e identificação dos padrões de e-mail e telefone, pois o OCR inicialmente apresentava dificuldade para reconhecer esses dados. A IA também auxiliou na melhoria do sistema de componentes React, na comunicação entre componentes por meio de props, na organização dos arquivos e na revisão do código. Todas as sugestões foram analisadas, adaptadas ao nível e à estrutura do projeto e testadas pela equipe antes de serem mantidas na aplicação.

## Deploy

**Vercel:** https://camerajovi-kappa.vercel.app

No ambiente publicado, configure `NEXT_PUBLIC_JOVI_API_URL` com o endereço público da API Python.

Para as instruções completas de backend e teste, consulte o [README principal](../README.md).
