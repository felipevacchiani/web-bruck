import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const publicRoutes = ['/login', '/forgot-password', '/reset-password']
  if (publicRoutes.includes(pathname)) {
    if (user) {
      const profile = await getProfile(supabase, user.id)
      const redirectTo = profile?.role === 'admin' ? '/admin' : '/dashboard'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return supabaseResponse
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const profile = await getProfile(supabase, user.id)

  // Si no hay perfil, permitir igual (no bloquear)
  if (!profile) {
    return supabaseResponse
  }

  // Si está inactivo, redirigir
  if (!profile.active) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))
  }

  if (pathname.startsWith('/admin') && profile.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (pathname === '/dashboard' && profile.role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

async function getProfile(supabase: any, userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('id, role, active')
    .eq('id', userId)
    .single()
  return data
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
