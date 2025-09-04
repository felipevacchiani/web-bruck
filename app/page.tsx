"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BlogModal } from "@/components/blog-modal"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { AnimatedSection } from "@/components/animated-section"
import { TestimonialCarousel } from "@/components/testimonial-carousel"
import { FAQAccordion } from "@/components/faq-accordion"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { Header } from "@/components/header"
import { blogArticles } from "@/data/blog-articles"
import {
  ArrowRight,
  CheckCircle,
  Globe,
  Settings,
  PieChart,
  Clock,
  Activity,
  Terminal,
  Layers,
  Rocket,
  BarChart3,
  Users,
  Target,
  Trophy,
  BookOpen,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"

// Floating Particles Component (optimized for mobile)
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-[#99D0B8] rounded-full opacity-20 animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  )
}

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return <span>{count}</span>
}

// Business Metrics Dashboard Component (optimized for mobile)
const BusinessMetricsDashboard = () => {
  const [lines, setLines] = useState<string[]>([])
  const metricLines = [
    "✓ Procesos optimizados",
    "✓ Control financiero",
    "✓ Automatización IA",
    "📊 +340% eficiencia",
    "💰 -25% costos",
    "📈 +180% ROI",
  ]

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < metricLines.length) {
        setLines((prev) => [...prev, metricLines[index]])
        index++
      } else {
        setLines([])
        index = 0
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs text-green-400 h-32 sm:h-48 sm:text-sm overflow-hidden border border-gray-700/50 hidden sm:block">
      <div className="flex items-center mb-2">
        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
      {lines.map((line, index) => (
        <div key={index} className="mb-1 animate-pulse">
          {line}
        </div>
      ))}
      <div className="animate-pulse">_</div>
    </div>
  )
}

// Mobile Terminal Component
const MobileTerminal = () => {
  const [lines, setLines] = useState<string[]>([])
  const terminalLines = [
    "✓ Control financiero",
    "✓ Automatización IA",
    "📊 +340% eficiencia",
    "💰 -25% costos",
    "📈 +180% ROI",
  ]

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < terminalLines.length) {
        setLines((prev) => [...prev, terminalLines[index]])
        index++
      } else {
        setLines([])
        index = 0
      }
    }, 800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs text-green-400 h-28 overflow-hidden border border-gray-700/50 sm:hidden mt-5">
      <div className="flex items-center mb-2">
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></div>
        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1"></div>
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
      </div>
      {lines.map((line, index) => (
        <div key={index} className="mb-1 animate-pulse text-xs">
          {line}
        </div>
      ))}
      <div className="animate-pulse">_</div>
    </div>
  )
}

// Personalized Welcome Message
const PersonalizedWelcome = () => {
  const [source, setSource] = useState<string>("")

  useEffect(() => {
    // Detect traffic source
    const referrer = document.referrer
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get("utm_source")

    if (utmSource) {
      setSource(utmSource)
    } else if (referrer.includes("linkedin")) {
      setSource("LinkedIn")
    } else if (referrer.includes("google")) {
      setSource("Google")
    } else if (referrer.includes("facebook")) {
      setSource("Facebook")
    }
  }, [])

  if (!source) return null

  return (
    <div className="bg-gradient-to-r from-[#31AE79]/20 to-[#99D0B8]/20 border border-[#31AE79]/30 rounded-lg p-3 mb-6 animate-in slide-in-from-top-4 duration-500">
      <p className="text-sm text-center text-foreground">
        👋 ¡Bienvenido/a desde <span className="font-semibold text-[#31AE79]">{source}</span>! Descubre cómo podemos
        transformar tu pyme.
      </p>
    </div>
  )
}

export default function BruckWebsiteTech() {
  const [contactForm, setContactForm] = useState({
    nombre: "",
    empresa: "",
    email: "",
    mensaje: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false)

  // Handle blog article click
  const handleArticleClick = (article: any) => {
    setSelectedArticle(article)
    setIsBlogModalOpen(true)
  }

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contactForm.email || !contactForm.nombre || contactForm.mensaje.length < 10) {
      alert("Por favor completa todos los campos. El mensaje debe tener al menos 10 caracteres.")
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitSuccess(true)
      setContactForm({ nombre: "", empresa: "", email: "", mensaje: "" })
      setTimeout(() => setSubmitSuccess(false), 5000)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-300">
      {/* Header */}
      <Header />

      {/* Blog Modal */}
      <BlogModal isOpen={isBlogModalOpen} onClose={() => setIsBlogModalOpen(false)} article={selectedArticle} />

      {/* WhatsApp Button */}
      <WhatsAppButton />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Floating Particles */}
      <FloatingParticles />

      <main>
        {/* Hero Section */}
        <section
          id="home"
          className="px-4 py-24 min-h-[85vh] flex flex-col justify-center relative overflow-hidden scroll-mt-12 sm:scroll-mt-14 lg:scroll-mt-16"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-cyan-900/10"></div>

          <div className="w-full relative z-10">
            <div className="max-w-7xl mx-auto">
              <PersonalizedWelcome />

              <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12 items-center">
                <AnimatedSection className="text-center lg:text-left order-2 lg:order-1">
                  <div className="space-y-8">
                    <h1 className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-semibold leading-snug bg-gradient-to-r from-[#99D0B8] via-purple-500 to-[#31AE79] bg-clip-text text-transparent">
                      En Bruck profesionalizamos áreas administrativas de pymes
                    </h1>

                    <p className="text-base sm:text-base md:text-lg lg:text-xl xl:text-2xl text-muted-foreground leading-relaxed opacity-90">
                      Transformamos su forma de trabajar para que crezcan de manera ordenada y eficiente
                    </p>

                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-[#31AE79] to-[#99D0B8] hover:from-[#2a9566] hover:to-[#8bc4a8] text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg shadow-lg shadow-[#31AE79]/50 hover:shadow-xl hover:shadow-[#31AE79]/70 transition-all duration-300 border border-[#31AE79]/50 group min-h-[44px] rounded-xl"
                      onClick={() => {
                        const element = document.getElementById("contacto")
                        element?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }}
                    >
                      <Rocket className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-bounce flex-shrink-0" />
                      <span className="truncate">Agendá una cita gratuita</span>
                      <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-8">
                    {[
                      { label: "Proyectos", value: 25, suffix: "+" },
                      { label: "Eficiencia", value: 340, suffix: "%" },
                      { label: "ROI", value: 180, suffix: "%" },
                    ].map((stat, index) => (
                      <AnimatedSection
                        key={index}
                        animation="scale-up"
                        delay={index * 100}
                        className="text-center p-2 bg-card/50 rounded-lg border border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-300 sm:p-3 lg:p-4"
                      >
                        <div className="text-base sm:text-xl lg:text-2xl font-bold text-[#99D0B8]">
                          <AnimatedCounter end={stat.value} />
                          {stat.suffix}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground leading-tight">{stat.label}</div>
                      </AnimatedSection>
                    ))}
                  </div>

                  {/* Mobile Terminal */}
                  <MobileTerminal />
                </AnimatedSection>

                {/* Interactive Dashboard */}
                <AnimatedSection animation="slide-left" className="relative order-1 lg:order-2">
                  <BusinessMetricsDashboard />
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-xl animate-pulse hidden sm:block"></div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </section>

        {/* Qué Hacemos Section */}
        <section
          id="que-hacemos"
          className="pt-5 pb-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20 relative scroll-mt-16"
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <AnimatedSection className="text-center mb-6 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-[#99D0B8] bg-clip-text text-transparent">
                  ¿Qué hacemos?
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Especialistas en estructurar el crecimiento de pymes de servicios. Con procesos claros, datos
                  accesibles y tecnología inteligente.
                </p>
              </AnimatedSection>

              <div className="grid gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: <Users className="h-6 w-6 text-[#99D0B8]" />,
                    title: "Entrevista inicial",
                    description: "Una hora gratuita con nuestros expertos para conocer tu negocio y sus desafíos.",
                  },
                  {
                    icon: <Settings className="h-6 w-6 text-purple-400" />,
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
                    icon: <Target className="h-6 w-6 text-orange-400" />,
                    title: "Optimización de procesos",
                    description:
                      "Aplicamos metodologías ágiles y soluciones tecnológicas para mejorar la eficiencia y reducir costos.",
                  },
                  {
                    icon: <PieChart className="h-6 w-6 text-blue-400" />,
                    title: "Control financiero",
                    description:
                      "Te ayudamos a optimizar costos, mejorar márgenes y escalar con estabilidad con herramientas avanzadas.",
                  },
                  {
                    icon: <Globe className="h-6 w-6 text-teal-400" />,
                    title: "Estrategia y acompañamiento",
                    description:
                      "Te acompañamos en el proceso de adopción tecnológica para que tu equipo las aproveche al máximo.",
                  },
                ].map((service, index) => (
                  <AnimatedSection key={index} animation="fade-up" delay={index * 100}>
                    <Card className="bg-card/50 border border-border backdrop-blur-sm h-full">
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
            </div>
          </div>
        </section>

        {/* Servicios Section */}
        <section
          id="servicios"
          className="pt-5 pb-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20 relative scroll-mt-16"
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <AnimatedSection className="text-center mb-6 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Nuestros servicios
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  En Bruck prestamos servicios de consultoría para ayudar a empresas en crecimiento a ordenar su
                  estructura.
                </p>
              </AnimatedSection>

              {/* Versión desktop */}
              <div className="hidden sm:grid gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />,
                    title: "Optimización de Procesos",
                    description:
                      "Evaluamos y mejoramos los procesos clave de tu empresa, incluyendo compra, venta, facturación y administración.",
                    gradient: "from-blue-500/20 to-cyan-500/20",
                  },
                  {
                    icon: <Layers className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />,
                    title: "Reingeniería de Estructuras",
                    description:
                      "Analizamos y rediseñamos las áreas y estructuras internas para mejorar la cohesión y el rendimiento organizacional.",
                    gradient: "from-purple-500/20 to-pink-500/20",
                  },
                  {
                    icon: <PieChart className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />,
                    title: "Análisis de Costos",
                    description:
                      "Ayudamos a interpretar planillas de costos, identificando los principales porcentajes de erogaciones.",
                    gradient: "from-green-500/20 to-emerald-500/20",
                  },
                  {
                    icon: <Target className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />,
                    title: "Estrategias de Precios",
                    description:
                      "Desarrollamos estrategias de precios basadas en análisis detallado de costos, competencia y mercado.",
                    gradient: "from-orange-500/20 to-red-500/20",
                  },
                  {
                    icon: <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-teal-400" />,
                    title: "Dashboards inteligentes",
                    description:
                      "Creamos dashboards interactivos que democratizan el acceso a la información dentro de la organización.",
                    gradient: "from-teal-500/20 to-cyan-500/20",
                  },
                  {
                    icon: <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-400" />,
                    title: "Transformación Digital",
                    description: "Impulsamos la integración de tecnologías digitales en tus procesos empresariales.",
                    gradient: "from-indigo-500/20 to-blue-500/20",
                  },
                ].map((service, index) => (
                  <AnimatedSection key={index} animation="fade-up" delay={index * 100}>
                    <Card className="bg-card/50 border border-border backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20 group relative overflow-hidden transform hover:scale-105 h-full">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      ></div>
                      <CardHeader className="relative z-10 pb-2 sm:pb-4">
                        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-muted/50 rounded-lg w-fit group-hover:bg-muted/70 transition-colors duration-300">
                          {service.icon}
                        </div>
                        <CardTitle className="text-lg sm:text-xl text-foreground group-hover:text-cyan-400 transition-colors duration-300">
                          {service.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 pt-0">
                        <p className="text-sm sm:text-base text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300 leading-relaxed">
                          {service.description}
                        </p>
                      </CardContent>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>

              {/* Versión móvil - Grilla 2x3 */}
              <div className="grid grid-cols-2 gap-4 sm:hidden">
                {[
                  {
                    icon: <Settings className="h-6 w-6 text-blue-400" />,
                    title: "Gestión Empresarial",
                    description: "Optimizamos procesos administrativos y estructuras organizacionales",
                  },
                  {
                    icon: <BarChart3 className="h-6 w-6 text-green-400" />,
                    title: "Análisis de Datos",
                    description: "Transformamos datos en información estratégica para decisiones",
                  },
                  {
                    icon: <Globe className="h-6 w-6 text-purple-400" />,
                    title: "Comercio Internacional",
                    description: "Estrategias para expandir tu negocio a mercados globales",
                  },
                  {
                    icon: <Layers className="h-6 w-6 text-orange-400" />,
                    title: "Transformación Digital",
                    description: "Integramos tecnologías digitales en tus procesos empresariales",
                  },
                  {
                    icon: <Activity className="h-6 w-6 text-teal-400" />,
                    title: "Automatización de Tareas",
                    description: "Automatizamos procesos repetitivos con IA y herramientas digitales",
                  },
                  {
                    icon: <PieChart className="h-6 w-6 text-red-400" />,
                    title: "Control Financiero",
                    description: "Optimizamos costos y mejoramos márgenes con herramientas avanzadas",
                  },
                ].map((service, index) => (
                  <AnimatedSection key={index} animation="fade-up" delay={index * 50}>
                    <Card className="bg-card/50 border border-border backdrop-blur-sm h-full">
                      <CardContent className="p-3 text-center">
                        <div className="flex justify-center mb-2">{service.icon}</div>
                        <h3 className="text-sm font-semibold text-foreground mb-2 leading-tight">{service.title}</h3>
                        <p
                          className="text-xs text-muted-foreground leading-tight line-clamp-2"
                          style={{ fontSize: "14px" }}
                        >
                          {service.description}
                        </p>
                      </CardContent>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Nosotros Section */}
        <section
          id="nosotros"
          className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-muted/20 to-background relative scroll-mt-16"
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <AnimatedSection className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-[#99D0B8] to-[#31AE79] bg-clip-text text-transparent">
                  Nosotros
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Somos un equipo multidisciplinario de profesionales especializados en transformar la gestión
                  administrativa de pymes.
                </p>
              </AnimatedSection>

              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                <AnimatedSection animation="slide-right">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Nuestra Historia</h3>
                  <div className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    <p>
                      BRUCK nació de la necesidad de ayudar a las pymes a profesionalizar sus operaciones sin perder la
                      esencia que las hace únicas.
                    </p>
                    <p>
                      Fundada por un equipo de expertos en administración, contabilidad y procesos empresariales, hemos
                      acompañado a más de 150 empresas en su proceso de crecimiento ordenado.
                    </p>
                    <p>
                      Nuestra experiencia nos ha enseñado que cada pyme tiene desafíos únicos, pero también patrones
                      comunes que podemos optimizar.
                    </p>
                  </div>
                </AnimatedSection>

                <AnimatedSection animation="slide-left">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { value: "+25", label: "Proyectos completados" },
                      { value: "5+", label: "Años de experiencia" },
                      { value: "340%", label: "Mejora promedio" },
                      { value: "25%", label: "Reducción costos" },
                    ].map((stat, index) => (
                      <div
                        key={index}
                        className="bg-card/50 p-4 rounded-lg border border-border backdrop-blur-sm text-center"
                      >
                        <div className="text-2xl font-bold text-[#99D0B8] mb-1">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </section>

        {/* Casos de Éxito Section */}
        <section
          id="casos-de-exito"
          className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20 relative scroll-mt-16"
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <AnimatedSection className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-[#99D0B8] bg-clip-text text-transparent">
                  Casos de Éxito
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Conocé cómo hemos ayudado a otras pymes a transformar sus operaciones y alcanzar sus objetivos.
                </p>
              </AnimatedSection>

              <div className="grid gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    empresa: "Funiversity",
                    sector: "Educación Digital",
                    resultado: "Internacionalización exitosa con mayor control y eficiencia",
                    mejora: "Expansión LATAM",
                    icon: <Globe className="h-5 w-5" />,
                  },
                  {
                    empresa: "Grupo Green",
                    sector: "Soluciones Ambientales",
                    resultado: "Reducción de costos innecesarios y mejora en toma de decisiones",
                    mejora: "+30% eficiencia",
                    icon: <Target className="h-5 w-5" />,
                  },
                  {
                    empresa: "Sinlac",
                    sector: "Consultoría",
                    resultado: "Mejora sustancial en estructura sin aumentar costos fijos",
                    mejora: "Control total",
                    icon: <Trophy className="h-5 w-5" />,
                  },
                ].map((caso, index) => (
                  <AnimatedSection key={index} animation="fade-up" delay={index * 100}>
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
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground leading-relaxed">{caso.resultado}</p>
                      </CardContent>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section - Solo visible en desktop */}
        <section className="hidden sm:block py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20 relative scroll-mt-16">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <AnimatedSection className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-[#31AE79] to-[#99D0B8] bg-clip-text text-transparent">
                  Algunos de nuestros clientes
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Testimonios reales de empresarios que transformaron sus pymes con BRUCK.
                </p>
              </AnimatedSection>

              <AnimatedSection animation="scale-up">
                <TestimonialCarousel />
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Blog Section - Solo visible en desktop */}
        <section
          id="blog"
          className="hidden sm:block py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-muted/20 to-background relative scroll-mt-16"
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <AnimatedSection className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-[#99D0B8] to-[#31AE79] bg-clip-text text-transparent">
                  Blog
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Consejos, tendencias y mejores prácticas para profesionalizar tu pyme y optimizar tus procesos.
                </p>
              </AnimatedSection>

              <div className="grid gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {blogArticles.slice(0, 6).map((articulo, index) => (
                  <AnimatedSection key={index} animation="fade-up" delay={index * 100}>
                    <Card
                      className="bg-card/50 border border-border backdrop-blur-sm hover:border-[#99D0B8]/50 transition-all duration-500 group cursor-pointer h-full"
                      onClick={() => handleArticleClick(articulo)}
                    >
                      <CardHeader className="pb-2 sm:pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs bg-[#31AE79]/20 text-[#99D0B8] px-2 py-1 rounded-full">
                            {articulo.categoria}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {articulo.tiempo}
                          </span>
                        </div>
                        <CardTitle className="text-base sm:text-lg text-foreground group-hover:text-[#99D0B8] transition-colors duration-300 line-clamp-2 leading-tight">
                          {articulo.titulo}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground">{articulo.fecha}</p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-3 sm:mb-4">
                          {articulo.resumen}
                        </p>
                        <div>
                          <span className="text-xs sm:text-sm text-[#99D0B8] font-medium group-hover:text-[#31AE79] transition-colors duration-300">
                            Leer más →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>

              <AnimatedSection className="text-center mt-8 sm:mt-12">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-[#99D0B8]/50 text-[#99D0B8] hover:bg-[#31AE79]/30 hover:border-[#99D0B8] px-6 sm:px-8 py-3 transition-all duration-300 bg-transparent"
                >
                  <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Ver todos los artículos
                </Button>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* FAQ Section - Solo visible en desktop */}
        <section className="hidden sm:block py-12 sm:py-16 lg:py-20 bg-background relative scroll-mt-16">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <AnimatedSection className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-[#99D0B8] bg-clip-text text-transparent">
                  Preguntas Frecuentes
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Resolvemos las dudas más comunes sobre nuestros servicios y metodología.
                </p>
              </AnimatedSection>

              <AnimatedSection animation="fade-up">
                <FAQAccordion />
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Diagnóstico Section */}
        <section
          id="diagnostico"
          className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20 relative scroll-mt-16"
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <AnimatedSection className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-[#99D0B8] bg-clip-text text-transparent">
                  Diagnóstico Gratuito
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Evaluá el estado actual de tu pyme y descubrí oportunidades de mejora con nuestro diagnóstico
                  gratuito.
                </p>
              </AnimatedSection>

              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                <AnimatedSection animation="slide-right" className="order-2 lg:order-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">
                    ¿Qué incluye nuestro diagnóstico?
                  </h3>

                  {/* Versión desktop - texto completo */}
                  <div className="hidden sm:block space-y-3 sm:space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 sm:mb-8">
                    <p>
                      Completá el formulario del área que más te interese o el general para recibir un diagnóstico
                      express.
                    </p>
                    <p>
                      Podés enfocarte en una temática puntual como <span className="text-[#99D0B8]">Marketing</span>,{" "}
                      <span className="text-[#99D0B8]">Costos y Finanzas</span>,{" "}
                      <span className="text-[#99D0B8]">Recursos Humanos</span>,{" "}
                      <span className="text-[#99D0B8]">Dirección Estratégica</span>,{" "}
                      <span className="text-[#99D0B8]">Tecnología</span> o{" "}
                      <span className="text-[#99D0B8]">Procesos y Gestión</span>.
                    </p>
                    <p>
                      También podés elegir el <span className="text-[#31AE79] font-semibold">diagnóstico integral</span>{" "}
                      que evalúa todas las áreas clave de tu empresa.
                    </p>
                  </div>

                  {/* Versión móvil - texto resumido */}
                  <div className="sm:hidden text-sm text-muted-foreground leading-relaxed mb-6">
                    <p>
                      Completá el formulario para recibir un diagnóstico express personalizado para tu empresa.
                      Evaluamos todas las áreas clave y te entregamos un reporte con recomendaciones concretas.
                    </p>
                  </div>

                  {/* Versión desktop - lista completa */}
                  <div className="hidden sm:block space-y-4 sm:space-y-6">
                    {[
                      {
                        icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-[#31AE79]" />,
                        titulo: "Análisis de procesos administrativos",
                        descripcion:
                          "Evaluamos la eficiencia de tus procesos actuales y identificamos cuellos de botella.",
                      },
                      {
                        icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-[#31AE79]" />,
                        titulo: "Revisión de estructura de costos",
                        descripcion:
                          "Analizamos tu estructura de costos y identificamos oportunidades de optimización.",
                      },
                      {
                        icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-[#31AE79]" />,
                        titulo: "Evaluación de controles internos",
                        descripcion: "Revisamos tus controles internos y sistemas de información gerencial.",
                      },
                      {
                        icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-[#31AE79]" />,
                        titulo: "Identificación de automatizaciones",
                        descripcion: "Detectamos tareas que pueden automatizarse para ganar eficiencia.",
                      },
                      {
                        icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-[#31AE79]" />,
                        titulo: "Reporte con recomendaciones",
                        descripcion: "Recibís un reporte detallado con recomendaciones priorizadas y plan de acción.",
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 sm:space-x-4">
                        <div className="flex-shrink-0 mt-1">{item.icon}</div>
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                            {item.titulo}
                          </h4>
                          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {item.descripcion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-[#31AE79]/20 to-[#99D0B8]/20 rounded-lg border border-[#31AE79]/30">
                    <h4 className="text-base sm:text-lg font-semibold text-[#99D0B8] mb-2">
                      💡 Completamente Gratuito
                    </h4>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Este diagnóstico no tiene costo y no genera ningún compromiso. Es nuestra forma de conocer tu
                      empresa y mostrarte el valor que podemos aportar.
                    </p>
                  </div>
                </AnimatedSection>

                <AnimatedSection animation="slide-left" className="order-1 lg:order-2">
                  <Card className="bg-card/50 border border-border backdrop-blur-sm">
                    <CardHeader className="pb-4 sm:pb-6">
                      <CardTitle className="text-lg sm:text-xl text-foreground text-center">
                        Solicitá tu diagnóstico gratuito
                      </CardTitle>
                      <p className="text-sm sm:text-base text-muted-foreground text-center">
                        Completá el formulario y nos contactaremos en 24hs
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-3 sm:space-y-4">
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
                            <Input className="w-full bg-background border-border text-foreground focus:border-[#99D0B8] focus:ring-[#99D0B8] text-sm sm:text-base" />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Empresa *</label>
                            <Input className="w-full bg-background border-border text-foreground focus:border-[#99D0B8] focus:ring-[#99D0B8] text-sm sm:text-base" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Sector</label>
                            <Input className="w-full bg-background border-border text-foreground focus:border-[#99D0B8] focus:ring-[#99D0B8] text-sm sm:text-base" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Cantidad de empleados
                          </label>
                          <select className="w-full bg-background border border-border text-foreground focus:border-[#99D0B8] focus:ring-[#99D0B8] rounded-md px-3 py-2 text-sm sm:text-base">
                            <option value="">Seleccionar...</option>
                            <option value="1-5">1-5 empleados</option>
                            <option value="6-15">6-15 empleados</option>
                            <option value="16-30">16-30 empleados</option>
                            <option value="31-50">31-50 empleados</option>
                            <option value="50+">Más de 50 empleados</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Área de interés *</label>
                          <select className="w-full bg-background border border-border text-foreground focus:border-[#99D0B8] focus:ring-[#99D0B8] rounded-md px-3 py-2 text-sm sm:text-base">
                            <option value="">Seleccionar área...</option>
                            <option value="marketing">Marketing</option>
                            <option value="costos-finanzas">Costos y Finanzas</option>
                            <option value="recursos-humanos">Recursos Humanos</option>
                            <option value="direccion-estrategica">Dirección Estratégica</option>
                            <option value="tecnologia">Tecnología</option>
                            <option value="procesos-gestion">Procesos y Gestión</option>
                            <option value="integral">Diagnóstico Integral</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Principal desafío actual *
                          </label>
                          <Textarea
                            rows={3}
                            placeholder="Ej: Tenemos problemas para controlar los costos por proyecto..."
                            className="w-full bg-background border-border text-foreground focus:border-[#99D0B8] focus:ring-[#99D0B8] text-sm sm:text-base"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-[#31AE79] to-[#99D0B8] hover:from-[#2a9566] hover:to-[#8bc4a8] shadow-lg shadow-[#31AE79]/50 hover:shadow-xl hover:shadow-[#31AE79]/70 transition-all duration-300 text-sm sm:text-base group"
                        >
                          <Activity className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse" />
                          Solicitar diagnóstico gratuito
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section
          id="contacto"
          className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-muted/20 to-background relative scroll-mt-16"
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Información de contacto */}
                <AnimatedSection animation="slide-right" className="order-1 lg:order-1">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-[#99D0B8] to-[#31AE79] bg-clip-text text-transparent">
                    Contacto
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                    Estamos esperando tu mensaje. Completá el formulario y un experto del equipo te responderá para
                    ayudarte.
                  </p>

                  {/* Información de contacto - Solo visible en desktop */}
                  <div className="hidden sm:block space-y-3 sm:space-y-4">
                    <div className="flex items-center p-3 sm:p-4 bg-card/50 rounded-lg border border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-300">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-[#99D0B8] mr-3 flex-shrink-0" />
                      <a
                        href="https://wa.me/5493515182932?text=Hola! Me interesa conocer más sobre los servicios de BRUCK para profesionalizar mi pyme."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm sm:text-base text-foreground hover:text-[#99D0B8] transition-colors"
                      >
                        +54 9 3515 18-2932
                      </a>
                    </div>
                    <div className="flex items-center p-3 sm:p-4 bg-card/50 rounded-lg border border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-300">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-[#99D0B8] mr-3 flex-shrink-0" />
                      <a
                        href="mailto:contacto@somosbruck.com"
                        className="text-sm sm:text-base text-foreground hover:text-[#99D0B8] transition-colors"
                      >
                        contacto@somosbruck.com
                      </a>
                    </div>
                    <div className="flex items-center p-3 sm:p-4 bg-card/50 rounded-lg border border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-300">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#99D0B8] mr-3 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-foreground">Córdoba, Argentina</span>
                    </div>
                  </div>
                </AnimatedSection>

                {/* Formulario */}
                <AnimatedSection animation="slide-left" className="order-2 lg:order-2">
                  <Card className="bg-card/50 border border-border backdrop-blur-sm">
                    <CardHeader className="pb-4 sm:pb-6">
                      <CardTitle className="text-lg sm:text-xl text-foreground">Envíanos un mensaje</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {submitSuccess && (
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-900/50 border border-green-500/50 rounded-lg flex items-center backdrop-blur-sm">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-2 flex-shrink-0" />
                          <span className="text-sm sm:text-base text-green-300">
                            ¡Mensaje enviado exitosamente! Te contactaremos pronto.
                          </span>
                        </div>
                      )}

                      <form onSubmit={handleContactSubmit} className="space-y-3 sm:space-y-4">
                        <div>
                          <label htmlFor="nombre" className="block text-sm font-medium text-foreground mb-1">
                            Nombre *
                          </label>
                          <Input
                            id="nombre"
                            type="text"
                            value={contactForm.nombre}
                            onChange={(e) => setContactForm({ ...contactForm, nombre: e.target.value })}
                            required
                            className="w-full bg-background border-border text-foreground focus:border-[#99D0B8] focus:ring-[#99D0B8] text-sm sm:text-base"
                          />
                        </div>

                        <div>
                          <label htmlFor="empresa" className="block text-sm font-medium text-foreground mb-1">
                            Empresa
                          </label>
                          <Input
                            id="empresa"
                            type="text"
                            value={contactForm.empresa}
                            onChange={(e) => setContactForm({ ...contactForm, empresa: e.target.value })}
                            className="w-full bg-background border-border text-foreground focus:border-[#99D0B8] focus:ring-[#99D0B8] text-sm sm:text-base"
                          />
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                            Email *
                          </label>
                          <Input
                            id="email"
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            required
                            className="w-full bg-background border-border text-foreground focus:border-[#99D0B8] focus:ring-[#99D0B8] text-sm sm:text-base"
                          />
                        </div>

                        <div>
                          <label htmlFor="mensaje" className="block text-sm font-medium text-foreground mb-1">
                            Mensaje * (mínimo 10 caracteres)
                          </label>
                          <Textarea
                            id="mensaje"
                            value={contactForm.mensaje}
                            onChange={(e) => setContactForm({ ...contactForm, mensaje: e.target.value })}
                            required
                            minLength={10}
                            rows={4}
                            className="w-full bg-background border-border text-foreground focus:border-[#99D0B8] focus:ring-[#99D0B8] text-sm sm:text-base"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-[#99D0B8] to-[#31AE79] hover:from-[#8bc4a8] hover:to-[#2a9566] shadow-lg shadow-[#31AE79]/50 hover:shadow-xl hover:shadow-[#31AE79]/70 transition-all duration-300 text-sm sm:text-base group"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Clock className="mr-2 h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              Enviar mensaje
                              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8 sm:py-12 no-print">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-[#99D0B8] via-purple-500 to-[#31AE79] bg-clip-text text-transparent">
                BRUCK
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                Profesionalizamos pymes para que crezcan de manera ordenada y eficiente.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const element = document.getElementById("contacto")
                    element?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="w-full sm:w-auto border-[#99D0B8]/50 text-[#99D0B8] hover:bg-[#31AE79]/30 hover:border-[#99D0B8] transition-all duration-300 text-sm sm:text-base"
                >
                  <Terminal className="mr-2 h-4 w-4" />
                  Contactar ahora
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const element = document.getElementById("diagnostico")
                    element?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="w-full sm:w-auto border-purple-500/50 text-purple-400 hover:bg-purple-900/30 hover:border-purple-400 transition-all duration-300 text-sm sm:text-base"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Solicitar diagnóstico
                </Button>
              </div>
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
                <p className="text-muted-foreground text-xs sm:text-sm">© 2024 BRUCK. Todos los derechos reservados.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
