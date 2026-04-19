import { useState, useEffect } from 'react'
import api from '../api/axios'
import AnimatedCounter from './AnimatedCounter'

export default function PayoutTab({ ic, lc, bc, flash, card, txt, txt2, txt3, divider }) {
  const [payout, setPayout] = useState(null)
  const [bankForm, setBankForm] = useState({
    bank_account_name:'', bank_account_number:'',
    bank_ifsc:'', bank_name:'', upi_id:''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/teacher-profile/payout-summary').then(r => setPayout(r.data))
    api.get('/teacher-profile/my-profile').then(r => {
      setBankForm(f => ({
        ...f,
        bank_account_name: r.data.bank_account_name || '',
        bank_ifsc: r.data.bank_ifsc || '',
        bank_name: r.data.bank_name || '',
        upi_id: r.data.upi_id || ''
      }))
    })
  }, [])

  const saveBank = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch('/teacher-profile/bank', bankForm)
      flash('Bank details saved!')
    } catch(e) { flash('Error saving', 'error') }
    setSaving(false)
  }

  if (!payout) return (
    <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Loading...</div>
  )

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:'Total earned',value:payout.total_earned,color:'#34d399',prefix:'₹'},
          {label:'Pending payout',value:payout.pending_payout,color:'#fbbf24',prefix:'₹'},
          {label:'Settled',value:payout.settled,color:'#8b5cf6',prefix:'₹'},
        ].map(s => (
          <div key={s.label} className="stat-card rounded-2xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-3xl font-bold" style={{color:s.color}}>
              {s.prefix}<AnimatedCounter value={s.value}/>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className={`text-sm font-semibold ${txt} mb-1`}>Bank account details</div>
          <div className={`text-xs ${txt3} mb-4`}>
            Add your bank account so the platform admin can transfer your earnings
          </div>
          <form onSubmit={saveBank} className="space-y-3">
            <div>
              <label className={lc}>Account holder name</label>
              <input value={bankForm.bank_account_name}
                onChange={e => setBankForm({...bankForm,bank_account_name:e.target.value})}
                className={ic} placeholder="As per bank records"/>
            </div>
            <div>
              <label className={lc}>Account number</label>
              <input value={bankForm.bank_account_number||''}
                onChange={e => setBankForm({...bankForm,bank_account_number:e.target.value})}
                className={ic} placeholder="Your account number" type="password"/>
            </div>
            <div>
              <label className={lc}>IFSC code</label>
              <input value={bankForm.bank_ifsc}
                onChange={e => setBankForm({...bankForm,bank_ifsc:e.target.value.toUpperCase()})}
                className={ic} placeholder="e.g. SBIN0001234"/>
            </div>
            <div>
              <label className={lc}>Bank name</label>
              <input value={bankForm.bank_name}
                onChange={e => setBankForm({...bankForm,bank_name:e.target.value})}
                className={ic} placeholder="e.g. State Bank of India"/>
            </div>
            <div>
              <label className={lc}>UPI ID (optional but recommended)</label>
              <input value={bankForm.upi_id}
                onChange={e => setBankForm({...bankForm,upi_id:e.target.value})}
                className={ic} placeholder="yourname@upi"/>
            </div>
            <button type="submit" disabled={saving} className={bc+' w-full disabled:opacity-50'}>
              {saving ? 'Saving...' : 'Save Bank Details'}
            </button>
          </form>
          <div className="mt-4 p-3 rounded-xl text-xs text-gray-400"
            style={{background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.15)'}}>
            🔒 Your bank details are stored securely and only visible to the platform admin
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className={`text-sm font-semibold ${txt} mb-4`}>Transaction history</div>
          {payout.transactions.length===0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">💳</div>
              <div className={`text-sm ${txt3}`}>No transactions yet</div>
            </div>
          )}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {payout.transactions.map((t,i) => (
              <div key={i} className={`p-3 rounded-xl border ${t.settled?'border-green-500/20':'border-amber-500/20'}`}
                style={{background:t.settled?'rgba(52,211,153,0.05)':'rgba(251,191,36,0.05)'}}>
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-sm font-medium ${txt} truncate flex-1 mr-2`}>{t.course}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${t.settled?'bg-green-500/15 text-green-400':'bg-amber-500/15 text-amber-400'}`}>
                    {t.settled?'Settled':'Pending'}
                  </div>
                </div>
                <div className={`text-xs ${txt3} mb-2`}>Student: {t.student}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className={txt3}>Total: ₹{t.amount}</span>
                  <span className={txt3}>Fee: ₹{t.platform_fee}</span>
                  <span className="text-amber-400 font-medium">Your share: ₹{t.your_share}</span>
                </div>
                <div className={`text-xs ${txt3} mt-1`}>
                  {new Date(t.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
