import { useEffect, useState } from 'react'
import { getTickets, triggerEscalation } from '../api'
import { Clock, AlertTriangle, CheckCircle2, ArrowUpRight, RefreshCw } from 'lucide-react'

type Ticket = {
  id: number
  title: string
  description: string
  reporter_department: string
  summary: string
  category: string
  priority: string
  assigned_team: string
  status: string
  created_at: string
}

export function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [escalating, setEscalating] = useState(false)

  const fetchTickets = async () => {
    try {
      const data = await getTickets()
      setTickets(data)
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
    const interval = setInterval(fetchTickets, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  const handleEscalation = async () => {
    setEscalating(true)
    try {
      await triggerEscalation()
      await fetchTickets()
    } catch (error) {
      console.error("Error triggering escalation:", error)
    } finally {
      setEscalating(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    const p = priority?.toLowerCase() || ''
    if (p.includes('high')) return 'bg-red-100 text-red-700 border-red-200'
    if (p.includes('medium')) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    if (p.includes('low')) return 'bg-blue-100 text-blue-700 border-blue-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'Escalated') return <AlertTriangle className="w-4 h-4 text-orange-500" />
    if (status === 'Resolved') return <CheckCircle2 className="w-4 h-4 text-green-500" />
    return <Clock className="w-4 h-4 text-blue-500" />
  }

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime() + now.getTimezoneOffset() * 60000) / 1000)
    
    if (seconds < 60) return `${Math.max(0, seconds)}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="w-full mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">Ticket Dashboard</h2>
          <p className="text-slate-500">Monitor all AI-routed incidents and workflow statuses.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleEscalation}
            disabled={escalating}
            className="flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            {escalating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
            Trigger SLA Escalations
          </button>
          <button 
            onClick={fetchTickets}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No tickets found</h3>
            <p className="text-slate-500 mt-1">There are currently no incidents in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4 pl-6">Ticket / Summary</th>
                  <th className="p-4">Assigned Team</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm mb-0.5">#{ticket.id} - {ticket.title}</span>
                        <span className="text-xs text-slate-500 line-clamp-1 max-w-md">{ticket.summary}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                            {ticket.category}
                          </span>
                          <span className="text-[10px] text-slate-400">from {ticket.reporter_department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-700 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md">
                          {ticket.assigned_team}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority || 'medium'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className={`text-sm font-medium ${ticket.status === 'Escalated' ? 'text-orange-600' : 'text-slate-700'}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-sm text-slate-500">{timeAgo(ticket.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
