import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'candidate' });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      alert('Registered! Please login.');
      window.location.href = '/login';
    } catch (error) {
      alert('Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
      <input name="full_name" placeholder="Full Name" onChange={handleChange} required />
      <select name="role" onChange={handleChange}>
        <option value="candidate">Candidate</option>
        <option value="hr">HR</option>
        <option value="manager">Manager</option>
      </select>
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;