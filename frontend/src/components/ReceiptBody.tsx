import { Order, AppSettings } from '../types'

const money = (paisa: number) => `Rs ${(paisa / 100).toFixed(2)}`

export function ReceiptBody({ order, settings }: { order: Order, settings: AppSettings }) {
  const tendered = order.amount_tendered_paisa || order.total_paisa
  const change = tendered - order.total_paisa

  return (
    <div className="text-sm">
      <div className="text-center">
        <strong className="text-lg uppercase">{settings?.restaurant_name || 'SNACK CITY'}</strong>
        {settings?.address && <p>{settings.address}</p>}
        {settings?.contact && <p>{settings.contact}</p>}
        {settings?.email && <p>{settings.email}</p>}
        {settings?.website && <p>{settings.website}</p>}
        <p className="mt-2">Order receipt</p>
        <p>
          #{order.daily_number} ·{' '}
          {new Date(order.created_at).toLocaleString()}
        </p>
        {order.customer_name && <p>Customer: {order.customer_name}</p>}
      </div>

      <div className="my-3 border-t border-dashed border-black" />

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="pb-1 font-semibold">Item</th>
            <th className="pb-1 font-semibold text-center">Qty</th>
            <th className="pb-1 font-semibold text-right">Price</th>
          </tr>
        </thead>
        <tbody>
        {order.lines.map((line, index) => (
          <tr key={index}>
            <td className="py-1 break-words pr-2">{line.item_name}</td>
            <td className="py-1 text-center whitespace-nowrap">{line.quantity}</td>
            <td className="py-1 text-right whitespace-nowrap">{(line.line_total_paisa / 100).toFixed(2)}</td>
          </tr>
        ))}
        </tbody>
      </table>

      <div className="my-2 border-t border-dashed border-black" />
      
      <div className="flex justify-between font-bold">
        <span>TOTAL</span>
        <span>{money(order.total_paisa)}</span>
      </div>
      <div className="flex justify-between mt-1">
        <span>Paid Amount</span>
        <span>{money(tendered)}</span>
      </div>
      <div className="flex justify-between mt-1">
        <span>Change</span>
        <span>{money(change)}</span>
      </div>
      <p className="mt-4 text-center">Thank you!</p>
    </div>
  )
}
