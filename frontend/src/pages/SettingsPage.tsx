import React, { useEffect, useState } from 'react'
import { AppSettings } from '../types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(setSettings)
      .catch(e => setMessage(e.message))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setSettings(await res.json())
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
    <form onSubmit={save} className={cardClass}>
      <h2 className="text-xl font-bold">App Settings</h2>
      {message && <p className="text-green-400">{message}</p>}
      
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

      <div className="flex items-center gap-2 pt-2">
        <input 
          type="checkbox" 
          id="ask_customer_name" 
          checked={settings.ask_customer_name === 'true'} 
          onChange={e => setSettings({...settings, ask_customer_name: e.target.checked ? 'true' : 'false'})}
          className="h-4 w-4 rounded border-slate-600 bg-[#111d2b] text-orange-600 focus:ring-orange-600 focus:ring-offset-slate-900" 
        />
        <label htmlFor="ask_customer_name" className="!mb-0 inline-block">Ask for customer name on receipt</label>
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
  )
}
