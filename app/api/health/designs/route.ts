import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('designs')
    .select('id,name,updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = (data || []).map((d) => ({
    id: d.id,
    name: d.name,
    updatedAt: d.updated_at,
  }))
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const body = await req.json()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('designs')
    .insert({
      name: body.name,
      user_id: body.userId,
      shapes: body.shapes || [],
    })
    .select()
    .single()

  if (error || !data) {
    console.error(error)
    return NextResponse.json({ error: error?.message || 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json(
    {
      id: data.id,
      name: data.name,
      shapes: data.shapes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    { status: 201 }
  )
}