"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Zap, Shield, Clock } from "lucide-react"

const casosExito = [
  {
    empresa: "Funiversity",
    sector: "Educación Digital",
    problema: "Necesitaba expandirse en LATAM y profesionalizar su gestión interna",
    solucion: "Diseñamos e implementamos una estructura de gestión adaptada a sus operaciones",
    resultado: "Internacionalización exitosa con mayor control y eficiencia",
    mejora: "Expansión LATAM",
    icon: <Globe className="h-5 w-5" />,
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    empresa: "Grupo Green",
    sector: "Soluciones Ambientales",
    problema: "Buscaba mejorar rentabilidad sin comprometer su enfoque sostenible",
    solucion: "Reorganizamos procesos internos e implementamos herramientas digitales",
    resultado: "Reducción de costos innecesarios y mejora en toma de decisiones",
    mejora: "+30% eficiencia",
    icon: <Zap className="h-5 w-5" />,
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    empresa: "Sinlac",
    sector: "Consultoría",
    problema: "Desafío de escalar sin perder control financiero",
    solucion: "Incorporamos automatización en procesos clave con dashboards en tiempo real",
    resultado: "Mejora sustancial en estructura sin aumentar costos fijos",
    mejora: "Control total",
    icon: <Shield className="h-5 w-5" />,
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    empresa: "Estudio Jurídico Vivas",
    sector: "Servicios Legales",
    problema: "Tareas administrativas repetitivas consumían tiempo valioso",
    solucion: "Incorporamos inteligencia artificial para automatizar tareas administrativas",
    resultado: "Disminución de tiempos operativos y mejora en eficiencia",
    mejora: "+60% eficiencia",
    icon: <Clock className="h-5 w-5" />,
    gradient: "from-orange-500/20 to-red-500/20",
  },
]

export function CasosExitoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % casosExito.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + casosExito.length) % casosExito.length)
    setIsAutoPlaying(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % casosExito.length)
    setIsAutoPlaying(false)
  }

  const currentCaso = casosExito[currentIndex]

  return (
    <div className="relative max-w-4xl mx-auto">
      <Card className="bg-card/50 border border-border backdrop-blur-sm hover:border-[#99D0B8]/50 transition-all duration-500 group relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${currentCaso.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        ></div>

        <CardHeader className="relative z-10 pb-2 sm:pb-4">
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-xl sm:text-2xl text-foreground group-hover:text-[#99D0B8] transition-colors duration-300 flex items-center gap-3">
              <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-muted/70 transition-colors duration-300">
                {currentCaso.icon}
              </div>
              {currentCaso.empresa}
            </CardTitle>
            <span className="text-sm bg-[#31AE79]/20 text-[#99D0B8] px-3 py-1 rounded-full whitespace-nowrap ml-4">
              {currentCaso.mejora}
            </span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">{currentCaso.sector}</p>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4 sm:space-y-6">
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-red-400 mb-2">Problema:</h4>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{currentCaso.problema}</p>
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-[#99D0B8] mb-2">Solución:</h4>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{currentCaso.solucion}</p>
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-[#31AE79] mb-2">Resultado:</h4>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{currentCaso.resultado}</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="ghost" size="sm" onClick={goToPrevious} className="text-gray-400 hover:text-[#99D0B8]">
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex gap-2">
          {casosExito.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsAutoPlaying(false)
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-[#31AE79] w-6" : "bg-gray-600"
              }`}
              aria-label={`Ir al caso ${index + 1}`}
            />
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={goToNext} className="text-gray-400 hover:text-[#99D0B8]">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Case Counter */}
      <div className="text-center mt-4">
        <span className="text-sm text-muted-foreground">
          Caso {currentIndex + 1} de {casosExito.length}
        </span>
      </div>
    </div>
  )
}
