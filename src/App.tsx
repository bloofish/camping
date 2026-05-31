import type { ChangeEvent, ClipboardEvent, DragEvent, FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { hasSupabaseConfig, supabase, supabaseConfig } from './lib/supabase'

type Rarity = 'common' | 'rare' | 'epic'
type Category =
  | 'headwear'
  | 'base-layer'
  | 'mid-layer'
  | 'shell'
  | 'pants'
  | 'footwear'
  | 'accessory'
  | 'backpack'
  | 'shelter'
  | 'sleep'
  | 'cook'
  | 'hydration'
  | 'safety'
  | 'fuel'

type WearSlotId =
  | 'head'
  | 'base'
  | 'mid'
  | 'shell'
  | 'legs'
  | 'feet'
  | 'accessory'
  | 'backpack'

type Location =
  | { zone: 'home' }
  | { zone: 'wear'; slotId: WearSlotId }
  | { zone: 'bag' }

type ProductRecord = {
  productId: string
  name: string
  brand: string
  category: Category
  weight: string
  rarity: Rarity
  icon: string
  image: string
  purchaseLink: string
  notes: string
}

type ManualProductDraft = {
  name: string
  brand: string
  category: Category | ''
  image: string
  purchaseLink: string
}

type GearItem = ProductRecord & {
  id: string
  location: Location
}

type DropTarget =
  | { zone: 'home' }
  | { zone: 'wear'; slotId: WearSlotId }
  | { zone: 'bag' }

type WearSlot = {
  id: WearSlotId
  label: string
  accepts: Category[]
}

type LibraryFilter = 'all' | 'clothing' | 'shelter' | 'cooking' | 'accessories'
type MobileView = 'wear' | 'bag' | 'library'

type SharedLoadoutLocation = { zone: 'wear'; slotId: WearSlotId } | { zone: 'bag' }

type SharedLoadoutItem = ProductRecord & {
  location: SharedLoadoutLocation
}

type SharedLoadoutPayload = {
  version: 1
  title: string
  items: SharedLoadoutItem[]
}

type CustomProductRow = {
  id: string
  user_id: string
  user_email: string | null
  product_id: string
  name: string
  brand: string
  category: Category
  weight: string | null
  rarity: Rarity | null
  icon: string
  image: string
  purchase_link: string | null
  notes: string | null
  created_at: string
}

type CatalogProductRow = {
  id: string
  product_id: string
  name: string
  brand: string
  category: Category
  weight: string | null
  rarity: Rarity | null
  icon: string
  image: string
  purchase_link: string | null
  notes: string | null
  created_at: string
}

const wearSlots: WearSlot[] = [
  { id: 'head', label: 'Headwear', accepts: ['headwear'] },
  { id: 'shell', label: 'Shell', accepts: ['shell'] },
  { id: 'base', label: 'Base Layer', accepts: ['base-layer'] },
  { id: 'mid', label: 'Mid Layer', accepts: ['mid-layer'] },
  { id: 'legs', label: 'Legwear', accepts: ['pants'] },
  { id: 'accessory', label: 'Accessory', accepts: ['accessory'] },
  { id: 'feet', label: 'Footwear', accepts: ['footwear'] },
  { id: 'backpack', label: 'Backpack', accepts: ['backpack'] },
]

const seedProducts: ProductRecord[] = [
  {
    productId: 'ridge-cap',
    name: 'Ridge Cap',
    brand: 'Patagonia',
    category: 'headwear',
    weight: '85 g',
    rarity: 'common',
    icon: 'RC',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Sun and light rain protection',
  },
  {
    productId: 'merino-tee',
    name: 'Merino Tee',
    brand: 'Icebreaker',
    category: 'base-layer',
    weight: '150 g',
    rarity: 'rare',
    icon: 'MT',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Breathable next-to-skin layer',
  },
  {
    productId: 'alpha-fleece',
    name: 'Alpha Fleece',
    brand: 'Senchi',
    category: 'mid-layer',
    weight: '190 g',
    rarity: 'rare',
    icon: 'AF',
    image:
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Warmth for cool starts',
  },
  {
    productId: 'storm-shell',
    name: 'Storm Shell',
    brand: 'Arc teryx',
    category: 'shell',
    weight: '320 g',
    rarity: 'epic',
    icon: 'SS',
    image:
      'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Full weather layer',
  },
  {
    productId: 'trail-pants',
    name: 'Trail Pants',
    brand: 'Outdoor Research',
    category: 'pants',
    weight: '290 g',
    rarity: 'common',
    icon: 'TP',
    image:
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Stretch hiking pants',
  },
  {
    productId: 'wool-socks',
    name: 'Wool Socks',
    brand: 'Darn Tough',
    category: 'footwear',
    weight: '75 g',
    rarity: 'common',
    icon: 'WS',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Cushioned hiking pair',
  },
  {
    productId: 'camp-watch',
    name: 'GPS Watch',
    brand: 'Garmin',
    category: 'accessory',
    weight: '53 g',
    rarity: 'rare',
    icon: 'GW',
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Tracking and routing',
  },
  {
    productId: 'trail-pack',
    name: 'Trail Pack 32L',
    brand: 'Osprey',
    category: 'backpack',
    weight: '890 g',
    rarity: 'rare',
    icon: 'BP',
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Day hike and overnight pack',
  },
  {
    productId: 'down-quilt',
    name: 'Down Quilt',
    brand: 'Therm-a-Rest',
    category: 'sleep',
    weight: '710 g',
    rarity: 'rare',
    icon: 'DQ',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Sleep insulation',
  },
  {
    productId: 'foam-pad',
    name: 'Foam Pad',
    brand: 'Nemo',
    category: 'sleep',
    weight: '410 g',
    rarity: 'common',
    icon: 'FP',
    image:
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Sleeping base layer',
  },
  {
    productId: 'tent',
    name: 'Solo Tent',
    brand: 'Big Agnes',
    category: 'shelter',
    weight: '1.2 kg',
    rarity: 'epic',
    icon: 'ST',
    image:
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Freestanding shelter',
  },
  {
    productId: 'stove-kit',
    name: 'Pocket Stove',
    brand: 'MSR',
    category: 'cook',
    weight: '110 g',
    rarity: 'common',
    icon: 'PK',
    image:
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Boil and coffee kit',
  },
  {
    productId: 'fuel-can',
    name: 'Fuel Canister',
    brand: 'Jetboil',
    category: 'fuel',
    weight: '200 g',
    rarity: 'common',
    icon: 'FC',
    image:
      'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Fuel for stove',
  },
  {
    productId: 'water-filter',
    name: 'Water Filter',
    brand: 'Sawyer',
    category: 'hydration',
    weight: '65 g',
    rarity: 'common',
    icon: 'WF',
    image:
      'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Refill water on trail',
  },
  {
    productId: 'first-aid',
    name: 'First Aid Kit',
    brand: 'Adventure Medical',
    category: 'safety',
    weight: '180 g',
    rarity: 'rare',
    icon: 'FA',
    image:
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Blister and emergency care',
  },
  {
    productId: 'down-vest',
    name: 'Down Vest',
    brand: 'Rab',
    category: 'mid-layer',
    weight: '240 g',
    rarity: 'rare',
    icon: 'DV',
    image:
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Camp insulation',
  },
  {
    productId: 'beanie',
    name: 'Camp Beanie',
    brand: 'Buff',
    category: 'headwear',
    weight: '48 g',
    rarity: 'common',
    icon: 'CB',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Warm backup hat',
  },
  {
    productId: 'exos-pack',
    name: 'Exos 38',
    brand: 'Osprey',
    category: 'backpack',
    weight: '1.28 kg',
    rarity: 'epic',
    icon: 'E3',
    image:
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Light overnight backpack',
  },
  {
    productId: 'houdini-shell',
    name: 'Houdini Jacket',
    brand: 'Patagonia',
    category: 'shell',
    weight: '105 g',
    rarity: 'rare',
    icon: 'HJ',
    image:
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Packable weather shell',
  },
  {
    productId: 'tensor-pad',
    name: 'Tensor Trail Pad',
    brand: 'Nemo',
    category: 'sleep',
    weight: '398 g',
    rarity: 'rare',
    icon: 'TT',
    image:
      'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Inflatable sleeping pad',
  },
  {
    productId: 'freelight-tent',
    name: 'FreeLite 2',
    brand: 'MSR',
    category: 'shelter',
    weight: '1.06 kg',
    rarity: 'epic',
    icon: 'F2',
    image:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Two-person lightweight shelter',
  },
  {
    productId: 'microfilter',
    name: 'BeFree Filter',
    brand: 'Katadyn',
    category: 'hydration',
    weight: '63 g',
    rarity: 'rare',
    icon: 'BF',
    image:
      'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80',
    purchaseLink: '',
    notes: 'Fast squeeze water filter',
  },
]

const initialItems: GearItem[] = [
  createItem(seedProducts[0], { zone: 'wear', slotId: 'head' }, 'ridge-cap'),
  createItem(seedProducts[1], { zone: 'wear', slotId: 'base' }, 'merino-tee'),
  createItem(seedProducts[2], { zone: 'home' }, 'alpha-fleece'),
  createItem(seedProducts[3], { zone: 'wear', slotId: 'shell' }, 'storm-shell'),
  createItem(seedProducts[4], { zone: 'wear', slotId: 'legs' }, 'trail-pants'),
  createItem(seedProducts[5], { zone: 'wear', slotId: 'feet' }, 'wool-socks'),
  createItem(seedProducts[6], { zone: 'wear', slotId: 'accessory' }, 'camp-watch'),
  createItem(seedProducts[7], { zone: 'home' }, 'trail-pack'),
  createItem(seedProducts[8], { zone: 'bag' }, 'down-quilt'),
  createItem(seedProducts[9], { zone: 'home' }, 'foam-pad'),
  createItem(seedProducts[10], { zone: 'bag' }, 'tent'),
  createItem(seedProducts[11], { zone: 'bag' }, 'stove-kit'),
  createItem(seedProducts[12], { zone: 'home' }, 'fuel-can'),
  createItem(seedProducts[13], { zone: 'bag' }, 'water-filter'),
  createItem(seedProducts[14], { zone: 'bag' }, 'first-aid'),
  createItem(seedProducts[15], { zone: 'bag' }, 'down-vest'),
  createItem(seedProducts[16], { zone: 'home' }, 'beanie'),
]

const bagAreas = ['Sleep', 'Shelter', 'Cooking', 'Essentials'] as const
const areaOrder = new Map(bagAreas.map((area, index) => [area, index]))
const CATALOG_PRODUCTS_TABLE = 'catalog_products'
const CUSTOM_PRODUCTS_TABLE = 'custom_products'
const CUSTOM_PRODUCT_IMAGES_BUCKET = 'custom-product-images'
const seededProductIds = new Set(seedProducts.map((product) => product.productId))
const categoryOptions: Array<{ value: Category; label: string }> = [
  { value: 'headwear', label: 'Headwear' },
  { value: 'shell', label: 'Shell' },
  { value: 'base-layer', label: 'Base Layer' },
  { value: 'mid-layer', label: 'Mid Layer' },
  { value: 'pants', label: 'Legwear' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'backpack', label: 'Backpack' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'cook', label: 'Cooking' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'hydration', label: 'Hydration' },
  { value: 'safety', label: 'Safety' },
]

const blankManualDraft: ManualProductDraft = {
  name: '',
  brand: '',
  category: '',
  image: '',
  purchaseLink: '',
}

const heroBackgroundImage =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80'
const loadoutTitle = 'PENTLANDS WET DAY HIKE'
const loadoutConditionsLabel = '8\u00B0C · Light rain · Windy'

const libraryFilterOptions: Array<{ value: LibraryFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'accessories', label: 'Accessories' },
]

function createItem(product: ProductRecord, location: Location, id = makeItemId(product.productId)) {
  return {
    ...product,
    id,
    location,
  }
}

function makeItemId(productId: string) {
  const uniquePart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return `${productId}-${uniquePart}`
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase()
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const fallbackProductImage = 'https://placehold.co/640x420/eef3f8/6b7a90?text=Add+Photo'

function getCategoryLabel(category: Category | '') {
  return categoryOptions.find((option) => option.value === category)?.label ?? 'Choose item type'
}

function formatWeightSummary(itemsToMeasure: Array<{ weight: string }>) {
  const totalGrams = itemsToMeasure.reduce((sum, item) => sum + parseWeightToGrams(item.weight), 0)
  if (totalGrams <= 0) {
    return '0.0 lb'
  }

  const totalPounds = totalGrams / 453.592
  return `${totalPounds.toFixed(1)} lb`
}

function parseWeightToGrams(weight: string) {
  const normalized = normalizeQuery(weight)
  if (!normalized) {
    return 0
  }

  const numericValue = Number.parseFloat(normalized.replace(/[^0-9.]/g, ''))
  if (Number.isNaN(numericValue)) {
    return 0
  }

  if (normalized.includes('kg')) {
    return numericValue * 1000
  }

  if (normalized.includes('lb')) {
    return numericValue * 453.592
  }

  if (normalized.includes('oz')) {
    return numericValue * 28.3495
  }

  return numericValue
}

function getBagAreaFromCategory(category: Category) {
  switch (category) {
    case 'sleep':
      return 'Sleep'
    case 'shelter':
      return 'Shelter'
    case 'cook':
    case 'fuel':
      return 'Cooking'
    default:
      return 'Essentials'
  }
}

function sortItemsByArea<T extends { category: Category; name: string }>(itemsToSort: T[]) {
  return [...itemsToSort].sort((left, right) => {
    const leftArea = areaOrder.get(getBagAreaFromCategory(left.category)) ?? 99
    const rightArea = areaOrder.get(getBagAreaFromCategory(right.category)) ?? 99

    if (leftArea !== rightArea) {
      return leftArea - rightArea
    }

    return left.name.localeCompare(right.name)
  })
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Unable to read file'))
      }
    }

    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'))
    reader.readAsDataURL(file)
  })
}

function dataUrlToBlob(dataUrl: string) {
  const [header, content] = dataUrl.split(',')
  if (!header || !content) {
    throw new Error('Invalid image data')
  }

  const mimeMatch = header.match(/data:(.*?);base64/)
  const mimeType = mimeMatch?.[1] ?? 'application/octet-stream'
  const byteCharacters = atob(content)
  const byteNumbers = new Array(byteCharacters.length)

  for (let index = 0; index < byteCharacters.length; index += 1) {
    byteNumbers[index] = byteCharacters.charCodeAt(index)
  }

  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType })
}

function encodeSharedLoadoutPayload(payload: SharedLoadoutPayload) {
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeSharedLoadoutPayload(value: string) {
  try {
    const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/')
    const paddedValue = normalizedValue.padEnd(Math.ceil(normalizedValue.length / 4) * 4, '=')
    const binary = atob(paddedValue)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as SharedLoadoutPayload

    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return null
    }

    const sanitizedItems = parsed.items.filter((item) => {
      if (
        !item ||
        typeof item.productId !== 'string' ||
        typeof item.name !== 'string' ||
        typeof item.brand !== 'string' ||
        typeof item.category !== 'string' ||
        typeof item.image !== 'string' ||
        !item.location
      ) {
        return false
      }

      if (item.location.zone === 'bag') {
        return true
      }

      if (item.location.zone === 'wear') {
        const slotId = item.location.slotId
        return typeof slotId === 'string' && wearSlots.some((slot) => slot.id === slotId)
      }

      return false
    })

    return {
      version: 1 as const,
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : 'Shared Loadout',
      items: sanitizedItems,
    }
  } catch {
    return null
  }
}

function getSharedLoadoutFromWindow() {
  if (typeof window === 'undefined') {
    return null
  }

  const hashValue = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const hashParams = new URLSearchParams(hashValue)
  const sharedParam = hashParams.get('shared') ?? new URLSearchParams(window.location.search).get('shared')
  if (!sharedParam) {
    return null
  }

  return decodeSharedLoadoutPayload(sharedParam)
}

async function uploadCustomProductImage(userId: string, productId: string, imageValue: string) {
  if (supabase === null || !imageValue.startsWith('data:')) {
    return imageValue
  }

  const blob = dataUrlToBlob(imageValue)
  const extension = blob.type.split('/')[1] || 'png'
  const filePath = `${userId}/${productId}-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(CUSTOM_PRODUCT_IMAGES_BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type,
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from(CUSTOM_PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

function getStorageKey(scope: string, userId: string) {
  return `camping-planner:${userId}:${scope}`
}

function mergeProducts(...productLists: ProductRecord[][]) {
  const seenIds = new Set<string>()
  const merged: ProductRecord[] = []

  for (const productList of productLists) {
    for (const product of productList) {
      if (seenIds.has(product.productId)) {
        continue
      }

      seenIds.add(product.productId)
      merged.push(product)
    }
  }

  return merged
}

function fromCustomProductRow(row: CustomProductRow): ProductRecord {
  return {
    productId: row.product_id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    weight: row.weight ?? '',
    rarity: row.rarity ?? 'common',
    icon: row.icon,
    image: row.image,
    purchaseLink: row.purchase_link ?? '',
    notes: row.notes ?? '',
  }
}

function fromCatalogProductRow(row: CatalogProductRow): ProductRecord {
  return {
    productId: row.product_id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    weight: row.weight ?? '',
    rarity: row.rarity ?? 'common',
    icon: row.icon,
    image: row.image,
    purchaseLink: row.purchase_link ?? '',
    notes: row.notes ?? '',
  }
}

function toCustomProductInsert(product: ProductRecord, user: Pick<User, 'id' | 'email'>) {
  return {
    user_id: user.id,
    user_email: user.email ?? null,
    product_id: product.productId,
    name: product.name,
    brand: product.brand,
    category: product.category,
    weight: product.weight || null,
    rarity: product.rarity,
    icon: product.icon,
    image: product.image,
    purchase_link: product.purchaseLink || null,
    notes: product.notes || null,
  }
}

function loadStoredValue<T>(storageKey: string, fallbackValue: T) {
  if (typeof window === 'undefined') {
    return fallbackValue
  }

  const saved = window.localStorage.getItem(storageKey)
  if (!saved) {
    return fallbackValue
  }

  try {
    return JSON.parse(saved) as T
  } catch {
    return fallbackValue
  }
}

function saveStoredValue(storageKey: string, value: unknown) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value))
}

function getAcceptedCategories(target: DropTarget) {
  if (target.zone === 'home' || target.zone === 'bag') {
    return []
  }

  return wearSlots.find((slot) => slot.id === target.slotId)?.accepts ?? []
}

function canDropItem(item: GearItem, target: DropTarget) {
  if (target.zone === 'home' || target.zone === 'bag') {
    return true
  }

  return getAcceptedCategories(target).includes(item.category)
}

function sameLocation(location: Location, target: DropTarget) {
  if (location.zone !== target.zone) {
    return false
  }

  if (location.zone === 'home' && target.zone === 'home') {
    return true
  }

  if (location.zone === 'bag' && target.zone === 'bag') {
    return false
  }

  if (location.zone === 'home' || target.zone === 'home' || location.zone === 'bag' || target.zone === 'bag') {
    return false
  }

  return location.slotId === target.slotId
}

function SetupPanel() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="auth-eyebrow">Setup Required</p>
        <h1>Connect Supabase to enable accounts</h1>
        <p className="auth-copy">
          Add your Supabase project URL and publishable key, then reload the app.
        </p>
        <div className="auth-code-block">
          <code>VITE_SUPABASE_URL={supabaseConfig.urlPlaceholder}</code>
          <code>VITE_SUPABASE_PUBLISHABLE_KEY={supabaseConfig.keyPlaceholder}</code>
        </div>
        <p className="auth-hint">
          Also make sure your Supabase Auth URL configuration includes <strong>{window.location.origin}</strong> as an
          allowed redirect URL for magic links.
        </p>
      </section>
    </main>
  )
}

function AuthScreen() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      return
    }

    setIsSending(true)
    setErrorMessage(null)
    setStatus(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setStatus(`Magic link sent to ${email.trim()}. Open your email to continue.`)
    }

    setIsSending(false)
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="auth-eyebrow">Magic Link Sign In</p>
        <h1>Save your gear by account</h1>
        <p className="auth-copy">
          Sign in with your email and we&apos;ll keep your products, bag, and wear setup tied to your account.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="auth-submit" disabled={isSending || !email.trim()}>
            {isSending ? 'Sending...' : 'Email Me A Sign-In Link'}
          </button>
        </form>

        {status ? <p className="auth-feedback auth-feedback--success">{status}</p> : null}
        {errorMessage ? <p className="auth-feedback auth-feedback--error">{errorMessage}</p> : null}
      </section>
    </main>
  )
}

function SharedLoadoutView({ payload }: { payload: SharedLoadoutPayload }) {
  const [inspectedSharedItem, setInspectedSharedItem] = useState<SharedLoadoutItem | null>(null)
  const wearingItems = payload.items.filter((item) => item.location.zone === 'wear')
  const bagItems = payload.items.filter((item) => item.location.zone === 'bag')
  const packedWeightSummary = formatWeightSummary(payload.items)
  const shelterSectionItems = sortItemsByArea(
    bagItems.filter((item) => item.category === 'shelter' || item.category === 'sleep'),
  )
  const cookingSectionItems = sortItemsByArea(
    bagItems.filter((item) => item.category === 'cook' || item.category === 'fuel' || item.category === 'hydration'),
  )
  const essentialSectionItems = sortItemsByArea(
    bagItems.filter(
      (item) =>
        item.category !== 'shelter' &&
        item.category !== 'sleep' &&
        item.category !== 'cook' &&
        item.category !== 'fuel' &&
        item.category !== 'hydration',
    ),
  )
  const visibleShelterItems = shelterSectionItems.slice(0, 3)
  const visibleCookingItems = cookingSectionItems.slice(0, 3)
  const visibleEssentialItems = essentialSectionItems.length > 5 ? essentialSectionItems.slice(0, 4) : essentialSectionItems.slice(0, 5)
  const hiddenEssentialCount = Math.max(0, essentialSectionItems.length - visibleEssentialItems.length)
  const filledWearSlots: Array<{ slot: WearSlot; item: SharedLoadoutItem }> = wearSlots.flatMap((slot) => {
      const item =
        wearingItems.find(
          (wearItem): wearItem is SharedLoadoutItem & { location: { zone: 'wear'; slotId: WearSlotId } } =>
            wearItem.location.zone === 'wear' && wearItem.location.slotId === slot.id,
        ) ?? null

      return item ? [{ slot, item }] : []
    })

  function getSharedLocationLabel(item: SharedLoadoutItem) {
    const location = item.location

    if (location.zone === 'wear') {
      return wearSlots.find((slot) => slot.id === location.slotId)?.label ?? 'Wearing'
    }

    return 'Packed in bag'
  }

  function openSharedItemDetails(item: SharedLoadoutItem) {
    setInspectedSharedItem(item)
  }

  function handleSharedCardKeyDown(event: ReactKeyboardEvent<HTMLElement>, item: SharedLoadoutItem) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    openSharedItemDetails(item)
  }

  function renderSharedWearSlot(slot: WearSlot) {
    const item =
      wearingItems.find(
        (wearItem): wearItem is SharedLoadoutItem & { location: { zone: 'wear'; slotId: WearSlotId } } =>
          wearItem.location.zone === 'wear' && wearItem.location.slotId === slot.id,
      ) ?? null

    return (
      <div key={slot.id} className={`wear-slot ${item ? 'has-item' : 'is-empty'}`}>
        {item ? (
          <div
            className={`wear-item wear-item--readonly shared-clickable-card rarity-${item.rarity}`}
            role="button"
            tabIndex={0}
            onClick={() => openSharedItemDetails(item)}
            onKeyDown={(event) => handleSharedCardKeyDown(event, item)}
          >
            <img className="wear-item__image" src={item.image} alt={item.name} loading="lazy" />
            <span className="wear-item__copy">
              <small>{slot.label}</small>
              <strong>{item.name}</strong>
              <span>{item.brand}</span>
            </span>
          </div>
        ) : (
          <div className="wear-item wear-item--empty wear-item--readonly">
            <span className="wear-item__empty-icon">+</span>
            <span className="wear-item__copy">
              <small>{slot.label}</small>
              <strong>{`Add ${slot.label.toLowerCase()}`}</strong>
              <span>{slot.label}</span>
            </span>
          </div>
        )}
      </div>
    )
  }

  function renderSharedWorkbenchCard(item: SharedLoadoutItem) {
    return (
      <article
        key={item.productId}
        className={`workbench-card workbench-card--readonly shared-clickable-card rarity-${item.rarity}`}
        role="button"
        tabIndex={0}
        onClick={() => openSharedItemDetails(item)}
        onKeyDown={(event) => handleSharedCardKeyDown(event, item)}
      >
        <div className="workbench-card__media">
          <img src={item.image} alt={item.name} loading="lazy" />
        </div>
        <div className="workbench-card__copy">
          <strong>{item.name}</strong>
          <span>{item.brand}</span>
        </div>
      </article>
    )
  }

  function renderSharedEssentialTile(item: SharedLoadoutItem) {
    return (
      <article
        key={item.productId}
        className={`essential-tile essential-tile--readonly shared-clickable-card rarity-${item.rarity}`}
        role="button"
        tabIndex={0}
        onClick={() => openSharedItemDetails(item)}
        onKeyDown={(event) => handleSharedCardKeyDown(event, item)}
      >
        <img src={item.image} alt={item.name} loading="lazy" />
        <span>{item.name}</span>
      </article>
    )
  }

  function renderSharedEssentialOverflowTile(hiddenCount: number) {
    return (
      <article className="essential-tile essential-tile--readonly essential-tile--more">
        <span className="essential-tile__overflow-count">+{hiddenCount}</span>
      </article>
    )
  }

  function renderSharedMobileWearItem({ slot, item }: { slot: WearSlot; item: SharedLoadoutItem }) {
    return (
      <article
        key={slot.id}
        className={`shared-mobile-wear-card shared-clickable-card rarity-${item.rarity}`}
        role="button"
        tabIndex={0}
        onClick={() => openSharedItemDetails(item)}
        onKeyDown={(event) => handleSharedCardKeyDown(event, item)}
      >
        <img src={item.image} alt={item.name} loading="lazy" />
        <span className="shared-mobile-wear-card__copy">
          <small>{slot.label}</small>
          <strong>{item.name}</strong>
          <span>{item.brand}</span>
        </span>
      </article>
    )
  }

  return (
    <>
      <main className="app-shell shared-loadout-app">
        <section className="trailwise-frame shared-loadout-frame">
          <header className="trailwise-topbar panel">
            <div className="trailwise-brand">
              <strong>TRAILWISE</strong>
            </div>
            <div className="shared-loadout-topbar__meta">
              <span>Shared</span>
            </div>
          </header>

          <section className="dashboard-layout dashboard-layout--shared shared-desktop-loadout">
            <aside className="panel dashboard-panel wearing-panel shared-loadout-panel">
              <div className="section-heading">
                <p>Wearing</p>
              </div>
              <div className="wearing-panel__list">{wearSlots.map((slot) => renderSharedWearSlot(slot))}</div>
            </aside>

            <section className="panel dashboard-panel workbench-panel shared-loadout-panel">
              <div className="workbench-scroll shared-loadout-workbench">
                <div
                  className="workbench-hero workbench-hero--shared"
                  style={{ backgroundImage: `linear-gradient(rgba(18, 28, 22, 0.28), rgba(18, 28, 22, 0.34)), url(${heroBackgroundImage})` }}
                >
                  <div className="workbench-hero__overlay">
                    <h1>{payload.title || loadoutTitle}</h1>
                    <div className="workbench-hero__stats">
                      <span>{payload.items.length} Items</span>
                      <span>{packedWeightSummary}</span>
                      <span>Rain Ready</span>
                    </div>
                  </div>
                </div>

                <div className="workbench-groups">
                  {shelterSectionItems.length > 0 ? (
                    <section className="workbench-group">
                      <div className="workbench-group__header">
                        <h3>Shelter</h3>
                        <span>{shelterSectionItems.length} items</span>
                      </div>
                      <div className="workbench-grid workbench-grid--shelter">
                        {visibleShelterItems.map((item) => renderSharedWorkbenchCard(item))}
                      </div>
                    </section>
                  ) : null}

                  {cookingSectionItems.length > 0 ? (
                    <section className="workbench-group">
                      <div className="workbench-group__header">
                        <h3>Cooking</h3>
                        <span>{cookingSectionItems.length} items</span>
                      </div>
                      <div className="workbench-grid workbench-grid--cooking">
                        {visibleCookingItems.map((item) => renderSharedWorkbenchCard(item))}
                      </div>
                    </section>
                  ) : null}

                  {essentialSectionItems.length > 0 ? (
                    <section className="workbench-group workbench-group--essentials">
                      <div className="workbench-group__header">
                        <h3>Essentials</h3>
                        <span>{essentialSectionItems.length} items</span>
                      </div>
                      <div className="essentials-strip">
                        {visibleEssentialItems.map((item) => renderSharedEssentialTile(item))}
                        {hiddenEssentialCount > 0 ? renderSharedEssentialOverflowTile(hiddenEssentialCount) : null}
                      </div>
                    </section>
                  ) : null}

                  {bagItems.length === 0 ? (
                    <div className="workbench-empty">
                      <strong>No bag items shared</strong>
                      <span>This shared loadout only includes worn items right now.</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </section>

          <section className="shared-mobile-landing">
            <div
              className="shared-mobile-hero"
              style={{ backgroundImage: `linear-gradient(rgba(18, 28, 22, 0.24), rgba(18, 28, 22, 0.38)), url(${heroBackgroundImage})` }}
            >
              <div className="shared-mobile-hero__content">
                <h1>{payload.title || loadoutTitle}</h1>
                <div className="shared-mobile-hero__stats">
                  <span>{payload.items.length} Items</span>
                  <span>{packedWeightSummary}</span>
                  <span>Rain Ready</span>
                </div>
              </div>
            </div>

            {filledWearSlots.length > 0 ? (
              <section className="shared-mobile-section">
                <div className="shared-mobile-section__header">
                  <h2>Wearing</h2>
                  <span>{filledWearSlots.length} items</span>
                </div>
                <div className="shared-mobile-wear-list">
                  {filledWearSlots.map((slotItem) => renderSharedMobileWearItem(slotItem))}
                </div>
              </section>
            ) : null}

            {bagItems.length > 0 ? (
              <section className="shared-mobile-section shared-mobile-section--packed">
                <div className="shared-mobile-section__header">
                  <h2>Packed</h2>
                  <span>{bagItems.length} items</span>
                </div>

                {shelterSectionItems.length > 0 ? (
                  <section className="shared-mobile-gear-group">
                    <div className="shared-mobile-gear-group__header">
                      <h3>Shelter</h3>
                      <span>{shelterSectionItems.length} items</span>
                    </div>
                    <div className="shared-mobile-gear-grid">
                      {visibleShelterItems.map((item) => renderSharedWorkbenchCard(item))}
                    </div>
                  </section>
                ) : null}

                {cookingSectionItems.length > 0 ? (
                  <section className="shared-mobile-gear-group">
                    <div className="shared-mobile-gear-group__header">
                      <h3>Cooking</h3>
                      <span>{cookingSectionItems.length} items</span>
                    </div>
                    <div className="shared-mobile-gear-grid">
                      {visibleCookingItems.map((item) => renderSharedWorkbenchCard(item))}
                    </div>
                  </section>
                ) : null}

                {essentialSectionItems.length > 0 ? (
                  <section className="shared-mobile-gear-group">
                    <div className="shared-mobile-gear-group__header">
                      <h3>Essentials</h3>
                      <span>{essentialSectionItems.length} items</span>
                    </div>
                    <div className="shared-mobile-essentials-grid">
                      {visibleEssentialItems.map((item) => renderSharedEssentialTile(item))}
                      {hiddenEssentialCount > 0 ? renderSharedEssentialOverflowTile(hiddenEssentialCount) : null}
                    </div>
                  </section>
                ) : null}
              </section>
            ) : null}
          </section>
        </section>
      </main>

      {inspectedSharedItem ? (
        <div className="modal-shell" role="presentation" onClick={() => setInspectedSharedItem(null)}>
          <section
            className="modal-panel item-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shared-item-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-panel__header">
              <div>
                <p className="modal-eyebrow">{getCategoryLabel(inspectedSharedItem.category)}</p>
                <h2 id="shared-item-detail-title">{inspectedSharedItem.name}</h2>
              </div>
              <button type="button" className="modal-close" onClick={() => setInspectedSharedItem(null)}>
                Close
              </button>
            </div>

            <div className="item-detail-panel__body">
              <div className="item-detail-panel__media">
                <img src={inspectedSharedItem.image} alt={inspectedSharedItem.name} loading="lazy" />
              </div>
              <div className="item-detail-panel__content">
                <div className="item-detail-panel__summary">
                  <strong>{inspectedSharedItem.brand}</strong>
                  <span>{getSharedLocationLabel(inspectedSharedItem)}</span>
                </div>

                <dl className="item-detail-panel__facts">
                  <div>
                    <dt>Type</dt>
                    <dd>{getCategoryLabel(inspectedSharedItem.category)}</dd>
                  </div>
                  <div>
                    <dt>Weight</dt>
                    <dd>{inspectedSharedItem.weight || 'Not set'}</dd>
                  </div>
                </dl>

                <p className="item-detail-panel__notes">
                  {inspectedSharedItem.notes || 'No notes saved for this item yet.'}
                </p>

                {inspectedSharedItem.purchaseLink ? (
                  <div className="item-detail-panel__actions">
                    <a
                      className="manual-link item-detail-panel__link"
                      href={inspectedSharedItem.purchaseLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Product
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

function PlannerApp({ user, onSignOut }: { user: User; onSignOut: () => Promise<void> }) {
  const [items, setItems] = useState(() => loadStoredValue(getStorageKey('items', user.id), initialItems))
  const [catalog, setCatalog] = useState(() => loadStoredValue(getStorageKey('catalog', user.id), seedProducts))
  const [rememberedBagItemIds, setRememberedBagItemIds] = useState<string[]>(() =>
    loadStoredValue(getStorageKey('bag-memory', user.id), []),
  )
  const [customProductsError, setCustomProductsError] = useState<string | null>(null)
  const [customProductsReady, setCustomProductsReady] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isEssentialsExpanded, setIsEssentialsExpanded] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px)').matches : false,
  )
  const [mobileView, setMobileView] = useState<MobileView>('wear')
  const [manualDraft, setManualDraft] = useState<ManualProductDraft>(blankManualDraft)
  const [selectedSuggestionProductId, setSelectedSuggestionProductId] = useState<string | null>(null)
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>('all')
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const manualNameInputRef = useRef<HTMLInputElement | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)
  const catalogRef = useRef(catalog)
  const ownedProductIds = new Set(items.map((item) => item.productId))
  const backpackEquipped = items.some(
    (item) => item.location.zone === 'wear' && item.location.slotId === 'backpack',
  )
  const previousBackpackEquipped = useRef(backpackEquipped)

  useEffect(() => {
    saveStoredValue(getStorageKey('items', user.id), items)
  }, [items, user.id])

  useEffect(() => {
    saveStoredValue(getStorageKey('catalog', user.id), catalog)
  }, [catalog, user.id])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }

      if (!mobileMenuRef.current?.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)')

    function handleMediaChange(event: MediaQueryListEvent) {
      setIsMobileLayout(event.matches)
    }

    setIsMobileLayout(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])

  useEffect(() => {
    if (!isMobileLayout) {
      setIsMobileMenuOpen(false)
    }
  }, [isMobileLayout])

  useEffect(() => {
    catalogRef.current = catalog
  }, [catalog])

  useEffect(() => {
    if (activeItemId && !items.some((item) => item.id === activeItemId)) {
      setActiveItemId(null)
    }

    if (editingItemId && !items.some((item) => item.id === editingItemId)) {
      setEditingItemId(null)
    }
  }, [activeItemId, editingItemId, items])

  useEffect(() => {
    saveStoredValue(getStorageKey('bag-memory', user.id), rememberedBagItemIds)
  }, [rememberedBagItemIds, user.id])

  useEffect(() => {
    if (supabase === null) {
      return
    }

    const client = supabase

    let isMounted = true

    async function loadCatalogProducts() {
      const localCustomProducts = catalogRef.current.filter((product) => !seededProductIds.has(product.productId))

      const { data: catalogData, error: catalogError } = await client
        .from(CATALOG_PRODUCTS_TABLE)
        .select('id, product_id, name, brand, category, weight, rarity, icon, image, purchase_link, notes, created_at')
        .order('brand', { ascending: true })
        .order('name', { ascending: true })

      if (!isMounted) {
        return
      }

      if (catalogError) {
        setCustomProductsError(
          `Catalog products could not be loaded from Supabase yet: ${catalogError.message}`,
        )
        setCustomProductsReady(true)
        return
      }

      const remoteCatalogProducts = (catalogData as CatalogProductRow[]).map(fromCatalogProductRow)

      const { data: customData, error: customError } = await client
        .from(CUSTOM_PRODUCTS_TABLE)
        .select(
          'id, user_id, user_email, product_id, name, brand, category, weight, rarity, icon, image, purchase_link, notes, created_at',
        )
        .order('created_at', { ascending: false })

      if (!isMounted) {
        return
      }

      if (customError) {
        setCustomProductsError(
          `Custom products could not be loaded from Supabase yet: ${customError.message}`,
        )
        setCustomProductsReady(true)
        return
      }

      const remoteProducts = (customData as CustomProductRow[]).map(fromCustomProductRow)
      const remoteProductIds = new Set(remoteProducts.map((product) => product.productId))
      const localProductsToMigrate = localCustomProducts.filter((product) => !remoteProductIds.has(product.productId))

      setCatalog(
        mergeProducts(
          remoteCatalogProducts.length > 0 ? remoteCatalogProducts : seedProducts,
          remoteProducts,
          localCustomProducts,
        ),
      )
      setCustomProductsError(null)
      setCustomProductsReady(true)

      if (localProductsToMigrate.length > 0) {
        const { error: migrationError } = await client
          .from(CUSTOM_PRODUCTS_TABLE)
          .upsert(localProductsToMigrate.map((product) => toCustomProductInsert(product, user)), {
            onConflict: 'user_id,product_id',
          })

        if (migrationError && isMounted) {
          setCustomProductsError(
            'Custom products are still local-only because the server migration failed. Check the Supabase table setup.',
          )
        }
      }
    }

    void loadCatalogProducts()

    return () => {
      isMounted = false
    }
  }, [user.email, user.id])

  useEffect(() => {
    const wasBackpackEquipped = previousBackpackEquipped.current

    if (wasBackpackEquipped && !backpackEquipped) {
      const bagItemIds = items
        .filter((item) => item.location.zone === 'bag')
        .map((item) => item.id)

      setRememberedBagItemIds(bagItemIds)

      if (bagItemIds.length > 0) {
        setItems((currentItems) =>
          currentItems.map((item) =>
            bagItemIds.includes(item.id) ? { ...item, location: { zone: 'home' } } : item,
          ),
        )
      }
    }

    if (!wasBackpackEquipped && backpackEquipped && rememberedBagItemIds.length > 0) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          rememberedBagItemIds.includes(item.id) && item.location.zone === 'home'
            ? { ...item, location: { zone: 'bag' } }
            : item,
        ),
      )
    }

    previousBackpackEquipped.current = backpackEquipped
  }, [backpackEquipped, items, rememberedBagItemIds])

  useEffect(() => {
    if (!isAddModalOpen) {
      return
    }

    manualNameInputRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAddModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAddModalOpen])

  useEffect(() => {
    if (!activeItemId) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveItemId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeItemId])

  function itemAt(target: DropTarget) {
    return items.find((item) => sameLocation(item.location, target))
  }

  function resetProductEditor() {
    setSelectedSuggestionProductId(null)
    setManualDraft(blankManualDraft)
    setCustomProductsError(null)
    setEditingItemId(null)
  }

  function closeAddModal() {
    setIsAddModalOpen(false)
    resetProductEditor()
  }

  function closeShareModal() {
    setIsShareModalOpen(false)
    setShareFeedback(null)
  }

  function openAddModal(prefill: Partial<ManualProductDraft> = {}) {
    setEditingItemId(null)
    setSelectedSuggestionProductId(null)
    setCustomProductsError(null)
    setManualDraft({
      ...blankManualDraft,
      ...prefill,
    })
    setIsAddModalOpen(true)
  }

  function buildSharedLoadoutUrl() {
    if (typeof window === 'undefined') {
      return ''
    }

    const sharedItems: SharedLoadoutItem[] = items
      .filter(
        (item): item is GearItem & { location: SharedLoadoutLocation } =>
          item.location.zone === 'bag' || item.location.zone === 'wear',
      )
      .map((item) => ({
        productId: item.productId,
        name: item.name,
        brand: item.brand,
        category: item.category,
        weight: item.weight,
        rarity: item.rarity,
        icon: item.icon,
        image: item.image,
        purchaseLink: item.purchaseLink,
        notes: item.notes,
        location: item.location,
      }))

    const payload: SharedLoadoutPayload = {
      version: 1,
      title: loadoutTitle,
      items: sharedItems,
    }

    const url = new URL(window.location.origin + window.location.pathname)
    url.hash = `shared=${encodeSharedLoadoutPayload(payload)}`
    return url.toString()
  }

  async function handleCopySharedLoadoutLink() {
    const sharedUrl = buildSharedLoadoutUrl()
    if (!sharedUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(sharedUrl)
      setShareFeedback('View-only loadout link copied.')
    } catch {
      setShareFeedback('Copy failed. You can still copy the link from the field below.')
    }
  }

  function moveItem(itemId: string, target: DropTarget) {
    setItems((currentItems) => {
      const movingItem = currentItems.find((item) => item.id === itemId)
      if (!movingItem || !canDropItem(movingItem, target) || sameLocation(movingItem.location, target)) {
        return currentItems
      }

      const occupiedItem = currentItems.find((item) => sameLocation(item.location, target))

      return currentItems.map((item) => {
        if (item.id === movingItem.id) {
          return { ...item, location: target }
        }

        if (occupiedItem && item.id === occupiedItem.id) {
          return { ...item, location: { zone: 'home' } }
        }

        return item
      })
    })
  }

  function findFirstAvailableTarget(item: GearItem): DropTarget | null {
    if (item.location.zone === 'home') {
      for (const slot of wearSlots) {
        const target: DropTarget = { zone: 'wear', slotId: slot.id }
        if (canDropItem(item, target) && !itemAt(target)) {
          return target
        }
      }

      return backpackEquipped ? { zone: 'bag' } : null
    }

    return { zone: 'home' }
  }

  function getLocationLabel(item: GearItem) {
    if (item.location.zone === 'home') {
      return 'At Home'
    }

    if (item.location.zone === 'bag') {
      return `In Bag · ${getBagAreaFromCategory(item.category)}`
    }

    const slotLabel =
      wearSlots.find((slot) => slot.id === (item.location.zone === 'wear' ? item.location.slotId : 'head'))?.label ??
      'Wearing'
    return `Wearing · ${slotLabel}`
  }

  function getItemAction(item: GearItem): { label: string; target: DropTarget } | null {
    if (item.location.zone === 'home') {
      const target = findFirstAvailableTarget(item)
      if (!target) {
        return null
      }

      if (target.zone === 'wear') {
        const slotLabel = wearSlots.find((slot) => slot.id === target.slotId)?.label ?? 'Wear'
        return { label: `Equip to ${slotLabel}`, target }
      }

      if (target.zone === 'bag') {
        return { label: 'Pack In Bag', target }
      }

      return null
    }

    if (item.location.zone === 'bag') {
      return { label: 'Remove From Bag', target: { zone: 'home' } }
    }

    return { label: 'Unequip To Home', target: { zone: 'home' } }
  }

  function handleCardClick(item: GearItem) {
    setActiveItemId(item.id)
  }

  function handleItemAction(item: GearItem, target: DropTarget) {
    moveItem(item.id, target)
    setActiveItemId(null)
  }

  function openEditModal(item: GearItem) {
    setEditingItemId(item.id)
    setSelectedSuggestionProductId(null)
    setCustomProductsError(null)
    setManualDraft({
      name: item.name,
      brand: item.brand,
      category: item.category,
      image: item.image,
      purchaseLink: item.purchaseLink,
    })
    setActiveItemId(null)
    setIsAddModalOpen(true)
  }

  async function removeItemFromLibrary(item: GearItem) {
    if (supabase === null) {
      return
    }

    if (!seededProductIds.has(item.productId)) {
      const { error } = await supabase
        .from(CUSTOM_PRODUCTS_TABLE)
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', item.productId)

      if (error) {
        setCustomProductsError(
          'This product could not be removed from Supabase. Check that the custom_products table and policies are set up.',
        )
        return
      }
    }

    setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id))
    setRememberedBagItemIds((currentIds) => currentIds.filter((currentId) => currentId !== item.id))

    if (!seededProductIds.has(item.productId)) {
      setCatalog((currentCatalog) =>
        currentCatalog.filter((product) => product.productId !== item.productId),
      )
    }

    setCustomProductsError(null)
    setActiveItemId(null)
  }

  function handleDrop(target: DropTarget) {
    if (!draggedId) {
      return
    }

    const movingItem = items.find((item) => item.id === draggedId)
    if (!movingItem || !canDropItem(movingItem, target)) {
      setDraggedId(null)
      return
    }

    moveItem(draggedId, target)
    setDraggedId(null)
  }

  function sortByArea(itemsToSort: GearItem[]) {
    return sortItemsByArea(itemsToSort)
  }

  function hasOwnedProduct(
    draft: Pick<ManualProductDraft, 'name' | 'brand' | 'category'>,
    excludedItemId?: string,
  ) {
    const normalizedName = normalizeQuery(draft.name)
    const normalizedBrand = normalizeQuery(draft.brand)

    if (!normalizedName) {
      return false
    }

    return items.some((item) => {
      if (excludedItemId && item.id === excludedItemId) {
        return false
      }

      if (normalizeQuery(item.name) !== normalizedName) {
        return false
      }

      if (draft.category && item.category !== draft.category) {
        return false
      }

      if (!normalizedBrand) {
        return true
      }

      return normalizeQuery(item.brand) === normalizedBrand
    })
  }

  function interleaveProductsByBrand(products: ProductRecord[]) {
    const sortedProducts = [...products].sort(
      (left, right) => left.brand.localeCompare(right.brand) || left.name.localeCompare(right.name),
    )
    const brandBuckets = new Map<string, ProductRecord[]>()

    for (const product of sortedProducts) {
      const bucket = brandBuckets.get(product.brand) ?? []
      bucket.push(product)
      brandBuckets.set(product.brand, bucket)
    }

    const brandOrder = [...brandBuckets.keys()].sort((left, right) => left.localeCompare(right))
    const interleaved: ProductRecord[] = []

    while (interleaved.length < sortedProducts.length) {
      let addedProduct = false

      for (const brand of brandOrder) {
        const bucket = brandBuckets.get(brand)
        if (!bucket || bucket.length === 0) {
          continue
        }

        interleaved.push(bucket.shift()!)
        addedProduct = true
      }

      if (!addedProduct) {
        break
      }
    }

    return interleaved
  }

  function getSuggestedProducts() {
    const nameQuery = normalizeQuery(manualDraft.name)
    const brandQuery = normalizeQuery(manualDraft.brand)
    const imageQuery = normalizeQuery(manualDraft.image)
    const purchaseLinkQuery = normalizeQuery(manualDraft.purchaseLink)
    const hasFilters = Boolean(
      nameQuery || brandQuery || manualDraft.category || imageQuery || purchaseLinkQuery,
    )

    const candidates = catalog.filter((product) => !ownedProductIds.has(product.productId))
    const baseMatches = candidates.filter((product) => {
      if (manualDraft.category && product.category !== manualDraft.category) {
        return false
      }

      if (brandQuery) {
        const normalizedBrand = product.brand.toLowerCase()
        if (!normalizedBrand.startsWith(brandQuery) && !normalizedBrand.includes(brandQuery)) {
          return false
        }
      }

      if (imageQuery && !product.image.toLowerCase().includes(imageQuery)) {
        return false
      }

      if (purchaseLinkQuery && !product.purchaseLink.toLowerCase().includes(purchaseLinkQuery)) {
        return false
      }

      return true
    })

    if (!hasFilters) {
      return interleaveProductsByBrand(baseMatches).slice(0, 16)
    }

    const rankedEntries: Array<{ product: ProductRecord; score: number }> = []

    if (nameQuery) {
      const nameMatches = baseMatches
        .map((product) => {
          const normalizedName = product.name.toLowerCase()

          if (normalizedName === nameQuery) {
            return { product, score: 0 }
          }

          if (normalizedName.startsWith(nameQuery)) {
            return { product, score: 1 }
          }

          if (normalizedName.includes(nameQuery)) {
            return { product, score: 2 }
          }

          return null
        })
        .filter((entry): entry is { product: ProductRecord; score: number } => entry !== null)

      if (nameMatches.length > 0) {
        rankedEntries.push(...nameMatches)
      } else {
        rankedEntries.push(
          ...baseMatches
            .map((product) =>
              product.notes.toLowerCase().includes(nameQuery) ? { product, score: 4 } : null,
            )
            .filter((entry): entry is { product: ProductRecord; score: number } => entry !== null),
        )
      }
    } else {
      rankedEntries.push(...baseMatches.map((product) => ({ product, score: 0 })))
    }

    const groupedByScore = new Map<number, ProductRecord[]>()
    for (const entry of rankedEntries) {
      const products = groupedByScore.get(entry.score) ?? []
      products.push(entry.product)
      groupedByScore.set(entry.score, products)
    }

    return [...groupedByScore.keys()]
      .sort((left, right) => left - right)
      .flatMap((score) => interleaveProductsByBrand(groupedByScore.get(score) ?? []))
      .slice(0, 16)
  }

  function applySuggestedProduct(product: ProductRecord) {
    setSelectedSuggestionProductId(product.productId)
    setManualDraft({
      name: product.name,
      brand: product.brand,
      category: product.category,
      image: product.image,
      purchaseLink: product.purchaseLink,
    })
    setCustomProductsError(null)
  }

  function addProductToHome(product: ProductRecord) {
    setItems((currentItems) => {
      if (currentItems.some((item) => item.productId === product.productId)) {
        return currentItems
      }

      return [createItem(product, { zone: 'home' }), ...currentItems]
    })
    setCatalog((currentCatalog) =>
      currentCatalog.some((item) => item.productId === product.productId)
        ? currentCatalog
        : mergeProducts([product], currentCatalog),
    )
    closeAddModal()
  }

  function handleManualChange<K extends keyof ManualProductDraft>(field: K, value: ManualProductDraft[K]) {
    setSelectedSuggestionProductId(null)
    setCustomProductsError(null)
    setManualDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }))
  }

  async function handleImageFile(file: File | null) {
    if (!file || !file.type.startsWith('image/')) {
      return
    }

    const dataUrl = await readFileAsDataUrl(file)
    setManualDraft((currentDraft) => ({
      ...currentDraft,
      image: dataUrl,
    }))
  }

  function handleImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    void handleImageFile(file)
    event.target.value = ''
  }

  function handleImagePaste(event: ClipboardEvent<HTMLElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'))
    if (!imageItem) {
      return
    }

    event.preventDefault()
    void handleImageFile(imageItem.getAsFile())
  }

  function handleImageDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0] ?? null
    void handleImageFile(file)
  }

  async function handleManualAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (supabase === null) {
      return
    }

    const client = supabase

    const trimmedName = manualDraft.name.trim()
    const trimmedBrand = manualDraft.brand.trim()
    const trimmedImage = manualDraft.image.trim()
    const trimmedPurchaseLink = manualDraft.purchaseLink.trim()
    const selectedSuggestion =
      selectedSuggestionProductId === null
        ? null
        : catalog.find((product) => product.productId === selectedSuggestionProductId) ?? null

    if (!trimmedName || !manualDraft.category) {
      return
    }

    const editingItem = editingItemId ? items.find((item) => item.id === editingItemId) ?? null : null

    if (editingItem) {
      if (hasOwnedProduct({ name: trimmedName, brand: trimmedBrand, category: manualDraft.category }, editingItem.id)) {
        setCustomProductsError('This product is already in your wardrobe, bag, or home stash.')
        return
      }

      let storedImage = trimmedImage || fallbackProductImage

      if (trimmedImage.startsWith('data:') && !seededProductIds.has(editingItem.productId)) {
        try {
          storedImage = await uploadCustomProductImage(user.id, editingItem.productId, trimmedImage)
        } catch {
          setCustomProductsError(
            'The image could not be uploaded to Supabase Storage. Create the storage bucket and try again.',
          )
          return
        }
      }

      const updatedProduct: ProductRecord = {
        productId: editingItem.productId,
        name: trimmedName,
        brand: trimmedBrand || 'Custom',
        category: manualDraft.category,
        image: storedImage,
        purchaseLink: trimmedPurchaseLink,
        weight: editingItem.weight,
        rarity: editingItem.rarity,
        icon: `${(trimmedBrand || trimmedName).charAt(0)}${trimmedName.charAt(0)}`.toUpperCase(),
        notes: editingItem.notes,
      }

      if (!seededProductIds.has(editingItem.productId)) {
        const { error } = await client
          .from(CUSTOM_PRODUCTS_TABLE)
          .update({
            name: updatedProduct.name,
            brand: updatedProduct.brand,
            category: updatedProduct.category,
            weight: updatedProduct.weight || null,
            rarity: updatedProduct.rarity,
            icon: updatedProduct.icon,
            image: updatedProduct.image,
            purchase_link: updatedProduct.purchaseLink || null,
            notes: updatedProduct.notes || null,
          })
          .eq('user_id', user.id)
          .eq('product_id', editingItem.productId)

        if (error) {
          setCustomProductsError(
            'This product could not be updated in Supabase. Check that the custom_products table and policies are set up.',
          )
          return
        }
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingItem.id ? { ...updatedProduct, id: item.id, location: item.location } : item,
        ),
      )
      setCatalog((currentCatalog) =>
        currentCatalog.map((product) => (product.productId === editingItem.productId ? updatedProduct : product)),
      )
      setCustomProductsError(null)
      closeAddModal()
      return
    }

    if (
      selectedSuggestion &&
      trimmedName === selectedSuggestion.name &&
      trimmedBrand === selectedSuggestion.brand &&
      manualDraft.category === selectedSuggestion.category &&
      trimmedImage === selectedSuggestion.image &&
      trimmedPurchaseLink === selectedSuggestion.purchaseLink
    ) {
      addProductToHome(selectedSuggestion)
      return
    }

    if (hasOwnedProduct({ name: trimmedName, brand: trimmedBrand, category: manualDraft.category })) {
      setCustomProductsError('This product is already in your wardrobe, bag, or home stash.')
      return
    }

    const productIdBase = slugify(`${trimmedBrand}-${trimmedName}`) || `custom-${Date.now()}`
    const matchingCount = catalog.filter((product) => product.productId.startsWith(productIdBase)).length
    const productId = matchingCount > 0 ? `${productIdBase}-${matchingCount + 1}` : productIdBase
    let storedImage = trimmedImage || fallbackProductImage

    if (trimmedImage.startsWith('data:')) {
      try {
        storedImage = await uploadCustomProductImage(user.id, productId, trimmedImage)
      } catch {
        setCustomProductsError(
          'The image could not be uploaded to Supabase Storage. Create the storage bucket and try again.',
        )
        return
      }
    }

    const product: ProductRecord = {
      productId,
      name: trimmedName,
      brand: trimmedBrand || 'Custom',
      category: manualDraft.category,
      image: storedImage,
      purchaseLink: trimmedPurchaseLink,
      weight: '',
      rarity: 'common',
      icon: `${(trimmedBrand || trimmedName).charAt(0)}${trimmedName.charAt(0)}`.toUpperCase(),
      notes: '',
    }

    const { error } = await client.from(CUSTOM_PRODUCTS_TABLE).insert(toCustomProductInsert(product, user))

    if (error) {
      setCustomProductsError(
        'This product could not be saved to Supabase. Check that the custom_products table and policies are set up.',
      )
      return
    }

    setCustomProductsError(null)
    addProductToHome(product)
  }

  function matchesLibraryFilter(item: GearItem, filter: LibraryFilter) {
    switch (filter) {
      case 'clothing':
        return ['headwear', 'base-layer', 'mid-layer', 'shell', 'pants', 'footwear', 'accessory'].includes(
          item.category,
        )
      case 'shelter':
        return ['backpack', 'sleep', 'shelter'].includes(item.category)
      case 'cooking':
        return ['cook', 'fuel', 'hydration'].includes(item.category)
      case 'accessories':
        return ['accessory', 'safety', 'hydration'].includes(item.category)
      default:
        return true
    }
  }

  function renderWearSlot(slot: WearSlot) {
    const target: DropTarget = { zone: 'wear', slotId: slot.id }
    const slotItem = itemAt(target)
    const slotActive =
      draggedId !== null &&
      (() => {
        const movingItem = items.find((item) => item.id === draggedId)
        return movingItem ? canDropItem(movingItem, target) : false
      })()

    return (
      <div
        key={slot.id}
        className={`wear-slot ${slotActive ? 'is-active' : ''} ${slotItem ? 'has-item' : 'is-empty'}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => handleDrop(target)}
      >
        {slotItem ? (
          <button
            type="button"
            className={`wear-item rarity-${slotItem.rarity} ${draggedId === slotItem.id ? 'is-dragging' : ''}`}
            draggable
            onClick={() => handleCardClick(slotItem)}
            onDragStart={() => setDraggedId(slotItem.id)}
            onDragEnd={() => setDraggedId(null)}
          >
            <img className="wear-item__image" src={slotItem.image} alt={slotItem.name} loading="lazy" />
            <span className="wear-item__copy">
              <small>{slot.label}</small>
              <strong>{slotItem.name}</strong>
              <span>{slotItem.brand}</span>
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="wear-item wear-item--empty"
            onClick={() => openAddModal({ category: slot.accepts[0] || '' })}
          >
            <span className="wear-item__empty-icon">+</span>
            <span className="wear-item__copy">
              <small>{slot.label}</small>
              <strong>Add {slot.label.toLowerCase()}</strong>
              <span>{slot.accepts.map((category) => getCategoryLabel(category)).join(', ')}</span>
            </span>
          </button>
        )}
      </div>
    )
  }

  function renderWorkbenchCard(item: GearItem) {
    return (
      <button
        key={item.id}
        type="button"
        className={`workbench-card rarity-${item.rarity} ${draggedId === item.id ? 'is-dragging' : ''}`}
        draggable
        onClick={() => handleCardClick(item)}
        onDragStart={() => setDraggedId(item.id)}
        onDragEnd={() => setDraggedId(null)}
        title={item.purchaseLink ? 'Product has a saved purchase link' : undefined}
      >
        <div className="workbench-card__media">
          <img src={item.image} alt={item.name} loading="lazy" />
        </div>
        <div className="workbench-card__copy">
          <strong>{item.name}</strong>
          <span>{item.brand}</span>
        </div>
      </button>
    )
  }

  function renderEssentialTile(item: GearItem) {
    return (
      <button
        key={item.id}
        type="button"
        className={`essential-tile rarity-${item.rarity} ${draggedId === item.id ? 'is-dragging' : ''}`}
        draggable
        onClick={() => handleCardClick(item)}
        onDragStart={() => setDraggedId(item.id)}
        onDragEnd={() => setDraggedId(null)}
      >
        <img src={item.image} alt={item.name} loading="lazy" />
        <span>{item.name}</span>
      </button>
    )
  }

  function renderEssentialOverflowTile(hiddenCount: number) {
    return (
      <button
        key="essentials-overflow"
        type="button"
        className="essential-tile essential-tile--more"
        onClick={() => setIsEssentialsExpanded(true)}
        aria-label={`View ${hiddenCount} more essential items`}
      >
        <span className="essential-tile__overflow-count">+{hiddenCount}</span>
      </button>
    )
  }

  function renderLibraryCard(item: GearItem) {
    return (
      <button
        key={item.id}
        type="button"
        className={`library-card rarity-${item.rarity} ${draggedId === item.id ? 'is-dragging' : ''}`}
        draggable
        onClick={() => handleCardClick(item)}
        onDragStart={() => setDraggedId(item.id)}
        onDragEnd={() => setDraggedId(null)}
      >
        <div className="library-card__media">
          <img src={item.image} alt={item.name} loading="lazy" />
        </div>
        <div className="library-card__copy">
          <strong>{item.name}</strong>
          <span>{item.brand}</span>
        </div>
      </button>
    )
  }

  function renderHeaderActions(buttonClass = 'topbar-button') {
    return (
      <>
        <button type="button" className={`${buttonClass} ${buttonClass === 'topbar-button' ? 'topbar-button--primary' : ''}`} onClick={() => openAddModal()}>
          <span className="topbar-button__icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 3.25v9.5M3.25 8h9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          Add Gear
        </button>
        <button
          type="button"
          className={buttonClass}
        >
          <span className="topbar-button__icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none">
              <path
                d="M4.75 3.25h6.5a1 1 0 0 1 1 1v8l-4.25-2.5-4.25 2.5v-8a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Save Kit
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            setIsMobileMenuOpen(false)
            setShareFeedback(null)
            setIsShareModalOpen(true)
          }}
        >
          <span className="topbar-button__icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none">
              <path
                d="M8 10.75v-7M5.5 6.25 8 3.75l2.5 2.5M4 8.25v2.5c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.5"
                stroke="currentColor"
                strokeWidth="1.45"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Share
        </button>
      </>
    )
  }

  const wearItems = items.filter((item) => item.location.zone === 'wear')
  const bagItems = items.filter((item) => item.location.zone === 'bag')
  const homeItems = items.filter((item) => item.location.zone === 'home')
  const visibleHomeItems = homeItems.filter((item) => matchesLibraryFilter(item, libraryFilter))
  const packedItems = [...wearItems, ...bagItems]
  const packedWeightSummary = formatWeightSummary(packedItems)
  const suggestedProducts = getSuggestedProducts()
  const showWorkbenchPanel = backpackEquipped || isMobileLayout
  const showWearingPanel = !isMobileLayout || mobileView === 'wear'
  const showBagPanel = !isMobileLayout ? backpackEquipped : mobileView === 'bag'
  const showLibraryPanel = !isMobileLayout || mobileView === 'library'
  const shelterSectionItems = sortByArea(bagItems.filter((item) => item.category === 'shelter' || item.category === 'sleep'))
  const cookingSectionItems = sortByArea(
    bagItems.filter((item) => item.category === 'cook' || item.category === 'fuel' || item.category === 'hydration'),
  )
  const essentialSectionItems = sortByArea(
    bagItems.filter(
      (item) =>
        item.category !== 'shelter' &&
        item.category !== 'sleep' &&
        item.category !== 'cook' &&
        item.category !== 'fuel' &&
        item.category !== 'hydration',
    ),
  )
  const visibleShelterItems = shelterSectionItems.slice(0, 3)
  const visibleCookingItems = cookingSectionItems.slice(0, 3)
  const visibleEssentialItems = essentialSectionItems.length > 5 ? essentialSectionItems.slice(0, 4) : essentialSectionItems.slice(0, 5)
  const hiddenEssentialCount = Math.max(0, essentialSectionItems.length - visibleEssentialItems.length)
  const inspectedItem = activeItemId ? items.find((item) => item.id === activeItemId) ?? null : null
  const inspectedItemAction = inspectedItem ? getItemAction(inspectedItem) : null
  const editingItem = editingItemId ? items.find((item) => item.id === editingItemId) ?? null : null

  return (
    <>
      <main className="app-shell">
        <section className="trailwise-frame">
          <header className="trailwise-topbar panel">
            <div className="trailwise-brand">
              <strong>TRAILWISE</strong>
            </div>
            {!isMobileLayout ? <div className="trailwise-topbar__actions">{renderHeaderActions()}</div> : null}
            {isMobileLayout ? (
              <div className="mobile-topbar-controls">
                <div className="mobile-menu" ref={mobileMenuRef}>
                  <button
                    type="button"
                    className={`mobile-menu__trigger ${isMobileMenuOpen ? 'is-open' : ''}`}
                    aria-haspopup="menu"
                    aria-expanded={isMobileMenuOpen}
                    onClick={() => setIsMobileMenuOpen((current) => !current)}
                  >
                    <span className="mobile-menu__icon" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  </button>

                  {isMobileMenuOpen ? (
                    <div className="mobile-menu__panel" role="menu">
                      {renderHeaderActions('mobile-menu__action')}
                    </div>
                  ) : null}
                </div>

                <div className={`topbar-profile ${isProfileMenuOpen ? 'is-open' : ''}`} ref={profileMenuRef}>
                  <button
                    type="button"
                    className="topbar-profile__trigger"
                    aria-haspopup="menu"
                    aria-expanded={isProfileMenuOpen}
                    onClick={() => setIsProfileMenuOpen((current) => !current)}
                  >
                    <span className="topbar-profile__avatar">{user.email?.charAt(0).toUpperCase() || 'U'}</span>
                    <span className="topbar-profile__chevron" aria-hidden="true" />
                  </button>

                  {isProfileMenuOpen ? (
                    <div className="topbar-profile__menu" role="menu">
                      <button
                        type="button"
                        className="topbar-profile__menu-item"
                        role="menuitem"
                        onClick={() => {
                          setIsProfileMenuOpen(false)
                          void onSignOut()
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className={`topbar-profile ${isProfileMenuOpen ? 'is-open' : ''}`} ref={profileMenuRef}>
                <button
                  type="button"
                  className="topbar-profile__trigger"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                >
                  <span className="topbar-profile__avatar">{user.email?.charAt(0).toUpperCase() || 'U'}</span>
                  <span className="topbar-profile__chevron" aria-hidden="true" />
                </button>

                {isProfileMenuOpen ? (
                  <div className="topbar-profile__menu" role="menu">
                    <button
                      type="button"
                      className="topbar-profile__menu-item"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        void onSignOut()
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </header>

          {!customProductsReady ? (
            <div className="planner-notice planner-notice--neutral">
              Syncing your custom products from Supabase...
            </div>
          ) : null}

          {customProductsError ? (
            <div className="planner-notice planner-notice--error">{customProductsError}</div>
          ) : null}

          <section
            className={`dashboard-layout ${backpackEquipped ? 'dashboard-layout--with-pack' : 'dashboard-layout--no-pack'} ${isMobileLayout ? 'dashboard-layout--mobile' : ''}`}
          >
            {showWearingPanel ? (
              <aside className="panel dashboard-panel wearing-panel">
              <div className="section-heading">
                <p>Wearing</p>
              </div>
              <div className="wearing-panel__list">{wearSlots.map((slot) => renderWearSlot(slot))}</div>
            </aside>
            ) : null}

            {showWorkbenchPanel && showBagPanel ? (
              <section
                className="panel dashboard-panel workbench-panel"
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop({ zone: 'bag' })}
              >
                <div className="workbench-scroll">
                  <div className="workbench-hero" style={{ backgroundImage: `linear-gradient(rgba(18, 28, 22, 0.28), rgba(18, 28, 22, 0.34)), url(${heroBackgroundImage})` }}>
                    <div className="workbench-hero__overlay">
                      <h1>{loadoutTitle}</h1>
                      <p>{loadoutConditionsLabel}</p>
                      <div className="workbench-hero__stats">
                        <span>{packedItems.length} Items</span>
                        <span>{packedWeightSummary}</span>
                        <span>Rain Ready</span>
                      </div>
                    </div>
                  </div>

                  <div className="workbench-groups">
                    {bagItems.length > 0 ? (
                      <>
                        <section className="workbench-group">
                          <div className="workbench-group__header">
                            <h3>Shelter</h3>
                            <span>{shelterSectionItems.length} items</span>
                          </div>
                          <div className="workbench-grid workbench-grid--shelter">
                            {visibleShelterItems.map((item) => renderWorkbenchCard(item))}
                          </div>
                        </section>

                        <section className="workbench-group">
                          <div className="workbench-group__header">
                            <h3>Cooking</h3>
                            <span>{cookingSectionItems.length} items</span>
                          </div>
                          <div className="workbench-grid workbench-grid--cooking">
                            {visibleCookingItems.map((item) => renderWorkbenchCard(item))}
                          </div>
                        </section>

                        <section className="workbench-group workbench-group--essentials">
                          <div className="workbench-group__header">
                            <h3>Essentials</h3>
                            <span>{essentialSectionItems.length} items</span>
                          </div>
                          <div className="essentials-strip">
                            {visibleEssentialItems.map((item) => renderEssentialTile(item))}
                            {hiddenEssentialCount > 0 ? renderEssentialOverflowTile(hiddenEssentialCount) : null}
                          </div>
                        </section>
                      </>
                    ) : (
                      <div className="workbench-empty">
                        <strong>No packed gear yet</strong>
                        <span>Equip a backpack and click items from your library to start building the kit.</span>
                      </div>
                    )}
                  </div>
                </div>

                {isEssentialsExpanded ? (
                  <div className="workbench-overlay" role="presentation" onClick={() => setIsEssentialsExpanded(false)}>
                    <div className="workbench-overlay__panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                      <div className="workbench-overlay__header">
                        <div>
                          <strong>All essentials</strong>
                          <span>{essentialSectionItems.length} items packed</span>
                        </div>
                        <button type="button" className="modal-close" onClick={() => setIsEssentialsExpanded(false)}>
                          Close
                        </button>
                      </div>
                      <div className="workbench-overlay__grid">
                        {essentialSectionItems.map((item) => renderWorkbenchCard(item))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {showLibraryPanel ? (
            <aside
              className={`panel dashboard-panel library-panel ${draggedId ? 'is-droppable' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop({ zone: 'home' })}
            >
              <div className="library-panel__header">
                <div className="section-heading">
                  <p>{backpackEquipped ? 'Gear Library' : 'At Home'}</p>
                </div>
                <button
                  type="button"
                  className="library-view-all"
                  onClick={() => setLibraryFilter('all')}
                >
                  View all
                </button>
              </div>

              <div className="library-filter-row">
                {libraryFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`library-filter-chip ${libraryFilter === option.value ? 'is-active' : ''}`}
                    onClick={() => setLibraryFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="library-scroll">
                {visibleHomeItems.length > 0 ? (
                  <div className="library-grid">
                    {visibleHomeItems.map((item) => renderLibraryCard(item))}
                  </div>
                ) : (
                  <div className="workbench-empty workbench-empty--library">
                    <strong>No gear in this view</strong>
                    <span>Try another filter or add a product to your library.</span>
                  </div>
                )}
              </div>
            </aside>
            ) : null}
          </section>

          {isMobileLayout ? (
            <nav className="mobile-tabbar" aria-label="Planner sections">
              <button
                type="button"
                className={`mobile-tabbar__tab ${mobileView === 'wear' ? 'is-active' : ''}`}
                onClick={() => setMobileView('wear')}
              >
                Wearing
              </button>
              <button
                type="button"
                className={`mobile-tabbar__tab ${mobileView === 'bag' ? 'is-active' : ''}`}
                onClick={() => setMobileView('bag')}
              >
                Bag
              </button>
              <button
                type="button"
                className={`mobile-tabbar__tab ${mobileView === 'library' ? 'is-active' : ''}`}
                onClick={() => setMobileView('library')}
              >
                Library
              </button>
            </nav>
          ) : null}
        </section>
      </main>

      {inspectedItem ? (
        <div className="modal-shell" role="presentation" onClick={() => setActiveItemId(null)}>
          <section
            className="modal-panel item-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="item-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-panel__header">
              <div>
                <p className="modal-eyebrow">{getCategoryLabel(inspectedItem.category)}</p>
                <h2 id="item-detail-title">{inspectedItem.name}</h2>
              </div>
              <button type="button" className="modal-close" onClick={() => setActiveItemId(null)}>
                Close
              </button>
            </div>

            <div className="item-detail-panel__body">
              <div className="item-detail-panel__media">
                <img src={inspectedItem.image} alt={inspectedItem.name} loading="lazy" />
              </div>
              <div className="item-detail-panel__content">
                <div className="item-detail-panel__summary">
                  <strong>{inspectedItem.brand}</strong>
                  <span>{getLocationLabel(inspectedItem)}</span>
                </div>

                <dl className="item-detail-panel__facts">
                  <div>
                    <dt>Type</dt>
                    <dd>{getCategoryLabel(inspectedItem.category)}</dd>
                  </div>
                  <div>
                    <dt>Weight</dt>
                    <dd>{inspectedItem.weight || 'Not set'}</dd>
                  </div>
                </dl>

                <p className="item-detail-panel__notes">
                  {inspectedItem.notes || 'No notes saved for this item yet.'}
                </p>

                <div className="item-detail-panel__actions">
                  {inspectedItemAction ? (
                    <button
                      type="button"
                      className="manual-submit item-detail-panel__primary-action"
                      onClick={() => handleItemAction(inspectedItem, inspectedItemAction.target)}
                    >
                      {inspectedItemAction.label}
                    </button>
                  ) : null}
                  <button type="button" className="modal-close" onClick={() => openEditModal(inspectedItem)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="item-detail-panel__danger-action"
                    onClick={() => {
                      void removeItemFromLibrary(inspectedItem)
                    }}
                  >
                    Remove From Gear Library
                  </button>
                  {inspectedItem.purchaseLink ? (
                    <a
                      className="manual-link item-detail-panel__link"
                      href={inspectedItem.purchaseLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Product
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {isAddModalOpen ? (
        <div className="modal-shell" role="presentation" onClick={closeAddModal}>
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-product-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-panel__header">
              <div>
                <p className="modal-eyebrow">{editingItem ? 'Edit Product' : 'Add To Home'}</p>
                <h2 id="add-product-title">{editingItem ? 'Edit product' : 'Add a product'}</h2>
              </div>
              <button type="button" className="modal-close" onClick={closeAddModal}>
                Close
              </button>
            </div>

            <div className="modal-panel__body">
              <form className="add-product-form" onSubmit={handleManualAdd}>
                <div className="add-product-form__primary">
                  <div className="manual-identity">
                    <div className="manual-identity__fields">
                      <label className="manual-field">
                        <span>Product Name</span>
                        <input
                          ref={manualNameInputRef}
                          type="text"
                          value={manualDraft.name}
                          placeholder="Exos 38"
                          onChange={(event) => handleManualChange('name', event.target.value)}
                          required
                        />
                      </label>
                      <label className="manual-field">
                        <span>Brand</span>
                        <input
                          type="text"
                          value={manualDraft.brand}
                          placeholder="Osprey"
                          onChange={(event) => handleManualChange('brand', event.target.value)}
                        />
                      </label>
                      <label className="manual-field">
                        <span>Item Type</span>
                        <select
                          value={manualDraft.category}
                          onChange={(event) => handleManualChange('category', event.target.value as Category | '')}
                          required
                        >
                          <option value="">Choose item type</option>
                          {categoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="manual-preview manual-preview--identity">
                      <div
                        className="manual-preview__image"
                        onPaste={handleImagePaste}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleImageDrop}
                      >
                        {manualDraft.image.trim() ? (
                          <img src={manualDraft.image.trim()} alt={manualDraft.name || 'Manual product preview'} />
                        ) : (
                          <span>Paste an image, drop a file here, or use an image URL.</span>
                        )}
                      </div>
                      <div className="manual-preview__copy">
                        <strong>{manualDraft.name.trim() || 'Product name'}</strong>
                        <span>{manualDraft.brand.trim() || 'Brand'}</span>
                        <span>{getCategoryLabel(manualDraft.category)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="manual-form__grid manual-form__grid--secondary">
                    <div className="manual-image-controls">
                      <label className="manual-field">
                        <span>Picture URL</span>
                        <input
                          type="url"
                          value={manualDraft.image}
                          placeholder="https://..."
                          onChange={(event) => handleManualChange('image', event.target.value)}
                        />
                      </label>
                      <label className="manual-upload manual-upload--block">
                        <input type="file" accept="image/*" onChange={handleImageInputChange} />
                        <span>Choose Image File</span>
                      </label>
                    </div>
                    <label className="manual-field">
                      <span>Purchase Link</span>
                      <input
                        type="url"
                        value={manualDraft.purchaseLink}
                        placeholder="https://store.example/product"
                        onChange={(event) => handleManualChange('purchaseLink', event.target.value)}
                      />
                    </label>
                  </div>
                </div>

                <aside className="add-product-form__sidebar">
                  <div className="add-product-form__sidebar-header">
                    <strong>Suggestions</strong>
                  </div>

                  <div className="add-product-suggestions">
                    {suggestedProducts.length > 0 ? (
                      suggestedProducts.map((product) => (
                        <button
                          key={product.productId}
                          type="button"
                          className={`suggestion-item ${selectedSuggestionProductId === product.productId ? 'is-selected' : ''}`}
                          onClick={() => applySuggestedProduct(product)}
                        >
                          <div className="suggestion-item__media">
                            <img src={product.image} alt={product.name} loading="lazy" />
                            <span>{product.icon}</span>
                          </div>
                          <div className="suggestion-item__copy">
                            <strong>{product.name}</strong>
                            <span>{product.brand}</span>
                            <small>{getCategoryLabel(product.category)}</small>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="modal-empty modal-empty--compact">
                        <strong>No matching suggestions</strong>
                        <span>Keep typing or finish the product manually.</span>
                      </div>
                    )}
                  </div>
                </aside>

                <div className="add-product-form__secondary">
                  <div className="manual-preview manual-preview--details">
                    <div
                      className="manual-preview__image"
                      onPaste={handleImagePaste}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleImageDrop}
                    >
                      {manualDraft.image.trim() ? (
                        <img src={manualDraft.image.trim()} alt={manualDraft.name || 'Manual product preview'} />
                      ) : (
                        <span>Paste an image, drop a file here, or use an image URL.</span>
                      )}
                    </div>
                    <div className="manual-preview__copy">
                      <strong>{manualDraft.name.trim() || 'Product name'}</strong>
                      <span>{manualDraft.brand.trim() || 'Brand'}</span>
                      <span>{getCategoryLabel(manualDraft.category)}</span>
                      {manualDraft.purchaseLink.trim() ? (
                        <a
                          className="manual-link"
                          href={manualDraft.purchaseLink.trim()}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Preview Purchase Link
                        </a>
                      ) : null}
                    </div>
                  </div>

                    <div className="manual-actions">
                      <button type="button" className="modal-close" onClick={closeAddModal}>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="manual-submit"
                        disabled={!manualDraft.name.trim() || !manualDraft.category}
                      >
                        {editingItem ? 'Save Changes' : 'Add Product'}
                      </button>
                    </div>
                </div>
              </form>
            </div>
          </section>
        </div>
      ) : null}

      {isShareModalOpen ? (
        <div className="modal-shell" role="presentation" onClick={closeShareModal}>
          <section
            className="modal-panel share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-loadout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-panel__header">
              <div>
                <p className="modal-eyebrow">Share</p>
                <h2 id="share-loadout-title">Share your loadout</h2>
              </div>
              <button type="button" className="modal-close" onClick={closeShareModal}>
                Close
              </button>
            </div>

            <div className="modal-panel__body share-modal__body">
              <section className="share-option-card">
                <div className="share-option-card__copy">
                  <strong>Share link to current loadout</strong>
                  <span>Anyone with this link can view your current Wearing and Bag setup in read-only mode.</span>
                </div>

                <label className="manual-field share-option-card__field">
                  <span>View-only link</span>
                  <input type="text" value={buildSharedLoadoutUrl()} readOnly />
                </label>

                <div className="share-option-card__actions">
                  <button type="button" className="manual-submit" onClick={() => void handleCopySharedLoadoutLink()}>
                    Copy Link
                  </button>
                </div>

                {shareFeedback ? <p className="share-option-card__feedback">{shareFeedback}</p> : null}
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

function App() {
  const sharedLoadout = getSharedLoadoutFromWindow()
  const [session, setSession] = useState<Session | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(hasSupabaseConfig)

  if (sharedLoadout) {
    return <SharedLoadoutView payload={sharedLoadout} />
  }

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false)
      return
    }

    let isMounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }

      setSession(data.session)
      setIsAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsAuthLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
  }

  if (!hasSupabaseConfig) {
    return <SetupPanel />
  }

  if (isAuthLoading) {
    return (
      <main className="auth-shell">
        <section className="auth-card auth-card--compact">
          <p className="auth-eyebrow">Checking Session</p>
          <h1>Loading your planner...</h1>
        </section>
      </main>
    )
  }

  if (!session?.user) {
    return <AuthScreen />
  }

  return <PlannerApp user={session.user} onSignOut={handleSignOut} />
}

export default App
