const TOTAL_PATTERNS = ['T0TA1', 'T0TA1:', 'TTA1', 'T0TB1', 'T0TAI', 'TTAI']
const SUBTOTAL_PATTERNS = ['SUBT0TA1', 'SUB T0TA1', 'SUBTTT1', 'SUB-T0TA1', 'SUBTT1']
const BS_PATTERNS = ['BS', 'BS.', 'B1V', 'B011V', 'B011VAR']
const LOW_AMOUNT_THRESHOLD = 50

export function findTotal(text) {
  return findTotalResult(text).amount
}

export function findTotalResult(text) {
  const lines = String(text || '')
    .split('\n')
    .map(line => normalizeOcrText(line).trim())
    .filter(Boolean)

  const allAmounts = collectAmounts(lines)

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    const hasTotal = TOTAL_PATTERNS.some(pattern => line.includes(pattern))
    const isSubtotal = SUBTOTAL_PATTERNS.some(pattern => line.includes(pattern))

    if (hasTotal && !isSubtotal) {
      const nearbyAmounts = [
        ...extractAmounts(line),
        ...(i + 1 < lines.length ? extractAmounts(lines[i + 1]) : []),
        ...(i - 1 >= 0 ? extractAmounts(lines[i - 1]) : [])
      ]
      const amount = pickBestAmount(nearbyAmounts, allAmounts)

      if (amount) return buildTotalResult(amount)
    }
  }

  const bsAmounts = []
  for (const line of lines) {
    if (BS_PATTERNS.some(pattern => line.includes(pattern))) {
      bsAmounts.push(...extractAmounts(line))
    }
  }

  if (bsAmounts.length > 0) return buildTotalResult(pickBestAmount(bsAmounts, allAmounts))

  const start = Math.max(0, lines.length - 5)
  const trailingAmounts = []
  for (let i = lines.length - 1; i >= start; i--) {
    trailingAmounts.push(...extractAmounts(lines[i]))
  }

  if (trailingAmounts.length > 0) {
    return buildTotalResult(pickBestAmount(trailingAmounts, allAmounts))
  }

  return { amount: null, warning: null }
}

export function extractAmount(text) {
  const amounts = extractAmounts(text)
  return amounts.length > 0 ? amounts[0] : null
}

export function extractAmounts(text) {
  const cleaned = normalizeOcrText(text)

  const venezuelanPattern = /(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d{4,}(?:,\d{1,2})?|\d{1,3}(?:,\d{1,2}))/g
  const matches = [...cleaned.matchAll(venezuelanPattern)]
  if (matches.length > 0) {
    return matches
      .sort((a, b) => b[1].length - a[1].length)
      .map(match => parseVenezuelanAmount(match[1]))
      .filter(amount => amount && Number.isFinite(amount))
  }

  const simplePattern = /(\d+(?:[.,]\d{1,2})?)/g
  const simpleMatches = [...cleaned.matchAll(simplePattern)]
  if (simpleMatches.length > 0) {
    return simpleMatches
      .sort((a, b) => b[1].length - a[1].length)
      .map(match => parseVenezuelanAmount(match[1]))
      .filter(amount => amount && Number.isFinite(amount))
  }

  return []
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

function collectAmounts(lines) {
  return lines.flatMap(line => extractAmounts(line))
}

function pickBestAmount(candidates, allAmounts) {
  const validCandidates = candidates.filter(amount => amount && Number.isFinite(amount))
  if (validCandidates.length === 0) return null

  return validCandidates.reduce((best, amount) => {
    const amountCount = countSimilarAmounts(allAmounts, amount)
    const bestCount = countSimilarAmounts(allAmounts, best)

    if (amountCount !== bestCount) return amountCount > bestCount ? amount : best
    return amount > best ? amount : best
  }, validCandidates[0])
}

function countSimilarAmounts(amounts, target) {
  return amounts.filter(amount => Math.abs(amount - target) < 0.01).length
}

function buildTotalResult(amount) {
  if (!amount) return { amount: null, warning: null }

  return {
    amount,
    warning: amount < LOW_AMOUNT_THRESHOLD
      ? 'Monto parece muy bajo. ¿Es correcto?'
      : null
  }
}
