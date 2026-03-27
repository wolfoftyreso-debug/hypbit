import { useState } from 'react'

type Priority = 'hög' | 'medium' | 'låg'
type Filter = 'Mina' | 'Alla' | 'Idag'

interface Task {
  id: number
  title: string
  priority: Priority
  assignee: string
  done: boolean
  today: boolean
  project: string
}

const INITIAL_TASKS: Task[] = [
  { id: 1,  title: 'Sätt upp AWS ECS för QuixZoom backend',  priority: 'hög',    assignee: 'Johan',   done: false, today: true,  project: 'QuixZoom' },
  { id: 2,  title: 'Skicka investorpitch till UAE-kontakt',  priority: 'hög',    assignee: 'Erik',    done: false, today: true,  project: 'Strategi' },
  { id: 3,  title: 'Granska UA-kontrakt för Dubai LLC',      priority: 'hög',    assignee: 'Dennis',  done: false, today: false, project: 'Legal' },
  { id: 4,  title: 'Designa onboarding för QuixZoom app',    priority: 'medium', assignee: 'Erik',    done: false, today: false, project: 'QuixZoom' },
  { id: 5,  title: 'Uppdatera kassaflödesprognos Q2',        priority: 'medium', assignee: 'Winston', done: false, today: true,  project: 'Finans' },
  { id: 6,  title: 'Boka lokal för Thailand-kickoff',        priority: 'medium', assignee: 'Leon',    done: true,  today: false, project: 'Thailand' },
  { id: 7,  title: 'Sätta pipeline-stages i Hypebit CRM',   priority: 'låg',    assignee: 'Erik',    done: false, today: false, project: 'Intern' },
  { id: 8,  title: 'Köp team-SIM-kort för Thailand',        priority: 'låg',    assignee: 'Leon',    done: false, today: false, project: 'Thailand' },
]

const PRIORITY_STYLE: Record<Priority, { dot: string; badge: string; text: string }> = {
  hög:    { dot: 'bg-danger',  badge: 'bg-danger/10 text-red-300',   text: 'Hög' },
  medium: { dot: 'bg-warning', badge: 'bg-warning/10 text-yellow-300', text: 'Medium' },
  låg:    { dot: 'bg-success', badge: 'bg-success/10 text-green-300', text: 'Låg' },
}

interface NewTaskForm {
  title: string
  priority: Priority
  project: string
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [filter, setFilter] = useState<Filter>('Alla')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewTaskForm>({ title: '', priority: 'medium', project: '' })

  function toggle(id: number) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function addTask() {
    if (!form.title.trim()) return
    const newTask: Task = {
      id: Date.now(),
      title: form.title.trim(),
      priority: form.priority,
      assignee: 'Erik',
      done: false,
      today: true,
      project: form.project || 'Intern',
    }
    setTasks(prev => [newTask, ...prev])
    setForm({ title: '', priority: 'medium', project: '' })
    setShowForm(false)
  }

  const filtered = tasks.filter(t => {
    if (filter === 'Mina') return t.assignee === 'Erik'
    if (filter === 'Idag') return t.today
    return true
  })

  const open = filtered.filter(t => !t.done)
  const done = filtered.filter(t => t.done)

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Tasks</p>
          <h1 className="text-2xl font-bold text-text-primary">Uppgifter</h1>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold shadow-lg active:scale-95 transition-transform"
        >
          {showForm ? '×' : '+'}
        </button>
      </div>

      {/* New task form */}
      {showForm && (
        <div className="mx-5 mb-4 bg-card border border-accent/25 rounded-2xl p-4 flex flex-col gap-3">
          <input
            value={form.title}
            onChange={e => setForm(v => ({ ...v, title: e.target.value }))}
            placeholder="Beskriv uppgiften…"
            autoFocus
            className="w-full bg-bg border border-white/[0.07] rounded-xl px-4 h-11 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 transition-colors"
          />
          <div className="flex gap-2">
            <input
              value={form.project}
              onChange={e => setForm(v => ({ ...v, project: e.target.value }))}
              placeholder="Projekt (t.ex. QuixZoom)"
              className="flex-1 bg-bg border border-white/[0.07] rounded-xl px-4 h-10 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 transition-colors"
            />
            <select
              value={form.priority}
              onChange={e => setForm(v => ({ ...v, priority: e.target.value as Priority }))}
              className="bg-bg border border-white/[0.07] rounded-xl px-3 h-10 text-sm text-text-primary outline-none"
            >
              <option value="hög">🔴 Hög</option>
              <option value="medium">🟡 Medium</option>
              <option value="låg">🟢 Låg</option>
            </select>
          </div>
          <button
            onClick={addTask}
            className="w-full h-10 bg-accent rounded-xl text-white text-sm font-semibold active:opacity-80 transition-opacity"
          >
            Lägg till task
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="px-5 mb-4 flex gap-2">
        {(['Mina', 'Alla', 'Idag'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 h-8 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-accent text-white'
                : 'bg-card border border-white/[0.07] text-text-secondary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="px-5 flex flex-col gap-2">
        {open.map(task => (
          <TaskRow key={task.id} task={task} onToggle={toggle} />
        ))}

        {done.length > 0 && (
          <>
            <p className="text-xs text-text-muted uppercase tracking-widest mt-3 mb-1">Klara</p>
            {done.map(task => (
              <TaskRow key={task.id} task={task} onToggle={toggle} />
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">
            Inga tasks i den här vyn
          </div>
        )}
      </div>
    </div>
  )
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: number) => void }) {
  const p = PRIORITY_STYLE[task.priority]
  return (
    <div
      onClick={() => onToggle(task.id)}
      className={`bg-card border border-white/[0.07] rounded-2xl p-4 flex items-start gap-3 cursor-pointer active:bg-card2 transition-colors ${
        task.done ? 'opacity-50' : ''
      }`}
    >
      {/* Checkbox */}
      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
        task.done ? 'bg-accent border-accent' : 'border-white/20'
      }`}>
        {task.done && <span className="text-white text-[10px]">✓</span>}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${task.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.badge}`}>
            {p.text}
          </span>
          <span className="text-[11px] text-text-muted">{task.project}</span>
          <span className="text-[11px] text-text-muted">· {task.assignee}</span>
        </div>
      </div>
    </div>
  )
}
