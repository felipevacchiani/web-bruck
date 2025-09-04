"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Settings, PieChart, BarChart3, Menu } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"

export default function NosotrosPage() {
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
              Nosotros
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/")} className="p-2">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6">
        <AnimatedSection className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#99D0B8] to-[#31AE79] bg-clip-text text-transparent">
            Nosotros
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Somos un equipo multidisciplinario de profesionales especializados en transformar la gestión administrativa
            de pymes.
          </p>
        </AnimatedSection>

        {/* Nuestra Historia */}
        <AnimatedSection className="mb-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Nuestra Historia</h3>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              BRUCK nació de la necesidad de ayudar a las pymes a profesionalizar sus operaciones sin perder la esencia
              que las hace únicas.
            </p>
            <p>
              Fundada por un equipo de expertos en administración, contabilidad y procesos empresariales, hemos
              acompañado a más de 150 empresas en su proceso de crecimiento ordenado.
            </p>
            <p>
              Nuestra experiencia nos ha enseñado que cada pyme tiene desafíos únicos, pero también patrones comunes que
              podemos optimizar.
            </p>
          </div>
        </AnimatedSection>

        {/* Estadísticas */}
        <AnimatedSection className="mb-8">
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "+25", label: "Proyectos completados" },
              { value: "5+", label: "Años de experiencia" },
              { value: "340%", label: "Mejora promedio" },
              { value: "25%", label: "Reducción costos" },
            ].map((stat, index) => (
              <div key={index} className="bg-card/50 p-4 rounded-lg border border-border backdrop-blur-sm text-center">
                <div className="text-2xl font-bold text-[#99D0B8] mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Nuestro Equipo */}
        <AnimatedSection className="mb-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Nuestro Equipo</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Contamos con profesionales especializados en diferentes áreas: contadores, administradores, analistas de
            datos, especialistas en procesos y consultores en transformación digital.
          </p>

          <div className="space-y-4">
            {[
              {
                area: "Administración y Procesos",
                description:
                  "Especialistas en optimización de procesos administrativos y estructuración organizacional.",
                icon: <Settings className="h-6 w-6 text-[#99D0B8]" />,
              },
              {
                area: "Finanzas y Contabilidad",
                description: "Contadores y analistas financieros expertos en control de costos y rentabilidad.",
                icon: <PieChart className="h-6 w-6 text-[#31AE79]" />,
              },
              {
                area: "Análisis de Datos",
                description:
                  "Analistas especializados en transformar datos en información estratégica para la toma de decisiones.",
                icon: <BarChart3 className="h-6 w-6 text-purple-400" />,
              },
            ].map((team, index) => (
              <AnimatedSection key={index} animation="fade-up" delay={index * 100}>
                <Card className="bg-card/50 border border-border backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted/50 rounded-lg flex-shrink-0">{team.icon}</div>
                      <div>
                        <h4 className="text-base font-semibold text-foreground mb-2">{team.area}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{team.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection className="text-center">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-[#31AE79] to-[#99D0B8] hover:from-[#2a9566] hover:to-[#8bc4a8] text-white shadow-lg"
            onClick={() => (window.location.href = "/#contacto")}
          >
            Conocé más sobre nuestros servicios
          </Button>
        </AnimatedSection>
      </main>
    </div>
  )
}
