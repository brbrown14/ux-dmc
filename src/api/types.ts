export interface NPC {
  id: number
  name: string
  location: string
  occupation: string
  history: string
  personality: string
  worldMapId: number | null
  ownerUsername: string
}

export interface Monster {
  id: number
  name: string
  source: string
  size: string
  type: string
  alignment: string
  armorClass: number
  hitPoints: number
  hitPointsFormula: string
  speed: string
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  skills: string
  passive: number
  languages: string
  challengeRating: string
  xp: number
  traits: string
  actions: string
  legendaryActions: string
  reactions: string
  damageResistances: string
  damageImmunities: string
  conditionImmunities: string
  senses: string
  environment: string
  imagePath: string
  sourceJson: string
}

export interface Encounter {
  id: number
  name: string
  ownerUsername: string
  createdAt: string
}

export interface EncounterMonster {
  id: number
  encounterId: number
  monsterId: number
  quantity: number
  initiative: number | null
}

export interface EncounterDetail {
  encounter: Encounter
  monsters: EncounterMonster[]
}

export interface WorldMap {
  id: number
  title: string
  description: string
  imagePath: string
  imageType: string
  ownerUsername: string
}

export interface Chapter {
  id: number
  title: string
  content: string
  ownerUsername: string
}

export interface AddMonsterRequest {
  monsterId: number
  quantity: number
}

export interface UpdateMonsterRequest {
  quantity?: number
  initiative?: number | null
}

export interface MapUpdateRequest {
  title: string
  description: string
}

export interface MagicItem {
  id: number
  name: string
  description: string
  rarity: string | null
  type: string | null
  tier: string | null
  source: string | null
  page: number | null
  weight: string | null
  wondrous: boolean | null
  requiresAttunement: boolean | null
  attunement: string | null
  isVariant: boolean
  variantRequires: string | null
  detailsJson: string | null
  custom: boolean
  ownerUsername: string | null
}

export interface BaseItem {
  id: number
  name: string
  description: string
  source: string | null
  page: number | null
  type: string | null
  weight: string | null
  value: string | null
  weaponCategory: string | null
  property: string | null
  range: string | null
  dmg1: string | null
  dmg2: string | null
  dmgType: string | null
  ac: number | null
  stealth: boolean | null
  strength: string | null
  flags: string | null
  detailsJson: string | null
}
