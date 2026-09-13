# Câmera Jovi — frontend React

Frontend do Câmera Jovi desenvolvido com React e Next.js. A aplicação reproduz uma câmera de celular, captura imagens reais pelo navegador, oferece o reconhecimento conceitual do SmartPix e se comunica com a API Python do projeto para gerar resumos, flashcards, resoluções matemáticas e análises de código.

## Tecnologias utilizadas

- React 19;
- Next.js 16;
- JavaScript;
- HTML5;
- Tailwind CSS 4 e PostCSS;
- Tesseract.js;
- Fetch API;
- MediaDevices API;
- `localStorage`, `sessionStorage` e IndexedDB.

## Funcionalidades

- componentes funcionais com comunicação por props;
- câmera do navegador com troca entre câmera frontal e traseira;
- modos Retrato, Vídeo, Foto, Estudante, Pro e Mais;
- SmartPix conceitual com OCR de e-mails e telefones;
- integração com os endpoints de resumo, flashcards, matemática e código;
- organização por matérias e histórico persistente com `localStorage`;
- página completa do Caderno Inteligente com filtro por matéria;
- detalhes dos conteúdos salvos em cards expansíveis;
- Jovi Code com explicação, diagnósticos por linha e comparação Antes/Depois;
- cópia da correção e salvamento da explicação com o código no Caderno;
- grade semanal de aulas com cadastro, edição e remoção;
- disciplinas da grade disponíveis no Caderno mesmo sem fotos salvas;
- sugestão de matéria pelo horário da captura, com alteração manual;
- responsividade para celular, tablet e desktop, incluindo rolagem em telas baixas.

## Pré-requisitos

- Node.js 20.9 ou superior;
- npm;
- API Python do projeto em execução na porta `8000`;
- navegador com permissão para acessar a câmera.

## Instalação

Dentro da pasta `camerajoviUpgrade`, execute:

```bash
npm install
```

Se ainda não tiver um `.env.local` configurado, copie o arquivo de exemplo:

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

Primeiro inicie a API seguindo o [README da pasta `python`](../python/README.md). Depois execute:

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
2. Escolha **Scan**, **Flashcard**, **Math** ou **Código**.
3. Capture uma imagem.
4. No Scan, escolha uma análise ou salve a foto diretamente. Nas opções de análise, aguarde a resposta da API.
5. Confira o conteúdo e, se desejar, salve em uma matéria.

O frontend chama diretamente:

- `POST /api/resumo`;
- `POST /api/flashcards`;
- `POST /api/math`;
- `POST /api/codigo`;
- `POST /api/salvar`;
- `GET /api/health`.

## Fluxo do Jovi Code

1. No Modo Estudante, selecione **Código**.
2. Fotografe um trecho legível e aguarde a análise do Gemini.
3. Abra **Explicar código** para consultar o passo a passo e os problemas identificados, com linha, trecho e motivo.
4. Em **Jovi Code**, alterne entre **Antes** e **Depois** para comparar o código original com a correção sugerida.
5. Se houver correção, utilize **Copiar código corrigido**.
6. Confira a disciplina e salve no Caderno Inteligente.

O registro reúne código original, explicação, diagnósticos, correção quando disponível e referência da foto, caso ela tenha sido armazenada com sucesso. Há feedback ao copiar e salvar e verificação para evitar repetir a mesma análise de código na mesma disciplina.

A interface trata carregamento, falha com nova tentativa, imagem sem código legível e análise sem problemas. Não há fallback automático para dados mockados. A análise é reaproveitada ao alternar os painéis, sem outra chamada ao Gemini.


## Caderno Inteligente e grade de aulas

O Caderno organiza fotos e análises por disciplina, com contagem de registros, detalhes expansíveis, renomeação de títulos e exclusão de conteúdos.

Para configurar a organização por horário:

1. Abra **Caderno → Horário de aulas**.
2. Cadastre a disciplina, o dia da semana e os horários de início e fim.
3. Volte ao Caderno: a matéria já aparece na lista, mesmo com **0 registros**.
4. Capture uma foto durante o intervalo cadastrado.
5. No Scan, toque em **Salvar no Caderno**: a disciplina da aula já vem selecionada.
6. Se necessário, use **Alterar disciplina** antes de confirmar.

É possível editar e remover aulas. O sistema rejeita horários sobrepostos no mesmo dia e evita adicionar uma disciplina existente apenas por diferença de maiúsculas e minúsculas.

**Exemplo:** Cálculo ocorre na quarta-feira, das 19h às 20h40. Uma captura às 19h30 recebe Cálculo como sugestão, mesmo que o aluno tenha chegado atrasado ou salve a foto depois.

A sugestão considera o horário local da captura, não o momento de salvar. A aula identificada permanece associada à foto mesmo após alterações na grade. O início do intervalo é inclusivo e o fim exclusivo; fotos anteriores ao recurso não recebem classificação retroativa. Aulas atravessando meia-noite devem ser divididas em intervalos separados.

Sem aula correspondente, a disciplina é escolhida manualmente. O Jovi Code também permite alterar a matéria ao salvar. A grade funciona dentro da aplicação, sem acessar o calendário nativo do celular e sem depender do Gemini.

Fotos simples do Scan são guardadas localmente sem depender do backend. As análises com Gemini precisam da API disponível.

## Responsividade

A interface utiliza Tailwind CSS, com altura adaptável à área disponível, maior largura útil em tablet e desktop, cabeçalhos ajustados para celulares estreitos e rolagem para manter os controles acessíveis em telas baixas ou na horizontal.

## Fluxo do SmartPix

O SmartPix fica ativo nos modos **Retrato**, **Foto** e **Pro**. O Tesseract.js analisa periodicamente a região central da imagem diretamente no navegador, aplicando recorte, escala de cinza e contraste para tentar reconhecer um e-mail ou telefone.

Para testar a funcionalidade:

1. Autorize o acesso à câmera.
2. Selecione Retrato, Foto ou Pro.
3. Posicione um e-mail ou telefone legível dentro do quadro amarelo.
4. Mantenha a câmera estável e aguarde o reconhecimento.
5. Confira o valor apresentado no pop-up.
6. Escolha entre cancelar, copiar a chave ou simular a abertura do banco.



## Armazenamento

O `sessionStorage` mantém temporariamente a captura atual e os resultados usados durante a navegação. O `localStorage` guarda a grade de aulas, as matérias, a última matéria selecionada e o histórico completo com seus detalhes. A tela de salvamento exibe os oito registros mais recentes, enquanto a página `/caderno` permite consultar todos os registros separados por matéria. Ao salvar no Caderno Inteligente, a foto correspondente é reduzida para no máximo 960 pixels de largura, comprimida em JPEG e armazenada como `Blob` no IndexedDB. O histórico mantém apenas a referência da imagem, evitando ocupar o limite reduzido do `localStorage`. Registros antigos, criados antes dessa funcionalidade, continuam disponíveis sem foto.

Os dados são locais ao navegador, sem sincronização entre dispositivos. Limpar os dados do site pode remover grade, histórico e fotos.

## Usuários e senhas

Não existe autenticação no frontend. Nenhum usuário ou senha é necessário para teste.

## Uso de inteligência artificial

Na aplicação, o Tesseract.js é utilizado no navegador para reconhecer possíveis e-mails e telefones no SmartPix, enquanto as imagens do Modo Estudante são enviadas para a API Python, que utiliza o Google Gemini para gerar resumos, flashcards, resoluções matemáticas e análises de código. Durante o desenvolvimento, a IA como o Codex foi utilizada como apoio na implementação e configuração da biblioteca Tesseract.js, principalmente nos ajustes de recorte, contraste, processamento da imagem e identificação dos padrões de e-mail e telefone, pois o OCR inicialmente apresentava dificuldade para reconhecer esses dados. A IA também auxiliou na melhoria do sistema de componentes React, na comunicação entre componentes por meio de props, na organização dos arquivos e na revisão do código. A IA também apoiou o Jovi Code, a grade de aulas, a responsividade e a documentação. As sugestões exigem revisão pela equipe e testes funcionais. A identificação da disciplina pelo horário é uma regra local, não uma análise de IA.

## Deploy

**Vercel:** https://camerajovi-kappa.vercel.app

No ambiente publicado, configure a raiz do frontend como `camerajoviUpgrade` e `NEXT_PUBLIC_JOVI_API_URL` com o endereço HTTPS público da API Python. A origem do frontend deve estar autorizada no CORS do backend. Confirme se o deploy contém a versão atual antes da entrega.

No celular, `localhost` aponta para o próprio aparelho: utilize uma URL de API acessível pelo dispositivo. A câmera depende de permissão e de um contexto seguro, como HTTPS ou localhost no computador. A chave `GEMINI_API_KEY` pertence exclusivamente ao backend e nunca deve ser publicada no frontend.

Para as instruções completas de backend e teste, consulte o [README principal](../README.md).
