import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Submission } from './pages/Submission'
import { Dashboard } from './pages/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 w-full flex flex-col text-slate-900">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        <Routes>
          <Route path="/" element={<Submission />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
