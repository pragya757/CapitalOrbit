/**
 * Lightweight in-memory sliding window rate limiter for API endpoints.
 */
interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

/**
 * Checks if a key (e.g. IP address or user ID) has exceeded the max allowed requests within windowMs.
 */
export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60 * 1000
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs
    rateLimitMap.set(key, { count: 1, resetTime })
    return { success: true, remaining: limit - 1, resetTime }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count += 1
  rateLimitMap.set(key, record)
  return { success: true, remaining: limit - record.count, resetTime: record.resetTime }
}

/**
 * Periodically cleans up expired rate limit records from memory.
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    rateLimitMap.forEach((rec, k) => {
      if (now > rec.resetTime) {
        rateLimitMap.delete(k)
      }
    })
  }, 5 * 60 * 1000)
}
