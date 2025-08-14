export async function GET() {
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Buscar produtos disponíveis (com estoque > 0)
    const { data: produtos, error } = await supabase
      .from("produtos")
      .select(`
        id,
        nome,
        preco,
        estoque,
        categoria,
        descricao,
        imagem_url,
        ativo
      `)
      .eq("ativo", true)
      .gt("estoque", 0)
      .order("categoria")
      .order("nome")

    if (error) {
      return Response.json(
        {
          ok: false,
          error: "Erro ao buscar produtos",
        },
        { status: 500 },
      )
    }

    // Agrupar produtos por categoria
    const produtosPorCategoria = produtos?.reduce((acc: any, produto) => {
      const categoria = produto.categoria || "Outros"
      if (!acc[categoria]) {
        acc[categoria] = []
      }
      acc[categoria].push(produto)
      return acc
    }, {})

    return Response.json({
      ok: true,
      produtos: produtos,
      produtosPorCategoria: produtosPorCategoria,
    })
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    return Response.json(
      {
        ok: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
