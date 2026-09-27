import React, { useState, useEffect } from 'react'
import { useSettings } from './hooks/useSettings'
import OrdersPage from './pages/OrdersPage'
import SettingsPage from './pages/SettingsPage'
import InventoryPage from './pages/InventoryPage'
import ReportsPage from './pages/ReportsPage'
import { ShoppingCart, Utensils, Settings, Clock, LogOut, Package, BarChart3 } from 'lucide-react'
import { api } from './utils/api'

const backgrounds = [
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1920&auto=format&fit=crop'
]

function LoginScreen({ setAuth }: { setAuth: (token: string, role: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(role: 'admin' | 'staff') {
    if (role === 'admin' && !password) {
      setError('Password required for Admin')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api<{token: string, role: string}>('/login', {
        method: 'POST',
        body: JSON.stringify({ role, password })
      })
      setAuth(res.token, res.role)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-black text-center mb-8 text-orange-500">Snack City POS</h1>
        {error && <p className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</p>}
        
        <div className="space-y-6">
          <div>
            <button 
              disabled={loading}
              onClick={() => handleLogin('staff')}
              className="w-full bg-slate-700 hover:bg-slate-600 p-4 rounded-lg font-bold text-lg transition-colors"
            >
              Login as Staff
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-600"></div></div>
            <div className="relative flex justify-center text-sm"><span className="bg-slate-800 px-2 text-slate-400">OR</span></div>
          </div>

          <div className="space-y-3">
            <input 
              type="password" 
              placeholder="Admin Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <button 
              disabled={loading}
              onClick={() => handleLogin('admin')}
              className="w-full bg-orange-600 hover:bg-orange-700 p-4 rounded-lg font-bold text-lg transition-colors"
            >
              Login as Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem('token'))
  const [role, setRole] = useState(sessionStorage.getItem('role'))

  const [page, setPage] = useState<'orders' | 'menu' | 'history' | 'settings' | 'inventory' | 'reports'>('orders')
  const settings = useSettings()
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(i => (i + 1) % backgrounds.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!token || !role) {
    return <LoginScreen setAuth={(t, r) => {
      sessionStorage.setItem('token', t)
      sessionStorage.setItem('role', r)
      setToken(t)
      setRole(r)
    }} />
  }

  const isLight = settings?.theme === 'light'

  const navItemClass = (current: string) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full transition-colors ${
      page === current 
        ? 'bg-orange-600 text-white font-semibold' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`

  function logout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('role')
    setToken(null)
    setRole(null)
  }

  return (
    <div className={`flex h-screen overflow-hidden ${isLight ? 'bg-slate-100 text-slate-900 theme-light' : 'text-slate-100 theme-dark'}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a101a] border-r border-white/5 flex flex-col shrink-0 z-10 shadow-2xl">
        <div className="p-6 pb-2 mt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Point of Sale</p>
          <h1 className="text-2xl font-black text-white leading-tight">
            {settings?.restaurant_name || 'Snack City'}
          </h1>
          <p className="text-sm mt-2 text-slate-400 capitalize">Role: {role}</p>
        </div>
        <nav className="flex-1 px-4 mt-8 space-y-2">
          <button onClick={() => setPage('orders')} className={navItemClass('orders')}>
            <ShoppingCart size={20} />
            Orders
          </button>
          {role === 'admin' && (
            <>
              <button onClick={() => setPage('inventory')} className={navItemClass('inventory')}>
                <Package size={20} />
                Inventory
              </button>
              <button onClick={() => setPage('menu')} className={navItemClass('menu')}>
                <Utensils size={20} />
                Menu
              </button>
              <button onClick={() => setPage('history')} className={navItemClass('history')}>
                <Clock size={20} />
                Orders History
              </button>
                            <button onClick={() => setPage('reports')} className={navItemClass('reports')}>
                <BarChart3 size={20} />
                Reports
              </button>
              <button onClick={() => setPage('settings')} className={navItemClass('settings')}>
                <Settings size={20} />
                Settings
              </button>
            </>
          )}
        </nav>
        <div className="p-4">
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={20} />
            Logout
          </button>
        </div>
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
          {page === 'settings' ? <SettingsPage /> : page === 'inventory' ? <InventoryPage /> : page === 'reports' ? <ReportsPage /> : <OrdersPage activeTab={page} />}
        </div>
      </main>
    </div>
  )
}
