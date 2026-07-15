export function findTotal(text) {
  const lines = String(text || '')
    .toUpperCase()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (line.includes('TOTAL') && !line.includes('SUBTOTAL') && !line.includes('SUB TOTAL')) {
      const amount = extractAmount(line)
      if (amount) return amount

      if (i + 1 < lines.length) {
        const nextAmount = extractAmount(lines[i + 1])
        if (nextAmount) return nextAmount
      }
    }
  }

  const bsAmounts = []
  for (const line of lines) {
    if (line.includes('BS') || line.includes('BLV') || line.includes('BOLIV')) {
      const amount = extractAmount(line)
      if (amount) bsAmounts.push(amount)
    }
  }

  if (bsAmounts.length > 0) return Math.max(...bsAmounts)

  for (let i = lines.length - 1; i >= 0; i--) {
    const amount = extractAmount(lines[i])
    if (amount && amount > 100) return amount
  }

  return null
}

export function extractAmount(text) {
  const patterns = [
    /(?:BS\.?\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)/gi,
    /(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\s*(?:BS\.?)?/gi,
    /(\d+(?:,\d{1,2})?)/gi
  ]

  for (const pattern of patterns) {
    const matches = [...String(text || '').matchAll(pattern)]
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1][1]
      const amount = parseVenezuelanAmount(lastMatch)
      if (amount) return amount
    }
  }

  return null
}

export function parseVenezuelanAmount(str) {
  const cleaned = String(str || '')
    .replace(/\./g, '')
    .replace(',', '.')

  const num = parseFloat(cleaned)
  return Number.isFinite(num) ? num : null
}
