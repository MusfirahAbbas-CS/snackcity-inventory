// import React, { useEffect, useState } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import OrderManagement from './OrderManagement'

// type Item = { id: number; name: string; category: string; unit: string; quantity: number; reorder_level: number }
// type Movement = { id: number; name: string; unit: string; change: number; reason: string; created_at: string }
// const empty = { name: '', category: '', unit: 'kg', quantity: 0, reorder_level: 0 }

// async function api<T>(path: string, options?: RequestInit): Promise<T> {
//   const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } })
//   if (!response.ok) {
//     const error = await response.json().catch(() => null)
//     throw new Error(typeof error?.detail === 'string' ? error.detail : 'Request failed. Check that the backend is running.')
//   }
//   return response.json()
// }

// function App() {
//   const [page, setPage] = useState<'orders' | 'inventory'>('orders')
//   const [items, setItems] = useState<Item[]>([])
//   const [movements, setMovements] = useState<Movement[]>([])
//   const [form, setForm] = useState(empty)
//   const [selected, setSelected] = useState<number | ''>('')
//   const [direction, setDirection] = useState<'in' | 'out'>('in')
//   const [amount, setAmount] = useState('')
//   const [reason, setReason] = useState('')
//   const [query, setQuery] = useState('')
//   const [error, setError] = useState('')
//   const [busy, setBusy] = useState(false)

//   async function refresh() {
//     const [nextItems, nextMovements] = await Promise.all([api<Item[]>('/items'), api<Movement[]>('/movements')])
//     setItems(nextItems); setMovements(nextMovements)
//   }
//   useEffect(() => { refresh().catch(e => setError(e.message)) }, [])
//   async function add(e: React.FormEvent) {
//     e.preventDefault(); setBusy(true); setError('')
//     try {
//       await api('/items', { method: 'POST', body: JSON.stringify(form) }); setForm(empty); await refresh()
//     } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
//   }
//   async function move(e: React.FormEvent) {
//     e.preventDefault(); setBusy(true); setError('')
//     try {
//       if (selected === '') throw new Error('Select an item')
//       const value = Number(amount)
//       if (!Number.isFinite(value) || value <= 0) throw new Error('Enter an amount greater than zero')
//       await api(`/items/${selected}/movements`, { method: 'POST', body: JSON.stringify({ change: direction === 'in' ? value : -value, reason }) })
//       setAmount(''); setReason(''); await refresh()
//     } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
//   }
//   const low = items.filter(item => item.quantity <= item.reorder_level)
//   const shown = items.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
//   const inputClass = 'mt-1'
//   return <div className="ambient-photo min-h-screen">
//     <header className="hero-photo border-b border-white/10 text-white"><div className="mx-auto max-w-6xl px-5 py-6"><p className="text-sm font-semibold uppercase tracking-widest text-orange-400">Snack City</p><h1 className="mt-1 text-3xl font-bold">Inventory dashboard</h1><p className="mt-1 text-sm text-slate-300">Track ingredients, stock changes and reorder alerts.</p></div></header>
//     <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
//       {error && <div role="alert" className="rounded-lg border border-red-500/40 bg-red-950/70 p-4 text-red-100">{error} <button className="ml-3 underline" onClick={() => setError('')}>Dismiss</button></div>}
//       <div className="grid gap-4 sm:grid-cols-3">{[['Items', items.length], ['Low stock', low.length], ['Recent changes', movements.length]].map(([name, value]) => <div key={name} className="rounded-xl border border-white/10 bg-[#142131]/95 p-5 shadow-xl shadow-black/10"><p className="text-sm text-slate-400">{name}</p><p className="mt-1 text-3xl font-bold">{value}</p></div>)}</div>
//       {low.length > 0 && <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5"><h2 className="font-semibold text-amber-200">Reorder alerts</h2><p className="mt-1 text-sm text-amber-100">{low.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(' · ')}</p></section>}
//       <div className="grid gap-6 lg:grid-cols-2">
//         <form onSubmit={add} className="space-y-4 rounded-xl border border-white/10 bg-[#142131]/95 p-5 shadow-xl shadow-black/10"><h2 className="text-xl font-semibold">Add an item</h2>
//           <div className="grid gap-4 sm:grid-cols-2"><label>Name<input className={inputClass} required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cooking oil" /></label><label>Category<input className={inputClass} required maxLength={60} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Kitchen" /></label><label>Unit<select className={inputClass} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pieces</option><option>packs</option></select></label><label>Opening quantity<input className={inputClass} type="number" min="0" step="any" required value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} /></label><label>Reorder at or below<input className={inputClass} type="number" min="0" step="any" required value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: Number(e.target.value) })} /></label></div>
//           <button disabled={busy} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-50">Add item</button>
//         </form>
//         <form onSubmit={move} className="space-y-4 rounded-xl border border-white/10 bg-[#142131]/95 p-5 shadow-xl shadow-black/10"><h2 className="text-xl font-semibold">Record stock movement</h2><label>Item<select className={inputClass} required value={selected} onChange={e => setSelected(Number(e.target.value) || '')}><option value="">Select item</option>{items.map(item => <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit})</option>)}</select></label><label>Type<select className={inputClass} value={direction} onChange={e => setDirection(e.target.value as 'in' | 'out')}><option value="in">Stock received</option><option value="out">Stock used or wasted</option></select></label><label>Amount<input className={inputClass} type="number" min="0.0001" step="any" required value={amount} onChange={e => setAmount(e.target.value)} /></label><label>Reason<input className={inputClass} required maxLength={150} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Supplier delivery or kitchen use" /></label><button disabled={busy} className="rounded-lg bg-slate-600 px-4 py-2 font-semibold text-white hover:bg-slate-500 disabled:opacity-50">Save movement</button></form>
//       </div>
//       <section className="overflow-hidden rounded-xl border border-white/10 bg-[#142131]/95 shadow-xl shadow-black/10"><div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-xl font-semibold">Current stock</h2><label className="sm:w-64">Search inventory<input className="mt-1" value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or category" /></label></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-[#1d2d40] text-slate-300"><tr>{['Item', 'Category', 'Quantity', 'Reorder level', 'Status'].map(x => <th key={x} className="px-5 py-3">{x}</th>)}</tr></thead><tbody>{shown.map(item => <tr key={item.id} className="border-t border-slate-700/70"><td className="px-5 py-3 font-medium">{item.name}</td><td className="px-5 py-3">{item.category}</td><td className="px-5 py-3">{item.quantity} {item.unit}</td><td className="px-5 py-3">{item.reorder_level} {item.unit}</td><td className="px-5 py-3"><span className={item.quantity <= item.reorder_level ? 'font-semibold text-amber-300' : 'text-emerald-300'}>{item.quantity <= item.reorder_level ? 'Low stock' : 'In stock'}</span></td></tr>)}</tbody></table>{shown.length === 0 && <p className="p-5 text-slate-400">No matching items yet.</p>}</div></section>
//       <section className="rounded-xl border border-white/10 bg-[#142131]/95 p-5 shadow-xl shadow-black/10"><h2 className="text-xl font-semibold">Recent activity</h2>{movements.length === 0 ? <p className="mt-3 text-sm text-slate-400">No stock changes yet.</p> : <ul className="mt-3 divide-y divide-slate-100">{movements.map(m => <li key={m.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span><strong>{m.name}</strong> · {m.reason}</span><span className={m.change > 0 ? 'text-emerald-300' : 'text-amber-300'}>{m.change > 0 ? '+' : ''}{m.change} {m.unit} · {new Date(m.created_at).toLocaleString()}</span></li>)}</ul>}</section>
//     </main>
//   </div>
// }
// createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import OrderManagement from './OrderManagement'

type Item = {
  id: number
  name: string
  category: string
  unit: string
  quantity: number
  reorder_level: number
}

type Movement = {
  id: number
  name: string
  unit: string
  change: number
  reason: string
  created_at: string
}

const empty = {
  name: '',
  category: '',
  unit: 'kg',
  quantity: 0,
  reorder_level: 0,
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(
      typeof error?.detail === 'string'
        ? error.detail
        : 'Request failed. Check that the backend is running.',
    )
  }

  return response.json()
}

function App() {
  const [page, setPage] = useState<'orders' | 'inventory'>('orders')
  const [items, setItems] = useState<Item[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [form, setForm] = useState(empty)
  const [selected, setSelected] = useState<number | ''>('')
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const [nextItems, nextMovements] = await Promise.all([
      api<Item[]>('/items'),
      api<Movement[]>('/movements'),
    ])
    setItems(nextItems)
    setMovements(nextMovements)
  }

  useEffect(() => {
    refresh().catch(e => setError((e as Error).message))
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')

    try {
      await api('/items', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setForm(empty)
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function move(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')

    try {
      if (selected === '') throw new Error('Select an item')

      const value = Number(amount)
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('Enter an amount greater than zero')
      }

      await api(`/items/${selected}/movements`, {
        method: 'POST',
        body: JSON.stringify({
          change: direction === 'in' ? value : -value,
          reason,
        }),
      })

      setAmount('')
      setReason('')
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const low = items.filter(
    item => item.quantity <= item.reorder_level,
  )

  const shown = items.filter(item =>
    `${item.name} ${item.category}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  const card =
    'rounded-xl border border-white/10 bg-[#142131]/95 p-5 shadow-xl shadow-black/10'

  return (
    <div className="ambient-photo min-h-screen">
      <header className="hero-photo border-b border-white/10 text-white">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">
            Snack City
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            Restaurant dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-300">
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
          className={`rounded-lg px-4 py-2 font-semibold ${
            page === 'orders'
              ? 'bg-orange-600 text-white'
              : 'bg-[#142131] text-slate-200'
          }`}
        >
          Orders &amp; Menu
        </button>

        <button
          onClick={() => setPage('inventory')}
          aria-current={page === 'inventory' ? 'page' : undefined}
          className={`rounded-lg px-4 py-2 font-semibold ${
            page === 'inventory'
              ? 'bg-orange-600 text-white'
              : 'bg-[#142131] text-slate-200'
          }`}
        >
          Ingredient Stock
        </button>
      </nav>

      {page === 'orders' ? (
        <main className="mx-auto max-w-6xl px-5 py-8">
          <OrderManagement />
        </main>
      ) : (
        <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-950/70 p-4 text-red-100"
            >
              {error}
              <button
                className="ml-3 underline"
                onClick={() => setError('')}
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Items', items.length],
              ['Low stock', low.length],
              ['Recent changes', movements.length],
            ].map(([name, value]) => (
              <div key={name} className={card}>
                <p className="text-sm text-slate-400">{name}</p>
                <p className="mt-1 text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          {low.length > 0 && (
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
              <h2 className="font-semibold text-amber-200">
                Reorder alerts
              </h2>
              <p className="mt-1 text-sm text-amber-100">
                {low
                  .map(
                    item =>
                      `${item.name} (${item.quantity} ${item.unit})`,
                  )
                  .join(' · ')}
              </p>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={add} className={`${card} space-y-4`}>
              <h2 className="text-xl font-semibold">Add an item</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  Name
                  <input
                    className="mt-1"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={e =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g. Cooking oil"
                  />
                </label>

                <label>
                  Category
                  <input
                    className="mt-1"
                    required
                    maxLength={60}
                    value={form.category}
                    onChange={e =>
                      setForm({ ...form, category: e.target.value })
                    }
                    placeholder="e.g. Kitchen"
                  />
                </label>

                <label>
                  Unit
                  <select
                    className="mt-1"
                    value={form.unit}
                    onChange={e =>
                      setForm({ ...form, unit: e.target.value })
                    }
                  >
                    <option>kg</option>
                    <option>g</option>
                    <option>L</option>
                    <option>ml</option>
                    <option>pieces</option>
                    <option>packs</option>
                  </select>
                </label>

                <label>
                  Opening quantity
                  <input
                    className="mt-1"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={form.quantity}
                    onChange={e =>
                      setForm({
                        ...form,
                        quantity: Number(e.target.value),
                      })
                    }
                  />
                </label>

                <label>
                  Reorder at or below
                  <input
                    className="mt-1"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={form.reorder_level}
                    onChange={e =>
                      setForm({
                        ...form,
                        reorder_level: Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>

              <button
                disabled={busy}
                className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Add item
              </button>
            </form>

            <form onSubmit={move} className={`${card} space-y-4`}>
              <h2 className="text-xl font-semibold">
                Record stock movement
              </h2>

              <label>
                Item
                <select
                  className="mt-1"
                  required
                  value={selected}
                  onChange={e =>
                    setSelected(Number(e.target.value) || '')
                  }
                >
                  <option value="">Select item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Type
                <select
                  className="mt-1"
                  value={direction}
                  onChange={e =>
                    setDirection(e.target.value as 'in' | 'out')
                  }
                >
                  <option value="in">Stock received</option>
                  <option value="out">Stock used or wasted</option>
                </select>
              </label>

              <label>
                Amount
                <input
                  className="mt-1"
                  type="number"
                  min="0.0001"
                  step="any"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </label>

              <label>
                Reason
                <input
                  className="mt-1"
                  required
                  maxLength={150}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Supplier delivery or kitchen use"
                />
              </label>

              <button
                disabled={busy}
                className="rounded-lg bg-slate-600 px-4 py-2 font-semibold text-white hover:bg-slate-500 disabled:opacity-50"
              >
                Save movement
              </button>
            </form>
          </div>

          <section className="overflow-hidden rounded-xl border border-white/10 bg-[#142131]/95 shadow-xl shadow-black/10">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Current stock</h2>
              <label className="sm:w-64">
                Search inventory
                <input
                  className="mt-1"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Name or category"
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-[#1d2d40] text-slate-300">
                  <tr>
                    {[
                      'Item',
                      'Category',
                      'Quantity',
                      'Reorder level',
                      'Status',
                    ].map(title => (
                      <th key={title} className="px-5 py-3">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map(item => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-700/70"
                    >
                      <td className="px-5 py-3 font-medium">
                        {item.name}
                      </td>
                      <td className="px-5 py-3">{item.category}</td>
                      <td className="px-5 py-3">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-5 py-3">
                        {item.reorder_level} {item.unit}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={
                            item.quantity <= item.reorder_level
                              ? 'font-semibold text-amber-300'
                              : 'text-emerald-300'
                          }
                        >
                          {item.quantity <= item.reorder_level
                            ? 'Low stock'
                            : 'In stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {shown.length === 0 && (
                <p className="p-5 text-slate-400">
                  No matching items yet.
                </p>
              )}
            </div>
          </section>

          <section className={card}>
            <h2 className="text-xl font-semibold">Recent activity</h2>
            {movements.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                No stock changes yet.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-700">
                {movements.map(movement => (
                  <li
                    key={movement.id}
                    className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                  >
                    <span>
                      <strong>{movement.name}</strong> ·{' '}
                      {movement.reason}
                    </span>
                    <span
                      className={
                        movement.change > 0
                          ? 'text-emerald-300'
                          : 'text-amber-300'
                      }
                    >
                      {movement.change > 0 ? '+' : ''}
                      {movement.change} {movement.unit} ·{' '}
                      {new Date(movement.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)