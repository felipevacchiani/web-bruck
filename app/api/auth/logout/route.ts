import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function logout(req: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const origin = req.nextUrl.origin
  return NextResponse.redirect(new URL('/login', origin), { status: 303 })
}

export async function POST(req: NextRequest) { return logout(req) }
export async function GET(req: NextRequest) { return logout(req) }
