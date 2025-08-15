"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type Product = {
  id: string
  name: string
  category?: string
  brand?: string | null
  unit?: string | null // UN, CX, L, mL...
  price: number
  costPrice?: number | null
  stock: number
  lowStockThreshold: number
  barcode?: string
  sku?: string | null
  expiresAt?: string | null
  notes?: string | null
}
export type Customer = {
  id: string
  name: string
  email?: string
  phone?: string
  totalSpent?: number
  document?: string | null // CPF/CNPJ
  address?: string | null
  birthday?: string | null
  notes?: string | null
}
export type Supplier = {
  id: string
  name: string
  email?: string
  phone?: string
  cnpj?: string
  address?: string | null
  contact?: string | null
  notes?: string | null
}
export type FinanceEntry = {
  id: string
  type: "entrada" | "saida"
  description: string
  category: string
  amount: number
  method: string
  date: string
  reference?: string | null
  notes?: string | null
}
export type OrderItem = { productId: string; qty: number; price: number }
export type Order = {
  id: string
  clientId: string
  items: OrderItem[]
  total: number
  method: string
  status: "novo" | "pendente" | "pago" | "cancelado"
  date: string
  discount?: number | null
  deliveryFee?: number | null
  notes?: string | null
  deliveryAddress?: string | null
  clientName?: string
  customerPhone?: string
}
export type Invoice = {
  id: string
  number: string
  clientId: string
  total: number
  status: "emitida" | "paga" | "cancelada"
  date: string
  dueDate?: string | null
  notes?: string | null
}
export type FiadoReceipt = {
  id: string
  clientName: string
  phone?: string
  email?: string
  clientAddress?: string
  items: { description: string; qty: number; price: number }[]
  total: number
  dueDate?: string
  method: string
  date: string
  paid?: boolean
}

type Store = {
  products: Product[]
  customers: Customer[]
  suppliers: Supplier[]
  finance: { entries: FinanceEntry[]; totalSales?: number }
  orders: Order[]
  invoices: Invoice[]
  fiado: { receipts: FiadoReceipt[] }

  addProduct: (p: Omit<Product, "id">) => void
  updateProduct: (id: string, patch: Partial<Omit<Product, "id">>) => void
  removeProduct: (id: string) => void

  addCustomer: (c: Omit<Customer, "id">) => void
  removeCustomer: (id: string) => void
  updateCustomer: (id: string, patch: Partial<Omit<Customer, "id">>) => void

  addSupplier: (s: Omit<Supplier, "id">) => void
  removeSupplier: (id: string) => void

  addFinanceEntry: (e: Omit<FinanceEntry, "id" | "date">) => void
  removeFinanceEntry: (id: string) => void

  addOrder: (
    o: Omit<Order, "id" | "total" | "date"> & { discount?: number | null; deliveryFee?: number | null },
  ) => void
  updateOrderStatus: (id: string, status: Order["status"]) => void
  removeOrder: (id: string) => void

  addInvoice: (n: Omit<Invoice, "id" | "date">) => void
  removeInvoice: (id: string) => void
  updateInvoiceStatus: (id: string, status: Invoice["status"]) => void

  addFiadoReceipt: (r: Omit<FiadoReceipt, "id" | "date" | "paid">) => void
  markFiadoPaid: (id: string) => void
  removeFiado: (id: string) => void

  seedDemo: () => void
  clearAll: () => void
  loadRealData: () => Promise<void>

  setProducts: (rows: any[]) => void
  setCustomers: (rows: Customer[]) => void
  setSuppliers: (rows: Supplier[]) => void
  setFinanceEntries: (rows: FinanceEntry[]) => void
  setOrders: (rows: Order[]) => void
  setInvoices: (rows: Invoice[]) => void
  setFiadoReceipts: (rows: FiadoReceipt[]) => void
}

function uid(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

// Helper function to safely parse JSON
function parseSafe(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// Helper function to map database products to store format
function mapProdutoRowToStore(row: any): any {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    codigo_barras: row.codigo_barras,
    preco: row.preco,
    preco_compra: row.preco_compra,
    estoque: row.estoque,
    alerta_estoque: row.alerta_estoque,
    imagem: row.imagem,
  }
}

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      products: [],
      customers: [],
      suppliers: [],
      finance: { entries: [] },
      orders: [],
      invoices: [],
      fiado: { receipts: [] },

      setProducts: (rows) => set(() => ({ products: rows.map(mapProdutoRowToStore) })),
      setCustomers: (rows) => set(() => ({ customers: rows })),
      setSuppliers: (rows) => set(() => ({ suppliers: rows })),
      setFinanceEntries: (rows) => set(() => ({ finance: { entries: rows } })),
      setOrders: (rows) => set(() => ({ orders: rows })),
      setInvoices: (rows) => set(() => ({ invoices: rows })),
      setFiadoReceipts: (rows) => set(() => ({ fiado: { receipts: rows } })),

      addProduct: (p) => set((s) => ({ products: [{ id: uid("prd_"), ...p }, ...s.products] })),
      updateProduct: (id, patch) =>
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removeProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      addCustomer: (c) => set((s) => ({ customers: [{ id: uid("cus_"), totalSpent: 0, ...c }, ...s.customers] })),
      removeCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),
      updateCustomer: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      addSupplier: (sup) => set((s) => ({ suppliers: [{ id: uid("sup_"), ...sup }, ...s.suppliers] })),
      removeSupplier: (id) => set((s) => ({ suppliers: s.suppliers.filter((c) => c.id !== id) })),

      addFinanceEntry: (e) =>
        set((s) => ({
          finance: { entries: [{ id: uid("fin_"), date: new Date().toISOString(), ...e }, ...s.finance.entries] },
        })),
      removeFinanceEntry: (id) => set((s) => ({ finance: { entries: s.finance.entries.filter((e) => e.id !== id) } })),

      addOrder: (o) =>
        set((s) => {
          const itemsTotal = o.items.reduce((sum, i) => sum + i.price * i.qty, 0)
          const discount = o.discount ?? 0
          const delivery = o.deliveryFee ?? 0
          const total = Math.max(0, itemsTotal - discount + delivery)
          const order: Order = { id: uid("ord_"), date: new Date().toISOString(), total, ...o }
          const entries =
            o.status === "pago"
              ? [
                  {
                    id: uid("fin_"),
                    type: "entrada" as const,
                    description: `Pedido ${order.id}`,
                    category: "Vendas",
                    amount: total,
                    method: o.method,
                    date: new Date().toISOString(),
                  },
                  ...s.finance.entries,
                ]
              : s.finance.entries
          return { orders: [order, ...s.orders], finance: { entries } }
        }),
      updateOrderStatus: (id, status) =>
        set((s) => {
          const prev = s.orders.find((o) => o.id === id)
          if (!prev) return {}
          const nextOrder = { ...prev, status }
          let entries = s.finance.entries
          if (status === "pago" && prev.status !== "pago") {
            entries = [
              {
                id: uid("fin_"),
                type: "entrada",
                description: `Pedido ${prev.id}`,
                category: "Vendas",
                amount: prev.total,
                method: prev.method,
                date: new Date().toISOString(),
              },
              ...entries,
            ]
          }
          return { orders: s.orders.map((o) => (o.id === id ? nextOrder : o)), finance: { entries } }
        }),
      removeOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),

      addInvoice: (n) =>
        set((s) => ({ invoices: [{ id: uid("inv_"), date: new Date().toISOString(), ...n }, ...s.invoices] })),
      removeInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) })),
      updateInvoiceStatus: (id, status) =>
        set((s) => ({
          invoices: s.invoices.map((i) => (i.id === id ? { ...i, status } : i)),
          finance:
            status === "paga"
              ? {
                  entries: [
                    {
                      id: uid("fin_"),
                      type: "entrada",
                      description: `Nota ${id}`,
                      category: "Vendas",
                      amount: s.invoices.find((i) => i.id === id)?.total ?? 0,
                      method: "Cartão",
                      date: new Date().toISOString(),
                    },
                    ...s.finance.entries,
                  ],
                }
              : s.finance,
        })),

      addFiadoReceipt: (r) =>
        set((s) => ({
          fiado: {
            receipts: [{ id: uid("fia_"), date: new Date().toISOString(), paid: false, ...r }, ...s.fiado.receipts],
          },
        })),
      markFiadoPaid: (id) =>
        set((s) => ({
          fiado: { receipts: s.fiado.receipts.map((r) => (r.id === id ? { ...r, paid: true } : r)) },
          finance: {
            entries: [
              {
                id: uid("fin_"),
                type: "entrada",
                description: `Fiado ${id} pago`,
                category: "Vendas",
                amount: s.fiado.receipts.find((r) => r.id === id)?.total ?? 0,
                method: "Fiado",
                date: new Date().toISOString(),
              },
              ...s.finance.entries,
            ],
          },
        })),
      removeFiado: (id) => set((s) => ({ fiado: { receipts: s.fiado.receipts.filter((r) => r.id !== id) } })),

      seedDemo: () => {
        const now = new Date()
        const iso = (d: Date) => d.toISOString()

        const products: Product[] = [
          {
            id: uid("prd_"),
            name: "Antártica lata 350 ml",
            category: "Cervejas",
            brand: "Ambev",
            unit: "UN",
            price: 4.9,
            costPrice: 3.4,
            stock: 0,
            lowStockThreshold: 2,
            sku: "ANT350",
          },
          {
            id: uid("prd_"),
            name: "Skol lata 350 ml",
            category: "Cervejas",
            brand: "Ambev",
            unit: "UN",
            price: 4.7,
            costPrice: 3.3,
            stock: 0,
            lowStockThreshold: 2,
            sku: "SKL350",
          },
          {
            id: uid("prd_"),
            name: "Coca-Cola 2L",
            category: "Refrigerantes",
            brand: "Coca-Cola",
            unit: "UN",
            price: 12.9,
            costPrice: 9.5,
            stock: 1,
            lowStockThreshold: 3,
            sku: "COCA2L",
          },
          {
            id: uid("prd_"),
            name: "Guaraná 2L",
            category: "Refrigerantes",
            brand: "Antártica",
            unit: "UN",
            price: 10.9,
            costPrice: 7.9,
            stock: 1,
            lowStockThreshold: 3,
          },
          {
            id: uid("prd_"),
            name: "Heineken 600 ml",
            category: "Cervejas",
            brand: "Heineken",
            unit: "UN",
            price: 12.5,
            costPrice: 9.5,
            stock: 2,
            lowStockThreshold: 3,
          },
          {
            id: uid("prd_"),
            name: "Gelo 2kg",
            category: "Outros",
            unit: "UN",
            price: 8,
            stock: 1,
            lowStockThreshold: 2,
          },
          {
            id: uid("prd_"),
            name: "Água 500 ml",
            category: "Água",
            unit: "UN",
            price: 2.5,
            stock: 1,
            lowStockThreshold: 2,
          },
          {
            id: uid("prd_"),
            name: "Energético 473 ml",
            category: "Energéticos",
            unit: "UN",
            price: 9.9,
            costPrice: 7.2,
            stock: 2,
            lowStockThreshold: 3,
          },
        ]

        const customers: Customer[] = [
          {
            id: uid("cus_"),
            name: "João Silva",
            email: "joao@email.com",
            phone: "(11) 99999-0001",
            totalSpent: 124.4,
            document: "123.456.789-00",
          },
          {
            id: uid("cus_"),
            name: "Maria Souza",
            email: "maria@email.com",
            phone: "(11) 98888-0002",
            totalSpent: 232.1,
            document: "987.654.321-00",
          },
        ]

        const finance: { entries: FinanceEntry[] } = {
          entries: [
            {
              id: uid("fin_"),
              type: "entrada",
              description: "Venda de Coca-Cola 2L",
              category: "Vendas",
              amount: 45.9,
              method: "Dinheiro",
              date: iso(now),
            },
            {
              id: uid("fin_"),
              type: "saida",
              description: "Compra de estoque",
              category: "Compras",
              amount: 250,
              method: "PIX",
              date: iso(new Date(now.getTime() - 86400000)),
            },
            {
              id: uid("fin_"),
              type: "entrada",
              description: "Venda fiado - João Silva",
              category: "Vendas",
              amount: 78.5,
              method: "Fiado",
              date: iso(new Date(now.getTime() - 2 * 86400000)),
            },
          ],
        }

        const orders: Order[] = [
          {
            id: uid("ord_"),
            clientId: customers[0].id,
            items: [{ productId: products[2].id, qty: 2, price: 12.9 }],
            total: 25.8,
            method: "Dinheiro",
            status: "pago",
            date: iso(now),
            deliveryFee: 0,
            discount: 0,
          },
          {
            id: uid("ord_"),
            clientId: customers[1].id,
            items: [{ productId: products[4].id, qty: 2, price: 12.5 }],
            total: 25,
            method: "PIX",
            status: "pendente",
            date: iso(new Date(now.getTime() - 3600_000)),
          },
        ]

        const invoices: Invoice[] = [
          {
            id: uid("inv_"),
            number: "NF-0001",
            clientId: customers[0].id,
            total: 89.4,
            status: "emitida",
            date: iso(now),
          },
        ]

        const fiado: { receipts: FiadoReceipt[] } = {
          receipts: [
            {
              id: uid("fia_"),
              clientName: "João Silva",
              phone: "(11) 99999-0001",
              items: [
                { description: "Cerveja 600 ml", qty: 2, price: 12.5 },
                { description: "Energético 473 ml", qty: 1, price: 9.9 },
              ],
              total: 34.9,
              method: "Fiado",
              date: iso(new Date(now.getTime() - 2 * 86400000)),
              paid: false,
            },
          ],
        }

        set(() => ({ products, customers, finance, orders, invoices, fiado, suppliers: [] }))
      },

      clearAll: () =>
        set(() => ({
          products: [],
          customers: [],
          suppliers: [],
          finance: { entries: [] },
          orders: [],
          invoices: [],
          fiado: { receipts: [] },
        })),

      loadRealData: async () => {
        try {
          // Load products with proper error handling
          try {
            const produtosRes = await fetch("/api/produtos", { cache: "no-store" })
            const produtosText = await produtosRes.text()
            const produtosJson = parseSafe(produtosText)

            if (produtosRes.ok && produtosJson?.ok && Array.isArray(produtosJson.data)) {
              const mappedProducts = produtosJson.data.map(mapProdutoRowToStore)
              set((s) => ({ ...s, products: mappedProducts }))
            }
          } catch (error) {
            console.error("Error loading products:", error)
          }

          // Load customers first (needed for order mapping)
          const customersMap: Record<string, any> = {}
          try {
            const clientesRes = await fetch("/api/clientes", { cache: "no-store" })
            const clientesText = await clientesRes.text()
            const clientesJson = parseSafe(clientesText)

            if (clientesRes.ok && clientesJson?.ok && Array.isArray(clientesJson.data)) {
              const customers = clientesJson.data
              set((s) => ({ ...s, customers }))

              for (const customer of customers) {
                customersMap[customer.id] = customer
              }
            }
          } catch (error) {
            console.error("Error loading customers:", error)
          }

          // Load orders with proper client name mapping
          try {
            const pedidosRes = await fetch("/api/pedidos", { cache: "no-store" })
            const pedidosText = await pedidosRes.text()
            const pedidosJson = parseSafe(pedidosText)

            if (pedidosRes.ok && pedidosJson?.ok && Array.isArray(pedidosJson.data)) {
              const orders = pedidosJson.data.map((order: any) => {
                const customer = order.cliente_id ? customersMap[order.cliente_id] : null
                return {
                  ...order,
                  clientName: order.cliente_nome_texto || customer?.nome || customer?.name || null,
                  customerPhone: customer?.telefone || customer?.phone || null,
                }
              })

              // Calculate total sales from paid orders
              const totalSales = orders
                .filter((o: any) => (o.status || "").toLowerCase() === "pago")
                .reduce((sum: number, o: any) => sum + Number(o.total ?? 0), 0)

              set((s) => ({
                ...s,
                orders: orders,
                finance: { ...s.finance, totalSales },
              }))
            }
          } catch (error) {
            console.error("Error loading orders:", error)
          }

          // Load finance entries
          try {
            const financeRes = await fetch("/api/financeiro", { cache: "no-store" })
            const financeText = await financeRes.text()
            const financeJson = parseSafe(financeText)

            if (financeRes.ok && financeJson?.ok && Array.isArray(financeJson.data)) {
              set((s) => ({
                ...s,
                finance: {
                  ...s.finance,
                  entries: financeJson.data,
                },
              }))
            }
          } catch (error) {
            console.error("Error loading finance:", error)
          }

          // Load suppliers
          try {
            const fornecedoresRes = await fetch("/api/fornecedores", { cache: "no-store" })
            const fornecedoresText = await fornecedoresRes.text()
            const fornecedoresJson = parseSafe(fornecedoresText)

            if (fornecedoresRes.ok && fornecedoresJson?.ok && Array.isArray(fornecedoresJson.data)) {
              set((s) => ({ ...s, suppliers: fornecedoresJson.data }))
            }
          } catch (error) {
            console.error("Error loading suppliers:", error)
          }

          // Load fiado receipts
          try {
            const fiadoRes = await fetch("/api/fiado", { cache: "no-store" })
            const fiadoText = await fiadoRes.text()
            const fiadoJson = parseSafe(fiadoText)

            if (fiadoRes.ok && fiadoJson?.ok && Array.isArray(fiadoJson.data)) {
              set((s) => ({ ...s, fiado: { receipts: fiadoJson.data } }))
            }
          } catch (error) {
            console.error("Error loading fiado:", error)
          }
        } catch (error) {
          console.error("Error in loadRealData:", error)
        }
      },
    }),
    {
      name: "bebidas-on-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential data, not large arrays that can be reloaded
        products: state.products.slice(0, 50), // Limit to 50 most recent products
        customers: state.customers.slice(0, 100), // Limit to 100 most recent customers
        suppliers: state.suppliers.slice(0, 50), // Limit suppliers
        finance: {
          entries: state.finance.entries.slice(0, 100), // Only last 100 finance entries
          totalSales: state.finance.totalSales,
        },
        orders: state.orders.slice(0, 50), // Only last 50 orders
        invoices: state.invoices.slice(0, 50), // Only last 50 invoices
        fiado: {
          receipts: state.fiado.receipts.slice(0, 50), // Only last 50 fiado receipts
        },
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate store:", error)
          // Clear localStorage if it's corrupted or too large
          try {
            localStorage.removeItem("bebidas-on-store")
            console.log("Cleared corrupted localStorage data")
          } catch (e) {
            console.error("Failed to clear localStorage:", e)
          }
        }
      },
    },
  ),
)
