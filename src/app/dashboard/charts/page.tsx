import { createServerSupabase } from '@/lib/supabase-server'
import { Task, Stream } from '@/types'
import ChartsClient from '@/components/charts/ChartsClient'

export const revalidate = 0

export default async function ChartsPage() {
  const supabase = await createServerSupabase()
  const [{ data: tasks }, { data: streams }] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at'),
    supabase.from('streams').select('*').order('created_at'),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Charts & Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Graphs update automatically when tasks are changed</p>
      </div>
      <ChartsClient initialTasks={(tasks ?? []) as Task[]} streams={(streams ?? []) as Stream[]} />
    </div>
  )
}
