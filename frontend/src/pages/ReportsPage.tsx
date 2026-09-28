import React, { useEffect, useState } from 'react'
import { api } from '../utils/api'

const money = (paisa: number) => `Rs ${(paisa / 100).toFixed(2)}`

type ReportData = {
  date: string
  total_sales?: number
  order_count?: number
  total_cost?: number
  movement_count?: number
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly' | 'all_time'>('daily')
  const [search, setSearch] = useState('')
  const [sales, setSales] = useState<ReportData[]>([])
  const [purchases, setPurchases] = useState<ReportData[]>([])
  const [error, setError] = useState('')

  async function loadData() {
    try {
      const [s, p] = await Promise.all([
        api<ReportData[]>(`/reports/sales?period=${period}`),
        api<ReportData[]>(`/reports/purchases?period=${period}`)
      ])
      setSales(s)
      setPurchases(p)
      setError('')
    } catch (e: any) {
      setError(e.message)
    }
  }

  useEffect(() => {
    loadData()
  }, [period])

  const card = 'surface-card'

  const filteredSales = sales.filter(s => s.date.toLowerCase().includes(search.toLowerCase()))
  const filteredPurchases = purchases.filter(p => p.date.toLowerCase().includes(search.toLowerCase()))

  return (
    <section className="space-y-6 text-slate-100">
      {error && <p className="error-card">{error}</p>}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Financial Reports</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <input 
            type="text"
            placeholder="Search by date..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-700 p-2 rounded w-full sm:w-auto"
          />
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 p-2 rounded w-full sm:w-auto"
          >
            <option value="daily">Daily View</option>
            <option value="monthly">Monthly View</option>
            <option value="yearly">Yearly View</option>
            <option value="all_time">All Time</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h3 className="mb-4 text-xl font-bold text-orange-400">Sales Report</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-2">Date</th>
                <th className="py-2 text-center">Orders</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSales.map(s => (
                <tr key={s.date}>
                  <td className="py-3 font-semibold">{s.date}</td>
                  <td className="py-3 text-center text-slate-400">{s.order_count}</td>
                  <td className="py-3 text-right font-bold text-green-400">{money(s.total_sales || 0)}</td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-slate-500">No sales data.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={card}>
          <h3 className="mb-4 text-xl font-bold text-blue-400">Purchase Report</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-2">Date</th>
                <th className="py-2 text-center">Purchases</th>
                <th className="py-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPurchases.map(p => (
                <tr key={p.date}>
                  <td className="py-3 font-semibold">{p.date}</td>
                  <td className="py-3 text-center text-slate-400">{p.movement_count}</td>
                  <td className="py-3 text-right font-bold text-red-400">{money(p.total_cost || 0)}</td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-slate-500">No purchase data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
