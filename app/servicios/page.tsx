"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Settings, Layers, PieChart, Target, Activity, Globe, Menu } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"

export default function ServiciosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header móvil */}
      <header className="sticky top-0 bg-background/90 backdrop-blur-xl border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#99D0B8] to-[#31AE79] bg-clip-text text-transparent">
              Servicios
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/")} className="p-2">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6">
        <AnimatedSection className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Nuestros servicios
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            En Bruck prestamos servicios de consultoría para ayudar a empresas en crecimiento a ordenar su estructura.
          </p>
        </AnimatedSection>

        <div className="space-y-4">
          {[
            {
              icon: <Settings className="h-6 w-6 text-blue-400" />,
              title: "Optimización de Procesos",
              description:
                "Evaluamos y mejoramos los procesos clave de tu empresa, incluyendo compra, venta, facturación y administración.",
            },
            {
              icon: <Layers className="h-6 w-6 text-purple-400" />,
              title: "Reingeniería de Estructuras",
              description:
                "Analizamos y rediseñamos las áreas y estructuras internas para mejorar la cohesión y el rendimiento organizacional.",
            },
            {
              icon: <PieChart className="h-6 w-6 text-green-400" />,
              title: "Análisis de Costos",
              description:
                "Ayudamos a interpretar planillas de costos, identificando los principales porcentajes de erogaciones.",
            },
            {
              icon: <Target className="h-6 w-6 text-orange-400" />,
              title: "Estrategias de Precios",
              description:
                "Desarrollamos estrategias de precios basadas en análisis detallado de costos, competencia y mercado.",
            },
            {
              icon: <Activity className="h-6 w-6 text-teal-400" />,
              title: "Dashboards inteligentes",
              description:
                "Creamos dashboards interactivos que democratizan el acceso a la información dentro de la organización.",
            },
            {
              icon: <Globe className="h-6 w-6 text-indigo-400" />,
              title: "Transformación Digital",
              description: "Impulsamos la integración de tecnologías digitales en tus procesos empresariales.",
            },
          ].map((service, index) => (
            <AnimatedSection key={index} animation="fade-up" delay={index * 100}>
              <Card className="bg-card/50 border border-border backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-muted/50 rounded-lg">{service.icon}</div>
                    <CardTitle className="text-lg text-foreground">{service.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>

        {/* CTA */}
        <AnimatedSection className="mt-12 text-center">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-[#31AE79] to-[#99D0B8] hover:from-[#2a9566] hover:to-[#8bc4a8] text-white shadow-lg"
            onClick={() => (window.location.href = "/#contacto")}
          >
            Solicitar información
          </Button>
        </AnimatedSection>
      </main>
    </div>
  )
}
