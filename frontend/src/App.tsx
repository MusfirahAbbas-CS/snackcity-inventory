import React, { useState } from 'react'
import { useSettings } from './hooks/useSettings'
import OrdersPage from './pages/OrdersPage'
import InventoryPage from './pages/InventoryPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const [page, setPage] = useState<'orders' | 'inventory' | 'settings'>('orders')
  const settings = useSettings()

  const isLight = settings?.theme === 'light'

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-100 text-slate-900 theme-light' : 'ambient-photo text-slate-100 theme-dark'}`}>
      <header className="hero-photo border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">
            {settings?.restaurant_name || 'Snack City'}
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            Restaurant dashboard
          </h1>
          <p className="mt-1 text-sm opacity-80">
            Manage orders, menu items and ingredient stock.
          </p>
        </div>
      </header>

      <nav
        aria-label="Dashboard pages"
        className="mx-auto flex max-w-6xl gap-2 px-5 pt-6"
      >
        <button
          onClick={() => setPage('orders')}
          aria-current={page === 'orders' ? 'page' : undefined}
          className={`nav-tab ${page === 'orders' ? 'active' : ''}`}
        >
          Orders &amp; Menu
        </button>

        <button
          onClick={() => setPage('inventory')}
          aria-current={page === 'inventory' ? 'page' : undefined}
          className={`nav-tab ${page === 'inventory' ? 'active' : ''}`}
        >
          Ingredient Stock
        </button>

        <button
          onClick={() => setPage('settings')}
          aria-current={page === 'settings' ? 'page' : undefined}
          className={`nav-tab ${page === 'settings' ? 'active' : ''}`}
        >
          Settings
        </button>
      </nav>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {page === 'orders' && <OrdersPage />}
        {page === 'inventory' && <InventoryPage />}
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}
