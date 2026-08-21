import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const secretKey = process.env.JWT_SECRET || 'fallback_secret_for_development_only'
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any, expiresIn: string = '7d') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('spendwise_session')?.value
  if (!session) return null
  return await decrypt(session)
}

export async function setSession(userId: string, keepSignedIn: boolean = false) {
  const expiresInMs = keepSignedIn ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 24 hours
  const expires = new Date(Date.now() + expiresInMs)
  
  const session = await encrypt({ userId, expires }, keepSignedIn ? '30d' : '1d')

  const cookieStore = await cookies()
  cookieStore.set('spendwise_session', session, {
    expires, 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('spendwise_session')
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('spendwise_session')?.value
  if (!session) return

  const parsed = await decrypt(session)
  if (!parsed) return

  const res = NextResponse.next()
  return res
}
