import { useEffect, useState } from 'react'
import { AppSettings } from '../types'
import { api } from '../utils/api'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    restaurant_name: 'SNACK CITY',
    contact: '',
    address: '',
    email: '',
    website: '',
    receipt_size: '80mm',
    theme: 'dark',
    ask_customer_name: 'false',
  })

  useEffect(() => {
    api<AppSettings>('/settings')
      
      .then(s => {
        setSettings(s)
        if (s.theme === 'light') {
          document.body.classList.add('theme-light')
        } else {
          document.body.classList.remove('theme-light')
        }
      })
      .catch(console.error)
  }, [])

  return settings
}
