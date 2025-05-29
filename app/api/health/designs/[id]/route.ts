import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    shapes: data.shapes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('designs')
    .update({
      name: body.name,
      shapes: body.shapes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    shapes: data.shapes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  })
}