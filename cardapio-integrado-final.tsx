"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Package,
  Beer,
  Coffee,
  Zap,
  Wine,
  Droplets,
  Sparkles,
  CupSoda,
  Instagram,
  Lock,
  Key,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { createClient } from "@supabase/supabase-js"
import { ToastProvider, useToast } from "@/components/toast"

// 🔗 CONFIGURAÇÃO DE INTEGRAÇÃO COM SISTEMA PRINCIPAL
const SISTEMA_API_URL = "https://appbebidason.vercel.app" // URL do seu sistema principal
const USAR_INTEGRACAO = true // Ativar integração com sistema principal

// 🗄️ CONFIGURAÇÃO DO SUPABASE
const supabaseUrl = "https://qcaoaciohcqcwulsrtzu.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYW9hY2lvaGNxY3d1bHNydHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjU1MTgsImV4cCI6MjA3MDM0MTUxOH0.WV10l7nJMDsr84otsWCsRDGDjjrm5TX5a8yRLg2gpgk"

const supabase = createClient(supabaseUrl, supabaseKey)

// 📱 TELEFONE
const CHAVE_PIX = "1799631-1727"
const NOME_PIX = "Nattieli De Carvalho"
const BANCO_PIX = "Banco Santander (Brasil) S.A."
const TELEFONE_WHATSAPP = "17996311727"
const TELEFONE_DISPLAY = "(17) 99631-1727"

interface Categoria {
  id: number
  nome: string
  icone: string
  cor: string
  ativo: boolean
}

interface Bebida {
  id: number
  nome: string
  descricao: string
  preco: number
  categoria_id: number
  categoria?: Categoria
  imagem: string
  estoque: number
  ativo: boolean
}

interface ItemCarrinho {
  bebida: Bebida
  quantidade: number
}

interface Pedido {
  id: string
  data: string
  itens: ItemCarrinho[]
  total: number
  formaPagamento: "cartao" | "dinheiro" | "pix"
  valorPago?: number
  troco?: number
  cliente: string
  tipoEntrega: "entrega" | "retirada"
  enderecoEntrega?: string
  localizacao?: string
  status: "enviado" | "confirmado" | "entregue"
}

// 🏪 SISTEMA DE STATUS DA LOJA - MELHORADO PARA SINCRONIZAÇÃO
const STORAGE_KEY_LOJA_STATUS = "bebidas_on_loja_aberta"
const STORAGE_KEY_ULTIMA_LIMPEZA = "bebidas_on_ultima_limpeza"

// ⚠️ IMPORTANTE: No Vercel, cada usuário terá seu próprio localStorage
// Para sincronizar entre todos os dispositivos, seria necessário usar o banco de dados
// Atualmente funciona apenas localmente em cada dispositivo

// Adicionar função para detectar iOS no início do componente, após as interfaces
const detectarIOS = () => {
  if (typeof window === "undefined") return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

const TAXA_ENTREGA = 1.0
const PEDIDO_MINIMO_ENTREGA = 20.0

// 🎨 CORES PARA CATEGORIAS
const CORES_CATEGORIAS = [
  { nome: "Âmbar", valor: "amber", classe: "bg-amber-500", classeTexto: "text-amber-700", classeBg: "bg-amber-50" },
  { nome: "Azul", valor: "blue", classe: "bg-blue-500", classeTexto: "text-blue-700", classeBg: "bg-blue-50" },
  { nome: "Verde", valor: "green", classe: "bg-green-500", classeTexto: "text-green-700", classeBg: "bg-green-50" },
  { nome: "Roxo", valor: "purple", classe: "bg-purple-500", classeTexto: "text-purple-700", classeBg: "bg-purple-50" },
  { nome: "Rosa", valor: "pink", classe: "bg-pink-500", classeTexto: "text-pink-700", classeBg: "bg-pink-50" },
  { nome: "Vermelho", valor: "red", classe: "bg-red-500", classeTexto: "text-red-700", classeBg: "bg-red-50" },
]

// 🎯 ÍCONES PARA CATEGORIAS
const ICONES_CATEGORIAS = [
  { nome: "Cerveja", valor: "beer", icone: Beer },
  { nome: "Refrigerante", valor: "cup-soda", icone: CupSoda },
  { nome: "Café", valor: "coffee", icone: Coffee },
  { nome: "Energético", valor: "zap", icone: Zap },
  { nome: "Vinho", valor: "wine", icone: Wine },
  { nome: "Água", valor: "droplets", icone: Droplets },
  { nome: "Especial", valor: "sparkles", icone: Sparkles },
  { nome: "Geral", valor: "package", icone: Package },
]

// 🏷️ COMPONENTE RODAPÉ
const Rodape = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 mt-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-lg font-bold text-yellow-400 mb-1">© 2022 Bebidas ON</p>
            <p className="text-sm text-gray-300">Todos os direitos reservados</p>
          </div>
          <div className="flex items-center space-x-4 text-center md:text-right">
            <div className="text-xs text-gray-400">
              <p>Desenvolvido por</p>
              <p className="font-semibold text-gray-300">GV Software</p>
            </div>
            <a
              href="https://www.instagram.com/gv_software/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Instagram className="w-4 h-4" />
              <span className="text-xs font-medium">@gv_software</span>
            </a>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-4 pt-4 text-center">
          <p className="text-xs text-gray-500">🍻 Delivery de bebidas • 🚚 Entrega rápida • 💳 Pagamento fácil</p>
        </div>
      </div>
    </footer>
  )
}

export default function BebidasOnApp() {
  return (
    <ToastProvider>
      <BebidasOnAppContent />
    </ToastProvider>
  )
}

function BebidasOnAppContent() {
  const { addToast } = useToast()
  const [bebidas, setBebidas] = useState<Bebida[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [telaAtual, setTelaAtual] = useState<
    "inicio" | "cardapio" | "carrinho" | "pagamento" | "comprovante" | "admin"
  >("inicio")
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | "todas">("todas")
  const [busca, setBusca] = useState("")
  const [pedidoAtual, setPedidoAtual] = useState<Pedido | null>(null)
  const [formaPagamento, setFormaPagamento] = useState<"cartao" | "dinheiro" | "pix">("pix")
  const [valorPago, setValorPago] = useState("")
  const [nomeCliente, setNomeCliente] = useState("")
  const [capturandoImagem, setCapturandoImagem] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [abaAdmin, setAbaAdmin] = useState<"produtos" | "categorias" | "pedidos">("categorias")
  const [tipoEntrega, setTipoEntrega] = useState<"entrega" | "retirada">("retirada")
  const [enderecoEntrega, setEnderecoEntrega] = useState("")
  const [localizacaoAtual, setLocalizacaoAtual] = useState("")
  const [quantidadesSelecionadas, setQuantidadesSelecionadas] = useState<{ [key: number]: number }>({})
  const [modoTeste, setModoTeste] = useState(false) // 🔴 SEMPRE PRODUÇÃO - SEM DEMO
  const [buscaProdutos, setBuscaProdutos] = useState("")
  const [filtroData, setFiltroData] = useState<"todos" | "semana" | "mes" | "ano">("todos")

  // 🏪 SISTEMA DE STATUS DA LOJA MELHORADO
  const [lojaAberta, setLojaAberta] = useState(true)
  const [statusCarregado, setStatusCarregado] = useState(false)

  const [novoItem, setNovoItem] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoria_id: "",
    estoque: "",
    imagem: "",
  })

  const [novaCategoria, setNovaCategoria] = useState({
    nome: "",
    icone: "package",
    cor: "amber",
    descricao: "",
  })

  const [editandoItem, setEditandoItem] = useState<Bebida | null>(null)
  const [editandoCategoria, setEditandoCategoria] = useState<Categoria | null>(null)

  const comprovanteRef = useRef<HTMLDivElement>(null)

  const [modalSenhaAberto, setModalSenhaAberto] = useState(false)
  const [senhaInput, setSenhaInput] = useState("")
  const [senhaCarregando, setSenhaCarregando] = useState(false)
  const [carregandoInicial, setCarregandoInicial] = useState(true)

  // 🏪 CARREGAR STATUS DA LOJA AO INICIAR
  useEffect(() => {
    const carregarStatusLoja = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_LOJA_STATUS)
        if (saved !== null) {
          const status = JSON.parse(saved)
          console.log(`🏪 Status da loja carregado: ${status ? "ABERTA" : "FECHADA"}`)
          setLojaAberta(status)
        } else {
          console.log("🏪 Status da loja não encontrado, usando padrão: ABERTA")
          setLojaAberta(true)
        }
      } catch (error) {
        console.error("❌ Erro ao carregar status da loja:", error)
        setLojaAberta(true)
      } finally {
        setStatusCarregado(true)
      }
    }

    carregarStatusLoja()
  }, [])

  // 🧹 LIMPEZA AUTOMÁTICA SEMANAL (SILENCIOSA)
  useEffect(() => {
    const verificarLimpezaAutomatica = async () => {
      try {
        const ultimaLimpeza = localStorage.getItem(STORAGE_KEY_ULTIMA_LIMPEZA)
        const agora = new Date()

        if (!ultimaLimpeza) {
          // Primeira vez - salvar data atual
          localStorage.setItem(STORAGE_KEY_ULTIMA_LIMPEZA, agora.toISOString())
          console.log("📅 Data da primeira limpeza salva")
          return
        }

        const dataUltimaLimpeza = new Date(ultimaLimpeza)
        const diasDesdeUltimaLimpeza = Math.floor(
          (agora.getTime() - dataUltimaLimpeza.getTime()) / (1000 * 60 * 60 * 24),
        )

        console.log(`📅 Dias desde a última limpeza: ${diasDesdeUltimaLimpeza}`)

        // Se passou 7 dias ou mais, fazer limpeza automática
        if (diasDesdeUltimaLimpeza >= 7) {
          console.log("🧹 Iniciando limpeza automática semanal...")
          await limparBancoDadosAutomatico()
          localStorage.setItem(STORAGE_KEY_ULTIMA_LIMPEZA, agora.toISOString())
        }
      } catch (error) {
        console.error("❌ Erro na verificação de limpeza automática:", error)
      }
    }

    // Verificar limpeza após carregar os dados
    if (!carregandoInicial) {
      verificarLimpezaAutomatica()
    }
  }, [carregandoInicial])

  // 💾 CARREGAR DADOS - OTIMIZADO PARA CARREGAMENTO RÁPIDO
  useEffect(() => {
    const carregarRapido = async () => {
      setCarregandoInicial(true)
      await carregarDados()
      setCarregandoInicial(false)
    }
    carregarRapido()
  }, [])

  const carregarDados = async () => {
    try {
      // ⚡ CARREGAMENTO PARALELO E INSTANTÂNEO - SEM DELAYS E SEM LOGS
      const [categoriasResult, bebidasResult, pedidosResult] = await Promise.allSettled([
        carregarCategorias(),
        carregarBebidas(),
        carregarPedidos(),
      ])
    } catch (error) {
      console.error("❌ Erro crítico ao carregar dados:", error)
      addToast({
        type: "error",
        title: "❌ Erro crítico",
        description: "Falha ao inicializar o sistema.",
      })
    }
  }

  // 🆔 GERAR ID ÚNICO SEQUENCIAL - VERSÃO CORRIGIDA PARA EVITAR DUPLICATAS
  const gerarIdUnico = async () => {
    try {
      if (modoTeste) {
        // 🧪 MODO TESTE - Usar timestamp + random para evitar conflitos
        const timestamp = Date.now()
        const random = Math.floor(Math.random() * 10000)
        return `T${timestamp.toString().slice(-8)}${random.toString().padStart(4, "0")}`
      }

      // 🔴 MODO PRODUÇÃO - Usar timestamp + random mais robusto
      const agora = new Date()
      const timestamp = agora.getTime()
      const random = Math.floor(Math.random() * 100000)

      // Formato: YYYYMMDDHHMMSS + 5 dígitos random
      const ano = agora.getFullYear().toString()
      const mes = (agora.getMonth() + 1).toString().padStart(2, "0")
      const dia = agora.getDate().toString().padStart(2, "0")
      const hora = agora.getHours().toString().padStart(2, "0")
      const minuto = agora.getMinutes().toString().padStart(2, "0")
      const segundo = agora.getSeconds().toString().padStart(2, "0")

      const idBase = `${ano}${mes}${dia}${hora}${minuto}${segundo}${random.toString().padStart(5, "0")}`

      // Verificar se este ID já existe (apenas uma verificação simples)
      const { data: existeId, error: erroVerificacao } = await supabase
        .from("pedidos")
        .select("id")
        .eq("id", idBase)
        .limit(1)

      if (erroVerificacao) {
        console.warn("⚠️ Erro ao verificar ID, usando timestamp puro:", erroVerificacao)
        // Fallback: usar apenas timestamp + random maior
        const timestampFallback = Date.now()
        const randomFallback = Math.floor(Math.random() * 1000000)
        return `${timestampFallback}${randomFallback.toString().padStart(6, "0")}`
      }

      // Se o ID não existe, podemos usá-lo
      if (!existeId || existeId.length === 0) {
        return idBase
      }

      // Se existe, adicionar mais aleatoriedade
      const extraRandom = Math.floor(Math.random() * 100000)
      const idFinal = `${idBase}${extraRandom.toString().padStart(6, "0")}`

      console.log("✅ ID único gerado:", idFinal)
      return idFinal
    } catch (error) {
      console.error("❌ Erro crítico ao gerar ID único:", error)
      // Fallback final: timestamp + random muito grande
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 10000000)
      const idEmergencia = `E${timestamp}${random.toString().padStart(7, "0")}`
      console.log("🚨 Usando ID de emergência:", idEmergencia)
      return idEmergencia
    }
  }

  // 📍 OBTER LOCALIZAÇÃO ATUAL COM MAPA
  const obterLocalizacaoAtual = () => {
    return new Promise<string>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            const localizacao = `📍 Localização: https://maps.google.com/?q=${lat},${lng}`
            setLocalizacaoAtual(localizacao)
            console.log("✅ Localização obtida automaticamente:", localizacao)
            resolve(localizacao)
          },
          (error) => {
            console.warn("❌ Erro ao obter localização:", error)
            setLocalizacaoAtual("")
            resolve("") // Continuar sem localização
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 300000,
          },
        )
      } else {
        console.warn("❌ Geolocalização não suportada")
        setLocalizacaoAtual("")
        resolve("")
      }
    })
  }

  const carregarCategorias = async () => {
    try {
      // 🔥 REMOVIDO LIMITE - Carrega TODAS as categorias
      const { data, error } = await supabase.from("categorias").select("*").eq("ativo", true).order("nome")

      if (error) throw error
      setCategorias(data || [])
      console.log(`✅ ${data?.length || 0} categorias carregadas (SEM LIMITE)`)
    } catch (error) {
      console.error("❌ Erro ao carregar categorias:", error)
    }
  }

  const carregarBebidas = async () => {
    try {
      console.log("🍻 Carregando produtos do sistema principal...")

      if (USAR_INTEGRACAO) {
        // 🔗 INTEGRAÇÃO: Buscar produtos do sistema principal
        const response = await fetch(`${SISTEMA_API_URL}/api/menu/produtos`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log("✅ Produtos carregados do sistema principal:", data.produtos?.length || 0)

          // Converter formato do sistema principal para formato local
          const bebidasFormatadas = (data.produtos || []).map((produto: any) => ({
            id: produto.id,
            nome: produto.nome,
            descricao: produto.descricao || "",
            preco: produto.preco,
            categoria_id: 1, // Categoria padrão
            categoria: {
              id: 1,
              nome: produto.categoria || "Bebidas",
              icone: "package",
              cor: "amber",
              ativo: true,
            },
            imagem: produto.imagem || "/placeholder.svg?height=200&width=300&text=Produto",
            estoque: produto.estoque || 0,
            ativo: produto.estoque > 0,
          }))

          setBebidas(bebidasFormatadas)
          console.log(`✅ ${bebidasFormatadas.length} produtos integrados com sucesso`)
          return
        } else {
          console.warn("⚠️ Erro na API do sistema principal, usando dados locais")
        }
      }

      // Fallback: usar dados locais se integração falhar
      console.log("🔄 Carregando produtos locais como fallback...")

      // Carregar categorias primeiro
      const { data: categoriasData, error: categoriasError } = await supabase
        .from("categorias")
        .select("*")
        .eq("ativo", true)

      if (categoriasError) throw categoriasError

      // Carregar produtos locais
      const { data: produtosData, error: produtosError } = await supabase.from("produtos").select("*").order("nome")

      if (produtosError) throw produtosError

      // Criar mapa de categorias para lookup rápido
      const categoriasMap = new Map()
      categoriasData?.forEach((cat) => {
        categoriasMap.set(cat.nome, cat)
      })

      const bebidasComCategorias = (produtosData || []).map((produto) => {
        const categoriaInfo = categoriasMap.get(produto.categoria) || {
          id: 1,
          nome: produto.categoria || "Geral",
          icone: "package",
          cor: "amber",
          ativo: true,
        }

        return {
          id: produto.id,
          nome: produto.nome,
          descricao: produto.descricao || "",
          preco: produto.preco,
          categoria_id: categoriaInfo.id,
          categoria: {
            id: categoriaInfo.id,
            nome: categoriaInfo.nome,
            icone: categoriaInfo.icone || "package",
            cor: categoriaInfo.cor || "amber",
            ativo: categoriaInfo.ativo,
          },
          imagem: produto.imagem || "/placeholder.svg?height=200&width=300&text=Produto",
          estoque: produto.estoque || 0,
          ativo: true,
        }
      })

      setBebidas(bebidasComCategorias)
      console.log(`✅ ${bebidasComCategorias.length} produtos locais carregados`)
    } catch (error) {
      console.error("❌ Erro ao carregar produtos:", error)
      addToast({
        type: "error",
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar o cardápio. Tente novamente.",
      })
    }
  }

  const carregarPedidos = async () => {
    try {
      console.log("📋 Carregando TODOS os pedidos (SEM LIMITE)...")

      // 🔥 REMOVIDO LIMITE - Carrega TODOS os pedidos
      const { data, error } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false })

      if (error) throw error

      const pedidosFormatados = (data || []).map((pedido) => ({
        id: pedido.id,
        data: new Date(pedido.created_at).toLocaleString("pt-BR"),
        itens: pedido.itens || [],
        total: pedido.total,
        formaPagamento: pedido.forma_pagamento,
        valorPago: pedido.valor_pago,
        troco: pedido.troco,
        cliente: pedido.cliente,
        tipoEntrega: pedido.tipo_entrega,
        enderecoEntrega: pedido.endereco_entrega,
        localizacao: pedido.localizacao,
        status: pedido.status || "enviado",
      }))

      setPedidos(pedidosFormatados)
      console.log(`✅ ${pedidosFormatados.length} pedidos carregados com sucesso (SEM LIMITE)`)
    } catch (error) {
      console.error("❌ Erro ao carregar pedidos:", error)
      // Não fazer throw para não quebrar o carregamento
    }
  }

  const getQuantidadeSelecionada = (bebidaId: number) => {
    return quantidadesSelecionadas[bebidaId] || 1
  }

  const setQuantidadeSelecionada = (bebidaId: number, quantidade: number) => {
    setQuantidadesSelecionadas((prev) => ({
      ...prev,
      [bebidaId]: quantidade,
    }))
  }

  const adicionarAoCarrinho = (bebida: Bebida, quantidade = 1) => {
    if (bebida.estoque === 0) {
      addToast({
        type: "error",
        title: "Produto esgotado!",
        description: "Este item não está mais disponível no estoque.",
      })
      return
    }

    if (quantidade > bebida.estoque) {
      addToast({
        type: "warning",
        title: "Estoque insuficiente!",
        description: `Disponível: ${bebida.estoque} unidades`,
      })
      return
    }

    setCarrinho((prev) => {
      const itemExistente = prev.find((item) => item.bebida.id === bebida.id)
      if (itemExistente) {
        const novaQuantidade = itemExistente.quantidade + quantidade
        if (novaQuantidade <= bebida.estoque) {
          return prev.map((item) => (item.bebida.id === bebida.id ? { ...item, quantidade: novaQuantidade } : item))
        } else {
          addToast({
            type: "warning",
            title: "Estoque insuficiente!",
            description: `Disponível: ${bebida.estoque} unidades`,
          })
          return prev
        }
      }
      return [...prev, { bebida, quantidade }]
    })

    addToast({
      type: "success",
      title: "Adicionado ao carrinho!",
      description: `${quantidade}x ${bebida.nome}`,
    })
  }

  const removerDoCarrinho = (bebidaId: number) => {
    setCarrinho((prev) => {
      const itemExistente = prev.find((item) => item.bebida.id === bebidaId)
      if (itemExistente && itemExistente.quantidade > 1) {
        return prev.map((item) => (item.bebida.id === bebidaId ? { ...item, quantidade: item.quantidade - 1 } : item))
      }
      return prev.filter((item) => item.bebida.id !== bebidaId)
    })
  }

  const totalCarrinho = carrinho.reduce((total, item) => {
    return total + item.bebida.preco * item.quantidade
  }, 0)

  const subtotalItens = carrinho.reduce((total, item) => {
    return total + item.bebida.preco * item.quantidade
  }, 0)

  const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0)

  const calcularTroco = () => {
    if (formaPagamento === "dinheiro" && valorPago) {
      const valor = Number.parseFloat(valorPago)
      const totalComTaxa = totalCarrinho + (tipoEntrega === "entrega" ? TAXA_ENTREGA : 0)
      return valor - totalComTaxa
    }
    return 0
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
          console.warn("⚠️ Não foi possível obter localização, continuando sem ela")
          localizacaoFinal = ""
        }
      }

      // Gerar ID único sequencial - VERSÃO CORRIGIDA
      const idUnico = await gerarIdUnico()

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

      if (USAR_INTEGRACAO) {
        try {
          console.log("🔄 Enviando pedido para sistema principal...")
          const response = await fetch(`${SISTEMA_API_URL}/api/menu/pedidos`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              numero_pedido: novoPedido.id,
              cliente_nome: novoPedido.cliente,
              cliente_telefone: TELEFONE_WHATSAPP,
              items: novoPedido.itens.map((item) => ({
                produto_nome: item.bebida.nome,
                quantidade: item.quantidade,
                preco_unitario: item.bebida.preco,
              })),
              total: novoPedido.total,
              metodo_pagamento: novoPedido.formaPagamento,
              endereco_entrega: novoPedido.enderecoEntrega || "",
              tipo_entrega: novoPedido.tipoEntrega,
              status: "pago", // Marcar como pago para aparecer nos gráficos
              observacoes: `Pedido do cardápio integrado - ${novoPedido.data}`,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            console.log("✅ Pedido enviado para sistema principal:", result)
            addToast({
              type: "success",
              title: "✅ Pedido integrado!",
              description: "Seu pedido foi enviado para o sistema de gestão",
            })
          } else {
            const errorText = await response.text()
            console.warn("⚠️ Erro ao enviar para sistema principal:", errorText)
            addToast({
              type: "warning",
              title: "⚠️ Integração parcial",
              description: "Pedido salvo localmente, mas pode não aparecer no sistema principal",
            })
          }
        } catch (integrationError) {
          console.error("❌ Erro na integração:", integrationError)
          addToast({
            type: "warning",
            title: "⚠️ Erro de integração",
            description: "Pedido será salvo apenas localmente",
          })
        }
      }

      if (!modoTeste) {
        // 🔴 MODO PRODUÇÃO - Salvar no banco local também
        console.log("💾 Salvando pedido no banco local...")

        const dadosParaInserir: any = {
          id: novoPedido.id,
          cliente: novoPedido.cliente,
          total: novoPedido.total,
          forma_pagamento: novoPedido.formaPagamento,
          itens: novoPedido.itens,
          tipo_entrega: novoPedido.tipoEntrega,
          status: novoPedido.status,
        }

        if (novoPedido.valorPago !== undefined) {
          dadosParaInserir.valor_pago = novoPedido.valorPago
        }
        if (novoPedido.troco !== undefined) {
          dadosParaInserir.troco = novoPedido.troco
        }
        if (novoPedido.enderecoEntrega) {
          dadosParaInserir.endereco_entrega = novoPedido.enderecoEntrega
        }
        if (novoPedido.localizacao) {
          dadosParaInserir.localizacao = novoPedido.localizacao
        }

        const { error } = await supabase.from("pedidos").insert([dadosParaInserir])

        if (error) {
          console.error("❌ Erro ao inserir pedido local:", error)
          // Não fazer throw para não quebrar o fluxo se a integração funcionou
        } else {
          console.log("✅ Pedido salvo localmente:", novoPedido.id)
        }

        // Atualizar estoque local (se não estiver usando integração)
        if (!USAR_INTEGRACAO) {
          console.log("📦 Atualizando estoque local...")
          for (const item of carrinho) {
            const novoEstoque = Math.max(0, item.bebida.estoque - item.quantidade)
            const { error: estoqueError } = await supabase
              .from("produtos")
              .update({ estoque: novoEstoque })
              .eq("id", item.bebida.id)

            if (estoqueError) {
              console.error("❌ Erro ao atualizar estoque local:", estoqueError)
            }
          }
          await carregarBebidas()
        }
      } else {
        // 🧪 MODO TESTE - Apenas simular
        console.log("🧪 MODO TESTE - Pedido simulado (não salvo no banco)")
        addToast({
          type: "info",
          title: "🧪 MODO TESTE ATIVO",
          description: "Pedido criado apenas para demonstração!",
        })
      }

      setPedidos((prev) => [novoPedido, ...prev])
      setPedidoAtual(novoPedido)

      // ⚡ COMPORTAMENTO AUTOMÁTICO PARA TODOS OS DISPOSITIVOS
      setTimeout(async () => {
        await compartilharComprovanteAutomatico(novoPedido)
        setTelaAtual("comprovante")
      }, 300)

      console.log("✅ Pedido finalizado com sucesso:", novoPedido.id)
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

  const compartilharComprovante = async () => {
    if (!pedidoAtual) return

    const isIOS = detectarIOS()

    if (isIOS) {
      addToast({
        type: "info",
        title: "📱 Abrindo WhatsApp...",
        description: "Se não abrir automaticamente, copie e cole a mensagem",
        duration: 3000,
      })
    }

    try {
      let mensagem = `🍻 *PEDIDO BEBIDAS ON* 🍻\n`
      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      mensagem += `📋 *Pedido:* #${pedidoAtual.id}\n`
      mensagem += `📅 *Data:* ${pedidoAtual.data}\n`

      if (modoTeste) {
        mensagem += `🧪 *MODO TESTE ATIVO*\n`
      }

      if (pedidoAtual.tipoEntrega === "entrega") {
        mensagem += `🚚 *Tipo:* ENTREGA\n`
        mensagem += `📍 *Endereço:* ${pedidoAtual.enderecoEntrega}\n`
        if (pedidoAtual.localizacao) {
          mensagem += `\n${pedidoAtual.localizacao}\n`
        }
      } else {
        mensagem += `🏪 *Tipo:* RETIRADA NO LOCAL\n`
        mensagem += `📍 *Local:* Rua Amazonas 239 - Paraíso/SP\n`
        mensagem += `\n`
      }

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      mensagem += `🛒 *ITENS DO PEDIDO:*\n`

      pedidoAtual.itens.forEach((item, index) => {
        mensagem += `${index + 1}. ${item.quantidade}x ${item.bebida.nome}\n`
        mensagem += `   💰 R$ ${item.bebida.preco.toFixed(2)} cada\n`
        mensagem += `   📊 Subtotal: R$ ${(item.bebida.preco * item.quantidade).toFixed(2)}\n\n`
      })

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      mensagem += `💵 *RESUMO FINANCEIRO:*\n`
      mensagem += `🛍️ Subtotal dos itens: R$ ${subtotalItens.toFixed(2)}\n`

      if (pedidoAtual.tipoEntrega === "entrega") {
        mensagem += `🚚 Taxa de entrega: R$ ${TAXA_ENTREGA.toFixed(2)}\n`
      } else {
        mensagem += `🏪 Retirada no local: R$ 0,00\n`
      }

      mensagem += `💰 *TOTAL FINAL: R$ ${pedidoAtual.total.toFixed(2)}*\n\n`
      mensagem += `💳 *PAGAMENTO:* ${pedidoAtual.formaPagamento.toUpperCase()}\n`

      if (pedidoAtual.formaPagamento === "dinheiro") {
        mensagem += `💵 Valor pago: R$ ${pedidoAtual.valorPago?.toFixed(2)}\n`
        if (pedidoAtual.troco && pedidoAtual.troco > 0) {
          mensagem += `🔄 Troco: R$ ${pedidoAtual.troco.toFixed(2)}\n`
        } else {
          mensagem += `✅ Não precisa de troco\n`
        }
      }

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      mensagem += `📞 *BEBIDAS ON* - ${TELEFONE_DISPLAY}\n`
      mensagem += `🏠 Rua Amazonas 239 - Paraíso/SP\n`

      if (pedidoAtual.tipoEntrega === "entrega") {
        mensagem += `⏰ Aguardando confirmação para entrega!\n`
        mensagem += `🚚 Delivery rápido e gelado! 🧊`
      } else {
        mensagem += `⏰ Aguardando confirmação para retirada!\n`
        mensagem += `🏪 Retire no balcão! 🧊`
      }

      const whatsappUrl = `https://wa.me/${TELEFONE_WHATSAPP}?text=${encodeURIComponent(mensagem)}`
      window.open(whatsappUrl, "_blank")

      if (isIOS) {
        setTimeout(() => {
          addToast({
            type: "success",
            title: "✅ Mensagem preparada!",
            description: "WhatsApp deve ter aberto com seu pedido",
            duration: 3000,
          })
        }, 1500)
      }

      setTimeout(() => {
        setCarrinho([])
        setEnderecoEntrega("")
        setValorPago("")
        setFormaPagamento("pix")
        setTipoEntrega("retirada")
        setPedidoAtual(null)
        setTelaAtual("inicio")
      }, 2000)
    } catch (error) {
      console.error("Erro ao compartilhar:", error)
      addToast({
        type: "error",
        title: "Erro ao compartilhar",
        description: isIOS
          ? "Tente abrir o WhatsApp manualmente e colar a mensagem"
          : "Ocorreu um erro ao tentar compartilhar o comprovante.",
      })
    }
  }

  const compartilharComprovanteAutomatico = async (pedido: Pedido) => {
    try {
      let mensagem = `🍻 *PEDIDO BEBIDAS ON* 🍻\n`
      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      mensagem += `📋 *Pedido:* #${pedido.id}\n`
      mensagem += `📅 *Data:* ${pedido.data}\n`

      if (modoTeste) {
        mensagem += `🧪 *MODO TESTE ATIVO*\n`
      }

      if (pedido.tipoEntrega === "entrega") {
        mensagem += `🚚 *Tipo:* ENTREGA\n`
        mensagem += `📍 *Endereço:* ${pedido.enderecoEntrega}\n`
        if (pedido.localizacao) {
          mensagem += `\n${pedido.localizacao}\n`
        }
      } else {
        mensagem += `🏪 *Tipo:* RETIRADA NO LOCAL\n`
        mensagem += `📍 *Local:* Rua Amazonas 239 - Paraíso/SP\n`
      }

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      mensagem += `🛒 *ITENS DO PEDIDO:*\n`

      pedido.itens.forEach((item, index) => {
        mensagem += `${index + 1}. ${item.quantidade}x ${item.bebida.nome}\n`
        mensagem += `   💰 R$ ${item.bebida.preco.toFixed(2)} cada\n`
        mensagem += `   📊 Subtotal: R$ ${(item.bebida.preco * item.quantidade).toFixed(2)}\n\n`
      })

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      mensagem += `💵 *RESUMO FINANCEIRO:*\n`
      mensagem += `🛍️ Subtotal dos itens: R$ ${subtotalItens.toFixed(2)}\n`

      if (pedido.tipoEntrega === "entrega") {
        mensagem += `🚚 Taxa de entrega: R$ ${TAXA_ENTREGA.toFixed(2)}\n`
      } else {
        mensagem += `🏪 Retirada no local: R$ 0,00\n`
      }

      mensagem += `💰 *TOTAL FINAL: R$ ${pedido.total.toFixed(2)}*\n\n`
      mensagem += `💳 *PAGAMENTO:* ${pedido.formaPagamento.toUpperCase()}\n`

      if (pedido.formaPagamento === "dinheiro") {
        mensagem += `💵 Valor pago: R$ ${pedido.valorPago?.toFixed(2)}\n`
        if (pedido.troco && pedido.troco > 0) {
          mensagem += `🔄 Troco: R$ ${pedido.troco.toFixed(2)}\n`
        } else {
          mensagem += `✅ Não precisa de troco\n`
        }
      }

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      mensagem += `📞 *BEBIDAS ON* - ${TELEFONE_DISPLAY}\n`
      mensagem += `🏠 Rua Amazonas 239 - Paraíso/SP\n`

      if (pedido.tipoEntrega === "entrega") {
        mensagem += `⏰ Aguardando confirmação para entrega!\n`
        mensagem += `🚚 Delivery rápido e gelado! 🧊`
      } else {
        mensagem += `⏰ Aguardando confirmação para retirada!\n`
        mensagem += `🏪 Retire no balcão! 🧊`
      }

      try {
        const whatsappUrl = `https://wa.me/${TELEFONE_WHATSAPP}?text=${encodeURIComponent(mensagem)}`
        window.location.href = whatsappUrl
        console.log("✅ Método location.href executado")

        setTimeout(() => {
          const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer")
          if (popup) {
            popup.focus()
          }
          console.log("✅ Método window.open executado")
        }, 50)

        setTimeout(() => {
          const link = document.createElement("a")
          link.href = whatsappUrl
          link.target = "_blank"
          link.rel = "noopener noreferrer"
          link.style.position = "absolute"
          link.style.left = "-9999px"
          document.body.appendChild(link)

          const touchStart = new TouchEvent("touchstart", { bubbles: true })
          const touchEnd = new TouchEvent("touchend", { bubbles: true })
          const click = new MouseEvent("click", { bubbles: true })

          link.dispatchEvent(touchStart)
          link.dispatchEvent(touchEnd)
          link.dispatchEvent(click)
          link.click()

          setTimeout(() => document.body.removeChild(link), 100)
          console.log("✅ Método link com eventos de toque executado")
        }, 100)
      } catch (error) {
        console.error("❌ Erro nos métodos automáticos:", error)
        window.open(`https://wa.me/${TELEFONE_WHATSAPP}?text=${encodeURIComponent(mensagem)}`, "_blank")
      }

      addToast({
        type: "success",
        title: "🚀 WhatsApp abrindo automaticamente!",
        description: "Seu pedido está sendo enviado...",
        duration: 2000,
      })

      setTimeout(() => {
        setCarrinho([])
        setEnderecoEntrega("")
        setValorPago("")
        setFormaPagamento("pix")
        setTipoEntrega("retirada")
      }, 2000)
    } catch (error) {
      console.error("Erro no compartilhamento automático:", error)
      addToast({
        type: "warning",
        title: "Erro no envio automático",
        description: "Use o botão 'Enviar para WhatsApp' manualmente",
      })
    }
  }

  const salvarComprovante = async () => {
    if (!comprovanteRef.current) return

    try {
      setCapturandoImagem(true)
      const html2canvas = (await import("html2canvas")).default

      const canvas = await html2canvas(comprovanteRef.current, {
        backgroundColor: "#1f2937",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
      })

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `comprovante-${pedidoAtual?.id || "venda"}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          addToast({
            type: "success",
            title: "Comprovante salvo!",
            description: "O comprovante foi salvo com sucesso na sua galeria.",
          })
        }
      }, "image/png")
    } catch (error) {
      console.error("Erro ao salvar comprovante:", error)
      addToast({
        type: "error",
        title: "Erro ao salvar comprovante",
        description: "Ocorreu um erro ao tentar salvar o comprovante.",
      })
    } finally {
      setCapturandoImagem(false)
    }
  }

  const bebidasFiltradas = bebidas.filter((bebida) => {
    const matchCategoria = categoriaFiltro === "todas" || bebida.categoria_id === categoriaFiltro
    const matchBusca =
      bebida.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (bebida.descricao && bebida.descricao.toLowerCase().includes(busca.toLowerCase()))
    return matchCategoria && matchBusca
  })

  const getStatusEstoque = (estoque: number) => {
    if (estoque === 0) return { cor: "bg-red-500", texto: "Esgotado" }
    if (estoque <= 5) return { cor: "bg-yellow-500", texto: `Restam ${estoque}` }
    return { cor: "bg-green-500", texto: "Disponível" }
  }

  const getCorCategoria = (cor: string) => {
    return CORES_CATEGORIAS.find((c) => c.valor === cor) || CORES_CATEGORIAS[0]
  }

  const getIconeCategoria = (icone: string) => {
    const iconeEncontrado = ICONES_CATEGORIAS.find((i) => i.valor === icone)
    return iconeEncontrado?.icone || Package
  }

  const adicionarNovaCategoria = async () => {
    if (!novaCategoria.nome.trim()) {
      addToast({
        type: "error",
        title: "Nome da categoria ausente!",
        description: "Por favor, digite o nome da categoria.",
      })
      return
    }

    if (modoTeste) {
      const novaCategoriaTeste: Categoria = {
        id: Date.now(),
        nome: novaCategoria.nome,
        icone: novaCategoria.icone,
        cor: novaCategoria.cor,
        ativo: true,
      }
      setCategorias((prev) => [...prev, novaCategoriaTeste])
      setNovaCategoria({ nome: "", icone: "package", cor: "amber", descricao: "" })
      addToast({
        type: "info",
        title: "🧪 TESTE: Categoria criada localmente!",
        description: "Esta categoria não será salva no banco de dados real.",
      })
      return
    }

    try {
      setCarregando(true)
      const { data, error } = await supabase
        .from("categorias")
        .insert([
          {
            nome: novaCategoria.nome,
            icone: novaCategoria.icone,
            cor: novaCategoria.cor,
            ativo: true,
          },
        ])
        .select()

      if (error) {
        console.error("❌ Erro ao criar categoria:", error)
        addToast({
          type: "error",
          title: "Erro ao criar categoria",
          description: error.message,
        })
        return
      }

      setNovaCategoria({ nome: "", icone: "package", cor: "amber", descricao: "" })
      await carregarCategorias()
      addToast({
        type: "success",
        title: "Categoria criada!",
        description: "A categoria foi criada com sucesso.",
      })
    } catch (error) {
      console.error("❌ Erro ao criar categoria:", error)
      addToast({
        type: "error",
        title: "Erro ao criar categoria",
        description: "Ocorreu um erro ao criar a categoria.",
      })
    } finally {
      setCarregando(false)
    }
  }

  const adicionarNovaBebida = async () => {
    if (!novoItem.nome || !novoItem.preco || !novoItem.categoria_id) {
      addToast({
        type: "error",
        title: "Campos obrigatórios ausentes!",
        description: "Preencha todos os campos obrigatórios para adicionar a bebida.",
      })
      return
    }

    if (modoTeste) {
      const novaBebidaTeste: Bebida = {
        id: Date.now(),
        nome: novoItem.nome,
        descricao: novoItem.descricao,
        preco: Number.parseFloat(novoItem.preco),
        categoria_id: Number.parseInt(novoItem.categoria_id),
        categoria: categorias.find((c) => c.id === Number.parseInt(novoItem.categoria_id)),
        imagem: novoItem.imagem || "/placeholder.svg?height=200&width=300&text=Bebida+Teste",
        estoque: Number.parseInt(novoItem.estoque) || 0,
        ativo: true,
      }
      setBebidas((prev) => [...prev, novaBebidaTeste])
      setNovoItem({ nome: "", descricao: "", preco: "", categoria_id: "", estoque: "", imagem: "" })
      addToast({
        type: "info",
        title: "🧪 TESTE: Bebida criada localmente!",
        description: "Esta bebida não será salva no banco de dados real.",
      })
      return
    }

    try {
      setCarregando(true)
      const { data, error } = await supabase
        .from("produtos")
        .insert([
          {
            nome: novoItem.nome,
            descricao: novoItem.descricao,
            preco: Number.parseFloat(novoItem.preco),
            categoria_id: Number.parseInt(novoItem.categoria_id),
            imagem: novoItem.imagem || "/placeholder.svg?height=200&width=300&text=Produto",
            estoque: Number.parseInt(novoItem.estoque) || 0,
          },
        ])
        .select()

      if (error) {
        console.error("❌ Erro ao criar bebida:", error)
        addToast({
          type: "error",
          title: "Erro ao criar bebida",
          description: error.message,
        })
        return
      }

      setNovoItem({ nome: "", descricao: "", preco: "", categoria_id: "", estoque: "", imagem: "" })
      await carregarBebidas()
      addToast({
        type: "success",
        title: "Bebida adicionada!",
        description: "A bebida foi adicionada com sucesso ao cardápio.",
      })
    } catch (error) {
      console.error("❌ Erro ao criar bebida:", error)
      addToast({
        type: "error",
        title: "Erro ao criar bebida",
        description: "Ocorreu um erro ao adicionar a bebida.",
      })
    } finally {
      setCarregando(false)
    }
  }

  const excluirBebida = async (id: number) => {
    const bebida = bebidas.find((b) => b.id === id)
    if (bebida && confirm(`❌ Tem certeza que deseja excluir "${bebida.nome}"?`)) {
      if (modoTeste) {
        setBebidas((prev) => prev.filter((b) => b.id !== id))
        addToast({
          type: "info",
          title: "🧪 TESTE: Bebida removida localmente!",
          description: "Esta bebida não será excluída do banco de dados real.",
        })
        return
      }

      try {
        const { error } = await supabase.from("produtos").delete().eq("id", id)
        if (error) {
          addToast({
            type: "error",
            title: "Erro ao excluir bebida",
            description: error.message,
          })
          return
        }
        await carregarBebidas()
        addToast({
          type: "success",
          title: "Bebida excluída!",
          description: "A bebida foi excluída com sucesso do cardápio.",
        })
      } catch (error) {
        addToast({
          type: "error",
          title: "Erro ao excluir bebida",
          description: "Ocorreu um erro ao excluir a bebida.",
        })
      }
    }
  }

  const atualizarEstoque = async (id: number, novoEstoque: number) => {
    if (modoTeste) {
      setBebidas((prev) => prev.map((b) => (b.id === id ? { ...b, estoque: novoEstoque } : b)))
      return
    }

    try {
      const { error } = await supabase.from("produtos").update({ estoque: novoEstoque }).eq("id", id)
      if (error) {
        addToast({
          type: "error",
          title: "Erro ao atualizar estoque",
          description: error.message,
        })
        return
      }
      await carregarBebidas()
    } catch (error) {
      addToast({
        type: "error",
        title: "Erro ao atualizar estoque",
        description: "Ocorreu um erro ao atualizar o estoque.",
      })
    }
  }

  // 🔐 ACESSO ADMIN - CORRIGIDO COM MODO TESTE SECRETO
  const acessoAdmin = () => {
    setModalSenhaAberto(true)
    setSenhaInput("")
  }

  const processarSenha = async () => {
    if (!senhaInput.trim()) return

    setSenhaCarregando(true)

    // Simular um pequeno delay para a animação
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (senhaInput === "admin123") {
      console.log("✅ Acesso admin autorizado")
      setTelaAtual("admin")
      setModalSenhaAberto(false)
      addToast({
        type: "success",
        title: "✅ Acesso autorizado!",
        description: "Bem-vindo ao painel administrativo.",
      })
    } else if (senhaInput === "teste123") {
      console.log("🧪 Modo teste ativado")
      setModoTeste(true)
      setModalSenhaAberto(false)
      addToast({
        type: "info",
        title: "🧪 Modo demonstração ativado!",
        description: "Agora você está no modo de demonstração com dados fictícios.",
      })
    } else if (senhaInput === "producao123") {
      console.log("🔴 Modo produção ativado")
      setModoTeste(false)
      setModalSenhaAberto(false)
      addToast({
        type: "success",
        title: "🔴 Modo produção ativado!",
        description: "Voltando aos dados reais do banco.",
      })
      carregarDados() // Recarregar dados reais
    } else {
      addToast({
        type: "error",
        title: "Senha incorreta!",
        description: "A senha digitada está incorreta.",
      })
    }

    setSenhaCarregando(false)
    setSenhaInput("")
  }

  const fecharModalSenha = () => {
    setModalSenhaAberto(false)
    setSenhaInput("")
    setSenhaCarregando(false)
  }

  const excluirCategoria = async (id: number) => {
    const categoria = categorias.find((c) => c.id === id)
    if (categoria && confirm(`❌ Tem certeza que deseja excluir "${categoria.nome}"?`)) {
      if (modoTeste) {
        setCategorias((prev) => prev.filter((c) => c.id !== id))
        addToast({
          type: "info",
          title: "🧪 TESTE: Categoria removida localmente!",
          description: "Esta categoria não será excluída do banco de dados real.",
        })
        return
      }

      try {
        const { error } = await supabase.from("categorias").delete().eq("id", id)
        if (error) {
          addToast({
            type: "error",
            title: "Erro ao excluir categoria",
            description: error.message,
          })
          return
        }
        await carregarCategorias()
        addToast({
          type: "success",
          title: "Categoria excluída!",
          description: "A categoria foi excluída com sucesso.",
        })
      } catch (error) {
        addToast({
          type: "error",
          title: "Erro ao excluir categoria",
          description: "Ocorreu um erro ao excluir a categoria.",
        })
      }
    }
  }

  const editarBebida = async () => {
    console.log("🔧 Editando bebida:", editandoItem)
    if (
      !editandoItem ||
      !editandoItem.nome.trim() ||
      !editandoItem.preco ||
      editandoItem.preco <= 0 ||
      !editandoItem.categoria_id
    ) {
      addToast({
        type: "error",
        title: "Campos obrigatórios ausentes!",
        description: "Preencha todos os campos obrigatórios para editar a bebida.",
      })
      return
    }

    if (modoTeste) {
      setBebidas((prev) =>
        prev.map((b) =>
          b.id === editandoItem.id
            ? {
                ...editandoItem,
                categoria: categorias.find((c) => c.id === editandoItem.categoria_id),
              }
            : b,
        ),
      )
      setEditandoItem(null)
      addToast({
        type: "info",
        title: "🧪 TESTE: Bebida editada localmente!",
        description: "As alterações não serão salvas no banco de dados real.",
      })
      return
    }

    try {
      setCarregando(true)
      const { error } = await supabase
        .from("produtos")
        .update({
          nome: editandoItem.nome,
          descricao: editandoItem.descricao,
          preco: editandoItem.preco,
          categoria_id: editandoItem.categoria_id,
          imagem: editandoItem.imagem,
          estoque: editandoItem.estoque,
        })
        .eq("id", editandoItem.id)

      if (error) {
        addToast({
          type: "error",
          title: "Erro ao editar bebida",
          description: error.message,
        })
        return
      }

      setEditandoItem(null)
      await carregarBebidas()
      addToast({
        type: "success",
        title: "Bebida editada!",
        description: "A bebida foi editada com sucesso.",
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Erro ao editar bebida",
        description: "Ocorreu um erro ao editar a bebida.",
      })
    } finally {
      setCarregando(false)
    }
  }

  const editarCategoria = async () => {
    console.log("🔧 Editando categoria:", editandoCategoria)
    if (!editandoCategoria || !editandoCategoria.nome.trim()) {
      addToast({
        type: "error",
        title: "Nome da categoria ausente!",
        description: "Por favor, digite o nome da categoria.",
      })
      return
    }

    if (modoTeste) {
      setCategorias((prev) => prev.map((c) => (c.id === editandoCategoria.id ? editandoCategoria : c)))
      setEditandoCategoria(null)
      addToast({
        type: "info",
        title: "🧪 TESTE: Categoria editada localmente!",
        description: "As alterações não serão salvas no banco de dados real.",
      })
      return
    }

    try {
      setCarregando(true)
      const { error } = await supabase
        .from("categorias")
        .update({
          nome: editandoCategoria.nome,
          icone: editandoCategoria.icone,
          cor: editandoCategoria.cor,
        })
        .eq("id", editandoCategoria.id)

      if (error) {
        addToast({
          type: "error",
          title: "Erro ao editar categoria",
          description: error.message,
        })
        return
      }

      setEditandoCategoria(null)
      await carregarCategorias()

      addToast({
        type: "success",
        title: "Categoria editada!",
        description: "A categoria foi editada com sucesso.",
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Erro ao editar categoria",
        description: "Ocorreu um erro ao editar a categoria.",
      })
    } finally {
      setCarregando(false)
    }
  }

  const alternarStatusLoja = async () => {
    const novoStatus = !lojaAberta
    console.log(
      `🏪 Alterando status da loja: ${lojaAberta ? "ABERTA" : "FECHADA"} → ${novoStatus ? "ABERTA" : "FECHADA"}`,
    )

    try {
      setCarregando(true)

      // Atualizar o estado PRIMEIRO para feedback imediato
      setLojaAberta(novoStatus)

      // Salvar no localStorage de forma síncrona
      try {
        localStorage.setItem(STORAGE_KEY_LOJA_STATUS, JSON.stringify(novoStatus))
        console.log(`💾 Status salvo no localStorage: ${novoStatus ? "ABERTA" : "FECHADA"}`)
      } catch (error) {
        console.error("❌ Erro ao salvar no localStorage:", error)
      }

      // Mostrar toast de confirmação
      addToast({
        type: novoStatus ? "success" : "warning",
        title: `🏪 Loja ${novoStatus ? "ABERTA" : "FECHADA"}!`,
        description: novoStatus
          ? "✅ Clientes podem fazer pedidos normalmente"
          : "⏸️ Pedidos foram pausados temporariamente",
        duration: 3000,
      })

      console.log(`✅ Status da loja alterado com sucesso para: ${novoStatus ? "ABERTA" : "FECHADA"}`)
    } catch (error) {
      console.error("❌ Erro ao alterar status da loja:", error)
      addToast({
        type: "error",
        title: "❌ Erro ao alterar status",
        description: "Não foi possível alterar o status da loja. Tente novamente.",
      })
    } finally {
      setCarregando(false)
    }
  }

  // 🧹 LIMPEZA AUTOMÁTICA DO BANCO DE DADOS (SILENCIOSA)
  const limparBancoDadosAutomatico = async () => {
    try {
      console.log("🧹 Iniciando limpeza automática semanal...")

      // Manter apenas os últimos 50 pedidos
      const { data: todosPedidos, error: erroPedidos } = await supabase
        .from("pedidos")
        .select("id, created_at")
        .order("created_at", { ascending: false })

      if (erroPedidos) throw erroPedidos

      if (todosPedidos && todosPedidos.length > 50) {
        // Identificar pedidos para excluir (manter os 50 mais recentes)
        const pedidosParaExcluir = todosPedidos.slice(50)
        const idsParaExcluir = pedidosParaExcluir.map((p) => p.id)

        // Excluir pedidos antigos
        const { error: erroExclusao } = await supabase.from("pedidos").delete().in("id", idsParaExcluir)

        if (erroExclusao) throw erroExclusao

        console.log(`✅ Limpeza automática concluída: ${pedidosParaExcluir.length} pedidos antigos removidos`)

        // Recarregar pedidos silenciosamente
        await carregarPedidos()
      } else {
        console.log("ℹ️ Limpeza automática: Nada para limpar")
      }
    } catch (error) {
      console.error("❌ Erro na limpeza automática:", error)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        if (editandoItem) {
          setEditandoItem({ ...editandoItem, imagem: imageUrl })
        } else {
          setNovoItem({ ...novoItem, imagem: imageUrl })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Recarregar dados quando mudar o modo
  useEffect(() => {
    carregarDados()
  }, [modoTeste])

  useEffect(() => {
    const handleStorageError = (e: StorageEvent | ErrorEvent) => {
      if (e instanceof ErrorEvent && e.message?.includes("quota")) {
        console.error("localStorage quota exceeded, clearing old data...")
        try {
          // Clear old localStorage data to free up space
          const keysToRemove = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.includes("bebidas") || key.includes("old-") || key.includes("cache-"))) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key))
          console.log(`Cleared ${keysToRemove.length} localStorage items`)
        } catch (error) {
          console.error("Failed to clear localStorage:", error)
        }
      }
    }

    window.addEventListener("error", handleStorageError)
    window.addEventListener("storage", handleStorageError)

    return () => {
      window.removeEventListener("error", handleStorageError)
      window.removeEventListener("storage", handleStorageError)
    }
  }, [])

  const produtosFiltrados = bebidas.filter(
    (bebida) =>
      bebida.nome.toLowerCase().includes(buscaProdutos.toLowerCase()) ||
      (bebida.descricao && bebida.descricao.toLowerCase().includes(buscaProdutos.toLowerCase())),
  )

  const filtrarPedidosPorData = (pedidos: Pedido[]) => {
    if (filtroData === "todos") return pedidos

    const agora = new Date()
    const dataLimite = new Date()

    switch (filtroData) {
      case "semana":
        dataLimite.setDate(agora.getDate() - 7)
        break
      case "mes":
        dataLimite.setMonth(agora.getMonth() - 1)
        break
      case "ano":
        dataLimite.setFullYear(agora.getFullYear() - 1)
        break
    }

    return pedidos.filter((pedido) => {
      const dataPedido = new Date(pedido.data.split(", ")[0].split("/").reverse().join("-"))
      return dataPedido >= dataLimite
    })
  }

  const pedidosFiltrados = filtrarPedidosPorData(pedidos)

  // 🏪 VERIFICAR STATUS DA LOJA EM TEMPO REAL
  useEffect(() => {
    const verificarStatusLoja = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_LOJA_STATUS)
        if (saved !== null) {
          const status = JSON.parse(saved)
          if (status !== lojaAberta) {
            console.log(`🔄 Status da loja atualizado: ${status ? "ABERTA" : "FECHADA"}`)
            setLojaAberta(status)
          }
        }
      } catch (error) {
        console.error("❌ Erro ao verificar status da loja:", error)
      }
    }

    // Verificar a cada 2 segundos
    const interval = setInterval(verificarStatusLoja, 2000)

    return () => clearInterval(interval)
  }, [lojaAberta])

  // TELA INICIAL - SEM BADGE DE DEMONSTRAÇÃO
  if (telaAtual === "inicio") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-yellow-500 flex flex-col overflow-hidden">
        {/* Elementos flutuantes de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float-1"></div>
          <div className="absolute top-32 right-16 w-16 h-16 bg-white/5 rounded-full animate-float-2"></div>
          <div className="absolute bottom-32 left-20 w-12 h-12 bg-white/10 rounded-full animate-float-3"></div>
          <div className="absolute bottom-20 right-32 w-24 h-24 bg-white/5 rounded-full animate-float-4"></div>
        </div>

        {/* Conteúdo principal */}
        <header className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">🍻 Bebidas ON Delivery 🍻</h1>
            <p className="mt-2 text-lg text-yellow-100">Seu delivery de bebidas geladas em Paraíso/SP e região!</p>
          </div>
        </header>

        <main className="flex-grow overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto text-center">
            <Button size="lg" className="w-full mb-4" onClick={() => setTelaAtual("cardapio")}>
              🎉 Fazer meu pedido agora!
            </Button>
            <Button variant="secondary" className="w-full" onClick={acessoAdmin}>
              🔒 Acesso administrativo
            </Button>
          </div>
        </main>

        <Rodape />
      </div>
    )
  }

  // TELA DO CARDÁPIO
  if (telaAtual === "cardapio") {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">🍻 Cardápio Digital</h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={() => setTelaAtual("inicio")}>
                <Package className="w-5 h-5" />
                <span>Início</span>
              </Button>
              <Button variant="outline" size="icon" onClick={() => setTelaAtual("carrinho")}>
                <ShoppingCart className="w-5 h-5" />
                <span>Carrinho ({totalItens})</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Buscar bebida..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <Search className="w-5 h-5 text-gray-500" />
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Categorias</h2>
            <div className="flex overflow-x-auto space-x-2">
              <Button
                variant={categoriaFiltro === "todas" ? "default" : "outline"}
                onClick={() => setCategoriaFiltro("todas")}
              >
                Todas
              </Button>
              {categorias.map((categoria) => (
                <Button
                  key={categoria.id}
                  variant={categoriaFiltro === categoria.id ? "default" : "outline"}
                  onClick={() => setCategoriaFiltro(categoria.id)}
                >
                  {categoria.nome}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bebidasFiltradas.length === 0 ? (
              <div className="text-center text-gray-500 col-span-full">Nenhuma bebida encontrada.</div>
            ) : (
              bebidasFiltradas.map((bebida) => (
                <Card key={bebida.id}>
                  <CardContent className="p-4">
                    <div className="relative">
                      <Image
                        src={bebida.imagem || "/placeholder.svg"}
                        alt={bebida.nome}
                        width={300}
                        height={200}
                        className="rounded-md object-cover w-full h-48"
                      />
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        R$ {bebida.preco.toFixed(2)}
                      </Badge>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-gray-800">{bebida.nome}</h3>
                    <p className="text-sm text-gray-600">{bebida.descricao}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge className={getStatusEstoque(bebida.estoque).cor}>
                        {getStatusEstoque(bebida.estoque).texto}
                      </Badge>
                      <Button onClick={() => adicionarAoCarrinho(bebida)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>

        <Rodape />
      </div>
    )
  }

  // TELA DO CARRINHO
  if (telaAtual === "carrinho") {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">🛒 Seu Carrinho</h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={() => setTelaAtual("cardapio")}>
                <Package className="w-5 h-5" />
                <span>Continuar comprando</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          {carrinho.length === 0 ? (
            <div className="text-center text-gray-500">
              Seu carrinho está vazio.
              <Button variant="link" onClick={() => setTelaAtual("cardapio")}>
                Adicionar itens
              </Button>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200 mb-4">
                {carrinho.map((item) => (
                  <li key={item.bebida.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={item.bebida.imagem || "/placeholder.svg"}
                        alt={item.bebida.nome}
                        width={80}
                        height={60}
                        className="rounded-md object-cover"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{item.bebida.nome}</h3>
                        <p className="text-sm text-gray-600">R$ {item.bebida.preco.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerDoCarrinho(item.bebida.id)}
                        disabled={item.quantidade <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-gray-700">{item.quantidade}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => adicionarAoCarrinho(item.bebida, 1)}
                        disabled={item.quantidade >= item.bebida.estoque}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="bg-white shadow-md rounded-md p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold text-gray-800">R$ {subtotalItens.toFixed(2)}</span>
                </div>
                {tipoEntrega === "entrega" && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Taxa de entrega:</span>
                    <span className="font-semibold text-gray-800">R$ {TAXA_ENTREGA.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-700">Total:</span>
                  <span className="text-xl font-bold text-gray-900">
                    R$ {(subtotalItens + (tipoEntrega === "entrega" ? TAXA_ENTREGA : 0)).toFixed(2)}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Tipo de Entrega</h3>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="retirada"
                        checked={tipoEntrega === "retirada"}
                        onChange={() => setTipoEntrega("retirada")}
                        className="focus:ring-0"
                      />
                      <span>Retirada no local</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="entrega"
                        checked={tipoEntrega === "entrega"}
                        onChange={() => setTipoEntrega("entrega")}
                        className="focus:ring-0"
                        disabled={totalCarrinho < PEDIDO_MINIMO_ENTREGA}
                      />
                      <span>Entrega</span>
                      {totalCarrinho < PEDIDO_MINIMO_ENTREGA && (
                        <Badge variant="outline">Mínimo R$ {PEDIDO_MINIMO_ENTREGA.toFixed(2)}</Badge>
                      )}
                    </label>
                  </div>
                </div>

                {tipoEntrega === "entrega" && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Endereço de Entrega</h3>
                    <Input
                      type="text"
                      placeholder="Digite seu endereço completo"
                      value={enderecoEntrega}
                      onChange={(e) => setEnderecoEntrega(e.target.value)}
                    />
                  </div>
                )}

                <Button className="w-full" onClick={() => setTelaAtual("pagamento")}>
                  Continuar para o Pagamento
                </Button>
              </div>
            </>
          )}
        </main>

        <Rodape />
      </div>
    )
  }

  // TELA DE PAGAMENTO
  if (telaAtual === "pagamento") {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">💰 Pagamento</h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={() => setTelaAtual("carrinho")}>
                <ShoppingCart className="w-5 h-5" />
                <span>Voltar ao carrinho</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-md p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações de Pagamento</h2>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Forma de Pagamento</h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="pix"
                    checked={formaPagamento === "pix"}
                    onChange={() => setFormaPagamento("pix")}
                    className="focus:ring-0"
                  />
                  <span>PIX</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="dinheiro"
                    checked={formaPagamento === "dinheiro"}
                    onChange={() => setFormaPagamento("dinheiro")}
                    className="focus:ring-0"
                  />
                  <span>Dinheiro</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="cartao"
                    checked={formaPagamento === "cartao"}
                    onChange={() => setFormaPagamento("cartao")}
                    className="focus:ring-0"
                    disabled
                  />
                  <span>Cartão (em breve)</span>
                  <Badge variant="outline">Em breve</Badge>
                </label>
              </div>
            </div>

            {formaPagamento === "dinheiro" && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Valor Pago</h3>
                <Input
                  type="number"
                  placeholder="Digite o valor pago pelo cliente"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                />
              </div>
            )}

            {formaPagamento === "pix" && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Chave PIX</h3>
                <p className="text-gray-600">
                  <Zap className="inline w-4 h-4 mr-1" />
                  {CHAVE_PIX}
                </p>
                <p className="text-gray-600">
                  <Lock className="inline w-4 h-4 mr-1" />
                  {NOME_PIX}
                </p>
                <p className="text-gray-600">
                  <Key className="inline w-4 h-4 mr-1" />
                  {BANCO_PIX}
                </p>
              </div>
            )}

            <Button className="w-full" onClick={finalizarPedido} disabled={carregando}>
              {carregando ? "Finalizando..." : "Finalizar Pedido"}
            </Button>
          </div>
        </main>

        <Rodape />
      </div>
    )
  }

  // TELA DE COMPROVANTE
  if (telaAtual === "comprovante" && pedidoAtual) {
    return (
      <div className="min-h-screen bg-gray-200 flex flex-col">
        <header className="bg-gray-800 text-white py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold">🎉 Comprovante do Pedido</h1>
            <div>
              <Button variant="secondary" onClick={salvarComprovante} disabled={capturandoImagem}>
                {capturandoImagem ? "Salvando..." : "Salvar Comprovante"}
              </Button>
              <Button className="ml-2" onClick={compartilharComprovante}>
                Enviar para WhatsApp
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4 flex-grow overflow-auto">
          <div ref={comprovanteRef} className="bg-gray-700 text-white rounded-md p-4 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">🍻 Bebidas ON - Comprovante 🍻</h2>
            <p className="text-gray-300 text-sm text-center">
              {modoTeste ? "🧪 MODO TESTE ATIVO" : "✅ Pedido confirmado"}
            </p>
            <hr className="my-4 border-gray-600" />

            <div className="flex justify-between mb-2">
              <span className="font-semibold">Pedido:</span>
              <span>#{pedidoAtual.id}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Data:</span>
              <span>{pedidoAtual.data}</span>
            </div>

            <hr className="my-4 border-gray-600" />

            <h3 className="text-lg font-semibold mb-2">Itens do Pedido:</h3>
            <ul>
              {pedidoAtual.itens.map((item, index) => (
                <li key={index} className="flex justify-between mb-1">
                  <span>
                    {item.quantidade}x {item.bebida.nome}
                  </span>
                  <span>R$ {(item.bebida.preco * item.quantidade).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <hr className="my-4 border-gray-600" />

            <div className="flex justify-between mb-2">
              <span className="font-semibold">Subtotal:</span>
              <span>R$ {subtotalItens.toFixed(2)}</span>
            </div>
            {pedidoAtual.tipoEntrega === "entrega" && (
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Taxa de Entrega:</span>
                <span>R$ {TAXA_ENTREGA.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Total:</span>
              <span className="text-xl">R$ {pedidoAtual.total.toFixed(2)}</span>
            </div>

            <hr className="my-4 border-gray-600" />

            <div className="flex justify-between mb-2">
              <span className="font-semibold">Forma de Pagamento:</span>
              <span>{pedidoAtual.formaPagamento.toUpperCase()}</span>
            </div>
            {pedidoAtual.formaPagamento === "dinheiro" && (
              <>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Valor Pago:</span>
                  <span>R$ {pedidoAtual.valorPago?.toFixed(2)}</span>
                </div>
                {pedidoAtual.troco && pedidoAtual.troco > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Troco:</span>
                    <span>R$ {pedidoAtual.troco.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}

            <hr className="my-4 border-gray-600" />

            <p className="text-center text-gray-400 text-sm">
              Obrigado por comprar conosco!
              <br />
              Bebidas ON - {TELEFONE_DISPLAY}
            </p>
          </div>
        </main>

        <footer className="bg-gray-800 text-white py-4">
          <div className="container mx-auto px-4 text-center">
            <Button onClick={() => setTelaAtual("inicio")}>Voltar ao Início</Button>
          </div>
        </footer>
      </div>
    )
  }

  // TELA DE ADMINISTRAÇÃO
  if (telaAtual === "admin") {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">⚙️ Painel Administrativo</h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={() => setTelaAtual("inicio")}>
                <Package className="w-5 h-5" />
                <span>Voltar ao Início</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex space-x-4">
            <Button
              variant={abaAdmin === "categorias" ? "default" : "outline"}
              onClick={() => setAbaAdmin("categorias")}
            >
              Categorias
            </Button>
            <Button variant={abaAdmin === "produtos" ? "default" : "outline"} onClick={() => setAbaAdmin("produtos")}>
              Produtos
            </Button>
            <Button variant={abaAdmin === "pedidos" ? "default" : "outline"} onClick={() => setAbaAdmin("pedidos")}>
              Pedidos
            </Button>
          </div>

          {/* ABA DE CATEGORIAS */}
          {abaAdmin === "categorias" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Gerenciar Categorias</h2>

              {/* LISTA DE CATEGORIAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {categorias.map((categoria) => (
                  <Card key={categoria.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{categoria.nome}</h3>
                        <div>
                          <Button variant="ghost" size="icon" onClick={() => setEditandoCategoria(categoria)}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.08 2.685a.75.75 0 0 0 .933.933l2.685-.08a5.25 5.25 0 0 0 2.214-1.32L19.513 8.199Z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => excluirCategoria(categoria.id)}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.5 5.25a.75.75 0 0 1 .75.75V6h-1.5V5.25a.75.75 0 0 1 .75-.75ZM14.25 6a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.75h-3V6ZM6 19c0 1.105.269 2.059.75 2.815a8.203 8.203 0 0 0 5.25 0c.481-.756.75-1.71.75-2.815V9H6v10Zm8.25-13.5a.75.75 0 0 1 .75.75v.75h-3V6a.75.75 0 0 1 .75-.75ZM8.494 5.17a3.75 3.75 0 0 1 5.012 0l.593.593a.75.75 0 0 1-1.06 1.06l-.593-.593a2.25 2.25 0 0 0-3.009 0l-.594.593a.75.75 0 0 1-1.06-1.06l.594-.593ZM10.5 3a.75.75 0 0 1 .75.75v.75h-1.5V3.75a.75.75 0 0 1 .75-.75ZM-4.5 0a.75.75 0 0 1 .75.75v.75h-1.5V3.75a.75.75 0 0 1 .75-.75ZM18 9.75h-1.125l-.5-1.5H7.625l-.5 1.5H6a.75.75 0 0 1-.75-.75V8.25h13.5v.75a.75.75 0 0 1-.75.75Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 inline mr-1"
                        >
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.924 2.25 12.767 2.25 9.25c0-5.103 4.14-9.24 9.24-9.24 4.767 0 8.89 3.637 9.24 8.362l.008.003.022.012a15.247 15.247 0 0 1 .383.218 25.18 25.18 0 0 1 4.244 3.17c3.002 3.672 5.439 6.828 5.439 10.33 0 5.103-4.14 9.24-9.24 9.24-4.767 0-8.89-3.637-9.24-8.362z" />
                        </svg>
                        {categoria.cor}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ABA DE PRODUTOS */}
          {abaAdmin === "produtos" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Gerenciar Produtos</h2>

              {/* BARRA DE BUSCA */}
              <div className="mb-4 flex items-center space-x-2">
                <Input
                  type="search"
                  placeholder="Buscar produto..."
                  value={buscaProdutos}
                  onChange={(e) => setBuscaProdutos(e.target.value)}
                />
                <Search className="w-5 h-5 text-gray-500" />
              </div>

              {/* LISTA DE PRODUTOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {produtosFiltrados.map((bebida) => (
                  <Card key={bebida.id}>
                    <CardContent className="p-4">
                      <div className="relative">
                        <Image
                          src={bebida.imagem || "/placeholder.svg"}
                          alt={bebida.nome}
                          width={300}
                          height={200}
                          className="rounded-md object-cover w-full h-48"
                        />
                        <Badge className="absolute top-2 right-2" variant="secondary">
                          R$ {bebida.preco.toFixed(2)}
                        </Badge>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-gray-800">{bebida.nome}</h3>
                      <p className="text-sm text-gray-600">{bebida.descricao}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge className={getStatusEstoque(bebida.estoque).cor}>
                          {getStatusEstoque(bebida.estoque).texto}
                        </Badge>
                        <div>
                          <Button variant="ghost" size="icon" onClick={() => setEditandoItem(bebida)}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.08 2.685a.75.75 0 0 0 .933.933l2.685-.08a5.25 5.25 0 0 0 2.214-1.32L19.513 8.199Z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => excluirBebida(bebida.id)}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.5 5.25a.75.75 0 0 1 .75.75V6h-1.5V5.25a.75.75 0 0 1 .75-.75ZM14.25 6a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.75h-3V6ZM6 19c0 1.105.269 2.059.75 2.815a8.203 8.203 0 0 0 5.25 0c.481-.756.75-1.71.75-2.815V9H6v10Zm8.25-13.5a.75.75 0 0 1 .75.75v.75h-3V6a.75.75 0 0 1 .75-.75ZM8.494 5.17a3.75 3.75 0 0 1 5.012 0l.593.593a.75.75 0 0 1-1.06 1.06l-.593-.593a2.25 2.25 0 0 0-3.009 0l-.594.593a.75.75 0 0 1-1.06-1.06l.594-.593ZM10.5 3a.75.75 0 0 1 .75.75v.75h-1.5V3.75a.75.75 0 0 1 .75-.75ZM-4.5 0a.75.75 0 0 1 .75.75v.75h-1.5V3.75a.75.75 0 0 1 .75-.75ZM18 9.75h-1.125l-.5-1.5H7.625l-.5 1.5H6a.75.75 0 0 1-.75-.75V8.25h13.5v.75a.75.75 0 0 1-.75.75Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ABA DE PEDIDOS */}
          {abaAdmin === "pedidos" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Gerenciar Pedidos</h2>

              {/* FILTROS DE DATA */}
              <div className="mb-4 flex items-center space-x-4">
                <label className="text-gray-700">Filtrar por data:</label>
                <select
                  className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filtroData}
                  onChange={(e) => setFiltroData(e.target.value as "todos" | "semana" | "mes" | "ano")}
                >
                  <option value="todos">Todos</option>
                  <option value="semana">Última semana</option>
                  <option value="mes">Último mês</option>
                  <option value="ano">Último ano</option>
                </select>
              </div>

              {/* LISTA DE PEDIDOS */}
              <div className="overflow-x-auto">
                <table className="min-w-full leading-normal">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Pagamento
                      </th>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Entrega
                      </th>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosFiltrados.map((pedido) => (
                      <tr key={pedido.id}>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                          <p className="text-gray-900 whitespace-no-wrap">{pedido.id}</p>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                          <p className="text-gray-900 whitespace-no-wrap">{pedido.data}</p>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                          <p className="text-gray-900 whitespace-no-wrap">{pedido.cliente}</p>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                          <p className="text-gray-900 whitespace-no-wrap">R$ {pedido.total.toFixed(2)}</p>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                          <p className="text-gray-900 whitespace-no-wrap">{pedido.formaPagamento}</p>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                          <p className="text-gray-900 whitespace-no-wrap">{pedido.tipoEntrega}</p>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                          <Badge>{pedido.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* MODAL DE EDIÇÃO DE BEBIDA */}
        {editandoItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Editar Bebida</h3>
                <div className="px-7 py-3">
                  <Input
                    type="text"
                    placeholder="Nome da bebida"
                    value={editandoItem.nome}
                    onChange={(e) => setEditandoItem({ ...editandoItem, nome: e.target.value })}
                  />
                  <Input
                    type="text"
                    placeholder="Descrição"
                    value={editandoItem.descricao}
                    onChange={(e) => setEditandoItem({ ...editandoItem, descricao: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Preço"
                    value={editandoItem.preco}
                    onChange={(e) => setEditandoItem({ ...editandoItem, preco: Number.parseFloat(e.target.value) })}
                  />
                  <select
                    className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editandoItem.categoria_id}
                    onChange={(e) =>
                      setEditandoItem({ ...editandoItem, categoria_id: Number.parseInt(e.target.value) })
                    }
                  >
                    <option value="">Selecione a categoria</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="Estoque"
                    value={editandoItem.estoque}
                    onChange={(e) => setEditandoItem({ ...editandoItem, estoque: Number.parseInt(e.target.value) })}
                  />
                  <Input type="file" accept="image/*" onChange={handleImageUpload} />
                  {editandoItem.imagem && (
                    <Image
                      src={editandoItem.imagem || "/placeholder.svg"}
                      alt="Imagem da bebida"
                      width={100}
                      height={100}
                      className="rounded-md object-cover"
                    />
                  )}
                </div>
                <div className="items-center px-4 py-3">
                  <Button variant="secondary" className="px-4 py-2 rounded mr-2" onClick={() => setEditandoItem(null)}>
                    Cancelar
                  </Button>
                  <Button className="px-4 py-2 rounded" onClick={editarBebida}>
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE EDIÇÃO DE CATEGORIA */}
        {editandoCategoria && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Editar Categoria</h3>
                <div className="px-7 py-3">
                  <Input
                    type="text"
                    placeholder="Nome da categoria"
                    value={editandoCategoria.nome}
                    onChange={(e) => setEditandoCategoria({ ...editandoCategoria, nome: e.target.value })}
                  />
                  <select
                    className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editandoCategoria.icone}
                    onChange={(e) => setEditandoCategoria({ ...editandoCategoria, icone: e.target.value })}
                  >
                    <option value="">Selecione o ícone</option>
                    {ICONES_CATEGORIAS.map((icone) => (
                      <option key={icone.valor} value={icone.valor}>
                        {icone.nome}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editandoCategoria.cor}
                    onChange={(e) => setEditandoCategoria({ ...editandoCategoria, cor: e.target.value })}
                  >
                    <option value="">Selecione a cor</option>
                    {CORES_CATEGORIAS.map((cor) => (
                      <option key={cor.valor} value={cor.valor}>
                        {cor.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="items-center px-4 py-3">
                  <Button
                    variant="secondary"
                    className="px-4 py-2 rounded mr-2"
                    onClick={() => setEditandoCategoria(null)}
                  >
                    Cancelar
                  </Button>
                  <Button className="px-4 py-2 rounded" onClick={editarCategoria}>
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FORMULÁRIO DE NOVA BEBIDA */}
        <div className="bg-white shadow-md rounded-md p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Adicionar Nova Bebida</h2>
          <Input
            type="text"
            placeholder="Nome da bebida"
            value={novoItem.nome}
            onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Descrição"
            value={novoItem.descricao}
            onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Preço"
            value={novoItem.preco}
            onChange={(e) => setNovoItem({ ...novoItem, preco: e.target.value })}
          />
          <select
            className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={novoItem.categoria_id}
            onChange={(e) => setNovoItem({ ...novoItem, categoria_id: e.target.value })}
          >
            <option value="">Selecione a categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="Estoque"
            value={novoItem.estoque}
            onChange={(e) => setNovoItem({ ...novoItem, estoque: e.target.value })}
          />
          <Input type="file" accept="image/*" onChange={handleImageUpload} />
          {novoItem.imagem && (
            <Image
              src={novoItem.imagem || "/placeholder.svg"}
              alt="Imagem da bebida"
              width={100}
              height={100}
              className="rounded-md object-cover"
            />
          )}
          <Button className="w-full mt-4" onClick={adicionarNovaBebida}>
            Adicionar Bebida
          </Button>
        </div>

        {/* FORMULÁRIO DE NOVA CATEGORIA */}
        <div className="bg-white shadow-md rounded-md p-4 mt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Adicionar Nova Categoria</h2>
          <Input
            type="text"
            placeholder="Nome da categoria"
            value={novaCategoria.nome}
            onChange={(e) => setNovaCategoria({ ...novaCategoria, nome: e.target.value })}
          />
          <select
            className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={novaCategoria.icone}
            onChange={(e) => setNovaCategoria({ ...novaCategoria, icone: e.target.value })}
          >
            <option value="">Selecione o ícone</option>
            {ICONES_CATEGORIAS.map((icone) => (
              <option key={icone.valor} value={icone.valor}>
                {icone.nome}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={novaCategoria.cor}
            onChange={(e) => setNovaCategoria({ ...novaCategoria, cor: e.target.value })}
          >
            <option value="">Selecione a cor</option>
            {CORES_CATEGORIAS.map((cor) => (
              <option key={cor.valor} value={cor.valor}>
                {cor.nome}
              </option>
            ))}
          </select>
          <Button className="w-full mt-4" onClick={adicionarNovaCategoria}>
            Adicionar Categoria
          </Button>
        </div>
      </div>
    )
  }

  // MODAL DE SENHA
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {modalSenhaAberto && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Acesso Administrativo</h3>
              <div className="px-7 py-3">
                <Input
                  type="password"
                  placeholder="Digite a senha"
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                />
              </div>
              <div className="items-center px-4 py-3">
                <Button variant="secondary" className="px-4 py-2 rounded mr-2" onClick={fecharModalSenha}>
                  Cancelar
                </Button>
                <Button className="px-4 py-2 rounded" onClick={processarSenha} disabled={senhaCarregando}>
                  {senhaCarregando ? "Verificando..." : "Acessar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {carregandoInicial ? (
        <div className="flex flex-col items-center justify-center">
          <svg className="animate-spin h-12 w-12 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" fill="currentColor" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Bebidas ON</h1>
          <p className="mt-2 text-gray-600">Aguarde...</p>
        </div>
      )}
    </div>
  )
}
