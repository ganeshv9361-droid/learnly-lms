import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([])
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef()

  const load = async () => {
    try {
      const [n, c] = await Promise.all([
        api.get('/notifications/my'),
        api.get('/notifications/unread-count')
      ])
      setNotifs(n.data)
      setCount(c.data.count)
    } catch(e) {}
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const markAllRead = async () => {
    await api.patch('/notifications/mark-all-read')
    setCount(0)
    setNotifs(n => n.map(x => ({...x, read: true})))
  }

  const getIcon = (type) => {
    if (type === 'certificate') return '🏅'
    if (type === 'announcement') return '📢'
    if (type === 'enrollment') return '🎓'
    return '🔔'
  }

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={() => { setOpen(o => !o); if (!open) load() }}
        style={{position:'relative',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:18}}>
        🔔
        {count > 0 && (
          <div style={{position:'absolute',top:-4,right:-4,width:18,height:18,borderRadius:'50%',background:'#ef4444',color:'white',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #080810'}}>
            {count > 9 ? '9+' : count}
          </div>
        )}
      </button>

      {open && (
        <div style={{position:'absolute',top:48,right:0,width:320,maxHeight:400,overflowY:'auto',background:'#0d0d1a',border:'1px solid rgba(124,58,237,0.3)',borderRadius:16,boxShadow:'0 20px 60px rgba(0,0,0,0.5)',zIndex:300}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{color:'white',fontWeight:600,fontSize:14}}>Notifications</div>
            {count > 0 && (
              <button onClick={markAllRead}
                style={{background:'none',border:'none',color:'#a78bfa',fontSize:12,cursor:'pointer'}}>
                Mark all read
              </button>
            )}
          </div>
          {notifs.length === 0 && (
            <div style={{padding:32,textAlign:'center',color:'#6b7280',fontSize:13}}>
              <div style={{fontSize:32,marginBottom:8}}>🔔</div>
              No notifications yet
            </div>
          )}
          {notifs.map(n => (
            <div key={n.id}
              onClick={async () => {
                await api.patch(`/notifications/mark-read/${n.id}`)
                setNotifs(prev => prev.map(x => x.id===n.id ? {...x,read:true} : x))
                setCount(c => Math.max(0, c-1))
              }}
              style={{padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer',background:n.read?'transparent':'rgba(124,58,237,0.08)',transition:'background 0.2s'}}>
              <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{fontSize:20,flexShrink:0}}>{getIcon(n.type)}</div>
                <div style={{flex:1}}>
                  <div style={{color:'white',fontSize:13,fontWeight:n.read?400:600,marginBottom:2}}>{n.title}</div>
                  <div style={{color:'#9ca3af',fontSize:12,lineHeight:'1.4'}}>{n.body}</div>
                  <div style={{color:'#4a5280',fontSize:11,marginTop:4}}>
                    {new Date(n.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
                {!n.read && <div style={{width:8,height:8,borderRadius:'50%',background:'#7c3aed',flexShrink:0,marginTop:4}}/>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
