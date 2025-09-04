"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Globe, Zap, Shield, Clock, Menu } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"

const casosExito = [
  {
    empresa: "Funiversity",
    sector: "Educación Digital",
    problema: "Necesitaba expandirse en LATAM y profesionalizar su gestión interna",
    solucion: "Diseñamos e implementamos una estructura de gestión adaptada a sus operaciones",
    resultado: "Internacionalización exitosa con mayor control y eficiencia",
    mejora: "Expansión LATAM",
    icon: <Globe className="h-5 w-5" />,
  },
  {
    empresa: "Grupo Green",
    sector: "Soluciones Ambientales",
    problema: "Buscaba mejorar rentabilidad sin comprometer su enfoque sostenible",
    solucion: "Reorganizamos procesos internos e implementamos herramientas digitales",
    resultado: "Reducción de costos innecesarios y mejora en toma de decisiones",
    mejora: "+30% eficiencia",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    empresa: "Sinlac",
    sector: "Consultoría",
    problema: "Desafío de escalar sin perder control financiero",
    solucion: "Incorporamos automatización en procesos clave con dashboards en tiempo real",
    resultado: "Mejora sustancial en estructura sin aumentar costos fijos",
    mejora: "Control total",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    empresa: "Estudio Jurídico Vivas",
    sector: "Servicios Legales",
    problema: "Tareas administrativas repetitivas consumían tiempo valioso",
    solucion: "Incorporamos inteligencia artificial para automatizar tareas administrativas",
    resultado: "Disminución de tiempos operativos y mejora en eficiencia",
    mejora: "+60% eficiencia",
    icon: <Clock className="h-5 w-5" />,
  },
]

export default function CasosExitoPage() {
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
              Casos de Éxito
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/")} className="p-2">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6">
        <AnimatedSection className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-[#99D0B8] bg-clip-text text-transparent">
            Casos de Éxito
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Conocé cómo hemos ayudado a otras pymes a transformar sus operaciones y alcanzar sus objetivos.
          </p>
        </AnimatedSection>

        {/* Carrusel horizontal para móvil */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 w-max">
            {casosExito.map((caso, index) => (
              <div key={index} className="w-80 flex-shrink-0">
                <Card className="bg-card/50 border border-border backdrop-blur-sm h-full">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted/50 rounded-lg">{caso.icon}</div>
                        <div>
                          <CardTitle className="text-lg text-foreground">{caso.empresa}</CardTitle>
                          <p className="text-sm text-muted-foreground">{caso.sector}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-[#31AE79]/20 text-[#99D0B8] px-2 py-1 rounded-full">
                        {caso.mejora}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-red-400 mb-2">Problema:</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{caso.problema}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#99D0B8] mb-2">Solución:</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{caso.solucion}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#31AE79] mb-2">Resultado:</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{caso.resultado}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <AnimatedSection className="mt-12 text-center">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-[#31AE79] to-[#99D0B8] hover:from-[#2a9566] hover:to-[#8bc4a8] text-white shadow-lg"
            onClick={() => (window.location.href = "/#contacto")}
          >
            Quiero resultados como estos
          </Button>
        </AnimatedSection>
      </main>
    </div>
  )
}
