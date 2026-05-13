'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Task, Stream, Sprint, Status } from '@/types'
import { ChevronDown, Plus, X, Save } from 'lucide-react'
import clsx from 'clsx'
import { createPortal } from 'react-dom'

const TEAM_MEMBERS = [
  'Lutho Buyaphi',
  'Thabo Kumalo',
  'Kamo (Kamohelo)',
  'Mila (Emilia)',
  'Lindo',
]

const STATUS_OPTIONS: { value: Status; label: string; cls: string }[] = [
  { value: 'done',        label: 'Done',        cls: 'status-done' },
  { value: 'in_progress', label: 'In progress', cls: 'status-in_progress' },
  { value: 'todo',        label: 'To do',       cls: 'status-todo' },
]

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-600 font-medium', medium: 'text-amber-600', low: 'text-gray-400'
}

interface Props {
  initialTasks: Task[]
  streams: Stream[]
  sprints: Sprint[]
}

function StatusBadge({ status, taskId, onChange }: { status: Status; taskId: string; onChange: (id: string, s: Status) => void }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const opt = STATUS_OPTIONS.find(o => o.value === status)!
  
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      })
      
      const closeDropdown = () => setOpen(false)
      document.addEventListener('click', closeDropdown)
      return () => document.removeEventListener('click', closeDropdown)
    }
  }, [open])
  
  const dropdown = open && (
    <div 
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[130px] z-[9999]" 
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {STATUS_OPTIONS.map(o => (
        <button
          key={o.value}
          onClick={() => { onChange(taskId, o.value); setOpen(false) }}
          className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2"
        >
          <span className={clsx('inline-block px-1.5 py-0.5 rounded-full text-xs font-medium', o.cls)}>{o.label}</span>
        </button>
      ))}
    </div>
  )
  
  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className={clsx('inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium', opt.cls)}
      >
        {opt.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {typeof document !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </>
  )
}

export default function TaskTable({ initialTasks, streams, sprints }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filterStream, setFilterStream] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [addingTask, setAddingTask] = useState(false)
  const [newTask, setNewTask] = useState<{ title: string; stream_id: string; sprint_id: string; priority: 'high'|'medium'|'low'; points: number; month: number; assigned_to: string }>({ title: '', stream_id: streams[0]?.id ?? '', sprint_id: '', priority: 'medium', points: 0, month: 1, assigned_to: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
        if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === (payload.new as Task).id ? { ...t, ...(payload.new as Task) } : t))
        } else if (payload.eventType === 'INSERT') {
          setTasks(prev => [...prev, payload.new as Task])
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== (payload.old as Task).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const updateStatus = useCallback(async (id: string, status: Status) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    await supabase.from('tasks').update({ status }).eq('id', id)
  }, [supabase])

  const deleteTask = useCallback(async (id: string) => {
    if (!confirm('Delete this task?')) return
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }, [supabase])

  const saveNewTask = async () => {
    if (!newTask.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('tasks').insert({
      ...newTask,
      status: 'todo',
      sprint_id: newTask.sprint_id || null,
    }).select('*, stream:streams(*), sprint:sprints(*)').single()
    if (data) setTasks(prev => [...prev, data as Task])
    setAddingTask(false)
    setNewTask({ title: '', stream_id: streams[0]?.id ?? '', sprint_id: '', priority: 'medium', points: 0, month: 1, assigned_to: '' })
    setSaving(false)
  }

  const filtered = tasks.filter(t => {
    const s = filterStream === 'all' || t.stream_id === filterStream
    const st = filterStatus === 'all' || t.status === filterStatus
    return s && st
  })

  const grouped = streams.map(stream => ({
    stream,
    tasks: filtered.filter(t => t.stream_id === stream.id)
  })).filter(g => g.tasks.length > 0)

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterStream} onChange={e => setFilterStream(e.target.value)} className="input w-auto text-sm">
          <option value="all">All streams</option>
          {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-auto text-sm">
          <option value="all">All statuses</option>
          <option value="done">Done</option>
          <option value="in_progress">In progress</option>
          <option value="todo">To do</option>
        </select>
        <button onClick={() => setAddingTask(true)} className="btn-primary flex items-center gap-1.5 ml-auto">
          <Plus className="w-4 h-4" /> Add task
        </button>
      </div>

      {/* Add task form */}
      {addingTask && (
        <div className="card p-4 mb-4 border-brand-200 bg-brand-50">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">New task</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <input
              className="input col-span-2 md:col-span-3"
              placeholder="Task title"
              value={newTask.title}
              onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
            />
            <select className="input" value={newTask.stream_id} onChange={e => setNewTask(p => ({ ...p, stream_id: e.target.value }))}>
              {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={newTask.sprint_id} onChange={e => setNewTask(p => ({ ...p, sprint_id: e.target.value }))}>
              <option value="">No sprint</option>
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as 'high'|'medium'|'low' }))}>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <select className="input" value={newTask.assigned_to} onChange={e => setNewTask(p => ({ ...p, assigned_to: e.target.value }))}>
              <option value="">Assign to...</option>
              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Points</label>
              <input type="number" className="input" min={0} max={20} value={newTask.points} onChange={e => setNewTask(p => ({ ...p, points: +e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Month</label>
              <input type="number" className="input" min={1} max={4} value={newTask.month} onChange={e => setNewTask(p => ({ ...p, month: +e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveNewTask} disabled={saving} className="btn-primary flex items-center gap-1.5">
              <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save task'}
            </button>
            <button onClick={() => setAddingTask(false)} className="btn-secondary flex items-center gap-1.5">
              <X className="w-4 h-4" />Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task groups */}
      <div className="space-y-4">
        {grouped.map(({ stream, tasks: groupTasks }) => (
          <div key={stream.id} className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 bg-gray-50/60">
              <span className="w-2 h-2 rounded-full" style={{ background: stream.color }} />
              <span className="text-sm font-semibold text-gray-800">{stream.name}</span>
              <span className="text-xs text-gray-400">— {stream.owner}</span>
              <span className="ml-auto text-xs text-gray-400">{groupTasks.filter(t => t.status==='done').length}/{groupTasks.length} done</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {groupTasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <span className={clsx('text-gray-800', task.status === 'done' && 'line-through text-gray-400')}>{task.title}</span>
                      {task.assigned_to && (
                        <div className="text-xs text-gray-400 mt-0.5">→ {task.assigned_to}</div>
                      )}
                    </td>
                    <td className="px-2 py-3 w-28">
                      <StatusBadge status={task.status} taskId={task.id} onChange={updateStatus} />
                    </td>
                    <td className="px-2 py-3 w-20 hidden sm:table-cell">
                      <span className={clsx('text-xs', PRIORITY_COLORS[task.priority] ?? '')}>{task.priority}</span>
                    </td>
                    <td className="px-2 py-3 w-16 text-xs text-gray-400 hidden md:table-cell">
                      {task.sprint?.name ?? '—'}
                    </td>
                    <td className="px-2 py-3 w-16 text-xs text-gray-400 text-right hidden md:table-cell">
                      {task.points ? `${task.points}pts` : '—'}
                    </td>
                    <td className="px-2 py-3 w-10">
                      <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="card p-8 text-center text-gray-400 text-sm">No tasks match your filters</div>
        )}
      </div>
    </div>
  )
}
