"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function IntegrationCode() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const integrationCode = `// Adicione esta função ao seu sistema de cardápio
// Coloque no final da função finalizarPedido, após enviar para WhatsApp

const sincronizarComDelivery = async (pedidoFinalizado) => {
  try {
    // Mapear itens do cardápio para formato do delivery
    const itensFormatados = pedidoFinalizado.itens.map(item => ({
      produto_id: item.bebida.id, // ID do produto
      quantidade: item.quantidade,
      preco: item.bebida.preco
    }))

    const dadosSincronizacao = {
      pedido_cardapio_id: pedidoFinalizado.id,
      cliente_nome: pedidoFinalizado.cliente,
      cliente_telefone: TELEFONE_WHATSAPP, // ou capturar do cliente
      itens: itensFormatados,
      total: pedidoFinalizado.total,
      forma_pagamento: pedidoFinalizado.formaPagamento,
      tipo_entrega: pedidoFinalizado.tipoEntrega,
      endereco_entrega: pedidoFinalizado.enderecoEntrega,
      valor_pago: pedidoFinalizado.valorPago,
      troco: pedidoFinalizado.troco,
      status: 'pago' // ou 'pendente' dependendo do pagamento
    }

    // Enviar para API do sistema de delivery
    const response = await fetch('https://seu-delivery-system.vercel.app/api/cardapio/sync-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosSincronizacao)
    })

    const result = await response.json()
    
    if (result.ok) {
      console.log('✅ Pedido sincronizado com delivery:', result.numero_pedido)
      // Opcional: mostrar toast de sucesso
      addToast({
        type: "success",
        title: "Pedido sincronizado!",
        description: \`Pedido \${result.numero_pedido} criado no sistema de delivery\`
      })
    } else {
      console.error('❌ Erro na sincronização:', result.error)
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar com delivery:', error)
  }
}

const finalizarPedido = async () => {
  // ... seu código existente ...
  
  // Após criar o pedido e enviar para WhatsApp:
  setTimeout(async () => {
    await compartilharComprovanteAutomatico(novoPedido)
    
    await sincronizarComDelivery(novoPedido)
    
    setTelaAtual("comprovante")
  }, 300)
}`

  const stockSyncCode = `// Função para sincronizar estoque em tempo real (opcional)
const sincronizarEstoque = async () => {
  try {
    const response = await fetch('https://seu-delivery-system.vercel.app/api/cardapio/produtos')
    const data = await response.json()
    
    if (data.ok) {
      // Atualizar estoque local com dados do delivery
      const produtosAtualizados = bebidas.map(bebida => {
        const produtoDelivery = data.produtos.find(p => p.id === bebida.id)
        if (produtoDelivery) {
          return {
            ...bebida,
            estoque: produtoDelivery.estoque,
            disponivel: produtoDelivery.disponivel
          }
        }
        return bebida
      })
      
      setBebidas(produtosAtualizados)
      console.log('✅ Estoque sincronizado com delivery')
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar estoque:', error)
  }
}

useEffect(() => {
  // Sincronizar estoque a cada 5 minutos
  const interval = setInterval(sincronizarEstoque, 5 * 60 * 1000)
  return () => clearInterval(interval)
}, [])`

  return (
    <div className="space-y-6">
      <Card className="shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-green-800">🔗 Código de Integração</h2>
          <p className="text-gray-600 mb-4">
            Copie e cole este código no seu sistema de cardápio para integração automática:
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">1. Sincronização de Pedidos</h3>
                <Button
                  onClick={() => copyToClipboard(integrationCode, "integration")}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {copied === "integration" ? "✅ Copiado!" : "📋 Copiar"}
                </Button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{integrationCode}</code>
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">2. Sincronização de Estoque (Opcional)</h3>
                <Button
                  onClick={() => copyToClipboard(stockSyncCode, "stock")}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {copied === "stock" ? "✅ Copiado!" : "📋 Copiar"}
                </Button>
              </div>
              <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{stockSyncCode}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 text-orange-800">📋 Passos para Integração</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Badge className="bg-orange-600 text-white">1</Badge>
              <div>
                <p className="font-semibold">Substitua a URL</p>
                <p className="text-sm text-gray-600">
                  Troque 'https://seu-delivery-system.vercel.app' pela URL real do seu sistema de delivery
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Badge className="bg-orange-600 text-white">2</Badge>
              <div>
                <p className="font-semibold">Cole o código no seu cardápio</p>
                <p className="text-sm text-gray-600">Adicione as funções no arquivo do seu sistema de cardápio</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Badge className="bg-orange-600 text-white">3</Badge>
              <div>
                <p className="font-semibold">Teste a integração</p>
                <p className="text-sm text-gray-600">
                  Faça um pedido teste no cardápio e verifique se aparece no sistema de delivery
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 text-purple-800">✨ Benefícios da Integração</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span>Pedidos automáticos no sistema</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span>Estoque atualizado em tempo real</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span>Controle financeiro unificado</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span>Relatórios completos</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span>Gestão centralizada</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span>Sem trabalho manual</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
