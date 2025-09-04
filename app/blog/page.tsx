"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Menu } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"
import { BlogModal } from "@/components/blog-modal"
import { blogArticles } from "@/data/blog-articles"

export default function BlogPage() {
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false)

  const handleArticleClick = (article: any) => {
    setSelectedArticle(article)
    setIsBlogModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Blog Modal */}
      <BlogModal isOpen={isBlogModalOpen} onClose={() => setIsBlogModalOpen(false)} article={selectedArticle} />

      {/* Header móvil */}
      <header className="sticky top-0 bg-background/90 backdrop-blur-xl border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#99D0B8] to-[#31AE79] bg-clip-text text-transparent">
              Blog
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
            Blog
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Consejos, tendencias y mejores prácticas para profesionalizar tu pyme y optimizar tus procesos.
          </p>
        </AnimatedSection>

        <div className="space-y-4">
          {blogArticles.map((articulo, index) => (
            <AnimatedSection key={index} animation="fade-up" delay={index * 50}>
              <Card
                className="bg-card/50 border border-border backdrop-blur-sm cursor-pointer hover:border-[#99D0B8]/50 transition-all duration-300"
                onClick={() => handleArticleClick(articulo)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs bg-[#31AE79]/20 text-[#99D0B8] px-2 py-1 rounded-full">
                      {articulo.categoria}
                    </span>
                    <span className="text-xs text-muted-foreground">{articulo.tiempo}</span>
                  </div>
                  <CardTitle className="text-base text-foreground line-clamp-2 leading-tight">
                    {articulo.titulo}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{articulo.fecha}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-3">{articulo.resumen}</p>
                  <span className="text-sm text-[#99D0B8] font-medium">Leer más →</span>
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
            ¿Te interesa nuestro contenido?
          </Button>
        </AnimatedSection>
      </main>
    </div>
  )
}
