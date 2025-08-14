import type { Product, Customer, Supplier, FinanceEntry, Order, Invoice } from "./store"
import type {
  ProdutoRow,
  ClienteRow,
  FornecedorRow,
  LancamentoFinanceiroRow,
  PedidoRow,
  NotaFiscalRow,
} from "./db-types-ptbr"

export function mapProdutoRowToStore(p: ProdutoRow): Product {
  return {
    id: p.id,
    name: p.nome,
    category: p.categoria ?? undefined,
    price: Number(p.preco || 0),
    stock: p.estoque,
    lowStockThreshold: p.alerta_estoque,
    barcode: p.codigo_barras ?? undefined,
    brand: null,
    unit: "UN",
    costPrice: null,
    sku: null,
    expiresAt: null,
    notes: null,
  }
}

export function mapClienteRowToStore(c: ClienteRow): Customer {
  return {
    id: c.id,
    name: c.nome,
    email: c.email ?? undefined,
    phone: c.telefone ?? undefined,
    totalSpent: Number(c.total_gasto || 0),
    document: null,
    address: null,
    birthday: null,
    notes: null,
  }
}

export function mapFornecedorRowToStore(f: FornecedorRow): Supplier {
  return {
    id: f.id,
    name: f.nome,
    email: f.email ?? undefined,
    phone: f.telefone ?? undefined,
    cnpj: f.cnpj ?? undefined,
    address: null,
    contact: null,
    notes: null,
  }
}

export function mapLancamentoRowToStore(l: LancamentoFinanceiroRow): FinanceEntry {
  return {
    id: l.id,
    type: l.tipo,
    description: l.descricao,
    category: l.categoria,
    amount: Number(l.valor || 0),
    method: l.metodo,
    date: l.data,
    reference: null,
    notes: null,
  }
}

export function mapPedidoRowToStore(p: PedidoRow): Order {
  return {
    id: p.id,
    clientId: p.cliente_id || "",
    items: [],
    total: Number(p.total || 0),
    method: p.metodo,
    status: p.status,
    date: p.data,
    discount: null,
    deliveryFee: null,
    notes: null,
    deliveryAddress: null,
  }
}

export function mapNotaRowToStore(n: NotaFiscalRow): Invoice {
  return {
    id: n.id,
    number: n.numero,
    clientId: n.cliente_id || "",
    total: Number(n.total || 0),
    status: n.status,
    date: n.data,
    dueDate: null,
    notes: null,
  }
}
