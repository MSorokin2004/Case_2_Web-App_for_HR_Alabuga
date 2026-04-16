import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import CandidateProfile from './components/CandidateProfile';
import HRDashboard from './components/HRDashboard';
import ResumeDetail from './components/ResumeDetail';
import Notifications from './components/Notifications';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  return (
    <div>
      <nav style={{ padding: 10, borderBottom: '1px solid #ccc' }}>
        {!token ? (
          <>
            <Link to="/login">Вход</Link> | <Link to="/register">Регистрация</Link>
          </>
        ) : (
          <>
            {role === 'candidate' && <Link to="/profile">Моё резюме</Link>}
            {(role === 'hr' || role === 'manager') && <Link to="/dashboard">Кандидаты</Link>}
            {' | '}
            <Link to="/notifications">Уведомления</Link>
            {' | '}
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}>
              Выход
            </button>
          </>
        )}
      </nav>

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
          <PrivateRoute allowedRoles={['candidate', 'hr']}>
            <Notifications />
          </PrivateRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;