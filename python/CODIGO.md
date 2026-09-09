# Integração Jovi Code

O frontend envia a foto real a `POST /api/codigo`, multipart com campo `image`.
Não há fallback para dados mockados. O Gemini realiza análise estática, sem
executar o código. A mesma resposta alimenta Explicar código, Antes/Depois e o
salvamento local no Caderno Inteligente.

## Configuração

Backend: instale `pip install -r requirements.txt` e configure `GEMINI_API_KEY`
no arquivo `python/.env`. Nunca coloque essa chave no frontend.
`GEMINI_CODE_MODEL` é opcional; por padrão usa o modelo já configurado no backend.
Inicie na pasta python: `uvicorn api:app --host 0.0.0.0 --port 8000`.

Frontend: configure `NEXT_PUBLIC_JOVI_API_URL=http://localhost:8000` em
`camerajoviUpgrade/.env.local` e reinicie o Next. Em celular, localhost aponta
para o próprio aparelho: use uma URL de backend acessível pelo celular.
A origem do frontend precisa estar autorizada no CORS do backend; câmera em
celular normalmente exige HTTPS. Em produção, frontend HTTPS exige API HTTPS.

## Contrato

- `analysis_type: "code"`, `status: "ok" | "no_code"`.
- `language`, `subject`, `content`: linguagem, título e resumo.
- `original_code`: transcrição com indentação e linhas preservadas.
- `corrected_code`: correção completa ou null.
- `explanation`: lista de passos em português.
- `issues`: lista de `line` (base 1), `severity` (erro/aviso/sugestao),
  `title` e `description`.

Sem código legível: HTTP 200 com status no_code. Sem problemas: issues vazio
e corrected_code null. Respostas inválidas ou falha do Gemini: HTTP 502,
sem mostrar a resposta bruta do provedor. Arquivo inválido: HTTP 400.
O frontend mantém carregamento, timeout de 90 segundos, nova tentativa e
cache por captura. Trocar Explicar/Jovi Code não faz outra chamada ao Gemini.

## Testes

Com dependências instaladas: `pip install httpx` e
`python -m unittest test_code_analysis -v`.
Os testes simulam o provedor; não consomem a API Gemini.
