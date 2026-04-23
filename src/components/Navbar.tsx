import { Link, useLocation } from 'react-router-dom'
import { Ticket, Send } from 'lucide-react'

export function Navbar() {
  const location = useLocation()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 w-full">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Ticket className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight">AI-Incident Tracker</h1>
        </div>
        
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 ${
              location.pathname === '/' 
                ? 'bg-slate-100 text-blue-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            Submit
          </Link>
          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 ${
              location.pathname === '/dashboard' 
                ? 'bg-slate-100 text-blue-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
