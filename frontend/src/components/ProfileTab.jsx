import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function ProfileTab({ ic, lc, bc, flash, card, txt, txt2 }) {
  const [form, setForm] = useState({
    phone:'', whatsapp:'', office_hours:'', bio:''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/teacher-profile/my-profile').then(r => {
      setForm({
        phone: r.data.phone || '',
        whatsapp: r.data.whatsapp || '',
        office_hours: r.data.office_hours || '',
        bio: r.data.bio || ''
      })
    })
  }, [])

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch('/teacher-profile/contact', form)
      flash('Profile updated! Students can now see your contact details.')
    } catch(e) { flash('Error saving', 'error') }
    setSaving(false)
  }

  return (
    <div className="max-w-lg animate-fade-up">
      <div className="glass rounded-2xl p-6 border border-white/5 mb-4">
        <div className={`text-sm font-semibold ${txt} mb-1`}>Contact details for students</div>
        <div className={`text-xs ${txt2} mb-5`}>
          Students enrolled in your courses will see this information to reach you for doubts and support
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className={lc}>Phone number</label>
            <input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}
              className={ic} placeholder="+91 98765 43210"/>
          </div>
          <div>
            <label className={lc}>WhatsApp number</label>
            <input value={form.whatsapp} onChange={e => setForm({...form,whatsapp:e.target.value})}
              className={ic} placeholder="+91 98765 43210 (with country code)"/>
          </div>
          <div>
            <label className={lc}>Office hours</label>
            <input value={form.office_hours} onChange={e => setForm({...form,office_hours:e.target.value})}
              className={ic} placeholder="e.g. Mon-Fri 10AM-5PM IST"/>
          </div>
          <div>
            <label className={lc}>Bio / About you</label>
            <textarea value={form.bio} onChange={e => setForm({...form,bio:e.target.value})}
              className={ic+' h-24 resize-none'}
              placeholder="Tell students about your expertise and experience..."/>
          </div>
          <button type="submit" disabled={saving} className={bc+' w-full disabled:opacity-50'}>
            {saving ? 'Saving...' : 'Save Contact Details'}
          </button>
        </form>
      </div>
      <div className="glass rounded-xl p-4 border border-white/5">
        <div className={`text-xs ${txt2} mb-2 font-medium`}>Preview — what students see:</div>
        <div className="space-y-2 text-xs">
          {form.phone && (
            <div className="flex items-center gap-2 text-gray-300">
              <span>📞</span> {form.phone}
            </div>
          )}
          {form.whatsapp && (
            <div className="flex items-center gap-2 text-gray-300">
              <span>💬</span> WhatsApp: {form.whatsapp}
            </div>
          )}
          {form.office_hours && (
            <div className="flex items-center gap-2 text-gray-300">
              <span>🕐</span> {form.office_hours}
            </div>
          )}
          {form.bio && (
            <div className="text-gray-400 mt-2 leading-relaxed">{form.bio}</div>
          )}
          {!form.phone && !form.whatsapp && !form.office_hours && (
            <div className="text-gray-600">Fill in your details above to show students how to reach you</div>
          )}
        </div>
      </div>
    </div>
  )
}
