import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Downline from './pages/Downline';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Commissions from './pages/Commissions';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('nmc_user');
    return saved ? JSON.parse(saved) : null;
  });

  function handleLogin(userData, token) {
    setUser(userData);
    sessionStorage.setItem('nmc_user', JSON.stringify(userData));
    sessionStorage.setItem('nmc_token', token);
  }
  function handleLogout() {
    setUser(null);
    sessionStorage.clear();
  }

  function Private({ children }) {
    return user ? children : <Navigate to="/login" />;
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Private><Dashboard user={user} /></Private>} />
        <Route path="/downline" element={<Private><Downline user={user} /></Private>} />
        <Route path="/products" element={<Private><Products user={user} /></Private>} />
        <Route path="/orders" element={<Private><Orders user={user} /></Private>} />
        <Route path="/commissions" element={<Private><Commissions user={user} /></Private>} />
      </Routes>
    </>
  );
}
