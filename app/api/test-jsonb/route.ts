import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db-helpers"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    console.log("[v0] Testing JSONB storage and retrieval...")

    // Test 1: Create a test order with items
    const testItems = [
      {
        produto_id: "test-product-1",
        nome: "Produto Teste 1",
        qtd: 2,
        preco: 10.5,
        subtotal: 21.0,
      },
      {
        produto_id: "test-product-2",
        nome: "Produto Teste 2",
        qtd: 1,
        preco: 15.0,
        subtotal: 15.0,
      },
    ]

    console.log("[v0] Test items to store:", JSON.stringify(testItems))

    const testOrder = {
      numero_pedido: `TEST${Date.now()}`,
      cliente_nome_texto: "Cliente Teste",
      metodo: "Dinheiro",
      status: "pago",
      total: 36.0,
      data: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      itens: testItems, // Store as JSONB
      origem: "teste",
    }

    console.log("[v0] Creating test order with JSONB items...")
    const createResult = await supabase.from("pedidos").insert([testOrder]).select("id, numero_pedido, itens").single()

    if (createResult.error) {
      console.error("[v0] Error creating test order:", createResult.error)
      return NextResponse.json({
        ok: false,
        error: createResult.error.message,
        step: "create",
      })
    }

    const orderId = createResult.data.id
    console.log("[v0] Test order created:", {
      id: orderId,
      numero: createResult.data.numero_pedido,
      storedItems: createResult.data.itens,
    })

    // Test 2: Retrieve the order and check items
    console.log("[v0] Retrieving test order...")
    const retrieveResult = await supabase.from("pedidos").select("id, numero_pedido, itens").eq("id", orderId).single()

    if (retrieveResult.error) {
      console.error("[v0] Error retrieving test order:", retrieveResult.error)
      return NextResponse.json({
        ok: false,
        error: retrieveResult.error.message,
        step: "retrieve",
      })
    }

    console.log("[v0] Retrieved test order:", {
      id: retrieveResult.data.id,
      numero: retrieveResult.data.numero_pedido,
      retrievedItems: retrieveResult.data.itens,
      itemsType: typeof retrieveResult.data.itens,
      itemsIsArray: Array.isArray(retrieveResult.data.itens),
    })

    // Test 3: Clean up test order
    await supabase.from("pedidos").delete().eq("id", orderId)
    console.log("[v0] Test order cleaned up")

    return NextResponse.json({
      ok: true,
      test: "JSONB storage test completed",
      results: {
        created: createResult.data,
        retrieved: retrieveResult.data,
        itemsMatch: JSON.stringify(testItems) === JSON.stringify(retrieveResult.data.itens),
      },
    })
  } catch (error) {
    console.error("[v0] JSONB test error:", error)
    return NextResponse.json({
      ok: false,
      error: String(error),
      step: "general",
    })
  }
}
