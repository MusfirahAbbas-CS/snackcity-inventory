import React, { useEffect, useState } from 'react'
import { Item, Movement } from '../types'
import { api } from '../utils/api'

const empty = {
  name: '',
  category: '',
  unit: 'kg',
  quantity: 0,
  reorder_level: 0,
}

export default function InventoryPage() {
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

  const card = 'surface-card'

  const inputClass = 'mt-1'

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="error-card"
        >
          {error}{' '}
          <button className="ml-3 underline" onClick={() => setError('')}>
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
          <h2 className="font-semibold text-amber-200">Reorder alerts</h2>
          <p className="mt-1 text-sm text-amber-100">
            {low
              .map(item => `${item.name} (${item.quantity} ${item.unit})`)
              .join(' · ')}
          </p>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={add} className={`space-y-4 ${card}`}>
          <h2 className="text-xl font-semibold">Add an item</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Name
              <input
                className={inputClass}
                required
                maxLength={100}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Cooking oil"
              />
            </label>
            <label>
              Category
              <input
                className={inputClass}
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
                className={inputClass}
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
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
                className={inputClass}
                type="number"
                min="0"
                step="any"
                required
                value={form.quantity}
                onChange={e =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Reorder at or below
              <input
                className={inputClass}
                type="number"
                min="0"
                step="any"
                required
                value={form.reorder_level}
                onChange={e =>
                  setForm({ ...form, reorder_level: Number(e.target.value) })
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

        <form onSubmit={move} className={`space-y-4 ${card}`}>
          <h2 className="text-xl font-semibold">Record stock movement</h2>
          <label className="block">
            Item
            <select
              className={inputClass}
              required
              value={selected}
              onChange={e => setSelected(Number(e.target.value) || '')}
            >
              <option value="">Select item</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.quantity} {item.unit})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Type
            <select
              className={inputClass}
              value={direction}
              onChange={e => setDirection(e.target.value as 'in' | 'out')}
            >
              <option value="in">Stock received</option>
              <option value="out">Stock used or wasted</option>
            </select>
          </label>
          <label className="block">
            Amount
            <input
              className={inputClass}
              type="number"
              min="0.0001"
              step="any"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </label>
          <label className="block">
            Reason
            <input
              className={inputClass}
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

      <section className="overflow-hidden surface-card !p-0">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Current stock</h2>
          <label className="sm:w-64 block">
            Search inventory
            <input
              className={inputClass}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Name or category"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="table-header">
              <tr>
                {['Item', 'Category', 'Quantity', 'Reorder level', 'Status'].map(
                  x => (
                    <th key={x} className="px-5 py-3">
                      {x}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {shown.map(item => (
                <tr key={item.id} className="table-row">
                  <td className="px-5 py-3 font-medium">{item.name}</td>
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
                          ? 'font-semibold text-amber-500'
                          : 'text-emerald-500'
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
            <p className="p-5 text-slate-400">No matching items yet.</p>
          )}
        </div>
      </section>

      <section className="surface-card">
        <h2 className="text-xl font-semibold">Recent activity</h2>
        {movements.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No stock changes yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {movements.map(m => (
              <li
                key={m.id}
                className="flex flex-wrap justify-between gap-2 py-3 text-sm"
              >
                <span>
                  <strong>{m.name}</strong> · {m.reason}
                </span>
                <span
                  className={
                    m.change > 0 ? 'text-emerald-500' : 'text-amber-500'
                  }
                >
                  {m.change > 0 ? '+' : ''}
                  {m.change} {m.unit} ·{' '}
                  {new Date(m.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
