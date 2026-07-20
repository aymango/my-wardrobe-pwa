export type Clothing = {
  id: string
  user_id: string
  image_path: string
  category: string
  subcategory: string | null
  colors: string[]
  seasons: string[]
  style: string | null
  last_worn_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type CanvasItem = {
  id: string
  clothing_id: string
  image_path: string
  x: number
  y: number
  width: number
  rotation: number
  z_index: number
}

export type CanvasData = {
  version: 1
  width: number
  height: number
  items: CanvasItem[]
}

export type Outfit = {
  id: string
  user_id: string
  title: string
  comment: string | null
  occasion: string | null
  outfit_date: string | null
  is_favorite: boolean
  preview_image_path: string | null
  canvas_data: CanvasData
  created_at: string
  updated_at: string
}

export type Idea = {
  id: string
  user_id: string
  image_path: string
  title: string
  notes: string | null
  source_url: string | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export type ClothingFilters = {
  category: string
  subcategory: string
  color: string
  season: string
  style: string
  sort: 'newest' | 'oldest' | 'last-worn-newest' | 'last-worn-oldest'
}
