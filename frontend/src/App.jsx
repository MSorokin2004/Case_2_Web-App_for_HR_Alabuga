import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import CandidateProfile from './components/CandidateProfile';
import HRDashboard from './components/HRDashboard';
import ResumeDetail from './components/ResumeDetail';
import PrivateRoute from './components/PrivateRoute';
import Notifications from './components/Notifications';

// Внутри Routes:

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
        <Link to="/notifications">Уведомления</Link>
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
    </BrowserRouter>
  );
}

export default App;