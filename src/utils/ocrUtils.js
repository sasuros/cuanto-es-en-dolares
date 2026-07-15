const TOTAL_PATTERNS = ['T0TA1', 'TTA1', 'T0TB1']
const SUBTOTAL_PATTERNS = ['SUBT0TA1', 'SUB T0TA1', 'SUBTTT1', 'SUB-T0TA1', 'SUBTT1']
const BS_PATTERNS = ['BS', 'BS.', 'B1V', 'B011V', 'B011VAR']

export function findTotal(text) {
  const lines = String(text || '')
    .split('\n')
    .map(line => normalizeOcrText(line).trim())
    .filter(Boolean)

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    const hasTotal = TOTAL_PATTERNS.some(pattern => line.includes(pattern))
    const isSubtotal = SUBTOTAL_PATTERNS.some(pattern => line.includes(pattern))

    if (hasTotal && !isSubtotal) {
      const amount = extractAmount(line)
      if (amount && amount > 50) return amount

      if (i + 1 < lines.length) {
        const nextAmount = extractAmount(lines[i + 1])
        if (nextAmount && nextAmount > 50) return nextAmount
      }

      if (i - 1 >= 0) {
        const prevAmount = extractAmount(lines[i - 1])
        if (prevAmount && prevAmount > 50) return prevAmount
      }
    }
  }

  const bsAmounts = []
  for (const line of lines) {
    if (BS_PATTERNS.some(pattern => line.includes(pattern))) {
      const amount = extractAmount(line)
      if (amount && amount > 50) bsAmounts.push(amount)
    }
  }

  if (bsAmounts.length > 0) return Math.max(...bsAmounts)

  const start = Math.max(0, lines.length - 5)
  for (let i = lines.length - 1; i >= start; i--) {
    const amount = extractAmount(lines[i])
    if (amount && amount > 100) return amount
  }

  return null
}

export function extractAmount(text) {
  const cleaned = normalizeOcrText(text)

  const venezuelanPattern = /(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d{4,}(?:,\d{1,2})?|\d{1,3}(?:,\d{1,2}))/g
  const matches = [...cleaned.matchAll(venezuelanPattern)]
  if (matches.length > 0) {
    const best = matches.reduce((currentBest, match) =>
      match[1].length > currentBest[1].length ? match : currentBest
    )
    return parseVenezuelanAmount(best[1])
  }

  const simplePattern = /(\d+(?:[.,]\d{1,2})?)/g
  const simpleMatches = [...cleaned.matchAll(simplePattern)]
  if (simpleMatches.length > 0) {
    const best = simpleMatches.reduce((currentBest, match) =>
      match[1].length > currentBest[1].length ? match : currentBest
    )
    return parseVenezuelanAmount(best[1])
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

function normalizeOcrText(text) {
  return String(text || '')
    .toUpperCase()
    .replace(/[O]/g, '0')
    .replace(/[LI]/g, '1')
    .replace(/\s+/g, ' ')
}
