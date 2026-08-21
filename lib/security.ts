import crypto from 'crypto'

/**
 * Ensures a consistent 32-byte key is derived from the environment variable 
 * to adhere strictly to AES-256 criteria.
 */
function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_KEY || 'default_insecure_32_byte_secret_!!'
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Standardized AES-256-GCM symmetric encryption for protecting Database fields.
 * Includes Auth Tags mitigating cipher tampering.
 */
export function encryptField(plainText: string): string {
  const IV_LENGTH = 16
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  
  // Format: IV:AuthTag:EncryptedContent
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Safe decryption handler executing against AES-256-GCM structured cipher texts.
 */
export function decryptField(cryptoText: string): string | null {
  try {
    const parts = cryptoText.split(':')
    if (parts.length !== 3) return null

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encryptedText = parts[2]
    
    const key = getEncryptionKey()
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (err) {
    // Fails silently if tampering is detected or key mismatches
    return null
  }
}

/**
 * Basic In-Memory Rate Limiter Stub
 * Useful mapping IPs or UserIDs against generic request limits.
 * Note: For production use Redis rather than an in-memory Map.
 */
const rateLimitCache = new Map<string, { count: number, resetAt: number }>()

export function isRateLimited(identifier: string, limit = 10, windowMs = 60000) {
  const now = Date.now()
  const record = rateLimitCache.get(identifier)

  if (!record || record.resetAt < now) {
    rateLimitCache.set(identifier, { count: 1, resetAt: now + windowMs })
    return false
  }

  if (record.count >= limit) {
    return true
  }

  record.count += 1
  return false
}
