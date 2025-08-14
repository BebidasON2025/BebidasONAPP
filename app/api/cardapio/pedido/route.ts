export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validação dos dados recebidos do cardápio
    const {
      cliente_nome,
      cliente_telefone,
      cliente_endereco,
      items, // [{ produto_id, quantidade, preco, nome_produto }]
      metodo_pagamento = "Dinheiro",
      observacoes = "",
    } = body

    if (!cliente_nome || !items || items.length === 0) {
      return Response.json(
        {
          ok: false,
          error: "Nome do cliente e itens são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Conectar ao Supabase
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Verificar estoque disponível
    const produtoIds = items.map((item: any) => item.produto_id)
    const { data: produtos, error: produtosError } = await supabase
      .from("produtos")
      .select("id, nome, estoque")
      .in("id", produtoIds)

    if (produtosError) {
      return Response.json(
        {
          ok: false,
          error: "Erro ao verificar produtos",
        },
        { status: 500 },
      )
    }

    // Verificar se há estoque suficiente
    for (const item of items) {
      const produto = produtos?.find((p) => p.id === item.produto_id)
      if (!produto) {
        return Response.json(
          {
            ok: false,
            error: `Produto ${item.nome_produto} não encontrado`,
          },
          { status: 400 },
        )
      }
      if (produto.estoque < item.quantidade) {
        return Response.json(
          {
            ok: false,
            error: `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}`,
          },
          { status: 400 },
        )
      }
    }

    // Gerar número do pedido
    const { data: lastOrder } = await supabase
      .from("pedidos")
      .select("numero_pedido")
      .order("numero_pedido", { ascending: false })
      .limit(1)

    const lastNumber = lastOrder?.[0]?.numero_pedido
      ? Number.parseInt(lastOrder[0].numero_pedido.replace("VENDA", ""))
      : 0
    const numeroVenda = `VENDA${String(lastNumber + 1).padStart(5, "0")}`

    // Calcular total
    const total = items.reduce((sum: number, item: any) => sum + item.preco * item.quantidade, 0)

    // Criar o pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        numero_pedido: numeroVenda,
        cliente_nome_texto: cliente_nome,
        telefone: cliente_telefone,
        endereco: cliente_endereco,
        metodo: metodo_pagamento,
        status: "pendente",
        total: total,
        observacoes: observacoes,
        origem: "cardapio", // Identificar origem do pedido
      })
      .select()
      .single()

    if (pedidoError) {
      return Response.json(
        {
          ok: false,
          error: "Erro ao criar pedido",
        },
        { status: 500 },
      )
    }

    // Criar itens do pedido e atualizar estoque
    for (const item of items) {
      // Inserir item do pedido
      await supabase.from("itens_pedido").insert({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        qtd: item.quantidade,
        preco: item.preco,
      })

      // Atualizar estoque
      await supabase
        .from("produtos")
        .update({
          estoque: supabase.raw(`estoque - ${item.quantidade}`),
        })
        .eq("id", item.produto_id)
    }

    // Criar lançamento financeiro
    await supabase.from("lancamentos_financeiros").insert({
      descricao: `${numeroVenda} - Pedido do cardápio`,
      categoria: "Vendas",
      metodo: metodo_pagamento,
      valor: total,
      tipo: "entrada",
    })

    return Response.json({
      ok: true,
      pedido: {
        id: pedido.id,
        numero: numeroVenda,
        total: total,
        status: "pendente",
      },
    })
  } catch (error) {
    console.error("Erro na integração do cardápio:", error)
    return Response.json(
      {
        ok: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
