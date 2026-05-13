import { createServerSupabase } from '@/lib/supabase-server'
import { Task, Stream, Sprint } from '@/types'
import TaskTable from '@/components/ui/TaskTable'

export const revalidate = 0

export default async function TasksPage() {
  const supabase = await createServerSupabase()

  const [
    { data: tasks },
    { data: streams },
    { data: sprints },
  ] = await Promise.all([
    supabase.from('tasks').select('*, stream:streams(*), sprint:sprints(*)').order('stream_id').order('month').range(0, 1000),
    supabase.from('streams').select('*').order('created_at'),
    supabase.from('sprints').select('*').order('start_date'),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Click a status badge to update it in real time</p>
        </div>
      </div>
      <TaskTable
        initialTasks={(tasks ?? []) as Task[]}
        streams={(streams ?? []) as Stream[]}
        sprints={(sprints ?? []) as Sprint[]}
      />
    </div>
  )
}
