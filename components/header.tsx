"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const NAV_ITEMS = [
  { id: "que-hacemos", label: "Qué hacemos" },
  { id: "nosotros", label: "Nosotros" },
  { id: "casos-de-exito", label: "Casos de éxito" },
]

function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === "/"

  const [isOpen, setIsOpen] = useState(false)
  const [menuStack, setMenuStack] = useState<string[]>(["root"])
  const drawerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
    setMenuStack(["root"])
  }, [pathname])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false)
        setMenuStack(["root"])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const hash = window.location.hash?.replace(/^#/, "")
    if (!hash) return
    requestAnimationFrame(() => {
      const el = document.getElementById(hash)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [])

  function toggleDrawer() {
    setIsOpen((v) => !v)
  }
  function goBack() {
    setMenuStack((s) => {
      if (s.length > 1) return s.slice(0, -1)
      setIsOpen(false)
      return ["root"]
    })
  }
  function closeDrawer() {
    setIsOpen(false)
    setMenuStack(["root"])
  }

  function handleNav(targetId: string) {
    if (isHome) {
      const el = document.getElementById(targetId)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      router.push(`/#${targetId}`)
    }
  }

  const atRoot = menuStack[menuStack.length - 1] === "root"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-7xl h-14 px-4 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          BRUCK
        </Link>

        {/* Desktop (>=xl): nav visible */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-700">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className="hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 py-0.5"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile (<xl): solo hamburguesa */}
        <button
          className="xl:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
          aria-label="Abrir menú"
          aria-expanded={isOpen}
          onClick={toggleDrawer}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Drawer Mobile */}
      {isOpen && (
        <div className="xl:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDrawer} />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            className={`absolute right-0 top-0 h-full w-[88%] max-w-[420px] bg-white shadow-xl border-l border-slate-200 p-4 transition-transform duration-200 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex items-center justify-between">
              {atRoot ? (
                <span className="text-sm font-semibold text-slate-600">Menú</span>
              ) : (
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 text-sm"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  Volver
                </button>
              )}
              <button
                onClick={closeDrawer}
                className="p-2 rounded hover:bg-slate-100 text-slate-700"
                aria-label="Cerrar menú"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="mt-6">
              <ul className="space-y-3 text-[15px] font-medium text-slate-800">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/#${item.id}`}
                      onClick={closeDrawer}
                      className="block px-2 py-2 rounded hover:bg-slate-100"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export { Header }
