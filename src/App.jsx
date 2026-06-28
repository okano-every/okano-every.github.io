import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Portal from './pages/Portal'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default App
