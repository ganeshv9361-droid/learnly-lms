import { useState, useEffect } from 'react'
import api from '../api/axios'
import AnimatedCounter from './AnimatedCounter'

export default function RevenueTab() {
  const [data, setData] = useState(null)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/payments/revenue').then(r => setData(r.data)).catch(()=>{})
    api.get('/payments/my-orders').then(r => setOrders(r.data)).catch(()=>{})
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center h-48 text-gray-500">Loading revenue data...</div>
  )

  return (
    <div className="animate-fade-up space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card rounded-2xl p-6">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Revenue</div>
          <div className="text-3xl font-bold text-green-400">
            ₹<AnimatedCounter value={data.total_revenue}/>
          </div>
        </div>
        <div className="stat-card rounded-2xl p-6">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Sales</div>
          <div className="text-3xl font-bold text-violet-400">
            <AnimatedCounter value={data.total_paid}/>
          </div>
        </div>
        <div className="stat-card rounded-2xl p-6">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Avg per Sale</div>
          <div className="text-3xl font-bold text-amber-400">
            ₹<AnimatedCounter value={data.total_paid>0?Math.round(data.total_revenue/data.total_paid):0}/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className="text-sm font-semibold text-white mb-4">Revenue by Course</div>
          {Object.keys(data.by_course).length===0 && (
            <div className="text-gray-500 text-sm text-center py-6">No paid enrollments yet</div>
          )}
          {Object.entries(data.by_course).map(([course, amount]) => (
            <div key={course} className="flex items-center gap-3 mb-3">
              <div className="flex-1 text-sm text-gray-300 truncate">{course}</div>
              <div className="font-semibold text-green-400">₹{amount}</div>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className="text-sm font-semibold text-white mb-4">Monthly Breakdown</div>
          {Object.keys(data.monthly).length===0 && (
            <div className="text-gray-500 text-sm text-center py-6">No data yet</div>
          )}
          {Object.entries(data.monthly).map(([month, amount]) => {
            const max = Math.max(...Object.values(data.monthly))
            return (
              <div key={month} className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{month}</span><span>₹{amount}</span>
                </div>
                <div className="h-2 rounded-full" style={{background:'rgba(255,255,255,0.07)'}}>
                  <div className="h-2 rounded-full progress-bar"
                    style={{width:(amount/max*100)+'%', background:'linear-gradient(90deg,#7c3aed,#06b6d4)'}}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
