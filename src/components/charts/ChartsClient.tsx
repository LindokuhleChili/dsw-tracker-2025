'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Task, Stream } from '@/types'
import { Maximize2, Minimize2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'

interface Props { initialTasks: Task[]; streams: Stream[] }

const COLORS = ['#6366f1','#f59e0b','#10b981','#f43f5e','#8b5cf6']
const STATUS_COLORS = { done: '#10b981', in_progress: '#f59e0b', todo: '#e5e7eb' }

export default function ChartsClient({ initialTasks, streams }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [maximized, setMaximized] = useState<string | null>(null)
  const supabase = createClient()

  // Real-time subscription — charts update live
  useEffect(() => {
    const channel = supabase
      .channel('charts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
        if (payload.eventType === 'UPDATE')
          setTasks(prev => prev.map(t => t.id === (payload.new as Task).id ? { ...t, ...(payload.new as Task) } : t))
        else if (payload.eventType === 'INSERT')
          setTasks(prev => [...prev, payload.new as Task])
        else if (payload.eventType === 'DELETE')
          setTasks(prev => prev.filter(t => t.id !== (payload.old as Task).id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // --- Data transforms ---

  // 1. Tasks by stream (stacked bar)
  const byStream = streams.map((s, i) => {
    const st = tasks.filter(t => t.stream_id === s.id)
    return {
      name: s.name.replace(' Enhancement','').replace(' Lab','').replace(' & QA',''),
      Done:        st.filter(t => t.status === 'done').length,
      'In Progress': st.filter(t => t.status === 'in_progress').length,
      'To Do':     st.filter(t => t.status === 'todo').length,
      color: COLORS[i],
    }
  })

  // 2. Overall status pie
  const overall = [
    { name: 'Done',        value: tasks.filter(t => t.status === 'done').length,        color: '#10b981' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'To Do',       value: tasks.filter(t => t.status === 'todo').length,        color: '#e5e7eb' },
  ]

  // 3. Points by stream
  const pointsByStream = streams.map((s, i) => {
    const st = tasks.filter(t => t.stream_id === s.id)
    return {
      name: s.name.replace(' Enhancement','').replace(' Lab','').replace(' & QA',''),
      'Done pts':  st.filter(t => t.status === 'done').reduce((a, t) => a + (t.points||0), 0),
      'Remaining': st.filter(t => t.status !== 'done').reduce((a, t) => a + (t.points||0), 0),
    }
  })

  // 4. Real burndown chart based on actual completion dates
  const totalTasks = tasks.length
  const totalPoints = tasks.reduce((sum, t) => sum + (t.points || 0), 0)
  const yAxisMax = Math.ceil(totalPoints * 1.1)
  
  const projectStart = new Date('2025-03-16')
  const deadline = new Date('2025-09-30')
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  
  // Calculate total weeks in project
  const totalProjectWeeks = Math.ceil((deadline.getTime() - projectStart.getTime()) / msPerWeek)
  const currentWeek = Math.floor((Date.now() - projectStart.getTime()) / msPerWeek)
  
  // Group completed tasks by week
  const completionsByWeek: Record<number, number> = {}
  tasks.forEach(task => {
    if (task.status === 'done' && task.completed_at) {
      const completedDate = new Date(task.completed_at)
      const weekNum = Math.floor((completedDate.getTime() - projectStart.getTime()) / msPerWeek)
      if (weekNum >= 0 && weekNum <= totalProjectWeeks) {
        completionsByWeek[weekNum] = (completionsByWeek[weekNum] || 0) + (task.points || 0)
      }
    }
  })
  
  // Build burndown data - only goes down when tasks actually completed
  let remainingPoints = totalPoints
  const burndown = Array.from({ length: totalProjectWeeks + 1 }, (_, weekNum) => {
    // Subtract points completed in this week
    if (weekNum > 0 && completionsByWeek[weekNum - 1]) {
      remainingPoints -= completionsByWeek[weekNum - 1]
    }
    
    // Ideal burndown: linear decrease
    const idealRemaining = Math.max(0, Math.round(totalPoints - (totalPoints / totalProjectWeeks) * weekNum))
    
    return {
      name: weekNum === currentWeek ? `Week ${weekNum} (Now)` : `Week ${weekNum}`,
      Remaining: Math.max(0, remainingPoints),
      Ideal: idealRemaining,
    }
  })
  
  // Fallback
  if (burndown.length === 0) {
    burndown.push(
      { name: 'Week 0', Remaining: totalPoints, Ideal: totalPoints },
      { name: 'End', Remaining: 0, Ideal: 0 }
    )
  }

  // 5. Priority distribution
  const priorityData = ['high','medium','low'].map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    Done:    tasks.filter(t => t.priority === p && t.status === 'done').length,
    Active:  tasks.filter(t => t.priority === p && t.status === 'in_progress').length,
    Todo:    tasks.filter(t => t.priority === p && t.status === 'todo').length,
  }))

  return (
    <div className="space-y-6">
      {/* Debug info */}
      <div className="text-xs text-gray-400 mb-2">
        Total tasks: {tasks.length} | 
        Total points: {tasks.reduce((sum, t) => sum + (t.points || 0), 0)} | 
        Done: {tasks.filter(t => t.status === 'done').length} | 
        Points done: {tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.points || 0), 0)} | 
        In Progress: {tasks.filter(t => t.status === 'in_progress').length} | 
        To Do: {tasks.filter(t => t.status === 'todo').length}
      </div>
      
      {maximized ? (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">{maximized}</h2>
            <button onClick={() => setMaximized(null)} className="text-gray-400 hover:text-gray-600">
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
          {maximized === 'Overall status' && (
            <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Pie data={overall} cx="50%" cy="50%" innerRadius={100} outerRadius={180} paddingAngle={3} dataKey="value">
                  {overall.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} tasks`, '']} />
                <Legend iconType="circle" iconSize={12} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {maximized === 'Tasks by stream' && (
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={byStream} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconSize={12} />
                <Bar dataKey="Done"        stackId="a" fill="#10b981" radius={[0,0,0,0]} />
                <Bar dataKey="In Progress" stackId="a" fill="#f59e0b" />
                <Bar dataKey="To Do"       stackId="a" fill="#e5e7eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {maximized === 'Story points by stream' && (
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={pointsByStream} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconSize={12} />
                <Bar dataKey="Done pts"  stackId="p" fill="#6366f1" radius={[0,0,0,0]} />
                <Bar dataKey="Remaining" stackId="p" fill="#e0e7ff" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {maximized === 'Burndown (tasks remaining)' && (
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={burndown} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 13 }} 
                  interval={Math.floor(burndown.length / 10)} 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 13 }} allowDecimals={false} domain={[0, yAxisMax]} />
                <Tooltip />
                <Legend iconSize={12} />
                <Line type="monotone" dataKey="Remaining" stroke="#6366f1" strokeWidth={3} dot={{ r: 6 }} />
                <Line type="monotone" dataKey="Ideal"     stroke="#d1d5db" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {maximized === 'Tasks by priority & status' && (
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconSize={12} />
                <Bar dataKey="Done"   fill="#10b981" radius={[0,0,0,0]} />
                <Bar dataKey="Active" fill="#f59e0b" />
                <Bar dataKey="Todo"   fill="#e5e7eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <>
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall status pie */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Overall status</h2>
            <button 
              onClick={() => setMaximized('Overall status')} 
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Maximize chart"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={overall} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {overall.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} tasks`, '']} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks per stream bar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Tasks by stream</h2>
            <button 
              onClick={() => setMaximized('Tasks by stream')} 
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Maximize chart"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStream} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend iconSize={10} />
              <Bar dataKey="Done"        stackId="a" fill="#10b981" radius={[0,0,0,0]} />
              <Bar dataKey="In Progress" stackId="a" fill="#f59e0b" />
              <Bar dataKey="To Do"       stackId="a" fill="#e5e7eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Points by stream */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Story points by stream</h2>
            <button 
              onClick={() => setMaximized('Story points by stream')} 
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Maximize chart"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pointsByStream} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend iconSize={10} />
              <Bar dataKey="Done pts"  stackId="p" fill="#6366f1" radius={[0,0,0,0]} />
              <Bar dataKey="Remaining" stackId="p" fill="#e0e7ff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Burndown */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Burndown (tasks remaining)</h2>
            <button 
              onClick={() => setMaximized('Burndown (tasks remaining)')} 
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Maximize chart"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={burndown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                interval={Math.floor(burndown.length / 8)} 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} domain={[0, yAxisMax]} />
              <Tooltip />
              <Legend iconSize={10} />
              <Line type="monotone" dataKey="Remaining" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Ideal"     stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3 - Priority */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Tasks by priority &amp; status</h2>
          <button 
            onClick={() => setMaximized('Tasks by priority & status')} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Maximize chart"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={priorityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend iconSize={10} />
            <Bar dataKey="Done"   fill="#10b981" radius={[0,0,0,0]} />
            <Bar dataKey="Active" fill="#f59e0b" />
            <Bar dataKey="Todo"   fill="#e5e7eb" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
        </>
      )}
    </div>
  )
}
