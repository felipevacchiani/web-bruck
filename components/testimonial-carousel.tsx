"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const testimonials = [
  {
    id: 1,
    name: "Funiversity",
    company: "Funiversity",
    role: "Educación Digital",
    content:
      "BRUCK nos ayudó a internacionalizar nuestra empresa con una estructura sólida. Ahora operamos en toda LATAM con total control y eficiencia.",
    rating: 5,
  },
  {
    id: 2,
    name: "Facundo Cuneo",
    company: "Grupo Green",
    role: "Director Operativo",
    content:
      "La optimización de procesos que implementaron nos permitió reducir costos sin comprometer nuestro enfoque sostenible.",
    rating: 5,
  },
  {
    id: 3,
    name: "Yamila Cravero",
    company: "Sinlac",
    role: "Fundadora",
    content:
      "Los dashboards en tiempo real nos dieron el control financiero que necesitábamos para escalar sin riesgos.",
    rating: 5,
  },
  {
    id: 4,
    name: "Nicolás Vivas",
    company: "Estudio Jurídico Vivas",
    role: "Director",
    content:
      "Logramos automatizar tareas administrativas y disminuir tiempos operativos, lo que nos permite enfocarnos en lo que realmente importa: nuestros clientes.",
    rating: 5,
  },
]

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    setIsAutoPlaying(false)
  }

  return (
    <div className="relative max-w-4xl mx-auto">
      <Card className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex mb-4">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            <blockquote className="text-lg sm:text-xl text-gray-300 mb-6 leading-relaxed">
              "{testimonials[currentIndex].content}"
            </blockquote>

            <div className="text-center">
              <div className="font-semibold text-white text-lg mb-1">{testimonials[currentIndex].name}</div>
              <div className="text-sm text-gray-400">
                {testimonials[currentIndex].role} en {testimonials[currentIndex].company}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="ghost" size="sm" onClick={goToPrevious} className="text-gray-400 hover:text-[#99D0B8]">
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsAutoPlaying(false)
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-[#31AE79] w-6" : "bg-gray-600"
              }`}
              aria-label={`Ir al testimonio ${index + 1}`}
            />
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={goToNext} className="text-gray-400 hover:text-[#99D0B8]">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
