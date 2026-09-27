import React, { useState, useEffect } from 'react'
import { useSettings } from './hooks/useSettings'
import OrdersPage from './pages/OrdersPage'
import SettingsPage from './pages/SettingsPage'
import { ShoppingCart, Utensils, Settings, Clock } from 'lucide-react'

const backgrounds = [
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1920&auto=format&fit=crop'
]

export default function App() {
  const [page, setPage] = useState<'orders' | 'menu' | 'history' | 'settings'>('orders')
  const settings = useSettings()
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(i => (i + 1) % backgrounds.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const isLight = settings?.theme === 'light'

  const navItemClass = (current: string) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full transition-colors ${
      page === current 
        ? 'bg-orange-600 text-white font-semibold' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <div className={`flex h-screen overflow-hidden ${isLight ? 'bg-slate-100 text-slate-900 theme-light' : 'text-slate-100 theme-dark'}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a101a] border-r border-white/5 flex flex-col shrink-0 z-10 shadow-2xl">
        <div className="p-6 pb-2 mt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Point of Sale</p>
          <h1 className="text-2xl font-black text-white leading-tight">
            {settings?.restaurant_name || 'Snack City'}
          </h1>
        </div>
        <nav className="flex-1 px-4 mt-8 space-y-2">
          <button onClick={() => setPage('orders')} className={navItemClass('orders')}>
            <ShoppingCart size={20} />
            Orders
          </button>
          <button onClick={() => setPage('menu')} className={navItemClass('menu')}>
            <Utensils size={20} />
            Menu
          </button>
          <button onClick={() => setPage('history')} className={navItemClass('history')}>
            <Clock size={20} />
            Orders History
          </button>
          <button onClick={() => setPage('settings')} className={navItemClass('settings')}>
            <Settings size={20} />
            Settings
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 relative overflow-auto">
        {!isLight && (
          <div 
            className="fixed inset-0 z-0 transition-opacity duration-1000"
            style={{ 
              backgroundImage: 'url(' + backgrounds[bgIndex] + ')', 
              backgroundSize: 'cover', 
              backgroundPosition: 'center', 
              filter: 'brightness(0.25) sepia(0.2) hue-rotate(-20deg)' 
            }} 
          />
        )}
        <div className="relative z-10 max-w-6xl p-8 mx-auto">
          {page === 'settings' ? <SettingsPage /> : <OrdersPage activeTab={page} />}
        </div>
      </main>
    </div>
  )
}
