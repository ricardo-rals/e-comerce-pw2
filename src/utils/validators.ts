export function validarTelefone(telefone: string): boolean {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  return true;
}

export function validarCPF(cpf: string): boolean {
  const digitos = cpf.replace(/[\s.\-]/g, "");

  if (digitos.length !== 11) return false;

  if (/^(\d)\1{10}$/.test(digitos)) return false;

  const calcDigito = (base: string, pesoInicial: number): number => {
    const soma = base
      .split("")
      .reduce((acc, d, i) => acc + Number(d) * (pesoInicial - i), 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calcDigito(digitos.slice(0, 9), 10);
  if (d1 !== Number(digitos[9])) return false;

  const d2 = calcDigito(digitos.slice(0, 10), 11);
  return d2 === Number(digitos[10]);
}
