export const CATEGORIAS = [
  { valor: 'BIQUINI',   rotulo: 'Biquíni' },
  { valor: 'CAMISA',    rotulo: 'Camisa' },
  { valor: 'CAMISETA',  rotulo: 'Camiseta' },
  { valor: 'CALCA',     rotulo: 'Calça' },
  { valor: 'CALCINHA',  rotulo: 'Calcinha' },
  { valor: 'CUECA',     rotulo: 'Cueca' },
  { valor: 'MOLETOM',   rotulo: 'Moletom' },
  { valor: 'SHORT',     rotulo: 'Short' },
] as const;

export const TAMANHOS = [
  { valor: 'PP', rotulo: 'PP' },
  { valor: 'P',  rotulo: 'P' },
  { valor: 'M',  rotulo: 'M' },
  { valor: 'G',  rotulo: 'G' },
  { valor: 'GG', rotulo: 'GG' },
  { valor: 'XG', rotulo: 'XG' },
] as const;

export const FORMAS_PAGAMENTO = [
  { valor: 'CARTAO_CREDITO', rotulo: 'Cartão de Crédito' },
  { valor: 'PIX',            rotulo: 'PIX' },
] as const;

export const STATUS_VENDA = [
  { valor: 'ABERTA',     rotulo: 'Aberta' },
  { valor: 'FINALIZADA', rotulo: 'Finalizada' },
] as const;

export type Categoria       = typeof CATEGORIAS[number]['valor'];
export type Tamanho         = typeof TAMANHOS[number]['valor'];
export type FormaPagamento  = typeof FORMAS_PAGAMENTO[number]['valor'];
export type StatusVenda     = typeof STATUS_VENDA[number]['valor'];
