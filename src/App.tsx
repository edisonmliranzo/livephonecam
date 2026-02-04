import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CameraPage from './pages/CameraPage';
import ViewerPage from './pages/ViewerPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans selection:bg-orange-500/30">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/viewer" element={<ViewerPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
