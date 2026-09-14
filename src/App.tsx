import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import DeckSetup from './pages/DeckSetup'
import Home from './pages/Home'
import Library from './pages/Library'
import Onboarding from './pages/Onboarding'
import Session from './pages/Session'
import Settings from './pages/Settings'
import Summary from './pages/Summary'
import { useStore } from './store'

function Root() {
  const onboarded = useStore((s) => s.profile.onboarded)
  return onboarded ? <Navigate to="/home" replace /> : <Onboarding />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/home" element={<Home />} />
        <Route path="/deck/:id" element={<DeckSetup />} />
        <Route path="/session" element={<Session />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/library" element={<Library />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
