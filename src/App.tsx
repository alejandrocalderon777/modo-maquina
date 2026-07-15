import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Splash from './pages/Splash'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import AvatarSelect from './pages/AvatarSelect'
import LineageSelect from './pages/LineageSelect'
import MeasurementsPage from './pages/Measurements'
import Dashboard from './pages/Dashboard'
import FoodLog from './pages/FoodLog'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/avatar-select" element={<AvatarSelect />} />
        <Route path="/lineage-select" element={<LineageSelect />} />
        <Route path="/measurements" element={<MeasurementsPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/food-log" element={<FoodLog />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
