import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import GameRoom from './components/GameRoom';
import Leaderboard from './components/Leaderboard';
import LiveChat from './components/LiveChat';
import Profile from './components/Profile';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-600 text-white p-4">
          <nav className="container mx-auto flex space-x-4">
            <Link to="/" className="hover:underline">Game Room</Link>
            <Link to="/leaderboard" className="hover:underline">Leaderboard</Link>
            <Link to="/chat" className="hover:underline">Live Chat</Link>
            <Link to="/profile" className="hover:underline">Profile</Link>
          </nav>
        </header>
        <main className="container mx-auto p-4">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <GameRoom />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <LiveChat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

