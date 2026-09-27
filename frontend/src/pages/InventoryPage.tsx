import React, { useEffect, useState } from 'react'
import { Item, Movement } from '../types'
import { api } from '../utils/api'
import { ConfirmModal } from '../components/ConfirmModal'

const money = (paisa: number) => `Rs ${(paisa / 100).toFixed(2)}`

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reorderLevel, setReorderLevel] = useState('')
  const [price, setPrice] = useState('')
  
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [stockItem, setStockItem] = useState<Item | null>(null)
  const [stockChange, setStockChange] = useState('')
  const [stockReason, setStockReason] = useState('Purchased')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: () => {} })

  const card = 'surface-card'
  const button = 'rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-50'
  const outline = 'outline-btn'

  async function refresh() {
    try {
      const [newItems, newMovements] = await Promise.all([
        api<Item[]>('/items'),
        api<Movement[]>('/movements')
      ])
      setItems(newItems)
      setMovements(newMovements)
    } catch (e: any) {
      setError(e.message)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function saveItem(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = {
        name: name.trim(),
        category: category.trim(),
        unit: unit.trim(),
        quantity: editing === null ? Number(quantity) : undefined, // quantity is only sent on create, or handled via stock if we want
        reorder_level: Number(reorderLevel) || 0,
        price_paisa: Math.round(Number(price) * 100)
      }
      
      // when updating, we don't send quantity to update API, it updates via movements
      if (editing !== null) {
        delete body.quantity
      }

      await api(`/items${editing === null ? '' : `/${editing}`}`, {
        method: editing === null ? 'POST' : 'PUT',
        body: JSON.stringify(body)
      })
      cancelEdit()
      await refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteItem(id: number) {
    setBusy(true)
    try {
      await api(`/items/${id}`, { method: 'DELETE' })
      await refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function updateStock(e: React.FormEvent) {
    e.preventDefault()
    if (!stockItem || !stockChange || !stockReason) return
    setBusy(true)
    setError('')
    try {
      await api(`/items/${stockItem.id}/movements`, {
        method: 'POST',
        body: JSON.stringify({
          change: Number(stockChange),
          reason: stockReason.trim()
        })
      })
      setStockItem(null)
      setStockChange('')
      setStockReason('Purchased')
      await refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  function startEdit(item: Item) {
    setEditing(item.id)
    setName(item.name)
    setCategory(item.category)
    setUnit(item.unit)
    setReorderLevel(String(item.reorder_level))
    setPrice((item.price_paisa / 100).toFixed(2))
    setQuantity(String(item.quantity))
  }

  function cancelEdit() {
    setEditing(null)
    setName('')
    setCategory('')
    setUnit('')
    setQuantity('')
    setReorderLevel('')
    setPrice('')
  }

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))

  return (
    <section className="space-y-6">
      {error && <p className="error-card">{error}</p>}
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Form & History */}
        <div className="space-y-6 lg:col-span-1">
          <form className={`${card} space-y-3`} onSubmit={saveItem}>
            <h3 className="text-xl font-bold">{editing ? 'Edit Item' : 'Add New Item'}</h3>
            <label className="block">
              Name
              <input required className="mt-1 w-full bg-slate-900 border border-slate-700 p-2 rounded" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Flour" />
            </label>
            <label className="block">
              Category
              <input required className="mt-1 w-full bg-slate-900 border border-slate-700 p-2 rounded" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Ingredients" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                Unit
                <input required className="mt-1 w-full bg-slate-900 border border-slate-700 p-2 rounded" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. kg" />
              </label>
              <label className="block">
                Unit Cost (Rs)
                <input required type="number" min="0" step="0.01" className="mt-1 w-full bg-slate-900 border border-slate-700 p-2 rounded" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
              </label>
            </div>
            {editing === null && (
              <label className="block">
                Initial Stock
                <input required type="number" min="0" step="0.01" className="mt-1 w-full bg-slate-900 border border-slate-700 p-2 rounded" value={quantity} onChange={e => setQuantity(e.target.value)} />
              </label>
            )}
            <div className="flex gap-2 pt-2">
              <button disabled={busy} className={button}>{editing ? 'Save changes' : 'Add item'}</button>
              {editing && <button type="button" onClick={cancelEdit} className={outline}>Cancel</button>}
            </div>
          </form>

          {stockItem && (
            <form className={`${card} space-y-3 border border-orange-500`} onSubmit={updateStock}>
              <h3 className="text-xl font-bold">Update Stock: {stockItem.name}</h3>
              <label className="block">
                Amount (+ to add, - to reduce)
                <input required type="number" step="0.01" className="mt-1 w-full bg-slate-900 border border-slate-700 p-2 rounded" value={stockChange} onChange={e => setStockChange(e.target.value)} placeholder="e.g. 5" />
              </label>
              <label className="block">
                Reason / Details
                <input required className="mt-1 w-full bg-slate-900 border border-slate-700 p-2 rounded" value={stockReason} onChange={e => setStockReason(e.target.value)} placeholder="e.g. Purchased 5kg" />
              </label>
              <div className="flex gap-2 pt-2">
                <button disabled={busy} className={button}>Apply Change</button>
                <button type="button" onClick={() => setStockItem(null)} className={outline}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Inventory List */}
        <div className={`${card} lg:col-span-2`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Inventory List</h3>
            <input 
              type="text" 
              placeholder="Search items..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="bg-slate-900 border border-slate-700 p-2 rounded w-64"
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-2">Name</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Stock</th>
                  <th className="py-2">Unit Cost</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map(item => (
                  <tr key={item.id}>
                    <td className="py-3 font-semibold">{item.name}</td>
                    <td className="py-3 text-slate-400">{item.category}</td>
                    <td className="py-3 font-bold text-orange-400">{item.quantity} {item.unit}</td>
                    <td className="py-3">{money(item.price_paisa)}</td>
                    <td className="py-3 flex justify-end gap-2">
                      <button onClick={() => { setStockItem(item); setStockChange(''); setStockReason('Purchased'); }} className={outline + " text-sm"}>
                        Add Stock
                      </button>
                      <button onClick={() => startEdit(item)} className={outline + " text-sm"}>
                        Edit
                      </button>
                      <button onClick={() => setConfirmDialog({ isOpen: true, title: 'Delete Item', message: `Are you sure you want to delete ${item.name} and all its history?`, action: () => deleteItem(item.id) })} className={outline + " text-sm text-red-500 border-red-500/50 hover:bg-red-500/10"}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">No items found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </section>
  )
}
