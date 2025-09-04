"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Calendar, Clock, Tag } from "lucide-react"

interface BlogModalProps {
  isOpen: boolean
  onClose: () => void
  article: {
    titulo: string
    categoria: string
    fecha: string
    tiempo: string
    resumen: string
    contenido: string
  }
}

export function BlogModal({ isOpen, onClose, article }: BlogModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-900/95 to-black/95 border border-gray-700/50 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-700/50">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#31AE79]/20 text-[#99D0B8]">
                <Tag className="w-3 h-3 mr-1" />
                {article.categoria}
              </span>
              <span className="inline-flex items-center text-xs text-gray-400">
                <Calendar className="w-3 h-3 mr-1" />
                {article.fecha}
              </span>
              <span className="inline-flex items-center text-xs text-gray-400">
                <Clock className="w-3 h-3 mr-1" />
                {article.tiempo}
              </span>
            </div>
            <CardTitle className="text-2xl text-white leading-tight">{article.titulo}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800/50"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <div className="prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: article.contenido }} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
