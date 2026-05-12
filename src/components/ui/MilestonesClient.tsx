'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Milestone, MilestoneStatus } from '@/types'
import { CheckCircle2, Clock, Calendar, ChevronDown, Plus, X, Save } from 'lucide-react'
import clsx from 'clsx'

const STATUS_OPTIONS: { value: MilestoneStatus; label: string; icon: React.ReactNode; cls: string }[] = [
  { value: 'done',     label: 'Complete', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { value: 'active',   label: 'Active',   icon: <Clock className="w-4 h-4 text-amber-500" />,          cls: 'bg-amber-50 border-amber-200 text-amber-700'       },
  { value: 'upcoming', label: 'Upcoming', icon: <Calendar className="w-4 h-4 text-gray-400" />,        cls: 'bg-gray-50 border-gray-200 text-gray-500'           },
]

function StatusSelect({ value, onChange }: { value: MilestoneStatus; onChange: (v: MilestoneStatus) => void }) {
  const [open, setOpen] = useState(false)
  const opt = STATUS_OPTIONS.find(o => o.value === value)!
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium', opt.cls)}
      >
        {opt.icon}{opt.label}<ChevronDown className="w-3 h-3 ml-1" />
      </button>
      {open && (
        <div className="absolute z-20 top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
          {STATUS_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              {o.icon}<span>{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MilestonesClient({ initialMilestones }: { initialMilestones: Milestone[] }) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)
  const [adding, setAdding] = useState(false)
  const [newMs, setNewMs] = useState({ name: '', target_date: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('milestones-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, payload => {
        if (payload.eventType === 'UPDATE')
          setMilestones(prev => prev.map(m => m.id === (payload.new as Milestone).id ? payload.new as Milestone : m))
        else if (payload.eventType === 'INSERT')
          setMilestones(prev => [...prev, payload.new as Milestone].sort((a,b) => a.target_date.localeCompare(b.target_date)))
        else if (payload.eventType === 'DELETE')
          setMilestones(prev => prev.filter(m => m.id !== (payload.old as Milestone).id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const updateStatus = async (id: string, status: MilestoneStatus) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, status } : m))
    await supabase.from('milestones').update({ status }).eq('id', id)
  }

  const deleteMs = async (id: string) => {
    if (!confirm('Delete this milestone?')) return
    setMilestones(prev => prev.filter(m => m.id !== id))
    await supabase.from('milestones').delete().eq('id', id)
  }

  const saveNew = async () => {
    if (!newMs.name || !newMs.target_date) return
    setSaving(true)
    const { data } = await supabase.from('milestones').insert({ ...newMs, status: 'upcoming' }).select().single()
    if (data) setMilestones(prev => [...prev, data as Milestone].sort((a,b) => a.target_date.localeCompare(b.target_date)))
    setAdding(false)
    setNewMs({ name: '', target_date: '' })
    setSaving(false)
  }

  return (
    <div>
      <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-1.5 mb-5">
        <Plus className="w-4 h-4" />Add milestone
      </button>

      {adding && (
        <div className="card p-4 mb-4 bg-brand-50 border-brand-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">New milestone</h3>
          <div className="flex gap-3 mb-3">
            <input className="input flex-1" placeholder="Milestone name" value={newMs.name} onChange={e => setNewMs(p => ({ ...p, name: e.target.value }))} />
            <input type="date" className="input w-44" value={newMs.target_date} onChange={e => setNewMs(p => ({ ...p, target_date: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={saveNew} disabled={saving} className="btn-primary flex items-center gap-1.5">
              <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setAdding(false)} className="btn-secondary flex items-center gap-1.5">
              <X className="w-4 h-4" />Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {milestones.map((ms, i) => {
          const date = new Date(ms.target_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
          const isLast = i === milestones.length - 1
          const statusOpt = STATUS_OPTIONS.find(o => o.value === ms.status)!
          return (
            <div key={ms.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0',
                  ms.status === 'done' ? 'bg-emerald-100 border-emerald-400' :
                  ms.status === 'active' ? 'bg-amber-100 border-amber-400' :
                  'bg-gray-100 border-gray-200'
                )}>
                  {statusOpt.icon}
                </div>
                {!isLast && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
              </div>

              {/* Card */}
              <div className={clsx('card flex-1 p-4 mb-3 border', statusOpt.cls)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{ms.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusSelect value={ms.status} onChange={v => updateStatus(ms.id, v)} />
                    <button onClick={() => deleteMs(ms.id)} className="text-gray-300 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
