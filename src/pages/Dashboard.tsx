import { useEffect, useState } from 'react'
import { getTickets, triggerEscalation, closeTicket, clearAllTickets, analyzeOverview } from '../api'
import { Clock, AlertTriangle, CheckCircle2, ArrowUpRight, RefreshCw, Trash2, XCircle, X, Sparkles, BarChart3 } from 'lucide-react'

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
  related_tickets?: { id: number, title: string, status: string }[]
}

export function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [escalating, setEscalating] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const selectedTicket = tickets.find(t => t.id === selectedTicketId)

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

  const handleCloseTicket = async (id: number) => {
    try {
      await closeTicket(id)
      await fetchTickets()
    } catch (error) {
      console.error("Error closing ticket:", error)
    }
  }

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all tickets? This action cannot be undone.")) {
      try {
        await clearAllTickets()
        await fetchTickets()
      } catch (error) {
        console.error("Error clearing tickets:", error)
      }
    }
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const data = await analyzeOverview()
      setAnalysis(data.analysis)
    } catch (error) {
      console.error("Error analyzing overview:", error)
      setAnalysis("Failed to generate AI analysis.")
    } finally {
      setAnalyzing(false)
    }
  }

  // Calculate Stats
  const totalTickets = tickets.length;
  const closedCount = tickets.filter(t => t.status === 'Closed').length;
  const activeCount = totalTickets - closedCount;
  
  const categoryStats = tickets.reduce((acc, ticket) => {
    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const activePercentage = totalTickets > 0 ? Math.round((activeCount / totalTickets) * 100) : 0;
  const closedPercentage = totalTickets > 0 ? Math.round((closedCount / totalTickets) * 100) : 0;

  const getPriorityColor = (priority: string) => {
    const p = priority?.toLowerCase() || ''
    if (p.includes('high')) return 'bg-red-100 text-red-700 border-red-200'
    if (p.includes('medium')) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    if (p.includes('low')) return 'bg-blue-100 text-blue-700 border-blue-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'Escalated') return <AlertTriangle className="w-4 h-4 text-orange-500" />
    if (status === 'Resolved' || status === 'Closed') return <CheckCircle2 className="w-4 h-4 text-green-500" />
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

  const renderWithTicketLinks = (text: string) => {
    if (!text) return null;
    // Split by # followed by numbers
    const parts = text.split(/(#\d+)/g);
    
    return parts.map((part, index) => {
      if (part.match(/^#\d+$/)) {
        const id = parseInt(part.substring(1), 10);
        return (
          <button 
            key={index}
            onClick={() => setSelectedTicketId(id)}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium focus:outline-none"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    const getStatusWeight = (status: string) => {
      if (status === 'Escalated') return 0;
      if (status === 'Closed' || status === 'Resolved') return 2;
      return 1;
    };
    
    const weightA = getStatusWeight(a.status);
    const weightB = getStatusWeight(b.status);
    
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="w-full mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">Ticket Dashboard</h2>
          <p className="text-slate-500">Monitor all AI-routed incidents and workflow statuses.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
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

      {/* Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Categories Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Tickets by Category
          </h3>
          {Object.keys(categoryStats).length === 0 ? (
             <p className="text-sm text-slate-500 flex-1 flex items-center justify-center">No category data available.</p>
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2 font-medium text-slate-600">Category</th>
                    <th className="px-4 py-2 font-medium text-slate-600 text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                    <tr key={cat} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 text-slate-700 capitalize">{cat}</td>
                      <td className="px-4 py-2 text-slate-700 text-right font-medium">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status Bar Chart & AI Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Database Status Overview</h3>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || totalTickets === 0}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analyze with AI
            </button>
          </div>

          {/* Custom Bar Chart */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-slate-700">Active ({activeCount})</span>
              <span className="font-medium text-slate-700">Closed ({closedCount})</span>
            </div>
            <div className="h-4 flex rounded-full overflow-hidden bg-slate-100">
              {totalTickets > 0 ? (
                <>
                  <div 
                    className="bg-blue-500 h-full transition-all duration-500" 
                    style={{ width: `${activePercentage}%` }}
                    title={`Active: ${activePercentage}%`}
                  ></div>
                  <div 
                    className="bg-green-500 h-full transition-all duration-500" 
                    style={{ width: `${closedPercentage}%` }}
                    title={`Closed: ${closedPercentage}%`}
                  ></div>
                </>
              ) : (
                <div className="w-full h-full bg-slate-200" title="No tickets"></div>
              )}
            </div>
          </div>

          {/* AI Analysis Result */}
          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI Executive Summary
            </h4>
            {analysis ? (
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {analysis}
              </div>
            ) : (
              <div className="text-sm text-slate-500 flex-1 flex items-center justify-center min-h-[80px] italic">
                Click "Analyze with AI" to generate a database overview.
              </div>
            )}
          </div>
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
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex flex-col">
                        <button 
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-sm mb-0.5 text-left focus:outline-none"
                        >
                          #{ticket.id} - {ticket.title}
                        </button>
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
                        <span className={`text-sm font-medium ${ticket.status === 'Escalated' ? 'text-orange-600' : ticket.status === 'Closed' ? 'text-green-600' : 'text-slate-700'}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-sm text-slate-500">{timeAgo(ticket.created_at)}</span>
                    </td>
                    <td className="p-4">
                      {ticket.status !== 'Closed' && (
                        <button
                          onClick={() => handleCloseTicket(ticket.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Close Ticket"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicketId && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-slate-500">#{selectedTicket.id}</span>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority || 'medium'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(selectedTicket.status)}
                    <span className={`text-sm font-medium ${selectedTicket.status === 'Escalated' ? 'text-orange-600' : selectedTicket.status === 'Closed' ? 'text-green-600' : 'text-slate-700'}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{selectedTicket.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedTicketId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assigned Team</h4>
                  <span className="text-sm font-medium text-slate-700 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-md inline-block">
                    {selectedTicket.assigned_team}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</h4>
                  <span className="text-sm font-medium px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 inline-block">
                    {selectedTicket.category}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Reporter Dept</h4>
                  <span className="text-sm text-slate-700">{selectedTicket.reporter_department}</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Created</h4>
                  <span className="text-sm text-slate-700">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">AI Summary</h4>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 border border-slate-100 leading-relaxed">
                    {renderWithTicketLinks(selectedTicket.summary)}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Original Description</h4>
                  <div className="bg-white rounded-lg p-4 text-sm text-slate-700 border border-slate-200 whitespace-pre-wrap leading-relaxed">
                    {renderWithTicketLinks(selectedTicket.description)}
                  </div>
                </div>

                {selectedTicket.related_tickets && selectedTicket.related_tickets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Similar / Related Tickets</h4>
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <ul className="divide-y divide-slate-100">
                        {selectedTicket.related_tickets.map((related) => (
                          <li key={related.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                            <button
                              onClick={() => setSelectedTicketId(related.id)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex-1 text-left"
                            >
                              #{related.id} - {related.title}
                            </button>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              {related.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              {selectedTicket.status !== 'Closed' && (
                <button
                  onClick={() => {
                    handleCloseTicket(selectedTicket.id);
                    setSelectedTicketId(null);
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-600 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Close Ticket
                </button>
              )}
              <button
                onClick={() => setSelectedTicketId(null)}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
