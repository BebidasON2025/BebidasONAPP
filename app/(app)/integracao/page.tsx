import { IntegrationGuide } from "@/components/integration-guide"

export default function IntegracaoPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Integração com Cardápio</h1>
        <p className="text-muted-foreground">
          Configure a integração entre seu cardápio digital e o sistema de delivery
        </p>
      </div>

      <IntegrationGuide />
    </div>
  )
}
