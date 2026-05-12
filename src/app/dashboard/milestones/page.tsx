import { createServerSupabase } from '@/lib/supabase-server'
import { Milestone } from '@/types'
import MilestonesClient from '@/components/ui/MilestonesClient'

export const revalidate = 0

export default async function MilestonesPage() {
  const supabase = await createServerSupabase()
  const { data: milestones } = await supabase.from('milestones').select('*').order('target_date')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Milestones</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track major project checkpoints</p>
      </div>
      <MilestonesClient initialMilestones={(milestones ?? []) as Milestone[]} />
    </div>
  )
}
