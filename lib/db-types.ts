export type ProductRow = {
  id: string
  name: string
  category: string | null
  price: number
  stock: number
  low_stock_threshold: number
  barcode: string | null
  created_at: string
  updated_at: string
}

export type CustomerRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  total_spent: number
  created_at: string
  updated_at: string
}

export type SupplierRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  cnpj: string | null
  created_at: string
  updated_at: string
}

export type FinanceEntryRow = {
  id: string
  type: "entrada" | "saida"
  description: string
  category: string
  amount: number
  method: string
  date: string
  created_at: string
}

export type OrderRow = {
  id: string
  client_id: string | null
  method: string
  status: "novo" | "pendente" | "pago" | "cancelado"
  total: number
  date: string
  created_at: string
  updated_at: string
}

export type OrderItemRow = {
  id: string
  order_id: string
  product_id: string
  qty: number
  price: number
}

export type InvoiceRow = {
  id: string
  number: string
  client_id: string | null
  total: number
  status: "emitida" | "paga" | "cancelada"
  date: string
  created_at: string
  updated_at: string
}

export type FiadoReceiptRow = {
  id: string
  client_name: string
  phone: string | null
  email: string | null
  client_address: string | null
  total: number
  due_date: string | null
  method: string
  date: string
  paid: boolean
  created_at: string
  updated_at: string
}

export type FiadoItemRow = {
  id: string
  receipt_id: string
  description: string
  qty: number
  price: number
}
