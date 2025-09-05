"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X, ArrowLeft, Home, Users, Target, Trophy, BookOpen, Phone, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  action?: "scroll" | "navigate" | "submenu"
  href?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  { id: "home", label: "Home", icon: <Home className="h-4 w-4" />, action: "navigate", href: "/" },
  { id: "que-hacemos", label: "Qué hacemos", icon: <Target className="h-4 w-4" />, action: "scroll" },
  { id: "servicios", label: "Servicios", icon: <Settings className="h-4 w-4" />, action: "scroll" },
  { id: "nosotros", label: "Nosotros", icon: <Users className="h-4 w-4" />, action: "scroll" },
  { id: "casos-de-exito", label: "Casos de éxito", icon: <Trophy className="h-4 w-4" />, action: "scroll" },
  { id: "blog", label: "Blog", icon: <BookOpen className="h-4 w-4" />, action: "scroll" },
  { id: "diagnostico", label: "Diagnóstico", icon: <Target className="h-4 w-4" />, action: "scroll" },
  { id: "contacto", label: "Contacto", icon: <Phone className="h-4 w-4" />, action: "scroll" },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStack, setMenuStack] = useState<string[]>(["root"])
  const [activeSection, setActiveSection] = useState<string>("home")
  const pathname = usePathname()
  const router = useRouter()
  const drawerRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const historyDepth = menuStack.length - 1
  const currentMenu = menuStack[menuStack.length - 1]

  // Utility function to scroll to hash
  const scrollToHash = (hash: string) => {
    const element = document.getElementById(hash)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      return true
    }
    return false
  }

  // Handle navigation clicks
  const handleNavigation = (item: MenuItem) => {
    const isOnHome = pathname === "/"

    if (item.action === "navigate" && item.href) {
      router.push(item.href)
      setIsOpen(false)
      return
    }

    if (item.action === "scroll") {
      if (isOnHome) {
        const scrolled = scrollToHash(item.id)
        if (scrolled) {
          setIsOpen(false)
          return
        }
      }

      // If not on home or anchor doesn't exist, navigate to home with hash
      router.push(`/#${item.id}`)
      setIsOpen(false)
    }
  }

  // Toggle drawer
  const toggleDrawer = () => {
    setIsOpen((prev) => !prev)
  }

  // Open submenu
  const openSub = (menuId: string) => {
    setMenuStack((prev) => [...prev, menuId])
  }

  // Go back in menu or close drawer
  const goBack = () => {
    setMenuStack((prev) => {
      if (prev.length > 1) {
        return prev.slice(0, -1)
      } else {
        setIsOpen(false)
        return ["root"]
      }
    })
  }

  // Close drawer
  const closeDrawer = () => {
    setIsOpen(false)
    setMenuStack(["root"])
  }

  // Handle logo click
  const handleLogoClick = () => {
    router.push("/")
    setIsOpen(false)
  }

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Close drawer on route change
  useEffect(() => {
    closeDrawer()
  }, [pathname])

  // Handle hash navigation on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.slice(1)
      setTimeout(() => {
        scrollToHash(hash)
      }, 100)
    }
  }, [pathname])

  // Intersection Observer for active section detection
  useEffect(() => {
    if (pathname !== "/") return

    const sections = menuItems
      .filter((item) => item.action === "scroll")
      .map((item) => item.id)
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.5, rootMargin: "-20% 0px -20% 0px" },
    )

    sections.forEach((section) => observer.observe(section))

    return () => {
      sections.forEach((section) => observer.unobserve(section))
    }
  }, [pathname])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        closeDrawer()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Focus trap for drawer
  useEffect(() => {
    if (!isOpen) return

    const drawer = drawerRef.current
    if (!drawer) return

    const focusableElements = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener("keydown", handleTabKey)
    firstElement?.focus()

    return () => {
      document.removeEventListener("keydown", handleTabKey)
    }
  }, [isOpen, currentMenu])

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 w-full bg-background/90 backdrop-blur-xl border-b border-border z-40">
        <nav className="px-3 sm:px-4 lg:px-8" role="navigation" aria-label="Navegación principal">
          <div className="flex justify-between items-center h-12 sm:h-14 lg:h-16">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex-shrink-0 min-w-0 focus:outline-none focus:ring-2 focus:ring-[#31AE79] rounded-md"
            >
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#99D0B8] via-purple-500 to-[#31AE79] bg-clip-text text-transparent truncate">
                BRUCK
              </h1>
            </button>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#31AE79]",
                    activeSection === item.id && pathname === "/"
                      ? "text-[#99D0B8] bg-[#31AE79]/20 border border-[#31AE79]/50"
                      : "text-muted-foreground hover:text-[#99D0B8] hover:bg-[#31AE79]/10",
                  )}
                  aria-current={activeSection === item.id && pathname === "/" ? "page" : undefined}
                >
                  {item.label}
                </button>
              ))}
              <ThemeToggle />
            </div>

            {/* Mobile Controls - Solo logo, theme toggle y hamburguesa */}
            <div className="lg:hidden flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <ThemeToggle />

              {/* Hamburger Button - Solo este botón en mobile */}
              <button
                ref={hamburgerRef}
                onClick={toggleDrawer}
                className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-md text-muted-foreground hover:text-[#99D0B8] hover:bg-[#31AE79]/10 transition-all duration-300 min-w-[36px] min-h-[36px] focus:outline-none focus:ring-2 focus:ring-[#31AE79]"
                aria-expanded={isOpen}
                aria-label="Abrir menú de navegación"
                aria-controls="mobile-menu"
              >
                {isOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        ref={drawerRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        className={cn(
          "fixed top-0 right-0 h-full w-[88%] max-w-sm bg-background/95 backdrop-blur-xl border-l border-border z-50 lg:hidden transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            {historyDepth > 0 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-[#99D0B8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#31AE79] rounded-md p-1"
                aria-label="Volver al menú anterior"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Volver</span>
              </button>
            ) : (
              <button
                onClick={closeDrawer}
                className="flex items-center gap-2 text-muted-foreground hover:text-[#99D0B8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#31AE79] rounded-md p-1"
                aria-label="Cerrar menú"
              >
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">Cerrar</span>
              </button>
            )}
            <h2 id="mobile-menu-title" className="text-lg font-semibold text-foreground">
              Menú
            </h2>
          </div>

          {/* Menu Items - Todos los links están aquí en mobile */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#31AE79]",
                    activeSection === item.id && pathname === "/"
                      ? "text-[#99D0B8] bg-[#31AE79]/20 border border-[#31AE79]/50"
                      : "text-muted-foreground hover:text-[#99D0B8] hover:bg-[#31AE79]/10",
                  )}
                  aria-current={activeSection === item.id && pathname === "/" ? "page" : undefined}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
