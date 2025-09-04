"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const faqs = [
  {
    question: "¿Trabajan con empresas de todos los tamaños?",
    answer:
      "Nos especializamos en pymes de 5 a 50 empleados. Este rango nos permite ofrecer soluciones personalizadas y mantener un acompañamiento cercano durante todo el proceso de transformación.",
  },
  {
    question: "¿Qué incluye el diagnóstico gratuito?",
    answer:
      "El diagnóstico incluye una evaluación completa de tus procesos actuales, análisis de estructura de costos, identificación de cuellos de botella y un reporte detallado con recomendaciones priorizadas y plan de acción.",
  },
  {
    question: "¿Necesito conocimientos técnicos para implementar las mejoras?",
    answer:
      "No es necesario. Nos encargamos de toda la implementación técnica y capacitamos a tu equipo para que puedan usar las nuevas herramientas de manera efectiva. Nuestro acompañamiento es integral.",
  },
  {
    question: "¿Qué nos diferencia de otros consultores?",
    answer:
      "Somos consultores con acompañamiento constante. No solo implementamos soluciones, sino que te acompañamos en cada paso del proceso. Ofrecemos diferentes planes de soporte continuo que incluyen monitoreo de métricas, ajustes según necesidades cambiantes y acceso directo a nuestro equipo para consultas y optimizaciones adicionales.",
  },
]

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <Card
          key={index}
          className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-700/50 backdrop-blur-sm hover:border-[#99D0B8]/50 transition-all duration-300"
        >
          <CardContent className="p-0">
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-800/30 transition-colors duration-200"
              aria-expanded={openIndex === index}
            >
              <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
              <ChevronDown
                className={`h-5 w-5 text-[#99D0B8] transition-transform duration-300 flex-shrink-0 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-6 pb-6">
                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
