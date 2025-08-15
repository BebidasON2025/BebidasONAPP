"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/toast"

// 🗄️ CONFIGURAÇÃO DO SUPABASE
const supabaseUrl = "https://qcaoaciohcqcwulsrtzu.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYW9hY2lvaGNxY3d1bHNydHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjU1MTgsImV4cCI6MjA3MDM0MTUxOH0.WV10l7nJMDsr84otsWCsRDGDjjrm5TX5a8yRLg2gpgk"

const supabase = createClient(supabaseUrl, supabaseKey)

const DELIVERY_SYSTEM_URL = "https://appbebidason.vercel.app/"

const syncOrderWithDeliverySystem = async (orderData: any) => {
  try {
    console.log("🔄 Sincronizando pedido com sistema de delivery...")

    const response = await fetch(`${DELIVERY_SYSTEM_URL}/api/cardapio/sync-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_nome: orderData.cliente || "Cliente",
        telefone: orderData.telefone || "",
        endereco: orderData.endereco || "",
        metodo_pagamento: orderData.formaPagamento || "pix",
        tipo_entrega: orderData.tipoEntrega || "retirada",
        items: orderData.items.map((item: any) => ({
          produto_nome: item.bebida.nome,
          quantidade: item.quantidade,
          preco_unitario: item.bebida.preco,
          categoria: item.bebida.categoria || "Bebidas",
        })),
        total: orderData.total,
        observacoes: `Pedido do cardápio - ${orderData.tipoEntrega === "entrega" ? "Entrega" : "Retirada"}`,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log("✅ Pedido sincronizado com sucesso!", result)
      return { success: true, data: result }
    } else {
      console.error("❌ Erro na sincronização:", response.status)
      return { success: false, error: "Erro na sincronização" }
    }
  } catch (error) {
    console.error("❌ Erro na sincronização com sistema de delivery:", error)
    return { success: false, error: error }
  }
}

// 📱 TELEFONE
const CHAVE_PIX = "1799631-1727"
const NOME_PIX = "Nattieli De Carvalho"
const BANCO_PIX = "Banco Santander (Brasil) S.A."
const TELEFONE_WHATSAPP = "17996311727"
const TELEFONE_DISPLAY = "(17) 99631-1727"

const CardapioIntegrado: React.FC = () => {
  const [lojaAberta, setLojaAberta] = useState(true)
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [totalCarrinho, setTotalCarrinho] = useState(0)
  const [tipoEntrega, setTipoEntrega] = useState("retirada")
  const [enderecoEntrega, setEnderecoEntrega] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("pix")
  const [valorPago, setValorPago] = useState("")
  const [modoTeste, setModoTeste] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [pedidoAtual, setPedidoAtual] = useState<any | null>(null)
  const [pedidos, setPedidos] = useState<any[]>([])
  const { addToast } = useToast()

  const obterLocalizacaoAtual = async () => {
    // Implementação da função para obter localização atual
    return "Localização atual"
  }

  const finalizarPedido = async () => {
    console.log("🔄 Iniciando finalização do pedido...")

    // Verificar se a loja está aberta
    if (!lojaAberta) {
      addToast({
        type: "error",
        title: "🏪 Loja Fechada!",
        description: "Desculpe, não estamos aceitando pedidos no momento.",
      })
      return
    }

    // Validações
    if (carrinho.length === 0) {
      addToast({
        type: "error",
        title: "Carrinho vazio!",
        description: "Adicione alguns itens antes de finalizar o pedido.",
      })
      return
    }

    const nomeClientePadrao = "Cliente"
    const TAXA_ENTREGA = 10 // Exemplo de taxa de entrega

    const totalComTaxa = totalCarrinho + (tipoEntrega === "entrega" ? TAXA_ENTREGA : 0)
    if (formaPagamento === "dinheiro" && (!valorPago || Number.parseFloat(valorPago) < totalComTaxa)) {
      addToast({
        type: "error",
        title: "Valor pago insuficiente!",
        description: "O valor pago deve ser maior ou igual ao total do pedido.",
      })
      return
    }

    try {
      setCarregando(true)

      // Obter localização APENAS se for entrega E tiver endereço preenchido
      let localizacaoFinal = ""
      if (tipoEntrega === "entrega" && enderecoEntrega.trim()) {
        try {
          localizacaoFinal = await obterLocalizacaoAtual()
          addToast({
            type: "info",
            title: "📍 Localização capturada!",
            description: "Sua localização será enviada junto com o pedido",
          })
        } catch (error) {
          console.error("❌ Erro ao obter localização:", error)
        }
      }

      // Criar objeto do pedido
      const novoPedido: any = {
        id: Date.now(),
        cliente: "nomeCliente" || nomeClientePadrao,
        itens: carrinho,
        total: totalComTaxa,
        data: new Date().toLocaleString("pt-BR"),
        status: "pendente",
        formaPagamento,
        valorPago: formaPagamento === "dinheiro" ? Number.parseFloat(valorPago) : totalComTaxa,
        troco: formaPagamento === "dinheiro" ? Number.parseFloat(valorPago) - totalComTaxa : 0,
        tipoEntrega,
        enderecoEntrega: tipoEntrega === "entrega" ? enderecoEntrega : "",
        localizacao: localizacaoFinal,
      }

      // Salvar no banco local (Supabase do cardápio)
      if (!modoTeste) {
        const { data, error } = await supabase.from("pedidos").insert([
          {
            cliente: novoPedido.cliente,
            total: novoPedido.total,
            forma_pagamento: novoPedido.formaPagamento,
            valor_pago: novoPedido.valorPago,
            troco: novoPedido.troco,
            itens: JSON.stringify(novoPedido.itens),
            tipo_entrega: novoPedido.tipoEntrega,
            endereco_entrega: novoPedido.enderecoEntrega,
            status: novoPedido.status,
            created_at: new Date().toISOString(),
          },
        ])

        if (error) {
          console.error("❌ Erro ao salvar pedido:", error)
          addToast({
            type: "error",
            title: "Erro ao salvar pedido",
            description: error.message,
          })
          return
        }

        try {
          const syncResult = await syncOrderWithDeliverySystem({
            cliente: novoPedido.cliente,
            telefone: TELEFONE_DISPLAY,
            endereco: novoPedido.enderecoEntrega,
            formaPagamento: novoPedido.formaPagamento,
            tipoEntrega: novoPedido.tipoEntrega,
            items: novoPedido.itens,
            total: novoPedido.total,
          })

          if (syncResult.success) {
            addToast({
              type: "success",
              title: "🔄 Pedido sincronizado!",
              description: "Pedido enviado para o sistema de delivery automaticamente",
            })
          }
        } catch (syncError) {
          console.error("❌ Erro na sincronização:", syncError)
          // Não bloquear o fluxo se a sincronização falhar
        }
      }

      // Continuar com o fluxo normal (WhatsApp, etc.)
      setPedidoAtual(novoPedido)
      setPedidos((prev) => [novoPedido, ...prev])
      setCarrinho([])
      setTelaAtual("comprovante")

      // Gerar e enviar mensagem do WhatsApp (código existente continua igual)
      // ... resto da função permanece inalterado ...
    } catch (error) {
      console.error("❌ Erro ao finalizar pedido:", error)
      addToast({
        type: "error",
        title: "Erro ao finalizar pedido",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
      })
    } finally {
      setCarregando(false)
    }
  }

  const setTelaAtual = (tela: string) => {
    // Implementação da função para definir a tela atual
  }

  return <div>{/* Componentes do cardápio */}</div>
}

export default CardapioIntegrado
