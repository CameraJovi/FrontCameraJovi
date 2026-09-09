export const analiseCodigoMock = {
  linguagem: "JavaScript",
  titulo: "Cálculo de média das notas",
  resumo:
    "O código soma as notas de uma lista, calcula a média da turma e exibe o resultado no console.",
  complexidade: "Baixa",
  totalLinhas: 8,
  entrada: "Uma lista numérica de notas: [8, 7, 9]",
  saida: "A média 8 é exibida no console.",
  conceitos: ["Array", "Função", "reduce", "Callback", "Escopo"],
  codigoOriginal: `const notas = [8, 7, 9];

function calcularMedia() {
  const total = notas.reduce((soma, nota) => soma + nota, 0);
  return total / nota.length;
}

console.log(calcularMedia());`,
  codigoCorrigido: `const notas = [8, 7, 9];

function calcularMedia(valores) {
  if (!valores.length) return 0;
  const total = valores.reduce((soma, nota) => soma + nota, 0);
  return total / valores.length;
}

console.log("Média:", calcularMedia(notas));`,
  problemas: [
    {
      linha: 5,
      severidade: "erro",
      titulo: "Variável fora do escopo",
      descricao:
        "“nota” só existe dentro da função do reduce. Para obter a quantidade de itens, use “notas.length”.",
    },
    {
      linha: 3,
      severidade: "aviso",
      titulo: "Função dependente de dado externo",
      descricao:
        "A função usa a variável global “notas”. Receber a lista como parâmetro facilita o reaproveitamento e os testes.",
    },
    {
      linha: 8,
      severidade: "sugestao",
      titulo: "Saída pouco descritiva",
      descricao:
        "O console exibe apenas o número. Um rótulo como “Média:” deixa o resultado mais fácil de compreender.",
    },
  ],
  explicacao: [
    "A lista notas guarda as três notas que serão usadas no cálculo.",
    "O reduce percorre a lista e acumula cada nota na variável total.",
    "A função divide o total pela quantidade de notas e devolve a média.",
    "O console.log mostra o valor retornado por calcularMedia.",
  ],
  alteracoes: [
    "A lista passou a ser recebida pelo parâmetro “valores”.",
    "Foi adicionada uma proteção para listas vazias.",
    "“nota.length” foi substituído por “valores.length”.",
    "A saída agora identifica o resultado com o rótulo “Média:”.",
  ],
  comparacoes: [
    { antes: "function calcularMedia() {", depois: "function calcularMedia(valores) {", motivo: "Receber a lista como parâmetro permite reutilizar a função." },
    { antes: "", depois: "  if (!valores.length) return 0;", motivo: "A proteção define o retorno para uma lista vazia." },
    { antes: "  const total = notas.reduce((soma, nota) => soma + nota, 0);", depois: "  const total = valores.reduce((soma, nota) => soma + nota, 0);", motivo: "A soma passa a usar a lista recebida." },
    { antes: "  return total / nota.length;", depois: "  return total / valores.length;", motivo: "Corrige a referência fora do escopo e usa a quantidade de notas." },
    { antes: "console.log(calcularMedia());", depois: 'console.log("Média:", calcularMedia(notas));', motivo: "Envia a lista para a função e identifica o resultado." },
  ],
  impactoCorrecao:
    "A função passa a acessar a lista que realmente existe no escopo e consegue calcular a média sem gerar ReferenceError.",
};

export const analiseSemErrosMock = {
  ...analiseCodigoMock,
  codigoOriginal: analiseCodigoMock.codigoCorrigido,
  codigoCorrigido: null,
  problemas: [],
  alteracoes: [],
  comparacoes: [],
  impactoCorrecao: "",
  explicacao: [
    "A lista notas contém os valores 8, 7 e 9.",
    "A função recebe a lista como parâmetro e retorna 0 se ela estiver vazia.",
    "O reduce soma os valores; o total é dividido pela quantidade de itens.",
    "O console apresenta o rótulo Média: seguido do valor 8.",
  ],
};
