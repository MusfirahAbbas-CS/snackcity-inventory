import { useEffect, useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { MenuItem, Line, Order, CartLine } from '../types'
import { api } from '../utils/api'
import { ReceiptBody } from '../components/ReceiptBody'

const money = (paisa: number) => `Rs ${(paisa / 100).toFixed(2)}`

export default function OrdersPage({ activeTab }: { activeTab: string }) {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [receipt, setReceipt] = useState<Order | null>(null)
  const [paper, setPaper] = useState<'58mm' | '80mm'>('80mm')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [amountTendered, setAmountTendered] = useState('')
  const [customerName, setCustomerName] = useState('')
  const settings = useSettings()

  const isLight = settings?.theme === 'light'
  const card = 'surface-card'
  const button =
    'rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-50'
  const outline = 'outline-btn'

  async function refresh() {
    const [nextMenu, nextOrders] = await Promise.all([
      api<MenuItem[]>('/menu-items'),
      api<Order[]>('/orders'),
    ])
    setMenu(nextMenu)
    setOrders(nextOrders)
  }

  useEffect(() => {
    refresh().catch(e => setError((e as Error).message))
  }, [])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function add(item: MenuItem) {
    setCart(previous =>
      previous.some(line => line.menu_item_id === item.id)
        ? previous.map(line =>
            line.menu_item_id === item.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        : [...previous, { menu_item_id: item.id, quantity: 1 }],
    )
  }

  function quantity(id: number, value: number) {
    setCart(previous =>
      value < 1
        ? previous.filter(line => line.menu_item_id !== id)
        : previous.map(line =>
            line.menu_item_id === id ? { ...line, quantity: value } : line,
          ),
    )
  }

  const total = cart.reduce(
    (sum, line) =>
      sum +
      (menu.find(item => item.id === line.menu_item_id)?.price_paisa ?? 0) *
        line.quantity,
    0,
  )

  async function saveMenu() {
    if (!name.trim() || !/^\d+(\.\d{1,2})?$/.test(price.trim())) {
      throw new Error('Enter a name and a price with up to two decimal places')
    }

    await api(`/menu-items${editing === null ? '' : `/${editing}`}`, {
      method: editing === null ? 'POST' : 'PUT',
      body: JSON.stringify({
        name: name.trim(),
        price_paisa: Math.round(Number(price) * 100),
      }),
    })

    setName('')
    setPrice('')
    setEditing(null)
    await refresh()
  }

  async function remove(item: MenuItem) {
    if (!window.confirm(`Remove ${item.name} from the menu?`)) return

    await run(async () => {
      await api(`/menu-items/${item.id}`, { method: 'DELETE' })
      setCart(previous =>
        previous.filter(line => line.menu_item_id !== item.id),
      )
      await refresh()
    })
  }

  async function saveOrder() {
    if (!cart.length) throw new Error('Select at least one item')

    const saved = await api<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ 
        lines: cart,
        amount_tendered_paisa: Math.round(Number(amountTendered) * 100) || total,
        customer_name: (settings?.ask_customer_name === 'true' && customerName.trim()) ? customerName.trim() : null
      }),
    })

    setReceipt(saved)
    setCart([])
    setAmountTendered('')
    setCustomerName('')
    await refresh()
  }

  async function viewReceipt(id: number) {
    await run(async () => {
      setReceipt(await api<Order>(`/orders/${id}`))
    })
  }

  async function deleteOrder(id: number) {
    if (!window.confirm('Delete this order?')) return
    await run(async () => {
      await api(`/orders/${id}`, { method: 'DELETE' })
      await refresh()
    })
  }

  return (
    <section className={`space-y-6 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      <style>{`
        @media print {
          @page { margin: 0; }
          body, html, #root {
            margin: 0 !important;
            background: white !important;
          }
          body * { visibility: hidden !important; }
          .print-receipt, .print-receipt * {
            visibility: visible !important;
          }
          .print-receipt {
            display: block !important;
            position: fixed !important;
            top: 0;
            left: 0;
            width: ${paper} !important;
            max-width: ${paper} !important;
            padding: 3mm !important;
            box-sizing: border-box;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
      
      {error && (
        <p role="alert" className="error-card mb-4">
          {error}
        </p>
      )}

      {activeTab === 'orders' && (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h3 className="mb-4 text-xl font-bold">Create order</h3>
          {menu.length === 0 && (
            <p className="text-slate-400">
              Add a menu item below to start.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {menu.map(item => (
              <button
                key={item.id}
                className="surface-item text-left"
                onClick={() => add(item)}
              >
                <strong className="block">{item.name}</strong>
                <span className="text-orange-300">
                  {money(item.price_paisa)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={card}>
          <h3 className="mb-4 text-xl font-bold">Current order</h3>
          {cart.length === 0 && (
            <p className="text-slate-400">Select an item to begin.</p>
          )}

          {cart.map(line => {
            const item = menu.find(
              entry => entry.id === line.menu_item_id,
            )
            if (!item) return null

            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 py-3"
              >
                <span>
                  {item.name} · {money(item.price_paisa)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    aria-label={`Decrease ${item.name}`}
                    className={outline}
                    onClick={() => quantity(item.id, line.quantity - 1)}
                  >
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    aria-label={`Increase ${item.name}`}
                    className={outline}
                    onClick={() => quantity(item.id, line.quantity + 1)}
                  >
                    +
                  </button>
                  <strong>
                    {money(item.price_paisa * line.quantity)}
                  </strong>
                </div>
              </div>
            )
          })}

          <p className="mt-5 flex justify-between border-t border-slate-600 pt-3 text-xl font-bold">
            <span>Total</span>
            <span>{money(total)}</span>
          </p>

          {settings?.ask_customer_name === 'true' && (
            <div className="mt-4 flex flex-col gap-1">
              <label htmlFor="customerName" className="font-semibold">Customer Name (Optional)</label>
              <input 
                id="customerName"
                type="text" 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)}
                className="mt-1"
                placeholder="e.g. John Doe"
              />
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <label htmlFor="amountTendered" className="font-semibold">Paid Amount</label>
            <input 
              id="amountTendered"
              type="number" 
              step="0.01" 
              min={(total/100).toString()}
              value={amountTendered} 
              onChange={e => setAmountTendered(e.target.value)}
              className="text-right w-32"
              placeholder={(total/100).toFixed(2)}
            />
          </div>

          <button
            disabled={busy || !cart.length}
            className={`mt-4 w-full ${button}`}
            onClick={() => run(saveOrder)}
          >
            Save order and view receipt
          </button>
        </div>
      </div>
      )}

      {activeTab === 'menu' && (
      <div className="grid gap-6 lg:grid-cols-1">
        <form
          className={`${card} space-y-3`}
          onSubmit={e => {
            e.preventDefault()
            run(saveMenu)
          }}
        >
          <h3 className="text-xl font-bold">
            {editing === null ? 'Add menu item' : 'Edit menu item'}
          </h3>

          <label>
            Name
            <input
              required
              className="mt-1"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Pizza or Burger"
            />
          </label>

          <label>
            Price (Rs)
            <input
              required
              className="mt-1"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </label>

          <button disabled={busy} className={button}>
            {editing === null ? 'Add item' : 'Save changes'}
          </button>

          {editing !== null && (
            <button
              type="button"
              className={`ml-2 ${outline}`}
              onClick={() => {
                setEditing(null)
                setName('')
                setPrice('')
              }}
            >
              Cancel
            </button>
          )}

          <ul className="divide-y divide-slate-700">
            {menu.map(item => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <span>
                  {item.name} · {money(item.price_paisa)}
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    className={outline}
                    onClick={() => {
                      setEditing(item.id)
                      setName(item.name)
                      setPrice((item.price_paisa / 100).toFixed(2))
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={outline}
                    onClick={() => remove(item)}
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </form>
      </div>
      )}

      {activeTab === 'history' && (
      <div className="grid gap-6 lg:grid-cols-1">
        <div className={card}>
          <h3 className="text-xl font-bold">Recent orders</h3>
          <ul className="divide-y divide-slate-700">
            {orders.map(order => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <span>
                  #{order.daily_number} ·{' '}
                  {new Date(order.created_at).toLocaleString()}
                  {order.customer_name && ` · ${order.customer_name}`}
                </span>
                <strong>{money(order.total_paisa)}</strong>
                <div className="flex gap-2">
                  <button
                    className={outline}
                    onClick={() => viewReceipt(order.id)}
                  >
                    Receipt
                  </button>
                  <button
                    className={outline + " text-red-500 hover:text-red-400 border-red-500 hover:border-red-400"}
                    onClick={() => deleteOrder(order.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      )}

      {receipt && (
        <div
          className="fixed inset-0 z-20 overflow-auto bg-black/75 p-4"
          onClick={() => setReceipt(null)}
        >
          <div
            className="mx-auto max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-3 flex justify-between text-white">
            </div>

            <div
              className="mx-auto bg-white p-3 text-sm text-black"
              style={{
                width: settings?.receipt_size || paper,
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <ReceiptBody order={receipt} settings={settings} />
            </div>

            <div className="mt-4 flex justify-center gap-2">
              <button
                className={button}
                onClick={() => window.print()}
              >
                Print
              </button>
              <button
                className={outline}
                onClick={() => setReceipt(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="print-receipt hidden">
          <ReceiptBody order={receipt} settings={settings} />
        </div>
      )}
    </section>
  )
}



