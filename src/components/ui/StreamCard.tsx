import { Stream, Task } from '@/types'

interface Props { stream: Stream; tasks: Task[] }

const statusLabel: Record<string, string> = {
  done: 'Done', in_progress: 'In progress', todo: 'To do'
}

export default function StreamCard({ stream, tasks }: Props) {
  const done       = tasks.filter(t => t.status === 'done').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const total      = tasks.length
  const pct        = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stream.color }} />
            <h3 className="text-sm font-semibold text-gray-900">{stream.name}</h3>
          </div>
          <p className="text-xs text-gray-400 ml-4">{stream.owner}</p>
        </div>
        <span className="text-lg font-bold text-gray-900">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, background: stream.color }}
        />
      </div>

      {/* Status breakdown */}
      <div className="flex gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          {done} done
        </span>
        {inProgress > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {inProgress} active
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
          {total - done - inProgress} to do
        </span>
      </div>

      {/* Latest tasks */}
      <div className="mt-3 space-y-1 border-t border-gray-50 pt-3">
        {tasks.slice(0, 3).map(task => (
          <div key={task.id} className="flex items-center gap-2">
            <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded font-medium ${
              task.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
              task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {statusLabel[task.status]}
            </span>
            <span className="text-xs text-gray-600 truncate">{task.title}</span>
          </div>
        ))}
        {tasks.length > 3 && (
          <p className="text-xs text-gray-400 pt-0.5">+{tasks.length - 3} more tasks</p>
        )}
      </div>
    </div>
  )
}
