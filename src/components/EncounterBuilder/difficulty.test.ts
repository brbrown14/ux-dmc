import { describe, it, expect } from 'vitest'
import { calcEncounterDifficulty, getDifficultyLabel } from './difficulty'

describe('calcEncounterDifficulty', () => {
  it('returns null for empty party', () => {
    expect(calcEncounterDifficulty([], [])).toBeNull()
  })

  it('calculates trivial difficulty for weak monsters vs high-level party', () => {
    const result = calcEncounterDifficulty([20], [{ xp: 100, quantity: 1 }])
    expect(result).not.toBeNull()
    expect(result!.diffIdx).toBe(-1) // trivial
    expect(result!.totalXp).toBe(100)
    expect(result!.monsterCount).toBe(1)
  })

  it('calculates deadly difficulty for strong encounter', () => {
    const result = calcEncounterDifficulty([1], [{ xp: 400, quantity: 1 }])
    expect(result).not.toBeNull()
    expect(result!.diffIdx).toBe(3) // deadly
  })

  it('applies encounter size multipliers', () => {
    // party size 4 = no multiplier adjustment
    const result = calcEncounterDifficulty([1, 1, 1, 1], [
      { xp: 25, quantity: 5 },
    ])
    expect(result).not.toBeNull()
    expect(result!.multiplier).toBe(2) // 3-6 monsters = 2x
    expect(result!.adjustedXp).toBe(25 * 5 * 2)
  })

  it('adjusts multiplier for small parties', () => {
    // party size 2 < 3, multiplier should increase one step
    const result = calcEncounterDifficulty([1, 1], [
      { xp: 25, quantity: 5 },
    ])
    expect(result).not.toBeNull()
    expect(result!.multiplier).toBe(2.5) // 2 -> 2.5
  })

  it('adjusts multiplier for large parties', () => {
    const levels = Array(6).fill(1)
    const result = calcEncounterDifficulty(levels, [
      { xp: 25, quantity: 5 },
    ])
    expect(result).not.toBeNull()
    expect(result!.multiplier).toBe(1.5) // 2 -> 1.5
  })

  it('handles multiple player levels correctly', () => {
    const result = calcEncounterDifficulty([1, 2, 3], [
      { xp: 50, quantity: 1 },
    ])
    expect(result).not.toBeNull()
    expect(result!.thresholds[0]).toBe(25 + 50 + 75) // easy
    expect(result!.thresholds[1]).toBe(50 + 100 + 150) // medium
    expect(result!.thresholds[2]).toBe(75 + 150 + 225) // hard
    expect(result!.thresholds[3]).toBe(100 + 200 + 400) // deadly
  })

  it('caps player level at 20', () => {
    const result = calcEncounterDifficulty([21], [{ xp: 2800, quantity: 1 }])
    expect(result).not.toBeNull()
    expect(result!.thresholds[3]).toBe(12700)
  })

  it('handles fractional CR values', () => {
    const result = calcEncounterDifficulty([1], [{ xp: 25, quantity: 1 }])
    expect(result).not.toBeNull()
    expect(result!.monsterCount).toBe(1)
    expect(result!.totalXp).toBe(25)
  })

  it('uses correct multiplier for 4-person party with 1 monster', () => {
    const result = calcEncounterDifficulty([5, 5, 5, 5], [{ xp: 1800, quantity: 1 }])
    expect(result).not.toBeNull()
    expect(result!.multiplier).toBe(1)
    expect(result!.adjustedXp).toBe(1800)
  })

  it('returns zero xp and trivial difficulty for empty monsters', () => {
    const result = calcEncounterDifficulty([1, 2], [])
    expect(result).not.toBeNull()
    expect(result!.monsterCount).toBe(0)
    expect(result!.totalXp).toBe(0)
    expect(result!.adjustedXp).toBe(0)
    expect(result!.diffIdx).toBe(-1)
  })

  it('does not adjust multiplier for party size exactly 3', () => {
    const result = calcEncounterDifficulty([1, 1, 1], [{ xp: 100, quantity: 5 }])
    expect(result).not.toBeNull()
    expect(result!.multiplier).toBe(2)
    expect(result!.partySize).toBe(3)
  })

  it('does not adjust multiplier for party size exactly 5', () => {
    const result = calcEncounterDifficulty([1, 1, 1, 1, 1], [{ xp: 100, quantity: 5 }])
    expect(result).not.toBeNull()
    expect(result!.multiplier).toBe(2)
    expect(result!.partySize).toBe(5)
  })

  it('uses correct thresholds for level 19', () => {
    const result = calcEncounterDifficulty([19], [{ xp: 2400, quantity: 1 }])
    expect(result).not.toBeNull()
    expect(result!.thresholds).toEqual([2400, 4900, 7300, 10900])
  })

  it('uses correct thresholds for level 20', () => {
    const result = calcEncounterDifficulty([20], [{ xp: 2800, quantity: 1 }])
    expect(result).not.toBeNull()
    expect(result!.thresholds).toEqual([2800, 5700, 8500, 12700])
  })
})

describe('getDifficultyLabel', () => {
  it('returns easy for index 0', () => {
    expect(getDifficultyLabel(0)).toBe('easy')
  })

  it('returns deadly for index 3', () => {
    expect(getDifficultyLabel(3)).toBe('deadly')
  })

  it('returns trivial for index -1', () => {
    expect(getDifficultyLabel(-1)).toBe('trivial')
  })
})
