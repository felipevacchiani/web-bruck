import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
  return NextResponse.redirect(new URL('/login', siteUrl))
}
