export type ProdutoRow = {
  id: string
  nome: string
  categoria: string | null
  preco: number
  estoque: number
  alerta_estoque: number
  codigo_barras: string | null
  criado_em: string
  atualizado_em: string
}

export type ClienteRow = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  total_gasto: number
  criado_em: string
  atualizado_em: string
}

export type FornecedorRow = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  cnpj: string | null
  criado_em: string
  atualizado_em: string
}

export type LancamentoFinanceiroRow = {
  id: string
  tipo: "entrada" | "saida"
  descricao: string
  categoria: string
  valor: number
  metodo: string
  data: string
  criado_em: string
}

export type PedidoRow = {
  id: string
  cliente_id: string | null
  metodo: string
  status: "novo" | "pendente" | "pago" | "cancelado"
  total: number
  data: string
  criado_em: string
  atualizado_em: string
}

export type ItemPedidoRow = {
  id: string
  pedido_id: string
  produto_id: string
  qtd: number
  preco: number
}

export type NotaFiscalRow = {
  id: string
  numero: string
  cliente_id: string | null
  total: number
  status: "emitida" | "paga" | "cancelada"
  data: string
  criado_em: string
  atualizado_em: string
}
