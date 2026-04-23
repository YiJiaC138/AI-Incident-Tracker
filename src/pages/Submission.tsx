import { useState } from 'react'
import { createIncident } from '../api'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

export function Submission() {
  const [tab, setTab] = useState<'portal' | 'email'>('portal')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [department, setDepartment] = useState('General Staff')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description) return

    setStatus('loading')
    try {
      const response = await createIncident({ title, description, department })
      setResult(response.analysis)
      setStatus('success')
      setTitle('')
      setDescription('')
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'An error occurred during submission.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Report an Incident</h2>
        <p className="text-slate-500">Submit your IT or operational issue, and our AI will automatically triage and route it to the right team.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors ${tab === 'portal' ? 'text-blue-600 border-b-2 border-blue-600 bg-slate-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            onClick={() => setTab('portal')}
          >
            Support Portal
          </button>
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors ${tab === 'email' ? 'text-blue-600 border-b-2 border-blue-600 bg-slate-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            onClick={() => setTab('email')}
          >
            Simulated Email
          </button>
        </div>

        {/* Form */}
        <div className="p-6 md:p-8">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Ticket Created Successfully</h3>
              <p className="text-slate-500 mb-8">The AI has analyzed your request and routed it accordingly.</p>
              
              {result && (
                <div className="bg-slate-50 rounded-lg p-4 text-left border border-slate-100 mb-8">
                  <h4 className="font-semibold text-slate-800 mb-3 border-b pb-2">AI Triage Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Category</span>
                      <p className="text-slate-800 font-medium">{result.category}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Priority</span>
                      <p className="text-slate-800 font-medium capitalize">{result.priority}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Routed To</span>
                      <p className="text-slate-800 font-medium">{result.assigned_team}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">AI Summary</span>
                      <p className="text-slate-700 text-sm mt-1">{result.summary}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setStatus('idle')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}
              
              {tab === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                  <input 
                    type="text" 
                    value="support@company.com" 
                    disabled 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reporter Department</label>
                <select 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none transition-shadow"
                >
                  <option value="General Staff">General Staff</option>
                  <option value="HR">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Executives">Executives</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{tab === 'email' ? 'Subject' : 'Issue Title'}</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder={tab === 'email' ? "e.g., Cannot access payroll system" : "Brief description of the issue"}
                  className="w-full p-2.5 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{tab === 'email' ? 'Email Body' : 'Detailed Description'}</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  placeholder="Please provide as much detail as possible to help the AI route your ticket correctly..."
                  className="w-full p-2.5 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none transition-shadow resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing and Routing...
                  </>
                ) : (
                  <>
                    Submit Incident
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
