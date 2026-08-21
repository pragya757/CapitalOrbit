import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from '../format'

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000')
  })

  it('formats INR correctly', () => {
    // Note: Node's Intl might format this as ₹1,000 or varying spaces, so we check for exact characters
    const formatted = formatCurrency(1000, 'INR')
    expect(formatted).toContain('1,000')
    expect(formatted).toContain('₹')
  })

  it('formats EUR correctly', () => {
    const formatted = formatCurrency(1000, 'EUR')
    expect(formatted).toContain('1.000') // German locale uses dot separator for thousands
    expect(formatted).toContain('€')
  })

  it('defaults to INR if no currency provided', () => {
    const formattedDefault = formatCurrency(1000)
    const formattedINR = formatCurrency(1000, 'INR')
    expect(formattedDefault).toEqual(formattedINR)
  })
})

describe('formatDate', () => {
  it('formats short dates correctly', () => {
    const date = new Date('2024-01-15T00:00:00Z')
    expect(formatDate(date, 'short')).toMatch(/Jan 1\d, 2024/)
  })

  it('handles string date inputs', () => {
    expect(formatDate('2024-01-15T00:00:00Z', 'short')).toMatch(/Jan 1\d, 2024/)
  })
})
