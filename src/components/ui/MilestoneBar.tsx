import { Milestone } from '@/types'
import { CheckCircle2, Clock, Calendar } from 'lucide-react'

export default function MilestoneBar({ milestone }: { milestone: Milestone }) {
  const date = new Date(milestone.target_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })

  const config = {
    done:     { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, cls: 'text-emerald-700 bg-emerald-50 border-emerald-100', label: 'Complete' },
    active:   { icon: <Clock className="w-4 h-4 text-amber-500" />,         cls: 'text-amber-700 bg-amber-50 border-amber-100',   label: 'Active'    },
    upcoming: { icon: <Calendar className="w-4 h-4 text-gray-400" />,       cls: 'text-gray-500 bg-gray-50 border-gray-100',      label: 'Upcoming'  },
  }[milestone.status]

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${config.cls}`}>
      <div className="flex items-center gap-2">
        {config.icon}
        <span className="text-sm font-medium">{milestone.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs opacity-70">{date}</span>
        <span className="text-xs font-medium">{config.label}</span>
      </div>
    </div>
  )
}
