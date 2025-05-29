import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export async function GET() {
  const { data, error } = await supabase.from('templates').select('*')
  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data || [])
}