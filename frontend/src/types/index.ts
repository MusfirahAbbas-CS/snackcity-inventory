export type Item = {
  id: number
  name: string
  category: string
  unit: string
  quantity: number
  reorder_level: number
  price_paisa: number
}

export type Movement = {
  id: number
  name: string
  unit: string
  change: number
  reason: string
  created_at: string
}

export type MenuItem = { id: number; name: string; price_paisa: number }
export type Line = {
  menu_item_id: number
  item_name: string
  quantity: number
  unit_price_paisa: number
  line_total_paisa: number
}
export type Order = {
  id: number
  daily_number: number
  customer_name?: string
  customer_phone?: string
  printed: number
  created_at: string
  total_paisa: number
  amount_tendered_paisa: number
  lines: Line[]
}
export type CartLine = { menu_item_id: number; quantity: number }

export type AppSettings = {
  restaurant_name: string
  contact: string
  address: string
  email: string
  website: string
  receipt_size: '58mm' | '80mm'
  theme: 'light' | 'dark'
  ask_customer_name: string
  admin_password?: string
}
