"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Users,
  Brain,
  BarChart3,
  Cpu,
  TrendingUp,
  Network,
  Lightbulb,
  Rocket,
  Database,
  Menu,
} from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"

const servicios = [
  {
    icon: <Users className="h-6 w-6 text-[#99D0B8]" />,
    title: "Entrevista inicial",
    description: "Una hora gratuita con nuestros expertos para conocer tu negocio y sus desafíos.",
  },
  {
    icon: <Brain className="h-6 w-6 text-purple-400" />,
    title: "Automatización de tareas",
    description:
      "Incorporamos inteligencia artificial, automatización y herramientas digitales para optimizar tu gestión.",
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-[#31AE79]" />,
    title: "Análisis de datos",
    description:
      "Evaluamos información clave para identificar oportunidades de mejora con dashboards y reportes inteligentes.",
  },
  {
    icon: <Cpu className="h-6 w-6 text-orange-400" />,
    title: "Optimización de procesos",
    description: "Aplicamos metodologías ágiles y soluciones tecnológicas para mejorar la eficiencia y reducir costos.",
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-blue-400" />,
    title: "Control financiero",
    description:
      "Te ayudamos a optimizar costos, mejorar márgenes y escalar con estabilidad con herramientas avanzadas.",
  },
  {
    icon: <Network className="h-6 w-6 text-teal-400" />,
    title: "Estrategia y acompañamiento",
    description: "Te acompañamos en el proceso de adopción tecnológica para que tu equipo las aproveche al máximo.",
  },
]

const adnTraits = [
  {
    icon: <Lightbulb className="h-6 w-6 text-yellow-400" />,
    title: "Nerds de la transformación",
    description: "Nos obsesionamos con la innovación, la tecnología y la eficiencia.",
  },
  {
    icon: <Rocket className="h-6 w-6 text-green-400" />,
    title: "Apasionados por crecer",
    description: "Buscamos que cada mejora impulse tu negocio de manera sostenible.",
  },
  {
    icon: <Database className="h-6 w-6 text-purple-400" />,
    title: "Expertos en datos",
    description: "Utilizamos análisis avanzados para respaldar cada estrategia con información real.",
  },
  {
    icon: <Users className="h-6 w-6 text-blue-400" />,
    title: "Acompañamiento constante",
    description: "Nunca te dejamos solo. Estamos a tu lado en cada paso del proceso de transformación.",
  },
]

export default function QueHacemosPage() {
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
              ¿Qué hacemos?
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
            ¿Qué hacemos?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Especialistas en estructurar el crecimiento de pymes de servicios. Con procesos claros, datos accesibles y
            tecnología inteligente.
          </p>
        </AnimatedSection>

        <div className="space-y-4">
          {servicios.map((service, index) => (
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

        {/* ADN Bruck */}
        <AnimatedSection className="mt-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              ADN Bruck
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              En el corazón de todo lo que hacemos, está la pasión por transformar, crecer y tomar decisiones
              informadas.
            </p>
          </div>

          <div className="space-y-4">
            {adnTraits.map((trait, index) => (
              <AnimatedSection key={index} animation="fade-up" delay={index * 100}>
                <Card className="bg-card/50 border border-border backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted/50 rounded-lg flex-shrink-0">{trait.icon}</div>
                      <div>
                        <h4 className="text-base font-semibold text-foreground mb-2">{trait.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{trait.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection className="mt-12 text-center">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-[#31AE79] to-[#99D0B8] hover:from-[#2a9566] hover:to-[#8bc4a8] text-white shadow-lg"
            onClick={() => (window.location.href = "/#contacto")}
          >
            Quiero transformar mi empresa
          </Button>
        </AnimatedSection>
      </main>
    </div>
  )
}
