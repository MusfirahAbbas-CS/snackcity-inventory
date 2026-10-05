import React, { useState, useEffect } from 'react'
import { useSettings } from './hooks/useSettings'
import OrdersPage from './pages/OrdersPage'
import SettingsPage from './pages/SettingsPage'
import InventoryPage from './pages/InventoryPage'
import ReportsPage from './pages/ReportsPage'
import { ShoppingCart, Utensils, Settings, Clock, LogOut, Package, BarChart3, Eye, EyeOff, PowerOff } from 'lucide-react'
import { api } from './utils/api'

function LoginScreen({ setAuth }: { setAuth: (token: string, role: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!password) {
      setError('Password required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api<{token: string, role: string}>('/login', {
        method: 'POST',
        body: JSON.stringify({ password })
      })
      setAuth(res.token, res.role)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#0a101a] text-slate-100">
      
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/10 z-10">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">Point of Sale</p>
          <h1 className="text-4xl font-black text-white">Snack City</h1>
        </div>
        
        {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center border border-red-500/30">{error}</p>}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2 relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 text-white p-4 pr-12 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-slate-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 p-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-orange-900/20"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem('token'))
  const [role, setRole] = useState(sessionStorage.getItem('role'))
  const [shuttingDown, setShuttingDown] = useState(false)

  const [page, setPage] = useState<'orders' | 'menu' | 'history' | 'settings' | 'inventory' | 'reports'>('orders')
  const settings = useSettings()

  async function shutdownSystem() {
    setShuttingDown(true)
    try {
      await api('/shutdown', { method: 'POST' })
    } catch (e) {
      // Ignored, server will close connection
    }
  }

  if (shuttingDown) {
    return (
      <div className={`flex h-screen w-screen items-center justify-center ${settings?.theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#0a101a] text-slate-100'}`}>
        <div className="text-center">
          <PowerOff size={64} className="mx-auto mb-6 text-red-500" />
          <h2 className="text-3xl font-bold mb-2">System Shut Down</h2>
          <p className="text-slate-500">The server has been safely stopped. You can now close this window.</p>
        </div>
      </div>
    )
  }

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
    setPage('orders')
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
        <div className="p-4 space-y-2">
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            <LogOut size={20} />
            Logout
          </button>
          <button onClick={shutdownSystem} className="flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full text-red-400 hover:bg-red-500/10 transition-colors">
            <PowerOff size={20} />
            Shutdown System
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 relative overflow-auto">
        
        <div className="relative z-10 max-w-6xl p-8 mx-auto">
          {page === 'settings' ? <SettingsPage /> : page === 'inventory' ? <InventoryPage /> : page === 'reports' ? <ReportsPage /> : <OrdersPage activeTab={page} />}
        </div>
      </main>
    </div>
  )
}
