interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50',
    amber:   'bg-amber-50',
    gray:    'bg-gray-50',
    brand:   'bg-brand-50',
    red:     'bg-red-50',
  }
  return (
    <div className={`card p-4 ${colorMap[color] ?? 'bg-white'}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-500 font-medium">{label}</span></div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
