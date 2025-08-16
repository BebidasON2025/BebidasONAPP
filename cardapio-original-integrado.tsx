"use client"
import { useState, useEffect } from "react"
import supabase from "@/utils/supabaseClient" // Assuming supabaseClient is imported here
import type { Pedido } from "@/types/Pedido" // Assuming Pedido type is imported here
import { addToast } from "@/utils/toast" // Assuming addToast function is imported here

const SISTEMA_API_URL = "https://appbebidason.vercel.app"
let USAR_INTEGRACAO = true // Set to true to enable integration

function BebidasOnAppContent() {
  const [bebidas, setBebidas] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [carregando, setCarregando] = useState<boolean>(false)
  const [modoTeste, setModoTeste] = useState<boolean>(false)
  const [nomeClientePadrao, setNomeClientePadrao] = useState<string>("Cliente Padrão")
  const [tipoEntrega, setTipoEntrega] = useState<string>("retirada")
  const [enderecoEntrega, setEnderecoEntrega] = useState<string>("")
  const [localizacaoFinal, setLocalizacaoFinal] = useState<any>(null)
  const [formaPagamento, setFormaPagamento] = useState<string>("dinheiro")
  const [valorPago, setValorPago] = useState<string>("")
  const [totalComTaxa, setTotalComTaxa] = useState<number>(0)

  const carregarBebidas = async () => {
    try {
      console.log("🍻 Carregando bebidas...")

      if (USAR_INTEGRACAO) {
        // Use integration API to get products from main system
        console.log("🔗 Usando integração com sistema principal...")
        const response = await fetch(`${SISTEMA_API_URL}/api/menu/produtos`)

        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.produtos) {
          const bebidasComCategorias = data.produtos.map((produto: any) => ({
            id: produto.id,
            nome: produto.nome,
            descricao: produto.categoria || "Bebida",
            preco: produto.preco,
            categoria_id: 1, // Default category
            categoria: {
              id: 1,
              nome: produto.categoria || "Bebidas",
              icone: "beer",
              cor: "amber",
              ativo: true,
            },
            imagem: produto.imagem || "/refreshing-drink.png",
            estoque: produto.estoque,
            ativo: produto.estoque > 0,
          }))

          setBebidas(bebidasComCategorias)
          console.log(`✅ ${bebidasComCategorias.length} bebidas carregadas via integração`)
          return
        }
      }

      // Fallback to original Supabase method
      const { data: bebidasData, error: bebidasError } = await supabase
        .from("bebidas")
        .select(`
        *,
        categorias (
          id,
          nome,
          icone,
          cor,
          ativo
        )
      `)
        .eq("ativo", true)
        .order("nome")

      if (bebidasError) throw bebidasError

      const bebidasComCategorias = (bebidasData || []).map((bebida) => ({
        ...bebida,
        categoria: bebida.categorias || null,
      }))

      setBebidas(bebidasComCategorias)
      console.log(`✅ ${bebidasComCategorias.length} bebidas carregadas com sucesso`)
    } catch (error) {
      console.error("❌ Erro ao carregar bebidas:", error)
      // Try fallback method if integration fails
      if (USAR_INTEGRACAO) {
        console.log("🔄 Tentando método alternativo...")
        USAR_INTEGRACAO = false
        await carregarBebidas()
      }
    }
  }

  const finalizarPedido = async () => {
    console.log("🔄 Iniciando finalização do pedido...")

    // ... existing validation code ...

    try {
      setCarregando(true)

      // ... existing location and ID generation code ...
      const idUnico = Date.now().toString()

      const novoPedido: Pedido = {
        id: idUnico,
        data: new Date().toLocaleString("pt-BR"),
        itens: [...carrinho],
        total: totalComTaxa,
        formaPagamento,
        valorPago: formaPagamento === "dinheiro" ? Number.parseFloat(valorPago) : undefined,
        troco: formaPagamento === "dinheiro" ? calcularTroco() : undefined,
        cliente: nomeClientePadrao,
        tipoEntrega,
        enderecoEntrega: tipoEntrega === "entrega" ? enderecoEntrega : undefined,
        localizacao: localizacaoFinal || undefined,
        status: "enviado",
      }

      console.log("📋 Dados do pedido:", novoPedido)

      if (!modoTeste) {
        if (USAR_INTEGRACAO) {
          console.log("🔗 Enviando pedido para sistema principal...")

          const orderData = {
            id: novoPedido.id,
            cliente: novoPedido.cliente,
            total: novoPedido.total,
            forma_pagamento: novoPedido.formaPagamento,
            tipo_entrega: novoPedido.tipoEntrega,
            endereco_entrega: novoPedido.enderecoEntrega,
            localizacao: novoPedido.localizacao,
            valor_pago: novoPedido.valorPago,
            troco: novoPedido.troco,
            status: novoPedido.status,
            itens: novoPedido.itens.map((item) => ({
              produto_id: item.bebida.id,
              produto_nome: item.bebida.nome,
              quantidade: item.quantidade,
              preco_unitario: item.bebida.preco,
              subtotal: item.bebida.preco * item.quantidade,
            })),
          }

          const response = await fetch(`${SISTEMA_API_URL}/api/menu/pedidos`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
          })

          if (!response.ok) {
            throw new Error(`Erro ao enviar pedido: ${response.status}`)
          }

          const result = await response.json()

          if (!result.success) {
            throw new Error(result.error || "Erro desconhecido ao enviar pedido")
          }

          console.log("✅ Pedido enviado para sistema principal:", result)
        }

        // Also save to local Supabase for backup/local tracking
        const dadosParaInserir: any = {
          id: novoPedido.id,
          cliente: novoPedido.cliente,
          total: novoPedido.total,
          forma_pagamento: novoPedido.formaPagamento,
          itens: novoPedido.itens,
          tipo_entrega: novoPedido.tipoEntrega,
          status: novoPedido.status,
        }

        // ... existing code for local Supabase save ...

        if (!USAR_INTEGRACAO) {
          // Update stock only if not using integration
          console.log("📦 Atualizando estoque...")
          for (const item of carrinho) {
            const novoEstoque = Math.max(0, item.bebida.estoque - item.quantidade)
            const { error: estoqueError } = await supabase
              .from("bebidas")
              .update({ estoque: novoEstoque })
              .eq("id", item.bebida.id)

            if (estoqueError) {
              console.error("❌ Erro ao atualizar estoque:", estoqueError)
            }
          }
        }

        await carregarBebidas() // Reload products to get updated stock
      }

      // ... existing code for order completion ...
    } catch (error) {
      console.error("❌ Erro ao finalizar pedido:", error)
      addToast({
        type: "error",
        title: "Erro ao finalizar pedido",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      })
    } finally {
      setCarregando(false)
    }
  }

  const calcularTroco = () => {
    // Assuming this function is defined elsewhere
    return Number.parseFloat(valorPago) - totalComTaxa
  }

  useEffect(() => {
    carregarBebidas()
  }, [])
}
