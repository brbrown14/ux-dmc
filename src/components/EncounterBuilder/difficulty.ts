const XP_THRESHOLDS: Record<number, [number, number, number, number]> = {
  1: [25, 50, 75, 100],
  2: [50, 100, 150, 200],
  3: [75, 150, 225, 400],
  4: [125, 250, 375, 500],
  5: [250, 500, 750, 1100],
  6: [300, 600, 900, 1400],
  7: [350, 750, 1100, 1700],
  8: [450, 900, 1400, 2100],
  9: [550, 1100, 1600, 2400],
  10: [600, 1200, 1900, 2800],
  11: [800, 1600, 2400, 3600],
  12: [1000, 2000, 3000, 4500],
  13: [1100, 2200, 3400, 5100],
  14: [1250, 2500, 3800, 5700],
  15: [1400, 2800, 4300, 6400],
  16: [1600, 3200, 4800, 7200],
  17: [2000, 3900, 5900, 8800],
  18: [2100, 4200, 6300, 9500],
  19: [2400, 4900, 7300, 10900],
  20: [2800, 5700, 8500, 12700],
}

const DIFF_KEYS = ['easy', 'medium', 'hard', 'deadly'] as const
const MULTIPLIERS = [1, 1.5, 2, 2.5, 3, 4]

function getMultiplier(count: number): number {
  if (count === 1) return 1
  if (count === 2) return 1.5
  if (count >= 3 && count <= 6) return 2
  if (count >= 7 && count <= 10) return 2.5
  if (count >= 11 && count <= 14) return 3
  return 4
}

function adjustMultiplier(m: number, partySize: number): number {
  const idx = MULTIPLIERS.indexOf(m)
  if (idx === -1) return m
  if (partySize < 3) return MULTIPLIERS[Math.min(idx + 1, MULTIPLIERS.length - 1)]
  if (partySize >= 6) return MULTIPLIERS[Math.max(idx - 1, 0)]
  return m
}

export interface DifficultyResult {
  partySize: number
  levels: number[]
  thresholds: [number, number, number, number]
  totalXp: number
  monsterCount: number
  multiplier: number
  adjustedXp: number
  diffIdx: number
}

export function calcEncounterDifficulty(
  levels: number[],
  monsters: { xp: number; quantity: number }[],
): DifficultyResult | null {
  if (levels.length === 0) return null
  const partySize = levels.length

  const thresholds: [number, number, number, number] = [0, 0, 0, 0]
  for (const lvl of levels) {
    const row = XP_THRESHOLDS[Math.min(Math.max(lvl, 1), 20)]
    for (let i = 0; i < 4; i++) thresholds[i] += row[i]
  }

  let totalXp = 0
  let monsterCount = 0
  for (const m of monsters) {
    totalXp += m.xp * m.quantity
    monsterCount += m.quantity
  }

  let adjustedXp = totalXp
  let multiplier = 1
  if (monsterCount > 0) {
    multiplier = getMultiplier(monsterCount)
    multiplier = adjustMultiplier(multiplier, partySize)
    adjustedXp = Math.floor(totalXp * multiplier)
  }

  let diffIdx = -1
  if (monsterCount > 0) {
    for (let i = 3; i >= 0; i--) {
      if (adjustedXp >= thresholds[i]) { diffIdx = i; break }
    }
  }

  return { partySize, levels, thresholds, totalXp, monsterCount, multiplier, adjustedXp, diffIdx }
}

export function getDifficultyLabel(diffIdx: number): string {
  if (diffIdx < 0) return 'trivial'
  return DIFF_KEYS[diffIdx]
}
