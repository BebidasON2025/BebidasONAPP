"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"
import { useState } from "react"

export function IntegrationGuide() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://seu-app.vercel.app"

  const codeExamples = {
    buscarProdutos: `// 1. Buscar produtos disponíveis
const response = await fetch('${baseUrl}/api/cardapio/produtos')
const data = await response.json()

if (data.ok) {
  const produtos = data.produtos
  const produtosPorCategoria = data.produtosPorCategoria
  
  // Atualizar seu cardápio com os produtos
  console.log('Produtos disponíveis:', produtos)
}`,

    sincronizarPedido: `// 2. Sincronizar pedido após finalizar no cardápio
// Adicione esta função no final da função finalizarPedido do seu cardápio

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
      cliente_telefone: "17996311727", // ou capturar do cliente
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
    const response = await fetch('${baseUrl}/api/cardapio/sync-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosSincronizacao)
    })

    const result = await response.json()
    
    if (result.ok) {
      console.log('✅ Pedido sincronizado:', result.numero_pedido)
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
    console.error('❌ Erro ao sincronizar:', error)
  }
}

// No final da função finalizarPedido, após enviar para WhatsApp:
setTimeout(async () => {
  await compartilharComprovanteAutomatico(novoPedido)
  
  await sincronizarComDelivery(novoPedido)
  
  setTelaAtual("comprovante")
}, 300)`,

    verificarEstoque: `// 3. Verificar estoque antes de mostrar produto
const verificarDisponibilidade = async (produtoId) => {
  const response = await fetch('${baseUrl}/api/cardapio/produtos')
  const data = await response.json()
  
  const produto = data.produtos.find(p => p.id === produtoId)
  return produto && produto.estoque > 0
}

// Usar antes de adicionar ao carrinho
if (await verificarDisponibilidade(produtoId)) {
  // Produto disponível
} else {
  // Produto indisponível
}`,

    sincronizarEstoque: `// 4. Sincronizar estoque em tempo real (opcional)
const sincronizarEstoque = async () => {
  try {
    const response = await fetch('${baseUrl}/api/cardapio/produtos')
    const data = await response.json()
    
    if (data.ok) {
      // Atualizar estoque local com dados do delivery
      const produtosAtualizados = bebidas.map(bebida => {
        const produtoDelivery = data.produtos.find(p => p.id === bebida.id)
        if (produtoDelivery) {
          return {
            ...bebida,
            estoque: produtoDelivery.estoque,
            ativo: produtoDelivery.ativo
          }
        }
        return bebida
      })
      
      setBebidas(produtosAtualizados)
      console.log('✅ Estoque sincronizado')
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar estoque:', error)
  }
}

// Sincronizar estoque a cada 5 minutos
useEffect(() => {
  const interval = setInterval(sincronizarEstoque, 5 * 60 * 1000)
  return () => clearInterval(interval)
}, [])`,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Guia de Integração - Cardápio Digital
          </CardTitle>
          <CardDescription>APIs criadas para integrar seu cardápio com o sistema de delivery</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Endpoints Disponíveis:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">GET</Badge>
                <code className="text-sm bg-muted px-2 py-1 rounded">/api/cardapio/produtos</code>
                <span className="text-sm text-muted-foreground">Buscar produtos disponíveis</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">POST</Badge>
                <code className="text-sm bg-muted px-2 py-1 rounded">/api/cardapio/sync-order</code>
                <span className="text-sm text-muted-foreground">Sincronizar pedido automaticamente</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">1. Buscar Produtos Disponíveis</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(codeExamples.buscarProdutos, "produtos")}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied === "produtos" ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>{codeExamples.buscarProdutos}</code>
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">2. Sincronizar Pedido Automaticamente</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(codeExamples.sincronizarPedido, "pedido")}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied === "pedido" ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>{codeExamples.sincronizarPedido}</code>
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">3. Verificar Estoque em Tempo Real</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(codeExamples.verificarEstoque, "estoque")}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied === "estoque" ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>{codeExamples.verificarEstoque}</code>
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">4. Sincronizar Estoque (Opcional)</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(codeExamples.sincronizarEstoque, "sync-estoque")}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied === "sync-estoque" ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>{codeExamples.sincronizarEstoque}</code>
              </pre>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Fluxo de Integração:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Cliente acessa seu cardápio digital</li>
              <li>Cardápio busca produtos disponíveis desta API</li>
              <li>Cliente seleciona produtos e finaliza pedido</li>
              <li>Pedido é enviado para WhatsApp (como sempre)</li>
              <li>
                <strong>NOVO:</strong> Pedido é sincronizado automaticamente com o delivery
              </li>
              <li>Sistema atualiza estoque automaticamente</li>
              <li>Pedido aparece no painel de administração</li>
              <li>Lançamento financeiro é criado automaticamente</li>
            </ol>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Benefícios da Integração:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
              <li>Estoque atualizado em tempo real entre os sistemas</li>
              <li>Pedidos registrados automaticamente no delivery</li>
              <li>Controle financeiro unificado</li>
              <li>Relatórios completos de vendas</li>
              <li>Evita vendas de produtos sem estoque</li>
              <li>
                <strong>Mantém o fluxo atual do WhatsApp</strong>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Passos para Implementar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
              <li>Substitua a URL base pelos dados reais do seu sistema</li>
              <li>Cole o código de sincronização no seu arquivo de cardápio</li>
              <li>Teste fazendo um pedido no cardápio</li>
              <li>Verifique se o pedido aparece no sistema de delivery</li>
              <li>Configure sincronização de estoque (opcional)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
