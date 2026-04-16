import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.access_token);
      // Decode token to get role (simplified: fetch user)
      const userResp = await api.get('/auth/me');
      localStorage.setItem('role', userResp.data.role);
      if (userResp.data.role === 'candidate') navigate('/profile');
      else if (userResp.data.role === 'hr') navigate('/dashboard');
      else if (userResp.data.role === 'manager') navigate('/dashboard');
    } catch (error) {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;