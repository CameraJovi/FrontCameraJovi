const CHAVE = "jovi:grade-aulas:v1";
export const DIAS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const minutos = (hora) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(hora)
    ? Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3))
    : NaN;

export function validarAula(aula, grade = []) {
  if (!aula.materia?.trim() || aula.materia.trim().length > 80)
    return "Informe uma disciplina de até 80 caracteres.";
  if (!Number.isInteger(aula.dia) || aula.dia < 0 || aula.dia > 6)
    return "Escolha o dia da semana.";
  const inicio = minutos(aula.inicio),
    fim = minutos(aula.fim);
  if (!Number.isFinite(inicio) || !Number.isFinite(fim) || inicio >= fim)
    return "O fim deve ser depois do início. Para aulas após meia-noite, cadastre dois horários.";
  if (
    grade.some(
      (item) =>
        item.id !== aula.id &&
        item.dia === aula.dia &&
        inicio < minutos(item.fim) &&
        fim > minutos(item.inicio),
    )
  )
    return "Já existe uma aula nesse intervalo. Ajuste os horários.";
  return "";
}

export function carregarGrade() {
  try {
    const grade = JSON.parse(window.localStorage.getItem(CHAVE) || "[]");
    return Array.isArray(grade)
      ? grade.filter((a) => a && typeof a.id === "string" && !validarAula(a))
      : [];
  } catch {
    return [];
  }
}

export function salvarGrade(grade) {
  if (grade.some((a) => validarAula(a, grade)))
    throw new Error("Revise os horários da grade.");
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(grade));
  } catch {
    throw new Error("Não foi possível guardar a grade neste navegador.");
  }
}

export function encontrarAula(grade, instante) {
  const data = new Date(instante);
  if (Number.isNaN(data.getTime())) return null;
  const minuto = data.getHours() * 60 + data.getMinutes();
  const candidatas = grade.filter(
    (a) =>
      !validarAula(a) &&
      a.dia === data.getDay() &&
      minuto >= minutos(a.inicio) &&
      minuto < minutos(a.fim),
  );
  // Em caso de grade antiga ambígua, não adivinhar a matéria.
  return candidatas.length === 1 ? { ...candidatas[0] } : null;
}
