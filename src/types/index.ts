export type Status = 'done' | 'in_progress' | 'todo'
export type Priority = 'high' | 'medium' | 'low'
export type MilestoneStatus = 'done' | 'active' | 'upcoming'

export interface Stream {
  id: string
  name: string
  owner: string
  color: string
  icon: string
  created_at: string
}

export interface Sprint {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export interface Task {
  id: string
  title: string
  stream_id: string
  sprint_id: string | null
  status: Status
  priority: Priority
  points: number
  month: number | null
  notes: string | null
  assigned_to: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  stream?: Stream
  sprint?: Sprint
}

export interface Milestone {
  id: string
  name: string
  target_date: string
  status: MilestoneStatus
  created_at: string
}

export interface DashboardStats {
  totalTasks: number
  doneTasks: number
  inProgressTasks: number
  todoTasks: number
  totalPoints: number
  donePoints: number
  daysRemaining: number
  completionPercent: number
}
