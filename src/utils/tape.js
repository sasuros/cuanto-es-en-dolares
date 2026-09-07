export function getContextKey(result, mode) {
  if (!result) return ''

  const source = mode === 'custom' || result.isCustomRate ? 'custom' : 'bcv'
  const currency = result.currency === 'eur' ? 'eur' : 'usd'
  const direction = result.direction === 'to-bs' ? 'to-bs' : 'from-bs'

  return `${source}:${currency}:${direction}`
}

export function parseContextKey(contextKey) {
  const [source, currency, direction] = String(contextKey || '').split(':')

  return {
    source: source === 'custom' ? 'custom' : 'bcv',
    currency: currency === 'eur' ? 'eur' : 'usd',
    direction: direction === 'to-bs' ? 'to-bs' : 'from-bs'
  }
}

export function getCurrentRateForContext(contextKey, rates, result) {
  const { source, currency } = parseContextKey(contextKey)

  if (source === 'custom') {
    if (result && getContextKey(result, result.mode) === contextKey) {
      const customRate = Number(result.tasa)
      return Number.isFinite(customRate) && customRate > 0 ? customRate : null
    }

    return null
  }

  const rate = Number(rates?.[currency]?.bcv?.tasa)
  return Number.isFinite(rate) && rate > 0 ? rate : null
}

export function calculateTapeLine(item, rate) {
  const { direction } = parseContextKey(item.contextKey)
  const amount = Number(item.inputAmount)

  if (!Number.isFinite(amount) || !Number.isFinite(rate) || rate <= 0) {
    return null
  }

  return direction === 'from-bs'
    ? amount / rate
    : amount * rate
}

export function buildTapeSnapshot(tape, rate) {
  if (!Array.isArray(tape) || tape.length === 0) {
    return null
  }

  const lines = tape.map(item => ({
    id: item.id,
    value: calculateTapeLine(item, rate)
  }))

  if (lines.some(line => line.value === null)) {
    return null
  }

  return {
    contextKey: tape[0].contextKey,
    inputTotal: tape.reduce((sum, item) => sum + Number(item.inputAmount || 0), 0),
    outputTotal: lines.reduce((sum, line) => sum + line.value, 0),
    lines
  }
}

export function splitAmount(total, people) {
  const totalCents = Math.round(Number(total) * 100)
  const safePeople = Math.max(1, Math.trunc(Number(people) || 1))
  const baseCents = Math.floor(totalCents / safePeople)
  const remainderCount = totalCents - baseCents * safePeople

  return {
    base: baseCents / 100,
    extra: (baseCents + 1) / 100,
    remainderCount,
    allEqual: remainderCount === 0
  }
}

export function createTapeEntry(result, mode) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return {
    id,
    inputAmount: result.amount,
    contextKey: getContextKey(result, mode),
    operation: 'add',
    timestamp: Date.now()
  }
}
