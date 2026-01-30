import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import CameraPage from './pages/CameraPage';
import ViewerPage from './pages/ViewerPage';
import Auth from './pages/Auth';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen text-white font-sans selection:bg-indigo-500/30">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/viewer" element={<ViewerPage />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
