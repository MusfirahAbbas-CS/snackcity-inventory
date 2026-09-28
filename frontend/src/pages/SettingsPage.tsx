import React, { useEffect, useState } from 'react'
import { AppSettings } from '../types'
import { api } from '../utils/api'
import { Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    api<AppSettings>('/settings')
      .then(setSettings)
      .catch(e => setMessage(e.message))
  }, [])

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword) return
    setBusy(true)
    setMessage('')
    try {
      const res = await api<AppSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify({...settings, admin_password: newPassword}),
      })
      setSettings(res)
      setMessage('Admin password updated successfully.')
      setShowPasswordModal(false)
      setNewPassword('')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const res = await api<AppSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      setSettings(res)
      setMessage('Settings saved successfully.')
      setTimeout(() => window.location.reload(), 1000)
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!settings) return <div>Loading...</div>

  const isLight = settings.theme === 'light'
  const inputClass = 'mt-1'
  const cardClass = 'surface-card max-w-2xl mx-auto space-y-4'

  return (
    <>
      <form onSubmit={save} className={cardClass}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">App Settings</h2>
        <button 
          type="button" 
          onClick={() => setShowPasswordModal(true)}
          className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-lg font-semibold border border-slate-600 transition-all shadow-sm active:bg-slate-800"
        >
          Change Password
        </button>
      </div>
      {message && <p className="text-green-400">{message}</p>}
      
      <div>
        <label>Restaurant Name</label>
        <input required className={inputClass} value={settings.restaurant_name} onChange={e => setSettings({...settings, restaurant_name: e.target.value})} />
      </div>
      <div>
        <label>Contact</label>
        <input required className={inputClass} value={settings.contact} onChange={e => setSettings({...settings, contact: e.target.value})} />
      </div>
      <div>
        <label>Address</label>
        <input required className={inputClass} value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
      </div>
      <div>
        <label>Email (Optional)</label>
        <input type="email" className={inputClass} value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} />
      </div>
      <div>
        <label>Website (Optional)</label>
        <input className={inputClass} value={settings.website} onChange={e => setSettings({...settings, website: e.target.value})} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Receipt Size</label>
          <select className={inputClass} value={settings.receipt_size} onChange={e => setSettings({...settings, receipt_size: e.target.value as any})}>
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
          </select>
        </div>
        <div>
          <label>App Theme</label>
          <select className={inputClass} value={settings.theme} onChange={e => setSettings({...settings, theme: e.target.value as any})}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>
      
      <button disabled={busy} className="mt-4 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
        Save Settings
      </button>
    </form>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-100'} p-6 rounded-xl w-full max-w-sm shadow-2xl border`}>
            <h3 className="text-xl font-bold mb-4">Change Admin Password</h3>
            <form onSubmit={savePassword}>
              <div className="relative mb-6">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password" 
                  required
                  autoFocus
                  className={`w-full p-3 rounded border outline-none pr-10 focus:ring-2 focus:ring-orange-500 ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400' 
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className={`absolute right-3 top-3 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'} transition-colors`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
                  className={`px-4 py-2 ${isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={busy || !newPassword}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-4 py-2 rounded font-bold"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}