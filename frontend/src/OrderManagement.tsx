import { useEffect, useState } from 'react'

type MenuItem = { id: number; name: string; price_paisa: number }
type Line = {
  menu_item_id: number
  item_name: string
  quantity: number
  unit_price_paisa: number
  line_total_paisa: number
}
type Order = {
  id: number
  created_at: string
  total_paisa: number
  lines: Line[]
}
type CartLine = { menu_item_id: number; quantity: number }

const money = (paisa: number) => `Rs ${(paisa / 100).toFixed(2)}`

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
  })
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      typeof body?.detail === 'string'
        ? body.detail
        : 'Request failed. Check the backend.',
    )
  }

  return body as T
}

export default function OrderManagement() {
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

  const card = 'rounded-xl border border-white/10 bg-[#142131]/95 p-5 shadow-xl'
  const button =
    'rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-50'
  const outline =
    'rounded-lg border border-slate-600 px-3 py-2 hover:bg-slate-700 disabled:opacity-50'

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
      body: JSON.stringify({ lines: cart }),
    })

    setReceipt(saved)
    setCart([])
    await refresh()
  }

  async function viewReceipt(id: number) {
    await run(async () => {
      setReceipt(await api<Order>(`/orders/${id}`))
    })
  }

  return (
    <section className="space-y-6 text-slate-100">
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

      <h2 className="text-2xl font-bold">Orders and menu</h2>
      {error && (
        <p role="alert" className="rounded-lg bg-red-950 p-3 text-red-100">
          {error}
        </p>
      )}

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
                className="rounded-lg border border-slate-600 bg-[#1d2d40] p-3 text-left hover:border-orange-400"
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
          <button
            disabled={busy || !cart.length}
            className={`mt-4 w-full ${button}`}
            onClick={() => run(saveOrder)}
          >
            Save order and view receipt
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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

        <div className={card}>
          <h3 className="text-xl font-bold">Recent orders</h3>
          <ul className="divide-y divide-slate-700">
            {orders.map(order => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <span>
                  #{order.id} ·{' '}
                  {new Date(order.created_at).toLocaleString()}
                </span>
                <strong>{money(order.total_paisa)}</strong>
                <button
                  className={outline}
                  onClick={() => viewReceipt(order.id)}
                >
                  Receipt
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

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
              <label htmlFor="paper-size">Paper width</label>
              <select
                id="paper-size"
                className="w-auto"
                value={paper}
                onChange={e =>
                  setPaper(e.target.value as '58mm' | '80mm')
                }
              >
                <option value="58mm">58 mm</option>
                <option value="80mm">80 mm</option>
              </select>
            </div>

            <div
              className="mx-auto bg-white p-3 text-sm text-black"
              style={{
                width: paper,
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <ReceiptBody order={receipt} />
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
          <ReceiptBody order={receipt} />
        </div>
      )}
    </section>
  )
}

function ReceiptBody({ order }: { order: Order }) {
  return (
    <div className="text-sm">
      <div className="text-center">
        <strong className="text-lg">SNACK CITY</strong>
        <p>Order receipt</p>
        <p>
          #{order.id} ·{' '}
          {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

      <div className="my-3 border-t border-dashed border-black" />

      {order.lines.map((line, index) => (
        <div className="mb-2" key={index}>
          <strong className="break-words">{line.item_name}</strong>
          <div className="flex justify-between gap-1">
            <span>
              {line.quantity} × {money(line.unit_price_paisa)}
            </span>
            <span>{money(line.line_total_paisa)}</span>
          </div>
        </div>
      ))}

      <div className="mt-3 flex justify-between border-t border-dashed border-black pt-2 font-bold">
        <span>TOTAL</span>
        <span>{money(order.total_paisa)}</span>
      </div>
      <p className="mt-4 text-center">Thank you!</p>
    </div>
  )
}