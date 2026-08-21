import { NextResponse } from 'next/server'
import { loadDemoDataAction } from '@/lib/actions/demo-data'

export async function POST() {
  const result = await loadDemoDataAction()
  if (!result.success) {
    return NextResponse.json(result, { status: 400 })
  }

  return NextResponse.json(result, { status: 200 })
}
