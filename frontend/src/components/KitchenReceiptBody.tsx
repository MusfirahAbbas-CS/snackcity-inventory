import { Order, AppSettings } from '../types'

export function KitchenReceiptBody({ order, settings }: { order: Order, settings: AppSettings }) {
  return (
    <div className="text-sm font-sans" style={{ fontFamily: 'monospace' }}>
      <div className="text-center">
        <strong className="text-lg uppercase">KITCHEN TICKET</strong>
        <p className="mt-2 text-xl font-bold">Order #{order.daily_number}</p>
        <p>{new Date(order.created_at).toLocaleString()}</p>
        {order.customer_name && <p>Customer: {order.customer_name}</p>}
        {order.customer_phone && <p>Phone: {order.customer_phone}</p>}
      </div>

      <div className="my-3 border-t border-dashed border-black" />

      <table className="w-full text-left font-bold text-base">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="pb-1">Item</th>
            <th className="pb-1 text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
        {order.lines.map((line, index) => (
          <tr key={index}>
            <td className="py-2 pr-2 leading-tight">{line.item_name}</td>
            <td className="py-2 text-right">{line.quantity}</td>
          </tr>
        ))}
        </tbody>
      </table>

      <div className="my-3 border-t border-dashed border-black" />
      <p className="text-center italic">End of ticket</p>
    </div>
  )
}
