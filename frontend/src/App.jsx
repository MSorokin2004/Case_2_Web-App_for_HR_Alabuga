import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import CandidateProfile from './components/CandidateProfile';
import HRDashboard from './components/HRDashboard';
import ResumeDetail from './components/ResumeDetail';
import Notifications from './components/Notifications';
import PrivateRoute from './components/PrivateRoute';
import api from './api';
import React, { useState, useEffect } from 'react';




function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
  const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const resp = await api.get('/notifications/unread-count');
      setUnreadCount(resp.data.count);
    } catch (err) {
      console.error('Ошибка получения количества непрочитанных уведомлений');
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Слушатель для мгновенного обновления счётчика
    const handleUnreadUpdate = () => {
      fetchUnreadCount();
    };
    window.addEventListener('unread-updated', handleUnreadUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('unread-updated', handleUnreadUpdate);
    };
  }, [token]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  return (
    <div>
      <nav className="app-nav">
        <div className="nav-container">
          <Link to="/" className="nav-brand">HR Platform</Link>
          <div className="nav-links">
            {!token ? (
              <>
                <Link to="/login" className="nav-link">Вход</Link>
                <Link to="/register" className="nav-link nav-link-primary">Регистрация</Link>
              </>
            ) : (
              <>
                {role === 'candidate' && <Link to="/profile" className="nav-link">Моё резюме</Link>}
                {(role === 'hr' || role === 'manager') && <Link to="/dashboard" className="nav-link">Кандидаты</Link>}
                    <Link to="/notifications" className="nav-link">
                      Уведомления
                      {unreadCount > 0 && <span className="unread-indicator">{unreadCount}</span>}
                    </Link>
                <button onClick={handleLogout} className="nav-link logout-btn">Выход</button>
              </>
            )}
          </div>
        </div>
      </nav>


      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={
            <PrivateRoute allowedRoles={['candidate']}>
              <CandidateProfile />
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute allowedRoles={['hr', 'manager']}>
              <HRDashboard />
            </PrivateRoute>
          } />
          <Route path="/resume/:id" element={
            <PrivateRoute allowedRoles={['hr', 'manager']}>
              <ResumeDetail />
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute allowedRoles={['candidate', 'hr', 'manager']}>
              <Notifications />
            </PrivateRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;