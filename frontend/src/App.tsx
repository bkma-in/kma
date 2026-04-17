import { Routes, Route } from 'react-router-dom';
import AuthContainer from './components/AuthContainer'
import LandingPage from './components/LandingPage'

function App() {
  return (
    <div className="w-full min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthContainer />} />
      </Routes>
    </div>
  )
}

export default App
