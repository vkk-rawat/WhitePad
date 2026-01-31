import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CanvasProvider } from './contexts/CanvasContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Whiteboard from './pages/Whiteboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CanvasProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/whiteboard/:sessionId" element={<Whiteboard />} />
          </Routes>
        </Router>
      </CanvasProvider>
    </AuthProvider>
  );
}

export default App;
