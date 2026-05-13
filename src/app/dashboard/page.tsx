import { createServerSupabase } from '@/lib/supabase-server'
import { Task, Stream, Milestone } from '@/types'
import StreamCard from '@/components/ui/StreamCard'
import StatCard from '@/components/ui/StatCard'
import MilestoneBar from '@/components/ui/MilestoneBar'
import { CheckCircle2, Clock, Circle, Zap, CalendarClock } from 'lucide-react'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createServerSupabase()

  const [
    { data: tasks },
    { data: streams },
    { data: milestones },
  ] = await Promise.all([
    supabase.from('tasks').select('*, stream:streams(*), sprint:sprints(*)').order('created_at').range(0, 1000),
    supabase.from('streams').select('*').order('created_at'),
    supabase.from('milestones').select('*').order('target_date'),
  ])

  const t = (tasks ?? []) as Task[]
  const s = (streams ?? []) as Stream[]
  const m = (milestones ?? []) as Milestone[]

  const done       = t.filter(x => x.status === 'done').length
  const inProgress = t.filter(x => x.status === 'in_progress').length
  const todo       = t.filter(x => x.status === 'todo').length
  const total      = t.length
  const pctDone    = total ? Math.round((done / total) * 100) : 0

  const donePoints  = t.filter(x => x.status === 'done').reduce((a, x) => a + (x.points || 0), 0)
  const totalPoints = t.reduce((a, x) => a + (x.points || 0), 0)

  const deadline = new Date('2025-09-30')
  const today    = new Date()
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / 86400000))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Project Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">CompuClass Enhancement Phase · Mar 16 – Sep 30, 2025</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Done" value={done} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} color="emerald" />
        <StatCard label="In Progress" value={inProgress} icon={<Clock className="w-4 h-4 text-amber-500" />} color="amber" />
        <StatCard label="To Do" value={todo} icon={<Circle className="w-4 h-4 text-gray-400" />} color="gray" />
        <StatCard label="Points Done" value={`${donePoints}/${totalPoints}`} icon={<Zap className="w-4 h-4 text-brand-500" />} color="brand" />
        <StatCard label="Days Left" value={daysLeft} icon={<CalendarClock className="w-4 h-4 text-red-400" />} color="red" />
      </div>

      {/* Overall progress bar */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall completion</span>
          <span className="text-sm font-semibold text-gray-900">{pctDone}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-brand-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${pctDone}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{done} of {total} tasks complete</p>
      </div>

      {/* Milestones */}
      <div className="card p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Milestones</h2>
        <div className="space-y-2">
          {m.map(ms => <MilestoneBar key={ms.id} milestone={ms} />)}
        </div>
      </div>

      {/* Stream cards */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Streams</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {s.map(stream => {
          const streamTasks = t.filter(x => x.stream_id === stream.id)
          return <StreamCard key={stream.id} stream={stream} tasks={streamTasks} />
        })}
      </div>
    </div>
  )
}
